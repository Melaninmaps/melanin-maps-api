# Apple Rejection History — Mapping With Melanin™
**Last updated:** July 27, 2026
**Note:** Do not invent details not available in project documentation. Gaps are clearly labeled.

---

## Submission Log

### Build 96 — REJECTED (Most Recent)

| Field | Value |
|-------|-------|
| App Name | Mapping With Melanin |
| Version | 1.0 |
| Build Number | 96 |
| Bundle ID | `com.melaninmaps.app` |
| App Store Connect App ID | 6783773366 |
| Apple Team ID | Y46Y4A5MMZ |
| Submission Date | Prior to July 27, 2026 (exact date not recorded in project) |
| Review Date | July 27, 2026 |
| Review Device | iPad Air 11-inch (M3) |
| Review OS | iPadOS 26.5.2 |
| Guideline Cited | **2.1(a) — Performance: App Completeness** |
| Outcome | **Rejected** |

#### Apple's Exact Message

> "Error message appeared when tapped on Apple login and tried to register a new account."

*(Verbatim from Apple's resolution center. No paraphrasing.)*

#### Apple's Separate Request (same review cycle)

Apple also requested:
- A **username and password** for a demo/reviewer account
- **Access to all visible features and account types**

No review account (`appstorereview@mappingwithmelanin.com`) was created before this submission. This is a contributing factor — the reviewer had no pre-seeded account to fall back to when Apple Sign-In failed.

#### Apple Screenshots / Attachments

Not available in project records. Apple's resolution center may contain screenshots. The founder should retrieve and attach them before Manus reviews.

#### What the Error Actually Was

The "error message" Apple saw was the app's authentication failure screen. The failure was NOT a bug in Apple Sign-In logic. The failure was:

1. Apple's reviewer tapped "Sign in with Apple"
2. The app sent the Apple ID credential to `POST /api/auth/apple` on the Railway API
3. The Railway PostgreSQL database had **zero available connections** at that moment (pool exhausted)
4. The API returned HTTP 500 after the 10-second connection timeout
5. The mobile app displayed an error toast: "Sign-in failed"

The same failure would have occurred with email login or registration — any auth path requires a database write.

#### Root Cause Timeline (Railway Logs, Confirmed)

| Time (UTC) | Event |
|------------|-------|
| ~20:31 UTC (night before review) | First DB pool exhaustion event logged — `GET /api/businesses` returned 500 after 10.13s |
| ~22:59 UTC (night before review) | Second DB pool exhaustion event |
| ~03:01 UTC (during Apple review) | DB pool exhaustion during Apple reviewer session — all auth routes returned 500 |

The 03:01 failure corresponds with Apple's review. The earlier failures (20:31, 22:59) were caused by the same root cause but were not investigated before submission.

#### Internal Testing That Failed to Catch This

| What Was Tested Before Submission | Gap |
|-----------------------------------|-----|
| TypeScript typecheck — zero errors | ✅ Passed |
| `POST /api/auth/login-email` → 200 at submission time | ✅ Passed (pool was not exhausted at that moment) |
| `GET /api/businesses?limit=3` → 200 | ✅ Passed |
| Apple secrets present in environment | ✅ Confirmed |
| Heritage Sites disabled in code | ✅ Confirmed |
| Railway log audit (24h pre-submission) | ❌ **NOT DONE — this is the gap** |
| Fresh Apple Sign-In on physical device against production | ❌ **NOT DONE** |
| iPad-specific device test | ❌ **NOT DONE** |
| Apple review account created | ❌ **NOT DONE** |

#### Fix Applied (Build 97)

Primary fix: `getStripeSync()` in `artifacts/api-server/src/stripeClient.ts` is now a promise-based singleton. Previously it called `new StripeSync({poolConfig})` on every Stripe webhook, each creating a new `pg.Pool(max:10)` that was never closed. The leak was unbounded; 2–3 webhook events exceeded Railway's connection limit.

Secondary fixes: DB retry helper, graceful shutdown pool drain, app pool 5→8, connection recycling hardening.

See `docs/reviews/database/DATABASE_POOL_ROOT_CAUSE.md` for full technical detail.

#### Founder / Developer Response

The founder authorized an engineering investigation on July 27, 2026. Root cause was confirmed within hours. Fix was implemented in Replit development environment. Build 97 has not yet been compiled.

#### Whether Issue Reappeared

Not applicable — Build 97 has not been submitted.

#### What Internal Testing Failed to Catch

The Railway 24-hour log audit step was not in the release gate before Build 96. It has since been added as a permanent required gate (`docs/product/SUBMISSION_RELEASE_GATE.md`, Gate 3).

---

### Prior Submissions

**Records of prior Apple submissions (builds prior to 96) are not available in the current project documentation.** The project history references "Build 96" as a known submission number and implies prior submissions existed (the `buildNumber` incrementation suggests at least one prior iOS build), but no rejection records, communication logs, or resolution center exports for those builds are present in the repository.

**Manus should be aware:** The project has an existing TestFlight history (builds up to 96). Prior rejections, if any, are not documented here. The founder should retrieve prior rejection emails and App Store Connect resolution center history and provide them to Manus directly.

---

## What Manus Should Verify

1. Whether any prior build had the same DB pool exhaustion failure pattern
2. Whether the Build 97 fix (StripeSync singleton) is complete and will prevent recurrence
3. Whether the absence of a pre-seeded review account contributed to the rejection
4. Whether any other outstanding Apple guideline risk exists that was not triggerable in prior builds
