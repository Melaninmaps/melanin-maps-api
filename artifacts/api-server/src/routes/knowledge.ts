import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { type Request, type Response, Router } from "express";
import { db } from "@workspace/db";
import {
  businessesTable,
  communityPostsTable,
  expertFollowsTable,
  expertProfilesTable,
  knowledgeArticlesTable,
  knowledgeArticleReadsTable,
  knowledgeBookmarksTable,
  knowledgeTopicsTable,
  topicCredibilitySignalsTable,
  userTopicFollowsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();
router.use(requireAuth);

// ─── Topic Type Classifier ────────────────────────────────────────────────────
type TopicType = "location" | "medical" | "wellness" | "education" | "business" | "community" | "hobby" | "general";

function classifyTopicType(name: string): { topicType: TopicType; category: string } {
  const lower = name.toLowerCase();

  const locationWords = ["city", "town", "village", "county", "state", "country", "region", "area", "neighborhood", "district", "borough", "island", "mountains", "valley", "bay", "harbor", "port", "lake", "river", "beach"];
  const locationCountries = ["nigeria", "ghana", "kenya", "south africa", "ethiopia", "senegal", "cameroon", "tanzania", "uganda", "rwanda", "zimbabwe", "mozambique", "angola", "jamaica", "haiti", "trinidad", "barbados", "cuba", "puerto rico", "dominican republic", "bahamas", "brazil", "colombia", "panama", "belize", "guyana", "mexico", "england", "france", "germany", "spain", "portugal", "italy", "canada", "australia", "china", "japan", "india", "united kingdom", "ivory coast", "liberia", "sierra leone", "gambia", "togo", "benin", "mali", "senegal"];
  const usStates = ["alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina", "south dakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west virginia", "wisconsin", "wyoming"];
  const majorCities = ["atlanta", "new york", "los angeles", "chicago", "houston", "phoenix", "philadelphia", "san antonio", "san diego", "dallas", "san jose", "austin", "jacksonville", "charlotte", "indianapolis", "san francisco", "seattle", "denver", "washington dc", "boston", "nashville", "baltimore", "louisville", "portland", "las vegas", "milwaukee", "kansas city", "cleveland", "raleigh", "miami", "minneapolis", "detroit", "richmond", "birmingham", "montgomery", "jackson", "memphis", "new orleans", "baton rouge", "durham", "harlem", "brooklyn", "bronx", "queens", "compton", "inglewood", "oakland", "newark", "hartford", "springfield", "worcester", "savannah", "columbia", "greenville", "chattanooga", "knoxville", "mobile", "shreveport"];

  if (locationWords.some(w => lower.includes(w)) || locationCountries.some(c => lower.includes(c)) || usStates.some(s => lower === s || lower.startsWith(s + " ") || lower.endsWith(" " + s)) || majorCities.some(c => lower === c || lower.includes(c))) {
    return { topicType: "location", category: "travel" };
  }

  const medicalTerms = ["diabetes", "cancer", "postpartum", "pregnancy", "pregnant", "hypertension", "depression", "anxiety", "autism", "adhd", "hiv", "aids", "obesity", "asthma", "arthritis", "heart disease", "stroke", "dementia", "alzheimer", "sickle cell", "lupus", "fibromyalgia", "pcos", "endometriosis", "menopause", "fertility", "infertility", "thyroid", "chronic", "syndrome", "disorder", "disease", "therapy", "medication", "surgery", "diagnosis", "mental health", "bipolar", "schizophrenia", "ptsd", "trauma", "addiction", "substance", "vaccine", "clinical", "hospital", "healthcare", "health care", "prescription", "treatment", "symptom", "blood pressure", "cholesterol", "insulin", "blood sugar", "kidney disease", "liver", "anemia", "eczema", "psoriasis", "alopecia", "vitiligo"];
  if (medicalTerms.some(t => lower.includes(t))) return { topicType: "medical", category: "health" };

  const wellnessTerms = ["yoga", "meditation", "mindfulness", "fitness", "nutrition", "diet", "exercise", "workout", "self-care", "wellness", "holistic", "pilates", "crossfit", "running", "cycling", "hiking", "weight loss", "intermittent fasting", "vegan", "vegetarian", "plant-based", "keto", "gut health", "stress relief"];
  if (wellnessTerms.some(t => lower.includes(t))) return { topicType: "wellness", category: "wellness" };

  const educationTerms = ["school", "college", "university", "hbcu", "scholarship", "degree", "education", "academic", "tutoring", "stem", "coding", "bootcamp", "graduate", "undergraduate", "phd", "masters", "bachelor", "classroom", "professor", "student", "campus", "enrollment", "financial aid", "fafsa", "student loan", "literacy", "homeschool"];
  if (educationTerms.some(t => lower.includes(t))) return { topicType: "education", category: "education" };

  const businessTerms = ["startup", "entrepreneur", "investing", "investment", "finance", "financial", "stock market", "crypto", "cryptocurrency", "bitcoin", "real estate", "franchise", "side hustle", "passive income", "revenue", "profit", "business plan", "venture capital", "angel investor", "e-commerce", "ecommerce", "dropshipping", "branding", "sales", "grant", "funding", "loan", "sba", "llc", "corporation", "accounting", "budget", "retirement", "401k", "ira", "dividend", "portfolio", "wealth", "net worth", "generational wealth"];
  if (businessTerms.some(t => lower.includes(t))) return { topicType: "business", category: "business" };

  const communityTerms = ["activism", "protest", "movement", "rights", "community", "culture", "heritage", "advocacy", "justice", "equity", "diversity", "inclusion", "civil rights", "black lives", "diaspora", "african american", "caribbean", "pan-african", "afrobeats", "social justice", "policy", "legislation", "voting", "politics", "government", "election", "immigrant", "immigration", "refugee", "church", "faith", "religion", "spiritual", "gospel", "lgbtq", "queer", "trans", "feminist", "womanism"];
  if (communityTerms.some(t => lower.includes(t))) return { topicType: "community", category: "community_culture" };

  const hobbyTerms = ["vintage", "classic car", "automotive", "cooking", "recipe", "baking", "cuisine", "restaurant", "music", "musician", "fashion", "style", "outfit", "beauty", "natural hair", "skincare", "makeup", "gaming", "video game", "photography", "gardening", "plants", "crafts", "diy", "sewing", "knitting", "crochet", "book club", "poetry", "writing", "adventure", "camping", "fishing", "hunting", "basketball", "football", "baseball", "soccer", "tennis", "golf", "boxing", "mma", "dance", "ballet", "theater", "film", "movies", "anime", "sneakers", "jewelry", "watches", "collecting", "cooking", "cars"];
  if (hobbyTerms.some(t => lower.includes(t))) return { topicType: "hobby", category: "culture" };

  return { topicType: "general", category: "community_culture" };
}

// ─── POST /api/knowledge/topics/search-or-create ─────────────────────────────
router.post("/knowledge/topics/search-or-create", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  const { name } = req.body as { name?: string };
  if (!name || !name.trim()) { res.status(400).json({ error: "Topic name required" }); return; }

  const cleanName = name.trim().replace(/\s+/g, " ");

  try {
    const existing = await db
      .select()
      .from(knowledgeTopicsTable)
      .where(ilike(knowledgeTopicsTable.topicName, cleanName))
      .limit(1);

    let topic = existing[0];
    let created = false;

    if (!topic) {
      const { topicType, category } = classifyTopicType(cleanName);
      const [newTopic] = await db
        .insert(knowledgeTopicsTable)
        .values({
          topicName: cleanName,
          category,
          topicType,
          isUserCreated: true,
          createdByUserId: userId ?? null,
          enabled: true,
          description: `Community interest: ${cleanName}`,
          keywords: [cleanName.toLowerCase()],
        })
        .returning();
      topic = newTopic;
      created = true;
    }

    if (userId && topic) {
      const [alreadyFollowing] = await db
        .select({ id: userTopicFollowsTable.id })
        .from(userTopicFollowsTable)
        .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topic.id)));

      if (!alreadyFollowing) {
        const [user] = await db
          .select({ stripeSubscriptionId: usersTable.stripeSubscriptionId })
          .from(usersTable)
          .where(eq(usersTable.id, userId));

        if (user?.stripeSubscriptionId) {
          await db.insert(userTopicFollowsTable).values({ userId, topicId: topic.id });
        } else {
          const [countRow] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(userTopicFollowsTable)
            .where(eq(userTopicFollowsTable.userId, userId));
          if (Number(countRow?.count ?? 0) < 10) {
            await db.insert(userTopicFollowsTable).values({ userId, topicId: topic.id });
          }
        }
      }
    }

    res.json({ topic, created });
  } catch {
    res.status(500).json({ error: "Could not save topic" });
  }
});

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
  // Optional ?topicType=collection|book|subtopic|geography|general — filter by type.
  // Optional ?excludeType=collection — exclude a specific type from results.
  const topicTypeFilter = typeof req.query.topicType === "string" ? req.query.topicType : undefined;
  const excludeTypeFilter = typeof req.query.excludeType === "string" ? req.query.excludeType : undefined;

  try {
    const conditions = [eq(knowledgeTopicsTable.enabled, true)];
    if (topicTypeFilter) conditions.push(eq(knowledgeTopicsTable.topicType, topicTypeFilter));
    if (excludeTypeFilter) conditions.push(sql`${knowledgeTopicsTable.topicType} != ${excludeTypeFilter}`);

    const topics = await db
      .select()
      .from(knowledgeTopicsTable)
      .where(and(...conditions))
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

    // Record credibility signal and recalculate asynchronously
    void db.insert(topicCredibilitySignalsTable).values({
      topicId, userId, signalType: "follow", weight: 2, metadata: null,
    }).then(() => recalculateCredibility(topicId)).catch(() => {});

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

    const topicName = topic.topicName;

    const [articles, posts, businesses] = await Promise.all([
      db
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
        .where(and(eq(knowledgeArticlesTable.status, "published"), eq(knowledgeArticlesTable.topicId, topicId)))
        .orderBy(desc(knowledgeArticlesTable.publishedAt))
        .limit(30),

      db
        .select({
          id: communityPostsTable.id,
          content: communityPostsTable.content,
          authorName: communityPostsTable.authorName,
          authorInitials: communityPostsTable.authorInitials,
          authorColor: communityPostsTable.authorColor,
          locationTag: communityPostsTable.locationTag,
          topicTag: communityPostsTable.topicTag,
          businessName: communityPostsTable.businessName,
          upvotes: communityPostsTable.upvotes,
          commentsCount: communityPostsTable.commentsCount,
          createdAt: communityPostsTable.createdAt,
        })
        .from(communityPostsTable)
        .where(
          and(
            eq(communityPostsTable.visibility, "public"),
            or(
              ilike(communityPostsTable.content, `%${topicName}%`),
              ilike(communityPostsTable.locationTag, `%${topicName}%`),
              ilike(communityPostsTable.topicTag, `%${topicName}%`),
            ),
          ),
        )
        .orderBy(desc(communityPostsTable.createdAt))
        .limit(20),

      db
        .select({
          id: businessesTable.id,
          name: businessesTable.name,
          category: businessesTable.category,
          city: businessesTable.city,
          state: businessesTable.state,
          address: businessesTable.address,
        })
        .from(businessesTable)
        .where(
          or(
            ilike(businessesTable.name, `%${topicName}%`),
            ilike(businessesTable.category, `%${topicName}%`),
            ilike(businessesTable.city, `%${topicName}%`),
            ilike(businessesTable.state, `%${topicName}%`),
          ),
        )
        .limit(15),
    ]);

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
    res.json({ topic, articles: articlesWithRead, posts, businesses, isFollowing });
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

// ─── Credibility Score Recalculator ──────────────────────────────────────────
async function recalculateCredibility(topicId: string): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [topic, signals] = await Promise.all([
      db.select().from(knowledgeTopicsTable).where(eq(knowledgeTopicsTable.id, topicId)).then((r) => r[0]),
      db.select().from(topicCredibilitySignalsTable).where(
        and(
          eq(topicCredibilitySignalsTable.topicId, topicId),
          sql`${topicCredibilitySignalsTable.createdAt} > ${cutoff}`,
        ),
      ),
    ]);
    if (!topic) return;

    let score = topic.isUserCreated ? 30 : 50;
    const byType = (t: string) => signals.filter((s) => s.signalType === t).length;

    score += Math.min(byType("follow") * 2, 25);
    score += Math.min(byType("read") * 0.5, 15);
    score += Math.min(byType("upvote") * 3, 15);
    score += Math.min(byType("expert_endorse") * 10, 20);

    const trusted = (topic.trustedSources as unknown[] | null)?.length ?? 0;
    if (trusted > 0) score += Math.min(trusted * 5, 20);

    score = Math.min(100, Math.max(0, Math.round(score)));
    const tier =
      score >= 85 ? "authoritative" :
      score >= 60 ? "established" :
      score >= 30 ? "emerging" : "community";

    await db.update(knowledgeTopicsTable)
      .set({ credibilityScore: score, credibilityTier: tier })
      .where(eq(knowledgeTopicsTable.id, topicId));
  } catch { /* silent */ }
}

// ─── GET /knowledge/topics/similar?q=<query> ─────────────────────────────────
// Returns existing topics that are similar to the given query term.
// Uses keyword/word-overlap scoring — no pg_trgm required.
router.get("/knowledge/topics/similar", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (!q || q.length < 2) { res.json({ topics: [] }); return; }

  try {
    const STOP = new Set(["the", "a", "an", "and", "or", "in", "at", "of", "for", "to", "with", "on", "is", "are", "my", "be"]);
    const qWords = q.toLowerCase().split(/\W+/).filter((w) => w.length > 1 && !STOP.has(w));
    if (qWords.length === 0) { res.json({ topics: [] }); return; }

    const allTopics = await db.select().from(knowledgeTopicsTable)
      .where(eq(knowledgeTopicsTable.enabled, true));

    const qLower = q.toLowerCase();

    const scored = allTopics
      .map((topic) => {
        const nameLower = topic.topicName.toLowerCase();
        // Skip exact matches — they're handled by search-or-create
        if (nameLower === qLower) return { topic, score: 0 };

        const nameWords = nameLower.split(/\W+/);
        const keywords = (topic.keywords ?? []).map((k) => k.toLowerCase());
        const synonyms = (topic.synonyms ?? []).map((s) => s.toLowerCase());
        const all = [...nameWords, ...keywords, ...synonyms];

        let score = 0;
        for (const w of qWords) {
          if (nameLower.includes(w)) score += 4;
          else if (nameWords.some((nw) => nw.startsWith(w) || w.startsWith(nw))) score += 2;
          if (all.some((kw) => kw === w)) score += 3;
          else if (all.some((kw) => kw.includes(w) || w.includes(kw))) score += 1;
        }
        // Prefix bonus
        if (nameLower.startsWith(qLower.slice(0, 4)) || qLower.startsWith(nameLower.slice(0, 4))) score += 3;

        return { topic, score };
      })
      .filter(({ score }) => score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Attach follower counts
    const ids = scored.map(({ topic }) => topic.id);
    let memberCounts: Record<string, number> = {};
    if (ids.length > 0) {
      const rows = await db.select({
        topicId: userTopicFollowsTable.topicId,
        cnt: sql<number>`COUNT(*)`,
      })
      .from(userTopicFollowsTable)
      .where(inArray(userTopicFollowsTable.topicId, ids))
      .groupBy(userTopicFollowsTable.topicId);
      memberCounts = Object.fromEntries(rows.map((r) => [r.topicId, Number(r.cnt)]));
    }

    const topics = scored.map(({ topic, score }) => ({
      ...topic,
      membersCount: memberCounts[topic.id] ?? 0,
      similarityScore: score,
    }));

    res.json({ topics });
  } catch {
    res.status(500).json({ error: "Could not search similar topics" });
  }
});

// ─── POST /knowledge/topics/:id/signal ───────────────────────────────────────
// Records a credibility signal (follow, read, upvote, expert_endorse) and
// recalculates the topic's credibility score asynchronously.
router.post("/knowledge/topics/:id/signal", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  const topicId = String(req.params.id);
  const { signalType, metadata } = req.body as { signalType?: string; metadata?: Record<string, unknown> };
  const VALID = ["follow", "read", "upvote", "expert_endorse", "share"];
  if (!signalType || !VALID.includes(signalType)) {
    res.status(400).json({ error: "Invalid signalType. Must be one of: " + VALID.join(", ") }); return;
  }

  try {
    const weights: Record<string, number> = { follow: 2, read: 1, upvote: 3, expert_endorse: 10, share: 2 };
    await db.insert(topicCredibilitySignalsTable).values({
      topicId,
      userId: userId ?? null,
      signalType,
      weight: weights[signalType] ?? 1,
      metadata: metadata ?? null,
    });

    // Recalculate score in background (don't await)
    void recalculateCredibility(topicId);

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Could not record signal" });
  }
});

// ─── GET /knowledge/topics/:id/community-videos ───────────────────────────────
// Returns community posts with media (video/images) tagged to this topic.
// "topicTag" on community_posts stores the topic name or id match.
router.get("/knowledge/topics/:id/community-videos", async (req: Request, res: Response) => {
  const topicId = String(req.params.id);
  try {
    const [topic] = await db.select({ topicName: knowledgeTopicsTable.topicName })
      .from(knowledgeTopicsTable).where(eq(knowledgeTopicsTable.id, topicId));

    if (!topic) { res.status(404).json({ error: "Topic not found" }); return; }

    const posts = await db.select({
      id: communityPostsTable.id,
      content: communityPostsTable.content,
      authorName: communityPostsTable.authorName,
      authorInitials: communityPostsTable.authorInitials,
      authorColor: communityPostsTable.authorColor,
      mediaUrls: communityPostsTable.mediaUrls,
      topicTag: communityPostsTable.topicTag,
      upvotes: communityPostsTable.upvotes,
      commentsCount: communityPostsTable.commentsCount,
      createdAt: communityPostsTable.createdAt,
    })
    .from(communityPostsTable)
    .where(
      and(
        eq(communityPostsTable.visibility, "public"),
        sql`${communityPostsTable.mediaUrls} IS NOT NULL`,
        or(
          ilike(communityPostsTable.topicTag, topic.topicName),
          ilike(communityPostsTable.topicTag, `%${topic.topicName}%`),
          ilike(communityPostsTable.content, `%${topic.topicName}%`),
        ),
      ),
    )
    .orderBy(desc(communityPostsTable.createdAt))
    .limit(30);

    // Parse mediaUrls and flag which contain video
    const withMedia = posts.map((p) => {
      let media: string[] = [];
      try { media = JSON.parse(p.mediaUrls ?? "[]"); } catch { media = []; }
      const hasVideo = media.some((url) =>
        /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url) || url.includes("/video/") || url.includes("video%2F")
      );
      return { ...p, media, hasVideo };
    });

    res.json({ posts: withMedia, topic });
  } catch {
    res.status(500).json({ error: "Could not load community videos" });
  }
});

export default router;
