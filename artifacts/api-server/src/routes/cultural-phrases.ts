/**
 * GET  /cultural-phrases             — list all phrases (filter by group)
 * GET  /cultural-phrases/groups      — list distinct group names
 * GET  /cultural-phrases/sensitivity — return the 5 sensitivity guidelines
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { SENSITIVITY_GUIDELINES } from "../data/cultural-phrases-seed";

const router = Router();

// GET /cultural-phrases?group=Haitian&include_sensitive=false
router.get("/cultural-phrases", async (req: Request, res: Response) => {
  try {
    const { group, include_sensitive = "true" } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (group) { conditions.push(`LOWER(group_name) = LOWER($${i++})`); params.push(group); }
    if (include_sensitive === "false") { conditions.push(`is_sensitive = false`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const r = await pool.query(
      `SELECT id, group_name, phrase, english_gloss, is_sensitive
       FROM cultural_phrases
       ${where}
       ORDER BY group_name, phrase`,
      params
    );

    res.json({ phrases: r.rows, total: r.rows.length });
  } catch (err) {
    req.log?.error({ err }, "GET /cultural-phrases failed");
    res.status(500).json({ error: "Failed to fetch cultural phrases" });
  }
});

// GET /cultural-phrases/groups
router.get("/cultural-phrases/groups", async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `SELECT group_name, COUNT(*) AS phrase_count,
              BOOL_OR(is_sensitive) AS has_sensitive
       FROM cultural_phrases
       GROUP BY group_name
       ORDER BY group_name`
    );
    res.json({ groups: r.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch phrase groups" });
  }
});

// GET /cultural-phrases/sensitivity — the 5 locked rules
router.get("/cultural-phrases/sensitivity", (_req: Request, res: Response) => {
  res.json({ guidelines: SENSITIVITY_GUIDELINES });
});

export default router;
