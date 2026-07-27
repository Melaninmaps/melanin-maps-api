# Build 97 — Release Gate Evidence
**Build Number:** iOS 97 (next build after 96)
**Version:** 1.1.5
**Date:** July 27, 2026
**Prepared by:** Replit Agent
**Status:** IN PROGRESS — awaiting Railway deploy + production stability window

---

## Files Changed — DB Retry Fix Only

| File | Change | Line impact |
|---|---|---|
| `artifacts/api-server/src/lib/db-retry.ts` | NEW — transient DB connection retry helper | 65 lines |
| `artifacts/api-server/src/routes/auth.ts` | Added `withDbRetry` import + wrapped 4 route try-bodies | +10 lines |
| `artifacts/api-server/src/routes/businesses.ts` | Added `withDbRetry` import + wrapped GET /businesses try-body | +4 lines |
| `docs/product/SUBMISSION_RELEASE_GATE.md` | NEW — permanent 11-gate submission standard | New document |
| `docs/product/releases/BUILD_97_RELEASE_GATE_EVIDENCE.md` | NEW — this file | New document |

**No mobile code changed. No Apple Sign-In logic changed. No session or token format changed.**

---

## Exact Transient Error Conditions Eligible for Retry

The retry helper (`artifacts/api-server/src/lib/db-retry.ts`) ONLY retries on:

| Error condition | Node code or message pattern |
|---|---|
| Connection reset by peer | `code: ECONNRESET` |
| Connection refused | `code: ECONNREFUSED` |
| Connection timed out (system) | `code: ETIMEDOUT` |
| Host unreachable | `code: EHOSTUNREACH` |
| DNS resolution failed | `code: ENOTFOUND` |
| Broken pipe | `code: EPIPE` |
| pg pool connection timeout | message includes `"timeout exceeded when trying to connect"` |
| Server closed connection | message includes `"Connection terminated unexpectedly"` |
| Client released/closed | message includes `"Client was closed and is not queryable"` |
| Connection reset (message) | message includes `"connect ECONNRESET"` |
| Timeout (message) | message includes `"connect ETIMEDOUT"` |

**Does NOT retry:**
- `23505` unique_violation (duplicate key — returns 409, not retried)
- `23502` not_null_violation
- `42P01` undefined_table
- `28000` / `28P01` authentication errors
- Wrong password, expired session, validation failures
- Any error carrying a 5-character PostgreSQL error code (server responded)

**Retry behaviour:** Single retry after 500ms. Both attempts logged. If second attempt fails for any reason, throws — existing catch block returns clean member-facing message, no DB details exposed.

---

## Routes Protected

| Route | Failure in Build 96 log | Retry added |
|---|---|---|
| `POST /api/auth/apple` | Yes — 03:02:05 UTC | ✅ |
| `POST /api/auth/login-email` | Yes — 03:02:14 UTC | ✅ |
| `POST /api/auth/register` | Yes — 03:04:15 UTC | ✅ |
| `GET /api/auth/check-username` | Yes — 03:03:45 UTC | ✅ |
| `GET /api/businesses` | Yes — "Failed to fetch businesses" | ✅ |

---

## Typecheck Result

```
artifacts/api-server typecheck: Done   ← ZERO ERRORS
```

Run: `pnpm run typecheck` — July 27, 2026
Mobile errors in typecheck output are pre-existing (absoluteFillObject removed in RN 0.86, expo-router unstable-tabs, etc.) and are NOT introduced by Build 97. They are documented in memory. They do not affect the API server or the Apple Sign-In flow.

---

## Gate 1 — Typecheck
**Status:** ✅ PASS
**Evidence:** `artifacts/api-server typecheck: Done` (zero errors)

---

## Gate 2 — Production API Spot Check
**Status:** ⏳ PENDING — Railway DB pool exhausted at time of check

**Finding:** At approximately 18:xx UTC July 27, 2026, `GET /api/businesses?limit=3` returned `{"error":"Failed to fetch businesses"}` with HTTP 500 after exactly 10.13 seconds. This is the `connectionTimeoutMillis:10000` pattern — the Railway Postgres connection pool is exhausted. This is the same failure Apple's reviewer encountered at 03:01 UTC.

**Required action (founder):** Restart the Railway API server service from the Railway dashboard:
> Railway Dashboard → mappingwithmelanin project → api-server service → "Restart"

After restart, re-run: `GET https://www.mappingwithmelanin.com/api/businesses?limit=3` must return 200 in < 2 seconds.

---

## Gate 3 — Railway Log Audit (24-hour window)
**Status:** ⏳ PENDING — requires post-restart log review

After the Railway service is restarted and stable, query logs for a 30-minute window showing no DB errors before declaring the instance stable.

---

## Gate 4 — Apple Key Z2NB4XAZY7 Status
**Status:** ⏳ PENDING — manual founder check required

> developer.apple.com → Certificates, Identifiers & Profiles → Keys → Z2NB4XAZY7
> Must show: **Active**

---

## Gate 5 — Fresh Apple Sign-In Registration on Production
**Status:** ⏳ PENDING — blocked until production DB is stable

Test must be performed AFTER Railway is restarted and stable.

---

## Gate 6 — Apple Sign-In Returning User
**Status:** ⏳ PENDING

---

## Gate 7 — Email Registration and Login
**Status:** ⏳ PENDING

---

## Gate 8 — iPad Layout Verification
**Status:** ⏳ PENDING

---

## Gate 9 — Review Account
**Status:** ⏳ PENDING — blocked until production DB is stable

Review account must be created on production AFTER Railway restart. Credentials to be provided privately in session. Do not place credentials in this file.

**Account specification:**
- Email: real, accessible by founder (do not record here)
- Email verification: not enforced at login (confirmed from code review — `emailVerified` is not checked in login route)
- Approved: true (set automatically by register endpoint)
- Waitlist: none
- All Build 97 features accessible

---

## Gate 10 — Railway Log Audit After Testing
**Status:** ⏳ PENDING

Must confirm: `APPLE_TOKEN_EXCHANGED` event appears in logs, zero DB errors during test window.

---

## Gate 11 — Evidence File Committed Before EAS Build
**Status:** ⏳ PENDING — this file will be updated with actual test results before EAS build runs

---

## Production Status at Time of Evidence File Creation

| Check | Time (UTC) | Result |
|---|---|---|
| `GET /api/healthz` | July 27, 2026 | ✅ HTTP 200 |
| `GET /api/businesses?limit=3` | July 27, 2026 | ❌ HTTP 500 — pool exhaustion confirmed |
| Railway service restart (agent attempt) | July 27, 2026 | ⚠️ Attempted via Railway API + CLI — required manual action by founder |

---

## Railway Restart Action Required

The Railway Postgres connection pool is exhausted right now (same failure mode as Apple's Build 96 rejection). This must be resolved before any further testing or submission.

**Manual restart steps:**
1. Go to [Railway Dashboard](https://railway.app)
2. Open the mappingwithmelanin project
3. Click the **api-server** service
4. Click **Deployments** tab → click the current active deployment → **Restart**
   OR: Click the three-dot menu on the service → **Restart**
5. Wait for status to show "Running" (usually 60–90 seconds)
6. Confirm: `GET https://www.mappingwithmelanin.com/api/businesses?limit=3` → HTTP 200 < 2s

---

## DB Retry Deployment Sequence

After the Railway restart clears the pool, the db-retry code deploys as follows:

1. This session ends → Replit checkpoint commits all changes to git
2. Railway's GitHub integration detects the new commit
3. Railway automatically builds and deploys the new api-server
4. Build time: approximately 2–4 minutes
5. New deployment includes `db-retry.ts` with retry protection on all 5 routes

---

## Remaining Known Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Railway Postgres intermittent failures (~2.5hr pattern) | HIGH | DB retry fix adds one retry after 500ms; recovers from transient failures |
| Apple authorization code one-time use on retry | LOW | Retry only fires at first DB query (before authCode exchange). authCode unused on first failed attempt. |
| Review account email not verified | LOW | `emailVerified` is not checked in login route (confirmed from code) |
| Apple Key Z2NB4XAZY7 status unknown | MEDIUM | Requires founder manual check — if Revoked, all new Apple Sign-Ins fail permanently |

---

## Rollback Procedure

If Build 97 causes a regression:

1. Railway rollback: Railway Dashboard → api-server → Deployments → click previous deployment → **Rollback**
2. Specific to this change: `artifacts/api-server/src/lib/db-retry.ts` can be deleted and imports removed from auth.ts and businesses.ts — no schema changes, no data migrations, no session format changes involved.
3. Mobile client: no changes — same binary works with the rolled-back server.

---

## Confirmation: No Unrelated Changes in This Build

This build contains ONLY:
- ✅ DB connection retry helper (new file)
- ✅ Retry applied to 5 auth/business routes (no logic changes)
- ✅ Submission release gate document (new document — no code)
- ✅ Evidence file (this document — no code)

**Does NOT include:**
- ❌ Maps or Heritage work
- ❌ Community Member redesign
- ❌ Personalization changes
- ❌ Platform vocabulary changes
- ❌ KinfolkAI changes
- ❌ Sundown-town data
- ❌ Verification changes
- ❌ Business or Ambassador features
- ❌ Any Apple Sign-In logic changes
- ❌ Session format changes
- ❌ Connection pool size changes

---

## GO / NO-GO

**Current status: NO-GO pending 5 actions**

| Action | Who | Blocking |
|---|---|---|
| Restart Railway service (pool exhausted) | Founder | YES |
| Confirm Apple Key Z2NB4XAZY7 is Active | Founder | YES |
| Deploy db-retry code to Railway (auto after checkpoint) | Auto | YES |
| 30-minute production stability window (zero DB errors) | Agent | YES |
| Create review account + verify login | Agent | YES |
| Fresh Apple Sign-In registration test | Founder/tester | YES |
| iPad layout test | Founder/tester | YES |

**GO conditions:**
- Railway restarted and DB healthy for 30 consecutive minutes
- All 5 routes returning 200 on production
- Apple Key confirmed Active
- Review account created and confirmed working
- Fresh Apple Sign-In registration succeeds on production
- iPad layout confirmed
- Railway logs show APPLE_TOKEN_EXCHANGED event and zero DB errors in test window
- This evidence file updated with actual test results and committed

**Do not run `eas build --platform ios --profile production` until all GO conditions are met and confirmed.**
