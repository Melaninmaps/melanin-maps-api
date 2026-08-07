import { Router, type IRouter, type Request, type Response } from "express";
import { pool, getPoolStats } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import type { ChecklistSection } from "@workspace/db";

const router: IRouter = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /city-launches  (public — safe subset of fields, no admin metrics)
// Used by the web and mobile map to know which cities are live or coming soon.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/city-launches", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<{
      city: string;
      state: string;
      slug: string;
      status: string;
      launch_date: string | null;
      sequence_order: number;
    }>(
      `SELECT city, state, slug, status, launch_date, sequence_order
       FROM city_launches
       ORDER BY sequence_order ASC`
    );

    const cities = rows.map(r => ({
      city: r.city,
      state: r.state,
      slug: r.slug,
      status: r.status,
      launchDate: r.launch_date,
      sequenceOrder: r.sequence_order,
    }));

    res.json({ cities });
  } catch (err) {
    res.status(500).json({ error: "Failed to load city launches" });
  }
});

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
      auto_advance: boolean;
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
      `SELECT LOWER(TRIM(city)) as city, COUNT(*) as cnt FROM businesses WHERE status = 'active' AND listing_status IN ('live_unclaimed', 'live_claimed') GROUP BY LOWER(TRIM(city))`
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

    // Pool stats are read without a DB query — safe to include in every response
    const ps = getPoolStats();

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

      const activeMembers = userMap[key] ?? 0;
      const communityPosts = postMap[key] ?? 0;
      const isActiveLive = ["live", "soft_launch"].includes(c.status);

      // Lightweight health level — no extra DB query needed
      const healthLevel: "ok" | "warning" | "critical" =
        ps.waiting > 3 ? "critical"
        : ps.waiting > 0 ? "warning"
        : (isActiveLive && activeMembers === 0 && communityPosts === 0) ? "warning"
        : "ok";

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
        autoAdvance: c.auto_advance,
        healthLevel,
        checklistProgress: {
          completed: completedItems,
          total: allItems.length,
          pct: Math.round((completedItems / allItems.length) * 100),
        },
        metrics: {
          waitlistSize: waitlistMap[key] ?? 0,
          activeMembers,
          businessesOnboarded: bizMap[key] ?? 0,
          eventsLive: eventMap[key] ?? 0,
          ambassadorCount: 0, // future: ambassador table
          communityPosts,
        },
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    });

    res.json({ cities: result });

    // Fire-and-forget: upsert today's snapshot for all cities
    // First call of the day records baseline; subsequent calls update to highest seen value
    void (async () => {
      try {
        for (const c of result) {
          await pool.query(
            `INSERT INTO city_launch_events
               (slug, recorded_at, waitlist_size, active_members, businesses_onboarded, events_live, community_posts)
             VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
             ON CONFLICT (slug, recorded_at) DO UPDATE SET
               waitlist_size        = GREATEST(EXCLUDED.waitlist_size,        city_launch_events.waitlist_size),
               active_members       = GREATEST(EXCLUDED.active_members,       city_launch_events.active_members),
               businesses_onboarded = GREATEST(EXCLUDED.businesses_onboarded, city_launch_events.businesses_onboarded),
               events_live          = GREATEST(EXCLUDED.events_live,          city_launch_events.events_live),
               community_posts      = GREATEST(EXCLUDED.community_posts,      city_launch_events.community_posts)`,
            [
              c.slug,
              c.metrics.waitlistSize,
              c.metrics.activeMembers,
              c.metrics.businessesOnboarded,
              c.metrics.eventsLive,
              c.metrics.communityPosts,
            ]
          );
        }
      } catch {
        // snapshot failures are non-critical; server keeps running
      }
    })();
  } catch (err) {
    req.log.error({ err }, "Failed to fetch city launches");
    res.status(500).json({ error: "Failed to fetch city launches" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /admin/city-launches/:slug/health
// Returns pool stats + city-scoped activity signals for the last 24 h / 7 d
// ──────────────────────────────────────────────────────────────────────────────
router.get("/admin/city-launches/:slug/health", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const { slug } = req.params;

  try {
    const { rows: cityRows } = await pool.query<{ city: string; status: string }>(
      `SELECT city, status FROM city_launches WHERE slug = $1`, [slug]
    );
    if (!cityRows[0]) { res.status(404).json({ error: "City not found" }); return; }

    const cityName = cityRows[0].city.toLowerCase();
    const cityStatus = cityRows[0].status;

    // Pool stats — no DB round-trip needed
    const ps = getPoolStats();

    // DB response time probe (single lightweight query)
    const probeStart = Date.now();
    await pool.query(`SELECT 1`);
    const probeMs = Date.now() - probeStart;

    // City activity — run sequentially to avoid parallel pool pressure
    const { rows: s24h } = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM users WHERE LOWER(TRIM(home_city)) = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [cityName]
    );
    const { rows: s7d } = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM users WHERE LOWER(TRIM(home_city)) = $1 AND created_at > NOW() - INTERVAL '7 days'`,
      [cityName]
    );
    const { rows: p24h } = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM community_posts WHERE LOWER(TRIM(location_city)) = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [cityName]
    );
    const { rows: p7d } = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM community_posts WHERE LOWER(TRIM(location_city)) = $1 AND created_at > NOW() - INTERVAL '7 days'`,
      [cityName]
    );
    const { rows: w24h } = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM waitlist WHERE LOWER(TRIM(city)) = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [cityName]
    );

    const activity = {
      signups24h:        parseInt(s24h[0]?.cnt ?? "0", 10),
      signups7d:         parseInt(s7d[0]?.cnt  ?? "0", 10),
      posts24h:          parseInt(p24h[0]?.cnt  ?? "0", 10),
      posts7d:           parseInt(p7d[0]?.cnt   ?? "0", 10),
      waitlistSignups24h: parseInt(w24h[0]?.cnt ?? "0", 10),
    };

    // ── Build health signals ─────────────────────────────────────────────────
    type SignalLevel = "ok" | "warning" | "critical";
    const signals: { level: SignalLevel; message: string }[] = [];

    if (ps.waiting > 3)  signals.push({ level: "critical", message: `DB pool pressure: ${ps.waiting} connections waiting` });
    else if (ps.waiting > 0) signals.push({ level: "warning", message: `DB pool elevated: ${ps.waiting} waiting (${ps.total} total)` });

    if (probeMs > 1000) signals.push({ level: "critical", message: `DB slow: ${probeMs}ms round-trip` });
    else if (probeMs > 300) signals.push({ level: "warning", message: `DB response elevated: ${probeMs}ms` });

    const isActiveLive = ["live", "soft_launch"].includes(cityStatus);
    if (isActiveLive) {
      if (activity.signups7d === 0)
        signals.push({ level: "warning", message: "No new member sign-ups in the last 7 days" });
      if (activity.posts7d === 0)
        signals.push({ level: "warning", message: "No community posts in the last 7 days" });
    }

    if (signals.length === 0) signals.push({ level: "ok", message: "All systems healthy" });

    const level: SignalLevel =
      signals.some(s => s.level === "critical") ? "critical"
      : signals.some(s => s.level === "warning")  ? "warning"
      : "ok";

    res.json({ slug, level, signals, probeMs, poolStats: ps, activity, cityStatus, checkedAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch city health");
    res.status(500).json({ error: "Failed to fetch city health" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /admin/city-launches/:slug/trend
// Return last 30 days of daily snapshots for a city
// ──────────────────────────────────────────────────────────────────────────────
router.get("/admin/city-launches/:slug/trend", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const { slug } = req.params;
  const days = Math.min(parseInt(String(req.query.days ?? "30"), 10) || 30, 90);

  try {
    const { rows } = await pool.query<{
      recorded_at: string;
      waitlist_size: number;
      active_members: number;
      businesses_onboarded: number;
      events_live: number;
      community_posts: number;
    }>(
      `SELECT recorded_at, waitlist_size, active_members, businesses_onboarded, events_live, community_posts
       FROM city_launch_events
       WHERE slug = $1
         AND recorded_at >= CURRENT_DATE - ($2 || ' days')::INTERVAL
       ORDER BY recorded_at ASC`,
      [slug, days]
    );

    const trend = rows.map(r => ({
      date: String(r.recorded_at).slice(0, 10),
      waitlist: r.waitlist_size,
      members: r.active_members,
      businesses: r.businesses_onboarded,
      events: r.events_live,
      posts: r.community_posts,
    }));

    res.json({ slug, days, trend });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch city trend");
    res.status(500).json({ error: "Failed to fetch trend" });
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
    const { rows } = await pool.query<{
      checklist: ChecklistSection;
      status: string;
      auto_advance: boolean;
    }>(
      `SELECT checklist, status, auto_advance FROM city_launches WHERE slug = $1`,
      [slug]
    );
    if (!rows[0]) { res.status(404).json({ error: "City not found" }); return; }

    const checklist = rows[0].checklist as ChecklistSection;
    const currentStatus = rows[0].status;
    const autoAdvance = rows[0].auto_advance;

    const sectionObj = checklist[section] as Record<string, boolean>;
    if (!(item in sectionObj)) {
      res.status(400).json({ error: `Unknown item "${item}" in section "${section}"` }); return;
    }
    sectionObj[item] = value;

    // ── Auto-advance logic ────────────────────────────────────────────────
    // Determine whether completing this section triggers a status promotion
    const STATUS_ORDER = ["planning", "pre_launch", "soft_launch", "live", "paused"] as const;
    type CityStatus = typeof STATUS_ORDER[number];

    const SECTION_ADVANCEMENT: Partial<Record<keyof ChecklistSection, { requiredStatus: CityStatus; nextStatus: CityStatus }>> = {
      pre_launch: { requiredStatus: "planning",   nextStatus: "pre_launch"  },
      operations: { requiredStatus: "pre_launch", nextStatus: "soft_launch" },
    };

    let statusAdvanced = false;
    let newStatus: string | null = null;
    let advancedSection: string | null = null;

    const advancement = SECTION_ADVANCEMENT[section];
    if (advancement && currentStatus === advancement.requiredStatus) {
      const allDone = Object.values(checklist[section]).every(Boolean);
      if (allDone) {
        newStatus = advancement.nextStatus;
        advancedSection = section;
        if (autoAdvance) {
          statusAdvanced = true;
          await pool.query(
            `UPDATE city_launches SET checklist = $1, status = $2, updated_at = NOW() WHERE slug = $3`,
            [JSON.stringify(checklist), newStatus, slug]
          );
        } else {
          // notify-only: save checklist but not status
          await pool.query(
            `UPDATE city_launches SET checklist = $1, updated_at = NOW() WHERE slug = $2`,
            [JSON.stringify(checklist), slug]
          );
        }
        res.json({ ok: true, checklist, statusAdvanced, newStatus, advancedSection, autoAdvance });
        return;
      }
    }

    await pool.query(
      `UPDATE city_launches SET checklist = $1, updated_at = NOW() WHERE slug = $2`,
      [JSON.stringify(checklist), slug]
    );

    res.json({ ok: true, checklist, statusAdvanced: false, newStatus: null, advancedSection: null });
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

// ──────────────────────────────────────────────────────────────────────────────
// POST /admin/city-launches/:slug/trigger-launch
// One-click city launch:
//   1. tour_guide_businesses staged → live_unclaimed  (real businesses go live)
//   2. businesses demo → permanently_hidden           (dev seed disappears)
//   3. city_launches status → live + launch_date = NOW()
// Idempotent — re-running on an already-live city is a no-op.
// ──────────────────────────────────────────────────────────────────────────────
router.post("/admin/city-launches/:slug/trigger-launch", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const { slug } = req.params;

  try {
    // Resolve city + state from the slug
    const { rows: cityRows } = await pool.query<{ city: string; state: string; status: string }>(
      `SELECT city, state, status FROM city_launches WHERE slug = $1 LIMIT 1`,
      [slug]
    );
    if (cityRows.length === 0) {
      res.status(404).json({ error: `No city found with slug "${slug}"` }); return;
    }
    const { city, state, status: currentStatus } = cityRows[0];

    if (currentStatus === "live") {
      // Already live — return current counts without modifying anything
      const { rows: liveCounts } = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE listing_status='live_unclaimed') AS unclaimed,
                COUNT(*) FILTER (WHERE listing_status='live_claimed')   AS claimed
         FROM tour_guide_businesses WHERE LOWER(city)=LOWER($1) AND LOWER(state)=LOWER($2)`,
        [city, state]
      );
      res.json({
        ok: true,
        alreadyLive: true,
        city, state,
        counts: liveCounts[0],
      });
      return;
    }

    // Step 1 — promote staged real businesses → live_unclaimed
    const { rowCount: promoted } = await pool.query(
      `UPDATE tour_guide_businesses
       SET listing_status = 'live_unclaimed', updated_at = NOW()
       WHERE LOWER(city) = LOWER($1) AND LOWER(state) = LOWER($2)
         AND listing_status = 'staged'`,
      [city, state]
    );

    // Step 2 — hide demo seed data for this city
    const { rowCount: hidden } = await pool.query(
      `UPDATE businesses
       SET listing_status = 'permanently_hidden', updated_at = NOW()
       WHERE LOWER(city) = LOWER($1) AND LOWER(state) = LOWER($2)
         AND listing_status = 'demo'`,
      [city, state]
    );

    // Step 3 — mark city as live
    await pool.query(
      `UPDATE city_launches
       SET status = 'live', launch_date = NOW(), updated_at = NOW()
       WHERE slug = $1`,
      [slug]
    );

    // Step 4 — count results
    const { rows: finalCounts } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE listing_status='live_unclaimed') AS live_unclaimed,
         COUNT(*) FILTER (WHERE listing_status='live_claimed')   AS live_claimed,
         COUNT(*) FILTER (WHERE listing_status='staged')         AS still_staged
       FROM tour_guide_businesses
       WHERE LOWER(city)=LOWER($1) AND LOWER(state)=LOWER($2)`,
      [city, state]
    );

    res.json({
      ok: true,
      city,
      state,
      promoted: promoted ?? 0,
      demoHidden: hidden ?? 0,
      counts: finalCounts[0],
      message: `🚀 ${city} is now live — ${promoted ?? 0} businesses promoted, ${hidden ?? 0} demo pins hidden`,
    });
  } catch (err) {
    req.log.error({ err }, "trigger-launch failed");
    res.status(500).json({ error: "City launch failed" });
  }
});

export default router;
