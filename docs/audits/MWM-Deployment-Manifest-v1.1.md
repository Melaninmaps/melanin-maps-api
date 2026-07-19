# Mapping With Melanin™ — Deployment Manifest v1.1

**Release:** Waves 1-A, 1-B, 3-A, 3-B, 3-C, 3-D  
**Date:** July 19, 2026  
**Manifest version:** 1.1 — adopts cross-platform verification standard  
**Previous version:** MWM-Deployment-Manifest-v1.0.md  

---

## Verification Standard

Every wave is not complete until it meets ALL applicable platform criteria.

**Allowed statuses:**
- `Not tested` — no test has been run
- `Failed` — test ran; result was incorrect or feature is structurally missing
- `Implemented — verification pending` — code is written; awaiting device or production test
- `Verified` — exact user journey passed on the specified platform and build

**Do not use** "working," "complete," or "all checks passed" unless every applicable platform and journey has passed. If any applicable test fails: do not advance the wave; document the exact failure; propose a correction; implement only after approval; rerun the full platform matrix after the correction.

---

## Build State at Time of This Manifest

| Target | Build | Version | Notes |
|---|---|---|---|
| iOS (TestFlight) | Build 54 | 1.1.5 | Current live TestFlight build |
| Android (Play Tester) | versionCode 54 | 1.1.5 | Current live tester build |
| Web | Latest Railway deploy | — | www.mappingwithmelanin.com |
| API | Latest Railway deploy | — | api-server-production |
| Next EAS build | Build 55 (autoIncrement) | TBD | Community Beta 2 — not yet triggered |

---

## Platform Matrices — All Waves

### Wave 1-A — Account Lockout (10 consecutive email login failures → 15 min lock)

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| Lockout fires at attempt 11 | Impl — verif. pending | Impl — verif. pending | Impl — verif. pending | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Lockout message displays in UI | Impl — verif. pending* | Impl — verif. pending** | Impl — verif. pending** | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Lock auto-expires after 15 min | N/A | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |

*Web login.tsx reads `data.error` from all non-200 responses — lockout message from server WILL display. Verified by code review; needs production device confirmation.  
**Mobile login reads `result.error` from `loginWithEmail()`. Hook implementation not fully traced — needs device test.

### Wave 1-A — Global Logout (POST /auth/logout-all)

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| User can trigger "sign out all devices" | **Failed — no UI** | **Failed — no UI** | **Failed — no UI** | Impl — verif. pending | Not tested | Not tested | **Failed** |

**Defect D-001 (P1):** POST /auth/logout-all is implemented and secured. No web page or mobile screen calls or exposes this endpoint to the user. The security feature exists in the API but is unreachable in a real user journey. See Open Defects section.

### Wave 1-A — TEST_PHONE Gate (production bypass blocked)

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| Test phone bypass inactive in production | N/A | Impl — verif. pending | Impl — verif. pending | ✅ Verified (4 unit tests) | Not tested | Not tested | **Implemented — verification pending** |

### Wave 1-A — Auth Event Logging (audit trail to auth_events table)

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| Login, logout events written to DB | N/A (internal) | N/A (internal) | N/A (internal) | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |

### Wave 1-B — Apple Sign-In Nonce (iOS 26+ enforcement)

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| Apple Sign-In completes without nonce error | N/A | Impl — verif. pending | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Invalid/missing nonce rejected server-side | N/A | Not tested | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |

Note: Wave 1-B requires a new EAS build (Community Beta 2 / iOS Build 55). The client-side nonce change is in the current codebase but has NOT been shipped to any TestFlight build yet.

### Wave 3-A — CRON_SECRET Fail-Closed (all 9 cron endpoints)

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| Cron endpoints return 401 without secret | N/A | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Cron endpoints succeed with correct secret | N/A | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |

**Blocker B-001 (P0):** CRON_SECRET is not set in Railway. On deploy, all 9 cron jobs return 401 and stop firing. Must be set before Railway deploy.

### Wave 3-B — CAN-SPAM Footer (all outbound email)

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| Footer appears in email received via web flows | Impl — verif. pending | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Footer appears in email received via iOS flows | N/A | Impl — verif. pending | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Footer appears in email received via Android flows | N/A | N/A | Impl — verif. pending | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Physical mailing address is present and correct | Impl — verif. pending | Impl — verif. pending | Impl — verif. pending | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |

Note: COMPANY_MAILING_ADDRESS env var uses fallback "Melanin Maps LLC · Washington, DC" if not set. Full legal street address must be set before first marketing email.

### Wave 3-B — Unsubscribe Route (POST /auth/unsubscribe)

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| Unsubscribe link in email works | Impl — verif. pending | Impl — verif. pending | Impl — verif. pending | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Invalid token returns 400 | N/A | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Valid token sets marketing_opt_out = true | N/A | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |

### Wave 3-C — Stripe Webhook Idempotency

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| Stripe webhook replay does not double-activate | Impl — verif. pending | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| First webhook processes normally | Impl — verif. pending | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |

Note: Stripe webhook is triggered by web membership purchase only. iOS/Android use RevenueCat. N/A is correct for mobile.

### Wave 3-D — RevenueCat Server-Side Verification

| Platform | Web | iOS | Android | API | Human Test | Failure Test | Status |
|---|---|---|---|---|---|---|---|
| RC sync requires valid active entitlement | N/A | Impl — verif. pending | Impl — verif. pending | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Fake product ID rejected by server | N/A | Not tested | Not tested | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |
| Missing REVENUECAT_API_KEY_V2 → 503 | N/A | N/A | N/A | Impl — verif. pending | Not tested | Not tested | **Implemented — verification pending** |

Note: Mobile RC sync endpoint call path not fully traced. Verification required on physical device after membership purchase.

---

## Open Defects

### D-001 — Logout-All Has No User-Facing UI (P1)
**Wave:** 1-A  
**Platforms affected:** Web, iOS, Android  
**Description:** POST /auth/logout-all is implemented, authenticated, and returns the count of revoked sessions. However, no web page and no mobile screen contains a call to this endpoint. A user has no way to trigger "sign out all devices" through any existing interface.  
**Status:** Failed  
**Required action:** Add a "Sign out all devices" button to profile/settings in both web and mobile, or explicitly defer this as a post-launch feature with clear documentation.  
**Must be resolved before:** Wave 1-A marked Verified  

### D-002 — loginWithEmail Hook Error Path Untraced (P2)
**Wave:** 1-A  
**Platforms affected:** iOS, Android  
**Description:** Mobile login.tsx calls `loginWithEmail()` from `useAuth` (not found in hooks/; likely in contexts/). If that hook swallows non-200 response bodies, the lockout message may not display. Cannot confirm without reading the hook or device-testing lockout.  
**Status:** Implemented — verification pending  
**Required action:** Locate useAuth context, confirm `loginWithEmail` propagates `data.error` for non-200 responses, and test lockout display on physical device.  

### D-003 — RC Sync Mobile Call Path Untraced (P2)
**Wave:** 3-D  
**Platforms affected:** iOS, Android  
**Description:** POST /api/revenuecat/sync exists and is secured. The code path in the mobile app that calls this endpoint after a RevenueCat purchase was not located in this review. If the mobile never calls it, subscription tier sync may not apply the server-side verification.  
**Status:** Not tested  
**Required action:** Trace the mobile RC purchase → sync flow; verify endpoint is called and handles 403 gracefully.  

---

## Launch Blockers (P0)

| ID | Description | Blocks | Resolution |
|---|---|---|---|
| B-001 | CRON_SECRET not set in Railway | Railway deploy | Set CRON_SECRET in Railway dashboard before deploying |
| B-002 | Wave 1-B (Apple nonce) requires new EAS build | Community Beta 2 | Do not trigger EAS build until Railway deploy is stable |

---

## Corrective Actions Required Before Wave Verification

| Wave | Action Required | Platform |
|---|---|---|
| 1-A Lockout | Device test on physical iPhone and Android: fail 10 logins, confirm 423 response, confirm lockout message displays | iOS, Android |
| 1-A Lockout | Browser test on Chrome and Safari: same journey | Web |
| 1-A Lockout | Confirm lock auto-expires after 15 min | API |
| 1-A Global Logout | Add "Sign out all devices" UI to settings, or defer with documented rationale | Web, iOS, Android |
| 1-A TEST_PHONE | Confirm test phone OTP fails in Railway production (NODE_ENV=production) | iOS, Android |
| 1-B Apple Nonce | Physical iPhone TestFlight test on Build 55 (Community Beta 2) | iOS |
| 3-A CRON_SECRET | Set secret in Railway, then curl cron endpoints without and with secret | API |
| 3-B CAN-SPAM | Set COMPANY_MAILING_ADDRESS, trigger a test email, view in email client on iPhone and browser | Web, iOS, Android |
| 3-B Unsubscribe | Click unsubscribe link from a real received email | Web |
| 3-C Stripe | Complete a web test purchase, replay webhook via Stripe Dashboard, confirm no duplicate activation | Web, API |
| 3-D RevenueCat | Trace mobile RC purchase → sync call; test on physical device with real or sandbox RC entitlement | iOS, Android |

---

## Regression Results

| Test Suite | Result | Run Date |
|---|---|---|
| phone-auth-gate.test.ts (4 tests) | ✅ 4/4 passed | July 19, 2026 01:40 UTC |
| TypeScript typecheck (api-server) | ✅ Clean — 0 errors | July 19, 2026 |
| API server build | ✅ Builds and serves on port 8080 | July 19, 2026 |
| Full e2e (Playwright) | Not run this sprint | — |

---

## Founder Verification Steps (post-Railway-deploy)

Only begin these after B-001 (CRON_SECRET) is resolved and Railway deploy succeeds.

1. **Account Lockout** — On Chrome (web) and physical iPhone (TestFlight Build 55): enter wrong password 10 times. Confirm message shows account locked with a time. Attempt an 11th time — confirm same message. Wait 15 minutes, attempt again — confirm login succeeds.
2. **TEST_PHONE** — On physical iPhone with TestFlight Build 55: attempt OTP login with the test phone number. Confirm no code is sent and the login fails (no bypass in production).
3. **Apple Sign-In** — On physical iPhone with TestFlight Build 55: tap "Sign in with Apple." Confirm login completes without "Invalid nonce" error.
4. **CRON_SECRET** — curl: `curl -X POST https://api.mappingwithmelanin.com/api/cron/trial-reminders` (no header) → expect 401. Repeat with correct header → expect 200.
5. **CAN-SPAM footer** — Trigger any outbound email (e.g. request a password reset). View email on iPhone and on desktop browser. Confirm footer shows physical address and Unsubscribe link.
6. **Unsubscribe** — Click Unsubscribe in that email. Confirm response is a confirmation message. Check DB: `SELECT marketing_opt_out FROM users WHERE email = 'your@email.com'` → expect true.
7. **RevenueCat** — On physical iPhone with active sandbox subscription: confirm membership tier updates after purchase. On physical Android: same.
8. **Stripe idempotency** — In Stripe Dashboard → Webhooks → select a recent event → "Resend." Check `stripe_processed_events` table: confirm the event_id appears once only. Confirm no duplicate tier upgrade in the users table.

---

## Pre-Railway-Deploy Checklist

```
[ ] Set CRON_SECRET in Railway (strong random string)
[ ] Set NODE_ENV=production in Railway
[ ] Verify REVENUECAT_API_KEY_V2 is set in Railway
[ ] Verify STRIPE_SECRET_KEY is set in Railway (raw env var, not Replit integration)
[ ] Verify STRIPE_WEBHOOK_SECRET is set in Railway
[ ] Verify SESSION_SECRET matches the value set in the previous Railway deploy
[ ] Set COMPANY_MAILING_ADDRESS to full legal street address
[ ] Set FRONTEND_URL=https://mappingwithmelanin.com
[ ] Set ADMIN_EMAILS=your@email.com (comma-separated)
[ ] Run: railway run pnpm --filter @workspace/db run push
[ ] Verify 3 new users columns and 2 new tables exist in Railway Postgres
[ ] Trigger Railway deploy
[ ] Run smoke tests (see manifest Section 6)
[ ] Confirm API server logs show no startup errors
```
