import { Router, type IRouter, type Request, type Response } from "express";
import { pool, db, getPoolStats, businessesTable } from "@workspace/db";

// ── /api/internal/readyz ──────────────────────────────────────────────────
// Protected deep-database readiness check for internal tooling and ops use.
// Requires x-probe-key header (same pattern as /api/db-probe).
//
// The public, Railway-facing readiness endpoint is GET /api/readyz (top-level
// in app.ts). This internal route performs additional Drizzle + waiting-count
// checks for diagnostic purposes.
//
// Returns 200 when all checks pass, 503 when any check fails.

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
  let rawOk = false;
  try {
    const result = await Promise.race([
      pool.query("SELECT 1 AS ok"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000),
      ),
    ]);
    rawOk = (result as { rows: { ok: number }[] }).rows[0]?.ok === 1;
  } catch {
    issues.push("raw SQL check failed");
  }
  if (!rawOk) issues.push("raw SQL returned unexpected result");

  // ── Drizzle check ─────────────────────────────────────────────────────────
  let drizzleOk = false;
  try {
    await Promise.race([
      db.select({ id: businessesTable.id }).from(businessesTable).limit(1),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000),
      ),
    ]);
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
