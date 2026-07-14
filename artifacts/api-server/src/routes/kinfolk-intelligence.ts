import { Router, type Request, type Response } from "express";
import { db, pool } from "@workspace/db";
import {
  savedPlacesTable,
  businessesTable,
  kinfolkSearchEventsTable,
  kinfolkTwinRecsTable,
  userPreferencesTable,
} from "@workspace/db/schema";
import { eq, and, inArray, ne, sql, desc, gte, count } from "drizzle-orm";
import * as SecureStore from "expo-secure-store";

const router = Router();

function authed(req: Request, res: Response): boolean {
  if (!(req as any).userId) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}
function uid(req: Request): string { return (req as any).userId as string; }

// ─── Log Search Event ────────────────────────────────────────────────────────
// POST /api/kinfolk/log-search
router.post("/kinfolk/log-search", async (req: Request, res: Response) => {
  const { query, category, city, state } = req.body as Record<string, unknown>;
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    res.json({ ok: true }); return;
  }
  try {
    await db.insert(kinfolkSearchEventsTable).values({
      userId: (req as any).userId ?? null,
      query: String(query).trim().toLowerCase().slice(0, 200),
      category: category ? String(category).slice(0, 100) : null,
      city: city ? String(city).slice(0, 100) : null,
      state: state ? String(state).slice(0, 50) : null,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /kinfolk/log-search error");
    res.json({ ok: true });
  }
});

// ─── Algorithmic Twin Recommendations ────────────────────────────────────────
// GET /api/kinfolk/twin-recommendations
// Collaborative filtering: find users with similar saves → surface their saves
router.get("/kinfolk/twin-recommendations", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const userId = uid(req);
  try {
    // 1. Get current user's saved business IDs
    const mySaves = await db.select({ businessId: savedPlacesTable.businessId })
      .from(savedPlacesTable)
      .where(eq(savedPlacesTable.userId, userId));
    const myIds = mySaves.map((s) => s.businessId);

    if (myIds.length < 2) {
      // Not enough saves to compute twins — return trending businesses instead
      const trending = await db.select({
        businessId: savedPlacesTable.businessId,
        saveCount: count(savedPlacesTable.businessId),
      })
        .from(savedPlacesTable)
        .where(ne(savedPlacesTable.userId, userId))
        .groupBy(savedPlacesTable.businessId)
        .orderBy(desc(count(savedPlacesTable.businessId)))
        .limit(10);

      const trendIds = trending.map((t) => t.businessId);
      if (!trendIds.length) { res.json({ recommendations: [], source: "trending" }); return; }
      const businesses = await db.select().from(businessesTable).where(inArray(businessesTable.id, trendIds));
      const bizMap = Object.fromEntries(businesses.map((b) => [b.id, b]));
      res.json({
        recommendations: trendIds
          .filter((id) => bizMap[id])
          .map((id) => ({ business: bizMap[id], score: 1, twinCount: trending.find((t) => t.businessId === id)?.saveCount ?? 1, twinCities: [], reason: "Community favorite" })),
        source: "trending",
      });
      return;
    }

    // 2. Find "twin" users — those who saved 2+ of the same businesses
    const twinRows = await pool.query<{ user_id: string; overlap: number }>(
      `SELECT sp.user_id, COUNT(*) AS overlap
       FROM saved_places sp
       WHERE sp.business_id = ANY($1) AND sp.user_id <> $2
       GROUP BY sp.user_id
       HAVING COUNT(*) >= 2
       ORDER BY COUNT(*) DESC
       LIMIT 100`,
      [myIds, userId],
    );
    const twins = twinRows.rows;
    if (!twins.length) {
      res.json({ recommendations: [], source: "no_twins" }); return;
    }

    const twinIds = twins.map((t) => t.user_id);

    // 3. Get all saves of those twins, excluding what current user already saved
    const twinSaves = await pool.query<{ business_id: string; user_id: string }>(
      `SELECT sp.business_id, sp.user_id
       FROM saved_places sp
       WHERE sp.user_id = ANY($1) AND sp.business_id <> ALL($2)`,
      [twinIds, myIds],
    );

    // 4. Score each business: sum of overlap counts for each twin who saved it
    const scoreMap: Record<string, { score: number; twinCount: number; twinUserIds: Set<string> }> = {};
    const twinOverlapMap = Object.fromEntries(twins.map((t) => [t.user_id, Number(t.overlap)]));
    for (const row of twinSaves.rows) {
      if (!scoreMap[row.business_id]) {
        scoreMap[row.business_id] = { score: 0, twinCount: 0, twinUserIds: new Set() };
      }
      const overlap = twinOverlapMap[row.user_id] ?? 1;
      scoreMap[row.business_id].score += overlap;
      scoreMap[row.business_id].twinCount += 1;
      scoreMap[row.business_id].twinUserIds.add(row.user_id);
    }

    const sortedIds = Object.entries(scoreMap)
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 12)
      .map(([id]) => id);

    if (!sortedIds.length) { res.json({ recommendations: [], source: "scored" }); return; }

    // 5. Fetch business details + twin cities
    const [businesses, twinLocations] = await Promise.all([
      db.select().from(businessesTable).where(inArray(businessesTable.id, sortedIds)),
      pool.query<{ user_id: string; city: string | null; state: string | null }>(
        `SELECT sp.user_id, b.city, b.state
         FROM saved_places sp
         JOIN businesses b ON b.id = sp.business_id
         WHERE sp.user_id = ANY($1)
         AND sp.business_id = ANY($2)
         AND b.city IS NOT NULL
         GROUP BY sp.user_id, b.city, b.state
         LIMIT 200`,
        [twinIds, myIds],
      ),
    ]);

    // Build twin city map per business
    const twinCityMap: Record<string, Set<string>> = {};
    for (const row of twinLocations.rows) {
      for (const bizId of sortedIds) {
        if (scoreMap[bizId]?.twinUserIds.has(row.user_id)) {
          if (!twinCityMap[bizId]) twinCityMap[bizId] = new Set();
          if (row.city) twinCityMap[bizId].add(row.city);
        }
      }
    }

    const bizMap = Object.fromEntries(businesses.map((b) => [b.id, b]));
    const maxScore = Math.max(...Object.values(scoreMap).map((s) => s.score), 1);

    const recommendations = sortedIds
      .filter((id) => bizMap[id])
      .map((id) => {
        const entry = scoreMap[id];
        const normalizedScore = entry.score / maxScore;
        const cities = Array.from(twinCityMap[id] ?? []).slice(0, 3);
        const twinCount = entry.twinCount;
        const reason = twinCount === 1
          ? "Someone with your taste loved this"
          : `${twinCount} people with your taste saved this`;
        return { business: bizMap[id], score: normalizedScore, twinCount, twinCities: cities, reason };
      });

    res.json({ recommendations, source: "collaborative_filtering" });
  } catch (err) {
    req.log.error({ err }, "GET /kinfolk/twin-recommendations error");
    res.status(500).json({ error: "Failed to load recommendations" });
  }
});

// ─── Community Trends ────────────────────────────────────────────────────────
// GET /api/kinfolk/community-trends?city=X&state=Y
router.get("/kinfolk/community-trends", async (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;
  const state = req.query.state as string | undefined;

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Top saved categories in this area (last 30 days)
    const categorySavesRows = await pool.query<{ category: string; save_count: number }>(
      `SELECT b.category, COUNT(*) AS save_count
       FROM saved_places sp
       JOIN businesses b ON b.id = sp.business_id
       WHERE sp.created_at >= $1
       ${city ? "AND LOWER(b.city) = LOWER($2)" : ""}
       ${state && city ? "AND LOWER(b.state) = LOWER($3)" : state ? "AND LOWER(b.state) = LOWER($2)" : ""}
       GROUP BY b.category
       ORDER BY save_count DESC
       LIMIT 10`,
      [since, ...(city ? [city] : []), ...(state ? [state] : [])].filter(Boolean),
    );

    // Trending search keywords in this area (last 30 days)
    const searchTrendRows = await pool.query<{ query: string; search_count: number }>(
      `SELECT query, COUNT(*) AS search_count
       FROM kinfolk_search_events
       WHERE created_at >= $1 AND LENGTH(query) >= 3
       ${city ? "AND LOWER(city) = LOWER($2)" : ""}
       ${state && city ? "AND LOWER(state) = LOWER($3)" : state ? "AND LOWER(state) = LOWER($2)" : ""}
       GROUP BY query
       ORDER BY search_count DESC
       LIMIT 15`,
      [since, ...(city ? [city] : []), ...(state ? [state] : [])].filter(Boolean),
    );

    // Previous 30-day window for trend comparison
    const prevSince = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const prevCatRows = await pool.query<{ category: string; save_count: number }>(
      `SELECT b.category, COUNT(*) AS save_count
       FROM saved_places sp
       JOIN businesses b ON b.id = sp.business_id
       WHERE sp.created_at >= $1 AND sp.created_at < $2
       ${city ? "AND LOWER(b.city) = LOWER($3)" : ""}
       GROUP BY b.category`,
      [prevSince, since, ...(city ? [city] : [])].filter(Boolean),
    );

    const prevMap = Object.fromEntries(prevCatRows.rows.map((r) => [r.category, Number(r.save_count)]));

    const trendingCategories = categorySavesRows.rows.map((r) => {
      const prev = prevMap[r.category] ?? 0;
      const current = Number(r.save_count);
      const growth = prev > 0 ? Math.round(((current - prev) / prev) * 100) : null;
      return { category: r.category, saveCount: current, growth, isRising: growth !== null && growth > 10 };
    });

    const trendingSearches = searchTrendRows.rows.map((r) => ({
      query: r.query,
      searchCount: Number(r.search_count),
    }));

    res.json({ trendingCategories, trendingSearches, city, state, period: "last_30_days" });
  } catch (err) {
    req.log.error({ err }, "GET /kinfolk/community-trends error");
    res.status(500).json({ error: "Failed to load trends" });
  }
});

// ─── Business Market Insights ─────────────────────────────────────────────────
// GET /api/businesses/:id/market-insights
router.get("/businesses/:id/market-insights", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const businessId = req.params.id as string;
  try {
    const [bizResult] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId));
    if (!bizResult) { res.status(404).json({ error: "Business not found" }); return; }

    // Ownership check
    const ownership = await pool.query(
      "SELECT id FROM business_identity WHERE business_id = $1 AND user_id = $2 LIMIT 1",
      [businessId, uid(req)],
    );
    if (!ownership.rows.length) { res.status(403).json({ error: "Not authorized" }); return; }

    const { city, state, category } = bizResult;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. What people in this city are searching for (trending keywords)
    const localSearches = await pool.query<{ query: string; search_count: number }>(
      `SELECT query, COUNT(*) AS search_count
       FROM kinfolk_search_events
       WHERE created_at >= $1
       AND (LOWER(city) = LOWER($2) OR LOWER(state) = LOWER($3))
       AND LENGTH(query) >= 3
       GROUP BY query
       ORDER BY search_count DESC
       LIMIT 20`,
      [since, city, state],
    );

    // 2. Most saved categories in this city (shows what people want)
    const localCategoryDemand = await pool.query<{ category: string; save_count: number }>(
      `SELECT b.category, COUNT(*) AS save_count
       FROM saved_places sp
       JOIN businesses b ON b.id = sp.business_id
       WHERE sp.created_at >= $1
       AND (LOWER(b.city) = LOWER($2) OR LOWER(b.state) = LOWER($3))
       GROUP BY b.category
       ORDER BY save_count DESC
       LIMIT 10`,
      [since, city, state],
    );

    // 3. How many people saved this specific business (vs. peers)
    const myStats = await pool.query<{ my_saves: number; my_views: number }>(
      `SELECT
         (SELECT COUNT(*) FROM saved_places WHERE business_id = $1 AND created_at >= $2) AS my_saves,
         (SELECT COUNT(*) FROM business_profile_views WHERE business_id = $1 AND viewed_at >= $2) AS my_views`,
      [businessId, since],
    );

    const peerStats = await pool.query<{ avg_saves: number }>(
      `SELECT ROUND(AVG(save_count), 1) AS avg_saves FROM (
         SELECT COUNT(*) AS save_count
         FROM saved_places sp
         JOIN businesses b ON b.id = sp.business_id
         WHERE b.category = $1
         AND (LOWER(b.city) = LOWER($2) OR LOWER(b.state) = LOWER($3))
         AND sp.created_at >= $4
         AND b.id <> $5
         GROUP BY b.id
       ) sub`,
      [category, city, state, since, businessId],
    );

    // 4. Opportunity alerts: top searches in area that aren't well-served by this business
    const topSearchQueries = localSearches.rows.slice(0, 10).map((r) => r.query);
    const opportunities: { keyword: string; searchCount: number; alert: string }[] = [];
    for (const row of localSearches.rows.slice(0, 8)) {
      const keyword = row.query;
      const searchCount = Number(row.search_count);
      if (searchCount >= 2) {
        opportunities.push({
          keyword,
          searchCount,
          alert: `${searchCount} people in your area searched for "${keyword}" recently — consider featuring this or creating an announcement!`,
        });
      }
    }

    // 5. Target audience match: % of users in area whose preferences align
    const audienceMatchResult = await pool.query<{ match_count: number }>(
      `SELECT COUNT(*) AS match_count
       FROM user_preferences up
       WHERE $1 = ANY(up.favorite_categories::text[])
       OR $1 = ANY(up.lifestyle_services::text[])`,
      [category],
    );
    const audienceMatchCount = Number(audienceMatchResult.rows[0]?.match_count ?? 0);

    res.json({
      business: { id: businessId, name: bizResult.name, city, state, category },
      period: "last_30_days",
      myPerformance: {
        saves: Number(myStats.rows[0]?.my_saves ?? 0),
        views: Number(myStats.rows[0]?.my_views ?? 0),
        peerAvgSaves: Number(peerStats.rows[0]?.avg_saves ?? 0),
      },
      localDemand: localCategoryDemand.rows.map((r) => ({
        category: r.category,
        saveCount: Number(r.save_count),
        isYourCategory: r.category === category,
      })),
      trendingSearches: localSearches.rows.map((r) => ({ query: r.query, searchCount: Number(r.search_count) })),
      opportunityAlerts: opportunities,
      audienceMatchCount,
    });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/:id/market-insights error");
    res.status(500).json({ error: "Failed to load market insights" });
  }
});

// ─── Target Audience ─────────────────────────────────────────────────────────
// GET /api/businesses/:id/target-audience
router.get("/businesses/:id/target-audience", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const businessId = req.params.id as string;
  try {
    const [biz] = await db.select({ id: businessesTable.id, targetAudience: businessesTable.targetAudience })
      .from(businessesTable).where(eq(businessesTable.id, businessId));
    if (!biz) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ targetAudience: biz.targetAudience ?? null });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/:id/target-audience error");
    res.status(500).json({ error: "Failed to load target audience" });
  }
});

// PATCH /api/businesses/:id/target-audience
router.patch("/businesses/:id/target-audience", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const businessId = req.params.id as string;
  const { keywords, demographics, occasions, ageRanges, primaryCity, primaryState, description } = req.body as Record<string, unknown>;
  try {
    const ownership = await pool.query(
      "SELECT id FROM business_identity WHERE business_id = $1 AND user_id = $2 LIMIT 1",
      [businessId, uid(req)],
    );
    if (!ownership.rows.length) { res.status(403).json({ error: "Not authorized" }); return; }
    await db.update(businessesTable)
      .set({
        targetAudience: {
          keywords: Array.isArray(keywords) ? (keywords as string[]).slice(0, 20) : [],
          demographics: Array.isArray(demographics) ? (demographics as string[]).slice(0, 10) : [],
          occasions: Array.isArray(occasions) ? (occasions as string[]).slice(0, 10) : [],
          ageRanges: Array.isArray(ageRanges) ? (ageRanges as string[]).slice(0, 5) : [],
          primaryCity: primaryCity ? String(primaryCity) : undefined,
          primaryState: primaryState ? String(primaryState) : undefined,
          description: description ? String(description).slice(0, 500) : undefined,
        },
      })
      .where(eq(businessesTable.id, businessId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PATCH /businesses/:id/target-audience error");
    res.status(500).json({ error: "Failed to save target audience" });
  }
});

export default router;
