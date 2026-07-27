import { Router, type IRouter, type Request, type Response } from "express";
import { pool, db, getPoolStats, businessesTable } from "@workspace/db";

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

  // ── Check 1: raw pool.query("SELECT 1") ──────────────────────────────────
  // Uses pool.query() directly — the same path the pool has always used.
  // If this passes but drizzle fails, the Drizzle layer is the problem.
  const rawStart = Date.now();
  let rawCheck: { ok: boolean; elapsedMs: number; error?: string } = {
    ok: false,
    elapsedMs: 0,
  };
  try {
    const result = await Promise.race([
      pool.query("SELECT 1 AS ok"),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Raw query timed out after 3000ms")),
          3000,
        ),
      ),
    ]);
    rawCheck = {
      ok: (result as { rows: { ok: number }[] }).rows[0]?.ok === 1,
      elapsedMs: Date.now() - rawStart,
    };
  } catch (err: unknown) {
    rawCheck = {
      ok: false,
      elapsedMs: Date.now() - rawStart,
      error: (err as Error)?.message ?? "Unknown error",
    };
  }

  // ── Check 2: Drizzle query against a real table ───────────────────────────
  // db and pool are the same exported instance from @workspace/db.
  // If SELECT 1 works but this hangs, the Drizzle execution path is broken.
  const drizzleStart = Date.now();
  let drizzleCheck: {
    ok: boolean;
    elapsedMs: number;
    rowCount?: number;
    error?: string;
  } = { ok: false, elapsedMs: 0 };
  try {
    const rows = await Promise.race([
      db.select({ id: businessesTable.id }).from(businessesTable).limit(1),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Drizzle query timed out after 5000ms")),
          5000,
        ),
      ),
    ]);
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
