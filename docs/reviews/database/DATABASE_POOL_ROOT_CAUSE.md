# Database Pool Root Cause Analysis
## Mapping With Melanin™ — Build 97 Engineering Review
**Date:** July 27, 2026
**Status:** Root cause confirmed. Fix implemented. Not yet deployed to Railway production.

---

## A. APPLICATION POOL — `lib/db/src/index.ts`

### Singleton Implementation

The application DB pool uses a lazy-init singleton pattern with a Proxy:

```typescript
let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    // creates new Pool only once
    _pool = new Pool({ ... });
  }
  return _pool;
}

// Proxy defers initialization until first use
export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});
```

Only one `pg.Pool` is ever created per API server process.

### Pool Configuration (Current — Build 97)

| Parameter | Value | Notes |
|-----------|-------|-------|
| `max` | **8** | Increased from 5 after load testing. Combined with Stripe pool: 8+2=10 total. |
| `connectionTimeoutMillis` | 10,000 ms | Clear timeout — callers get error quickly instead of queuing indefinitely. |
| `idleTimeoutMillis` | 30,000 ms | Was 300,000 ms (5 min). Reduced to 30s — dead sockets from Railway network events replaced within one idle cycle. |
| `keepAlive` | true | TCP keepalive enabled. |
| `keepAliveInitialDelayMillis` | 1,000 ms | Was 10,000 ms. Start probes after 1s — dead sockets detected in seconds not up to 685s. |
| `maxLifetimeSeconds` | 1,800 | Recycle every connection after 30 min regardless of idle state — defense against long-lived connections that survive Railway network reconfiguration. |
| `statement_timeout` | 10,000 ms | PostgreSQL cancels any query running longer than this. |
| `query_timeout` | 10,000 ms | node-postgres client-level guard. |
| SSL | `{ rejectUnauthorized: false }` | Applied when URL does not contain `localhost`, `127.0.0.1`, or `.internal`. |

### Pool Change History

| Pool Value | Build | Reason |
|------------|-------|--------|
| max: 5 | Pre-97 | Original setting |
| max: 8 | Build 97 | Load test showed peak `waitingCount: 12` at 141 req/sec abuse load. Realistic 30-user traffic (10–15 req/sec) never saturated. Revisit if health monitor reports sustained `waitingCount > 2`. |

### Graceful Shutdown

On `SIGTERM` (Railway deployment replacement):

```typescript
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

server.close(async () => {
  await pool.end();           // app pool — max:8
  await endStripeSyncPool();  // StripeSync pool — max:2
  process.exit(0);
});
server.closeIdleConnections();
setTimeout(() => server.closeAllConnections(), 22_000);
setTimeout(() => process.exit(1), 25_000).unref();
```

**Previously:** `pool.end()` was called but `endStripeSyncPool()` was not — the StripeSync pool leaked across deployments.

### Pool Health Observable At

- `GET /api/readyz` — returns `{ total, idle, waiting }` pool stats
- `GET /api/readyz/history` — last 12 hours of 5-minute synthetic health checks (in-memory ring buffer)

---

## B. STRIPE POOL LEAK — `artifacts/api-server/src/stripeClient.ts`

### Previous (Broken) Behavior

```typescript
// BEFORE — created new StripeSync on every call
export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL!;
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl }
    // default max: 10, keepAlive: true
  });
}
```

`getStripeSync()` was called in `webhookHandlers.ts` on every Stripe webhook event.

### stripe-replit-sync Package Internals (Read-only Investigation)

From `node_modules/.pnpm/stripe-replit-sync@1.0.0_.../dist/index.js`:

```
line  37: this.pool = new pg.Pool(config.poolConfig)
line 559: poolConfig.max = config.maxPostgresConnections
line 560: if (poolConfig.max === void 0) { poolConfig.max = 10; }
line 562: if (poolConfig.keepAlive === void 0) { poolConfig.keepAlive = true; }
```

Every call to `new StripeSync({ poolConfig })` creates a **new `pg.Pool(max:10, keepAlive:true)`** against Railway's Postgres. These pools are **never `.end()`'d** — their connections stay live until Railway closes them on idle timeout.

### How Pools Accumulated

1. Stripe webhook fires → `getStripeSync()` called → `new StripeSync()` → `new pg.Pool(max:10)`
2. Another webhook fires → another `new StripeSync()` → another `new pg.Pool(max:10)`
3. After 2 webhooks: 20 open connections outside app pool. After 3: 30 connections.
4. Railway PostgreSQL connection limit exceeded.
5. App's `pool.query()` waits 10 seconds for a slot → throws → HTTP 500.

### The Exact Build 96 Reviewer Timeline

| Time (UTC) | Event |
|------------|-------|
| 20:31 | `GET /api/businesses` → HTTP 500 after 10.13s. First pool exhaustion event. Origin: Stripe webhook activity earlier that evening. |
| 22:59 | Second pool exhaustion event. New connections from more Stripe webhooks. |
| ~02:30–03:00 | Apple reviewer begins session. Pool state already degraded. |
| 03:01 | Apple taps "Sign in with Apple" → `POST /api/auth/apple` → DB unavailable → HTTP 500 → "Error message appeared" |
| 03:01 | Email login path also unavailable (same pool exhaustion). |
| 03:01 | Registration path also unavailable. |
| 03:01 | Username check path also unavailable. |
| 03:01 | Business list path also unavailable (same root). |

**None of the auth failures were caused by Apple Sign-In logic bugs.** Every auth path (Apple, email, register) writes to the database. When the database is unreachable, all fail identically.

### New Singleton Behavior

```typescript
// AFTER — promise-based singleton, race-condition safe
let _stripeSyncPromise: Promise<StripeSync> | null = null;

async function _createStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL!;
  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: {
      connectionString: databaseUrl,
      max: 2,                  // reduced from default 10
      idleTimeoutMillis: 30_000,
      keepAlive: true,
    },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? "",
  });
}

export function getStripeSync(): Promise<StripeSync> {
  if (!_stripeSyncPromise) {
    // Assigned synchronously before first await — concurrent callers
    // all receive the same promise, preventing double-initialization.
    _stripeSyncPromise = _createStripeSync();
  }
  return _stripeSyncPromise;
}
```

One `pg.Pool(max:2)` per API process, for the lifetime of the process.

---

## C. CURRENT CONNECTION MODEL

| Pool | Max Connections | Owner |
|------|----------------|-------|
| App pool (`lib/db/src/index.ts`) | 8 | All API routes |
| StripeSync pool (`stripeClient.ts`) | 2 | Stripe webhook processing only |
| **Total per API process** | **10** | — |

**Number of API replicas:** 1 (confirmed from pool config comment: "1 Railway replica confirmed (numReplicas: null → default 1)")

**Railway PostgreSQL connection limit:** Not confirmed in project documentation. Railway's standard Postgres plan provides a connection limit that varies by plan tier. With 10 max connections from the app, plus Railway's own internal connections (~2–3 for monitoring), total should be well within standard limits. **Manus should verify the exact limit from the Railway dashboard.**

**Startup migration pool:** See Section D below.

**Whether startup pool is drained:** No (see Section D). This is a known open question.

---

## D. STARTUP MIGRATION EXCEPTION — `runMigrations`

### Source

Called in `artifacts/api-server/src/index.ts` during startup:

```typescript
const { runMigrations } = await import("stripe-replit-sync");
await runMigrations({ databaseUrl });
```

### Behavior

From `stripe-replit-sync` package investigation (lines 2400–2435 approx.):

- `runMigrations()` creates its own internal `pg.Pool` to run SQL migrations (creating Stripe sync tables: `stripe_customers`, `stripe_prices`, `stripe_products`, `stripe_subscriptions`, `stripe_invoices`, `stripe_payment_methods`)
- Default pool max: **not explicitly constrained** — package default behavior
- `pool.end()` is **NOT called** after migrations complete
- The migration pool's connections persist until Railway Postgres closes them on idle timeout (PostgreSQL's `idle_in_transaction_session_timeout` or TCP keepalive expiry)

### Risk Assessment

| Factor | Assessment |
|--------|-----------|
| Is it bounded? | Yes — runs once at startup, not per-request |
| Does it accumulate? | No — only one migration run per process start |
| Are connections released? | Eventually — via idle timeout on the PG side |
| Is it a build 97 release blocker? | **Unknown — Manus should determine** |
| Safer architecture? | Call `pool.end()` after migrations; use a dedicated 1-connection pool |

**Open question for Manus:** Is the undrained startup migration pool an acceptable release risk given that: (a) it only runs once at startup, (b) connections are eventually closed by Railway Postgres idle timeout, and (c) the migration only creates Stripe sync tables?

---

## E. RETRY LOGIC — `artifacts/api-server/src/lib/db-retry.ts`

### Errors Retried (Transient Connection Class Only)

```
ECONNRESET
ECONNREFUSED
ETIMEDOUT
EHOSTUNREACH
ENOTFOUND
EPIPE
"timeout exceeded when trying to connect"
"Connection terminated unexpectedly"
"Client was closed and is not queryable"
"connect ECONNRESET"
"connect ETIMEDOUT"
```

### Errors Never Retried

- Any error with a 5-character PostgreSQL SQLSTATE code (e.g., `23505` duplicate key, `23502` not-null) — these represent server-responded errors, not connection failures
- Validation / constraint errors
- Authentication / authorization errors
- Ordinary application logic errors

The distinction is critical: retrying `23505` (duplicate key) would be unsafe and would produce duplicate writes. Retrying transient connection errors is safe because the original operation never reached the database.

### Retry Behavior

| Parameter | Value |
|-----------|-------|
| Number of attempts | 2 (1 original + 1 retry) |
| Delay between attempts | 500 ms |
| Logging | First failure: `warn` with context + sanitized error; Retry attempt: `info` |
| Final behavior | If retry also fails, throws — caller's existing catch block handles and returns clean user error |

### Routes Using `withDbRetry`

| Route | Method | Reason |
|-------|--------|--------|
| `POST /api/auth/apple` | POST | Apple Sign-In — must succeed on reviewer's first tap |
| `POST /api/auth/login-email` | POST | Email login — must succeed on reviewer's first attempt |
| `POST /api/auth/register` | POST | Registration — must succeed on reviewer's first attempt |
| `GET /api/auth/check-username` | GET | Username availability — blocks registration flow |
| `GET /api/businesses` | GET | Business list — first visible content after login |

### Idempotency

The retry is safe for all 5 routes:
- `POST /api/auth/apple`: Apple credential is validated against DB; a duplicate insertion attempt on retry would hit the `UNIQUE` constraint on `email` — returns `23505`, which is not retried.
- `POST /api/auth/login-email`: Read-only authentication check, then session write — both idempotent on retry
- `POST /api/auth/register`: Unique constraint on `email` prevents duplicate users — retry safe
- `GET /api/auth/check-username`: Read-only — inherently idempotent
- `GET /api/businesses`: Read-only — inherently idempotent

### Final User-Facing Behavior

If both attempts fail (e.g., sustained pool exhaustion), the route returns its existing error response. For auth routes this is typically HTTP 500 with a generic error message — the mobile app displays an "authentication failed" toast.

---

## F. QUESTIONS FOR MANUS

1. Is the StripeSync singleton fix complete? Are there any other paths in the codebase where `new StripeSync()` or `new pg.Pool()` could be called outside the singletons?
2. Is `pool max: 8` + `stripe max: 2` = 10 total an appropriate sizing for one Railway replica serving 30 testers plus Apple review?
3. Is the undrained `runMigrations()` startup pool a release blocker?
4. Is the retry logic safe and sufficient for the 5 routes it covers? Should it be extended to other routes?
5. Are there any other connection paths (e.g., Drizzle internals, healthz probes) that could contribute to pool exhaustion?
6. Can the current Railway architecture support Apple review simultaneously with 30 mixed-platform testers?
7. What production load/stability evidence should be collected before submission?
