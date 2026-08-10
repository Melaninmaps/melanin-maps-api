/**
 * Sundown Towns — Historical Context Layer
 *
 * Build 107 — Safety & Trust System
 *
 * Gates cleared August 7, 2026:
 *   Gate 1: CC BY 4.0 / CC0 confirmed (OSF osf.io/fh7r6/ — Rigby et al., 2025)
 *   Gate 2: Tougaloo College outreach email sent; attribution draft approved
 *   Gate 5: Visual design locked (amber #B8860B triangles, confidence shapes)
 *
 * Attribution (required on every response per CC BY 4.0):
 *   "Historical sundown town data is based on research by Dr. James W. Loewen
 *   and the Tougaloo College History & Social Justice Project
 *   (justice.tougaloo.edu), with spatial linkage from Rigby et al. (2025).
 *   This indicator reflects documented historical practices and does not
 *   represent current conditions."
 *
 * NEVER display this data as a current danger rating.
 * ALWAYS display confidence classification.
 * ALWAYS display both disclaimers (Section 4E of the audit document).
 */

import { randomUUID } from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

// ── Table creation (idempotent) ───────────────────────────────────────────────

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sundown_towns (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name             TEXT        NOT NULL,
      city             TEXT        NOT NULL,
      state            TEXT        NOT NULL,
      county           TEXT,
      latitude         NUMERIC(10,7) NOT NULL,
      longitude        NUMERIC(10,7) NOT NULL,
      confidence_level TEXT        NOT NULL DEFAULT 'probable',
      historical_evidence TEXT,
      time_period      TEXT,
      excluded_population TEXT     DEFAULT 'Black residents',
      source_organization TEXT,
      source_url       TEXT,
      census_geocode   TEXT,
      current_state    TEXT        NOT NULL DEFAULT 'historical_neutral',
      last_review_date DATE,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sundown_community_reports (
      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      sundown_town_id UUID        NOT NULL REFERENCES sundown_towns(id) ON DELETE CASCADE,
      content         TEXT        NOT NULL,
      sentiment       TEXT        NOT NULL CHECK (sentiment IN ('positive','negative')),
      is_moderated    BOOLEAN     NOT NULL DEFAULT FALSE,
      is_approved     BOOLEAN     NOT NULL DEFAULT FALSE,
      user_id         TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS sundown_reports_town_idx ON sundown_community_reports(sundown_town_id)`
  );
}

// ── State-transition logic ────────────────────────────────────────────────────
// Calculates current_state from approved community reports in the DB.
// Called at read time — not stored as a trigger — so it's always fresh.

function calculateState(
  reports: Array<{ sentiment: string; created_at: string; is_approved: boolean }>
): string {
  const now = Date.now();
  const approved = reports.filter((r) => r.is_approved);

  const inDays = (r: { created_at: string }, d: number) =>
    now - new Date(r.created_at).getTime() < d * 864e5;

  const neg60 = approved.filter((r) => r.sentiment === "negative" && inDays(r, 60)).length;
  const neg24m = approved.filter((r) => r.sentiment === "negative" && inDays(r, 730)).length;
  const pos12m = approved.filter((r) => r.sentiment === "positive" && inDays(r, 365)).length;
  const last6m = approved.filter((r) => inDays(r, 180));
  const fadedOut = last6m.length >= 3 && last6m.every((r) => r.sentiment === "positive");

  if (neg60 >= 10) return "current_escalated";
  if (neg60 >= 5)  return "current_active";
  if (neg24m >= 3) return "historical_confirmed";
  if (pos12m >= 3 && neg24m < 3) return "historical_softened";
  if (fadedOut) return "current_faded";
  return "historical_neutral";
}

// ── GET /sundown-towns ────────────────────────────────────────────────────────
// Returns all towns with live state transition.
// Filter by ?state=TX or ?bbox=n,s,e,w (server-side viewport filtering for perf)

router.get("/sundown-towns", async (req: Request, res: Response) => {
  try {
    await ensureTables();

    // Optional filters
    const stateCode = typeof req.query.state === "string" ? req.query.state.toUpperCase() : null;
    const bbox = typeof req.query.bbox === "string" ? req.query.bbox.split(",").map(Number) : null; // n,s,e,w

    let where = "WHERE 1=1";
    const params: unknown[] = [];
    if (stateCode) {
      params.push(stateCode);
      where += ` AND st.state = $${params.length}`;
    }
    if (bbox && bbox.length === 4 && bbox.every((n) => !isNaN(n))) {
      const [n, s, e, w] = bbox;
      params.push(n, s, e, w);
      const p = params.length;
      where += ` AND st.latitude BETWEEN $${p - 2} AND $${p - 3} AND st.longitude BETWEEN $${p} AND $${p - 1}`;
    }

    const townsRes = await pool.query<{
      id: string; name: string; city: string; state: string;
      latitude: string; longitude: string; confidence_level: string;
      historical_evidence: string | null; time_period: string | null;
      excluded_population: string | null; source_organization: string | null;
      source_url: string | null; current_state: string;
    }>(`SELECT * FROM sundown_towns st ${where} ORDER BY st.state, st.name`, params);

    // Fetch approved report counts per town in one query for efficiency
    const townIds = townsRes.rows.map((t) => t.id);
    let reportMap: Record<string, Array<{ sentiment: string; created_at: string; is_approved: boolean }>> = {};

    if (townIds.length > 0) {
      const reportRes = await pool.query<{
        sundown_town_id: string; sentiment: string; created_at: string; is_approved: boolean;
      }>(
        `SELECT sundown_town_id, sentiment, created_at, is_approved
         FROM sundown_community_reports
         WHERE sundown_town_id = ANY($1::uuid[])`,
        [townIds]
      );
      for (const row of reportRes.rows) {
        if (!reportMap[row.sundown_town_id]) reportMap[row.sundown_town_id] = [];
        reportMap[row.sundown_town_id].push(row);
      }
    }

    const towns = townsRes.rows.map((t) => ({
      ...t,
      latitude: parseFloat(t.latitude),
      longitude: parseFloat(t.longitude),
      current_state: calculateState(reportMap[t.id] ?? []),
      report_count: (reportMap[t.id] ?? []).filter((r) => r.is_approved).length,
    }));

    res.json({ towns, total: towns.length });
  } catch (err) {
    req.log?.error({ err }, "GET /sundown-towns error");
    res.status(500).json({ error: "Failed to fetch sundown towns" });
  }
});

// ── GET /sundown-towns/:id ────────────────────────────────────────────────────

router.get("/sundown-towns/:id", async (req: Request, res: Response) => {
  try {
    await ensureTables();
    const { id } = req.params;

    const townRes = await pool.query("SELECT * FROM sundown_towns WHERE id = $1", [id]);
    if (!townRes.rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const reportsRes = await pool.query<{
      id: string; content: string; sentiment: string;
      is_approved: boolean; created_at: string;
    }>(
      `SELECT id, content, sentiment, is_approved, created_at
       FROM sundown_community_reports
       WHERE sundown_town_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    const approvedReports = reportsRes.rows.filter((r) => r.is_approved);
    const currentState = calculateState(reportsRes.rows);
    const MIN_THRESHOLD = 3;
    const showReports = approvedReports.length >= MIN_THRESHOLD;

    const town = {
      ...townRes.rows[0],
      latitude: parseFloat(townRes.rows[0].latitude),
      longitude: parseFloat(townRes.rows[0].longitude),
      current_state: currentState,
      recent_reports: showReports ? approvedReports : [],
      report_count: approvedReports.length,
      meets_threshold: showReports,
    };

    res.json({ town });
  } catch (err) {
    req.log?.error({ err }, "GET /sundown-towns/:id error");
    res.status(500).json({ error: "Failed to fetch town" });
  }
});

// ── POST /sundown-towns/:id/report ───────────────────────────────────────────

router.post("/sundown-towns/:id/report", async (req: Request, res: Response) => {
  const user = req.user as { id?: string } | undefined;
  if (!user?.id) {
    res.status(401).json({ error: "Sign in to share a community experience" });
    return;
  }

  const { content, sentiment } = req.body as { content?: string; sentiment?: string };
  if (!content?.trim() || !["positive", "negative"].includes(sentiment ?? "")) {
    res.status(400).json({ error: "content and sentiment (positive/negative) are required" });
    return;
  }

  try {
    await ensureTables();
    const { id } = req.params;
    const town = await pool.query("SELECT id FROM sundown_towns WHERE id = $1", [id]);
    if (!town.rows.length) {
      res.status(404).json({ error: "Town not found" });
      return;
    }

    const reportId = randomUUID();
    await pool.query(
      `INSERT INTO sundown_community_reports
        (id, sundown_town_id, content, sentiment, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [reportId, id, content.trim(), sentiment, user.id]
    );

    res.json({ ok: true, id: reportId });
  } catch (err) {
    req.log?.error({ err }, "POST /sundown-towns/:id/report error");
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
