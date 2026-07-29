/**
 * Health Monitor — Part 5 (Build 97 Apple rejection prevention review)
 *
 * Runs a DB connectivity check every 5 minutes and maintains an in-memory
 * ring buffer of the last 150 results (covers 12+ hours at 5-min intervals).
 * Every result is emitted as a structured JSON log line so Railway's log
 * stream captures the full 12-hour evidence window.
 *
 * Accessed via GET /api/readyz/history for evidence file generation.
 */

import { pool, getPoolStats, POOL_MAX } from "@workspace/db";

export interface HealthCheckEntry {
  ts: string;
  status: "ok" | "degraded" | "error";
  dbMs: number | null;
  pool: { total: number; idle: number; waiting: number };
  detail?: string;
}

const MAX_ENTRIES = 150; // 12.5 hours at 5-minute intervals
const _history: HealthCheckEntry[] = [];
let _monitorHandle: ReturnType<typeof setInterval> | null = null;
let _logger: {
  info(data: object, msg?: string): void;
  warn(data: object, msg?: string): void;
  error(data: object, msg?: string): void;
} = {
  info: (data, msg) => console.info(JSON.stringify({ msg, ...data })),
  warn: (data, msg) => console.warn(JSON.stringify({ msg, ...data })),
  error: (data, msg) => console.error(JSON.stringify({ msg, ...data })),
};

export function setMonitorLogger(logger: typeof _logger): void {
  _logger = logger;
}

export function getHealthHistory(): {
  total: number;
  errors: number;
  degraded: number;
  uptimePct: string;
  intervalMinutes: number;
  observedHours: string;
  history: HealthCheckEntry[];
} {
  const total = _history.length;
  const errors = _history.filter((h) => h.status === "error").length;
  const degraded = _history.filter((h) => h.status === "degraded").length;
  const uptimePct = total > 0 ? (((total - errors - degraded) / total) * 100).toFixed(1) : "N/A";
  const observedHours = total > 0
    ? ((total * 5) / 60).toFixed(1)
    : "0";
  return {
    total,
    errors,
    degraded,
    uptimePct,
    intervalMinutes: 5,
    observedHours,
    history: [..._history],
  };
}

async function runHealthCheck(): Promise<void> {
  const ts = new Date().toISOString();
  const poolStats = getPoolStats();

  // Fast-fail only when the pool is truly exhausted: at capacity AND requests
  // are queued. idle===0 alone means connections are transiently busy — new
  // connections can still be created if total < max. waiting>0 is the
  // accurate signal that real requests are being delayed.
  if (poolStats.idle === 0 && poolStats.total >= POOL_MAX && poolStats.waiting > 0) {
    const entry: HealthCheckEntry = {
      ts,
      status: "degraded",
      dbMs: null,
      pool: poolStats,
      detail: `pool_exhausted: total=${poolStats.total}/${POOL_MAX} idle=0 waiting=${poolStats.waiting}`,
    };
    _push(entry);
    _logger.warn(
      { event: "HEALTH_MONITOR_CHECK", ...entry },
      "health-monitor: pool exhausted",
    );
    return;
  }

  // IMPORTANT: acquire a PoolClient explicitly so release() always runs in
  // the finally block. Never use Promise.race with pool.query() — it abandons
  // the pg promise without releasing the client, leaking connections.
  //
  // 60-second forced-release safety net (Manus audit fix C/D, July 29 2026):
  // If client.query() hangs on a silently-dead TCP socket, query_timeout fires
  // after 10 s but in rare cases (kernel-level socket hang) the pg promise may
  // never settle. The forced-release timer guarantees the connection is returned
  // within 60 s regardless, preventing the one-per-cycle pool exhaustion pattern
  // observed in production (total 2→20 over 90 min → 38% uptime).
  // ── SAFE PATTERN: pool.query() auto-releases the connection ─────────────────
  // pool.connect() + manual release was the prior pattern; switched to
  // pool.query() (July 29 2026) because pool.query() returns the connection to
  // the pool automatically when the query resolves — no safeRelease timer, no
  // forceTimer, no possibility of a missed client.release() call.
  // statement_timeout (10s) is set on every connection by the pool config so
  // a hung SELECT 1 will be killed server-side without any client-side guard.
  const start = Date.now();
  try {
    await pool.query("SELECT 1");
    const dbMs = Date.now() - start;
    const entry: HealthCheckEntry = {
      ts,
      status: "ok",
      dbMs,
      pool: getPoolStats(),
    };
    _push(entry);
    _logger.info(
      { event: "HEALTH_MONITOR_CHECK", ...entry },
      "health-monitor: ok",
    );
  } catch (err: unknown) {
    const dbMs = Date.now() - start;
    const detail = err instanceof Error ? err.message : String(err);
    const entry: HealthCheckEntry = {
      ts,
      status: "error",
      dbMs,
      pool: getPoolStats(),
      detail,
    };
    _push(entry);
    _logger.error(
      { event: "HEALTH_MONITOR_CHECK", ...entry },
      "health-monitor: error",
    );
  }
}

function _push(entry: HealthCheckEntry): void {
  _history.push(entry);
  if (_history.length > MAX_ENTRIES) _history.shift();
}

/**
 * Start the health monitor. Safe to call multiple times — only starts once.
 * @param intervalMs default 300_000 (5 minutes)
 */
export function startHealthMonitor(intervalMs = 300_000): void {
  if (_monitorHandle) return;
  // Run the first check immediately (best-effort; errors are logged, not thrown).
  runHealthCheck().catch(() => {});
  _monitorHandle = setInterval(() => {
    runHealthCheck().catch(() => {});
  }, intervalMs);
  // Unref so the interval doesn't prevent clean process exit.
  _monitorHandle.unref();
}

export function stopHealthMonitor(): void {
  if (_monitorHandle) {
    clearInterval(_monitorHandle);
    _monitorHandle = null;
  }
}
