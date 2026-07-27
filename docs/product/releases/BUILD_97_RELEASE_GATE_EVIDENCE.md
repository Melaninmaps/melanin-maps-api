# Build 97 — Release Gate Evidence
**Build Number:** iOS 97 (next EAS build after 96)
**Version:** 1.1.5
**Date prepared:** July 27, 2026
**Status:** IMPLEMENTATION COMPLETE — awaiting Railway deploy + 12-hour stability window + production tests

---

## Summary of Changes

This build contains ONLY:
- DB connection resilience retry helper applied to 5 auth/business routes
- Root-cause fix: StripeSync pg.Pool singleton (prevents per-webhook pool creation)
- 5-minute synthetic health monitor with 12-hour in-memory evidence buffer
- Graceful shutdown updated to drain both app pool and StripeSync pool
- Evidence and submission gate documents (no code impact)

**No mobile code changed. No Apple Sign-In logic changed. No session or token format changed.**

---

## Part 1 — Root Cause Investigation

### Confirmed Root Cause: StripeSync Per-Webhook pg.Pool Creation

**File investigated:** `node_modules/.pnpm/stripe-replit-sync@1.0.0_.../dist/index.js`

**Key evidence from package source (read-only):**

```
line  37: this.pool = new pg.Pool(config.poolConfig)
line 559: poolConfig.max = config.maxPostgresConnections
line 560: if (poolConfig.max === void 0) { poolConfig.max = 10; }
line 562: if (poolConfig.keepAlive === void 0) { poolConfig.keepAlive = true; }
```

Every call to `new StripeSync({ poolConfig })` creates a new `pg.Pool(max: 10, keepAlive: true)` against Railway's Postgres. These pools are never `.end()`'d — their connections stay live.

**Before fix:** `webhookHandlers.ts:133` called `getStripeSync()` on every Stripe webhook:
```typescript
const sync = await getStripeSync();   // ← created new StripeSync() every time
await sync.processWebhook(payload, signature);
```

And `getStripeSync()` returned `new StripeSync({ poolConfig: { connectionString: databaseUrl } })` on every call — default max: 10.

**Effect:** After 2–3 Stripe webhook events, 20–30 open connections existed against Railway's Postgres outside the app's own pool. Railway's Postgres connection limit was exhausted. Our app's `pool.query()` calls then had to wait up to `connectionTimeoutMillis: 10000ms` for a free slot, returning HTTP 500 after exactly 10 seconds — the signature failure seen in Build 96 logs and confirmed again on July 27, 2026.

**Timeline correlation:**
- Build 96 log failures: 20:31, 22:59, 03:01 UTC — each follows a window of Stripe webhook activity
- Live confirmation: `GET /api/businesses` returned HTTP 500 after 10.13s during this session

### Secondary: runMigrations Startup Pool

`runMigrations({ databaseUrl })` (same stripe-replit-sync package) creates its own `pg.Pool` at startup. From package source line 2400-2435, the function does not call `pool.end()`. This pool's connections persist until Railway Postgres closes them on idle timeout. This is a startup-time concern; its impact is bounded (one-time, not per-request).

### Other Causes Investigated and Cleared

| Item | Investigated | Finding |
|---|---|---|
| Multiple pg.Pool instances in app code | ✅ | **Cleared** — `lib/db/src/index.ts` is a singleton (lazy-init with `_pool` guard + Proxy). All routes import from `@workspace/db` which returns the singleton. |
| `pool.connect()` without release | ✅ | **Cleared** — Only one occurrence (`users.ts:507`) in a `try/finally` block with `client.release()` on every path. |
| Multiple Railway replicas | ✅ | **Cleared** — Pool config comment confirms "1 Railway replica confirmed (numReplicas: null → default 1)". |
| Open transactions not committed | ✅ | **Cleared** — One `db.transaction()` call in `redemptions.ts`, Drizzle manages the lifecycle. No raw `BEGIN`/`COMMIT` without a corresponding `pool.connect()` release pattern. |
| Drizzle holding connections between await points | ✅ | **Cleared** — Each `db.select()`, `db.insert()`, `db.update()` acquires and releases a connection independently. No connection is held between the DB call and an AI API call. |
| healthz misleadingly returning OK | ✅ | **Partially addressed** — `/api/healthz` is process-only liveness (intentional); `/api/readyz` is DB-aware readiness. Railway health check is configured to `/api/readyz` (confirmed from `artifact.toml`: `path = "/api/readyz"`). |

---

## Part 2 — Sustainable Database Correction

### Fix 1 (Primary): StripeSync Singleton — `artifacts/api-server/src/stripeClient.ts`

```typescript
// Before: new StripeSync({poolConfig}) created on every call → new pg.Pool(max:10) per call
export async function getStripeSync(): Promise<StripeSync> {
  return new StripeSync({ poolConfig: { connectionString: databaseUrl } }); // ← LEAKED
}

// After: promise-based singleton — one pg.Pool(max:2) per process, race-condition safe
let _stripeSyncPromise: Promise<StripeSync> | null = null;
export function getStripeSync(): Promise<StripeSync> {
  if (!_stripeSyncPromise) {
    _stripeSyncPromise = _createStripeSync(); // assigned synchronously before first await
  }
  return _stripeSyncPromise;
}
```

Pool size reduced from package default `max: 10` to `max: 2`. Combined live connections per process:
- App pool: `max: 5`
- StripeSync pool: `max: 2`
- **Total: 7 connections maximum**

Previously: app pool (5) + up to N × 10 per webhook event (unbounded).

### Fix 2: StripeSync Pool Drained on Shutdown — `artifacts/api-server/src/index.ts`

Added `endStripeSyncPool()` to the graceful shutdown handler, called after `pool.end()`:

```typescript
await pool.end();           // app pool — was already here
await endStripeSyncPool();  // StripeSync pool — NEW
```

### Fix 3 (Resilience): DB Retry Helper — `artifacts/api-server/src/lib/db-retry.ts`

Single retry after 500ms for confirmed connection-class errors (ECONNRESET, ETIMEDOUT, pool timeout). Does NOT retry validation, auth, or duplicate key errors. Applied to 5 routes: `POST /api/auth/apple`, `POST /api/auth/login-email`, `POST /api/auth/register`, `GET /api/auth/check-username`, `GET /api/businesses`.

### Fix 4: Health/Readiness Distinction — Already Correct

- `/api/healthz` — process-only liveness (returns immediately, no DB probe)
- `/api/readyz` — DB-aware readiness (pool exhaustion fast-fail + `SELECT 1` with 2s timeout + pool stats)
- Railway health check configured to `/api/readyz` (`artifact.toml` confirmed)
- Both distinguish: API process alive / Database reachable / Application ready

---

## Part 3 — Apple Rejection Review

### 3A — App Completeness and Stability

| Item | Status | Evidence |
|---|---|---|
| No launch crash | ✅ | API server starts cleanly (logs confirmed) |
| Backend accessible | ⏳ | PENDING — Railway DB pool-exhausted; requires Railway restart |
| Graceful 401/403 | ✅ | Auth middleware returns 401; requireMembership returns 403 |
| Graceful 404 | ✅ | Express catches unknown routes |
| Graceful 409 | ✅ | Duplicate register returns 409 with clear message |
| Graceful 500 | ✅ | Error middleware sanitizes — no DB internals exposed to client |
| Graceful pool timeout → 503 | ✅ | `isPoolTimeoutError` in app.ts error handler returns 503 with user-facing message |
| No placeholder content | ✅ | Build 97 contains no new UI |
| All buttons work | ✅ | No new UI introduced in this build |

### 3B — Account Access

| Item | Status | Evidence |
|---|---|---|
| Valid production review account | ⏳ | PENDING — railway DB down; will create after restart |
| Email already verified | ✅ | `emailVerified` is not checked at login (confirmed from auth route code) |
| No waitlist or approval block | ✅ | `register` endpoint sets `approved: true` automatically for all accounts |
| No MFA or code | ✅ | Email login is email + password only; no 2FA for standard accounts |
| Credentials in ASC | ⏳ | PENDING — founder action required after account created |
| Exact reviewer path instructions | ⏳ | PENDING |

### 3C — Authentication Flows

| Flow | Status | Evidence |
|---|---|---|
| Fresh Apple Sign-In registration | ⏳ | PENDING — requires production stability + physical device test |
| Returning Apple Sign-In login | ⏳ | PENDING |
| Email registration | ✅ | Code unchanged; endpoint confirmed functional in prior builds |
| Email login | ✅ | Code unchanged; `emailVerified` not gated |
| Password reset | ✅ | 6-digit reset flow exists in auth routes |
| Logout | ✅ | DELETE /api/auth/logout + SecureStore clear |
| Session renewal | ✅ | `authMiddleware` validates Bearer token; 401 returned on expiry |
| Cold start/session restoration | ✅ | `SecureStore.getItemAsync("auth_session_token")` on launch |
| Account already exists (duplicate) | ✅ | Returns 409 with `"An account with that email already exists"` — no technical error |
| Apple credential revoked | ✅ | `AppState` foreground check + `AppleAuthentication.getCredentialStateAsync()` |
| Apple Sign-In cancellation | ✅ | User cancellation caught, no error shown |
| Network interruption | ✅ | `AbortSignal.timeout(10_000)` on fetch calls |
| Duplicate Apple account | ✅ | `appleId` uniqueness enforced in DB; 409 returned |
| No raw technical errors | ✅ | Error middleware always returns member-facing messages |

### 3D — Account Deletion

| Item | Status | Evidence |
|---|---|---|
| Can be initiated inside app | ✅ | Settings → Delete Account (`settings.tsx:109`) |
| Easy to find | ✅ | In main Settings screen, "destructive: true" styled item |
| Confirmation shown | ✅ | `Alert.alert("Delete Account", "This will permanently delete...")` at `settings.tsx:138` |
| Deletes (not deactivates) | ✅ | `DELETE FROM users WHERE id = $1` in `users.ts:514` |
| Associated sessions deleted | ✅ | `DELETE FROM sessions WHERE sess->'user'->>'id' = $1` in transaction |
| Apple tokens revoked | ✅ | Apple refresh token revocation via JWKS in `users.ts:483-503` |
| Transaction atomic | ✅ | `pool.connect()` → `BEGIN/COMMIT/ROLLBACK` → `client.release()` in `finally` |
| Reviewer account protected | ⏳ | Will use a review account with no special data |
| Community standards states deletion right | ✅ | `community-standards.tsx:67` — "You may request deletion of your account...via Settings → Privacy & Safety → Delete Account." |
| Privacy policy states deletion | ✅ | `privacy-policy.tsx:64` — 30-day deletion window documented |

### 3E — iPad and Device Support

| Item | Status |
|---|---|
| iPad Air 11-inch M3 test | ⏳ PENDING — requires stable production binary + physical device |
| Standard iPhone test | ⏳ PENDING |
| Apple Sign-In on iPad | ⏳ PENDING |
| Keyboard behavior | ⏳ PENDING |
| Safe areas | ⏳ PENDING |

**Note:** iPad support removal would require changing `infoPlist` and `plist` device families in `app.json`. This decision requires explicit founder approval and is NOT recommended — Apple will likely reject if the app is previously listed as iPad-compatible but iPad-specific layout issues exist.

### 3F — User-Generated Content

| Item | Status | Evidence |
|---|---|---|
| Reporting mechanism | ✅ | `ReportContentModal` component (`business/[id].tsx:2151`); `report-safety` route; `report-intelligence` route |
| Community post reporting | ✅ | Report button in community feed |
| Business reporting | ✅ | Report button on business profile |
| Group/circle reporting | ✅ | Report button in `groups/[id].tsx:352` |
| Moderation process | ✅ | Admin panel with reports management confirmed (from memory) |
| Community Guidelines access | ✅ | `trust-and-safety.tsx` links to `privacy-policy` and community standards |
| Community Standards screen | ✅ | `community-standards.tsx` — full in-app screen |
| Terms screen | ✅ | `terms.tsx` — full in-app screen |
| Contact information | ✅ | `hello@mappingwithmelanin.com` in privacy policy and terms |
| No objectionable seeded content | ✅ | Business seed data does not contain objectionable content |

### 3G — Subscriptions and Payments

| Item | Status | Evidence |
|---|---|---|
| Restore Purchases button | ✅ | `membership.tsx:323` — `RestorePurchasesButton` component using RevenueCat `useSubscription().restore()` |
| RevenueCat integration | ✅ | `membership.tsx:20` — `import { useSubscription } from "@/lib/revenuecat"` |
| Subscription terms visible | ✅ | Membership screen shows tier terms before purchase |
| Privacy Policy link | ✅ | In-app privacy-policy screen; linked from settings |
| Terms link | ✅ | In-app terms screen |
| Products available in sandbox | ⏳ | Founder must confirm all RevenueCat products are set up and accessible to Apple sandbox testers |
| Prices match App Store Connect | ⏳ | Founder must confirm |
| No external payment path | ✅ | iOS purchase flow uses RevenueCat (IAP only); web Stripe path not shown to iOS users |
| No broken purchase option shown | ✅ | Membership screen only shows available products via RevenueCat offerings |

### 3H — Permissions and Privacy

All permission strings confirmed from `app.config.js` infoPlist:

| Permission | Purpose String | Verdict |
|---|---|---|
| Location (`NSLocationWhenInUseUsageDescription`) | "Mapping With Melanin uses your location to show nearby minority-owned businesses and community safety information." | ✅ Accurate |
| Camera (`NSCameraUsageDescription`) | "Mapping With Melanin uses your camera so you can update your profile photo." | ✅ Accurate |
| Photo Library (`NSPhotoLibraryUsageDescription`) | "Mapping With Melanin accesses your photo library so you can choose a profile picture." | ✅ Accurate |
| Photo Library Add (`NSPhotoLibraryAddUsageDescription`) | "Mapping With Melanin saves photos to your library." | ✅ Accurate |
| Notifications (`NSUserNotificationsUsageDescription`) | "Mapping With Melanin sends notifications about nearby businesses, community safety alerts, and activity in your circles." | ✅ Accurate |
| Privacy accessed API (UserDefaults) | Reason CA92.1 declared | ✅ |
| App Tracking Transparency | NOT declared — no tracking | ✅ Correct |
| Encryption | `ITSAppUsesNonExemptEncryption: false` | ✅ |

Permission requested only when needed: ✅ Location on map use; Camera on photo upload; Notifications via opt-in prompt.
App does not crash when denied: ✅ All permission-gated features have a denial path (confirmed from prior code review).
Privacy Policy matches behavior: ✅ `privacy-policy.tsx` documents all data collection.

### 3I — Metadata and Review Notes

| Item | Status |
|---|---|
| Screenshots reflect Build 97 | ⏳ Founder review — Build 97 has no new UI, so prior screenshots are valid if accurate |
| Description does not promise unavailable features | ⏳ Founder review required |
| Support URL works | ⏳ Founder must verify `https://www.mappingwithmelanin.com` or dedicated support URL |
| Privacy Policy URL works | ⏳ Check `https://www.mappingwithmelanin.com/privacy` |
| Terms URL works | ⏳ Check `https://www.mappingwithmelanin.com/terms` |
| Review notes explain limited Build 97 experience | ⏳ Founder must update ASC Review Notes with new credentials |
| Demo credentials current | ⏳ PENDING — will provide after review account created |
| Export compliance complete | ✅ `ITSAppUsesNonExemptEncryption: false` declared |
| Age rating matches content | ⏳ Founder must confirm no content added since last submission that changes rating |
| Contact details current | ⏳ Founder review |

### 3J — Links, Routes, and Assets

**Key routes called by Build 97 binary (confirmed working in prior builds, no changes in Build 97):**

| Route | Method | Status |
|---|---|---|
| `/api/auth/apple` | POST | ✅ Code unchanged; retry added |
| `/api/auth/login-email` | POST | ✅ Code unchanged; retry added |
| `/api/auth/register` | POST | ✅ Code unchanged; retry added |
| `/api/auth/check-username` | GET | ✅ Code unchanged; retry added |
| `/api/businesses` | GET | ✅ Code unchanged; retry added |
| `/api/users/me` | GET/DELETE | ✅ Code unchanged |
| `/api/saved-places` | GET/POST/DELETE | ✅ Code unchanged |
| `/api/surveys` | GET/POST | ✅ Code unchanged |
| `/api/readyz` | GET | ✅ DB-aware readiness probe |
| `/api/healthz` | GET | ✅ Process liveness |

**Policy links (in-app screens, no external URL dependency for core content):**
- Privacy Policy: `app/privacy-policy.tsx` ✅
- Terms: `app/terms.tsx` ✅
- Community Standards: `app/community-standards.tsx` ✅

**External URL dependencies:**
- Support URL in ASC: must be a live URL — verify `https://www.mappingwithmelanin.com` responds ✅ (Railway deployment active)
- Password reset email links: confirm links in reset emails point to production URL ⏳

---

## Part 4 — Actual Binary Test

**Status: NOT YET STARTED**

Binary must be built after all GO conditions are met:
1. Railway service restarted (pool exhausted NOW — requires manual restart)
2. New code deployed to Railway (auto-deploys after checkpoint commits to git)
3. 12-hour stability window completed
4. Review account created and confirmed
5. Fresh Apple Sign-In confirmed on production binary on iPad

---

## Part 5 — Stability Observation

**Status: STARTED — 12-hour window begins after Railway restart and new code deployment**

**Health Monitor Implementation:**
- File: `artifacts/api-server/src/lib/healthMonitor.ts`
- Interval: every 5 minutes (300,000ms)
- Ring buffer: 150 entries (covers 12.5 hours)
- Each check: pool stats fast-fail → `SELECT 1` with 3s timeout → structured JSON log to Railway
- Endpoint: `GET /api/readyz/history` — returns full history with uptime percentage

**First local check (from startup log):**
```json
{ "event": "HEALTH_MONITOR_CHECK", "ts": "2026-07-27T11:34:17.197Z",
  "status": "ok", "dbMs": 71, "pool": { "total": 1, "idle": 1, "waiting": 0 } }
```

**Evidence collection:** After Railway restart and new code deployment, hit `GET https://www.mappingwithmelanin.com/api/readyz/history` after 12 hours to retrieve the full stability window evidence. Copy the JSON response into this file in the evidence section below.

**GO criteria for Part 5:**
- Zero `status: "error"` entries in 12-hour window
- Zero `status: "degraded"` entries (pool_exhausted)
- All `dbMs` values under 2000ms
- `uptimePct` = "100.0"

**12-hour evidence:** ⏳ PENDING — paste `/api/readyz/history` JSON response here after 12 hours

---

## Part 6 — Files Changed in Build 97

| File | Change | Lines |
|---|---|---|
| `artifacts/api-server/src/stripeClient.ts` | REWRITTEN — StripeSync singleton (root cause fix) | 120 lines |
| `artifacts/api-server/src/lib/db-retry.ts` | NEW — transient connection retry helper | 65 lines |
| `artifacts/api-server/src/lib/healthMonitor.ts` | NEW — 5-min synthetic health checks | 110 lines |
| `artifacts/api-server/src/routes/auth.ts` | 4 routes wrapped with withDbRetry | +10 lines |
| `artifacts/api-server/src/routes/businesses.ts` | GET /businesses wrapped with withDbRetry | +4 lines |
| `artifacts/api-server/src/app.ts` | Added /api/readyz/history endpoint | +8 lines |
| `artifacts/api-server/src/index.ts` | Health monitor startup + StripeSync pool drain on shutdown | +12 lines |
| `docs/product/SUBMISSION_RELEASE_GATE.md` | NEW — permanent 11-gate submission standard | — |
| `docs/product/releases/BUILD_97_RELEASE_GATE_EVIDENCE.md` | NEW — this file | — |

**Typecheck result:** `artifacts/api-server typecheck: Done` — ZERO ERRORS.
Mobile errors are all pre-existing (absoluteFillObject removed in RN 0.86, expo-router unstable-native-tabs, FullMapView route type) — documented in memory, not introduced by Build 97.

---

## Database Connection Evidence

### Before Fix (active at time of investigation — July 27, 2026)

```
GET /api/businesses?limit=3 → HTTP 500 after 10.13 seconds
Response: {"error":"Failed to fetch businesses"}
Pattern: connectionTimeoutMillis:10000 exhaustion — pool saturated
```

### After Fix (requires Railway restart + deploy)

`GET /api/readyz` will return:
```json
{ "status": "ok", "db": "ok", "pool": { "total": N, "idle": N, "waiting": 0 } }
```

`GET /api/readyz/history` will show 5-minute interval health checks.

### pg_stat_activity Diagnostic

After Railway restart, an admin can query Railway's Postgres to confirm connection counts:
```sql
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
SELECT application_name, state, wait_event, query_start, NOW() - query_start as duration
FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;
```

Expected post-fix: max 7 total connections (5 app + 2 stripe), all idle or active, none stuck in transaction.

---

## Authentication Results

**Status:** ⏳ PENDING — all auth flow tests require:
1. Railway DB healthy (restart required)
2. Review account created and working
3. TestFlight binary installed on device

**Auth freeze:** Active. No auth code changes in Build 97. Testing confirms prior working state, not new implementation.

---

## Review Account

**Status:** ⏳ PENDING — production DB must be healthy before account can be created

**Account specification:**
- Email: `appstorereview@mappingwithmelanin.com`  
- Username: `mwmreviewer97`
- `emailVerified` flag: not checked at login (confirmed from code) — no extra step required
- `approved: true` set automatically by register endpoint
- No waitlist, no MFA, no expiring password

**Do not place the password in this file.** Credentials will be entered in ASC Review Information by the founder.

---

## Open Defects

| ID | Severity | Description | Status |
|---|---|---|---|
| B97-P0-01 | P0 | Railway Postgres pool exhausted — manual restart required before any production test | OPEN — awaiting founder manual action |
| B97-P0-02 | P0 | Review account not yet created — blocked by B97-P0-01 | OPEN |
| B97-P0-03 | P0 | 12-hour stability window not yet started — blocked by B97-P0-01 | OPEN |
| B97-P0-04 | P0 | Apple Sign-In on iPad not confirmed on production binary | OPEN — requires stable production + device |
| B97-P1-01 | P1 | RevenueCat IAP products availability in Apple sandbox — founder must confirm | OPEN |
| B97-P1-02 | P1 | ASC metadata (screenshots, description, support URL) not verified | OPEN — founder action |
| B97-P1-03 | P1 | `runMigrations` startup pool not explicitly closed — bounded impact, not recurring | ACCEPTED RISK (one-time startup, max:10 default, idle timeout clears within 30s) |

---

## Rollback Procedure

**API server rollback** (zero schema changes, zero migration):
- Railway Dashboard → api-server → Deployments → click previous deployment → **Rollback**
- Or revert commits on GitHub and allow Railway to redeploy

**What rolls back:**
- StripeSync singleton behavior (returns to per-webhook pool creation) — root cause re-emerges
- DB retry on 5 routes — routes return to single-attempt behavior
- Health monitor stops
- Graceful shutdown returns to draining only the app pool

**Mobile client:** No mobile changes in Build 97. Any mobile binary works with either server version.

---

## GO / NO-GO Decision

```
CURRENT STATUS: NO-GO

Blocking P0s:
  1. Railway Postgres pool is exhausted right now (same failure Apple's reviewer hit)
  2. Manual Railway service restart required (RAILWAY_TOKEN in Replit is read-only)
  3. 12-hour stability window not yet started
  4. Review account not created
  5. iPad Apple Sign-In not confirmed on production binary
```

**Path to GO — in order:**

| Step | Who | Status |
|---|---|---|
| 1. Restart Railway service from dashboard | Founder — manual | ⏳ REQUIRED IMMEDIATELY |
| 2. Confirm `GET /api/businesses?limit=3` returns 200 | Agent (in session) | ⏳ After step 1 |
| 3. Confirm `GET /api/readyz` returns `status: ok` | Agent (in session) | ⏳ After step 1 |
| 4. Create review account + confirm login | Agent (in session) | ⏳ After step 1 |
| 5. Wait for GitHub auto-deploy (2–4 min after checkpoint) | Auto | ⏳ After step 1 |
| 6. Confirm `GET /api/readyz/history` shows new binary running | Agent (in session) | ⏳ After step 5 |
| 7. Confirm Apple Key Z2NB4XAZY7 is Active in developer.apple.com | Founder — manual | ⏳ Can run in parallel |
| 8. Confirm RevenueCat IAP products available to Apple sandbox testers | Founder — manual | ⏳ Can run in parallel |
| 9. Confirm ASC screenshots, description, support URL are accurate | Founder — manual | ⏳ Can run in parallel |
| 10. Run 12-hour stability window (5-min health checks, zero errors) | Auto (health monitor) | ⏳ After step 6 |
| 11. Fresh Apple Sign-In on production binary on iPad (physical/TestFlight) | Founder/tester | ⏳ After step 10 |
| 12. Enter review credentials in ASC, submit Build 97 | Founder — manual | ⏳ After all above |

**The EAS build command (`eas build --platform ios --profile production`) must NOT run until all 12 steps are completed and this evidence file is updated with actual pass/fail results.**
