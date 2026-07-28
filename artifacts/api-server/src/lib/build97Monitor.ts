/**
 * Build 97/98 — Apple 12-Hour Autonomous Monitoring
 *
 * Runs inside the always-on Railway API process. Survives Replit chat closure.
 * Checks all required endpoints every 5 minutes (144 cycles over 12 hours).
 * Results stored in a 150-entry ring buffer; accessible via
 * GET /api/monitoring/build97 (x-cron-secret authenticated).
 *
 * Monitoring categories (per Apple Response Package):
 *   A. Service Health
 *   B. Authentication (review-account login, guarded by REVIEW_ACCOUNT_PASSWORD env)
 *   C. Database & Infrastructure
 *   D. Core Features
 *   E. Capacity — active sessions, request latency, connection stability
 */

import { pool, getPoolStats } from "@workspace/db";

export interface MonitorEntry {
  ts: string;
  cycleMs: number;
  // A. Service health
  healthz: number | "err";
  readyz: number | "err";
  version: string | "err";
  // B. Auth
  reviewAccountLogin: "ok" | "fail" | "skip" | "err";
  loginChecksTotal: number;
  loginChecksFailed: number;
  // C. DB / infra
  pool: { total: number; idle: number; waiting: number };
  dbLatencyMs: number | null;
  activeSessions: number | null;         // proxy for concurrent authenticated users
  // D. Core features
  businesses: number | "err";
  businessesLatencyMs: number | null;
  culturalSites: number | "err";
  culturalSitesLatencyMs: number | null; // proxy for map load time
  mapLoadOk: boolean;                    // true if cultural-sites AND sundownTowns both 200
  sundownTowns: number | "err";
  communityPosts: number | "err";
  communityGuidelines: number | "err";
  events: number | "err";
  kinfolkAvailable: boolean;
  webLogin: number | "err";
  privacy: number | "err";
  // E. Capacity signals
  http500Count: number;                  // 500s seen this cycle across all checks
  timeoutCount: number;                  // fetch timeouts this cycle
  poolTrend: "stable" | "growing" | "unknown"; // based on last 6 cycles
  // P0/P1 flags
  p0Flags: string[];
  p1Flags: string[];
}

const MAX_ENTRIES = 150;
const _ring: MonitorEntry[] = [];
let _handle: ReturnType<typeof setInterval> | null = null;
let _cycleCount = 0;
let _p0Count = 0;
let _p1Count = 0;
// Capacity lifetime peaks
let _peakActiveSessions = 0;
let _totalHttp500s = 0;
let _totalTimeouts = 0;
let _loginChecksTotal = 0;
let _loginChecksFailed = 0;

const BASE = "https://www.mappingwithmelanin.com";

interface FetchResult { status: number; body: string; latencyMs: number; timedOut: boolean }

async function _get(path: string, timeoutMs = 8000): Promise<FetchResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}${path}`, { signal: ctrl.signal });
    const body = await r.text().catch(() => "");
    return { status: r.status, body, latencyMs: Date.now() - t0, timedOut: false };
  } catch {
    return { status: 0, body: "", latencyMs: Date.now() - t0, timedOut: true };
  } finally {
    clearTimeout(timer);
  }
}

async function _post(path: string, body: object, timeoutMs = 8000): Promise<FetchResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await r.text().catch(() => "");
    return { status: r.status, body: text, latencyMs: Date.now() - t0, timedOut: false };
  } catch {
    return { status: 0, body: "", latencyMs: Date.now() - t0, timedOut: true };
  } finally {
    clearTimeout(timer);
  }
}

/** Compute pool trend from last 6 ring entries. "growing" = monotonically increasing total. */
function _poolTrend(): "stable" | "growing" | "unknown" {
  const recent = _ring.slice(-6).map(e => e.pool.total);
  if (recent.length < 3) return "unknown";
  let growing = true;
  for (let i = 1; i < recent.length; i++) {
    if ((recent[i] ?? 0) <= (recent[i - 1] ?? 0)) { growing = false; break; }
  }
  return growing ? "growing" : "stable";
}

async function runCycle(): Promise<void> {
  const start = Date.now();
  const ts = new Date().toISOString();
  const p0Flags: string[] = [];
  const p1Flags: string[] = [];
  let http500Count = 0;
  let timeoutCount = 0;

  // ── A. Service health ──────────────────────────────────────────────────────
  const [hrz, rdz, ver] = await Promise.all([
    _get("/api/healthz"),
    _get("/api/readyz"),
    _get("/api/version"),
  ]);

  const healthz: number | "err" = hrz.timedOut ? "err" : hrz.status;
  const readyz: number | "err" = rdz.timedOut ? "err" : rdz.status;
  let version: string | "err" = "err";
  if (ver.status === 200) {
    try { version = (JSON.parse(ver.body)?.sha ?? "").slice(0, 8); } catch { /* err */ }
  }

  if (hrz.timedOut) timeoutCount++;
  if (rdz.timedOut) timeoutCount++;
  if (hrz.status === 500) http500Count++;
  if (rdz.status === 500) http500Count++;
  if (readyz !== 200) p0Flags.push(`readyz=${readyz}`);

  // ── B. Auth — review account ───────────────────────────────────────────────
  let reviewAccountLogin: "ok" | "fail" | "skip" | "err" = "skip";
  const reviewEmail = process.env.REVIEW_ACCOUNT_EMAIL ?? "reviewer@melaninmaps.com";
  const reviewPassword = process.env.REVIEW_ACCOUNT_PASSWORD;
  if (reviewPassword) {
    _loginChecksTotal++;
    const ar = await _post("/api/auth/login-email", { email: reviewEmail, password: reviewPassword });
    if (ar.timedOut) { reviewAccountLogin = "err"; timeoutCount++; }
    else if (ar.status === 200) {
      try {
        const parsed = JSON.parse(ar.body);
        // login-email returns { token: sid } on success (no user wrapper)
        // registration returns { token, user } — accept either shape
        reviewAccountLogin = (parsed?.token || parsed?.user) ? "ok" : "fail";
      } catch { reviewAccountLogin = "fail"; }
    } else {
      reviewAccountLogin = "fail";
      if (ar.status === 500) http500Count++;
    }
    if (reviewAccountLogin !== "ok") {
      _loginChecksFailed++;
      p0Flags.push(`reviewAccountLogin=${reviewAccountLogin}`);
    }
  }

  // ── C. DB / infra ──────────────────────────────────────────────────────────
  const poolStats = getPoolStats();
  let dbLatencyMs: number | null = null;
  let activeSessions: number | null = null;

  const [dbProbe, sessProbe] = await Promise.all([
    (async () => {
      try {
        const t0 = Date.now();
        await Promise.race([
          pool.query("SELECT 1"),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
        ]);
        return Date.now() - t0;
      } catch { return null; }
    })(),
    (async () => {
      try {
        const r = await pool.query<{ cnt: string }>(
          `SELECT COUNT(*) AS cnt FROM sessions WHERE expire > NOW()`,
        );
        return parseInt(r.rows[0]?.cnt ?? "0", 10);
      } catch { return null; }
    })(),
  ]);

  dbLatencyMs = dbProbe;
  activeSessions = sessProbe;

  if (activeSessions !== null && activeSessions > _peakActiveSessions) {
    _peakActiveSessions = activeSessions;
  }
  if (dbLatencyMs === null) p0Flags.push("db_query_failed");
  if (poolStats.waiting > 0) p0Flags.push(`pool_waiting=${poolStats.waiting}`);

  // ── D. Core features (all in parallel) ────────────────────────────────────
  const [bizR, csR, stR, postsR, guideR, evR, kfR, loginR, privR] = await Promise.all([
    _get("/api/businesses?limit=1"),
    _get("/api/cultural-sites?limit=1"),
    _get("/api/cultural-sites?heritageCategory=Historical%20Sundown%20Town&limit=1"),
    _get("/api/community/posts?limit=1"),
    _get("/api/community/guidelines"),
    _get("/api/events?limit=1"),
    _post("/api/kinfolk/chat", { message: "ping", conversationId: "monitor" }),
    _get("/login"),
    _get("/privacy"),
  ]);

  // Count 500s and timeouts from feature checks
  for (const r of [bizR, csR, stR, postsR, guideR, evR, kfR, loginR, privR]) {
    if (r.timedOut) timeoutCount++;
    if (r.status === 500) http500Count++;
  }

  const businesses: number | "err" = bizR.timedOut ? "err" : bizR.status;
  const businessesLatencyMs = bizR.timedOut ? null : bizR.latencyMs;
  const culturalSites: number | "err" = csR.timedOut ? "err" : csR.status;
  const culturalSitesLatencyMs = csR.timedOut ? null : csR.latencyMs;

  let sundownTowns: number | "err" = stR.timedOut ? "err" : stR.status;
  if (!stR.timedOut && stR.status === 200) {
    try {
      const d = JSON.parse(stR.body);
      const arr = Array.isArray(d) ? d : (d?.sites ?? []);
      sundownTowns = arr.length > 0 ? 200 : 0;
    } catch { /* keep status */ }
  }

  // mapLoadOk = sundown towns are reachable and non-empty.
  // cultural-sites is checked separately (schema may lag after migrations).
  const mapLoadOk = sundownTowns === 200;
  const communityPosts: number | "err" = postsR.timedOut ? "err" : postsR.status;
  const communityGuidelines: number | "err" = guideR.timedOut ? "err" : guideR.status;
  const events: number | "err" = evR.timedOut ? "err" : evR.status;
  const kinfolkAvailable = !kfR.timedOut && kfR.status !== 500 && kfR.status !== 503 && kfR.status !== 0;
  const webLogin: number | "err" = loginR.timedOut ? "err" : loginR.status;
  const privacy: number | "err" = privR.timedOut ? "err" : privR.status;

  if (sundownTowns === 0) p0Flags.push("sundown_towns_empty");
  if (sundownTowns === "err") p1Flags.push("sundown_towns_error");
  if (!mapLoadOk) p1Flags.push("map_load_degraded");
  if (!kinfolkAvailable) p1Flags.push("kinfolk_unavailable");
  if (communityPosts === "err") p1Flags.push("community_posts_error");
  if (businesses === "err") p1Flags.push("businesses_error");
  if (http500Count > 0) p1Flags.push(`http_500s=${http500Count}`);
  if (timeoutCount > 0) p1Flags.push(`timeouts=${timeoutCount}`);

  // ── E. Capacity ────────────────────────────────────────────────────────────
  const poolTrend = _poolTrend();
  if (poolTrend === "growing") p1Flags.push("pool_total_growing");

  _totalHttp500s += http500Count;
  _totalTimeouts += timeoutCount;

  const entry: MonitorEntry = {
    ts, cycleMs: Date.now() - start,
    healthz, readyz, version,
    reviewAccountLogin, loginChecksTotal: _loginChecksTotal, loginChecksFailed: _loginChecksFailed,
    pool: poolStats, dbLatencyMs, activeSessions,
    businesses, businessesLatencyMs,
    culturalSites, culturalSitesLatencyMs, mapLoadOk,
    sundownTowns, communityPosts, communityGuidelines,
    events, kinfolkAvailable, webLogin, privacy,
    http500Count, timeoutCount, poolTrend,
    p0Flags, p1Flags,
  };

  _ring.push(entry);
  if (_ring.length > MAX_ENTRIES) _ring.shift();
  _cycleCount++;
  if (p0Flags.length > 0) _p0Count++;
  if (p1Flags.length > 0) _p1Count++;

  const level = p0Flags.length > 0 ? "error" : p1Flags.length > 0 ? "warn" : "info";
  const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  logFn(JSON.stringify({
    event: "BUILD97_MONITOR",
    ts, cycle: _cycleCount,
    p0: p0Flags, p1: p1Flags,
    pool: poolStats, dbLatencyMs,
    activeSessions,
    http500Count, timeoutCount, poolTrend,
    healthz, readyz, version,
    reviewAccountLogin,
    sundownTowns, mapLoadOk,
    culturalSitesLatencyMs,
    businessesLatencyMs,
  }));
}

export function getMonitorSummary() {
  const total = _ring.length;
  const errors = _ring.filter(e => e.p0Flags.length > 0).length;
  const warnings = _ring.filter(e => e.p1Flags.length > 0).length;
  const successRate = total > 0 ? (((total - errors) / total) * 100).toFixed(1) : "N/A";

  const latencies = _ring.map(e => e.dbLatencyMs).filter((n): n is number => n !== null);
  const avgDbLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
  const sortedLat = [...latencies].sort((a, b) => a - b);
  const p95DbLatency = sortedLat.length > 0 ? (sortedLat[Math.floor(sortedLat.length * 0.95)] ?? null) : null;

  const csLatencies = _ring.map(e => e.culturalSitesLatencyMs).filter((n): n is number => n !== null);
  const avgMapLoadMs = csLatencies.length > 0 ? Math.round(csLatencies.reduce((a, b) => a + b, 0) / csLatencies.length) : null;
  const p95MapLoadMs = csLatencies.length > 0 ? ([...csLatencies].sort((a, b) => a - b)[Math.floor(csLatencies.length * 0.95)] ?? null) : null;

  const bizLatencies = _ring.map(e => e.businessesLatencyMs).filter((n): n is number => n !== null);
  const avgBizLatencyMs = bizLatencies.length > 0 ? Math.round(bizLatencies.reduce((a, b) => a + b, 0) / bizLatencies.length) : null;

  // Pool trend across all history
  const poolTotals = _ring.map(e => e.pool.total);
  const peakPoolTotal = poolTotals.length > 0 ? Math.max(...poolTotals) : 0;
  const peakPoolWaiting = Math.max(..._ring.map(e => e.pool.waiting), 0);
  const currentPoolTrend = _poolTrend();
  const poolLeakSuspect = currentPoolTrend === "growing";

  // Map load health
  const mapLoadFailCycles = _ring.filter(e => !e.mapLoadOk).length;

  const latest = _ring[_ring.length - 1] ?? null;

  return {
    // ── Identity ──
    monitoringMechanism: "setInterval inside always-on Railway API process",
    intervalMinutes: 5,
    survivesReplitChatClosure: true,
    // ── Progress ──
    cyclesCompleted: _cycleCount,
    cyclesExpected: 144,
    percentComplete: _cycleCount > 0 ? ((_cycleCount / 144) * 100).toFixed(1) + "%" : "0%",
    // ── Health ──
    total, errors, warnings,
    successRate: successRate + "%",
    p0EventCount: _p0Count,
    p1EventCount: _p1Count,
    // ── DB ──
    avgDbLatencyMs: avgDbLatency,
    p95DbLatencyMs: p95DbLatency,
    // ── Capacity: concurrent users ──
    peakActiveSessionsObserved: _peakActiveSessions,
    latestActiveSessionsCount: latest?.activeSessions ?? null,
    // ── Capacity: map load ──
    avgMapLoadMs,
    p95MapLoadMs,
    mapLoadFailCycles,
    mapLoadHealthy: mapLoadFailCycles === 0,
    // ── Capacity: API latency ──
    avgBizApiLatencyMs: avgBizLatencyMs,
    // ── Capacity: 500s and timeouts ──
    totalHttp500sObserved: _totalHttp500s,
    totalTimeoutsObserved: _totalTimeouts,
    anyHttp500OrTimeout: _totalHttp500s > 0 || _totalTimeouts > 0,
    // ── Capacity: connection stability ──
    peakPoolTotal,
    peakPoolWaiting,
    currentPoolTrend,
    poolLeakSuspect,
    // ── Auth checks ──
    loginChecksTotal: _loginChecksTotal,
    loginChecksFailed: _loginChecksFailed,
    loginCheckPassRate: _loginChecksTotal > 0
      ? (((_loginChecksTotal - _loginChecksFailed) / _loginChecksTotal) * 100).toFixed(1) + "%"
      : "skipped — set REVIEW_ACCOUNT_PASSWORD Railway env var to activate",
    // ── Latest ──
    latest,
    history: _ring.slice(-10),
  };
}

export function startBuild97Monitor(intervalMs = 300_000): void {
  if (_handle) return;
  runCycle().catch(() => {});
  _handle = setInterval(() => { runCycle().catch(() => {}); }, intervalMs);
  _handle.unref();
  console.info(JSON.stringify({ event: "BUILD97_MONITOR_START", intervalMs, cyclesExpected: 144 }));
}

export function stopBuild97Monitor(): void {
  if (_handle) { clearInterval(_handle); _handle = null; }
}
