import { Router, type IRouter, type Request, type Response } from "express";
import { pool, db, getPoolStats, businessesTable } from "@workspace/db";
import type { PoolClient } from "pg";

// SAFE PATTERN: All DB probes use pool.connect() + finally { client.release() }.
// Promise.race(pool.query, timeout) was the root cause of the July 28 2026
// pool exhaustion P0 incident: the PoolClient was abandoned on timeout and
// not returned until pg's maxLifetimeSeconds recycled it (~30 min).
// pool.connect() + finally guarantees the connection is always released.

const router: IRouter = Router();

router.get("/db-probe", async (req: Request, res: Response) => {
  const probeKey = process.env.DB_PROBE_KEY;
  if (!probeKey || req.headers["x-probe-key"] !== probeKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const url = process.env.DATABASE_URL ?? "";
  const hostCategory = url.includes(".internal") ? "internal" : "public-proxy";

  // Snapshot pool stats before running queries — reflects the waiting state
  // at the moment of the probe call, not after connections are acquired.
  const poolStats = getPoolStats();

  // ── Check 1: raw pool.connect() → SELECT 1 ───────────────────────────────
  const rawStart = Date.now();
  let rawCheck: { ok: boolean; elapsedMs: number; error?: string } = {
    ok: false,
    elapsedMs: 0,
  };
  let rawClient: PoolClient | undefined;
  try {
    rawClient = await pool.connect();
    const result = await rawClient.query("SELECT 1 AS ok");
    rawCheck = {
      ok: result.rows[0]?.ok === 1,
      elapsedMs: Date.now() - rawStart,
    };
  } catch (err: unknown) {
    rawCheck = {
      ok: false,
      elapsedMs: Date.now() - rawStart,
      error: (err as Error)?.message ?? "Unknown error",
    };
  } finally {
    rawClient?.release();
  }

  // ── Check 2: Drizzle query against a real table ───────────────────────────
  // Drizzle manages pool checkout internally — we cannot wrap it in our own
  // pool.connect()/release() block. We rely on the pg driver's statement_timeout
  // to bound this query instead of an external Promise.race timeout wrapper.
  const drizzleStart = Date.now();
  let drizzleCheck: {
    ok: boolean;
    elapsedMs: number;
    rowCount?: number;
    error?: string;
  } = { ok: false, elapsedMs: 0 };
  try {
    const rows = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .limit(1);
    drizzleCheck = {
      ok: true,
      elapsedMs: Date.now() - drizzleStart,
      rowCount: rows.length,
    };
  } catch (err: unknown) {
    drizzleCheck = {
      ok: false,
      elapsedMs: Date.now() - drizzleStart,
      error: (err as Error)?.message ?? "Unknown error",
    };
  }

  res.json({
    hostCategory,
    poolStats,
    raw: rawCheck,
    drizzle: drizzleCheck,
  });
});

export default router;
