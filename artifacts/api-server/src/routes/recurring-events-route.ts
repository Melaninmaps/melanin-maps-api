/**
 * GET  /recurring-events        — list recurring events (filter by city/state/category)
 * GET  /recurring-events/:id    — single event detail
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

// GET /recurring-events?city=Philadelphia&state=PA&category=market&limit=50
router.get("/recurring-events", async (req: Request, res: Response) => {
  try {
    const { city, state, category, q, limit = "50", offset = "0" } = req.query as Record<string, string>;

    const conditions: string[] = ["is_active = true"];
    const params: unknown[] = [];
    let i = 1;

    if (city) { conditions.push(`LOWER(city) = LOWER($${i++})`); params.push(city); }
    if (state) { conditions.push(`LOWER(state) = LOWER($${i++})`); params.push(state); }
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    if (q) {
      conditions.push(`(LOWER(name) ILIKE $${i} OR LOWER(description) ILIKE $${i} OR LOWER(venue) ILIKE $${i})`);
      params.push(`%${q.toLowerCase()}%`);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT id, name, city, state, venue, address, description,
                frequency, day_of_week, start_time, end_time, category,
                latitude, longitude,
                has_pending_edit, created_at, updated_at
         FROM recurring_events
         ${where}
         ORDER BY city, category, name
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
      pool.query(`SELECT COUNT(*) FROM recurring_events ${where}`, params),
    ]);

    res.json({
      events: rows.rows,
      total: parseInt(countRow.rows[0].count),
    });
  } catch (err) {
    req.log?.error({ err }, "GET /recurring-events failed");
    res.status(500).json({ error: "Failed to fetch recurring events" });
  }
});

// GET /recurring-events/:id
router.get("/recurring-events/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `SELECT * FROM recurring_events WHERE id = $1 AND is_active = true`,
      [id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Event not found" });
    return res.json(r.rows[0]);
  } catch (err) {
    req.log?.error({ err }, "GET /recurring-events/:id failed");
    return res.status(500).json({ error: "Failed to fetch event" });
  }
});

export default router;
