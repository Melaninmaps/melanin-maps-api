import { Router, type IRouter, type Request, type Response } from "express";
import { db, knowledgeChannelsTable, channelFollowsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const DEFAULT_CHANNELS = [
  { slug: "health", label: "Health & Wellness", icon: "🩺", description: "Healthcare, mental health, fitness, and holistic wellness resources", color: "#16A34A", sortOrder: 1 },
  { slug: "travel", label: "Travel & Culture", icon: "✈️", description: "City guides, travel tips, cultural destinations, and hidden gems", color: "#2563EB", sortOrder: 2 },
  { slug: "relocation", label: "Relocation", icon: "🏡", description: "Moving guides, neighborhood comparisons, and settling-in resources", color: "#CA922B", sortOrder: 3 },
  { slug: "business", label: "Business & Entrepreneurship", icon: "🚀", description: "Business building, funding, legal, and growth strategies", color: "#7C3AED", sortOrder: 4 },
  { slug: "finance", label: "Finance & Wealth", icon: "💰", description: "Personal finance, investing, credit, and wealth building", color: "#0EA5E9", sortOrder: 5 },
  { slug: "parenting", label: "Parenting & Family", icon: "👶🏾", description: "Raising children, family resources, childcare, and education", color: "#F97316", sortOrder: 6 },
  { slug: "education", label: "Education", icon: "🎓", description: "College guides, scholarships, tutoring, and continuing education", color: "#EC4899", sortOrder: 7 },
  { slug: "culture", label: "Culture & History", icon: "🎭", description: "Cultural events, history, arts, and community storytelling", color: "#8B5CF6", sortOrder: 8 },
  { slug: "food", label: "Food & Dining", icon: "🍽️", description: "Restaurant reviews, recipes, food culture, and culinary events", color: "#EF4444", sortOrder: 9 },
  { slug: "law", label: "Legal & Rights", icon: "⚖️", description: "Know your rights, legal resources, and community advocacy", color: "#64748B", sortOrder: 10 },
  { slug: "safety", label: "Community Intelligence", icon: "🛡️", description: "Community-sourced context, local resources, and shared member experiences", color: "#DC2626", sortOrder: 11 },
  { slug: "spirituality", label: "Faith & Spirituality", icon: "🙏🏾", description: "Houses of worship, spiritual wellness, and community gatherings", color: "#A16207", sortOrder: 12 },
];

router.get("/channels", async (_req: Request, res: Response) => {
  try {
    let channels = await db
      .select()
      .from(knowledgeChannelsTable)
      .where(eq(knowledgeChannelsTable.published, true))
      .orderBy(asc(knowledgeChannelsTable.sortOrder));

    if (channels.length === 0) {
      const inserted = await db
        .insert(knowledgeChannelsTable)
        .values(DEFAULT_CHANNELS)
        .onConflictDoNothing()
        .returning();
      channels = inserted.length > 0 ? inserted : DEFAULT_CHANNELS.map((c, i) => ({ ...c, id: `seed-${i}`, published: true, createdAt: new Date() }));
    }

    res.json({ channels });
  } catch (err) {
    (_req as any).log?.error({ err }, "Failed to fetch channels");
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

router.get("/channels/:slug", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  try {
    const [channel] = await db
      .select()
      .from(knowledgeChannelsTable)
      .where(eq(knowledgeChannelsTable.slug, slug))
      .limit(1);

    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }

    const [articles, events, businesses] = await Promise.all([
      pool.query<{ id: string; title: string; category: string; excerpt: string; created_at: Date }>(
        `SELECT id, title, category, excerpt, created_at FROM knowledge_articles WHERE published = true AND category ILIKE $1 ORDER BY created_at DESC LIMIT 12`,
        [`%${slug}%`],
      ).catch(() => ({ rows: [] })),
      pool.query<{ id: string; title: string; category: string; city: string; event_date: Date }>(
        `SELECT id, title, category, city, event_date FROM events WHERE status = 'published' AND event_date >= NOW() AND category ILIKE $1 ORDER BY event_date ASC LIMIT 6`,
        [`%${slug}%`],
      ).catch(() => ({ rows: [] })),
      pool.query<{ id: string; name: string; category: string; city: string; verified: boolean }>(
        `SELECT id, name, category, city, verified FROM businesses WHERE status = 'active' AND category ILIKE $1 ORDER BY verified DESC, name ASC LIMIT 10`,
        [`%${slug}%`],
      ).catch(() => ({ rows: [] })),
    ]);

    res.json({ channel, articles: articles.rows, events: events.rows, businesses: businesses.rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch channel detail");
    res.status(500).json({ error: "Failed to fetch channel" });
  }
});

router.post("/channels/:slug/follow", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const slug = String(req.params.slug);
  const { follow = true } = req.body as { follow?: boolean };

  try {
    if (follow) {
      await db
        .insert(channelFollowsTable)
        .values({ userId: req.user.id, channelSlug: slug })
        .onConflictDoNothing();
    } else {
      await db
        .delete(channelFollowsTable)
        .where(and(eq(channelFollowsTable.userId, req.user.id), eq(channelFollowsTable.channelSlug, slug)));
    }
    res.json({ ok: true, following: follow });
  } catch (err) {
    req.log.error({ err }, "Failed to update channel follow");
    res.status(500).json({ error: "Failed to update channel follow" });
  }
});

router.get("/channels/my/following", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const follows = await db
      .select({ channelSlug: channelFollowsTable.channelSlug })
      .from(channelFollowsTable)
      .where(eq(channelFollowsTable.userId, req.user.id));
    res.json({ following: follows.map((f) => f.channelSlug) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch followed channels");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
