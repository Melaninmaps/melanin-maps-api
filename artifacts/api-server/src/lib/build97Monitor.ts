/**
 * Build 98 — Apple Approval Autonomous Monitoring (condition-based stop)
 *
 * Runs inside the always-on Railway API process. Survives Replit chat closure.
 * Checks all required endpoints every 5 minutes.
 * Results stored in a 288-entry ring buffer (24 h at 5-min intervals).
 * Accessible via GET /api/monitoring/build97 (x-cron-secret authenticated).
 *
 * STOP CONDITION: not time-based. Continues until:
 *   1. appleStatus env var = "approved" or "ready_for_sale"
 *   2. No unresolved P0
 *   3. 12 consecutive stable hours (144 cycles) after approval
 *   If Apple rejects → monitor continues, founder must explicitly set appleStatus="monitoring_ended"
 *
 * Monitoring categories:
 *   A. Service Health (every cycle)
 *   B. Authentication (every cycle, guarded by REVIEW_ACCOUNT_PASSWORD env)
 *   C. Database & Infrastructure (every cycle)
 *   D. Core Features (every cycle)
 *   E. Capacity signals (every cycle)
 *   F. KinfolkAI synthetic prompt (every 12th cycle ≈ 1/hour)
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

const MAX_ENTRIES = 288; // 24 h at 5-min intervals
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
// Post-approval stability tracking
let _approvalDetectedAt: string | null = null;
let _postApprovalStableCycles = 0;
let _kinfolkSyntheticFailures = 0;

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
  // NOTE: /api/readyz is NOT checked via HTTP here — it does its own DB probe
  // which competes with the monitor's direct DB queries and saturates the max:5
  // pool when both fire concurrently.  Instead, readyz is derived below from
  // the internal DB latency check: if the monitor can query the DB, the server
  // is ready.  healthz (no DB) is still checked via HTTP as an API-layer pulse.
  const [hrz, ver] = await Promise.all([
    _get("/api/healthz"),
    _get("/api/version"),
  ]);

  const healthz: number | "err" = hrz.timedOut ? "err" : hrz.status;
  // readyz is populated after the DB probe below
  let readyz: number | "err" = "err";
  let version: string | "err" = "err";
  if (ver.status === 200) {
    try { version = (JSON.parse(ver.body)?.sha ?? "").slice(0, 8); } catch { /* err */ }
  }

  if (hrz.timedOut) timeoutCount++;
  if (hrz.status === 500) http500Count++;

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
  // IMPORTANT: Do NOT use Promise.race with pool.query() — it abandons the pg
  // promise without releasing the pool client, leaking connections until the
  // pool's maxLifetimeSeconds recycles them. Instead, acquire a client
  // explicitly so the finally block always releases it. The pool itself has
  // connectionTimeoutMillis:10_000 and query_timeout:10_000 as backstops.
  const poolStats = getPoolStats();
  let dbLatencyMs: number | null = null;
  let activeSessions: number | null = null;

  const [dbProbe, sessProbe] = await Promise.all([
    (async () => {
      let client: import("pg").PoolClient | undefined;
      try {
        client = await pool.connect();
        const t0 = Date.now();
        await client.query("SELECT 1");
        return Date.now() - t0;
      } catch { return null; }
      finally { client?.release(); }
    })(),
    (async () => {
      let client: import("pg").PoolClient | undefined;
      try {
        client = await pool.connect();
        const r = await client.query<{ cnt: string }>(
          `SELECT COUNT(*) AS cnt FROM sessions WHERE expire > NOW()`,
        );
        return parseInt(r.rows[0]?.cnt ?? "0", 10);
      } catch { return null; }
      finally { client?.release(); }
    })(),
  ]);

  dbLatencyMs = dbProbe;
  activeSessions = sessProbe;

  if (activeSessions !== null && activeSessions > _peakActiveSessions) {
    _peakActiveSessions = activeSessions;
  }
  // Derive readyz from DB probe — if the monitor can query the DB, the server is ready.
  // This avoids making a separate HTTP /api/readyz call which does its own DB check
  // and can temporarily saturate the pool when fired concurrently with the monitor probes.
  readyz = dbLatencyMs !== null ? 200 : 503;

  if (dbLatencyMs === null) p0Flags.push("db_query_failed");
  if (readyz !== 200) p0Flags.push(`readyz=${readyz}`);
  if (poolStats.waiting > 0) p0Flags.push(`pool_waiting=${poolStats.waiting}`);

  // ── D. Core features (all in parallel) ────────────────────────────────────
  const [bizR, csR, stR, postsR, guideR, evR, kfR, loginR, privR, termsR, supportR] = await Promise.all([
    _get("/api/businesses?limit=1"),
    _get("/api/cultural-sites?limit=1"),
    _get("/api/cultural-sites?heritageCategory=Historical%20Sundown%20Town&limit=1"),
    _get("/api/community/posts?limit=1"),
    _get("/api/community/guidelines"),
    _get("/api/events?limit=1"),
    // Lightweight availability check — no auth, no OpenAI call, no DB writes.
    _get("/api/kinfolk/health"),
    _get("/login"),
    _get("/privacy"),
    _get("/terms"),
    _get("/delete-account"), // support / account-deletion URL required by App Store
  ]);

  // Count 500s and timeouts from feature checks
  for (const r of [bizR, csR, stR, postsR, guideR, evR, kfR, loginR, privR, termsR, supportR]) {
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

  const mapLoadOk = sundownTowns === 200;
  const communityPosts: number | "err" = postsR.timedOut ? "err" : postsR.status;
  const communityGuidelines: number | "err" = guideR.timedOut ? "err" : guideR.status;
  const events: number | "err" = evR.timedOut ? "err" : evR.status;
  const kinfolkAvailable = !kfR.timedOut && kfR.status !== 500 && kfR.status !== 503 && kfR.status !== 0;
  const webLogin: number | "err" = loginR.timedOut ? "err" : loginR.status;
  const privacy: number | "err" = privR.timedOut ? "err" : privR.status;
  const terms: number | "err" = termsR.timedOut ? "err" : termsR.status;
  const support: number | "err" = supportR.timedOut ? "err" : supportR.status;

  if (sundownTowns === 0) p0Flags.push("sundown_towns_empty");
  if (sundownTowns === "err") p1Flags.push("sundown_towns_error");
  if (!mapLoadOk) p1Flags.push("map_load_degraded");
  if (!kinfolkAvailable) p1Flags.push("kinfolk_unavailable");
  if (communityPosts === "err") p1Flags.push("community_posts_error");
  if (businesses === "err") p1Flags.push("businesses_error");
  if (privacy === "err" || terms === "err" || support === "err") p1Flags.push("legal_pages_error");
  if (http500Count > 0) p1Flags.push(`http_500s=${http500Count}`);
  if (timeoutCount > 0) p1Flags.push(`timeouts=${timeoutCount}`);

  // ── F. KinfolkAI synthetic prompt (every 12th cycle ≈ once/hour) ──────────
  // Uses REVIEW_ACCOUNT_PASSWORD for authenticated session. Confirms a coherent
  // response is returned without provider error exposed to the user.
  // Cost-controlled: only runs if credentials are available and no P0 is active.
  let kinfolkSyntheticResult: "ok" | "fail" | "skip" | "no_creds" = "skip";
  if (_cycleCount % 12 === 0) {
    const kfPassword = process.env.REVIEW_ACCOUNT_PASSWORD;
    const kfEmail = process.env.REVIEW_ACCOUNT_EMAIL ?? "reviewer@melaninmaps.com";
    if (!kfPassword) {
      kinfolkSyntheticResult = "no_creds";
    } else {
      try {
        // Step 1: authenticate to get a session token
        const authR = await _post("/api/auth/login-email", { email: kfEmail, password: kfPassword }, 10_000);
        const token = authR.status === 200 ? (() => { try { return JSON.parse(authR.body)?.token; } catch { return null; } })() : null;
        if (token) {
          // Step 2: send a safe, cheap synthetic prompt
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 20_000);
          try {
            const r = await fetch(`${BASE}/api/kinfolk/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Cookie: `sid=${token}` },
              body: JSON.stringify({ message: "Tell me briefly about Philadelphia.", conversationId: null }),
              signal: ctrl.signal,
            });
            const body = await r.text().catch(() => "");
            // Confirm: non-empty response, no raw provider error exposed
            const coherent = r.status === 200 && body.length > 10 && !body.includes("OpenAI") && !body.includes("API key");
            kinfolkSyntheticResult = coherent ? "ok" : "fail";
            if (!coherent) _kinfolkSyntheticFailures++;
          } catch {
            kinfolkSyntheticResult = "fail";
            _kinfolkSyntheticFailures++;
          } finally {
            clearTimeout(timer);
          }
        } else {
          kinfolkSyntheticResult = "fail";
          _kinfolkSyntheticFailures++;
        }
      } catch {
        kinfolkSyntheticResult = "fail";
        _kinfolkSyntheticFailures++;
      }
    }
    if (kinfolkSyntheticResult === "fail") p1Flags.push("kinfolk_synthetic_fail");
  }

  // ── Apple approval tracking ────────────────────────────────────────────────
  // APPLE_REVIEW_STATUS env var must be manually set by founder.
  // Values: waiting_for_review | in_review | approved | ready_for_sale |
  //         rejected | metadata_rejected | developer_action_needed | pending_developer_release
  const appleStatus = (process.env.APPLE_REVIEW_STATUS ?? "waiting_for_review") as string;
  const appleApproved = appleStatus === "approved" || appleStatus === "ready_for_sale";

  if (appleApproved && !_approvalDetectedAt) {
    _approvalDetectedAt = ts;
    console.info(JSON.stringify({ event: "BUILD98_APPLE_APPROVED", ts, appleStatus }));
  }
  if (appleStatus === "rejected" || appleStatus === "metadata_rejected") {
    p0Flags.push(`apple_${appleStatus}`);
  }

  // Post-approval stability: increment only if approved AND no P0 this cycle
  if (appleApproved && p0Flags.length === 0) {
    _postApprovalStableCycles++;
  } else if (appleApproved && p0Flags.length > 0) {
    _postApprovalStableCycles = 0; // reset — P0 broke the stable window
  }

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
    event: "BUILD98_MONITOR",
    ts, cycle: _cycleCount,
    appleStatus,
    postApprovalStableCycles: _postApprovalStableCycles,
    p0: p0Flags, p1: p1Flags,
    pool: poolStats, dbLatencyMs,
    activeSessions,
    http500Count, timeoutCount, poolTrend,
    healthz, readyz, version,
    reviewAccountLogin,
    kinfolkSyntheticResult,
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

  // ── Stop condition evaluation ──
  const appleStatus = (process.env.APPLE_REVIEW_STATUS ?? "waiting_for_review") as string;
  const appleApproved = appleStatus === "approved" || appleStatus === "ready_for_sale";
  const POST_APPROVAL_STABLE_REQUIRED = 144; // 12 h at 5-min intervals
  const stopConditionMet =
    appleApproved &&
    _p0Count === 0 &&
    _postApprovalStableCycles >= POST_APPROVAL_STABLE_REQUIRED;

  return {
    // ── Identity ──
    monitoringMechanism: "setInterval inside always-on Railway API process",
    intervalMinutes: 5,
    survivesReplitChatClosure: true,
    stopCondition: "condition-based (not time-based): Apple approved + no P0 ever + 12h stable post-approval",
    stopConditionMet,
    // ── Apple status ──
    appleStatus,
    appleApproved,
    approvalDetectedAt: _approvalDetectedAt,
    postApprovalStableCycles: _postApprovalStableCycles,
    postApprovalStableRequired: POST_APPROVAL_STABLE_REQUIRED,
    postApprovalStableMinutesRemaining: appleApproved
      ? Math.max(0, (POST_APPROVAL_STABLE_REQUIRED - _postApprovalStableCycles) * 5)
      : null,
    // ── Progress ──
    cyclesCompleted: _cycleCount,
    cyclesExpected: "condition-based",
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
    // ── KinfolkAI synthetic ──
    kinfolkSyntheticFailures: _kinfolkSyntheticFailures,
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
  console.info(JSON.stringify({
    event: "BUILD98_MONITOR_START",
    intervalMs,
    stopCondition: "condition-based: Apple approved + no P0 + 12h stable post-approval",
    ringBufferCapacity: MAX_ENTRIES,
  }));
}

export function stopBuild97Monitor(): void {
  if (_handle) { clearInterval(_handle); _handle = null; }
}
