/**
 * City Story & Historical Context routes
 * GET  /cities/:slug/story           — full city profile for Living Legacy page
 * GET  /cities/:slug/welcome         — brief welcome card (first-visit)
 * POST /cities/:slug/welcome/dismiss — mark welcome card seen for this user
 * PATCH /admin/cities/:slug/story    — founder/admin update of any city profile field
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth.js";

const router: IRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /cities/:slug/story
// Returns the full city profile. Used by Living Legacy page header.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/cities/:slug/story", async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    // City profile + city_launches join for city/state/status
    const { rows } = await pool.query(
      `SELECT
         cl.city, cl.state, cl.slug, cl.status AS launch_status,
         cp.historical_context,
         cp.brief_context,
         cp.why_mwm_here,
         cp.hero_image_url,
         cp.key_neighborhoods,
         cp.key_figures,
         cp.migration_era,
         cp.cultural_anchors,
         cp.updated_at AS story_updated_at,
         (
           SELECT COUNT(*) FROM businesses b
           WHERE LOWER(TRIM(b.city)) = LOWER(TRIM(cl.city))
             AND LOWER(TRIM(b.state)) = LOWER(TRIM(cl.state))
             AND b.listing_status IN ('live_unclaimed','live_claimed')
         ) + (
           SELECT COUNT(*) FROM tour_guide_businesses tgb
           WHERE LOWER(TRIM(tgb.city)) = LOWER(TRIM(cl.city))
             AND LOWER(TRIM(tgb.state)) = LOWER(TRIM(cl.state))
             AND tgb.listing_status IN ('live_unclaimed','live_claimed')
         ) AS business_count,
         (SELECT COUNT(*) FROM cultural_sites cs
          WHERE LOWER(TRIM(cs.city)) = LOWER(TRIM(cl.city))
            AND LOWER(TRIM(cs.state)) = LOWER(TRIM(cl.state))) AS cultural_site_count,
         (SELECT COUNT(*) FROM archive_contributions ac
          JOIN city_archives ca ON ca.id = ac.archive_id
          WHERE ca.slug = cl.slug) AS community_story_count
       FROM city_launches cl
       LEFT JOIN city_profiles cp ON cp.city_slug = cl.slug
       WHERE cl.slug = $1`,
      [slug]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: `No city found with slug "${slug}"` });
      return;
    }

    const row = rows[0];

    // Graceful fallback when no profile has been seeded yet
    if (!row.historical_context) {
      res.json({
        city: row.city,
        state: row.state,
        slug: row.slug,
        launchStatus: row.launch_status,
        hasProfile: false,
        brief_context: null,
        historical_context: null,
        why_mwm_here: null,
        hero_image_url: null,
        key_neighborhoods: [],
        key_figures: [],
        migration_era: null,
        cultural_anchors: [],
        business_count: Number(row.business_count ?? 0),
        cultural_site_count: Number(row.cultural_site_count ?? 0),
        community_story_count: Number(row.community_story_count ?? 0),
        story_updated_at: null,
      });
      return;
    }

    res.json({
      city: row.city,
      state: row.state,
      slug: row.slug,
      launchStatus: row.launch_status,
      hasProfile: true,
      brief_context: row.brief_context,
      historical_context: row.historical_context,
      why_mwm_here: row.why_mwm_here,
      hero_image_url: row.hero_image_url,
      key_neighborhoods: row.key_neighborhoods ?? [],
      key_figures: row.key_figures ?? [],
      migration_era: row.migration_era,
      cultural_anchors: row.cultural_anchors ?? [],
      business_count: Number(row.business_count ?? 0),
      cultural_site_count: Number(row.cultural_site_count ?? 0),
      community_story_count: Number(row.community_story_count ?? 0),
      story_updated_at: row.story_updated_at,
    });
  } catch (err) {
    req.log.error({ err }, "GET /cities/:slug/story failed");
    res.status(500).json({ error: "Failed to load city story" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /cities/:slug/welcome
// Returns brief welcome card data. `has_seen` is true if user already dismissed it.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/cities/:slug/welcome", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const userId = (req as any).user?.id ?? null;

  try {
    const { rows } = await pool.query(
      `SELECT
         cl.city, cl.state, cl.slug,
         cp.brief_context,
         (
           SELECT COUNT(*) FROM businesses bw
           WHERE LOWER(TRIM(bw.city)) = LOWER(TRIM(cl.city))
             AND LOWER(TRIM(bw.state)) = LOWER(TRIM(cl.state))
             AND bw.listing_status IN ('live_unclaimed','live_claimed')
         ) + (
           SELECT COUNT(*) FROM tour_guide_businesses tgbw
           WHERE LOWER(TRIM(tgbw.city)) = LOWER(TRIM(cl.city))
             AND LOWER(TRIM(tgbw.state)) = LOWER(TRIM(cl.state))
             AND tgbw.listing_status IN ('live_unclaimed','live_claimed')
         ) AS business_count,
         (SELECT COUNT(*) > 0 FROM user_city_welcome_dismissals
          WHERE user_id = $2 AND city_slug = $1) AS has_seen
       FROM city_launches cl
       LEFT JOIN city_profiles cp ON cp.city_slug = cl.slug
       WHERE cl.slug = $1`,
      [slug, userId ?? ""]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: `No city found with slug "${slug}"` }); return;
    }

    const row = rows[0];
    res.json({
      city: row.city,
      state: row.state,
      slug: row.slug,
      brief_context: row.brief_context ?? null,
      business_count: Number(row.business_count ?? 0),
      has_seen: row.has_seen === true || row.has_seen === "true",
    });
  } catch (err) {
    req.log.error({ err }, "GET /cities/:slug/welcome failed");
    res.status(500).json({ error: "Failed to load welcome card" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /cities/:slug/welcome/dismiss
// Marks the welcome card as seen for this user. Idempotent.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/cities/:slug/welcome/dismiss", async (req: Request, res: Response) => {
  if (!(req as any).user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { slug } = req.params;
  const userId = (req as any).user.id as string;

  try {
    await pool.query(
      `INSERT INTO user_city_welcome_dismissals (user_id, city_slug)
       VALUES ($1, $2) ON CONFLICT (user_id, city_slug) DO NOTHING`,
      [userId, slug]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /cities/:slug/welcome/dismiss failed");
    res.status(500).json({ error: "Failed to dismiss welcome card" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /cities — list all cities with their profile status (for city picker UI)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/cities", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         cl.city, cl.state, cl.slug, cl.status AS launch_status,
         cp.brief_context,
         cp.hero_image_url,
         cp.cultural_anchors,
         (cp.id IS NOT NULL) AS has_profile,
         (
           SELECT COUNT(*) FROM businesses b2
           WHERE LOWER(TRIM(b2.city)) = LOWER(TRIM(cl.city))
             AND LOWER(TRIM(b2.state)) = LOWER(TRIM(cl.state))
             AND b2.listing_status IN ('live_unclaimed','live_claimed')
         ) + (
           SELECT COUNT(*) FROM tour_guide_businesses tgb2
           WHERE LOWER(TRIM(tgb2.city)) = LOWER(TRIM(cl.city))
             AND LOWER(TRIM(tgb2.state)) = LOWER(TRIM(cl.state))
             AND tgb2.listing_status IN ('live_unclaimed','live_claimed')
         ) AS business_count
       FROM city_launches cl
       LEFT JOIN city_profiles cp ON cp.city_slug = cl.slug
       ORDER BY cl.city ASC`
    );
    res.json({ cities: rows });
  } catch (err) {
    req.log.error({ err }, "GET /cities failed");
    res.status(500).json({ error: "Failed to load cities" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/cities/:slug/story — founder/admin update of city profile
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/admin/cities/:slug/story", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { slug } = req.params;

  const allowed = [
    "historical_context", "brief_context", "why_mwm_here",
    "hero_image_url", "key_neighborhoods", "key_figures",
    "migration_era", "cultural_anchors",
  ];

  const sets: string[] = ["updated_at = NOW()"];
  const vals: unknown[] = [];
  let i = 1;

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      sets.push(`${field} = $${i++}`);
      vals.push(req.body[field]);
    }
  }

  if (sets.length === 1) {
    res.status(400).json({ error: "No valid fields provided" }); return;
  }

  vals.push(slug);

  try {
    // Upsert — if the profile doesn't exist yet, create it
    const upsertResult = await pool.query(
      `INSERT INTO city_profiles (city_slug, historical_context, brief_context)
       VALUES ($${i}, '', '')
       ON CONFLICT (city_slug) DO NOTHING`,
      [slug]
    );

    const { rowCount } = await pool.query(
      `UPDATE city_profiles SET ${sets.join(", ")} WHERE city_slug = $${i}`,
      vals
    );

    if (!rowCount && !upsertResult.rowCount) {
      res.status(404).json({ error: `No city profile found for slug "${slug}"` }); return;
    }

    res.json({ ok: true, message: `City story for "${slug}" updated` });
  } catch (err) {
    req.log.error({ err }, "PATCH /admin/cities/:slug/story failed");
    res.status(500).json({ error: "Failed to update city story" });
  }
});

export default router;
