import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { type Request, type Response, Router } from "express";
import { db } from "@workspace/db";
import {
  expertFollowsTable,
  expertProfilesTable,
  knowledgeArticlesTable,
  knowledgeBookmarksTable,
} from "@workspace/db";

const router = Router();

// ─── GET /api/knowledge/categories ───────────────────────────────────────────
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

router.get("/api/knowledge/categories", (_req: Request, res: Response) => {
  res.json({ categories: KNOWLEDGE_CATEGORIES });
});

// ─── GET /api/knowledge/articles ─────────────────────────────────────────────
router.get("/api/knowledge/articles", async (req: Request, res: Response) => {
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
router.get("/api/knowledge/articles/:id", async (req: Request, res: Response) => {
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
router.get("/api/knowledge/experts", async (_req: Request, res: Response) => {
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
router.get("/api/knowledge/experts/:id", async (req: Request, res: Response) => {
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
router.post("/api/knowledge/experts/:id/follow", async (req: Request, res: Response) => {
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
router.get("/api/knowledge/bookmarks", async (req: Request, res: Response) => {
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
router.post("/api/knowledge/articles/:id/bookmark", async (req: Request, res: Response) => {
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
router.get("/api/knowledge/articles/:id/bookmark-status", async (req: Request, res: Response) => {
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

export default router;
