/**
 * Build 97 — Apple 12-Hour Autonomous Monitoring
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
 *   E. Stripe (passive — no live charges)
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
  // C. DB / infra
  pool: { total: number; idle: number; waiting: number };
  dbLatencyMs: number | null;
  // D. Core features
  businesses: number | "err";
  culturalSites: number | "err";
  sundownTowns: number | "err";
  communityPosts: number | "err";
  communityGuidelines: number | "err";
  events: number | "err";
  kinfolkAvailable: boolean;
  webLogin: number | "err";
  privacy: number | "err";
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

const BASE = "https://www.mappingwithmelanin.com";

async function _get(path: string, timeoutMs = 8000): Promise<{ status: number; body: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${BASE}${path}`, { signal: ctrl.signal });
    const body = await r.text().catch(() => "");
    return { status: r.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function _post(path: string, body: object, timeoutMs = 8000): Promise<{ status: number; body: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await r.text().catch(() => "");
    return { status: r.status, body: text };
  } finally {
    clearTimeout(timer);
  }
}

async function runCycle(): Promise<void> {
  const start = Date.now();
  const ts = new Date().toISOString();
  const p0Flags: string[] = [];
  const p1Flags: string[] = [];

  // A. Service health
  let healthz: number | "err" = "err";
  let readyz: number | "err" = "err";
  let version: string | "err" = "err";
  try { healthz = (await _get("/api/healthz")).status; } catch { /* err */ }
  try { readyz = (await _get("/api/readyz")).status; } catch { /* err */ }
  try {
    const vr = await _get("/api/version");
    if (vr.status === 200) {
      const d = JSON.parse(vr.body);
      version = (d?.sha ?? "").slice(0, 8);
    }
  } catch { /* err */ }

  if (readyz !== 200) p0Flags.push(`readyz=${readyz}`);

  // B. Auth — review account (only if credentials available)
  let reviewAccountLogin: "ok" | "fail" | "skip" | "err" = "skip";
  const reviewEmail = process.env.REVIEW_ACCOUNT_EMAIL ?? "appstorereview@mappingwithmelanin.com";
  const reviewPassword = process.env.REVIEW_ACCOUNT_PASSWORD;
  if (reviewPassword) {
    try {
      const ar = await _post("/api/auth/login-email", { email: reviewEmail, password: reviewPassword });
      if (ar.status === 200) {
        try {
          const d = JSON.parse(ar.body);
          reviewAccountLogin = d?.user ? "ok" : "fail";
        } catch { reviewAccountLogin = "fail"; }
      } else {
        reviewAccountLogin = "fail";
      }
    } catch { reviewAccountLogin = "err"; }
    if (reviewAccountLogin !== "ok") p0Flags.push(`reviewAccountLogin=${reviewAccountLogin}`);
  }

  // C. DB / infra
  const poolStats = getPoolStats();
  let dbLatencyMs: number | null = null;
  try {
    const dbStart = Date.now();
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
    ]);
    dbLatencyMs = Date.now() - dbStart;
  } catch { /* err */ }

  if (dbLatencyMs === null) p0Flags.push("db_query_failed");
  if (poolStats.waiting > 0) p0Flags.push(`pool_waiting=${poolStats.waiting}`);

  // D. Core features
  let businesses: number | "err" = "err";
  let culturalSites: number | "err" = "err";
  let sundownTowns: number | "err" = "err";
  let communityPosts: number | "err" = "err";
  let communityGuidelines: number | "err" = "err";
  let events: number | "err" = "err";
  let kinfolkAvailable = false;
  let webLogin: number | "err" = "err";
  let privacy: number | "err" = "err";

  try { businesses = (await _get("/api/businesses?limit=1")).status; } catch { /* err */ }
  try { culturalSites = (await _get("/api/cultural-sites?limit=1")).status; } catch { /* err */ }
  try {
    const st = await _get("/api/cultural-sites?heritageCategory=Historical+Sundown+Town&limit=1");
    if (st.status === 200) {
      try {
        const d = JSON.parse(st.body);
        sundownTowns = d.length > 0 ? 200 : 0;
      } catch { sundownTowns = st.status; }
    } else {
      sundownTowns = st.status;
    }
  } catch { /* err */ }
  try { communityPosts = (await _get("/api/community/posts?limit=1")).status; } catch { /* err */ }
  try { communityGuidelines = (await _get("/api/community/guidelines")).status; } catch { /* err */ }
  try { events = (await _get("/api/events?limit=1")).status; } catch { /* err */ }
  try {
    // KinfolkAI — auth required, check endpoint availability only (401 = available, 200 = available)
    const kr = await _post("/api/kinfolk/chat", { message: "ping", conversationId: "monitor" });
    kinfolkAvailable = kr.status !== 500 && kr.status !== 503 && kr.status !== 0;
  } catch { /* err */ }
  try { webLogin = (await _get("/login")).status; } catch { /* err */ }
  try { privacy = (await _get("/privacy")).status; } catch { /* err */ }

  if (sundownTowns === 0) p0Flags.push("sundown_towns_empty");
  if (sundownTowns === "err") p1Flags.push("sundown_towns_error");
  if (!kinfolkAvailable) p1Flags.push("kinfolk_unavailable");
  if (communityPosts === "err") p1Flags.push("community_posts_error");
  if (businesses === "err") p1Flags.push("businesses_error");

  const entry: MonitorEntry = {
    ts, cycleMs: Date.now() - start,
    healthz, readyz, version,
    reviewAccountLogin,
    pool: poolStats, dbLatencyMs,
    businesses, culturalSites, sundownTowns, communityPosts, communityGuidelines,
    events, kinfolkAvailable, webLogin, privacy,
    p0Flags, p1Flags,
  };

  _ring.push(entry);
  if (_ring.length > MAX_ENTRIES) _ring.shift();

  _cycleCount++;
  if (p0Flags.length > 0) _p0Count++;
  if (p1Flags.length > 0) _p1Count++;

  // Log every cycle to Railway's log stream (full 12-hour evidence in Railway logs)
  const level = p0Flags.length > 0 ? "error" : p1Flags.length > 0 ? "warn" : "info";
  const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  logFn(JSON.stringify({
    event: "BUILD97_MONITOR",
    ts, cycle: _cycleCount,
    p0: p0Flags, p1: p1Flags,
    pool: poolStats, dbLatencyMs,
    healthz, readyz, version,
    reviewAccountLogin,
    sundownTowns,
  }));
}

export function getMonitorSummary() {
  const total = _ring.length;
  const errors = _ring.filter(e => e.p0Flags.length > 0).length;
  const warnings = _ring.filter(e => e.p1Flags.length > 0).length;
  const successRate = total > 0 ? (((total - errors) / total) * 100).toFixed(1) : "N/A";
  const latencies = _ring.map(e => e.dbLatencyMs).filter((n): n is number => n !== null);
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a,b) => a+b, 0) / latencies.length) : null;
  const p95Latency = latencies.length > 0 ? latencies.sort((a,b) => a-b)[Math.floor(latencies.length * 0.95)] ?? null : null;
  const peakPool = _ring.reduce((acc, e) => Math.max(acc, e.pool.total), 0);
  const peakWaiting = _ring.reduce((acc, e) => Math.max(acc, e.pool.waiting), 0);
  const latest = _ring[_ring.length - 1] ?? null;

  return {
    monitoringMechanism: "setInterval inside always-on Railway API process",
    intervalMinutes: 5,
    survivesReplitChatClosure: true,
    cyclesCompleted: _cycleCount,
    cyclesExpected: 144,
    total, errors, warnings, successRate,
    p0EventCount: _p0Count,
    p1EventCount: _p1Count,
    avgDbLatencyMs: avgLatency,
    p95DbLatencyMs: p95Latency,
    peakPoolTotal: peakPool,
    peakPoolWaiting: peakWaiting,
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
