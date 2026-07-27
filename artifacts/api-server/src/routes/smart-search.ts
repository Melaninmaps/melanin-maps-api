import { Router, type IRouter, type Request, type Response } from "express";
import { db, userPreferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { pool } from "@workspace/db";

const router: IRouter = Router();

interface SearchIntent {
  type: string;
  categories: string[];
  keywords: string[];
  includeTypes: Array<"business" | "event" | "article" | "neighborhood" | "journey">;
  contextNote: string;
}

const INTENT_PATTERNS: Array<{ pattern: RegExp; intent: SearchIntent }> = [
  {
    pattern: /\b(move|moving|relocat|new city|new home)\b/i,
    intent: { type: "relocation", categories: ["Real Estate", "Moving", "Finance", "Banking", "Healthcare", "Schools"], keywords: ["realtor", "mortgage", "movers", "lender"], includeTypes: ["business", "neighborhood", "journey", "article"], contextNote: "Showing businesses, neighborhoods, and resources for your relocation" },
  },
  {
    pattern: /\b(realtor|real estate|home|buy|house|condo|mortgage|lend)\b/i,
    intent: { type: "home_buying", categories: ["Real Estate", "Finance", "Banking", "Legal", "Insurance"], keywords: ["realtor", "mortgage lender", "home inspector", "title company"], includeTypes: ["business", "article"], contextNote: "Showing real estate professionals and home buying resources" },
  },
  {
    pattern: /\b(doctor|physician|health|medical|clinic|hospital|specialist|dentist|dental)\b/i,
    intent: { type: "healthcare", categories: ["Healthcare", "Medical", "Dental", "Wellness", "Mental Health"], keywords: ["doctor", "physician", "specialist", "clinic"], includeTypes: ["business", "article", "event"], contextNote: "Showing healthcare providers and wellness resources" },
  },
  {
    pattern: /\b(diabet|chronic|condition|meds|medication|nutrition|nutritionist|health condition)\b/i,
    intent: { type: "chronic_care", categories: ["Healthcare", "Nutrition", "Wellness", "Pharmacy", "Mental Health"], keywords: ["specialist", "nutritionist", "support group", "diabetes education"], includeTypes: ["business", "event", "article"], contextNote: "Showing healthcare specialists, nutritionists, and support resources" },
  },
  {
    pattern: /\b(business|start|entrepreneur|LLC|register|permit|loan|funding|launch)\b/i,
    intent: { type: "business_start", categories: ["Finance", "Legal", "Banking", "Marketing", "Coworking", "Business Services"], keywords: ["business coach", "accountant", "attorney", "lender", "workspace"], includeTypes: ["business", "event", "article"], contextNote: "Showing business services, legal help, and funding resources" },
  },
  {
    pattern: /\b(baby|pregnant|pregnanc|newborn|infant|toddler|child|parent|daycare|pediatr)\b/i,
    intent: { type: "family", categories: ["Healthcare", "Childcare", "Baby", "Wellness", "Education", "Community"], keywords: ["pediatrician", "daycare", "midwife", "ob-gyn", "family support"], includeTypes: ["business", "event", "article"], contextNote: "Showing family and parenting resources" },
  },
  {
    pattern: /\b(eat|food|restaurant|cafe|coffee|brunch|dinner|lunch|takeout|delivery)\b/i,
    intent: { type: "dining", categories: ["Restaurant", "Café", "Food", "Bakery", "Bar"], keywords: ["restaurant", "cafe", "food", "brunch"], includeTypes: ["business", "event"], contextNote: "Showing Black-owned restaurants and food spots" },
  },
  {
    pattern: /\b(salon|hair|barber|grooming|nail|spa|beauty|skin)\b/i,
    intent: { type: "beauty", categories: ["Salon", "Barbershop", "Beauty", "Nail Salon", "Spa", "Skincare"], keywords: ["salon", "barber", "beautician", "nail tech"], includeTypes: ["business"], contextNote: "Showing Black-owned salons, barbershops, and beauty services" },
  },
  {
    pattern: /\b(event|festival|concert|networking|meet|conference|workshop|class)\b/i,
    intent: { type: "events", categories: ["Events", "Entertainment", "Education"], keywords: [], includeTypes: ["event", "business"], contextNote: "Showing community events and venues" },
  },
  {
    pattern: /\b(safe|safety|dangerous|neighborhood|area|community|vibe)\b/i,
    intent: { type: "neighborhood_intel", categories: ["Community", "Real Estate"], keywords: [], includeTypes: ["neighborhood", "article", "business"], contextNote: "Showing neighborhood safety insights and community resources" },
  },
  {
    pattern: /\b(college|university|campus|student|tutor|book|study|dorm)\b/i,
    intent: { type: "education", categories: ["Education", "Tutoring", "Books", "Coworking", "Food"], keywords: ["tutor", "study space", "bookstore"], includeTypes: ["business", "event", "article"], contextNote: "Showing educational resources and student essentials" },
  },
  {
    pattern: /\b(finance|money|budget|invest|financial|tax|account|credit|debt|loan)\b/i,
    intent: { type: "finance", categories: ["Finance", "Banking", "Legal", "Tax Preparation"], keywords: ["financial advisor", "accountant", "credit counselor"], includeTypes: ["business", "article", "event"], contextNote: "Showing financial professionals and money resources" },
  },
];

function detectIntent(query: string): SearchIntent {
  for (const { pattern, intent } of INTENT_PATTERNS) {
    if (pattern.test(query)) return intent;
  }
  return {
    type: "general",
    categories: [],
    keywords: [],
    includeTypes: ["business", "event", "article"],
    contextNote: "Showing businesses, events, and resources",
  };
}

router.post("/search/history", async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  if (!user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { query, type, categories = [] } = req.body as { query: string; type: string; categories?: string[] };
  if (!query?.trim() || !type) { res.status(400).json({ error: "query and type required" }); return; }
  try {
    const existing = await db.select({ searchHistory: userPreferencesTable.searchHistory })
      .from(userPreferencesTable).where(eq(userPreferencesTable.userId, user.id));
    const prev: Array<{ query: string; type: string; categories: string[]; ts: number }> =
      (existing[0]?.searchHistory ?? []) as Array<{ query: string; type: string; categories: string[]; ts: number }>;
    const deduped = prev.filter((e) => !(e.query.toLowerCase() === query.trim().toLowerCase() && e.type === type));
    const updated = [{ query: query.trim(), type, categories, ts: Date.now() }, ...deduped].slice(0, 30);
    await db.insert(userPreferencesTable)
      .values({ userId: user.id, searchHistory: updated })
      .onConflictDoUpdate({ target: userPreferencesTable.userId, set: { searchHistory: updated } });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save search history");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/search/history", async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  if (!user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { type } = req.query as { type?: string };
  try {
    const rows = await db.select({ searchHistory: userPreferencesTable.searchHistory })
      .from(userPreferencesTable).where(eq(userPreferencesTable.userId, user.id));
    const all = (rows[0]?.searchHistory ?? []) as Array<{ query: string; type: string; categories: string[]; ts: number }>;
    const filtered = type ? all.filter((e) => e.type === type) : all;
    res.json({ history: filtered });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch search history");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/search/intent", async (req: Request, res: Response) => {
  const { q, city, limit = "12", recentCategories } = req.query as Record<string, string>;

  if (!q?.trim()) {
    res.status(400).json({ error: "q (query) required" });
    return;
  }

  const intent = detectIntent(q);
  const lim = Math.min(parseInt(limit, 10), 30);
  const results: Record<string, unknown> = {};
  const recentCats = recentCategories
    ? recentCategories.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  try {
    if (intent.includeTypes.includes("business")) {
      const params: unknown[] = [`%${q}%`];
      let whereExtra = "";

      const boostCats = [...new Set([...recentCats, ...intent.categories])];
      if (boostCats.length > 0) {
        params.push(boostCats);
        whereExtra += ` OR category = ANY($${params.length})`;
      }
      if (city) {
        params.push(`%${city}%`);
        whereExtra += ` AND (city ILIKE $${params.length})`;
      }

      const boostParam = boostCats.length > 0 ? boostCats : null;
      if (boostParam) params.push(boostParam);
      const boostIdx = boostParam ? params.length : null;

      const bizRows = await pool.query<{ id: string; name: string; category: string; city: string; verified: boolean; description: string }>(
        `SELECT id, name, category, city, verified, description
         FROM businesses
         WHERE status = 'active'
           AND (name ILIKE $1 OR description ILIKE $1 OR tags::text ILIKE $1${whereExtra})
         ORDER BY ${boostIdx ? `CASE WHEN category = ANY($${boostIdx}) THEN 0 ELSE 1 END,` : ""} verified DESC, name ASC
         LIMIT ${lim}`,
        params,
      );
      results.businesses = bizRows.rows;
    }

    if (intent.includeTypes.includes("event")) {
      const eventParams: unknown[] = [`%${q}%`];
      if (city) { eventParams.push(`%${city}%`); }

      const eventRows = await pool.query<{ id: string; title: string; category: string; city: string; date: string }>(
        `SELECT id, title, category, city, date
         FROM events
         WHERE status = 'active'
           AND (title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1${city ? ` AND city ILIKE $2` : ""})
         ORDER BY date ASC
         LIMIT 6`,
        eventParams,
      ).catch(() => ({ rows: [] }));
      results.events = eventRows.rows;
    }

    if (intent.includeTypes.includes("article")) {
      const articleRows = await pool.query<{ id: string; title: string; category: string; excerpt: string }>(
        `SELECT id, title, category, excerpt FROM knowledge_articles WHERE published = true AND (title ILIKE $1 OR content ILIKE $1 OR category ILIKE $1) ORDER BY created_at DESC LIMIT 4`,
        [`%${q}%`],
      ).catch(() => ({ rows: [] }));
      results.articles = articleRows.rows;
    }

    if (intent.includeTypes.includes("journey")) {
      const journeyTypeMap: Record<string, string> = {
        relocation: "moving", home_buying: "moving", family: "new-baby", business_start: "starting-business",
        education: "college", finance: "career-change",
      };
      const suggestedJourney = journeyTypeMap[intent.type];
      if (suggestedJourney) {
        results.journeySuggestion = {
          type: suggestedJourney,
          message: `Start a "${suggestedJourney.replace("-", " ")}" journey to get a personalized step-by-step guide`,
        };
      }
    }

    if (intent.includeTypes.includes("neighborhood")) {
      results.neighborhoods = [];
    }

    res.json({
      query: q,
      intent: intent.type,
      contextNote: intent.contextNote,
      suggestedCategories: intent.categories.slice(0, 5),
      results,
    });
  } catch (err) {
    req.log.error({ err }, "Smart search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/search/suggest", async (req: Request, res: Response) => {
  const { q, city } = req.query as Record<string, string>;
  if (!q?.trim() || q.length < 2) { res.json({ suggestions: [] }); return; }

  try {
    const params: unknown[] = [`${q}%`];
    if (city) params.push(`%${city}%`);

    const rows = await pool.query<{ name: string; category: string }>(
      `SELECT DISTINCT name, category FROM businesses WHERE status = 'active' AND name ILIKE $1 ${city ? "AND city ILIKE $2" : ""} ORDER BY name ASC LIMIT 8`,
      params,
    );
    res.json({ suggestions: rows.rows });
  } catch {
    res.json({ suggestions: [] });
  }
});

export default router;
