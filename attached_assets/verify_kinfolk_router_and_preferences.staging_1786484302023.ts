/*
 * Mapping With Melanin — Staging Verification: Router + Preference Persistence
 *
 * Run only against an isolated staging environment:
 *   export KINFOLK_STAGING_BASE_URL='https://<staging-host>'
 *   export KINFOLK_STAGING_TEST_EMAIL='staging-kinfolk-tester@example.test'
 *   export KINFOLK_STAGING_TEST_PASSWORD='<staging-test-password>'
 *   pnpm tsx scripts/verify_kinfolk_router_and_preferences.staging.ts
 *
 * This script refuses the public production hostname by default. It never prints
 * cookies, bearer tokens, passwords, or full user preference content.
 */

import assert from 'node:assert/strict';

const baseUrl = (process.env.KINFOLK_STAGING_BASE_URL ?? '').replace(/\/$/, '');
const email = process.env.KINFOLK_STAGING_TEST_EMAIL ?? '';
const password = process.env.KINFOLK_STAGING_TEST_PASSWORD ?? '';
const explicitlyAllowProduction = process.env.ALLOW_PRODUCTION_STAGING_CHECK === 'true';

function requireEnv(name: string, value: string): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function assertSafeTarget(url: string): void {
  const host = new URL(url).hostname.toLowerCase();
  const isPublicProduction = host === 'www.mappingwithmelanin.com' || host === 'mappingwithmelanin.com';
  const looksLikeStaging = host.includes('staging') || host.includes('preview') || host.includes('localhost') || host.includes('127.0.0.1');

  if (isPublicProduction && !explicitlyAllowProduction) {
    throw new Error('Refusing to run against public production. Use staging or explicitly set ALLOW_PRODUCTION_STAGING_CHECK=true.');
  }
  if (!isPublicProduction && !looksLikeStaging) {
    throw new Error(`Refusing unknown host ${host}. Use a hostname containing staging, preview, localhost, or 127.0.0.1.`);
  }
}

type AuthContext = { cookie: string | null; bearerToken: string | null };

type ChatResponse = {
  sessionId?: string;
  reply?: string;
  intentClass?: string;
  provenanceNote?: string;
  sources?: unknown[];
  error?: string;
};

function getSetCookies(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetSetCookie.getSetCookie === 'function') return withGetSetCookie.getSetCookie();
  const raw = headers.get('set-cookie');
  return raw ? [raw] : [];
}

function cookieHeaderFromSetCookies(setCookies: string[]): string | null {
  const values = setCookies
    .map((value) => value.split(';')[0]?.trim())
    .filter(Boolean);
  return values.length ? values.join('; ') : null;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`Expected JSON from ${response.url}, received: ${text.slice(0, 300)}`);
  }
}

async function login(): Promise<AuthContext> {
  const response = await fetch(`${baseUrl}/api/auth/login-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await readJson(response);
  assert.equal(response.status, 200, `Login must return 200; received ${response.status}: ${String(payload.error ?? '')}`);

  const possibleToken = [payload.token, payload.accessToken, payload.access_token, payload.sessionToken]
    .find((value): value is string => typeof value === 'string' && value.length > 0) ?? null;

  return {
    cookie: cookieHeaderFromSetCookies(getSetCookies(response.headers)),
    bearerToken: possibleToken,
  };
}

async function authenticatedFetch(path: string, init: RequestInit, auth: AuthContext): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (auth.cookie) headers.set('Cookie', auth.cookie);
  if (auth.bearerToken) headers.set('Authorization', `Bearer ${auth.bearerToken}`);
  return fetch(`${baseUrl}${path}`, { ...init, headers });
}

function summary(label: string, value: unknown): void {
  console.log(`PASS — ${label}: ${JSON.stringify(value)}`);
}

async function main(): Promise<void> {
  requireEnv('KINFOLK_STAGING_BASE_URL', baseUrl);
  requireEnv('KINFOLK_STAGING_TEST_EMAIL', email);
  requireEnv('KINFOLK_STAGING_TEST_PASSWORD', password);
  assertSafeTarget(baseUrl);

  const auth = await login();
  assert.ok(auth.cookie || auth.bearerToken, 'Login returned no reusable cookie or bearer token.');
  summary('authenticated staging login', { authTransport: auth.bearerToken ? 'bearer' : 'cookie' });

  // --------------------------------------------------------------------------
  // 1. Router / provenance test — the exact high-consequence acceptance case.
  // --------------------------------------------------------------------------
  const visaResponse = await authenticatedFetch('/api/kinfolk/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'What are Thailand’s current visa requirements for a U.S. citizen visiting Phuket?',
      neighborVoice: false,
    }),
  }, auth);
  const visa = (await readJson(visaResponse)) as ChatResponse;

  assert.equal(visaResponse.status, 200, `Visa chat must return 200; received ${visaResponse.status}: ${visa.error ?? ''}`);
  assert.equal(visa.intentClass, 'legal_regulated', `Visa request must be legal_regulated; received ${visa.intentClass ?? 'missing'}`);
  assert.ok(typeof visa.provenanceNote === 'string' && visa.provenanceNote.trim().length > 15, 'Visa response must include a non-empty provenanceNote.');
  assert.ok(Array.isArray(visa.sources), 'Visa response must include a sources array, even when no current source is available.');
  assert.ok(typeof visa.reply === 'string' && visa.reply.length > 0, 'Visa response must include a reply.');
  summary('visa Router contract', {
    intentClass: visa.intentClass,
    hasProvenanceNote: Boolean(visa.provenanceNote),
    sourceCount: visa.sources?.length ?? 0,
  });

  // --------------------------------------------------------------------------
  // 2. Preference persistence test — mirrors Detailed → Save → refresh.
  // --------------------------------------------------------------------------
  const beforeResponse = await authenticatedFetch('/api/kinfolk/preferences', { method: 'GET' }, auth);
  const before = await readJson(beforeResponse);
  assert.equal(beforeResponse.status, 200, 'Preferences GET must be available to an authenticated member.');

  const saveResponse = await authenticatedFetch('/api/kinfolk/preferences/response-style', {
    method: 'PUT',
    body: JSON.stringify({ responseStyle: 'detailed' }),
  }, auth);
  const save = await readJson(saveResponse);
  assert.equal(saveResponse.status, 200, `Detailed save must return 200; received ${saveResponse.status}: ${String(save.error ?? '')}`);
  assert.equal(save.responseStyle, 'detailed', 'Response-style save must echo detailed.');
  assert.equal((save.deliveryProfile as Record<string, unknown> | undefined)?.detailLevel ?? (save.deliveryProfile as Record<string, unknown> | undefined)?.detail_level, 'deep', 'Detailed must map to deep delivery detail.');

  // Fresh GET simulates the state requested by a hard page reload/relaunch.
  const afterResponse = await authenticatedFetch('/api/kinfolk/preferences', { method: 'GET' }, auth);
  const after = await readJson(afterResponse);
  assert.equal(afterResponse.status, 200, 'Preference reload must return 200.');
  assert.equal(after.responseStyle, 'detailed', `Fresh preference GET must return detailed; received ${String(after.responseStyle)}`);

  const deliveryProfile = after.deliveryProfile as Record<string, unknown> | undefined;
  assert.ok(deliveryProfile, 'Fresh preference GET must include deliveryProfile.');
  assert.equal(deliveryProfile.detailLevel ?? deliveryProfile.detail_level, 'deep', 'Fresh delivery profile must retain deep detail.');
  summary('Detailed persistence', {
    beforeResponseStyle: before.responseStyle,
    savedResponseStyle: save.responseStyle,
    reloadedResponseStyle: after.responseStyle,
    reloadedDetailLevel: deliveryProfile.detailLevel ?? deliveryProfile.detail_level,
  });

  console.log('\nSTAGING ACCEPTANCE PASSED — Router provenance and Detailed persistence are both verified.');
}

main().catch((error) => {
  console.error(`\nSTAGING ACCEPTANCE FAILED — ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
