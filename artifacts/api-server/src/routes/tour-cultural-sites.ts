/**
 * GET  /tour-cultural-sites          — list tour heritage landmarks (filter by city/state/site_type)
 * GET  /tour-cultural-sites/:id      — single site detail with contribution count
 * GET  /tour-cultural-sites/:id/contributions  — approved community contributions
 * POST /tour-cultural-sites/:id/contributions  — submit comment + optional image/video URL (auth required)
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

/** Inline auth guard — consistent with other route files in this codebase. */
function requireAuth(req: Request, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

const router = Router();

// GET /tour-cultural-sites?city=Atlanta&state=GA&site_type=mural&limit=50
router.get("/tour-cultural-sites", async (req: Request, res: Response) => {
  try {
    const { city, state, q, site_type, limit = "50", offset = "0" } = req.query as Record<string, string>;

    const conditions: string[] = ["is_active = true"];
    const params: unknown[] = [];
    let i = 1;

    if (city)      { conditions.push(`LOWER(city) = LOWER($${i++})`);  params.push(city); }
    if (state)     { conditions.push(`LOWER(state) = LOWER($${i++})`); params.push(state); }
    if (site_type) { conditions.push(`COALESCE(site_type,'landmark') = $${i++}`); params.push(site_type); }
    if (q) {
      conditions.push(`(LOWER(name) ILIKE $${i} OR LOWER(description) ILIKE $${i})`);
      params.push(`%${q.toLowerCase()}%`);
      i++;
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT id, name, city, state, address, description,
                latitude, longitude, has_pending_edit,
                COALESCE(site_type, 'landmark') AS site_type,
                created_at
         FROM tour_cultural_sites
         ${where}
         ORDER BY city, name
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
      pool.query(`SELECT COUNT(*) FROM tour_cultural_sites ${where}`, params),
    ]);

    res.json({
      sites: rows.rows,
      total: parseInt(countRow.rows[0].count),
    });
  } catch (err) {
    req.log?.error({ err }, "GET /tour-cultural-sites failed");
    res.status(500).json({ error: "Failed to fetch cultural sites" });
  }
});

// GET /tour-cultural-sites/:id
router.get("/tour-cultural-sites/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [siteRes, countRes] = await Promise.all([
      pool.query(
        `SELECT id, name, city, state, address, description,
                latitude, longitude, has_pending_edit,
                COALESCE(site_type, 'landmark') AS site_type,
                created_at, updated_at
         FROM tour_cultural_sites
         WHERE id = $1 AND is_active = true`,
        [id]
      ),
      pool.query(
        `SELECT COUNT(*) FROM site_contributions
         WHERE site_id = $1 AND status = 'approved'`,
        [id]
      ),
    ]);

    if (!siteRes.rows[0]) return res.status(404).json({ error: "Cultural site not found" });

    res.json({
      ...siteRes.rows[0],
      contributionCount: parseInt(countRes.rows[0].count),
    });
  } catch (err) {
    req.log?.error({ err }, "GET /tour-cultural-sites/:id failed");
    res.status(500).json({ error: "Failed to fetch cultural site" });
  }
});

// GET /tour-cultural-sites/:id/contributions
// Returns approved community contributions (comments, image URLs, video URLs)
router.get("/tour-cultural-sites/:id/contributions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = "20", offset = "0" } = req.query as Record<string, string>;

    const [siteCheck, rows, countRes] = await Promise.all([
      pool.query(`SELECT id FROM tour_cultural_sites WHERE id = $1 AND is_active = true`, [id]),
      pool.query(
        `SELECT id, site_id, author_name, comment_text,
                image_url, video_url, helpful_count, created_at
         FROM site_contributions
         WHERE site_id = $1 AND status = 'approved'
         ORDER BY helpful_count DESC, created_at DESC
         LIMIT $2 OFFSET $3`,
        [id, parseInt(limit), parseInt(offset)]
      ),
      pool.query(
        `SELECT COUNT(*) FROM site_contributions WHERE site_id = $1 AND status = 'approved'`,
        [id]
      ),
    ]);

    if (!siteCheck.rows[0]) return res.status(404).json({ error: "Site not found" });

    res.json({
      contributions: rows.rows,
      total: parseInt(countRes.rows[0].count),
    });
  } catch (err) {
    req.log?.error({ err }, "GET /tour-cultural-sites/:id/contributions failed");
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// POST /tour-cultural-sites/:id/contributions  — requires auth
router.post("/tour-cultural-sites/:id/contributions", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { comment_text, image_url, video_url } = req.body as {
      comment_text?: string;
      image_url?: string;
      video_url?: string;
    };

    // Validate required fields
    if (!comment_text || typeof comment_text !== "string" || comment_text.trim().length === 0) {
      return res.status(400).json({ error: "comment_text is required" });
    }
    if (comment_text.trim().length > 1000) {
      return res.status(400).json({ error: "comment_text must be 1000 characters or fewer" });
    }

    // Validate URLs when provided
    const urlPattern = /^https?:\/\/.+/i;
    if (image_url && !urlPattern.test(image_url)) {
      return res.status(400).json({ error: "image_url must be a valid http/https URL" });
    }
    if (video_url && !urlPattern.test(video_url)) {
      return res.status(400).json({ error: "video_url must be a valid http/https URL" });
    }

    // Confirm site exists
    const siteCheck = await pool.query(
      `SELECT id FROM tour_cultural_sites WHERE id = $1 AND is_active = true`,
      [id]
    );
    if (!siteCheck.rows[0]) return res.status(404).json({ error: "Site not found" });

    // Rate-limit: one pending contribution per user per site
    const existing = await pool.query(
      `SELECT id FROM site_contributions
       WHERE site_id = $1 AND user_id = $2 AND status = 'pending'
       LIMIT 1`,
      [id, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(429).json({
        error: "You already have a contribution pending review for this site",
      });
    }

    // Fetch author name from users table
    const userRes = await pool.query<{ name: string | null; display_name: string | null }>(
      `SELECT name, display_name FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const authorName =
      userRes.rows[0]?.display_name ??
      userRes.rows[0]?.name ??
      "Community Member";

    const result = await pool.query<{ id: string; status: string; created_at: string }>(
      `INSERT INTO site_contributions
         (site_id, user_id, author_name, comment_text, image_url, video_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, status, created_at`,
      [id, userId, authorName, comment_text.trim(), image_url ?? null, video_url ?? null]
    );

    res.status(201).json({
      contribution: result.rows[0],
      message: "Thank you — your memory has been submitted for review and will appear shortly.",
    });
  } catch (err) {
    req.log?.error({ err }, "POST /tour-cultural-sites/:id/contributions failed");
    res.status(500).json({ error: "Failed to submit contribution" });
  }
});

export default router;
