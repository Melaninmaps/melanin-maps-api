/**
 * GET  /tour-cultural-sites          — list tour heritage landmarks (filter by city/state)
 * GET  /tour-cultural-sites/:id      — single site detail
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

// GET /tour-cultural-sites?city=Atlanta&state=GA&limit=50
router.get("/tour-cultural-sites", async (req: Request, res: Response) => {
  try {
    const { city, state, q, limit = "50", offset = "0" } = req.query as Record<string, string>;

    const conditions: string[] = ["is_active = true"];
    const params: unknown[] = [];
    let i = 1;

    if (city) { conditions.push(`LOWER(city) = LOWER($${i++})`); params.push(city); }
    if (state) { conditions.push(`LOWER(state) = LOWER($${i++})`); params.push(state); }
    if (q) {
      conditions.push(`(LOWER(name) ILIKE $${i} OR LOWER(description) ILIKE $${i})`);
      params.push(`%${q.toLowerCase()}%`);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT id, name, city, state, address, description,
                latitude, longitude, has_pending_edit, created_at
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
    const r = await pool.query(
      `SELECT * FROM tour_cultural_sites WHERE id = $1 AND is_active = true`,
      [id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Cultural site not found" });
    res.json(r.rows[0]);
  } catch (err) {
    req.log?.error({ err }, "GET /tour-cultural-sites/:id failed");
    res.status(500).json({ error: "Failed to fetch cultural site" });
  }
});

export default router;
