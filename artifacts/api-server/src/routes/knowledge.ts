import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { type Request, type Response, Router } from "express";
import { db } from "@workspace/db";
import {
  expertFollowsTable,
  expertProfilesTable,
  knowledgeArticlesTable,
  knowledgeArticleReadsTable,
  knowledgeBookmarksTable,
  knowledgeTopicsTable,
  userTopicFollowsTable,
  usersTable,
} from "@workspace/db";

const router = Router();

// ─── GET /knowledge/categories ───────────────────────────────────────────────
export const KNOWLEDGE_CATEGORIES = [
  { id: "health",     label: "Health",     emoji: "🩺", color: "#DC2626" },
  { id: "travel",     label: "Travel",     emoji: "✈️", color: "#2563EB" },
  { id: "relocation", label: "Relocation", emoji: "🏡", color: "#16A34A" },
  { id: "careers",    label: "Careers",    emoji: "💼", color: "#059669" },
  { id: "money",      label: "Money",      emoji: "💰", color: "#D97706" },
  { id: "history",    label: "History",    emoji: "🏛️",  color: "#7C3AED" },
  { id: "education",  label: "Education",  emoji: "🎓", color: "#0891B2" },
  { id: "food",       label: "Food",       emoji: "👨🏾‍🍳", color: "#EA580C" },
  { id: "culture",    label: "Culture",    emoji: "🎉", color: "#DB2777" },
  { id: "wellness",   label: "Wellness",   emoji: "🧠", color: "#6D28D9" },
] as const;

router.get("/knowledge/categories", (_req: Request, res: Response) => {
  res.json({ categories: KNOWLEDGE_CATEGORIES });
});

// ─── GET /api/knowledge/articles ─────────────────────────────────────────────
router.get("/knowledge/articles", async (req: Request, res: Response) => {
  const { category, tier, featured, search, limit = "20", offset = "0" } =
    req.query as Record<string, string>;

  try {
    let query = db
      .select({
        id: knowledgeArticlesTable.id,
        title: knowledgeArticlesTable.title,
        slug: knowledgeArticlesTable.slug,
        summary: knowledgeArticlesTable.summary,
        category: knowledgeArticlesTable.category,
        subcategory: knowledgeArticlesTable.subcategory,
        tier: knowledgeArticlesTable.tier,
        authorName: knowledgeArticlesTable.authorName,
        authorBadge: knowledgeArticlesTable.authorBadge,
        authorAvatar: knowledgeArticlesTable.authorAvatar,
        imageUrl: knowledgeArticlesTable.imageUrl,
        readTimeMinutes: knowledgeArticlesTable.readTimeMinutes,
        featured: knowledgeArticlesTable.featured,
        viewCount: knowledgeArticlesTable.viewCount,
        publishedAt: knowledgeArticlesTable.publishedAt,
      })
      .from(knowledgeArticlesTable)
      .$dynamic();

    const conditions = [eq(knowledgeArticlesTable.status, "published")];
    if (category) conditions.push(eq(knowledgeArticlesTable.category, category));
    if (tier) conditions.push(eq(knowledgeArticlesTable.tier, tier));
    if (featured === "true") conditions.push(eq(knowledgeArticlesTable.featured, true));
    if (search) {
      conditions.push(
        or(
          ilike(knowledgeArticlesTable.title, `%${search}%`),
          ilike(knowledgeArticlesTable.summary, `%${search}%`),
        )!,
      );
    }

    const articles = await query
      .where(and(...conditions))
      .orderBy(desc(knowledgeArticlesTable.featured), desc(knowledgeArticlesTable.publishedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({ articles, total: articles.length });
  } catch {
    res.status(500).json({ error: "Could not load articles" });
  }
});

// ─── GET /api/knowledge/articles/:id ─────────────────────────────────────────
router.get("/knowledge/articles/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const [article] = await db
      .select()
      .from(knowledgeArticlesTable)
      .where(and(eq(knowledgeArticlesTable.id, id), eq(knowledgeArticlesTable.status, "published")));

    if (!article) { res.status(404).json({ error: "Article not found" }); return; }

    if (article.tier === "premium") {
      const userId = (req as any).user?.id as string | undefined;
      if (!userId) {
        res.json({ article: { ...article, content: article.content.slice(0, 400) + "…", locked: true } });
        return;
      }
      const { storage } = await import("../storage");
      const user = await storage.getUser(userId);
      const now = new Date();
      const hasSub = user?.stripeSubscriptionId ||
        (user?.trialEndsAt && user.trialEndsAt > now) ||
        user?.memberType === "founding" || user?.memberType === "beta";
      if (!hasSub) {
        res.json({ article: { ...article, content: article.content.slice(0, 400) + "…", locked: true } });
        return;
      }
    }

    await db
      .update(knowledgeArticlesTable)
      .set({ viewCount: (article.viewCount ?? 0) + 1 })
      .where(eq(knowledgeArticlesTable.id, id));

    res.json({ article: { ...article, locked: false } });
  } catch {
    res.status(500).json({ error: "Could not load article" });
  }
});

// ─── GET /api/knowledge/experts ──────────────────────────────────────────────
router.get("/knowledge/experts", async (_req: Request, res: Response) => {
  try {
    const experts = await db
      .select()
      .from(expertProfilesTable)
      .where(eq(expertProfilesTable.verificationStatus, "verified"))
      .orderBy(desc(expertProfilesTable.followCount))
      .limit(20);
    res.json({ experts });
  } catch {
    res.status(500).json({ error: "Could not load experts" });
  }
});

// ─── GET /api/knowledge/experts/:id ──────────────────────────────────────────
router.get("/knowledge/experts/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const [expert] = await db
      .select()
      .from(expertProfilesTable)
      .where(eq(expertProfilesTable.id, id));

    if (!expert) { res.status(404).json({ error: "Expert not found" }); return; }

    const articles = await db
      .select({
        id: knowledgeArticlesTable.id,
        title: knowledgeArticlesTable.title,
        slug: knowledgeArticlesTable.slug,
        summary: knowledgeArticlesTable.summary,
        category: knowledgeArticlesTable.category,
        tier: knowledgeArticlesTable.tier,
        imageUrl: knowledgeArticlesTable.imageUrl,
        readTimeMinutes: knowledgeArticlesTable.readTimeMinutes,
        publishedAt: knowledgeArticlesTable.publishedAt,
      })
      .from(knowledgeArticlesTable)
      .where(
        and(
          eq(knowledgeArticlesTable.authorId, id),
          eq(knowledgeArticlesTable.status, "published"),
        ),
      )
      .orderBy(desc(knowledgeArticlesTable.publishedAt));

    const userId = (req as any).user?.id as string | undefined;
    let isFollowing = false;
    if (userId) {
      const [follow] = await db
        .select()
        .from(expertFollowsTable)
        .where(
          and(
            eq(expertFollowsTable.followerId, userId),
            eq(expertFollowsTable.expertId, id),
          ),
        );
      isFollowing = !!follow;
    }

    res.json({ expert, articles, isFollowing });
  } catch {
    res.status(500).json({ error: "Could not load expert" });
  }
});

// ─── POST /api/knowledge/experts/:id/follow ───────────────────────────────────
router.post("/knowledge/experts/:id/follow", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
  const expertId = String(req.params.id);

  try {
    const [existing] = await db
      .select()
      .from(expertFollowsTable)
      .where(
        and(
          eq(expertFollowsTable.followerId, userId),
          eq(expertFollowsTable.expertId, expertId),
        ),
      );

    if (existing) {
      await db.delete(expertFollowsTable).where(eq(expertFollowsTable.id, existing.id));
      await db
        .update(expertProfilesTable)
        .set({ followCount: sql`GREATEST(0, COALESCE(follow_count, 0) - 1)` })
        .where(eq(expertProfilesTable.id, expertId));
      res.json({ following: false });
    } else {
      await db.insert(expertFollowsTable).values({ followerId: userId, expertId });
      await db
        .update(expertProfilesTable)
        .set({ followCount: sql`COALESCE(follow_count, 0) + 1` })
        .where(eq(expertProfilesTable.id, expertId));
      res.json({ following: true });
    }
  } catch {
    res.status(500).json({ error: "Could not update follow" });
  }
});

// ─── GET /api/knowledge/bookmarks ────────────────────────────────────────────
router.get("/knowledge/bookmarks", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }

  try {
    const bookmarks = await db
      .select({
        id: knowledgeBookmarksTable.id,
        articleId: knowledgeBookmarksTable.articleId,
        createdAt: knowledgeBookmarksTable.createdAt,
        title: knowledgeArticlesTable.title,
        summary: knowledgeArticlesTable.summary,
        category: knowledgeArticlesTable.category,
        tier: knowledgeArticlesTable.tier,
        imageUrl: knowledgeArticlesTable.imageUrl,
        readTimeMinutes: knowledgeArticlesTable.readTimeMinutes,
      })
      .from(knowledgeBookmarksTable)
      .leftJoin(knowledgeArticlesTable, eq(knowledgeBookmarksTable.articleId, knowledgeArticlesTable.id))
      .where(eq(knowledgeBookmarksTable.userId, userId))
      .orderBy(desc(knowledgeBookmarksTable.createdAt));

    res.json({ bookmarks });
  } catch {
    res.status(500).json({ error: "Could not load bookmarks" });
  }
});

// ─── POST /api/knowledge/articles/:id/bookmark ───────────────────────────────
router.post("/knowledge/articles/:id/bookmark", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
  const articleId = String(req.params.id);

  try {
    const [existing] = await db
      .select()
      .from(knowledgeBookmarksTable)
      .where(
        and(
          eq(knowledgeBookmarksTable.userId, userId),
          eq(knowledgeBookmarksTable.articleId, articleId),
        ),
      );

    if (existing) {
      await db.delete(knowledgeBookmarksTable).where(eq(knowledgeBookmarksTable.id, existing.id));
      res.json({ bookmarked: false });
    } else {
      await db.insert(knowledgeBookmarksTable).values({ userId, articleId });
      res.json({ bookmarked: true });
    }
  } catch {
    res.status(500).json({ error: "Could not update bookmark" });
  }
});

// ─── GET /api/knowledge/articles/:id/bookmark-status ─────────────────────────
router.get("/knowledge/articles/:id/bookmark-status", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  const articleId = String(req.params.id);
  if (!userId) { res.json({ bookmarked: false }); return; }
  try {
    const [b] = await db.select().from(knowledgeBookmarksTable)
      .where(and(eq(knowledgeBookmarksTable.userId, userId), eq(knowledgeBookmarksTable.articleId, articleId)));
    res.json({ bookmarked: !!b });
  } catch {
    res.json({ bookmarked: false });
  }
});

// ─── GET /api/knowledge/topics ───────────────────────────────────────────────
router.get("/knowledge/topics", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  try {
    const topics = await db
      .select()
      .from(knowledgeTopicsTable)
      .where(eq(knowledgeTopicsTable.enabled, true))
      .orderBy(knowledgeTopicsTable.topicName);

    let followedIds = new Set<string>();
    let followCount = 0;
    if (userId) {
      const follows = await db
        .select({ topicId: userTopicFollowsTable.topicId })
        .from(userTopicFollowsTable)
        .where(eq(userTopicFollowsTable.userId, userId));
      followedIds = new Set(follows.map((f) => f.topicId));
      followCount = follows.length;
    }

    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const recentArticles = await db
      .select({ topicId: knowledgeArticlesTable.topicId, id: knowledgeArticlesTable.id })
      .from(knowledgeArticlesTable)
      .where(
        and(
          eq(knowledgeArticlesTable.status, "published"),
          sql`${knowledgeArticlesTable.publishedAt} > ${eightDaysAgo}`,
          sql`${knowledgeArticlesTable.topicId} IS NOT NULL`,
        ),
      );

    const newByTopic = new Map<string, number>();
    recentArticles.forEach((a) => {
      if (a.topicId) newByTopic.set(a.topicId, (newByTopic.get(a.topicId) ?? 0) + 1);
    });

    const result = topics.map((t) => ({
      ...t,
      isFollowing: followedIds.has(t.id),
      newCount: newByTopic.get(t.id) ?? 0,
    }));

    res.json({ topics: result, followCount });
  } catch {
    res.status(500).json({ error: "Could not load topics" });
  }
});

// ─── POST /api/knowledge/topics/:topicId/follow ───────────────────────────────
router.post("/knowledge/topics/:topicId/follow", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
  const topicId = String(req.params.topicId);

  try {
    const [existing] = await db
      .select({ id: userTopicFollowsTable.id })
      .from(userTopicFollowsTable)
      .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId)));

    if (existing) { res.json({ following: true }); return; }

    const [user] = await db
      .select({ stripeSubscriptionId: usersTable.stripeSubscriptionId })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user?.stripeSubscriptionId) {
      const [countRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(userTopicFollowsTable)
        .where(eq(userTopicFollowsTable.userId, userId));
      if (Number(countRow?.count ?? 0) >= 10) {
        res.status(403).json({ error: "FREE_LIMIT_REACHED", message: "Upgrade to follow unlimited topics" });
        return;
      }
    }

    await db.insert(userTopicFollowsTable).values({ userId, topicId });
    res.json({ following: true });
  } catch {
    res.status(500).json({ error: "Could not follow topic" });
  }
});

// ─── DELETE /api/knowledge/topics/:topicId/follow ─────────────────────────────
router.delete("/knowledge/topics/:topicId/follow", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
  const topicId = String(req.params.topicId);

  try {
    await db
      .delete(userTopicFollowsTable)
      .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId)));
    res.json({ following: false });
  } catch {
    res.status(500).json({ error: "Could not unfollow topic" });
  }
});

// ─── GET /api/knowledge/feed ──────────────────────────────────────────────────
router.get("/knowledge/feed", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }

  try {
    const follows = await db
      .select({ topicId: userTopicFollowsTable.topicId })
      .from(userTopicFollowsTable)
      .where(eq(userTopicFollowsTable.userId, userId));

    if (follows.length === 0) { res.json({ articles: [], newCount: 0 }); return; }

    const topicIds = follows.map((f) => f.topicId);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    const reads = await db
      .select({ articleId: knowledgeArticleReadsTable.articleId })
      .from(knowledgeArticleReadsTable)
      .where(eq(knowledgeArticleReadsTable.userId, userId));
    const readIds = new Set(reads.map((r) => r.articleId));

    const articles = await db
      .select({
        id: knowledgeArticlesTable.id,
        title: knowledgeArticlesTable.title,
        slug: knowledgeArticlesTable.slug,
        summary: knowledgeArticlesTable.summary,
        category: knowledgeArticlesTable.category,
        topicId: knowledgeArticlesTable.topicId,
        tier: knowledgeArticlesTable.tier,
        authorName: knowledgeArticlesTable.authorName,
        authorBadge: knowledgeArticlesTable.authorBadge,
        imageUrl: knowledgeArticlesTable.imageUrl,
        readTimeMinutes: knowledgeArticlesTable.readTimeMinutes,
        publishedAt: knowledgeArticlesTable.publishedAt,
      })
      .from(knowledgeArticlesTable)
      .where(
        and(
          eq(knowledgeArticlesTable.status, "published"),
          inArray(knowledgeArticlesTable.topicId, topicIds),
          sql`${knowledgeArticlesTable.publishedAt} > ${eightDaysAgo}`,
        ),
      )
      .orderBy(desc(knowledgeArticlesTable.publishedAt));

    const feedArticles = articles.map((a) => ({ ...a, isRead: readIds.has(a.id) }));
    const newCount = feedArticles.filter((a) => !a.isRead).length;

    res.json({ articles: feedArticles, newCount });
  } catch {
    res.status(500).json({ error: "Could not load feed" });
  }
});

// ─── GET /api/knowledge/feed/count ───────────────────────────────────────────
router.get("/knowledge/feed/count", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.json({ count: 0 }); return; }

  try {
    const follows = await db
      .select({ topicId: userTopicFollowsTable.topicId })
      .from(userTopicFollowsTable)
      .where(eq(userTopicFollowsTable.userId, userId));

    if (follows.length === 0) { res.json({ count: 0 }); return; }

    const topicIds = follows.map((f) => f.topicId);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    const reads = await db
      .select({ articleId: knowledgeArticleReadsTable.articleId })
      .from(knowledgeArticleReadsTable)
      .where(eq(knowledgeArticleReadsTable.userId, userId));
    const readIds = new Set(reads.map((r) => r.articleId));

    const articles = await db
      .select({ id: knowledgeArticlesTable.id })
      .from(knowledgeArticlesTable)
      .where(
        and(
          eq(knowledgeArticlesTable.status, "published"),
          inArray(knowledgeArticlesTable.topicId, topicIds),
          sql`${knowledgeArticlesTable.publishedAt} > ${eightDaysAgo}`,
        ),
      );

    const count = articles.filter((a) => !readIds.has(a.id)).length;
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

// ─── GET /api/knowledge/topics/:topicId/articles ─────────────────────────────
router.get("/knowledge/topics/:topicId/articles", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  const topicId = String(req.params.topicId);

  try {
    const [topic] = await db
      .select()
      .from(knowledgeTopicsTable)
      .where(eq(knowledgeTopicsTable.id, topicId));
    if (!topic) { res.status(404).json({ error: "Topic not found" }); return; }

    const articles = await db
      .select({
        id: knowledgeArticlesTable.id,
        title: knowledgeArticlesTable.title,
        summary: knowledgeArticlesTable.summary,
        category: knowledgeArticlesTable.category,
        tier: knowledgeArticlesTable.tier,
        authorName: knowledgeArticlesTable.authorName,
        authorBadge: knowledgeArticlesTable.authorBadge,
        imageUrl: knowledgeArticlesTable.imageUrl,
        readTimeMinutes: knowledgeArticlesTable.readTimeMinutes,
        publishedAt: knowledgeArticlesTable.publishedAt,
      })
      .from(knowledgeArticlesTable)
      .where(
        and(
          eq(knowledgeArticlesTable.status, "published"),
          eq(knowledgeArticlesTable.topicId, topicId),
        ),
      )
      .orderBy(desc(knowledgeArticlesTable.publishedAt));

    let readIds = new Set<string>();
    let isFollowing = false;
    if (userId) {
      const [readRows, followRow] = await Promise.all([
        db
          .select({ articleId: knowledgeArticleReadsTable.articleId })
          .from(knowledgeArticleReadsTable)
          .where(eq(knowledgeArticleReadsTable.userId, userId)),
        db
          .select({ id: userTopicFollowsTable.id })
          .from(userTopicFollowsTable)
          .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId))),
      ]);
      readIds = new Set(readRows.map((r) => r.articleId));
      isFollowing = followRow.length > 0;
    }

    const articlesWithRead = articles.map((a) => ({ ...a, isRead: readIds.has(a.id) }));
    res.json({ topic, articles: articlesWithRead, isFollowing });
  } catch {
    res.status(500).json({ error: "Could not load topic" });
  }
});

// ─── POST /api/knowledge/articles/:id/read ────────────────────────────────────
router.post("/knowledge/articles/:id/read", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.json({ ok: true, suggestion: null }); return; }
  const articleId = String(req.params.id);

  try {
    const [article] = await db
      .select({ topicId: knowledgeArticlesTable.topicId })
      .from(knowledgeArticlesTable)
      .where(eq(knowledgeArticlesTable.id, articleId));

    await db
      .insert(knowledgeArticleReadsTable)
      .values({ userId, articleId, topicId: article?.topicId ?? null })
      .onConflictDoNothing();

    let suggestion: { message: string; topics: string[] } | null = null;
    if (article?.topicId) {
      const [countRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(knowledgeArticleReadsTable)
        .where(
          and(
            eq(knowledgeArticleReadsTable.userId, userId),
            eq(knowledgeArticleReadsTable.topicId, article.topicId),
          ),
        );
      const readCount = Number(countRow?.count ?? 0);

      if (readCount === 3) {
        const [currentTopic] = await db
          .select({ category: knowledgeTopicsTable.category })
          .from(knowledgeTopicsTable)
          .where(eq(knowledgeTopicsTable.id, article.topicId));

        if (currentTopic) {
          const followedRows = await db
            .select({ topicId: userTopicFollowsTable.topicId })
            .from(userTopicFollowsTable)
            .where(eq(userTopicFollowsTable.userId, userId));
          const followedSet = new Set(followedRows.map((f) => f.topicId));

          const related = await db
            .select({ id: knowledgeTopicsTable.id, topicName: knowledgeTopicsTable.topicName })
            .from(knowledgeTopicsTable)
            .where(
              and(
                eq(knowledgeTopicsTable.category, currentTopic.category),
                eq(knowledgeTopicsTable.enabled, true),
                sql`${knowledgeTopicsTable.id} != ${article.topicId}`,
              ),
            )
            .limit(3);

          const unfollowed = related.filter((t) => !followedSet.has(t.id)).map((t) => t.topicName);
          if (unfollowed.length > 0) {
            suggestion = {
              message: "Since you enjoy this topic, you might also like:",
              topics: unfollowed.slice(0, 2),
            };
          }
        }
      }
    }

    res.json({ ok: true, suggestion });
  } catch {
    res.json({ ok: true, suggestion: null });
  }
});

export default router;
