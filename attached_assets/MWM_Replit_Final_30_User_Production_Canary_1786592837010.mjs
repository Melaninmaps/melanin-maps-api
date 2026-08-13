#!/usr/bin/env node
/**
 * MWM Final 30-User Production Canary
 *
 * READ BEFORE RUNNING:
 * - Run only after the bundle-identity and member-keyed rate-limit patches are live.
 * - Use only pre-seeded accounts with is_load_test=true.
 * - This script performs no writes to posts, safety reports, reviews, claims,
 *   follows, notifications, business records, Library growth, or preferences.
 * - It exits non-zero and stops the ramp after the first failed stage.
 *
 * Required environment:
 *   ALLOW_PRODUCTION_CANARY=true
 *   CANARY_PASSWORD=...
 * Optional:
 *   MWM_BASE_URL=https://www.mappingwithmelanin.com
 *   CANARY_OUTPUT=/safe/absolute/path/result.json
 */

import fs from 'node:fs/promises';

const BASE = (process.env.MWM_BASE_URL ?? 'https://www.mappingwithmelanin.com').replace(/\/$/, '');
const PASSWORD = process.env.CANARY_PASSWORD;
const ALLOW = process.env.ALLOW_PRODUCTION_CANARY === 'true';
const OUTPUT = process.env.CANARY_OUTPUT ?? '/tmp/mwm_final_30_user_canary.json';

if (!ALLOW) throw new Error('Refusing production traffic: set ALLOW_PRODUCTION_CANARY=true.');
if (!PASSWORD) throw new Error('CANARY_PASSWORD is required.');
if (!BASE.startsWith('https://')) throw new Error('Production canary requires an HTTPS base URL.');

const accounts = [
  ['01', 'Philadelphia', 'Find a community-friendly dinner option in Philadelphia.'],
  ['02', 'Atlanta', 'What is the vibe for Black-owned brunch in Atlanta?'],
  ['03', 'Houston', 'Help me plan a relaxed Saturday in Houston.'],
  ['04', 'Washington DC', 'Show me a culturally rich afternoon in Washington DC.'],
  ['05', 'Los Angeles', 'What should I explore in Los Angeles this weekend?'],
  ['06', 'New York', 'Find a community-friendly coffee stop in New York.'],
  ['07', 'Chicago', 'Suggest a family-friendly Chicago activity.'],
  ['08', 'New Orleans', 'What is a good cultural experience in New Orleans?'],
  ['09', 'Detroit', 'Suggest a Detroit small-business discovery route.'],
  ['10', 'Baltimore', 'Where can I find community-centered food in Baltimore?'],
  ['11', 'Memphis', 'Plan a Memphis music and food afternoon.'],
  ['12', 'Dallas', 'Suggest a welcoming Dallas wellness activity.'],
  ['13', 'Miami', 'What is a relaxed Miami community outing?'],
  ['14', 'Charlotte', 'Find a community-friendly Charlotte weekend stop.'],
  ['15', 'Columbia SC', 'Suggest a Columbia SC cultural discovery.'],
  ['16', 'Birmingham', 'What is a welcoming Birmingham community spot?'],
  ['17', 'Oakland', 'Plan a relaxed afternoon in Oakland.'],
  ['18', 'Newark', 'Find a culturally relevant Newark activity.'],
  ['19', 'Richmond', 'What should I explore in Richmond?'],
  ['20', 'Nashville', 'Plan a Nashville music-and-food outing.'],
  ['21', 'Phuket', 'Help me plan a community-aware birthday dinner in Phuket.'],
  ['22', 'Phuket', 'Suggest a respectful Phuket cultural evening.'],
  ['23', 'Philadelphia', 'Find a welcoming Philadelphia coffee stop.'],
  ['24', 'Atlanta', 'Suggest an Atlanta cultural weekend plan.'],
  ['25', 'Houston', 'Find a Houston community-friendly lunch.'],
  ['26', 'Washington DC', 'Suggest a Washington DC cultural discovery.'],
  ['27', 'Los Angeles', 'Find a relaxed Los Angeles community outing.'],
  ['28', 'New York', 'Suggest a New York cultural afternoon.'],
  ['29', 'Chicago', 'Find a family-friendly Chicago cultural stop.'],
  ['30', 'Miami', 'Suggest a Miami community-friendly dinner.'],
].map(([number, city, prompt]) => ({
  number,
  city,
  prompt,
  email: `mwm-loadtest-${number}@loadtest.mwm.internal`,
}));

const PHASES = [
  { name: 'baseline_1', count: 1 },
  { name: 'warm_5', count: 5 },
  { name: 'mid_15', count: 15 },
  { name: 'full_30', count: 30 },
];
const LIBRARY_TOPIC = 'fbfbc161-5121-4eca-a0a4-c35731b010f6';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const iso = () => new Date().toISOString();

function getCookies(response) {
  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return setCookies.map((value) => value.split(';', 1)[0]).join('; ');
}

async function http(path, options = {}, timeoutMs = 45_000) {
  const started = performance.now();
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* non-JSON route */ }
    return {
      status: response.status,
      ok: response.ok,
      latencyMs: Math.round(performance.now() - started),
      body,
      bodyBytes: Buffer.byteLength(text),
      headers: {
        retryAfter: response.headers.get('retry-after'),
        contentType: response.headers.get('content-type'),
      },
      response,
    };
  } catch (error) {
    return { status: 0, ok: false, latencyMs: Math.round(performance.now() - started), error: String(error), body: null, headers: {} };
  }
}

async function getVersion() {
  return http('/api/version', { headers: { accept: 'application/json' } }, 15_000);
}

async function getReady() {
  return http('/api/readyz', { headers: { accept: 'application/json' } }, 15_000);
}

function validateDeployment(version, ready) {
  const failures = [];
  if (!version.ok || !version.body) failures.push(`version_status_${version.status}`);
  if (version.body?.stale_bundle !== false) failures.push('stale_bundle_not_false');
  if (!version.body?.bundle_sha256 || version.body.bundle_sha256 !== version.body.bundle_sha256_self) failures.push('bundle_hash_mismatch');
  if (!ready.ok || ready.body?.status !== 'ok' || ready.body?.db !== 'ok') failures.push(`readyz_${ready.status}`);
  if ((ready.body?.pool?.max ?? ready.body?.pool_max ?? 0) < 50) failures.push('pool_max_below_50');
  return failures;
}

function phaseAbortReason(monitor) {
  const recent = monitor.slice(-2);
  if (recent.length === 2 && recent.every((sample) => Number(sample.body?.pool?.waiting ?? 0) > 0)) {
    return 'pool_waiting_positive_on_two_consecutive_samples';
  }
  if (monitor.some((sample) => sample.status !== 200 || sample.body?.status !== 'ok' || sample.body?.db !== 'ok')) {
    return 'readiness_or_database_failure';
  }
  return null;
}

async function simulatedUser(account) {
  const result = { account: account.number, city: account.city, startedAt: iso(), steps: [], outcome: 'pass' };
  try {
    const login = await http('/api/auth/login-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: account.email, password: PASSWORD }),
    }, 25_000);
    const cookie = login.response ? getCookies(login.response) : '';
    result.steps.push({ name: 'login', status: login.status, latencyMs: login.latencyMs, bodyBytes: login.bodyBytes });
    if (!login.ok || !cookie) throw new Error(`login_failed_${login.status}`);

    const headers = { cookie, accept: 'application/json' };
    // Read-only bootstrap fan-out: same real paths a member uses after login.
    const [prefs, sessions, graph, business, pins, travel] = await Promise.all([
      http('/api/kinfolk/preferences', { headers }, 25_000),
      http('/api/kinfolk/sessions', { headers }, 25_000),
      http(`/api/knowledge/graph/${LIBRARY_TOPIC}?surface=library`, { headers }, 25_000),
      http(`/api/businesses?city=${encodeURIComponent(account.city)}&limit=5`, { headers }, 25_000),
      http('/api/maps/discoverability-pins', { headers }, 25_000),
      http('/travel', { headers: { cookie, accept: 'text/html' } }, 25_000),
    ]);
    for (const [name, response] of [
      ['preferences_read', prefs], ['sessions_read', sessions], ['library_graph_read', graph],
      ['business_search', business], ['map_discoverability_pins', pins], ['travel_route', travel],
    ]) {
      result.steps.push({ name, status: response.status, latencyMs: response.latencyMs, bodyBytes: response.bodyBytes, retryAfter: response.headers?.retryAfter ?? null });
      if (!response.ok) throw new Error(`${name}_failed_${response.status}`);
    }

    const chat = await http('/api/kinfolk/chat', {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ message: account.prompt }),
    }, 50_000);
    result.steps.push({
      name: 'kinfolk_chat', status: chat.status, latencyMs: chat.latencyMs,
      intentClass: chat.body?.intentClass ?? null,
      hasReply: Boolean(chat.body?.response || chat.body?.answer || chat.body?.message),
      errorCode: chat.body?.code ?? chat.body?.error?.code ?? null,
      retryAfter: chat.headers?.retryAfter ?? null,
    });
    if (!chat.ok || !(chat.body?.response || chat.body?.answer || chat.body?.message)) {
      throw new Error(`kinfolk_chat_failed_${chat.status}_${chat.body?.code ?? 'unknown'}`);
    }
  } catch (error) {
    result.outcome = 'fail';
    result.error = String(error);
  }
  result.finishedAt = iso();
  return result;
}

const result = {
  baseUrl: BASE,
  startedAt: iso(),
  guardrails: {
    loadTestOnly: true,
    writesPerformed: false,
    abortOnFirstFailedPhase: true,
    poolAbortRule: 'pool.waiting > 0 in two consecutive readiness samples',
    rateLimitExpectation: 'authenticated general API is keyed by member ID; no generic shared-IP 429s',
  },
  deployment: {},
  phases: [],
  overall: 'pass',
};

const version = await getVersion();
const ready = await getReady();
result.deployment = { version: { status: version.status, body: version.body }, ready: { status: ready.status, body: ready.body } };
const preflightFailures = validateDeployment(version, ready);
if (preflightFailures.length) {
  result.overall = 'abort';
  result.abortReason = `preflight:${preflightFailures.join(',')}`;
  result.finishedAt = iso();
  await fs.writeFile(OUTPUT, JSON.stringify(result, null, 2));
  console.error(JSON.stringify({ overall: result.overall, abortReason: result.abortReason, output: OUTPUT }, null, 2));
  process.exit(2);
}

for (const phase of PHASES) {
  const phaseResult = { name: phase.name, plannedUsers: phase.count, startedAt: iso(), monitor: [], users: [], outcome: 'pass' };
  const before = await getReady();
  phaseResult.monitor.push({ point: 'before', status: before.status, body: before.body, latencyMs: before.latencyMs });
  const priorAbort = phaseAbortReason(phaseResult.monitor);
  if (priorAbort) {
    phaseResult.outcome = 'abort'; phaseResult.abortReason = priorAbort;
    result.phases.push(phaseResult); result.overall = 'abort'; break;
  }

  const timer = setInterval(async () => {
    const sample = await getReady();
    phaseResult.monitor.push({ point: 'during', status: sample.status, body: sample.body, latencyMs: sample.latencyMs });
  }, 2_000);

  phaseResult.users = await Promise.all(accounts.slice(0, phase.count).map(simulatedUser));
  clearInterval(timer);
  const after = await getReady();
  phaseResult.monitor.push({ point: 'after', status: after.status, body: after.body, latencyMs: after.latencyMs });

  const failures = phaseResult.users.filter((u) => u.outcome !== 'pass');
  const abort = phaseAbortReason(phaseResult.monitor);
  if (failures.length || abort) {
    phaseResult.outcome = abort ? 'abort' : 'fail';
    phaseResult.failureCount = failures.length;
    phaseResult.abortReason = abort ?? null;
    result.overall = phaseResult.outcome;
  }
  phaseResult.finishedAt = iso();
  result.phases.push(phaseResult);
  if (phaseResult.outcome !== 'pass') break;
  // Let the pool/metrics settle without shortening the rate-limit window by retries.
  await sleep(8_000);
}

result.finishedAt = iso();
await fs.writeFile(OUTPUT, JSON.stringify(result, null, 2));
const summary = result.phases.map((p) => ({ phase: p.name, outcome: p.outcome, plannedUsers: p.plannedUsers, failureCount: p.failureCount ?? 0 }));
console.log(JSON.stringify({ overall: result.overall, output: OUTPUT, phases: summary }, null, 2));
process.exitCode = result.overall === 'pass' ? 0 : 2;
