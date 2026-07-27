---
name: StripeSync per-webhook pg.Pool leak
description: Root cause of recurring Railway Postgres pool exhaustion — StripeSync created new pg.Pool(max:10) on every Stripe webhook call. Fix: promise-based singleton in stripeClient.ts.
---

## The Bug

`stripe-replit-sync` creates `new pg.Pool(config.poolConfig)` (max:10 default) in its `StripeSync` constructor (package/dist/index.js:37). Before the fix, `getStripeSync()` called `new StripeSync({ poolConfig })` on every invocation, meaning every Stripe webhook event created a new pg.Pool(max:10) that was never `.end()`'d. After 2–3 webhook events, Railway Postgres connections were exhausted, causing the app's own pool to time out at `connectionTimeoutMillis: 10000ms` → HTTP 500 for all DB routes.

**Why:** Both `webhookHandlers.ts` (per-webhook) and `index.ts` (startup) called `getStripeSync()`, and each call returned `new StripeSync(...)`.

## The Fix (stripeClient.ts)

```typescript
let _stripeSyncPromise: Promise<StripeSync> | null = null;

export function getStripeSync(): Promise<StripeSync> {
  if (!_stripeSyncPromise) {
    _stripeSyncPromise = _createStripeSync(); // assigned synchronously → race-safe
  }
  return _stripeSyncPromise;
}
```

Pool size reduced from default 10 to `max: 2`. Combined max connections per process: 5 (app) + 2 (stripe) = 7.

**endStripeSyncPool()** exported and called in graceful shutdown after `pool.end()`.

## How to Apply

- Never call `new StripeSync(...)` more than once per process.
- Always verify that third-party packages accepting `poolConfig` or `connectionString` create their own pg.Pool — they add to Railway's total connection count.
- Combined pool max across ALL pools (app + stripe-replit-sync + runMigrations startup) must stay under Railway Postgres plan connection limit.
- `runMigrations({ databaseUrl })` also creates its own pool at startup (package source line 2400). It is not explicitly closed. Max impact: one startup-time pool that idles out. Bounded; not a recurring leak.

## Confirmed Pattern: Pool Exhaustion Diagnosis

If all DB routes return HTTP 500 after exactly `connectionTimeoutMillis` seconds (default 10s), the pool is exhausted. Check `/api/readyz` (returns 503 with pool stats when idle=0). Recovery: Railway service restart clears all pools.

**Never redeploy code to fix exhaustion without restarting first** — the old process's leaked pools stay open on Postgres even after the new process starts.
