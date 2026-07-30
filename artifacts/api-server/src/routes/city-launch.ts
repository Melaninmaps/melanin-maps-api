import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import type { ChecklistSection } from "@workspace/db";

const router: IRouter = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /admin/city-launches
// List all founder-approved launch cities with live metrics
// ──────────────────────────────────────────────────────────────────────────────
router.get("/admin/city-launches", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const { rows: cities } = await pool.query<{
      id: string;
      city: string;
      state: string;
      slug: string;
      sequence_order: number;
      status: string;
      launch_date: string | null;
      checklist: ChecklistSection;
      notes: string | null;
      rollout_percentage: number;
      created_at: string;
      updated_at: string;
    }>(`SELECT * FROM city_launches ORDER BY sequence_order ASC`);

    // Fetch aggregate metrics for all cities in one pass
    const { rows: waitlistStats } = await pool.query<{ city: string; cnt: string }>(
      `SELECT LOWER(TRIM(city)) as city, COUNT(*) as cnt FROM waitlist GROUP BY LOWER(TRIM(city))`
    );
    const { rows: userStats } = await pool.query<{ city: string; cnt: string }>(
      `SELECT LOWER(TRIM(home_city)) as city, COUNT(*) as cnt FROM users WHERE approved = true AND home_city IS NOT NULL GROUP BY LOWER(TRIM(home_city))`
    );
    const { rows: bizStats } = await pool.query<{ city: string; cnt: string }>(
      `SELECT LOWER(TRIM(city)) as city, COUNT(*) as cnt FROM businesses WHERE status = 'active' GROUP BY LOWER(TRIM(city))`
    );
    const { rows: eventStats } = await pool.query<{ city: string; cnt: string }>(
      `SELECT LOWER(TRIM(city)) as city, COUNT(*) as cnt FROM events WHERE city IS NOT NULL GROUP BY LOWER(TRIM(city))`
    );
    const { rows: postStats } = await pool.query<{ city: string; cnt: string }>(
      `SELECT LOWER(TRIM(location_city)) as city, COUNT(*) as cnt FROM community_posts WHERE location_city IS NOT NULL GROUP BY LOWER(TRIM(location_city))`
    );

    const toMap = (rows: { city: string; cnt: string }[]) =>
      Object.fromEntries(rows.map(r => [r.city, parseInt(r.cnt, 10)]));

    const waitlistMap = toMap(waitlistStats);
    const userMap = toMap(userStats);
    const bizMap = toMap(bizStats);
    const eventMap = toMap(eventStats);
    const postMap = toMap(postStats);

    const result = cities.map(c => {
      const key = c.city.toLowerCase();
      const checklist = c.checklist as ChecklistSection;
      const allItems = [
        ...Object.values(checklist.pre_launch),
        ...Object.values(checklist.community),
        ...Object.values(checklist.marketing),
        ...Object.values(checklist.operations),
      ];
      const completedItems = allItems.filter(Boolean).length;
      return {
        id: c.id,
        city: c.city,
        state: c.state,
        slug: c.slug,
        sequenceOrder: c.sequence_order,
        status: c.status,
        launchDate: c.launch_date,
        checklist,
        notes: c.notes,
        rolloutPercentage: c.rollout_percentage,
        checklistProgress: {
          completed: completedItems,
          total: allItems.length,
          pct: Math.round((completedItems / allItems.length) * 100),
        },
        metrics: {
          waitlistSize: waitlistMap[key] ?? 0,
          activeMembers: userMap[key] ?? 0,
          businessesOnboarded: bizMap[key] ?? 0,
          eventsLive: eventMap[key] ?? 0,
          ambassadorCount: 0, // future: ambassador table
          communityPosts: postMap[key] ?? 0,
        },
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    });

    res.json({ cities: result });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch city launches");
    res.status(500).json({ error: "Failed to fetch city launches" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /admin/city-launches/:slug/checklist
// Toggle a single checklist item
// Body: { section: "pre_launch", item: "businesses_seeded", value: true }
// ──────────────────────────────────────────────────────────────────────────────
router.patch("/admin/city-launches/:slug/checklist", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const { slug } = req.params;
  const { section, item, value } = req.body as {
    section: keyof ChecklistSection;
    item: string;
    value: boolean;
  };

  const validSections: (keyof ChecklistSection)[] = ["pre_launch", "community", "marketing", "operations"];
  if (!validSections.includes(section)) {
    res.status(400).json({ error: "Invalid section" }); return;
  }
  if (typeof value !== "boolean") {
    res.status(400).json({ error: "value must be a boolean" }); return;
  }

  try {
    const { rows } = await pool.query<{ checklist: ChecklistSection }>(
      `SELECT checklist FROM city_launches WHERE slug = $1`,
      [slug]
    );
    if (!rows[0]) { res.status(404).json({ error: "City not found" }); return; }

    const checklist = rows[0].checklist as ChecklistSection;
    const sectionObj = checklist[section] as Record<string, boolean>;
    if (!(item in sectionObj)) {
      res.status(400).json({ error: `Unknown item "${item}" in section "${section}"` }); return;
    }
    sectionObj[item] = value;

    await pool.query(
      `UPDATE city_launches SET checklist = $1, updated_at = NOW() WHERE slug = $2`,
      [JSON.stringify(checklist), slug]
    );

    res.json({ ok: true, checklist });
  } catch (err) {
    req.log.error({ err }, "Failed to update city checklist");
    res.status(500).json({ error: "Failed to update checklist" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /admin/city-launches/:slug/status
// Update launch status, rollout percentage, or notes
// ──────────────────────────────────────────────────────────────────────────────
router.patch("/admin/city-launches/:slug/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const { slug } = req.params;
  const { status, rolloutPercentage, notes, launchDate } = req.body as {
    status?: string;
    rolloutPercentage?: number;
    notes?: string;
    launchDate?: string | null;
  };

  const validStatuses = ["planning", "pre_launch", "soft_launch", "live", "paused"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  if (rolloutPercentage !== undefined && (rolloutPercentage < 0 || rolloutPercentage > 100)) {
    res.status(400).json({ error: "rolloutPercentage must be 0–100" }); return;
  }

  try {
    const sets: string[] = ["updated_at = NOW()"];
    const vals: unknown[] = [];
    let i = 1;

    if (status) { sets.push(`status = $${i++}`); vals.push(status); }
    if (rolloutPercentage !== undefined) { sets.push(`rollout_percentage = $${i++}`); vals.push(rolloutPercentage); }
    if (notes !== undefined) { sets.push(`notes = $${i++}`); vals.push(notes); }
    if (launchDate !== undefined) { sets.push(`launch_date = $${i++}`); vals.push(launchDate ?? null); }

    vals.push(slug);
    const { rowCount } = await pool.query(
      `UPDATE city_launches SET ${sets.join(", ")} WHERE slug = $${i}`,
      vals
    );

    if (!rowCount) { res.status(404).json({ error: "City not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update city status");
    res.status(500).json({ error: "Failed to update city status" });
  }
});

export default router;
