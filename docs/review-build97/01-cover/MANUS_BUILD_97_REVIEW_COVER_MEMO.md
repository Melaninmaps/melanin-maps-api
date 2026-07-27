# MANUS SENIOR ENGINEERING REVIEW — COVER MEMO
## Mapping With Melanin™ — Build 97 Pre-Build Handoff
**Prepared:** July 27, 2026
**Prepared by:** Replit Agent (Engineering)
**Authorized by:** Founder
**Classification:** External Review — Sanitized (no secrets, no user data)

---

## 1. What Is Mapping With Melanin™?

Mapping With Melanin™ is a community intelligence and discovery platform for the Black diaspora and broader minority communities. Its core purpose is to help members find, trust, and support minority-owned businesses, cultural heritage sites, community spaces, and each other — with safety-aware travel and local guidance built in.

Key pillars:
- **Business Discovery** — curated, verified, and community-rated businesses across the US
- **Maps & Heritage** — Google Maps integration with cultural heritage overlays
- **Community** — social posts, events, circles, and safety reporting
- **KinfolkAI** — a personalized AI travel and discovery assistant (GPT-backed)
- **Membership** — tiered subscription (Individual / Navigator / Trailblazer / Founding)

---

## 2. Launch and Tour Urgency

The platform is at a critical pre-launch stage. The founder is preparing:
- An iOS App Store launch for approximately 30 pilot testers (TestFlight)
- A parallel Android internal testing build (Google Play internal track)
- A corresponding production web release

The founder is also preparing a physical city tour ("Tour Activation") to demonstrate the platform in multiple cities. **Platform availability is independent of Tour Status** — the platform must be stable and approvable regardless of tour scheduling.

---

## 3. Current Platforms

| Platform | Status | Details |
|----------|--------|---------|
| **Production Web** | Live | `www.mappingwithmelanin.com` — Railway Express API + React/Vite SPA |
| **Expo/React Native iOS** | Build 96 Rejected | Bundle ID: `com.melaninmaps.app`, Build 97 proposed |
| **Expo/React Native Android** | Internal testing | Package: `com.melaninmaps.app`, versionCode: 71 |
| **Railway API** | Live (unstable) | Express 5, Node.js, deployed on Railway |
| **Railway PostgreSQL** | Live | Single Railway Postgres instance, ~37 tables |

---

## 4. Current Build Numbers

| Platform | Number | Status |
|----------|--------|--------|
| iOS Build | 97 | **PROPOSED — not yet submitted. Build 96 was rejected.** |
| iOS Version | 1.1.5 | Current app version |
| iOS Bundle ID | `com.melaninmaps.app` | — |
| Android versionCode | 71 | Proposed next build |
| Android Version Name | 1.1.5 | — |
| Android Package | `com.melaninmaps.app` | — |
| EAS Project ID | `0f873107-7787-46ab-9a04-685c2a6756b1` | — |

**Build 96 was rejected by Apple on July 27, 2026.** No EAS build has been run for Build 97 yet. This package is prepared before any Build 97 compilation.

---

## 5. Expected Tester Scale

Approximately **30 testers** across:

| Device | Estimated Count |
|--------|----------------|
| iPhone (various models) | ~15 |
| iPad (including iPad Air M3 — Apple's review device) | ~5 |
| Android phone | ~7 |
| Android tablet | ~3 |
| Web browser | All testers |

**Apple's review was conducted on iPad Air 11-inch (M3) running iPadOS 26.5.2.** iPad must be fully functional in Build 97.

---

## 6. Apple's Exact Latest Rejection — Build 96

**Guideline:** 2.1(a) — Performance: App Completeness

**Apple's message (verbatim):**
> "Error message appeared when tapped on Apple login and tried to register a new account."

**Review device:** iPad Air 11-inch (M3), iPadOS 26.5.2
**Submission:** Version 1.0, Build 96
**Review date:** July 27, 2026

**Root cause (confirmed):** Railway PostgreSQL connection pool exhaustion. Every authentication method — Apple Sign-In, email login, registration — failed because the database was unavailable. The DB was not down; it was out of available connections due to a code bug (see Section 7 and `docs/reviews/database/DATABASE_POOL_ROOT_CAUSE.md`).

---

## 7. Confirmed Database Pool Root Cause

The `stripe-replit-sync` package creates a new `pg.Pool(max:10)` in its constructor. The previous implementation of `getStripeSync()` in the API server called `new StripeSync({poolConfig})` on **every Stripe webhook event** — each call creating a new pool that was never closed. After 2–3 webhook events, 20–30 additional connections accumulated against Railway's Postgres, exhausting its connection limit. The app's own pool could no longer acquire connections; every auth call returned HTTP 500 after the 10-second timeout.

**Evidence from Railway logs:** The same failure pattern appeared at 20:31 and 22:59 UTC the night before submission, and again at 03:01 UTC during Apple's review session.

**Fix applied (Build 97 server code):**
- `getStripeSync()` now returns a promise-based singleton — one `pg.Pool(max:2)` per process
- `endStripeSyncPool()` called on graceful SIGTERM shutdown
- App pool increased from 5 → 8 (load-tested at 30 concurrent users: 100% success, p95 489ms)
- Retry helper added to 5 critical auth/business routes for transient errors

**The fix has been applied to the Replit development environment. It has NOT yet been deployed to Railway production.** The Railway production server still runs the pre-fix code. This is the most critical outstanding risk.

---

## 8. Changes Implemented But Not Yet Released

| Change | File | Status |
|--------|------|--------|
| StripeSync singleton fix | `artifacts/api-server/src/stripeClient.ts` | ✅ Code complete, not deployed to Railway |
| StripeSync pool drain on shutdown | `artifacts/api-server/src/index.ts` | ✅ Code complete, not deployed |
| DB retry helper (5 routes) | `artifacts/api-server/src/lib/db-retry.ts` | ✅ Code complete, not deployed |
| App pool 5→8 + resilience config | `lib/db/src/index.ts` | ✅ Code complete, not deployed |
| Health monitor (5-min synthetic checks) | `artifacts/api-server/src/lib/healthMonitor.ts` | ✅ Code complete, not deployed |
| iOS buildNumber 96→97 | `artifacts/mobile/app.json` | ✅ Done |
| Duplicate Android permissions removed | `artifacts/mobile/app.json` | ✅ Done |
| Spurious iOS permission strings removed | `artifacts/mobile/ios/.../Info.plist` | ✅ Done |

**No mobile app logic has changed.** Apple Sign-In, session handling, business discovery, maps, KinfolkAI — all unchanged from Build 96.

---

## 9. Proposed Build 97 Tester Experience

The founder has confirmed: **this is not a login-only build.** The intended tester experience includes:

- Registration (email and Apple Sign-In)
- Login (email and Apple Sign-In)
- Existing business previews
- Inclusive diaspora-based business language (not "Black-owned" universally)
- Maps with Google Maps integration
- Heritage places overlay
- Historical Sundown Towns (see note below)
- Community feed (posts, events)
- Events and all currently visible tabs
- Basic KinfolkAI chatbot functionality
- User preferences and tone/voice settings
- Cross-platform phone and tablet usability
- Membership and Restore Purchases
- Settings, Policies, Account deletion

**Historical Sundown Towns:** Currently in planning/documentation phase. Data has NOT been imported to production. The feature must present clearly as historical reference with sourced attribution and disclaimers. See `docs/reviews/features/MAPS_HERITAGE_SUNDOWN_REVIEW.md`.

---

## 10. Known Unresolved Risks

| Risk | Severity | Status |
|------|----------|--------|
| Railway production still running pre-fix code | **P0** | Fix not yet deployed — must deploy before submission |
| 12-hour Railway stability window not started | **P0** | Requires Railway restart + 12-hour monitoring window |
| `appstorereview@mappingwithmelanin.com` not created | **P0** | Blocked by Railway being down at time of this writing |
| Historical Sundown Towns data not imported | **P1** | Feature may need to be scoped or gated |
| `runMigrations()` startup pool not drained | **P1** | Stripe-replit-sync startup creates a pool that is never closed |
| iPad-specific UI not regression-tested | **P1** | Physical iPad test required pre-submission |
| No mobile crash reporting (Sentry/Bugsnag) | **P1** | Crashes on device are invisible without logs |
| RevenueCat sandbox availability not confirmed | **P1** | Founder must confirm IAP products visible in sandbox |
| Fresh Apple Sign-In on physical device not confirmed | **P1** | Required per submission gate |

---

## 11. Exact Questions for Manus

See `docs/reviews/MANUS_REVIEW_QUESTIONS.md` for the complete list of 30 questions the founder wants Manus to answer directly.

---

## 12. Package Index

| Section | File |
|---------|------|
| This memo | `docs/reviews/MANUS_BUILD_97_REVIEW_COVER_MEMO.md` |
| Apple rejection history | `docs/reviews/apple/APPLE_REJECTION_HISTORY.md` |
| Incident report index | `docs/reviews/MANUS_INCIDENT_REPORT_INDEX.md` |
| Database root cause | `docs/reviews/database/DATABASE_POOL_ROOT_CAUSE.md` |
| Source export manifest | `docs/reviews/SOURCE_EXPORT_MANIFEST.md` |
| Environment templates | `docs/reviews/config/` |
| Native iOS/Android config | `docs/reviews/native/` |
| Build history | `docs/reviews/builds/BUILD_HISTORY.md` |
| Error inventory | `docs/reviews/observability/KNOWN_ERROR_INVENTORY.md` |
| Test account template | `docs/reviews/TEST_ACCOUNT_INSTRUCTIONS_TEMPLATE.md` |
| API route inventory | `docs/reviews/API_ROUTE_INVENTORY.md` |
| Database model | `docs/reviews/DATABASE_MODEL_OVERVIEW.md` |
| Architecture | `docs/reviews/ARCHITECTURE_OVERVIEW.md` |
| Build 97 scope | `docs/reviews/BUILD_97_PROPOSED_SCOPE.md` |
| Maps/Heritage/Sundown | `docs/reviews/features/MAPS_HERITAGE_SUNDOWN_REVIEW.md` |
| KinfolkAI review | `docs/reviews/features/KINFOLKAI_BUILD_97_REVIEW.md` |
| Privacy/compliance | `docs/reviews/PRIVACY_DATA_COLLECTION_SUMMARY.md` |
| Subscriptions | `docs/reviews/SUBSCRIPTION_REVIEW.md` |
| Review questions | `docs/reviews/MANUS_REVIEW_QUESTIONS.md` |
