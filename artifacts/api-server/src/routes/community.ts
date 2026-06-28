import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityPostsTable, communityPostCommentsTable, businessesTable } from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { storage } from "../storage";
import { getUserTier } from "../middleware/requireMembership";
import { checkContent, redactForLog } from "../lib/contentFilter";
import { scanForFamily } from "../lib/familyFilter";

const router: IRouter = Router();

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
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const posts = authorId
      ? await db.select().from(communityPostsTable).where(eq(communityPostsTable.authorId, authorId)).orderBy(desc(communityPostsTable.createdAt)).limit(limit).offset(offset)
      : await db.select().from(communityPostsTable).orderBy(desc(communityPostsTable.createdAt)).limit(limit).offset(offset);

    let filtered = posts;
    if (category && category !== "all") filtered = filtered.filter((p) => p.category === category);
    if (postType && postType !== "all") filtered = filtered.filter((p) => p.postType === postType);

    res.json({ posts: filtered, total: posts.length, offset, limit });
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
    } = req.body as {
      content?: string;
      category?: string;
      postType?: string;
      businessId?: string;
      businessName?: string;
      businessLink?: string;
      mediaUrls?: string[];
      savedPlaceId?: string;
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
      })
      .returning();

    res.status(201).json({ post });
  } catch (err) {
    req.log.error({ err }, "Failed to create community post");
    res.status(500).json({ error: "Failed to create post" });
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
