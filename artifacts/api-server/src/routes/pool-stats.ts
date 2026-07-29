import { Router, type IRouter, type Request, type Response } from "express";
import { getPoolStats, getPoolAuditLog, getPoolAuditSummary, pool } from "@workspace/db";

// ── /api/pool-stats ────────────────────────────────────────────────────────
// TEMPORARY DIAGNOSTIC ENDPOINT — remove after pool exhaustion is identified.
// Returns only pool counter snapshot from the in-process pg Pool object.
// No DB query is issued; this works even when the pool is fully exhausted.
//
// Auth: x-cron-secret header (same pattern as /api/cron/* routes).
// Response: { totalCount, idleCount, waitingCount, timestamp }
// Cleanup: remove this file and its import/mount in routes/index.ts once
// the root cause of recurring pool exhaustion is confirmed and fixed.

const router: IRouter = Router();

const CRON_SECRET = process.env.CRON_SECRET;

router.get("/pool-stats", (req: Request, res: Response) => {
  if (!CRON_SECRET) {
    res.status(503).json({ error: "Diagnostic endpoint not configured." });
    return;
  }
  const auth = req.headers["x-cron-secret"];
  if (auth !== CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const s = getPoolStats();
  res.json({
    totalCount:   s.total,
    idleCount:    s.idle,
    waitingCount: s.waiting,
    timestamp:    new Date().toISOString(),
  });
});

// ── /api/pool-audit ────────────────────────────────────────────────────────
// Returns the full connection lifecycle ring buffer — every query timing,
// connect/remove event, and growth warning captured since server startup.
// Use this to investigate slow queries and pool growth patterns in production.
// Auth: same x-cron-secret header as /api/pool-stats.
router.get("/pool-audit", (req: Request, res: Response) => {
  if (!CRON_SECRET) {
    res.status(503).json({ error: "Diagnostic endpoint not configured." });
    return;
  }
  const auth = req.headers["x-cron-secret"];
  if (auth !== CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const limit = Math.min(Number(req.query.limit ?? 200), 500);
  const summary = req.query.summary === "true";

  if (summary) {
    res.json(getPoolAuditSummary());
    return;
  }

  res.json({
    events: getPoolAuditLog(limit),
    current: getPoolStats(),
    timestamp: new Date().toISOString(),
  });
});

// ── /api/pg-stat-activity ──────────────────────────────────────────────────
// Runs SELECT against pg_stat_activity on the PRODUCTION Railway database.
// Shows every active connection: PID, state, query text, duration, wait event.
// "idle in transaction" rows here are the zombie connections causing pool growth.
// Auth: same x-cron-secret header.
router.get("/pg-stat-activity", async (req: Request, res: Response) => {
  if (!CRON_SECRET) {
    res.status(503).json({ error: "Diagnostic endpoint not configured." });
    return;
  }
  if (req.headers["x-cron-secret"] !== CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await pool.query(`
      SELECT
        pid,
        state,
        LEFT(query, 120)          AS query,
        age(clock_timestamp(), query_start) AS duration,
        wait_event_type,
        wait_event,
        application_name,
        client_addr::text
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
      ORDER BY query_start NULLS LAST
    `);
    res.json({
      rows: result.rows,
      count: result.rowCount,
      timestamp: new Date().toISOString(),
      currentPool: getPoolStats(),
    });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error)?.message ?? "Unknown error" });
  }
});

export default router;
