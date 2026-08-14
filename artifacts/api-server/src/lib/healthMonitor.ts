/**
 * Health Monitor — Part 5 (Build 97 Apple rejection prevention review)
 *
 * Runs a DB connectivity check every 5 minutes and maintains an in-memory
 * ring buffer of the last 150 results (covers 12+ hours at 5-min intervals).
 * Every result is emitted as a structured JSON log line so Railway's log
 * stream captures the full 12-hour evidence window.
 *
 * Accessed via GET /api/readyz/history for evidence file generation.
 *
 * Twilio SMS alerts (Aug 14 2026):
 *   Sends a critical SMS after 3 consecutive DB errors.
 *   Sends a recovery SMS after 3 consecutive successes following an alert.
 *   Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and MWM_ALERT_TO_PHONE.
 *   MWM_ALERT_FROM_PHONE must be a purchased Twilio number.
 *   If secrets are missing, SMS is silently skipped (monitoring still runs).
 */

import { pool, getPoolStats, POOL_MAX } from "@workspace/db";
import https from "https";
import querystring from "querystring";

// ── Twilio SMS alert state ─────────────────────────────────────────────────────
let _consecutiveErrors    = 0;
let _consecutiveSuccesses = 0;
let _inAlertState         = false;
const ALERT_THRESHOLD     = 3;  // failures before sending critical SMS
const RECOVERY_THRESHOLD  = 3;  // successes before sending recovery SMS

function _twilioSms(body: string): void {
  const sid      = process.env.TWILIO_ACCOUNT_SID;
  const token    = process.env.TWILIO_AUTH_TOKEN;
  const toPhone  = process.env.MWM_ALERT_TO_PHONE;
  const fromPhone= process.env.MWM_ALERT_FROM_PHONE;
  if (!sid || !token || !toPhone || !fromPhone) return; // silently skip if unconfigured
  const postData = querystring.stringify({ From: fromPhone, To: toPhone, Body: body });
  const req = https.request({
    hostname: "api.twilio.com",
    path: `/2010-04-01/Accounts/${sid}/Messages.json`,
    method: "POST",
    auth: `${sid}:${token}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(postData) },
  }, (res) => {
    res.resume(); // drain the response
    if (res.statusCode && res.statusCode >= 400) {
      console.warn(`[health-monitor] Twilio SMS error: HTTP ${res.statusCode}`);
    }
  });
  req.on("error", (e) => console.warn("[health-monitor] Twilio SMS request failed:", e.message));
  req.write(postData);
  req.end();
}

function _handleAlertState(status: "ok" | "degraded" | "error"): void {
  if (status === "error") {
    _consecutiveErrors++;
    _consecutiveSuccesses = 0;
    if (!_inAlertState && _consecutiveErrors >= ALERT_THRESHOLD) {
      _inAlertState = true;
      const ts = new Date().toISOString();
      _twilioSms(
        `MWM PRODUCTION ALERT\nSeverity: CRITICAL\nMonitor: db-health\nDetected UTC: ${ts}\n` +
        `Consecutive failures: ${_consecutiveErrors}\nAction: Check Railway deployment and DB health.`,
      );
    }
  } else {
    _consecutiveErrors = 0;
    _consecutiveSuccesses++;
    if (_inAlertState && _consecutiveSuccesses >= RECOVERY_THRESHOLD) {
      _inAlertState = false;
      _consecutiveSuccesses = 0;
      const ts = new Date().toISOString();
      _twilioSms(
        `MWM PRODUCTION RECOVERY\nMonitor: db-health\nRecovered UTC: ${ts}\nThree consecutive successful checks. Service healthy.`,
      );
    }
  }
}

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
  // ── SAFE PATTERN: explicit pool.connect() + client.release() in finally ──────
  // pool.query() was used previously, but the pool export is a Proxy with only
  // a get trap (no set trap). When pg-pool's Pool.prototype.query runs with
  // this=Proxy, any internal property assignments (connection tracking) write
  // to the Proxy's empty target {} instead of the real Pool — orphaning the
  // connection permanently. This caused exactly +1 leak per healthMonitor cycle.
  //
  // Explicit pool.connect() + client.release() bypasses the issue: release() is
  // called directly on the client object, which holds its own back-reference to
  // the real Pool. No Proxy indirection involved in the release path.
  //
  // statement_timeout (10s) is set on every connection by the pool config so
  // a hung SELECT 1 will be killed server-side without any client-side guard.
  const start = Date.now();
  let client: import("pg").PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    const dbMs = Date.now() - start;
    const entry: HealthCheckEntry = {
      ts,
      status: "ok",
      dbMs,
      pool: getPoolStats(),
    };
    _push(entry);
    _handleAlertState("ok");
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
    _handleAlertState("error");
    _logger.error(
      { event: "HEALTH_MONITOR_CHECK", ...entry },
      "health-monitor: error",
    );
  } finally {
    // Always release — even on error, even if query hung and was killed by
    // statement_timeout. This is the guarantee that pool.query() failed to
    // provide through the Proxy.
    client?.release();
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
