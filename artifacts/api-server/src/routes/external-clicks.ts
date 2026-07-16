/**
 * External Institution Click Tracking
 *
 * Records outbound clicks to any non-minority-owned external institution:
 * cultural heritage sites, hotels, employers, museums, job boards, nonprofits, etc.
 *
 * PRIVACY RULE enforced here:
 *   • isSafetyRelated = true  → data is INTERNAL ONLY, NEVER shared with the institution.
 *     Examples: safety tips mentioning an employer, employee safety stories.
 *   • isSafetyRelated = false → aggregate stats may be reported to institution partners.
 *     Examples: "Visit Official Website" clicks, job apply clicks, support link clicks,
 *     community-positive tags clicked by members.
 *
 * Employer / Institution distinction:
 *   • Employees submitting safety tips about their employer → safety-tips route handles this,
 *     those records NEVER reach external_click_events (they are community safety intelligence).
 *   • Employees sharing a workplace story via Living Stories → moderated internally,
 *     never forwarded to the employer as a mention.
 *   • Users clicking through to a business/employer website → tracked here (isSafetyRelated=false).
 *   • Users positively tagging a non-minority business + members clicking → tracked here.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// ── POST /external-clicks ─────────────────────────────────────────────────────

router.post("/external-clicks", async (req: Request, res: Response) => {
  try {
    const {
      institutionName,
      institutionType = "other",
      institutionUrl,
      referenceType = "direct",
      referenceId,
      source = "unknown",
      isSafetyRelated = false,
      city,
      state,
    } = req.body as {
      institutionName?: string;
      institutionType?: string;
      institutionUrl?: string;
      referenceType?: string;
      referenceId?: string;
      source?: string;
      isSafetyRelated?: boolean;
      city?: string;
      state?: string;
    };

    if (!institutionName?.trim()) {
      res.status(400).json({ error: "institutionName is required" });
      return;
    }

    const userId = (req as Request & { user?: { id: string } }).user?.id ?? null;

    await pool.query(
      `INSERT INTO external_click_events
         (institution_name, institution_type, institution_url, reference_type,
          reference_id, source, is_safety_related, user_id, city, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        institutionName.trim().slice(0, 255),
        institutionType,
        institutionUrl ?? null,
        referenceType,
        referenceId ?? null,
        source,
        Boolean(isSafetyRelated),
        userId,
        city ?? null,
        state ?? null,
      ],
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to record external click");
    res.status(500).json({ error: "Failed to record click" });
  }
});

// ── GET /external-clicks/analytics (admin) ────────────────────────────────────

router.get("/external-clicks/analytics", async (req: Request, res: Response) => {
  try {
    const { days = "30", source, institutionType } = req.query as Record<string, string>;
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 30, 1), 365);

    const conditions: string[] = [
      `clicked_at >= NOW() - INTERVAL '${daysNum} days'`,
      `is_safety_related = false`,
    ];
    const params: unknown[] = [];
    let idx = 1;

    if (source) { conditions.push(`source = $${idx++}`); params.push(source); }
    if (institutionType) { conditions.push(`institution_type = $${idx++}`); params.push(institutionType); }

    const where = `WHERE ${conditions.join(" AND ")}`;

    // Top institutions by click volume
    const topResult = await pool.query(
      `SELECT institution_name AS "institutionName",
              institution_type AS "institutionType",
              COUNT(*) AS "clicks",
              COUNT(DISTINCT user_id) AS "uniqueUsers",
              COUNT(DISTINCT CASE WHEN state IS NOT NULL THEN state END) AS "statesReached"
       FROM external_click_events
       ${where}
       GROUP BY institution_name, institution_type
       ORDER BY clicks DESC
       LIMIT 50`,
      params,
    );

    // Breakdown by source
    const sourceResult = await pool.query(
      `SELECT source, COUNT(*) AS "clicks"
       FROM external_click_events
       ${where}
       GROUP BY source ORDER BY clicks DESC`,
      params,
    );

    // Breakdown by type
    const typeResult = await pool.query(
      `SELECT institution_type AS "institutionType", COUNT(*) AS "clicks"
       FROM external_click_events
       ${where}
       GROUP BY institution_type ORDER BY clicks DESC`,
      params,
    );

    // Daily trend
    const trendResult = await pool.query(
      `SELECT DATE_TRUNC('day', clicked_at)::date AS "date",
              COUNT(*) AS "clicks"
       FROM external_click_events
       ${where}
       GROUP BY DATE_TRUNC('day', clicked_at)
       ORDER BY date DESC
       LIMIT 30`,
      params,
    );

    res.json({
      period: `${daysNum} days`,
      topInstitutions: topResult.rows,
      bySource: sourceResult.rows,
      byType: typeResult.rows,
      dailyTrend: trendResult.rows,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch external click analytics");
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ── GET /external-clicks/institution/:name/summary ────────────────────────────
// Partner-safe summary — ONLY returns isSafetyRelated=false traffic
// This is what we would send to an institution in a weekly traffic digest

router.get("/external-clicks/institution/:name/summary", async (req: Request, res: Response) => {
  try {
    const name = decodeURIComponent(String(req.params.name));
    const { days = "30" } = req.query as Record<string, string>;
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 30, 1), 90);

    const result = await pool.query(
      `SELECT
         COUNT(*) AS "totalClicks",
         COUNT(DISTINCT user_id) AS "uniqueVisitors",
         COUNT(DISTINCT state) AS "statesRepresented",
         COUNT(DISTINCT reference_type) AS "entryPoints",
         MIN(clicked_at) AS "firstClick",
         MAX(clicked_at) AS "lastClick"
       FROM external_click_events
       WHERE institution_name ILIKE $1
         AND is_safety_related = false
         AND clicked_at >= NOW() - INTERVAL '${daysNum} days'`,
      [`%${name}%`],
    );

    const bySource = await pool.query(
      `SELECT source, reference_type AS "referenceType", COUNT(*) AS "clicks"
       FROM external_click_events
       WHERE institution_name ILIKE $1
         AND is_safety_related = false
         AND clicked_at >= NOW() - INTERVAL '${daysNum} days'
       GROUP BY source, reference_type
       ORDER BY clicks DESC`,
      [`%${name}%`],
    );

    const topStates = await pool.query(
      `SELECT state, COUNT(*) AS "clicks"
       FROM external_click_events
       WHERE institution_name ILIKE $1
         AND is_safety_related = false
         AND state IS NOT NULL
         AND clicked_at >= NOW() - INTERVAL '${daysNum} days'
       GROUP BY state ORDER BY clicks DESC LIMIT 10`,
      [`%${name}%`],
    );

    res.json({
      institutionName: name,
      period: `${daysNum} days`,
      summary: result.rows[0],
      bySource: bySource.rows,
      topStates: topStates.rows,
      note: "Aggregate data only. No individual user information is included.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch institution summary");
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;
