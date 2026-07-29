import { Router, type IRouter, type Request, type Response } from "express";
import { getPoolStats, getPoolAuditLog, getPoolAuditSummary } from "@workspace/db";

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

export default router;
