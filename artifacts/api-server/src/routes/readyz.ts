import { Router, type IRouter, type Request, type Response } from "express";
import { pool, db, getPoolStats, POOL_MAX, businessesTable } from "@workspace/db";
import { kinfolkActiveGenerations, kinfolkQueuedGenerations } from "./kinfolk";

// ── /api/internal/readyz ──────────────────────────────────────────────────
// Protected deep-database readiness check for internal tooling and ops use.
// Requires x-probe-key header (same pattern as /api/db-probe).
//
// The public, Railway-facing readiness endpoint is GET /api/readyz (top-level
// in app.ts). This internal route performs additional Drizzle + waiting-count
// checks for diagnostic purposes.
//
// Returns 200 when all checks pass, 503 when any check fails.
//
// SAFE PATTERN: All DB probes use pool.query() which auto-releases connections.
// Switched from pool.connect()+safeRelease to pool.query() (July 29 2026) to
// eliminate any possibility of a missed client.release() call.

const WAITING_COUNT_THRESHOLD = 3;

const router: IRouter = Router();

router.get("/readyz", async (req: Request, res: Response) => {
  const probeKey = process.env.DB_PROBE_KEY;
  if (!probeKey || req.headers["x-probe-key"] !== probeKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const poolStats = getPoolStats();
  const issues: string[] = [];

  // ── Raw SQL check ─────────────────────────────────────────────────────────
  // pool.query() auto-releases the connection on every code path.
  let rawOk = false;
  try {
    const result = await pool.query("SELECT 1 AS ok");
    rawOk = result.rows[0]?.ok === 1;
  } catch {
    issues.push("raw SQL check failed");
  }
  if (!rawOk) issues.push("raw SQL returned unexpected result");

  // ── Drizzle check ─────────────────────────────────────────────────────────
  // Drizzle borrows a connection from the same pool. Using a pool.connect()
  // wrapper here is not directly possible because Drizzle manages its own
  // checkout internally. We accept this constraint and rely on the pg driver's
  // built-in statement timeout (set on the pool config) to bound the query.
  let drizzleOk = false;
  try {
    await db.select({ id: businessesTable.id }).from(businessesTable).limit(1);
    drizzleOk = true;
  } catch {
    issues.push("Drizzle query check failed");
  }

  // ── Pool waiting count check ───────────────────────────────────────────────
  if (poolStats.waiting > WAITING_COUNT_THRESHOLD) {
    issues.push(
      `pool waitingCount ${poolStats.waiting} exceeds threshold ${WAITING_COUNT_THRESHOLD}`,
    );
  }

  const ready = issues.length === 0;

  res.status(ready ? 200 : 503).json({
    ready,
    poolStats,
    pool_max: POOL_MAX,
    kinfolk: {
      active:  kinfolkActiveGenerations,
      queued:  kinfolkQueuedGenerations,
      cap:     10,  // KINFOLK_CONCURRENCY_CAP — documented in kinfolk.ts
      queueMax: 50, // KINFOLK_QUEUE_MAX
    },
    checks: {
      rawSql: rawOk,
      drizzle: drizzleOk,
      waitingBelowThreshold: poolStats.waiting <= WAITING_COUNT_THRESHOLD,
    },
    ...(issues.length > 0 ? { issues } : {}),
  });
});

export default router;
