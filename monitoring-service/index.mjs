/**
 * Mapping With Melanin — External Monitoring Service
 *
 * ARCHITECTURE INTENT:
 * This is a SEPARATE Railway service from the API. It does NOT share the API's
 * PostgreSQL pool. It checks production endpoints via HTTP only. It has its own
 * pg.Pool(max:2) solely for writing evidence to monitoring_events table.
 * If this service crashes or misbehaves, the production API is unaffected.
 *
 * Deploy as a second Railway service with start command:
 *   node monitoring-service/index.mjs
 *
 * Required Railway env vars (monitoring service):
 *   MONITOR_API_BASE        — e.g. https://www.mappingwithmelanin.com
 *   MONITOR_DATABASE_URL    — same DATABASE_URL as the API (for evidence writes)
 *   CRON_SECRET             — same as API, for /api/monitoring/build97
 *   REVIEW_ACCOUNT_EMAIL    — appstorereview@mappingwithmelanin.com
 *   REVIEW_ACCOUNT_PASSWORD — MapReview2026!
 *   TWILIO_ACCOUNT_SID      — Twilio account SID
 *   TWILIO_AUTH_TOKEN       — Twilio auth token
 *   TWILIO_PHONE_FROM       — Twilio phone number (e.g. +12025550000)
 *   MONITOR_ALERT_PHONE     — Founder's phone number (e.g. +12025551234)
 *   APPLE_REVIEW_STATUS     — waiting_for_review | in_review | approved | rejected
 *   PORT                    — assigned by Railway
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import pg from "pg";

const { Pool } = pg;

// ── Configuration ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "8090", 10);
const API_BASE = (process.env.MONITOR_API_BASE || "https://www.mappingwithmelanin.com").replace(/\/$/, "");
const CRON_SECRET = process.env.CRON_SECRET || "";
const REVIEW_EMAIL = process.env.REVIEW_ACCOUNT_EMAIL || "appstorereview@mappingwithmelanin.com";
const REVIEW_PASSWORD = process.env.REVIEW_ACCOUNT_PASSWORD || "";
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const KINFOLK_INTERVAL_CYCLES = 12; // ~hourly

// ── Evidence DB (own pool, max:2 — never shares with API) ─────────────────────
const DB_URL = process.env.MONITOR_DATABASE_URL || process.env.DATABASE_URL || "";
const evidencePool = DB_URL
  ? new Pool({
      connectionString: DB_URL,
      max: 2,
      ssl: DB_URL.includes(".internal") ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    })
  : null;

// ── Alert: Twilio SMS ─────────────────────────────────────────────────────────
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_PHONE_FROM || "";
const ALERT_TO = process.env.MONITOR_ALERT_PHONE || "";

async function sendSmsAlert(message) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM || !ALERT_TO) {
    console.error(JSON.stringify({ event: "ALERT_SKIPPED", reason: "Twilio env vars not configured", ts: new Date().toISOString() }));
    return false;
  }
  return new Promise((resolve) => {
    const body = new URLSearchParams({
      To: ALERT_TO,
      From: TWILIO_FROM,
      Body: message.slice(0, 1600),
    }).toString();
    const opts = {
      hostname: "api.twilio.com",
      path: `/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
        Authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        console.log(JSON.stringify({ event: ok ? "ALERT_SENT" : "ALERT_FAILED", status: res.statusCode, ts: new Date().toISOString() }));
        resolve(ok);
      });
    });
    req.on("error", (e) => {
      console.error(JSON.stringify({ event: "ALERT_ERROR", error: e.message, ts: new Date().toISOString() }));
      resolve(false);
    });
    req.write(body);
    req.end();
  });
}

// ── HTTP probe — never uses DB pool ──────────────────────────────────────────
function httpGet(url, opts = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const timeout = opts.timeout || 8000;
    const headers = opts.headers || {};
    let timedOut = false;
    const req = lib.request(
      { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: "GET", headers, timeout },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => resolve({ status: res.statusCode, body, timedOut: false }));
      }
    );
    req.on("timeout", () => {
      timedOut = true;
      req.destroy();
      resolve({ status: 0, body: "", timedOut: true });
    });
    req.on("error", () => resolve({ status: 0, body: "", timedOut }));
    req.end();
  });
}

async function httpPost(url, payload, opts = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const body = JSON.stringify(payload);
    const timeout = opts.timeout || 10000;
    let timedOut = false;
    const req = lib.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        timeout,
      },
      (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => resolve({ status: res.statusCode, body: data, timedOut: false }));
      }
    );
    req.on("timeout", () => {
      timedOut = true;
      req.destroy();
      resolve({ status: 0, body: "", timedOut: true });
    });
    req.on("error", () => resolve({ status: 0, body: "", timedOut }));
    req.write(body);
    req.end();
  });
}

// ── State ─────────────────────────────────────────────────────────────────────
let _cycleCount = 0;
let _p0Count = 0;
let _p1Count = 0;
let _consecutiveClean = 0;
let _postApprovalStable = 0;
let _approvalDetectedAt = null;
let _lastAlertAt = null;
const P0_ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 min between SMS

// ── Run one monitoring cycle ──────────────────────────────────────────────────
async function runCycle() {
  const cycleStart = Date.now();
  _cycleCount++;
  const n = _cycleCount;

  // A. Static endpoints
  const [healthz, readyz, version, biz, cultural, sundown, events, posts, login, kinfolkHealth, terms, deleteAccount] =
    await Promise.all([
      httpGet(`${API_BASE}/api/healthz`),
      httpGet(`${API_BASE}/api/readyz`),
      httpGet(`${API_BASE}/api/version`),
      httpGet(`${API_BASE}/api/businesses?limit=1`),
      httpGet(`${API_BASE}/api/cultural-sites?limit=1`),
      httpGet(`${API_BASE}/api/cultural-sites?heritageCategory=Historical%20Sundown%20Town&limit=1`),
      httpGet(`${API_BASE}/api/events?limit=1`),
      httpGet(`${API_BASE}/api/community/posts?limit=1`),
      httpGet(`${API_BASE}/login`),
      httpGet(`${API_BASE}/api/kinfolk/health`),
      httpGet(`${API_BASE}/terms`),
      httpGet(`${API_BASE}/delete-account`),
    ]);

  // B. Parse readyz for pool stats
  let poolTotal = null, poolIdle = null, poolWaiting = null, dbLatencyMs = null;
  try {
    const rz = JSON.parse(readyz.body);
    poolTotal = rz.pool?.total ?? null;
    poolIdle = rz.pool?.idle ?? null;
    poolWaiting = rz.pool?.waiting ?? null;
    if (poolWaiting === null) {
      // Fallback: parse from /api/monitoring/build97
      const mon = await httpGet(`${API_BASE}/api/monitoring/build97`, { headers: { "x-cron-secret": CRON_SECRET } });
      try {
        const md = JSON.parse(mon.body);
        poolWaiting = md.build97?.latest?.pool?.waiting ?? null;
        poolTotal = md.build97?.latest?.pool?.total ?? null;
        poolIdle = md.build97?.latest?.pool?.idle ?? null;
        dbLatencyMs = md.build97?.latest?.dbLatencyMs ?? null;
      } catch {}
    }
  } catch {}

  // C. Review account login test (uses HTTP POST, not DB pool)
  let loginOk = false;
  if (REVIEW_PASSWORD) {
    const loginRes = await httpPost(`${API_BASE}/api/auth/login-email`, { email: REVIEW_EMAIL, password: REVIEW_PASSWORD });
    try {
      const ld = JSON.parse(loginRes.body);
      loginOk = !!ld.token;
    } catch {}
  }

  // D. KinfolkAI synthetic prompt (every KINFOLK_INTERVAL_CYCLES cycles)
  let kinfolkOk = null;
  if (n % KINFOLK_INTERVAL_CYCLES === 0) {
    let kinfolkToken = "";
    try {
      const lr = await httpPost(`${API_BASE}/api/auth/login-email`, { email: REVIEW_EMAIL, password: REVIEW_PASSWORD });
      kinfolkToken = JSON.parse(lr.body).token || "";
    } catch {}
    if (kinfolkToken) {
      const kr = await new Promise((resolve) => {
        const body = JSON.stringify({ message: "Tell me briefly about Philadelphia." });
        const parsed = new URL(`${API_BASE}/api/kinfolk/chat`);
        const req = https.request(
          {
            hostname: parsed.hostname,
            path: parsed.pathname,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
              Authorization: `Bearer ${kinfolkToken}`,
              Cookie: `mwm_session=${kinfolkToken}`,
            },
            timeout: 20000,
          },
          (res) => {
            let data = "";
            res.on("data", (d) => (data += d));
            res.on("end", () => resolve({ status: res.statusCode, body: data }));
          }
        );
        req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "" }); });
        req.on("error", () => resolve({ status: 0, body: "" }));
        req.write(body);
        req.end();
      });
      try {
        const kd = JSON.parse(kr.body);
        const reply = (kd.reply || kd.message || kd.content || "").toLowerCase();
        kinfolkOk = reply.length > 20 && !reply.includes("error") && !reply.includes("api key");
      } catch { kinfolkOk = false; }
    }
  }

  // E. Apple status
  const appleStatus = (process.env.APPLE_REVIEW_STATUS || "waiting_for_review").toLowerCase();
  const appleApproved = appleStatus === "approved" || appleStatus === "ready_for_sale";

  // F. P0 / P1 classification
  const p0Flags = [];
  const p1Flags = [];

  if (healthz.status !== 200) p0Flags.push("healthz_down");
  if (readyz.status !== 200) p0Flags.push("readyz_down");
  if (biz.status !== 200 || biz.timedOut) p0Flags.push("businesses_down");
  if (cultural.status !== 200 || cultural.timedOut) p0Flags.push("cultural_sites_down");
  if (sundown.status !== 200 || sundown.timedOut) p0Flags.push("sundown_towns_down");
  if (events.status !== 200 || events.timedOut) p0Flags.push("events_down");
  if (posts.status !== 200 || posts.timedOut) p0Flags.push("community_posts_down");
  if (poolWaiting !== null && poolWaiting > 0) p0Flags.push(`pool_waiting=${poolWaiting}`);
  if (appleStatus === "rejected") p0Flags.push("apple_rejected");
  if (REVIEW_PASSWORD && !loginOk) p0Flags.push("review_account_login_failed");
  if (kinfolkOk === false) p0Flags.push("kinfolk_ai_failed");

  if (login.status !== 200) p1Flags.push("login_page_down");
  if (terms.status !== 200) p1Flags.push("terms_page_down");
  if (deleteAccount.status !== 200) p1Flags.push("delete_account_page_down");
  if (kinfolkHealth.status !== 200) p1Flags.push("kinfolk_health_down");

  const isP0 = p0Flags.length > 0;
  const isP1 = p1Flags.length > 0;

  if (isP0) {
    _p0Count++;
    _consecutiveClean = 0;
  } else {
    _consecutiveClean++;
    if (appleApproved) _postApprovalStable++;
    else _postApprovalStable = 0;
    if (!_approvalDetectedAt && appleApproved) {
      _approvalDetectedAt = new Date().toISOString();
    }
  }
  if (isP1) _p1Count++;

  const cycleMs = Date.now() - cycleStart;

  // G. Write evidence to DB
  const row = {
    ts: new Date().toISOString(),
    cycle_number: n,
    service: "external-monitor",
    is_p0: isP0,
    is_p1: isP1,
    p0_flags: p0Flags,
    p1_flags: p1Flags,
    pool_total: poolTotal,
    pool_idle: poolIdle,
    pool_waiting: poolWaiting,
    db_latency_ms: dbLatencyMs,
    healthz_status: healthz.status,
    readyz_status: readyz.status,
    biz_status: biz.status,
    cultural_status: cultural.status,
    events_status: events.status,
    posts_status: posts.status,
    login_ok: loginOk,
    kinfolk_ok: kinfolkOk,
    cycle_ms: cycleMs,
    alert_sent: false,
  };

  let alertSent = false;
  if (evidencePool) {
    let dbClient;
    try {
      dbClient = await evidencePool.connect();
      await dbClient.query(
        `INSERT INTO monitoring_events
          (ts,cycle_number,service,is_p0,is_p1,p0_flags,p1_flags,pool_total,pool_idle,pool_waiting,
           db_latency_ms,healthz_status,readyz_status,biz_status,cultural_status,events_status,
           posts_status,login_ok,kinfolk_ok,cycle_ms,alert_sent,raw_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [row.ts, row.cycle_number, row.service, row.is_p0, row.is_p1,
         row.p0_flags, row.p1_flags, row.pool_total, row.pool_idle, row.pool_waiting,
         row.db_latency_ms, row.healthz_status, row.readyz_status, row.biz_status,
         row.cultural_status, row.events_status, row.posts_status,
         row.login_ok, row.kinfolk_ok, row.cycle_ms, false,
         JSON.stringify({ healthz: healthz.status, readyz: readyz.status, version: version.status,
           appleStatus, p0Flags, p1Flags, consecutiveClean: _consecutiveClean })]
      );
    } catch (e) {
      console.error(JSON.stringify({ event: "EVIDENCE_WRITE_ERROR", error: e.message, ts: new Date().toISOString() }));
    } finally {
      dbClient?.release();
    }
  }

  // H. SMS alert on P0 (with cooldown)
  if (isP0) {
    const now = Date.now();
    const sinceLastAlert = _lastAlertAt ? now - _lastAlertAt : Infinity;
    if (sinceLastAlert >= P0_ALERT_COOLDOWN_MS) {
      const msg = `[MWM P0] Cycle ${n} — ${p0Flags.join(", ")}. Pool: ${poolWaiting ?? "?"}w/${poolTotal ?? "?"}t. ${new Date().toUTCString()}`;
      alertSent = await sendSmsAlert(msg);
      if (alertSent) _lastAlertAt = now;
      // Update evidence row
      if (evidencePool && alertSent) {
        let c;
        try {
          c = await evidencePool.connect();
          await c.query("UPDATE monitoring_events SET alert_sent=TRUE WHERE cycle_number=$1 AND service=$2", [n, "external-monitor"]);
        } catch {} finally { c?.release(); }
      }
    }
  }

  // I. Emit structured log
  const level = isP0 ? "error" : isP1 ? "warn" : "info";
  console[level](JSON.stringify({
    event: "EXTERNAL_MONITOR",
    ts: row.ts,
    cycle: n,
    isP0,
    isP1,
    p0Flags,
    p1Flags,
    pool: { total: poolTotal, idle: poolIdle, waiting: poolWaiting },
    dbMs: dbLatencyMs,
    healthz: healthz.status,
    readyz: readyz.status,
    biz: biz.status,
    cultural: cultural.status,
    events: events.status,
    posts: posts.status,
    loginOk,
    kinfolkOk,
    consecutiveClean: _consecutiveClean,
    postApprovalStable: _postApprovalStable,
    appleStatus,
    cycleMs,
    alertSent,
  }));

  return { isP0, isP1, p0Flags, p1Flags };
}

// ── Status endpoint ───────────────────────────────────────────────────────────
function getStatus() {
  const appleStatus = (process.env.APPLE_REVIEW_STATUS || "waiting_for_review").toLowerCase();
  const appleApproved = appleStatus === "approved" || appleStatus === "ready_for_sale";
  const POST_APPROVAL_REQUIRED = 144;
  const stopConditionMet =
    appleApproved && _p0Count === 0 && _postApprovalStable >= POST_APPROVAL_REQUIRED;
  return {
    service: "external-monitor",
    mechanism: "Separate Railway service — HTTP-only checks, own pg.Pool(max:2) for evidence writes",
    doesNotShareApiPool: true,
    intervalMinutes: 5,
    cyclesCompleted: _cycleCount,
    consecutiveClean: _consecutiveClean,
    p0Count: _p0Count,
    p1Count: _p1Count,
    stopCondition: "condition-based: Apple approved + no P0 + 144 consecutive clean post-approval",
    stopConditionMet,
    appleStatus,
    appleApproved,
    approvalDetectedAt: _approvalDetectedAt,
    postApprovalStableCycles: _postApprovalStable,
    postApprovalStableRequired: POST_APPROVAL_REQUIRED,
    postApprovalMinutesRemaining: appleApproved
      ? Math.max(0, (POST_APPROVAL_REQUIRED - _postApprovalStable) * 5)
      : null,
    alertConfigured: !!(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && ALERT_TO),
    evidenceConfigured: !!evidencePool,
    reviewAccount: REVIEW_EMAIL,
    ts: new Date().toISOString(),
  };
}

// ── Express-like HTTP server for Railway health check ─────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/health" || req.url === "/healthz") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok", service: "external-monitor", cycles: _cycleCount }));
  } else if (req.url === "/status" || req.url === "/monitor/status") {
    res.writeHead(200);
    res.end(JSON.stringify(getStatus(), null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "not found" }));
  }
});

server.listen(PORT, () => {
  console.log(JSON.stringify({
    event: "EXTERNAL_MONITOR_START",
    port: PORT,
    apiBase: API_BASE,
    reviewAccount: REVIEW_EMAIL,
    alertConfigured: !!(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && ALERT_TO),
    evidenceConfigured: !!evidencePool,
    intervalMs: INTERVAL_MS,
    ts: new Date().toISOString(),
  }));
});

// ── Start monitoring loop ─────────────────────────────────────────────────────
// Run first cycle immediately, then every 5 minutes.
runCycle().catch((e) =>
  console.error(JSON.stringify({ event: "CYCLE_ERROR", error: e.message, ts: new Date().toISOString() }))
);
setInterval(() => {
  runCycle().catch((e) =>
    console.error(JSON.stringify({ event: "CYCLE_ERROR", error: e.message, ts: new Date().toISOString() }))
  );
}, INTERVAL_MS);

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  console.log(JSON.stringify({ event: "EXTERNAL_MONITOR_SHUTDOWN", ts: new Date().toISOString() }));
  server.close();
  if (evidencePool) await evidencePool.end().catch(() => {});
  process.exit(0);
});
