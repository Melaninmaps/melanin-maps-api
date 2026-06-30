import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import multer from "multer";
import { db, communityPostsTable, communityPostCommentsTable, businessesTable, pool } from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { storage } from "../storage";
import { getUserTier } from "../middleware/requireMembership";
import { checkContent, redactForLog } from "../lib/contentFilter";
import { scanForFamily } from "../lib/familyFilter";
import { objectStorageClient } from "../lib/objectStorage";

const router: IRouter = Router();

// Tier-based media limits for community posts
const MEDIA_LIMITS: Record<string, { images: number; video: boolean }> = {
  free:        { images: 0, video: false },
  navigator:   { images: 3, video: false },
  trailblazer: { images: 5, video: true  },
};

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("video/"));
  },
});

const AUTHOR_COLORS = ["#3B1F0E", "#2D7A4F", "#C9922B", "#7B4F2E", "#1D4ED8", "#7B2D8B"];

async function resolveAuthorInfo(userId: string): Promise<{ name: string; initials: string; color: string }> {
  const user = await storage.getUser(userId);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Community Member";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "CM";
  const color = AUTHOR_COLORS[Math.floor(Math.random() * AUTHOR_COLORS.length)];
  return { name, initials, color };
}

// GET /community/posts — paginated feed with business enrichment
router.get("/community/posts", async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const postType = typeof req.query.postType === "string" ? req.query.postType : undefined;
    const authorId = typeof req.query.authorId === "string" ? req.query.authorId : undefined;
    const feedMode = typeof req.query.feed === "string" ? req.query.feed : "everyone";
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const viewerId: string | null = req.user?.id ?? null;

    type PostRow = { id: string; author_id: string | null; author_name: string; author_initials: string; author_color: string; content: string; category: string; post_type: string; business_id: string | null; business_name: string | null; business_link: string | null; media_urls: string | null; saved_place_id: string | null; visibility: string; upvotes: number; downvotes: number; comments_count: number; created_at: Date };

    let rows: PostRow[];

    if (authorId) {
      // Profile wall — always use Drizzle for this simple case
      const r = await db.select().from(communityPostsTable)
        .where(eq(communityPostsTable.authorId, authorId))
        .orderBy(desc(communityPostsTable.createdAt)).limit(limit).offset(offset);
      rows = r as unknown as PostRow[];
    } else if (feedMode === "following" && viewerId) {
      // Following feed — posts from people you follow or are connected with
      const result = await pool.query<PostRow>(`
        SELECT cp.* FROM community_posts cp
        WHERE cp.author_id IN (
          SELECT uf.following_id FROM user_follows uf
            WHERE uf.follower_id = $1 AND uf.status = 'accepted'
          UNION
          SELECT CASE WHEN mc.requester_id = $1 THEN mc.recipient_id ELSE mc.requester_id END
            FROM member_connections mc
            WHERE (mc.requester_id = $1 OR mc.recipient_id = $1) AND mc.status = 'accepted'
          UNION SELECT $1
        )
        AND (cp.visibility = 'public' OR cp.visibility = 'followers_only')
        ORDER BY cp.created_at DESC
        LIMIT $2 OFFSET $3
      `, [viewerId, limit, offset]);
      rows = result.rows;
    } else {
      // Everyone feed — public posts from public accounts (+ followed private accounts)
      const followingClause = viewerId
        ? `OR cp.author_id IN (
            SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = '${viewerId}' AND uf.status = 'accepted'
            UNION
            SELECT CASE WHEN mc.requester_id = '${viewerId}' THEN mc.recipient_id ELSE mc.requester_id END
              FROM member_connections mc
              WHERE (mc.requester_id = '${viewerId}' OR mc.recipient_id = '${viewerId}') AND mc.status = 'accepted'
          )
          OR cp.author_id = '${viewerId}'`
        : "";
      const result = await pool.query<PostRow>(`
        SELECT cp.* FROM community_posts cp
        LEFT JOIN users u ON u.id = cp.author_id
        WHERE cp.visibility = 'public'
          AND (
            u.is_private = false OR u.is_private IS NULL OR cp.author_id IS NULL
            ${followingClause}
          )
        ORDER BY cp.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      rows = result.rows;
    }

    // Map snake_case → camelCase to match existing shape
    const posts = rows.map((r) => ({
      id: r.id, authorId: r.author_id, authorName: r.author_name, authorInitials: r.author_initials,
      authorColor: r.author_color, content: r.content, category: r.category, postType: r.post_type,
      businessId: r.business_id, businessName: r.business_name, businessLink: r.business_link,
      mediaUrls: r.media_urls, savedPlaceId: r.saved_place_id, visibility: r.visibility,
      upvotes: r.upvotes, downvotes: r.downvotes, commentsCount: r.comments_count, createdAt: r.created_at,
    }));

    let filtered = posts;
    if (category && category !== "all") filtered = filtered.filter((p) => p.category === category);
    if (postType && postType !== "all") filtered = filtered.filter((p) => p.postType === postType);

    res.json({ posts: filtered, total: filtered.length, offset, limit });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch community posts");
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// POST /community/posts — create community, question, or business post
router.post("/community/posts", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const {
      content,
      category = "general",
      postType = "community",
      businessId,
      businessName: providedBusinessName,
      businessLink,
      mediaUrls,
      savedPlaceId,
      visibility = "public",
    } = req.body as {
      content?: string;
      category?: string;
      postType?: string;
      businessId?: string;
      businessName?: string;
      businessLink?: string;
      mediaUrls?: string[];
      savedPlaceId?: string;
      visibility?: "public" | "followers_only";
    };

    if (!content?.trim()) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    const tier = await getUserTier(req.user.id);

    if (postType === "business") {
      if (tier === "free") {
        res.status(403).json({
          error: "Business posts require an Explorer+ membership. Upgrade to promote your business in the feed.",
          code: "TIER_LIMIT_REACHED",
          upgradeUrl: "/membership",
        });
        return;
      }
    } else {
      if (tier === "free") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(communityPostsTable)
          .where(and(eq(communityPostsTable.authorId, req.user.id), gte(communityPostsTable.createdAt, startOfMonth)));
        if (count >= 5) {
          res.status(403).json({
            error: "Community Members can post up to 5 times per month. Upgrade to Explorer+ for unlimited posts.",
            code: "TIER_LIMIT_REACHED",
            upgradeUrl: "/membership",
          });
          return;
        }
      }
    }

    const filter = checkContent(content);
    if (!filter.ok) {
      req.log.warn({ userId: req.user.id, matched: redactForLog(filter.matched) }, "Community post blocked");
      res.status(422).json({ error: filter.reason, code: "CONTENT_POLICY_VIOLATION" });
      return;
    }
    const familyScan = await scanForFamily(content.trim(), req.user.id, "community_post");
    if (familyScan.blocked) {
      res.status(422).json({ error: "This post contains content that is not permitted.", code: "MINOR_CONTENT_BLOCKED" });
      return;
    }

    const { name, initials, color } = await resolveAuthorInfo(req.user.id);

    // Resolve business name if businessId provided
    let resolvedBusinessName = providedBusinessName ?? null;
    if (businessId && !resolvedBusinessName) {
      const [biz] = await db.select({ name: businessesTable.name }).from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
      resolvedBusinessName = biz?.name ?? null;
    }

    const [post] = await db
      .insert(communityPostsTable)
      .values({
        authorId: req.user.id,
        authorName: name,
        authorInitials: initials,
        authorColor: color,
        content: content.trim(),
        category,
        postType,
        businessId: businessId ?? null,
        businessName: resolvedBusinessName,
        businessLink: businessLink?.trim() ?? null,
        mediaUrls: mediaUrls?.length ? JSON.stringify(mediaUrls) : null,
        savedPlaceId: savedPlaceId ?? null,
        visibility: (visibility === "followers_only" ? "followers_only" : "public") as "public" | "followers_only",
      })
      .returning();

    res.status(201).json({ post });
  } catch (err) {
    req.log.error({ err }, "Failed to create community post");
    res.status(500).json({ error: "Failed to create post" });
  }
});

// POST /community/media/upload/image — upload image for a community post (navigator+)
router.post("/community/media/upload/image", imageUpload.single("image"), async (req: any, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (!req.file) { res.status(400).json({ error: "No image provided" }); return; }
  try {
    const tier = await getUserTier(req.user.id);
    const limits = MEDIA_LIMITS[tier] ?? MEDIA_LIMITS.free;
    if (limits.images === 0) {
      res.status(403).json({ error: "Image uploads require an Explorer+ membership. Upgrade to add photos to your posts.", code: "TIER_LIMIT_REACHED", upgradeUrl: "/membership" });
      return;
    }
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }
    const ext = req.file.originalname.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
    const objectKey = `community-posts/${req.user.id}/${randomUUID()}.${safeExt}`;
    const bucket = objectStorageClient.bucket(bucketId);
    const gcsFile = bucket.file(objectKey);
    await gcsFile.save(req.file.buffer, { contentType: req.file.mimetype });
    await gcsFile.makePublic();
    const url = `https://storage.googleapis.com/${bucketId}/${objectKey}`;
    res.status(201).json({ url, type: "image", maxImages: limits.images });
  } catch (err) {
    req.log.error({ err }, "Failed to upload community post image");
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// POST /community/media/upload/video — upload video for a community post (trailblazer only)
router.post("/community/media/upload/video", videoUpload.single("video"), async (req: any, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (!req.file) { res.status(400).json({ error: "No video provided" }); return; }
  try {
    const tier = await getUserTier(req.user.id);
    const limits = MEDIA_LIMITS[tier] ?? MEDIA_LIMITS.free;
    if (!limits.video) {
      res.status(403).json({ error: "Video uploads in posts require a Trailblazer membership.", code: "TIER_LIMIT_REACHED", upgradeUrl: "/membership" });
      return;
    }
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }
    const objectKey = `community-posts/${req.user.id}/${randomUUID()}.mp4`;
    const bucket = objectStorageClient.bucket(bucketId);
    const gcsFile = bucket.file(objectKey);
    await gcsFile.save(req.file.buffer, { contentType: req.file.mimetype });
    await gcsFile.makePublic();
    const url = `https://storage.googleapis.com/${bucketId}/${objectKey}`;
    res.status(201).json({ url, type: "video" });
  } catch (err) {
    req.log.error({ err }, "Failed to upload community post video");
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// POST /community/posts/:id/vote
router.post("/community/posts/:id/vote", async (req: Request, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const { direction } = req.body as { direction: "up" | "down" };
    if (!["up", "down"].includes(direction)) {
      res.status(400).json({ error: "direction must be 'up' or 'down'" });
      return;
    }
    const col = direction === "up" ? communityPostsTable.upvotes : communityPostsTable.downvotes;
    const [post] = await db
      .update(communityPostsTable)
      .set({ [direction === "up" ? "upvotes" : "downvotes"]: sql`${col} + 1` })
      .where(eq(communityPostsTable.id, id))
      .returning();
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json({ post });
  } catch (err) {
    req.log.error({ err }, "Failed to vote on post");
    res.status(500).json({ error: "Failed to vote" });
  }
});

// GET /community/posts/:id/comments
router.get("/community/posts/:id/comments", async (req: Request, res: Response) => {
  try {
    const postId = req.params["id"] as string;
    const comments = await db
      .select()
      .from(communityPostCommentsTable)
      .where(eq(communityPostCommentsTable.postId, postId))
      .orderBy(desc(communityPostCommentsTable.createdAt))
      .limit(100);
    res.json({ comments });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch comments");
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /community/posts/:id/comments
router.post("/community/posts/:id/comments", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const postId = req.params["id"] as string;
    const { content } = req.body as { content?: string };
    if (!content?.trim()) {
      res.status(400).json({ error: "content is required" });
      return;
    }
    const filter = checkContent(content);
    if (!filter.ok) {
      res.status(422).json({ error: filter.reason, code: "CONTENT_POLICY_VIOLATION" });
      return;
    }
    const { name, initials, color } = await resolveAuthorInfo(req.user.id);
    const [comment] = await db
      .insert(communityPostCommentsTable)
      .values({ postId, authorId: req.user.id, authorName: name, authorInitials: initials, authorColor: color, content: content.trim() })
      .returning();
    await db
      .update(communityPostsTable)
      .set({ commentsCount: sql`${communityPostsTable.commentsCount} + 1` })
      .where(eq(communityPostsTable.id, postId));
    res.status(201).json({ comment });
  } catch (err) {
    req.log.error({ err }, "Failed to add comment");
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// DELETE /community/posts/:id
router.delete("/community/posts/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const postId = req.params["id"] as string;
    const [deleted] = await db
      .delete(communityPostsTable)
      .where(and(eq(communityPostsTable.id, postId), eq(communityPostsTable.authorId, req.user.id)))
      .returning({ id: communityPostsTable.id });
    if (!deleted) { res.status(404).json({ error: "Post not found or not yours" }); return; }
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete post");
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
