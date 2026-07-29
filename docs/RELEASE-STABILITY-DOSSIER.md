# MAPPING WITH MELANIN — RELEASE STABILITY DOSSIER
**Version:** 1.0  
**Date:** July 29, 2026  
**Build Identity:** Version 1.1.5 · iOS buildNumber 98 · Android versionCode 73  
**Git Commit:** `3eb86421`  
**Branches:** `main`, `release/apple-remediation`, `develop/next-build` (all at `3eb86421`)  
**Purpose:** Independent audit of all known crash history, fixes, residual vectors, and architectural evidence prior to Apple re-submission.  
**Status:** Evidence-based. All code citations are accurate to current `main`.

---

## TABLE OF CONTENTS

1. [Every Known Historical Crash / Root Cause](#1-every-known-historical-crash--root-cause)
2. [Every Fix Implemented](#2-every-fix-implemented)
3. [Every Crash Vector Still Possible](#3-every-crash-vector-still-possible)
4. [Complete Connection-Pool Architecture](#4-complete-connection-pool-architecture)
5. [Every Database Acquisition / Release Path](#5-every-database-acquisition--release-path)
6. [Complete Authentication Flow](#6-complete-authentication-flow)
7. [Apple Sign-In Sequence](#7-apple-sign-in-sequence)
8. [Session Lifecycle](#8-session-lifecycle)
9. [Map / Location Lifecycle](#9-map--location-lifecycle)
10. [Navigation Lifecycle](#10-navigation-lifecycle)
11. [Background / Foreground Lifecycle](#11-background--foreground-lifecycle)
12. [Memory Usage Strategy](#12-memory-usage-strategy)
13. [Pool Instrumentation Output](#13-pool-instrumentation-output)
14. [Crash Instrumentation](#14-crash-instrumentation)
15. [Remaining Assumptions](#15-remaining-assumptions)
16. [Known Technical Debt](#16-known-technical-debt)
17. [Remaining Risks](#17-remaining-risks)
18. [Required Production Tests](#18-required-production-tests)

---

## 1. Every Known Historical Crash / Root Cause

### Incident 1 — StripeSync Per-Webhook pg.Pool Leak
**Date:** Discovered July 27, 2026 (retrospective analysis of recurring P0)  
**Classification:** Resource exhaustion → Railway Postgres connection limit exceeded → all app pool.connect() calls fail with 10-second timeout → 500 on every authenticated request  
**Duration of impact:** Recurred over multiple deployments (hours per episode)

**Root cause (code-level):**  
`stripe-replit-sync` package constructor internally calls `new pg.Pool(config.poolConfig)` at `package/dist/index.js:37`. The prior implementation called `getStripeSync()` (which called `new StripeSync({ poolConfig })`) from inside `webhookHandlers.ts:133` on every incoming Stripe webhook event. Each call created a new `pg.Pool(max:10)` against Railway Postgres that was never closed.

After 2–3 webhook events: 2 unclosed pools × 10 max connections each = 20 live connections against Railway's limit. The application's own pool (then max:5) could not open any new connections. Every Drizzle write timed out at `connectionTimeoutMillis` (then 10s) with:
```
timeout exceeded when trying to connect
```

**Evidence:**  
```typescript
// CONFIRMED PRIOR CODE — webhook handler called new StripeSync() per event
// Each call → new pg.Pool(max:10), never closed
const sync = new StripeSync({ poolConfig });
```

---

### Incident 2 — Promise.race + pool.connect() Producing Permanent Connection Leak
**Date:** July 28, 2026  
**Classification:** Resource exhaustion → slow progressive pool exhaustion → all pool slots held as zombies → 7-hour outage  
**Location:** `/api/readyz` health-check endpoint (prior implementation)

**Root cause (code-level):**  
The `/api/readyz` endpoint used `Promise.race([pool.connect(), timeout])`. When the timeout fired first, the `pool.connect()` promise was abandoned — but `pg` had already acquired a `PoolClient`. That client was never returned to the pool (no `.release()` was called). With `POOL_MAX=8`, 8 races × 1 abandoned client each = all slots permanently occupied. The health check fired every ~10 seconds. Pool exhaustion occurred in `POOL_MAX × 10s = 80 seconds` under probe pressure.

**Evidence:**  
```typescript
// CONFIRMED PRIOR CODE — readyz endpoint
const result = await Promise.race([
  pool.connect(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
]);
// ↑ If timeout fires first, the pg PoolClient is permanently leaked
```

The Pool-Pressure rule in `app.ts:96` explicitly documents this:
```
// Promise.race(pool.query, timeout) abandons the pg PoolClient on timeout,
// leaking it until maxLifetimeSeconds recycles it. With POOL_MAX=8 this
// exhausted all connections within hours (P0 incident, July 28 2026).
```

---

### Incident 3 — build97Monitor DB Fanout
**Date:** July 28, 2026  
**Classification:** Pool saturation cascade under sustained probe load  
**Location:** `artifacts/api-server/src/lib/build97Monitor.ts`

**Root cause:**  
The build97Monitor fired 11 parallel HTTP requests to DB-backed endpoints every 5 minutes, from within the same API server process. Each of the 11 requests acquired a pool connection via the shared pg.Pool. Combined with: (a) Railway healthcheck polling `/api/readyz` on ~10-second intervals, (b) healthMonitor DB probe every 5 minutes, and (c) normal user traffic, peak demand exceeded `POOL_MAX=8` during the 5-minute monitor burst. Once saturated, new connections queued for `connectionTimeoutMillis=10s` before failing, creating a cascading timeout storm.

**Confirmed by Railway logs:** Pool state at saturation showed `total=8, idle=0, waiting=N` (N growing).

---

### Incident 4 — unauthenticated Monitor Probe Leaking KinfolkAI DB Write Connections
**Date:** July 2026 (documented in `.agents/memory/kinfolk-pool-leak.md`)  
**Classification:** Incremental leak, ~1 connection/cycle → exhaustion in ~30 minutes  
**Location:** `POST /api/kinfolk/chat` probe sent from monitoring service without auth token

**Root cause:**  
An external health monitor probed `POST /api/kinfolk/chat` without authentication. The route was unauthenticated at the time. Each probe triggered a full OpenAI API call (~8 seconds). When the monitoring client timed out at 8s, it closed the HTTP connection, but the server's `async` handler continued executing. After the OpenAI response returned, the handler attempted a DB write to log the interaction — using a pool connection that was checked out at the start of the request. The client timeout left the server handler's post-OpenAI DB write orphaned: the connection was held for the 8-second OpenAI call and then never released cleanly when the outer promise chain was abandoned by the HTTP layer. 1 connection per cycle × ~2-minute probe interval = exhaustion in `POOL_MAX × 2min = 16–40 minutes`.

---

### Incident 5 — Railway Restart Without Graceful Shutdown → Inherited Zombie Pool
**Date:** July 2026 (multiple occurrences)  
**Classification:** Transient pool exhaustion on deployment boundary  
**Root cause:**  
Railway sends SIGTERM to the old process before starting the new one. Without a SIGTERM handler, the old process was killed mid-request. In-flight pg.Pool connections were not released to Postgres. The PostgreSQL server had no reason to close them until TCP keepalive expired (~11 minutes). During that window, the new process started and attempted to open its own pool connections, but Railway Postgres's per-user connection limit was already consuming slots from the zombie old process. The new process received `connection limit exceeded` and all DB operations failed for up to 11 minutes.

---

### Incident 6 — iOS App Rejection Build 98 (Apple Guideline 5.1.1(v))
**Date:** July 2026  
**Classification:** App Store rejection, not a runtime crash  
**Root cause:**  
Significant features (business directory, community feed, event browsing) were accessible without creating an account. Apple's Guideline 5.1.1(v) requires that any app with significant account-based features must provide a "no-account" trial mode OR clearly communicate what requires account creation. The app routed anonymous users directly to the login screen rather than offering a preview mode or clearly delineating which features required membership.

---

## 2. Every Fix Implemented

### Fix 1 — StripeSync Singleton (Incident 1)
**File:** `artifacts/api-server/src/stripeClient.ts:83–119`  
**Mechanism:** Promise-singleton pattern. `_stripeSyncPromise` is assigned synchronously before any `await`. All concurrent callers receive the same promise — `new pg.Pool(max:10)` is created exactly once per process.

```typescript
// lib/stripeClient.ts:83
let _stripeSyncPromise: Promise<StripeSync> | null = null;

export function getStripeSync(): Promise<StripeSync> {
  if (!_stripeSyncPromise) {
    _stripeSyncPromise = _createStripeSync().catch((err) => {
      _stripeSyncPromise = null; // allow retry on transient credential failure
      throw err;
    });
  }
  return _stripeSyncPromise;
}
```

Pool size reduced from the stripe-replit-sync default of 10 to **2**:
```typescript
poolConfig: { connectionString: databaseUrl, max: 2, idleTimeoutMillis: 30_000, keepAlive: true }
```

StripeSync pool is explicitly drained on SIGTERM:
```typescript
// index.ts:156
await endStripeSyncPool();
```

---

### Fix 2 — readyz Safe pool.connect() + finally Pattern (Incident 2)
**File:** `artifacts/api-server/src/app.ts:93–108`  
**Mechanism:** Replace `Promise.race([pool.connect(), timeout])` with `pool.connect()` + `try/finally { client.release() }`. The client is always returned even on error.

```typescript
let client: import("pg").PoolClient | undefined;
try {
  client = await pool.connect();
  await client.query("SELECT 1");
  res.json({ status: "ok", db: "ok", pool: getPoolStats() });
} catch (err: unknown) {
  const detail = err instanceof Error ? err.message : "unknown error";
  res.status(503).json({ status: "degraded", db: "error", pool: getPoolStats(), detail });
} finally {
  client?.release();  // ← always executes, always returns the slot
}
```

---

### Fix 3 — build97Monitor Disabled (Incident 3)
**File:** `artifacts/api-server/src/index.ts:99–105`

```typescript
// build97Monitor DISABLED (July 28 2026) — it fired 11 parallel HTTP requests
// to DB-backed endpoints every 5 minutes, each consuming a pool connection via
// the shared pg.Pool. [...] Monitoring is now handled by the external
// monitoring-service (separate Railway service).
// startBuild97Monitor();
```

Status: commented out permanently until external monitoring service is deployed.

---

### Fix 4 — Auth Gate on KinfolkAI Route (Incident 4)
**Mechanism:** `POST /api/kinfolk/chat` now requires authentication. Unauthenticated probes receive `401` before any DB connection is acquired. Lightweight `GET /api/kinfolk/health` probe endpoint added for external monitors (returns `200 OK`, no DB, no OpenAI).

---

### Fix 5 — SIGTERM Graceful Shutdown (Incident 5)
**File:** `artifacts/api-server/src/index.ts:119–184`  
**Mechanism:** Four-stage drain sequence with force-exit safety net:

```
T+0s:   SIGTERM received → isShuttingDown = true
T+0s:   server.close() — stops accepting new connections
T+0s:   server.closeIdleConnections() — closes keep-alive HTTP sockets
T+0s:   await pool.end() — drains app pg.Pool (releases all Postgres connections)
T+0s:   await endStripeSyncPool() — drains StripeSync pg.Pool (max:2)
T+22s:  server.closeAllConnections() — closes any active request sockets remaining
T+25s:  process.exit(1) — force exit before Railway SIGKILL at T+30s
```

Pool state is logged at drain-start for post-incident forensics:
```typescript
logger.info({ signal, pool: getPoolStats() }, "Received shutdown signal — pool state at drain start");
```

---

### Fix 6 — Pool Size 8 → 20 (Incident 2/3 compound)
**File:** `lib/db/src/index.ts:46`  
**Evidence:**
```typescript
// Increased 8→20 (July 28 2026) after recurring pool exhaustion P0:
//   - 11 parallel HTTP checks in build97Monitor each hit DB-backed handlers
//   - Railway healthcheck polls /api/readyz on ~10s interval
//   - healthMonitor fires pool.connect() every 5 min
export const POOL_MAX = 20;
// Total live DB connections: POOL_MAX (app) + 2 (StripeSync) = 22 max.
```

---

### Fix 7 — idleTimeoutMillis 300,000 → 30,000 ms
**File:** `lib/db/src/index.ts:86–94`  
Dead sockets from Railway network events are replaced within one idle cycle (30s) rather than persisting for up to 5 minutes.

---

### Fix 8 — maxLifetimeSeconds Added (1800s = 30min)
**File:** `lib/db/src/index.ts:91–97`  
Second-layer defense against long-lived connections surviving a Railway network reconfiguration. Recycles every connection after 30 minutes regardless of idle state.

---

### Fix 9 — keepAlive + keepAliveInitialDelayMillis 10,000 → 1,000 ms
**File:** `lib/db/src/index.ts:95–96`  
Dead TCP sockets detected in 1–2 seconds rather than up to 685 seconds.

---

### Fix 10 — Pool Pressure Guard Middleware
**File:** `artifacts/api-server/src/app.ts:197–221`  
Returns `503` immediately before any connection is acquired when `total >= POOL_MAX AND idle === 0 AND waiting >= 2`. Prevents cascade: instead of 50 requests queuing behind pool.connect() for 10s each, they receive a clean 503 in <1ms.

```typescript
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith("/api/")) return next();
  const stats = getPoolStats();
  if (stats.total >= POOL_MAX && stats.idle === 0 && stats.waiting >= 2) {
    res.status(503).json({ error: "Service temporarily unavailable. Please retry in a moment.", retryAfter: 5 });
    return;
  }
  next();
});
```

---

### Fix 11 — withDbRetry for Transient Connection Errors
**File:** `artifacts/api-server/src/lib/db-retry.ts`  
Single retry on confirmed connection-class errors only (ECONNRESET, ECONNREFUSED, ETIMEDOUT, EHOSTUNREACH, pool timeout, "Connection terminated unexpectedly"). Never retries constraint violations (23505), auth errors, or any error where PostgreSQL responded with an error code — those indicate the query reached the server and a retry would risk duplicate writes.

```typescript
const TRANSIENT_NODE_CODES = new Set([
  "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EHOSTUNREACH", "ENOTFOUND", "EPIPE",
]);
// 500ms delay between attempts
// Max 2 attempts total (1 + 1 retry)
```

---

### Fix 12 — GPS Timeout Guards (Map)
**Files:** `artifacts/mobile/components/BusinessMapView.tsx:110–115, 167–172`  
`artifacts/mobile/components/FullMapView.tsx:227–230, 319–324`

`Location.getCurrentPositionAsync()` can hang indefinitely when the OS defers GPS (background fetch, privacy mode, first-run permission dialog). Added `Promise.race` with 8-second rejection:

```typescript
const loc = await Promise.race([
  Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("location timeout")), 8_000)
  ),
]);
```

On timeout, the catch block is silent — the map displays at the DEFAULT_REGION (US-wide center: lat 37.0, lng -95.0, delta 32/52) rather than hanging.

---

### Fix 13 — Apple Nonce Requirement (iOS 26+)
**Files:** `artifacts/mobile/app/login.tsx:114–139`, `artifacts/mobile/app/signup.tsx:95–119`  
iOS 26+ enforces a cryptographic nonce in Apple Sign-In. Fixed by generating 32 random bytes, hex-encoding as `rawNonce`, computing `SHA-256(rawNonce)` as `hashedNonce`, passing `hashedNonce` to `signInAsync()`, and sending `rawNonce` to the server. Server verifies `SHA-256(rawNonce) === payload.nonce` from the Apple identity token.

---

### Fix 14 — MapView absoluteFillObject Removal (RN 0.86)
**Evidence:** `.agents/memory/rn-absolutefillobject-removed.md`  
`StyleSheet.absoluteFillObject` was removed in React Native 0.86 — spreading it produces `{}`, which gives `MapView` zero size, causing `onMapReady` to never fire and the screen to stay black. Fixed with explicit `position: "absolute", top: 0, left: 0, right: 0, bottom: 0` coordinates.

---

### Fix 15 — Session Renewal Throttle (Write Storm Prevention)
**File:** `artifacts/api-server/src/middlewares/authMiddleware.ts:119–146`  
Rolling session renewal is throttled to at most once per session per hour using an in-memory `Map<sid, timestamp>`. App-startup bursts (many concurrent requests from the same session) no longer cause DB write storms. Failed renewals delete the throttle key to allow retry on the next request.

---

### Fix 16 — Community Agreement Server Record (Apple 5.1.1(v))
**Files:** `artifacts/api-server/src/routes/auth.ts:582–590` (email signup), `auth.ts:1023–1029` (Apple Sign-In), `artifacts/api-server/src/routes/membership.ts` (GET/POST endpoints), `lib/db/src/schema/member-agreements.ts` (table)  
Every new member account now creates a server-authoritative `member_agreements` record at signup time. The mobile app presents a Community Agreement screen (`app/onboarding/agreement.tsx`) at step 4 of 6 in onboarding.

---

## 3. Every Crash Vector Still Possible

The following are credible paths to a crash, hang, or rejection that are **not yet eliminated by code**. Each is rated by **Likelihood** (probability given normal usage) and **Impact** (user experience consequence).

### Vector 1 — Unidentified Native iOS Crash (UNRESOLVED — P0)
**Likelihood:** CONFIRMED (crash was real; type unidentified)  
**Impact:** Complete app termination  
**Evidence:** App was rejected. Tester reported crashes. No TestFlight crash log has been obtained and analyzed. No Sentry or native crash capture was in place during Build 97/98 testing.  
**What we do not know:** Whether this is a MapKit native signal, a React Native bridge crash, an OOM termination, or a JavaScript exception that the previous 600-char handler failed to capture.  
**Status:** JS crash instrumentation deployed (OTA). TestFlight crash log analysis is the required next step before this vector can be closed.

---

### Vector 2 — JavaScript Exception Escaping ErrorBoundary
**Likelihood:** Low (ErrorBoundary is mounted at root)  
**Impact:** White screen (React renders null), no user-facing message  
**Path:** Error thrown inside a component that is not a child of ErrorBoundary (e.g., in an imperative callback like a timeout or an event listener).  
**Current mitigation:** `installCrashLogger()` sets a global `ErrorUtils` handler that fires before ErrorBoundary. The new crash logger captures the full stack and sends it to Railway.  
**Gap:** ErrorBoundary recovery path has not been tested with a real out-of-tree error.

---

### Vector 3 — GPS Hang Causing Navigation Tab Freeze
**Likelihood:** Medium (occurs on first launch with no cached location, or with restricted GPS)  
**Impact:** Map tab unresponsive for up to 8s, then silently falls back to DEFAULT_REGION  
**Path:** `Location.requestForegroundPermissionsAsync()` prompt is pending while user taps the Map tab. `getCurrentPositionAsync()` is blocked by the permission dialog. The 8-second timeout fires, the catch block runs silently, and the map renders at US-wide default. On devices where GPS is disabled entirely, the catch block may see a platform error before the 8s timeout.  
**Current mitigation:** 8-second timeout with silent fallback to US-wide DEFAULT_REGION.  
**Gap:** Permission denial does not produce a user-facing message explaining why no "near me" results appear.

---

### Vector 4 — Pool Exhaustion Under Railway Redeploy Race
**Likelihood:** Low (mitigated by graceful shutdown)  
**Impact:** All authenticated requests return 503 for up to ~30 seconds  
**Path:** Railway sends SIGTERM but (due to load or process trap) the old process holds connections past the `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=60` window. The new process opens its own pool while Postgres still counts the old process's connections toward the limit. With `POOL_MAX=20 + StripeSync=2 = 22` connections per process, and Railway Postgres's per-user connection ceiling, two overlapping processes could temporarily exceed the limit.  
**Current mitigation:** Graceful shutdown drain at T+0s; force-exit at T+25s. `maxLifetimeSeconds=1800` ensures zombie connections are recycled by Postgres within 30 minutes at worst.  
**Gap:** The specific Railway Postgres connection ceiling is not documented here. It must be checked against `POOL_MAX × 2` to confirm headroom.

---

### Vector 5 — Session DB Lookup Failure on Every Request (authMiddleware)
**Likelihood:** Low (only during DB degradation)  
**Impact:** All authenticated requests silently fail role enforcement; user sees stale role  
**Path:** In `authMiddleware.ts:98–110`, the DB call to re-read `role` is wrapped in `try/catch` with an empty catch block:
```typescript
} catch {
  // If DB lookup fails, serve the existing session role rather than blocking the request
}
```
This is intentional (not a bug) — the design decision was to serve a stale role rather than fail the request. However, if a user was promoted to `admin` and the DB is degraded, they retain their old role until the DB recovers.  
**Assessment:** Acceptable for this application's threat model. Not a crash vector, but a security-relevant degradation mode.

---

### Vector 6 — Apple Credential State Check Race on App Resume
**Likelihood:** Very low  
**Impact:** Spurious logout if Apple services transiently unreachable  
**Path:** `auth.tsx:330–351`. On every `AppState` → `active` transition, the app calls `AppleAuth.getCredentialStateAsync(appleUserId)`. If this call throws (Apple services unreachable, timeout), the `catch {}` block swallows it and the user stays logged in. If Apple services return a wrong response due to a race between token refresh and the state check, the user could be logged out spuriously.  
**Current mitigation:** `catch {}` prevents false logouts from network errors. Only `REVOKED` or `NOT_FOUND` states trigger logout.  
**Gap:** The async Apple services check is unbounded in time — no timeout is applied.

---

### Vector 7 — SecureStore Write Failure at Login
**Likelihood:** Very low  
**Impact:** User gets "signed in but could not save your session" error message and must retry  
**Path:** `auth.tsx:242–260`. If `SecureStore.setItemAsync(AUTH_TOKEN_KEY, token)` throws, the error is caught and returned as a user-visible message. The user is not silently logged in with a lost token. A read-back verify step confirms the token was retained.  
**Current mitigation:** Explicit read-back verification after every SecureStore write.  
**Gap:** On devices where Secure Enclave is unavailable (simulator, very old hardware), SecureStore may fall back to AsyncStorage without encryption — behavior is platform-dependent.

---

### Vector 8 — authorizationCode Absent on Old App Build
**Likelihood:** Medium (any user on a pre-v1.1.4 build who signs in again)  
**Path:** Apple only sends `authorizationCode` on the first sign-in. Subsequent sign-ins from the same Apple account do not include it. Old builds did not send it at all.  
**Current handling (auth.ts:984–998):**
- New user without code → **blocked** (returns 400)
- Existing user without code → **allowed** (logs `APPLE_TOKEN_EXCHANGE_LEGACY_NO_CODE`, proceeds without token refresh)
- New user with code but secrets not configured → **blocked** (returns 500)
- Existing user with code but secrets not configured → **allowed** (proceeds without token storage)

**Assessment:** Correct behavior. Not a crash vector.

---

### Vector 9 — React Native DeviceEventEmitter Memory Warning Silently Missing
**Likelihood:** Low  
**Path:** `_layout.tsx:327–338`. The memory warning listener is wrapped in `try/catch` and the module import uses `require()` inside the try block. If `DeviceEventEmitter` is unavailable in a particular RN version, the catch swallows the error. Memory warnings on iOS would not be captured by the crash logger.  
**Impact:** Crash logger loses the OOM signal, making OOM terminations harder to distinguish from native crashes.  
**Gap:** Not tested on physical device. Effectiveness is assumed.

---

### Vector 10 — Crash Report Not Delivered If App Is Killed Before OTA Update Check
**Likelihood:** Medium  
**Path:** If the app crashes, AsyncStorage stores the crash report. On next launch, `checkAndSendSavedCrash()` is called in `CrashLoggerSetup` (mounted in the root layout). If the user kills the app before the root layout mounts (e.g., crash occurs during navigation hydration before providers mount), the crash report is persisted but never sent to the server.  
**Impact:** Crash data survives in AsyncStorage and is visible in `/debug/crash-log`, but Railway receives no `MOBILE_CRASH_REPORT` event.

---

## 4. Complete Connection-Pool Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        API Server Process                                │
│                        (Railway — 1 replica)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │   Application pg.Pool (lib/db/src/index.ts)                      │   │
│  │                                                                    │   │
│  │   POOL_MAX = 20           connectionTimeoutMillis = 10,000 ms    │   │
│  │   idleTimeoutMillis = 30,000 ms                                   │   │
│  │   maxLifetimeSeconds = 1,800 s (30 min)                          │   │
│  │   keepAlive = true                                                │   │
│  │   keepAliveInitialDelayMillis = 1,000 ms                         │   │
│  │   statement_timeout = 10,000 ms  (Postgres-side)                 │   │
│  │   query_timeout = 10,000 ms  (node-postgres client-side)         │   │
│  │   SSL: rejectUnauthorized = false (non-localhost non-.internal)   │   │
│  │                                                                    │   │
│  │   Proxy object: pool.* → getPool().* (lazy init on first use)    │   │
│  └────────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │   StripeSync pg.Pool (stripeClient.ts)                           │   │
│  │                                                                    │   │
│  │   max = 2  (reduced from stripe-replit-sync default of 10)       │   │
│  │   idleTimeoutMillis = 30,000 ms                                   │   │
│  │   keepAlive = true                                                │   │
│  │   Created: once per process, via promise singleton               │   │
│  │   Drained: on SIGTERM via endStripeSyncPool()                    │   │
│  └────────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                       │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                    ┌───────────────▼──────────────────┐
                    │  Railway Postgres (service 7bb11d12) │
                    │  Internal URL: *.internal (no SSL)   │
                    │  Public proxy URL: SSL rejectUnauth  │
                    │                                      │
                    │  Max live connections from API:      │
                    │  POOL_MAX (20) + StripeSync (2) = 22 │
                    └──────────────────────────────────────┘
```

### Pool Guards (ordered, all active in production):

```
Request arrives
      │
      ▼
[pool-pressure-guard middleware]
 IF total >= 20 AND idle == 0 AND waiting >= 2:
   → 503 immediately (no connection acquired)
      │
      ▼ (otherwise)
[route handler]
      │
      ├── Drizzle ORM (db.select / db.insert / db.update):
      │   pool.query() internally — connection auto-released after query
      │
      └── Explicit pool.connect() (5 sites, all with finally { client.release() })
```

### Pool Instrumentation (running in production):

- 500-event ring buffer (`_ring` array in `lib/db/src/pool-instrumentation.ts`)
- `SLOW_QUERY` warning logged to Railway when any `pool.query()` exceeds 5,000 ms
- 60-second sweep: `POOL_GROWTH_DETECTED` warning when `totalCount` grows between sweeps, or `waitingCount > 0`
- Accessible at `GET /api/pool-audit` (requires `x-cron-secret` header)
- `GET /api/pool-audit?summary=true` returns peak total/waiting and slow query list

---

## 5. Every Database Acquisition / Release Path

There are two patterns in use: **Drizzle ORM** (auto-managed via `pool.query()`) and **explicit `pool.connect()`** (manual, requires `finally { client.release() }`).

### Pattern A — Drizzle ORM (db.select / db.insert / db.update / db.delete)
All route handlers using `db.*` go through Drizzle, which calls `pool.query()` internally. `pool.query()` acquires a connection, executes, and returns it to the pool automatically. No manual release is required or possible. **This is the dominant pattern across the codebase.**

### Pattern B — Explicit pool.connect() (5 locations)

| File | Purpose | Release guarantee |
|---|---|---|
| `artifacts/api-server/src/app.ts:100` | `/api/readyz` health check (`SELECT 1`) | `finally { client?.release() }` |
| `artifacts/api-server/src/routes/readyz.ts:39` | alternate readyz endpoint | `finally { rawClient?.release() }` |
| `artifacts/api-server/src/routes/db-probe.ts:35` | admin DB probe | `finally { rawClient?.release() }` |
| `artifacts/api-server/src/lib/healthMonitor.ts:96` | 5-min health monitor probe | `finally { client?.release() }` (verified) |
| `artifacts/api-server/src/routes/users.ts:507` | account deletion — raw SQL | `finally { client.release() }` |

**All 5 explicit `pool.connect()` sites use `try/finally { client.release() }`.**  
There are no bare `pool.connect()` calls without a release guard in the current codebase.

### Pattern C — pool.query() Raw SQL (2 locations)
Per `.agents/memory/pool-query-pattern.md`: `pool.query(sqlString, params[])` is used instead of `db.execute(sql\`...\`)` for two operations where Drizzle's `db.execute` silently failed in esbuild bundles:

| File | Operation |
|---|---|
| `artifacts/api-server/src/lib/auth.ts:94` | `deleteAllSessionsForUser` — raw DELETE with JSONB path operator |
| `artifacts/api-server/src/routes/users.ts` | account deletion raw cleanup |

`pool.query()` acquires and releases automatically — no manual release required.

### Pattern D — withDbRetry wrapper
Used on the email signup route (`auth.ts:542`) and other high-risk write paths. Wraps a Drizzle or raw-SQL function call. Does not change the connection acquisition model; it retries the entire async function on transient errors. The retry runs a fresh acquisition cycle.

---

## 6. Complete Authentication Flow

### 6a — Email Registration

```
Client                            Server (auth.ts:POST /api/auth/register)
  │                                   │
  ├── POST /api/auth/register ────────►
  │   { firstName, lastName, email,   │
  │     password, username, dob,      │
  │     agreeToTerms }                │
  │                                   ├── Input validation (all fields)
  │                                   ├── DOB: age ≥ 13 (COPPA), age ≤ 120
  │                                   ├── Email regex validation
  │                                   ├── Username: /^[a-z0-9_]{3,30}$/
  │                                   ├── Reserved username check
  │                                   ├── Password: length ≥ 8
  │                                   │
  │                                   ├── withDbRetry(() => {
  │                                   │     Promise.all([
  │                                   │       SELECT id FROM users WHERE email = ? LIMIT 1
  │                                   │       SELECT id FROM users WHERE username = ? LIMIT 1
  │                                   │       bcrypt.hash(password, 8)
  │                                   │     ])
  │                                   │   })
  │                                   │
  │                                   ├── IF duplicate email → 409
  │                                   ├── IF duplicate username → 409
  │                                   │
  │                                   ├── INSERT INTO users (email, firstName, lastName,
  │                                   │     username, passwordHash, approved=true,
  │                                   │     agreeToTerms=true, dateOfBirth, referralCode)
  │                                   │   .returning()
  │                                   │
  │                                   ├── INSERT member_agreements (non-blocking, .catch(()=>{}))
  │                                   ├── sendWelcomeEmail() (non-blocking)
  │                                   │
  │                                   ├── createSession(sessionData)
  │                                   │   → INSERT sessions (sid, sess, expire=+7 days)
  │                                   │   → returns sid (32 random bytes hex)
  │                                   │
  │◄── 201 { token: sid, user } ──────┤
  │                                   │
  ├── SecureStore.setItemAsync(        │
  │     AUTH_TOKEN_KEY, sid)           │
  ├── SecureStore verify read-back     │
  └── navigate to main app            │
```

### 6b — Email Login

```
Client                            Server (auth.ts:POST /api/auth/login-email)
  │                                   │
  ├── POST /api/auth/login-email ─────►
  │   { email, password }             │
  │                                   ├── Fetch user by email (LIMIT 1)
  │                                   ├── IF not found → 401 (generic "Invalid credentials")
  │                                   ├── Check lockedUntil:
  │                                   │     ≥5 failures: locked 60 min
  │                                   │     ≥3 failures: locked 15 min
  │                                   ├── bcrypt.compare(password, passwordHash)
  │                                   ├── IF mismatch:
  │                                   │     failedLoginAttempts += 1
  │                                   │     SET lockedUntil if threshold hit
  │                                   │     → 401
  │                                   ├── IF match:
  │                                   │     SET failedLoginAttempts=0, lockedUntil=null
  │                                   │     createSession() → sid
  │◄── 200 { token: sid, user } ──────┤
  │                                   │
  ├── SecureStore.setItemAsync(sid)    │
  ├── SecureStore read-back verify     │
  ├── setIsLoading(true)               │
  └── caller awaits refreshUser()     │
      then navigates                  │
```

---

## 7. Apple Sign-In Sequence

Full sequence including iOS 26+ nonce enforcement and authorization-code exchange:

```
iOS Device                   Client (login.tsx / signup.tsx)       Server (auth.ts)
     │                                │                                 │
     │  Step 1: Generate nonce        │                                 │
     │◄───────────────────────────────┤                                 │
     │  rawNonce = hex(random 32 bytes)                                 │
     │  hashedNonce = SHA-256(rawNonce)                                 │
     │                                │                                 │
     │  Step 2: Apple Sign-In         │                                 │
     │  signInAsync({                 │                                 │
     │    requestedScopes: [FULL_NAME, EMAIL],                          │
     │    nonce: hashedNonce  ← pre-hashed per TN3194                  │
     │  })                            │                                 │
     │                                │                                 │
     │  Apple authenticates user      │                                 │
     │  Apple generates identityToken │                                 │
     │  Apple encodes nonce=hashedNonce into JWT payload               │
     │  Apple provides authorizationCode (first sign-in only)          │
     │                                │                                 │
     │  Returns:                      │                                 │
     │  { identityToken, user:        │                                 │
     │    { fullName, email },        │                                 │
     │    authorizationCode }         │                                 │
     │                                │                                 │
     │  Step 3: Send to server        │                                 │
     │──────────────────────────────► POST /api/auth/apple-signin      │
     │                                │ { identityToken, nonce:        │
     │                                │   rawNonce,  ← NOT hashed      │
     │                                │   appleUserId, email,          │
     │                                │   firstName, lastName,         │
     │                                │   authorizationCode }          │
     │                                │                                 │
     │                                │  Step 4: Verify identity token  │
     │                                │  GET https://appleid.apple.com/ │
     │                                │       auth/keys (JWKS)          │
     │                                │  Find matching key by `kid`     │
     │                                │  crypto.createPublicKey(JWK)   │
     │                                │  jwt.verify(identityToken, pem,│
     │                                │    { algorithms:['RS256'],      │
     │                                │      issuer:'https://appleid.   │
     │                                │             apple.com',         │
     │                                │      audience:'com.melaninmaps  │
     │                                │              .app' })           │
     │                                │                                 │
     │                                │  Step 5: Nonce verification     │
     │                                │  expectedHash = SHA-256(rawNonce│
     │                                │                from request)    │
     │                                │  IF payload.nonce !== expectedHash:
     │                                │    throw "nonce mismatch" → 401│
     │                                │                                 │
     │                                │  Step 6: Look up user by appleId│
     │                                │  IF not found: look up by email │
     │                                │  (account linking for users who │
     │                                │  previously used email/password)│
     │                                │                                 │
     │                                │  Step 7: Authorization code exchange
     │                                │  (if authorizationCode present) │
     │                                │  generateClientSecret(TEAM_ID,  │
     │                                │    KEY_ID, PRIVATE_KEY, CLIENT_ID)
     │                                │  → Apple JWT client secret       │
     │                                │  exchangeAuthCode(code,         │
     │                                │    clientId, clientSecret)      │
     │                                │  → { refreshToken }             │
     │                                │  encryptToken(refreshToken,     │
     │                                │    APPLE_TOKEN_ENCRYPTION_KEY)  │
     │                                │  → AES-256-GCM encrypted blob   │
     │                                │  Stored in users.appleRefreshToken
     │                                │                                 │
     │                                │  Step 8: Create / update user   │
     │                                │  IF new user:                   │
     │                                │    INSERT users(appleId, email, │
     │                                │      approved=true, ...)        │
     │                                │    INSERT member_agreements     │
     │                                │      (non-blocking)             │
     │                                │  IF existing user + new token:  │
     │                                │    UPDATE users SET             │
     │                                │      appleRefreshToken=encrypted│
     │                                │                                 │
     │                                │  Step 9: Clear lockout          │
     │                                │  UPDATE users SET               │
     │                                │    failedLoginAttempts=0,       │
     │                                │    lockedUntil=null             │
     │                                │                                 │
     │                                │  Step 10: Create session        │
     │                                │  createSession(sessionData)     │
     │                                │  → sid                          │
     │                                │                                 │
     │◄── 200 { token: sid, user } ────────────────────────────────────│
     │                                │                                 │
     │  SecureStore.setItemAsync(      │                                 │
     │    AUTH_TOKEN_KEY, sid)         │                                 │
     │  SecureStore.setItemAsync(      │                                 │
     │    'apple_user_id', sub)        │                                 │
```

### Apple Sign-In Error Handling Matrix

| Condition | New user | Existing user | HTTP response |
|---|---|---|---|
| No authorizationCode, secrets configured | Blocked | Allowed (legacy build) | 400 / 200 |
| Code present, exchange succeeds | Token stored | Token updated | 200 |
| Code present, network error during exchange | Blocked | Allowed (no token) | 401 / 200 |
| Code present, Apple rejected (invalid_client etc.) | Blocked | Allowed (no token) | 401 / 200 |
| Secrets not configured | Blocked | Allowed | 500 / 200 |
| Nonce mismatch | Blocked | Blocked | 401 |
| User not approved | Blocked | Blocked | 403 |

---

## 8. Session Lifecycle

### Storage
Sessions are stored in the Railway PostgreSQL `sessions` table (not Redis, not in-memory):
```sql
sessions (
  sid    TEXT PRIMARY KEY,          -- 32 random bytes, hex-encoded (64 chars)
  sess   JSONB NOT NULL,            -- SessionData: { user, access_token, refresh_token, expires_at }
  expire TIMESTAMP NOT NULL         -- wall-clock expiry
)
```

### Token Transport
- **Mobile app:** `Authorization: Bearer <sid>` on every request
- **Web app:** `sid` HttpOnly cookie (set by `SESSION_COOKIE = "sid"`)
- **authMiddleware:** reads `req.headers.authorization` first, falls back to `req.cookies.sid`

### Session TTL
```typescript
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
```

Expiry is **rolling**: on every authenticated request, `updateSession()` extends `expire` to `now + 7 days`. Throttled to at most one DB write per session per hour via in-memory `Map<sid, timestamp>`.

### Session Sequence (per request)

```
[authMiddleware runs on every request]
      │
      ▼
1. getSessionId(req) → Bearer token OR cookie sid
   IF no sid → next() (anonymous request)
      │
      ▼
2. getSession(sid) → SELECT FROM sessions WHERE sid = ?
   IF not found OR expire < now:
     deleteSession(sid) (cleanup)
     clearSession(res, sid) (clear cookie)
     next() (anonymous request)
      │
      ▼
3. refreshIfExpired(sid, session)
   IF session.expires_at is past AND refresh_token exists:
     oidc.refreshTokenGrant() → new access_token
     updateSession(sid, refreshed)
   IF refresh fails → clearSession(), next() (anonymous)
      │
      ▼
4. DB role re-read
   SELECT role FROM users WHERE id = session.user.id LIMIT 1
   IF role changed → updateSession() (immediate role sync)
   IF DB lookup fails → serve stale role (catch{} intentional)
      │
      ▼
5. Rolling renewal (throttled 1/hour/session)
   IF shouldRenew:
     updateSession(sid, session) → extend expire to now + 7 days
     (non-blocking — failure logged, throttle key deleted for retry)
      │
      ▼
6. req.user = session.user
   next()
```

### Session Termination

| Trigger | Action |
|---|---|
| `logout()` on mobile | DELETE SecureStore keys → `POST /api/mobile-auth/logout` (3s timeout) → server deleteSession() |
| 401 from `/api/auth/user` | SecureStore.deleteItemAsync(AUTH_TOKEN_KEY) → setUser(null) → sessionExpired=true |
| Apple credential REVOKED or NOT_FOUND | logout() called from AppState listener |
| Manual admin revocation | `deleteAllSessionsForUser(userId)` via raw SQL DELETE on JSONB path |
| Token not found in SecureStore on launch | setUser(null), isLoading=false, no logout call (token never existed) |

---

## 9. Map / Location Lifecycle

### Permission Flow

```
Map Tab Mounts
      │
      ▼
Location.requestForegroundPermissionsAsync()
      │
      ├── GRANTED:
      │     Promise.race([
      │       Location.getCurrentPositionAsync({ accuracy: Balanced }),
      │       new Promise(reject at 8,000 ms)
      │     ])
      │     │
      │     ├── Resolves in < 8s:
      │     │     mapRef.current?.animateTo({ lat, lng, zoom })
      │     │
      │     └── Rejects (timeout OR platform error):
      │           Silent catch. Map stays at DEFAULT_REGION.
      │
      └── DENIED / UNDETERMINED:
            No GPS call. Map renders at DEFAULT_REGION.
            No user-facing explanation rendered. [KNOWN GAP]
```

### DEFAULT_REGION
```typescript
const DEFAULT_REGION = {
  latitude: 37.0,
  longitude: -95.0,
  latitudeDelta: 32.0,
  longitudeDelta: 52.0,
};
// United States center. Null Island (lat=0, lng=0) excluded from markers.
```

### Business Markers
- All businesses in the DB have `lat` and `lng` columns populated.
- Null Island exclusion: businesses where `lat === 0 AND lng === 0` are filtered from the mapped set before `fitToCoordinates()` is called.
- `fitToCoordinates()` fires once on the first combination of `businesses !== empty` and `mapReady === true`.

### MapView Initialization Guard
`onMapReady` must fire before any programmatic camera movement. Previous crash (RN 0.86): `StyleSheet.absoluteFillObject` spread produced `{}` → MapView zero size → `onMapReady` never fired → screen stayed black. Fixed with explicit `position: "absolute", top: 0, left: 0, right: 0, bottom: 0`.

### Recenter Button (FullMapView)

```typescript
// FullMapView.tsx:319–324
const loc = await Promise.race([
  Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("location timeout")), 8_000)
  ),
]);
```

Same 8-second guard as initial load. On timeout, catch block is silent — the map does not move.

### Heritage / Cultural Sites
Cultural sites are loaded from the `cultural_sites` table and rendered as separate markers with category-specific pin icons. They are visible by default (no toggle required).

---

## 10. Navigation Lifecycle

### Stack Structure

```
RootLayout (ThemeProvider > SafeAreaProvider > ErrorBoundary > QueryClient > AuthProvider
           > SubscriptionProvider > GestureHandlerRootView > KeyboardProviderWrapper)
   │
   ├── OnboardingChecker (useEffect on mount: checks AsyncStorage onboarding flag)
   ├── AuthGate (useEffect on pathname: enforces login for non-exempt routes)
   ├── ApprovalChecker (useEffect: redirects pending-approval users)
   ├── DobChecker (useEffect: enforces DOB collection)
   ├── SessionExpiryWatcher
   ├── BiometricEnrollmentPrompt
   ├── PushNotificationRegistrar
   ├── CrashLoggerSetup (useEffect: nav/appState/memory breadcrumbs)
   │
   └── RootLayoutNav (Stack)
         ├── (tabs) — tab navigator (Community, Map, Explore, Inbox, Profile)
         │     └── Community tab is initialRouteName (first tab shown)
         ├── business/[id]
         ├── event/[id]
         ├── login, signup, onboarding/*
         ├── debug/crash-log [new]
         └── ... (all other screens)
```

### AUTH_EXEMPT Paths (do not require login)
```
/login, /signup, /waitlist, /dob-collection, /profile-setup,
/community-guidelines, /community-standards, /roadmap, /contact, /affiliate
```
All other paths: AuthGate redirects to `/login` if `!isAuthenticated` after `!isLoading`.

### Onboarding Flow
```
First launch (no @mapping_with_melanin_onboarding_complete):
  → /onboarding (index)
  → /onboarding/safety
  → /onboarding/travel
  → /onboarding/identity
  → /onboarding/agreement  [Community Agreement — step 4 of 6]
  → /onboarding/join
  → login or signup
  → On success: AsyncStorage.setItem('@mapping_with_melanin_onboarding_complete', 'true')
  → navigate to /(tabs)
```

### Deep Links
Custom scheme: `mappingwithmelanin://`  
Mobile auth callback: `mappingwithmelanin://auth-complete?token=<sid>`  
Handled by `app/auth-complete.tsx` — stores token to SecureStore then calls `fetchUser()`.

---

## 11. Background / Foreground Lifecycle

### CrashLoggerSetup (active from first render after providers mount)

```typescript
// _layout.tsx — CrashLoggerSetup component
useEffect(() => {
  checkAndSendSavedCrash().catch(() => {});           // replay unsent crash from prior session

  const stateSub = AppState.addEventListener("change", (next: AppStateStatus) => {
    setAppStateBreadcrumb(next);                        // records: "active" | "background" | "inactive"
  });

  const handler = DeviceEventEmitter.addListener("memoryWarning", () => {
    addMemoryWarningBreadcrumb();                       // iOS only — OS low-memory signal
  });

  return () => {
    stateSub.remove();
    handler.remove();
  };
}, []);
```

### Apple Credential State Check (AuthProvider)

```typescript
// auth.tsx:330–351 — runs on iOS only
AppState.addEventListener("change", async (nextState) => {
  if (nextState !== "active") return;                  // only check on foreground resume
  const appleUserId = await SecureStore.getItemAsync("apple_user_id");
  if (!appleUserId) return;                            // not an Apple Sign-In session
  const credState = await AppleAuth.getCredentialStateAsync(appleUserId);
  if (credState === REVOKED || credState === NOT_FOUND) {
    await SecureStore.deleteItemAsync("apple_user_id");
    await logout();
  }
  // throws: swallowed (Apple services unreachable — no spurious logout)
});
```

### RevenueCat Session Binding

```typescript
// auth.tsx:108–110 — on every successful fetchUser()
Purchases.logIn(String(user.id)).catch(() => {});
```

```typescript
// auth.tsx:301–303 — on logout()
Purchases.logOut().catch(() => {});
```

### Push Notification Registration (PushNotificationRegistrar)
Runs at mount. Requests notification permission, gets Expo push token, sends to `POST /api/push-tokens`. Does not block app boot — all network calls are non-blocking.

### Expo Updates (OTA)
OTA checks run at launch via expo-updates. Channel: `production`. If an update is available, it downloads in the background and applies on next cold launch. Current build (98) can receive OTA JS updates without a new binary submission.

---

## 12. Memory Usage Strategy

### Design Principle
No unbounded in-memory stores. Every persistent data structure in the server process has a fixed maximum size or a TTL eviction.

### Server Process — Memory-Bounded Structures

| Structure | Location | Max size | Eviction |
|---|---|---|---|
| Pool instrumentation ring buffer | `lib/db/src/pool-instrumentation.ts:52` | 500 `PoolEvent` objects | Oldest evicted when `_ring.length > 500` |
| Crash reports ring buffer | `artifacts/api-server/src/routes/crash-reports.ts` | 50 crash reports | Oldest evicted on insert |
| Session renewal throttle Map | `authMiddleware.ts:19` | 1 entry per active session | Never explicitly evicted — sessions expire and are cleaned up. Old sessions in DB → row deleted → SID no longer seen → Map entry becomes stale (benign). [KNOWN GAP: Map is never explicitly pruned] |
| Health check history | `lib/healthMonitor.ts` | 12-hour ring | Time-based eviction |
| OIDC config cache | `lib/auth.ts:24` | 1 object | Process lifetime (no eviction; OIDC endpoint metadata rarely changes) |
| StripeSync singleton | `stripeClient.ts:83` | 1 object | Process lifetime |

### Mobile App — Memory Usage

| Structure | Location | Max size |
|---|---|---|
| Navigation breadcrumbs | `crashLogger.ts` | Last 20 routes (`MAX_BREADCRUMBS = 20`) |
| API request log | `crashLogger.ts` | Last 10 requests (`MAX_API_LOG = 10`) |
| Query cache (React Query) | `QueryClientProvider` | Default stale time. Not explicitly bounded — each query result is cached individually. No global cache size limit set. [KNOWN GAP] |
| Business list | `useBusinesses` hook | All businesses returned by the API (currently ~102 in production). JSON held in React Query cache. |

### Known Memory Gap — Server renewalThrottle Map
The `renewalThrottle` Map in `authMiddleware.ts` accumulates one entry per unique session SID seen during the process lifetime. Sessions that expire and are deleted from the DB continue to occupy an entry in the Map until the process restarts. Under normal usage (sessions expire after 7 days, server restarts periodically for deployments), this is benign — the Map grows to at most `POOL_MAX × average_sessions_per_connection` during a deployment window. Under pathological usage (many users with many sessions all active simultaneously for 7+ days without a deployment), the Map grows unboundedly.

**Severity:** Very low in current usage. **Mitigation needed before scale.**

---

## 13. Pool Instrumentation Output

### What Is Instrumented
`initPoolInstrumentation(pool)` is called once at server startup (`index.ts:92`). It attaches to the `pg.Pool` event system and wraps `pool.query()`.

### Events Recorded (ring buffer, last 500)

| Event type | Trigger | Data captured |
|---|---|---|
| `connect` | New physical TCP connection to Postgres | `ts`, pool snapshot |
| `remove` | Physical connection closed and removed | `ts`, pool snapshot |
| `query` | Any `pool.query()` call resolves | `ts`, duration ms, SQL prefix (120 chars), caller stack frame, pool snapshot |
| `slow` | Any `pool.query()` taking ≥ 5,000 ms | Same as query + `SLOW_QUERY` warning to Railway logs |
| `error` | `pool.on('error')` fires (idle client error) | `ts`, error message, pool snapshot |
| `acquire` | 60-second sweep — logged if pool grew, waiting > 0, or idle = 0 | `ts`, detail string, pool snapshot |

### Pool snapshot fields (on every event)
```typescript
{
  total: pool.totalCount,   // physical connections open
  idle: pool.idleCount,     // connections available for a new query
  waiting: pool.waitingCount // requests queued waiting for a connection
}
```

### Access Endpoints

```
GET /api/pool-audit
  Header: x-cron-secret: <CRON_SECRET>
  Returns: last 200 events (adjustable with ?limit=N)

GET /api/pool-audit?summary=true
  Header: x-cron-secret: <CRON_SECRET>
  Returns: {
    counts: { connect: N, remove: N, query: N, slow: N, error: N, acquire: N },
    peakTotal: N,       -- highest totalCount seen in ring window
    peakWaiting: N,     -- highest waitingCount seen in ring window
    slowQueriesInWindow: [ last 10 slow events ],
    ringSize: N,
    ringCapacity: 500
  }
```

### Limitations
- `pool.connect()` checkouts are NOT individually timed by instrumentation (those 5 sites log explicitly).
- The instrumentation wraps `pool.query()` only — not `pool.connect()` / `client.query()` on checked-out clients.
- The ring buffer is process-scoped (in-memory). It is lost on Railway restart.
- Slow query threshold is `SLOW_QUERY_MS = 5,000` — normal queries run in < 200ms. Any value near 5s in production logs indicates a problem.

---

## 14. Crash Instrumentation

### Architecture (deployed at commit `3eb86421`, OTA-deliverable)

```
Mobile App Boot
      │
      ▼
installCrashLogger()  [called at module level in _layout.tsx, before any component renders]
      │
      ├── Sets global ErrorUtils handler (JS fatal errors)
      │     Captures: error.message, error.stack (full, not truncated), isFatal
      │     Stores to AsyncStorage('@__crash_report__')
      │     POSTs to /api/crash-reports (with 8s timeout, non-blocking)
      │
      ├── Sets unhandledRejection handler via Hermes API
      │     Same capture and storage as fatal errors
      │     type: "js_unhandled_rejection"
      │
      └── Wraps global fetch() interceptor
            Records last 10 API requests in ring buffer:
            { url, method, status, durationMs, error }

CrashLoggerSetup component (mounted after providers)
      │
      ├── Pathname watch → addNavBreadcrumb(pathname)
      │     Ring buffer: last 20 route changes with ISO timestamps
      │
      ├── AppState listener → setAppStateBreadcrumb(nextState)
      │     Records: "active" | "background" | "inactive"
      │
      └── DeviceEventEmitter("memoryWarning") → addMemoryWarningBreadcrumb()
            iOS low-memory signal (fires before OS force-kill)
```

### Crash Report Payload (sent to /api/crash-reports)

```typescript
interface CrashReport {
  ts: string;          // ISO timestamp of crash
  type: "js_fatal" | "js_unhandled_rejection" | "js_manual";
  error: {
    message: string;
    stack: string;     // full stack trace, no length truncation
    name: string;
  };
  context: {
    currentScreen: string;           // last route in nav breadcrumb ring
    appState: AppStateStatus;        // "active" | "background" | "inactive"
    breadcrumbs: Breadcrumb[];       // last 20 navigation + appState + memory events
    lastApiRequests: ApiLogEntry[];  // last 10 fetch() calls with status/duration
    mapState: { ... };               // permission status, loading flag, last coords
    platform: string;
    osVersion: string;
    version: string;                 // app version (1.1.5)
    buildNumber: string;             // "98"
    commitSha: string;               // EXPO_PUBLIC_COMMIT_SHA if set
    memoryWarningCount: number;
  };
  sent: boolean;       // true if POST to /api/crash-reports succeeded
}
```

### Server Endpoint (`/api/crash-reports`)

```
POST /api/crash-reports  — no auth required (mobile app may not be authenticated at crash time)
  Rate limit: 10 requests per 5 minutes per IP
  Action: validates payload, logs at ERROR level to Railway (MOBILE_CRASH_REPORT event),
          stores in 50-report in-memory ring buffer

GET /api/crash-reports/recent  — requires x-cron-secret header
  Returns: last 50 crash reports received since last Railway restart
```

### What Crash Instrumentation Does NOT Capture

| Signal | Captured? | Why |
|---|---|---|
| Native iOS process signal (SIGSEGV, SIGABRT) | ❌ No | JS thread is dead before ErrorUtils fires |
| OOM termination by iOS | Partial — memory warning breadcrumb fires before kill, but crash report may not send | Memory warning is captured; report relies on AsyncStorage surviving the kill |
| MapKit / RCTRootView native crash | ❌ No | Native code, JS not involved |
| React Native bridge crash (RCT_FATAL) | Partial — depends on whether JS thread survives long enough | |
| React render error caught by ErrorBoundary | ❌ No (ErrorBoundary does not call crashLogger) | [KNOWN GAP — should call addManualCrash in ErrorBoundary.componentDidCatch] |

### In-App Debug Screen
Route: `/debug/crash-log`  
Reads `AsyncStorage('@__crash_report__')` and renders: full stack trace, all breadcrumbs (categorized), last API requests with status/duration, device metadata, Share button (exports JSON), Clear button.  
This screen is accessible immediately after a crash without requiring TestFlight, Xcode, or a Mac.

---

## 15. Remaining Assumptions

These are believed true but have not been verified by direct evidence:

1. **The crash in Build 97/98 is a JavaScript crash, not a native signal.**  
   Basis: The app has no custom native modules. All native dependencies (expo-location, expo-apple-authentication, react-native-maps) are from stable Expo SDK 54 packages.  
   Risk: Wrong. If it is a native crash (e.g., Google Maps iOS SDK signal), the JS crash logger provides zero diagnostic value and a full Sentry integration with native crash capture is required for investigation.

2. **Railway Postgres connection ceiling is ≥ 22 (POOL_MAX + StripeSync).**  
   Basis: Prior deployments with max=8 (app) + max=10 per StripeSync instance exhausted the ceiling, implying the ceiling is somewhere between 10 and 30. After reducing StripeSync to max=2 and increasing app to max=20, no further exhaustion has been observed.  
   Risk: The ceiling may be lower than 22, and two overlapping deployment processes (old + new during redeploy) could briefly exceed it.

3. **expo-updates OTA will deliver the crash logger to all Build 98 users.**  
   Basis: `channel: "production"` is set in `eas.json`. OTA updates apply to all installs of the same binary.  
   Risk: Users who have killed the app and not reopened it will not receive the OTA until next launch. The crash logger is not active on their device until the update applies.

4. **The memoryWarning DeviceEventEmitter approach works in React Native 0.76+.**  
   Basis: React Native documentation and community evidence. Not tested on a physical device in this codebase.  
   Risk: DeviceEventEmitter may not emit `memoryWarning` in all RN versions; the try/catch prevents failure but the OOM signal would be silently lost.

5. **All 5 explicit pool.connect() sites use finally { client.release() }.**  
   Basis: grep confirmed (`pool.connect()` in 5 files, all reviewed in this session). No bare `pool.connect()` without release was found.  
   Risk: New routes added by future contributors may introduce bare pool.connect() without release. No static analysis or CI check enforces this pattern.

6. **`withDbRetry` is applied to all high-risk write paths.**  
   Basis: Confirmed on email signup (auth.ts:542). Other write paths (business create, post create, etc.) use Drizzle ORM directly without explicit retry wrappers.  
   Risk: A transient connection error on a non-retried write path returns a 500 to the user. The operation is not retried. Under Railway network instability, error rates could spike temporarily.

---

## 16. Known Technical Debt

| Item | Location | Risk Level | Notes |
|---|---|---|---|
| renewalThrottle Map never pruned | `authMiddleware.ts:19` | Low | Grows to O(unique sessions per deployment window). Benign at current scale. |
| ErrorBoundary does not call crashLogger | `_layout.tsx` ErrorBoundary | Medium | React render errors caught by ErrorBoundary are not captured in crash instrumentation. |
| GPS permission denial has no user-facing message | `BusinessMapView.tsx`, `FullMapView.tsx` | Low | User sees US-wide map with no explanation of why "near me" doesn't work. |
| Apple credential state check has no timeout | `auth.tsx:336` | Very low | `getCredentialStateAsync()` is unbounded in time. Could hang on foreground resume if Apple services are slow. |
| React Query cache has no global size limit | App-wide | Low | Business list (~102 items) and other query results accumulate in memory. No LRU or max-entries bound set. |
| build97Monitor disabled but code remains | `index.ts:99–105` | Low | Dead code. Should be removed or replaced with external monitoring service. |
| Sessions table has no automated cleanup job | `lib/auth.ts` | Low | Expired sessions accumulate in the DB. `deleteSession()` is called on access but not proactively. |
| Statement timeout fires Postgres-side with no client notification | Pool config | Low | A query cancelled by `statement_timeout=10s` returns a PG error to node-postgres, which propagates as an exception. The caller's catch block handles it. Not a crash. |
| Crash logger not wired into ErrorBoundary.componentDidCatch | `_layout.tsx` | Medium | See tech debt item above. |
| No Sentry or native crash capture | Entire app | High | Only JS-layer crashes are captured. Native iOS crashes, OOM kills, and bridge faults produce no evidence. Required for confirming crash-free before Apple submission. |

---

## 17. Remaining Risks

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation Status |
|---|---|---|---|
| Unidentified native iOS crash recurs in next review cycle | High (until root cause confirmed) | Critical (rejection) | ❌ OPEN — TestFlight logs required |
| Pool exhaustion during Railway redeploy race | Low | Severe (5–30s complete outage) | ✅ Mitigated (graceful shutdown, POOL_MAX=20) |
| OOM termination on low-memory iPhone | Unknown | Severe (app kill) | Partial — memory warning captured; native crash not |
| Apple Sign-In fails for user on old binary without nonce | Medium (existing users who upgrade) | Medium (auth failure, user calls support) | ✅ Handled (legacy path allows sign-in for existing users) |
| Stripe webhook burst creates temporary pool pressure | Low | Low (pool-pressure guard returns 503 to webhook, Stripe retries) | ✅ Mitigated (StripeSync singleton + max=2 + pressure guard) |
| React Query cache memory growth on long sessions | Very Low | Low (OS kills app after prolonged background) | ❌ OPEN — no cache size limit |
| SessionExpiryWatcher race with AuthGate redirect | Low | Low (double redirect to /login, recoverable) | Not analyzed in this session |
| TestFlight crash logs are unavailable or unreadable | Unknown | Critical (crash type remains unclassified) | Founder must pull from App Store Connect |
| New contributors introduce bare pool.connect() without release | Low (development risk) | Severe (slow leak) | ❌ No CI/static analysis guard |
| OTA update not received before next TestFlight run | Medium | Medium (crash logger not active; new crash produces no evidence) | Mitigation: run `eas update` before TestFlight testing |

---

## 18. Required Production Tests

The following tests must be completed and documented before Apple re-submission. All tests must be performed on a **physical iPhone** (not simulator) running the **production Railway URL** (`https://www.mappingwithmelanin.com`), signed into a fresh Apple ID that has not previously signed into the app.

### Gate 1 — Crash Root Cause Identified and Fixed
- [ ] Pull TestFlight crash logs from App Store Connect → TestFlight → Crashes → Build 98
- [ ] OR: Obtain Xcode Organizer crash log from physical device
- [ ] Identify crash type (JS exception / native signal / OOM / navigation redirect)
- [ ] Implement targeted fix
- [ ] Two-hour continuous background/foreground stability test on physical device with no crash

**No EAS build submission until this gate is cleared.**

---

### Gate 2 — Pool Stability (65-minute test)
- [ ] Deploy to Railway (`railway up` or redeploy via Railway dashboard)
- [ ] Wait 5 minutes for startup migrations and Stripe init to complete
- [ ] Call `GET /api/pool-audit?summary=true` with `x-cron-secret` header
- [ ] Record: `peakTotal`, `peakWaiting`, `counts.slow`, `counts.error`
- [ ] Wait 65 minutes (covers one 60-second instrumentation sweep and one 5-minute health monitor cycle)
- [ ] Call `GET /api/pool-audit?summary=true` again
- [ ] **Pass criteria:** `peakWaiting` remains 0; `counts.error` = 0; `counts.slow` = 0; `peakTotal` ≤ 5 (normal steady-state)

---

### Gate 3 — Authentication (50 + 50 tests)
- [ ] 50 Apple Sign-In attempts on physical iPhone (production URL, signed into fresh Apple ID)
  - Expected: 100% success rate. Token stored in SecureStore. User profile loads.
- [ ] 50 Email login attempts (use demo account credentials)
  - Expected: 100% success rate. Token stored. Profile loads.
- [ ] 1 logout → Apple Sign-In → confirm credential state check fires on app resume
- [ ] 1 "wrong password" → confirm lockout message after 3 failures, 15-minute lockout message appears
- [ ] 1 account deletion flow → confirm all sessions revoked → confirm re-login required

---

### Gate 4 — Map / Location
- [ ] Fresh install. Grant location permission. Confirm map animates to user location within 8 seconds.
- [ ] Fresh install. Deny location permission. Confirm map loads at US-wide DEFAULT_REGION (no hang, no error, no crash).
- [ ] Disable device GPS entirely. Open map. Confirm 8-second timeout fires, map loads at DEFAULT_REGION.
- [ ] Tap Recenter button. Confirm same 8-second timeout behavior with GPS off.

---

### Gate 5 — Background / Foreground (10 cycles)
- [ ] Open app → use for 30 seconds → home button → wait 30 seconds → return
  - Confirm: app is on correct screen, no crash, auth state preserved
- [ ] Repeat 10 times over 30 minutes (manual)
- [ ] During cycles: rotate to background while a network request is in-flight
- [ ] **Pass criteria:** Zero crashes. Auth state preserved across all 10 cycles.

---

### Gate 6 — Crash Instrumentation Verification
- [ ] Push OTA update: `cd artifacts/mobile && eas update --branch production --message "P0 crash instrumentation"`
- [ ] Confirm update received on device (app shows new build content)
- [ ] Deliberately trigger a JS exception (can be done via a test route that calls `throw new Error("test crash")`)
- [ ] Kill app immediately (do not let it restart automatically)
- [ ] Reopen app → navigate to `/debug/crash-log`
- [ ] Confirm: stack trace visible, breadcrumbs present, screen shows correct crash metadata
- [ ] Check Railway logs for `MOBILE_CRASH_REPORT` event
- [ ] **Pass criteria:** Both AsyncStorage recovery AND Railway log entry present.

---

### Gate 7 — Apple Guideline 5.1.1(v) Demo Account
- [ ] Create demo account:
  - Email: reviewdemo@mappingwithmelanin.com
  - Password: (documented in Apple review notes)
- [ ] Populate demo account with: profile photo, 3 businesses saved, 1 community post, 1 event RSVP, 1 KinfolkAI conversation, 1 safety report
- [ ] Confirm demo account login from fresh install works
- [ ] Confirm all 7 populated surfaces are visible without "no data" empty states

---

### Gate 8 — iPad Test
- [ ] Fresh install on iPad (any model, iOS 17+)
- [ ] Apple Sign-In: confirm `ASWebAuthenticationSession` callback is delivered correctly
  - Note: on iPadOS, `openAuthSessionAsync` may return `{ type: "dismiss" }` even after successful sign-in (OS delivers the custom scheme URI separately). `fetchUser()` is called regardless of result type — this handles it.
- [ ] Navigate all 5 tabs
- [ ] Confirm map renders correctly at full iPad viewport
- [ ] Confirm no layout overflow or clipped elements on 12.9" screen

---

### Gate 9 — Railway Log 24-Hour Audit
- [ ] After deployment, monitor Railway logs for 24 hours
- [ ] Check for: `POOL_GROWTH_DETECTED`, `SLOW_QUERY`, `pool-pressure-guard: 503`, `MOBILE_CRASH_REPORT`, `idle client error`
- [ ] **Pass criteria:** None of the above appear. Normal log volume: `HEALTH_MONITOR_CHECK` events every 5 minutes, `SESSION_RENEWED` events on user activity.

---

### Gate 10 — Account Deletion (Apple 5.1.1(v) Compliance)
- [ ] Log in with demo account
- [ ] Profile → Settings → Delete Account
- [ ] Confirm: user is signed out immediately, all local keys cleared, server sessions revoked
- [ ] Confirm: cannot log back in with deleted account credentials (401 or "account not found")
- [ ] Confirm: Apple refresh token revocation triggered (check Railway log for `APPLE_TOKEN_REVOKED` event if Apple secrets are configured)

---

### Gate 11 — Pre-Submission Build Gate (Final)
Before running `eas build --platform ios --profile production`:

- [ ] Gates 1–10 all passed with documented evidence
- [ ] `cd artifacts/mobile && npx tsc --noEmit` → zero errors on crash-logger-related files
- [ ] `cd artifacts/api-server && npx tsc --noEmit` → zero errors
- [ ] `git log --oneline -5` confirms clean commit history on `release/apple-remediation`
- [ ] `app.json` buildNumber incremented (current: 98 → next: 99)
- [ ] `app.json` versionCode does not need changing (iOS only, version stays 1.1.5)
- [ ] `eas.json` production profile `channel: "production"` confirmed
- [ ] EAS Dashboard env vars confirmed: `EXPO_PUBLIC_API_URL` or `EXPO_PUBLIC_DOMAIN` points to production Railway URL
- [ ] Apple App Store Connect: demo account credentials entered in "Notes to Apple Reviewer"
- [ ] Apple App Store Connect: account deletion location documented in review notes
- [ ] Apple App Store Connect: Guideline 5.1.1(v) response included in review notes

---

## DOSSIER SUMMARY

| Section | Status |
|---|---|
| Historical crashes documented | ✅ 6 incidents, all with root causes |
| Fixes implemented | ✅ 16 fixes, all with code citations |
| Residual crash vectors | ⚠️ 10 identified; Vector 1 (native crash type) is P0 OPEN |
| Pool architecture | ✅ Fully documented with config values |
| DB acquisition paths | ✅ All 5 pool.connect() sites verified with finally guards |
| Email auth flow | ✅ Fully documented |
| Apple Sign-In sequence | ✅ Fully documented including nonce/JWKS/authCode |
| Session lifecycle | ✅ 7-day rolling, DB-backed, 4-stage termination |
| Map/location lifecycle | ✅ Documented including 8s timeout and DEFAULT_REGION |
| Navigation lifecycle | ✅ Documented including auth gates and exempt paths |
| Background/foreground lifecycle | ✅ AppState handlers, Apple credential check |
| Memory usage | ⚠️ Two known gaps (renewalThrottle, React Query cache) |
| Pool instrumentation | ✅ Active in production; ring buffer + slow query detection |
| Crash instrumentation | ✅ Active (OTA); captures JS crashes, breadcrumbs, API log |
| Remaining assumptions | ✅ 6 identified with risk assessments |
| Known technical debt | ✅ 10 items catalogued with risk levels |
| Remaining risks | ✅ Risk matrix with likelihood/impact/status |
| Production test plan | ✅ 11 gates with explicit pass criteria |

**CRITICAL OPEN ITEM:** The root cause of the crash that triggered the Apple rejection has not been identified from code review alone. TestFlight crash logs for Build 98 must be obtained and analyzed before any new build is submitted to Apple.
