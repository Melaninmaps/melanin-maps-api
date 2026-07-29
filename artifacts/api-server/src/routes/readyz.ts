import { Router, type IRouter, type Request, type Response } from "express";
import { pool, db, getPoolStats, businessesTable } from "@workspace/db";
import type { PoolClient } from "pg";

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
// SAFE PATTERN: All DB probes use pool.connect() + finally { client.release() }.
// Promise.race(pool.query, timeout) leaks PoolClients on timeout — never use it
// for health checks. (P0 incident reference: July 28 2026 pool exhaustion.)

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
  // pool.connect() + finally { release() } + 60s forced-release safety net.
  let rawOk = false;
  let rawClient: PoolClient | undefined;
  let _rawReleased = false;
  const safeRawRelease = () => {
    if (_rawReleased) return;
    _rawReleased = true;
    try { rawClient?.release(); } catch { /* ignore */ }
  };
  const rawForceTimer = setTimeout(() => {
    console.error(JSON.stringify({ event: "INTERNAL_READYZ_FORCED_RELEASE", pool: poolStats }));
    safeRawRelease();
  }, 60_000);
  (rawForceTimer as NodeJS.Timeout).unref?.();
  try {
    rawClient = await pool.connect();
    // Explicit session-level statement timeout — fix A defense-in-depth.
    await rawClient.query("SET statement_timeout = '5000'");
    const result = await rawClient.query("SELECT 1 AS ok");
    rawOk = result.rows[0]?.ok === 1;
  } catch {
    issues.push("raw SQL check failed");
  } finally {
    clearTimeout(rawForceTimer);
    safeRawRelease();
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
    checks: {
      rawSql: rawOk,
      drizzle: drizzleOk,
      waitingBelowThreshold: poolStats.waiting <= WAITING_COUNT_THRESHOLD,
    },
    ...(issues.length > 0 ? { issues } : {}),
  });
});

export default router;
