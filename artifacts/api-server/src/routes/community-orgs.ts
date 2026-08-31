/**
 * GET  /community-orgs          — list community organizations (filter by city/state/category)
 * GET  /community-orgs/:id      — single org detail
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
const router = Router();
// GET routes are public — community orgs are publicly discoverable.

// GET /community-orgs?city=Philadelphia&state=PA&category=chamber&limit=50&offset=0
router.get("/community-orgs", async (req: Request, res: Response) => {
  try {
    const { city, state, category, q, limit = "50", offset = "0" } = req.query as Record<string, string>;

    const conditions: string[] = ["is_active = true"];
    const params: unknown[] = [];
    let i = 1;

    if (city) { conditions.push(`LOWER(city) = LOWER($${i++})`); params.push(city); }
    if (state) { conditions.push(`LOWER(state) = LOWER($${i++})`); params.push(state); }
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    if (q) {
      conditions.push(`(LOWER(name) ILIKE $${i} OR LOWER(mission) ILIKE $${i})`);
      params.push(`%${q.toLowerCase()}%`);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT id, name, city, state, category, mission,
                website, instagram, facebook, phone, address,
                latitude, longitude,
                has_pending_edit, created_at, updated_at
         FROM community_organizations
         ${where}
         ORDER BY city, category, name
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
      pool.query(`SELECT COUNT(*) FROM community_organizations ${where}`, params),
    ]);

    res.json({
      organizations: rows.rows,
      total: parseInt(countRow.rows[0].count),
    });
  } catch (err) {
    req.log?.error({ err }, "GET /community-orgs failed");
    res.status(500).json({ error: "Failed to fetch community organizations" });
  }
});

// GET /community-orgs/:id
router.get("/community-orgs/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `SELECT * FROM community_organizations WHERE id = $1 AND is_active = true`,
      [id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Organization not found" });
    return res.json(r.rows[0]);
  } catch (err) {
    req.log?.error({ err }, "GET /community-orgs/:id failed");
    return res.status(500).json({ error: "Failed to fetch organization" });
  }
});

export default router;
