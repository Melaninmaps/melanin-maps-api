import { Router, type IRouter, type Request, type Response } from "express";
import { db, communitySignalsTable, businessesTable, lifeJourneysTable, type JourneyPhase } from "@workspace/db";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.post("/signals", async (req: Request, res: Response) => {
  const { entityId, entityType, signalType, city, journeyType, context } = req.body as Record<string, unknown>;

  if (!entityId || !entityType || !signalType) {
    res.status(400).json({ error: "entityId, entityType, signalType required" });
    return;
  }

  try {
    db.insert(communitySignalsTable)
      .values({
        userId: req.user?.id ?? null,
        entityId: entityId as string,
        entityType: entityType as any,
        signalType: signalType as any,
        city: typeof city === "string" ? city : null,
        journeyType: typeof journeyType === "string" ? journeyType : null,
        context: typeof context === "object" && context !== null ? (context as Record<string, unknown>) : undefined,
      })
      .execute()
      .catch(() => { /* fire and forget */ });

    res.status(202).json({ ok: true });
  } catch {
    res.status(202).json({ ok: true });
  }
});

router.get("/intelligence/trending", async (req: Request, res: Response) => {
  const { city, signalType = "save", limit = "10" } = req.query as Record<string, string>;

  try {
    const rows = await pool.query<{ entity_id: string; entity_type: string; signal_count: string }>(
      `SELECT entity_id, entity_type, COUNT(*) as signal_count
       FROM community_signals
       WHERE signal_type = $1
         AND entity_type = 'business'
         ${city ? "AND city ILIKE $3" : ""}
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY entity_id, entity_type
       ORDER BY signal_count DESC
       LIMIT $2`,
      city ? [signalType, parseInt(limit, 10), `%${city}%`] : [signalType, parseInt(limit, 10)],
    );

    const entityIds = rows.rows.map((r) => r.entity_id);
    if (entityIds.length === 0) {
      res.json({ trending: [] });
      return;
    }

    const businesses = await pool.query<{ id: string; name: string; category: string; city: string; verified: boolean }>(
      `SELECT id, name, category, city, verified FROM businesses WHERE id = ANY($1) AND status = 'active'`,
      [entityIds],
    );

    const bizMap = new Map(businesses.rows.map((b) => [b.id, b]));
    const trending = rows.rows
      .map((r) => ({ ...bizMap.get(r.entity_id), signalCount: parseInt(r.signal_count, 10) }))
      .filter((r) => r.id);

    res.json({ trending });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch trending");
    res.status(500).json({ error: "Failed to fetch trending" });
  }
});

router.get("/intelligence/journey-patterns", async (req: Request, res: Response) => {
  const { journeyType, city, limit = "8" } = req.query as Record<string, string>;

  if (!journeyType) {
    res.status(400).json({ error: "journeyType required" });
    return;
  }

  try {
    const rows = await pool.query<{ entity_id: string; entity_type: string; signal_count: string }>(
      `SELECT entity_id, entity_type, COUNT(*) as signal_count
       FROM community_signals
       WHERE journey_type = $1
         AND entity_type = 'business'
         ${city ? "AND city ILIKE $3" : ""}
         AND created_at > NOW() - INTERVAL '90 days'
       GROUP BY entity_id, entity_type
       ORDER BY signal_count DESC
       LIMIT $2`,
      city ? [journeyType, parseInt(limit, 10), `%${city}%`] : [journeyType, parseInt(limit, 10)],
    );

    const entityIds = rows.rows.map((r) => r.entity_id);
    if (entityIds.length === 0) {
      res.json({ pattern: `People on a ${journeyType} journey are actively exploring — be one of the first to discover your community.`, businesses: [] });
      return;
    }

    const businesses = await pool.query<{ id: string; name: string; category: string; city: string; verified: boolean }>(
      `SELECT id, name, category, city, verified FROM businesses WHERE id = ANY($1) AND status = 'active'`,
      [entityIds],
    );

    const bizMap = new Map(businesses.rows.map((b) => [b.id, b]));
    const businesses_out = rows.rows
      .map((r) => ({ ...bizMap.get(r.entity_id), signalCount: parseInt(r.signal_count, 10) }))
      .filter((r) => r.id);

    const topCategories = [...new Set(businesses_out.map((b: any) => b.category).filter(Boolean))].slice(0, 4);
    const pattern = businesses_out.length > 0
      ? `Others on a ${journeyType} journey${city ? ` in ${city}` : ""} frequently save ${topCategories.join(", ")} businesses.`
      : `Be one of the first to discover community gems for your ${journeyType} journey.`;

    res.json({ pattern, businesses: businesses_out });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch journey patterns");
    res.status(500).json({ error: "Failed to fetch journey patterns" });
  }
});

router.get("/intelligence/entity/:id", async (req: Request, res: Response) => {
  const entityId = String(req.params.id);
  try {
    const rows = await pool.query<{ signal_type: string; signal_count: string }>(
      `SELECT signal_type, COUNT(*) as signal_count
       FROM community_signals
       WHERE entity_id = $1
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY signal_type`,
      [entityId],
    );
    const signals: Record<string, number> = {};
    rows.rows.forEach((r) => { signals[r.signal_type] = parseInt(r.signal_count, 10); });
    res.json({ entityId, signals });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch entity intelligence");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
