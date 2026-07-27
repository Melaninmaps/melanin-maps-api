# Mapping With Melanin™ — Build 97 Manus Senior Engineering Review Package
**Prepared:** July 27, 2026
**Prepared by:** Replit Agent (Engineering), authorized by Founder
**Reviewer:** Manus Senior Engineering Review
**Classification:** External Review — Sanitized (no secrets, no user data, no credentials)

---

## WHERE TO BEGIN

**Start here:** `01-cover/MANUS_BUILD_97_REVIEW_COVER_MEMO.md`

This cover memo gives you:
- What the platform is
- Why this review is urgent
- The exact Apple rejection
- The confirmed root cause
- What has been fixed
- What has NOT been deployed
- The 30 questions you must answer

**Then:** `03-forensic-reports/DATABASE_POOL_ROOT_CAUSE.md` for the technical root cause evidence.

**Then:** `18-review-questions/MANUS_REVIEW_QUESTIONS.md` for the structured question list.

---

## WHAT IS CONFIRMED

| Finding | Evidence |
|---------|---------|
| StripeSync creates `new pg.Pool(max:10)` per constructor call | Package source code line 37 |
| Prior `getStripeSync()` was called per webhook (not singleton) | `webhookHandlers.ts` inspection |
| Railway DB failures at 20:31, 22:59, 03:01 UTC | Railway logs |
| Live demonstration: 10.13s timeout → HTTP 500 | Executed during investigation |
| Fix: `getStripeSync()` is now a promise-based singleton | `stripeClient.ts` inspection |
| App pool increased 5→8; StripeSync pool set to 2 | `lib/db/src/index.ts` + `stripeClient.ts` |
| Load test: 30 concurrent users, 100% success, p95 489ms | Test run (Replit env, not Railway) |
| `endStripeSyncPool()` called on graceful SIGTERM | `index.ts` inspection |

---

## WHAT IS PROPOSED (NOT YET VERIFIED IN PRODUCTION)

- Fix works in Railway production (deployed only to Replit dev)
- 30 testers can be supported by 10 max connections on one Railway replica
- Pool 8+2=10 is correctly sized
- `runMigrations()` startup pool is not a release risk
- Build 97 EAS compilation will succeed without errors

---

## WHAT REMAINS UNTESTED

| Item | Status |
|------|--------|
| Fix deployed to Railway production | ❌ Not done |
| 12-hour Railway stability window | ❌ Not started |
| Apple Sign-In on physical iOS 26+ device | ❌ Not done |
| iPad layout on any screen | ❌ Not done |
| Build 97 compiled (EAS build) | ❌ Not started |
| RevenueCat IAP products in App Store Connect | ❌ Not confirmed |
| Apple review account (`appstorereview@mappingwithmelanin.com`) | ❌ Not created |
| Android tablet layout | ❌ Not done |
| Railway production load test | ❌ Not done |
| Historical Sundown Towns data import | ❌ Not confirmed |
| Mobile crash reporting (Sentry/Bugsnag) | ❌ Not installed |

---

## WHICH FILES CONTAIN SENSITIVE PLACEHOLDERS

| File | Placeholder Content |
|------|-------------------|
| `05-config/api.env.example` | Variable names and purposes only — no values |
| `05-config/mobile.env.example` | Variable names only — no values |
| `05-config/railway.env.example` | Variable names only — no values |
| `09-api/API_ROUTE_INVENTORY.md` | Route structure only — no request/response bodies with user data |
| `10-database/DATABASE_MODEL_OVERVIEW.md` | Schema only — no production records |

**The following are explicitly NOT in this package:**
- Any API keys, tokens, or secrets
- Production user data
- Apple private key (.p8)
- Google service account JSON
- Stripe live keys
- Apple review account password
- Production database dumps
- Private URLs or signed URLs

---

## HOW ACTUAL CREDENTIALS WILL BE SHARED

The founder will share the following via a separate secure channel (Signal, 1Password share link, or equivalent):
- Apple review account (`appstorereview@mappingwithmelanin.com`) email and password
- Android test account credentials
- Any other demo credentials Manus specifically requests

**Do not request credentials in email, GitHub issues, or any repository file.**

---

## EXACT GIT COMMIT REVIEWED

| Field | Value |
|-------|-------|
| Commit hash | `c9dad580fd18a3adbf90a5adbc909336fc4d370e` |
| Branch | `main` |
| Repository | `Melaninmaps/melanin-maps-api` (GitHub) |
| Note | Replit workspace may have uncommitted changes beyond this commit — see `04-source-code/SOURCE_EXPORT_MANIFEST.md` for details |

---

## PACKAGE FOLDER STRUCTURE

```
manus-build97-review-package/
├── README.md                          ← START HERE
├── 01-cover/
│   └── MANUS_BUILD_97_REVIEW_COVER_MEMO.md
├── 02-apple-rejections/
│   └── APPLE_REJECTION_HISTORY.md
├── 03-forensic-reports/
│   ├── MANUS_INCIDENT_REPORT_INDEX.md
│   ├── DATABASE_POOL_ROOT_CAUSE.md
│   ├── BUILD_97_RELEASE_GATE_EVIDENCE.md  (from docs/product/releases/)
│   └── SUBMISSION_RELEASE_GATE.md         (from docs/product/)
├── 04-source-code/
│   └── SOURCE_EXPORT_MANIFEST.md
│   [Full source ZIP: mapping-with-melanin-build97-manus-review.zip]
├── 05-config/
│   ├── api.env.example
│   ├── mobile.env.example
│   ├── railway.env.example
│   ├── app.json                       (from artifacts/mobile/)
│   └── eas.json                       (from artifacts/mobile/)
├── 06-native-config/
│   ├── IOS_CONFIG.md
│   └── ANDROID_CONFIG.md
├── 07-build-logs/
│   └── BUILD_HISTORY.md
├── 08-observability/
│   └── KNOWN_ERROR_INVENTORY.md
├── 09-api/
│   └── API_ROUTE_INVENTORY.md
├── 10-database/
│   └── DATABASE_MODEL_OVERVIEW.md
├── 11-architecture/
│   └── ARCHITECTURE_OVERVIEW.md
├── 12-build97-scope/
│   └── BUILD_97_PROPOSED_SCOPE.md
├── 13-maps-heritage-sundown/
│   └── MAPS_HERITAGE_SUNDOWN_REVIEW.md
├── 14-kinfolkai/
│   └── KINFOLKAI_BUILD_97_REVIEW.md
├── 15-privacy/
│   └── PRIVACY_DATA_COLLECTION_SUMMARY.md
├── 16-subscriptions/
│   └── SUBSCRIPTION_REVIEW.md
├── 17-testing/
│   └── CROSS_PLATFORM_TEST_EVIDENCE.md
└── 18-review-questions/
    └── MANUS_REVIEW_QUESTIONS.md
```

---

## NOTE ON HISTORICAL SUNDOWN TOWNS

The founder has included Historical Sundown Towns in the proposed Build 97 scope. **Manus must determine whether this feature is ready to ship.** The data import status is NOT confirmed. The dedicated UI is NOT confirmed as built. The `sundown` category exists in the database schema but a full feature implementation is uncertain.

Manus is asked to give a specific GO / CONDITIONAL GO / NO-GO recommendation for this feature.

---

## CONFIRMATION OF NO CODE CHANGES FOR THIS PACKAGE

This review package was prepared as **read-only collection and export only.** During package preparation:
- ❌ No EAS build was run
- ❌ No submission to Apple or Google was made
- ❌ No Railway deployment was triggered
- ❌ No destructive or chargeable tests were run
- ❌ No new user accounts were created
- ❌ No Railway restart was performed
- ✅ Documentation files only were written
- ✅ Files were pushed to GitHub via REST API for delivery
