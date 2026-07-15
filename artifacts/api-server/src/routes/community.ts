import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import multer from "multer";
import { db, communityPostsTable, communityPostCommentsTable, businessesTable, pool, userPreferencesTable, usersTable, threadReadsTable, communityPlacesTable } from "@workspace/db";
import { extractHashtags, upsertHashtags } from "./hashtags";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { storage } from "../storage";
import { getUserTier } from "../middleware/requireMembership";
import { checkContent, redactForLog } from "../lib/contentFilter";
import { scanForFamily } from "../lib/familyFilter";
import { objectStorageClient } from "../lib/objectStorage";
import { screenImageUrl } from "../lib/contentScreen";
import { sendPushToUser } from "../lib/pushNotifications";

const router: IRouter = Router();

// Monthly media limits per membership tier
// videoMonthly: max video posts per calendar month (enforced at upload time)
const MEDIA_LIMITS: Record<string, { images: number; videoMonthly: number }> = {
  free:              { images: 0,  videoMonthly: 3   }, // Community — try the platform
  navigator:         { images: 3,  videoMonthly: 10  }, // Explorer
  trailblazer:       { images: 5,  videoMonthly: 25  }, // Advocate
  community_builder: { images: 8,  videoMonthly: 75  }, // Creator
  legacy_member:     { images: 10, videoMonthly: 200 }, // Premium Creator
};

const VIDEO_TIER_TABLE = [
  { tier: "free",              label: "Community",       videoMonthly: 3   },
  { tier: "navigator",         label: "Explorer",        videoMonthly: 10  },
  { tier: "trailblazer",       label: "Advocate",        videoMonthly: 25  },
  { tier: "community_builder", label: "Creator",         videoMonthly: 75  },
  { tier: "legacy_member",     label: "Premium Creator", videoMonthly: 200 },
];

// Split long content into thread segments at natural sentence boundaries
// 300 words per segment — a full, complete thought per post
function splitIntoThread(content: string, maxWords = 300): string[] {
  const words = content.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [content.trim()];

  const segments: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    if (end >= words.length) {
      segments.push(words.slice(start).join(" "));
      break;
    }
    // Scan backwards to find a sentence boundary (., !, ?)
    let splitAt = end;
    for (let i = end - 1; i >= start + Math.floor(maxWords * 0.65); i--) {
      if (/[.!?]["']?$/.test(words[i] ?? "")) {
        splitAt = i + 1;
        break;
      }
    }
    segments.push(words.slice(start, splitAt).join(" "));
    start = splitAt;
  }

  return segments.filter(Boolean);
}

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

    type PostRow = { id: string; author_id: string | null; author_name: string; author_initials: string; author_color: string; content: string; category: string; post_type: string; business_id: string | null; business_name: string | null; business_link: string | null; media_urls: string | null; saved_place_id: string | null; location_tag: string | null; location_type: string | null; topic_tag: string | null; is_private_topic: boolean; visibility: string; has_content_warning: boolean; content_warning_type: string | null; audience_rating: string; rating_reason: string | null; upvotes: number; downvotes: number; comments_count: number; created_at: Date };

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
        AND (cp.requires_moderation = false OR cp.author_id = $1)
        ORDER BY cp.created_at DESC
        LIMIT $2 OFFSET $3
      `, [viewerId, limit, offset]);
      rows = result.rows;
    } else if (feedMode === "foryou" && viewerId) {
      // For You — personalized feed scored by interests + follows + recency + engagement
      // 1. Fetch a wide window of public posts (3× the limit so we have enough to score)
      const poolSize = Math.min(limit * 4, 300);
      const [rawResult, prefsResult, followsResult] = await Promise.all([
        pool.query<PostRow>(`
          SELECT cp.* FROM community_posts cp
          LEFT JOIN users u ON u.id = cp.author_id
          WHERE cp.visibility = 'public'
            AND (u.is_private = false OR u.is_private IS NULL OR cp.author_id IS NULL)
            AND cp.created_at > NOW() - INTERVAL '30 days'
            AND cp.requires_moderation = false
          ORDER BY cp.created_at DESC
          LIMIT $1
        `, [poolSize]),
        db.select().from(userPreferencesTable).where(eq(userPreferencesTable.userId, viewerId)).limit(1),
        pool.query<{ following_id: string }>(`
          SELECT following_id FROM user_follows WHERE follower_id = $1 AND status = 'accepted'
          UNION
          SELECT CASE WHEN mc.requester_id = $1 THEN mc.recipient_id ELSE mc.requester_id END
            FROM member_connections mc
            WHERE (mc.requester_id = $1 OR mc.recipient_id = $1) AND mc.status = 'accepted'
        `, [viewerId]),
      ]);

      const prefs = prefsResult[0];
      const followedIds = new Set(followsResult.rows.map((r) => r.following_id));

      // Interest keyword sets (lowercased for matching)
      const favCats    = new Set((prefs?.favoriteCategories  ?? []).map((s: string) => s.toLowerCase()));
      const cultInts   = new Set((prefs?.culturalInterests   ?? []).map((s: string) => s.toLowerCase()));
      const lifestyles = new Set((prefs?.lifestyleServices   ?? []).map((s: string) => s.toLowerCase()));
      const favCities  = new Set((prefs?.favoriteCities      ?? []).map((s: string) => s.toLowerCase()));

      const now = Date.now();

      const scored = rawResult.rows.map((row) => {
        let score = 0;

        // Follow boost — strongest signal
        if (row.author_id && (followedIds.has(row.author_id) || row.author_id === viewerId)) score += 10;

        // Interest matching — topic/category
        const topic    = (row.topic_tag  ?? "").toLowerCase();
        const category = (row.category   ?? "").toLowerCase();
        const location = (row.location_tag ?? "").toLowerCase();

        if (favCats.has(category) || favCats.has(topic))    score += 5;
        if (cultInts.has(category) || cultInts.has(topic))  score += 4;
        if (lifestyles.has(category) || lifestyles.has(topic)) score += 3;
        if (location && favCities.has(location))             score += 3;

        // Media signal — richer content
        if (row.media_urls) score += 1;

        // Recency decay
        const ageMs = now - new Date(row.created_at).getTime();
        const ageH  = ageMs / 3_600_000;
        if      (ageH < 1)   score += 8;
        else if (ageH < 6)   score += 6;
        else if (ageH < 24)  score += 4;
        else if (ageH < 72)  score += 2;
        else if (ageH < 168) score += 1;

        // Engagement signal
        score += Math.log1p((row.upvotes ?? 0) + (row.comments_count ?? 0) * 2) * 2;

        return { row, score };
      });

      scored.sort((a, b) => b.score - a.score);
      rows = scored.slice(offset, offset + limit).map((s) => s.row);
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
          AND cp.requires_moderation = false
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
    const posts = rows.map((r: any) => ({
      id: r.id, authorId: r.author_id, authorName: r.author_name, authorInitials: r.author_initials,
      authorColor: r.author_color, content: r.content, category: r.category, postType: r.post_type,
      businessId: r.business_id, businessName: r.business_name, businessLink: r.business_link,
      mediaUrls: r.media_urls, savedPlaceId: r.saved_place_id,
      locationTag: r.location_tag, locationVenueName: (r as any).location_venue_name ?? null,
      locationCity: (r as any).location_city ?? null, locationCountry: (r as any).location_country ?? null,
      locationPlaceId: (r as any).location_place_id ?? null, locationType: r.location_type,
      hashtags: (r as any).hashtags ?? null,
      topicTag: r.topic_tag, isPrivateTopic: r.is_private_topic,
      visibility: r.visibility,
      hasContentWarning: r.has_content_warning ?? false,
      contentWarningType: r.content_warning_type ?? null,
      audienceRating: r.audience_rating ?? "everyone",
      ratingReason: r.rating_reason ?? null,
      linkUrl: r.link_url ?? null,
      linkTitle: r.link_title ?? null,
      linkDescription: r.link_description ?? null,
      linkDomain: r.link_domain ?? null,
      linkFavicon: r.link_favicon ?? null,
      repostId: r.repost_id ?? null,
      repostAuthorName: r.repost_author_name ?? null,
      repostAuthorInitials: r.repost_author_initials ?? null,
      repostContent: r.repost_content ?? null,
      mentionedBusinessId: r.mentioned_business_id ?? (r as any).mentionedBusinessId ?? null,
      mentionedBusinessName: r.mentioned_business_name ?? (r as any).mentionedBusinessName ?? null,
      mentionedBusinessTag: r.mentioned_business_tag ?? (r as any).mentionedBusinessTag ?? null,
      mentionedBusinessRating: r.mentioned_business_rating ?? (r as any).mentionedBusinessRating ?? null,
      upvotes: r.upvotes, downvotes: r.downvotes, commentsCount: r.comments_count,
      threadId: r.thread_id ?? null, threadPosition: r.thread_position ?? 1, threadTotal: r.thread_total ?? 1,
      createdAt: r.created_at,
    }));

    const locationTagFilter = typeof req.query.locationTag === "string" ? req.query.locationTag : undefined;
    const topicTagFilter = typeof req.query.topicTag === "string" ? req.query.topicTag : undefined;
    const businessIdFilter = typeof req.query.businessId === "string" ? req.query.businessId : undefined;
    let filtered = posts;
    if (category && category !== "all") filtered = filtered.filter((p) => p.category === category);
    if (postType && postType !== "all") filtered = filtered.filter((p) => p.postType === postType);
    if (locationTagFilter) filtered = filtered.filter((p) => (p.locationTag as string | null | undefined)?.toLowerCase() === locationTagFilter.toLowerCase());
    if (topicTagFilter) filtered = filtered.filter((p) => (p.topicTag as string | null | undefined)?.toLowerCase() === topicTagFilter.toLowerCase());
    if (businessIdFilter) filtered = filtered.filter((p) => p.businessId === businessIdFilter);
    const hashtagFilter = typeof req.query.hashtag === "string" ? req.query.hashtag.toLowerCase().replace(/^#/, "") : undefined;
    if (hashtagFilter) filtered = filtered.filter((p) => Array.isArray((p as any).hashtags) && (p as any).hashtags.includes(hashtagFilter));

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
      locationTag,
      locationVenueName,
      locationCity,
      locationCountry,
      locationLat,
      locationLng,
      locationPlaceId,
      locationType,
      topicTag,
      isPrivateTopic = false,
      hasContentWarning = false,
      contentWarningType,
      audienceRating = "everyone",
      ratingReason,
      linkUrl,
      linkTitle,
      linkDescription,
      linkDomain,
      linkFavicon,
      repostId,
      repostAuthorName,
      repostAuthorInitials,
      repostContent,
      mentionedBusinessId,
      mentionedBusinessTag,
      mentionedBusinessRating,
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
      locationTag?: string;
      locationVenueName?: string;
      locationCity?: string;
      locationCountry?: string;
      locationLat?: number;
      locationLng?: number;
      locationPlaceId?: string;
      locationType?: string;
      topicTag?: string;
      isPrivateTopic?: boolean;
      hasContentWarning?: boolean;
      contentWarningType?: string;
      audienceRating?: string;
      ratingReason?: string;
      linkUrl?: string;
      linkTitle?: string;
      linkDescription?: string;
      linkDomain?: string;
      linkFavicon?: string;
      repostId?: string;
      repostAuthorName?: string;
      repostAuthorInitials?: string;
      repostContent?: string;
      mentionedBusinessId?: string;
      mentionedBusinessTag?: string;
      mentionedBusinessRating?: number;
    };

    if (!content?.trim()) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    // Extract hashtags from content
    const extractedHashtags = extractHashtags(content.trim());
    upsertHashtags(extractedHashtags).catch(() => {});

    // Auto-create or increment community place when a location is tagged
    let resolvedPlaceId = locationPlaceId ?? null;
    if (locationTag?.trim() && !resolvedPlaceId) {
      try {
        const existing = await db.select({ id: communityPlacesTable.id })
          .from(communityPlacesTable)
          .where(eq(communityPlacesTable.name, locationTag.trim()))
          .limit(1);
        if (existing[0]) {
          resolvedPlaceId = existing[0].id;
          await db.update(communityPlacesTable)
            .set({ postCount: sql`${communityPlacesTable.postCount} + 1` })
            .where(eq(communityPlacesTable.id, existing[0].id));
        } else {
          const [newPlace] = await db.insert(communityPlacesTable).values({
            name: locationTag.trim(),
            venueName: locationVenueName?.trim() || null,
            city: locationCity?.trim() || null,
            country: locationCountry?.trim() || "United States",
            lat: locationLat ? String(locationLat) : null,
            lng: locationLng ? String(locationLng) : null,
            addedByUserId: req.user.id,
            postCount: 1,
          }).returning({ id: communityPlacesTable.id });
          resolvedPlaceId = newPlace?.id ?? null;
        }
      } catch { /* non-fatal */ }
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

    // ── Business mention stance validation ──────────────────────────────────────
    const VALID_MENTION_TAGS = ["community_favorite", "hidden_gem", "supporting_local", "visited_loved"];
    let mentionedBizName: string | null = null;
    let mentionedBizOwnerId: string | null = null;
    if (mentionedBusinessId) {
      const hasValidTag = mentionedBusinessTag && VALID_MENTION_TAGS.includes(mentionedBusinessTag);
      const hasValidRating = typeof mentionedBusinessRating === "number" && mentionedBusinessRating >= 3 && mentionedBusinessRating <= 5;
      if (!hasValidTag && !hasValidRating) {
        res.status(400).json({
          error: "When mentioning a business, please attach a community stance tag or a rating of 3 stars or more.",
          code: "BUSINESS_MENTION_STANCE_REQUIRED",
        });
        return;
      }
      // Pre-fetch business details for denormalized storage + notification
      const [mb] = await db
        .select({ name: businessesTable.name, submittedById: businessesTable.submittedById })
        .from(businessesTable)
        .where(eq(businessesTable.id, mentionedBusinessId))
        .limit(1);
      mentionedBizName = mb?.name ?? null;
      mentionedBizOwnerId = mb?.submittedById ?? null;
    }

    // ── Determine moderation tier and trust level ─────────────────────────────
    const [userRow] = await db
      .select({ createdAt: usersTable.createdAt, memberType: usersTable.memberType, trustLevel: usersTable.trustLevel })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    const accountCreatedAt = userRow?.createdAt ? new Date(userRow.createdAt) : new Date();
    const accountAgeDays = (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24);

    const [totalPostsRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityPostsTable)
      .where(eq(communityPostsTable.authorId, req.user.id));
    const totalPosts = totalPostsRow?.count ?? 0;

    const isNewMember = accountAgeDays < 30 && totalPosts < 5;
    const TRUSTED_MEMBER_TYPES = ["navigator", "trailblazer", "legacy_member", "founding", "community_builder"];
    const isTrustedAuthor =
      (userRow?.memberType != null && TRUSTED_MEMBER_TYPES.includes(userRow.memberType)) ||
      (userRow?.trustLevel ?? 1) >= 3;

    // New members who @mention a business go into the moderation queue
    const requiresModeration = isNewMember && !!mentionedBusinessId;

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

    // Resolve business name + ownership if businessId provided
    let resolvedBusinessName = providedBusinessName ?? null;
    let resolvedBusinessBlackOwned: boolean | null = null;
    let resolvedBusinessCity: string | null = null;
    let resolvedBusinessCategory: string | null = null;
    if (businessId) {
      const [biz] = await db
        .select({ name: businessesTable.name, blackOwned: businessesTable.blackOwned, city: businessesTable.city, category: businessesTable.category })
        .from(businessesTable)
        .where(eq(businessesTable.id, businessId))
        .limit(1);
      resolvedBusinessName = resolvedBusinessName ?? biz?.name ?? null;
      resolvedBusinessBlackOwned = biz?.blackOwned ?? null;
      resolvedBusinessCity = biz?.city ?? null;
      resolvedBusinessCategory = biz?.category ?? null;
    }

    // Split content into thread segments if it exceeds 300 words
    const segments = splitIntoThread(content.trim());
    const threadId = segments.length > 1 ? randomUUID() : null;
    const postAuthorId = req.user.id; // capture before map callback (TS narrowing)

    const visValue = (isPrivateTopic ? "followers_only" : visibility === "followers_only" ? "followers_only" : "public") as "public" | "followers_only";
    const safeRating = (["everyone", "teen", "young_adult", "adult"].includes(audienceRating) ? audienceRating : "everyone") as "everyone" | "teen" | "young_adult" | "adult";

    const rowsToInsert = segments.map((seg, i) => ({
      authorId: postAuthorId,
      authorName: name,
      authorInitials: initials,
      authorColor: color,
      content: seg,
      category,
      postType,
      businessId: businessId ?? null,
      businessName: resolvedBusinessName,
      businessLink: businessLink?.trim() ?? null,
      mediaUrls: (i === 0 && mediaUrls?.length) ? JSON.stringify(mediaUrls) : null,
      savedPlaceId: savedPlaceId ?? null,
      locationTag: locationTag?.trim() || null,
      locationVenueName: locationVenueName?.trim() || null,
      locationCity: locationCity?.trim() || null,
      locationCountry: locationCountry?.trim() || null,
      locationLat: locationLat ? String(locationLat) : null,
      locationLng: locationLng ? String(locationLng) : null,
      locationPlaceId: resolvedPlaceId,
      locationType: locationTag?.trim() ? (locationType ?? "city") : null,
      hashtags: extractedHashtags.length ? extractedHashtags.map((t) => t.replace(/^#/, "")) : null,
      topicTag: topicTag?.trim() || null,
      isPrivateTopic: !!isPrivateTopic,
      visibility: visValue,
      hasContentWarning: !!hasContentWarning,
      contentWarningType: hasContentWarning && contentWarningType ? contentWarningType : null,
      audienceRating: safeRating,
      ratingReason: ratingReason?.trim().slice(0, 200) || null,
      linkUrl: i === 0 ? (linkUrl?.trim() || null) : null,
      linkTitle: i === 0 ? (linkTitle?.trim() || null) : null,
      linkDescription: i === 0 ? (linkDescription?.trim() || null) : null,
      linkDomain: i === 0 ? (linkDomain?.trim() || null) : null,
      linkFavicon: i === 0 ? (linkFavicon?.trim() || null) : null,
      repostId: i === 0 ? (repostId || null) : null,
      repostAuthorName: i === 0 ? (repostAuthorName?.trim() || null) : null,
      repostAuthorInitials: i === 0 ? (repostAuthorInitials?.trim() || null) : null,
      repostContent: i === 0 ? (repostContent?.trim() || null) : null,
      mentionedBusinessId: i === 0 ? (mentionedBusinessId ?? null) : null,
      mentionedBusinessName: i === 0 ? mentionedBizName : null,
      mentionedBusinessTag: (i === 0 && mentionedBusinessId && mentionedBusinessTag && VALID_MENTION_TAGS.includes(mentionedBusinessTag)) ? mentionedBusinessTag : null,
      mentionedBusinessRating: (i === 0 && mentionedBusinessId && typeof mentionedBusinessRating === "number" && mentionedBusinessRating >= 3) ? mentionedBusinessRating : null,
      requiresModeration: i === 0 ? requiresModeration : false,
      isTrustedAuthor,
      threadId,
      threadPosition: i + 1,
      threadTotal: segments.length,
    }));

    const insertedPosts = await db.insert(communityPostsTable).values(rowsToInsert).returning();
    const post = insertedPosts[0]!;

    // ── Notify business owner when their business is @mentioned ──────────────
    if (mentionedBusinessId && post && mentionedBizOwnerId && mentionedBizOwnerId !== req.user.id) {
      const tagLabel = mentionedBusinessTag === "community_favorite" ? "Community Favorite"
        : mentionedBusinessTag === "hidden_gem" ? "Hidden Gem"
        : mentionedBusinessTag === "supporting_local" ? "Supporting Local"
        : mentionedBusinessTag === "visited_loved" ? "Visited & Loved"
        : mentionedBusinessRating ? `${mentionedBusinessRating}-star rating`
        : "mentioned";
      sendPushToUser(mentionedBizOwnerId, {
        title: "Your business was mentioned! 🎉",
        body: `${post.authorName} tagged ${mentionedBizName ?? "your business"} as "${tagLabel}" in the community feed.`,
        data: { screen: "business", id: mentionedBusinessId },
      }).catch(() => {});
    }

    // ── Notify @mentioned users ──────────────────────────────────────────────
    const mentionedUserIds: string[] = Array.isArray((req.body as any).mentionedUserIds)
      ? ((req.body as any).mentionedUserIds as unknown[])
          .filter((id): id is string => typeof id === "string" && id !== req.user?.id)
          .slice(0, 10)
      : [];
    if (mentionedUserIds.length > 0 && post) {
      for (const uid of mentionedUserIds) {
        sendPushToUser(uid, {
          title: `${post.authorName} mentioned you`,
          body: post.content.slice(0, 100),
          data: { screen: "community", postId: post.id },
        }).catch(() => {});
      }
    }

    // ── KinfolkAI: suggest Black-owned alternatives when post is negative + business is non-minority ──
    const NEGATIVE_KEYWORDS = [
      "racist", "racism", "discrimination", "discriminated", "profiled", "prejudice",
      "bias", "biased", "rude", "mistreated", "ignored", "disrespected", "unwelcoming",
      "hostile", "bad experience", "terrible", "awful", "horrible", "worst",
      "never again", "never going back", "scam", "scammed", "poor service",
      "offensive", "uncomfortable", "threatening", "harassed", "harassment",
      "treated badly", "felt unsafe", "felt uncomfortable",
    ];
    const isNegative = NEGATIVE_KEYWORDS.some((kw) => content.toLowerCase().includes(kw));

    let kinfolkSuggestions: Array<{ id: string; name: string; category: string; city: string; rating: string; imageUrl: string | null; description: string }> = [];

    if (isNegative) {
      // Determine if the mentioned business is non-minority-owned
      const isNonMinority =
        resolvedBusinessBlackOwned === false || // In-DB business confirmed non-black-owned
        (resolvedBusinessBlackOwned === null && (!!providedBusinessName || !!businessLink)); // External business

      const searchCity = resolvedBusinessCity ?? locationTag ?? null;

      if (isNonMinority && searchCity) {
        const whereClause = resolvedBusinessCategory
          ? and(eq(businessesTable.blackOwned, true), sql`lower(${businessesTable.city}) = lower(${searchCity})`, eq(businessesTable.category, resolvedBusinessCategory))
          : and(eq(businessesTable.blackOwned, true), sql`lower(${businessesTable.city}) = lower(${searchCity})`);

        const alts = await db
          .select({
            id: businessesTable.id,
            name: businessesTable.name,
            category: businessesTable.category,
            city: businessesTable.city,
            rating: businessesTable.rating,
            imageUrl: businessesTable.imageUrl,
            description: businessesTable.description,
          })
          .from(businessesTable)
          .where(whereClause)
          .orderBy(sql`${businessesTable.rating}::numeric DESC, ${businessesTable.confidenceScore} DESC`)
          .limit(3);

        // If no matches by category, fall back to any category in the city
        if (alts.length === 0 && resolvedBusinessCategory) {
          const fallback = await db
            .select({
              id: businessesTable.id,
              name: businessesTable.name,
              category: businessesTable.category,
              city: businessesTable.city,
              rating: businessesTable.rating,
              imageUrl: businessesTable.imageUrl,
              description: businessesTable.description,
            })
            .from(businessesTable)
            .where(and(eq(businessesTable.blackOwned, true), sql`lower(${businessesTable.city}) = lower(${searchCity})`))
            .orderBy(sql`${businessesTable.rating}::numeric DESC, ${businessesTable.confidenceScore} DESC`)
            .limit(3);
          kinfolkSuggestions = fallback;
        } else {
          kinfolkSuggestions = alts;
        }
      }
    }

    res.status(201).json({ post, ...(kinfolkSuggestions.length ? { kinfolkSuggestions } : {}) });
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
    const screen = await screenImageUrl(url);
    res.status(201).json({
      url,
      type: "image",
      maxImages: limits.images,
      isGraphic: screen.isGraphic,
      warningType: screen.warningType,
      warningLabel: screen.warningLabel,
    });
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
    const videoMonthlyLimit = limits.videoMonthly ?? 0;
    if (videoMonthlyLimit === 0) {
      res.status(403).json({ error: "Video uploads require a membership upgrade.", code: "TIER_LIMIT_REACHED", upgradeUrl: "/membership" });
      return;
    }
    // Enforce monthly video quota — count video-bearing posts this calendar month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { rows: [quotaRow] } = await pool.query<{ video_count: string }>(
      `SELECT COUNT(*)::int AS video_count FROM community_posts
       WHERE author_id = $1 AND created_at >= $2 AND media_urls LIKE '%mp4%'`,
      [req.user.id, monthStart]
    );
    const usedThisMonth = Number(quotaRow?.video_count) || 0;
    if (usedThisMonth >= videoMonthlyLimit) {
      const nextMonth = new Date(monthStart);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const tierEntry = VIDEO_TIER_TABLE.find((t) => t.tier === tier);
      res.status(403).json({
        error: `You've used all ${videoMonthlyLimit} video posts for this month. Quota resets ${nextMonth.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`,
        code: "VIDEO_QUOTA_REACHED",
        used: usedThisMonth,
        limit: videoMonthlyLimit,
        tierLabel: tierEntry?.label ?? "Current Plan",
        resetDate: nextMonth.toISOString(),
        upgradeUrl: "/membership",
      });
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
    res.status(201).json({
      url,
      type: "video",
      isGraphic: true,
      warningType: "other",
      warningLabel: "Video Content",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to upload community post video");
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// POST /community/posts/:id/vote
router.post("/community/posts/:id/vote", async (req: Request, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const voterId = req.user?.id as string | undefined;
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

    // Send push notification to post author on upvote (but not if they liked their own post)
    if (direction === "up" && post.authorId && post.authorId !== voterId) {
      const preview = post.content.length > 60 ? post.content.slice(0, 60) + "…" : post.content;
      sendPushToUser(post.authorId, {
        title: "Someone liked your post 👍🏾",
        body: preview,
        data: { screen: "community", postId: id },
      }).catch(() => {});
    }

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
    const [[comment], [updatedPost]] = await Promise.all([
      db
        .insert(communityPostCommentsTable)
        .values({ postId, authorId: req.user.id, authorName: name, authorInitials: initials, authorColor: color, content: content.trim() })
        .returning(),
      db
        .update(communityPostsTable)
        .set({ commentsCount: sql`${communityPostsTable.commentsCount} + 1` })
        .where(eq(communityPostsTable.id, postId))
        .returning({ authorId: communityPostsTable.authorId }),
    ]);

    // Notify post author when someone else comments
    if (updatedPost?.authorId && updatedPost.authorId !== req.user.id) {
      const preview = content.trim().length > 60 ? content.trim().slice(0, 60) + "…" : content.trim();
      sendPushToUser(updatedPost.authorId, {
        title: `${name} replied to your post 💬`,
        body: preview,
        data: { screen: "community", postId },
      }).catch(() => {});
    }

    res.status(201).json({ comment });
  } catch (err) {
    req.log.error({ err }, "Failed to add comment");
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// PATCH /community/posts/:id — author can edit content (text only)
router.patch("/community/posts/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    const postId = req.params["id"] as string;
    const { content } = req.body as { content?: string };
    if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }
    if (content.trim().length > 10000) { res.status(400).json({ error: "Post is too long" }); return; }

    const filter = checkContent(content);
    if (!filter.ok) {
      res.status(422).json({ error: filter.reason, code: "CONTENT_POLICY_VIOLATION" });
      return;
    }

    const [post] = await db
      .update(communityPostsTable)
      .set({ content: content.trim() })
      .where(and(eq(communityPostsTable.id, postId), eq(communityPostsTable.authorId, req.user.id)))
      .returning();

    if (!post) { res.status(404).json({ error: "Post not found or not yours" }); return; }
    res.json({ post });
  } catch (err) {
    req.log.error({ err }, "Failed to edit community post");
    res.status(500).json({ error: "Failed to edit post" });
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

// GET /community/video-quota — user's monthly video usage + tier limit
router.get("/community/video-quota", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const tier = await getUserTier(req.user.id);
    const limits = MEDIA_LIMITS[tier] ?? MEDIA_LIMITS.free;
    const tierEntry = VIDEO_TIER_TABLE.find((t) => t.tier === tier);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { rows: [row] } = await pool.query<{ video_count: string }>(
      `SELECT COUNT(*)::int AS video_count FROM community_posts
       WHERE author_id = $1 AND created_at >= $2 AND media_urls LIKE '%mp4%'`,
      [req.user.id, monthStart]
    );
    const used = Number(row?.video_count) || 0;

    res.json({
      used,
      limit: limits.videoMonthly,
      remaining: Math.max(0, limits.videoMonthly - used),
      tierLabel: tierEntry?.label ?? "Current Plan",
      resetDate: nextMonth.toISOString(),
      tierTable: VIDEO_TIER_TABLE,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch video quota");
    res.status(500).json({ error: "Failed to fetch quota" });
  }
});

// POST /community/posts/:id/read — mark a thread segment as read (fire-and-forget analytics)
router.post("/community/posts/:id/read", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.json({ ok: true }); return; }
  try {
    const postId = String(req.params["id"]);
    await pool.query(
      `INSERT INTO thread_reads (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user.id, postId]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to mark thread segment as read");
    res.json({ ok: true }); // non-critical — never fail the client
  }
});

// GET /community/thread/:threadId — all segments of a thread in order + engagement stats for author
router.get("/community/thread/:threadId", async (req: Request, res: Response) => {
  try {
    const threadId = String(req.params["threadId"]);
    const viewerId = req.user?.id ?? null;

    const posts = await db
      .select()
      .from(communityPostsTable)
      .where(eq(communityPostsTable.threadId, threadId))
      .orderBy(communityPostsTable.threadPosition);

    if (!posts.length) { res.status(404).json({ error: "Thread not found" }); return; }

    const totalSegments = posts.length;

    // Engagement stats — only computed for the author
    let statsPayload: { totalReaders: number; completionReaders: number; completionRate: number } | undefined;
    const isAuthor = viewerId && posts[0]?.authorId === viewerId;
    let suggestVideoUpgrade = false;

    if (isAuthor) {
      const { rows } = await pool.query<{ total_readers: string; completion_readers: string }>(
        `SELECT
           COUNT(DISTINCT tr.user_id) AS total_readers,
           COUNT(DISTINCT CASE WHEN rpu.cnt = $2 THEN rpu.user_id END) AS completion_readers
         FROM thread_reads tr
         JOIN community_posts cp ON cp.id = tr.post_id AND cp.thread_id = $1
         LEFT JOIN (
           SELECT tr2.user_id, COUNT(*) AS cnt FROM thread_reads tr2
           JOIN community_posts cp2 ON cp2.id = tr2.post_id
           WHERE cp2.thread_id = $1
           GROUP BY tr2.user_id
         ) rpu ON rpu.user_id = tr.user_id`,
        [threadId, totalSegments]
      );
      const totalReaders = Number(rows[0]?.total_readers) || 0;
      const completionReaders = Number(rows[0]?.completion_readers) || 0;
      const completionRate = totalReaders > 0 ? completionReaders / totalReaders : 0;
      statsPayload = { totalReaders, completionReaders, completionRate: Math.round(completionRate * 100) };
      // Suggest video upgrade when 10+ people read the whole thread at 70%+ completion rate
      suggestVideoUpgrade = completionReaders >= 10 && completionRate >= 0.7;
    }

    res.json({ posts, threadId, totalSegments, stats: statsPayload, suggestVideoUpgrade });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch thread");
    res.status(500).json({ error: "Failed to fetch thread" });
  }
});

export default router;
