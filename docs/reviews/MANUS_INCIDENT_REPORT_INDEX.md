# Incident Report Index — Manus Review Package
## Mapping With Melanin™ — Build 97
**Date:** July 27, 2026

---

## Index of All Incident Reports and Forensic Documents

| Report | File | Date | Author | Status |
|--------|------|------|--------|--------|
| Build 96 rejection root cause + DB forensic | `docs/reviews/database/DATABASE_POOL_ROOT_CAUSE.md` | July 27, 2026 | Replit Agent | ✅ Confirmed |
| Build 97 release gate evidence | `docs/product/releases/BUILD_97_RELEASE_GATE_EVIDENCE.md` | July 27, 2026 | Replit Agent | ✅ Confirmed |
| Submission release gate (permanent) | `docs/product/SUBMISSION_RELEASE_GATE.md` | July 27, 2026 | Replit Agent | ✅ Adopted |
| Engineering review (internal) | `docs/product/releases/ENGINEERING_REVIEW_BUILD97.md` | July 27, 2026 | Replit Agent | ✅ Internal |
| Apple rejection history | `docs/reviews/apple/APPLE_REJECTION_HISTORY.md` | July 27, 2026 | Replit Agent | ✅ Confirmed |
| Build 97 proactive failure testing plan | `docs/product/BUILD_97_PROACTIVE_FAILURE_TESTING_PLAN.md` | 2026 | Replit Agent | 🔶 Partial — 10 sections documented, not all executed |
| StripeSync pool-leak root cause (in BUILD_97_RELEASE_GATE_EVIDENCE.md) | See Part 1 of that file | July 27, 2026 | Replit Agent | ✅ Confirmed with package source evidence |
| Load test report (in BUILD_97_RELEASE_GATE_EVIDENCE.md) | See Part 3 of that file | July 27, 2026 | Replit Agent | ✅ Run against Replit/local Postgres, NOT Railway production |

---

## Report Detail

### 1. Build 97 Release Gate Evidence
**File:** `docs/product/releases/BUILD_97_RELEASE_GATE_EVIDENCE.md`
**Date:** July 27, 2026
**Author:** Replit Agent (Engineering)
**Status:** ✅ Implementation Complete — pre-Railway-deploy stage

**Confirmed evidence:**
- Package source code from `stripe-replit-sync@1.0.0` showing `new pg.Pool()` at constructor line 37
- Railway log timestamps at 20:31, 22:59, 03:01 UTC showing pool exhaustion
- Live demonstration: `GET /api/businesses` → HTTP 500 after 10.13s during current session
- Singleton fix verified in `stripeClient.ts`
- Load test: 30 concurrent users, 100% success, p95 489ms (Replit environment, not Railway)

**Assumptions:**
- Railway production has the same failure characteristics as confirmed in Replit logs
- The Railway Postgres connection limit was exceeded (exact limit not confirmed)
- One Railway replica is running (confirmed from pool config comments)

**Unresolved questions:**
- Railway Postgres exact connection limit (check dashboard)
- Whether `runMigrations()` startup pool is an acceptable risk
- Whether the fix has been deployed to Railway (it has not)
- Whether 12-hour Railway stability window has been completed (it has not)

**Code changes resulting from investigation:**
- `artifacts/api-server/src/stripeClient.ts` — StripeSync singleton
- `artifacts/api-server/src/index.ts` — `endStripeSyncPool()` on shutdown + graceful shutdown improvements
- `artifacts/api-server/src/lib/db-retry.ts` — new file, retry helper
- `lib/db/src/index.ts` — pool max 5→8, idle timeout 300s→30s, keepAlive delay 10s→1s, maxLifetimeSeconds: 1800

---

### 2. Submission Release Gate
**File:** `docs/product/SUBMISSION_RELEASE_GATE.md`
**Date:** July 27, 2026
**Author:** Replit Agent
**Status:** ✅ Adopted — permanent, applies to every future submission

**Confirmed evidence:** Documents the gap between what was checked before Build 96 and what should have been checked (24-hour Railway log audit, physical device Apple Sign-In test, iPad test, review account creation).

**Assumptions:** None — gates are procedural requirements, not technical findings.

**Unresolved questions:**
- Whether gates 3–11 (Railway log audit, Apple Sign-In physical device test, iPad test, etc.) can be completed before Build 97 submission given Railway is currently not running the fixed code

**Code changes:** None — procedural document only.

---

### 3. Build 97 Proactive Failure Testing Plan
**File:** `docs/product/BUILD_97_PROACTIVE_FAILURE_TESTING_PLAN.md`
**Date:** 2026 (earlier in Build 97 planning)
**Author:** Replit Agent
**Status:** 🔶 Partial — plan documented, not fully executed

**10 sections:** Staging environment setup, crash-risk scan, HTTP 400–503 coverage, 404 inventory, auth fault injection, map fault injection, KinfolkAI fault injection, write safety, device stress, 14 synthetic user journeys.

**Confirmed evidence:** The plan exists and was reviewed by the founder.

**Assumptions:** The plan was written before the Build 96 rejection; the Railway pool exhaustion failure was not covered because it was not yet known.

**Unresolved questions:** Which of the 10 sections have been executed? Manus should ask the founder which synthetic journeys have been completed.

**Code changes:** None — plan document only.

---

## How Manus Should Distinguish Confirmed Findings from Hypotheses

| Mark | Meaning |
|------|---------|
| ✅ **Confirmed** | Direct evidence from Railway logs, package source code, or live demonstration |
| 🔶 **Partial** | Some evidence confirmed, some inferred or incomplete |
| ❓ **Hypothesis** | Reasonable inference from available evidence, not directly confirmed |
| ⚠️ **Assumption** | Explicit assumption documented; should be verified |

### Confirmed findings in this package:
- StripeSync creates a new `pg.Pool(max:10)` per constructor call (package source, line 37)
- Railway log timestamps show DB failure at 03:01 during Apple review window
- App pool was `max:5` before Build 97; `max:8` after
- Fix is implemented in Replit dev environment, not yet deployed to Railway

### Hypotheses / Inferences:
- Railway's Postgres connection limit was the specific threshold exceeded (exact limit not confirmed from dashboard)
- The Build 96 rejection was entirely caused by pool exhaustion (no other cause investigated that would explain auth-wide failure at 03:01 UTC)
- Prior builds (pre-96) did not have the same failure (not confirmed — prior Railway logs not available)

### Not Available / Unknown:
- Prior submission rejection details (pre-Build 96)
- Exact Railway Postgres connection limit from dashboard
- RevenueCat sandbox product availability
- Apple ASC screenshots from Build 96 review session
- Production user count or active session count at time of rejection
