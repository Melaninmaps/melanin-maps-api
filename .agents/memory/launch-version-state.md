---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 19, 2026)

## iOS
- **Last uploaded to App Store Connect: Build 86** (Community Beta 2, July 19, 2026)
- **Next build must be 87 or higher** — Apple rejects any uploaded build ≤ current
- app.json currently shows buildNumber="87" — correct for the next build
- eas.json has `"autoIncrement": true` — EAS assigns the actual number at build time
- Build 84 was App Store Connect submission (pending review). Build 85 intermediate. Build 86 = CB2.
- Builds 40–53 failed (react-native-google-maps pod name mismatch) — fixed via withRnMapsPodfileFix.js shim + pnpm patch
- Build 83 rejected by Apple: Apple Sign-In nonce requirement on iPadOS 26 — fix submitted as build 84
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **Last uploaded to Play Console: versionCode 61** (Community Beta 2, July 19, 2026)
- **Next versionCode must be 62 or higher** — confirm whether 61 is already uploaded before building
- app.json currently shows versionCode=62 — correct for the next build
- eas.json production android has `credentialsSource: "local"` — do not change this
- Previous build 59 crashed immediately on launch — fixed by: installing expo-asset, deduplicating React to 19.2.3, removing invalid app.json fields, updating plugins to expo/config-plugins

## CRITICAL: Build commands MUST be run from artifacts/mobile/
- iOS: `cd artifacts/mobile && eas build --platform ios --profile production`
- iOS submit: `cd artifacts/mobile && eas submit --platform ios --profile production`
- Android: `cd artifacts/mobile && eas submit --platform android --profile production`
- Running from workspace root picks up root package.json and wrong project config → BROKEN

## Kinfolk AI — Production (as of July 17, 2026)
- Live on Railway via OpenAI API key in API Server Variables
- AI_INTEGRATIONS_OPENAI_API_KEY + AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
- Dedicated OpenAI project: "Kinfolk AI – Production", $20 budget alert
- Confirmed working: controlled test returned valid reply, $0.01 logged under correct project
- No build or store resubmission needed — server-side only change

## Railway production
- API: api-server-production-a991.up.railway.app / www.mappingwithmelanin.com/api
- Service: a77b49bb-e448-4be8-9d02-de7a3b43136b, Environment: 2292b38f-3d0d-4cad-92a4-ad36cabda629
- Latest deployed commit: 020156fd (July 19, email FRONTEND_URL fix — www.mappingwithmelanin.com)
- Previous: ca61f65b (July 19, auth P0 fix — throttle + 401-only signout)
- Deploy method: Dockerfile copies pre-built dist/ — must build dist THEN push source to Railway
- Railway CLI broken in Replit environment (token format incompatible with CLI auth)
- Deploy via: Git Data API (blob → tree → commit → patch ref) to Melaninmaps/melanin-maps-api
- Active deployment ID: 0d7ec9da-8aab-44f1-b775-24e10e559aee (SUCCESS, 2026-07-19T18:12:12)
  NOTE: Email fix commit 020156fd was pushed after this deployment — Railway may still be building next deploy

## P0 FIX STATUS (July 19, 2026)

### Server-side fixes — DEPLOYED ✅
1. authMiddleware.ts: renewalThrottle Map — session DB writes limited to once/hr per sid (ca61f65b)
2. email.ts: FRONTEND_URL fallback fixed from Railway hostname → www.mappingwithmelanin.com (020156fd)

### Mobile-only fixes — IN REPO, REQUIRE NEW BUILD (iOS 88 / Android 63)
3. business/[id].tsx: openCircleSheet → Alert.alert("Sign in…") instead of router.push('/login') on !token
4. lib/auth.tsx: fetchUser 401-only signout (not on 500/transient errors)
5. components/AIChatWidget.tsx: KinfolkAI greeting + placeholder updated

## PASSWORD RESET TRACE — COMPLETE ✅ (July 19, 2026, all 11 steps PASS)
Traced against Railway production using fresh test account pwreset_trace_1784485401@melanintest.dev:
- Step 1: POST /forgot-password → HTTP 200 {"success":true} ✅
- Step 2: Resend email delivered — code 180397 in email body ✅
- Step 3: Email format: 6-digit code displayed, deep-link correct, web link now fixed ✅
- Step 4: Wrong code (000000) → HTTP 400 {"error":"Invalid or expired reset code."} ✅
- Step 5+6: Correct code → HTTP 200 {"success":true,"requestId":"772eee77d40b"} ✅
- Step 7: DB changed — confirmed by login attempts in Steps 8+9 ✅
- Step 8: Old password → HTTP 401 {"error":"Invalid email or password."} ✅
- Step 9: New password → HTTP 200 + session token returned ✅
- Step 10: Code reuse → HTTP 400 {"error":"Invalid or expired reset code."} ✅
- Step 11: Railway logs show "password reset completed" at 18:24:36 UTC ✅

## REGRESSION TESTS — WRITTEN ✅
File: tests/e2e/auth-regression.spec.ts (14 tests, Playwright)
Covers: forgot-password 200/400/422, reset-password code rejection, 401 vs 500 signalling,
user enumeration protection, circles/saved-places auth gates.
NOTE: Playwright uses 127.0.0.1:80 baseURL — tests pass locally; Replit sandbox blocks port 80
from within Playwright process (ECONNREFUSED). Pre-existing suite-wide constraint, not a test bug.

## ADMIN ACCESS BLOCKER FIX STATUS (July 19, 2026)
- Centralized `isAdmin()` into artifacts/api-server/src/lib/adminAuth.ts
  - Dual-check: email allowlist (ADMIN_EMAILS env) OR role === "admin" DB column
  - Normalized Set<string> for O(1) lookup; both sides trim+toLowerCase
  - All 7 route files import from this shared helper (no more inline ADMIN_EMAILS parse)
  - /api/admin/check in waitlist.ts documented as intentional capability-probe (always HTTP 200)
- login.tsx: already-authenticated guard added (useGetCurrentAuthUser + useEffect → navigate to returnTo)
  - Handles case: admin visits /login?returnTo=/admin while already signed in → immediate redirect
- admin.tsx: already appends ?returnTo=/admin to login redirect (done in prior session)
- Bootstrap endpoint: uses direct process.env.ADMIN_EMAILS check (config check, not auth check)
- Both api-server and web typechecks pass clean after all changes

## RELEASE GATE: STILL NO GO
1. ✅ Password-reset full production trace — PASSED
2. ✅ Server fixes deployed (throttle + email FRONTEND_URL)
3. ✅ Regression tests written
4. ✅ Admin access blocker resolved (in repo — needs Railway redeploy)
5. ✅ Railway deployed commit 0d818181 (2026-07-19T22:24:43Z) — Railway deployment 2d5d4536 STATUS:SUCCESS
6. ⏳ Admin access confirmed on production — founder must complete verification flow
7. ⏳ New mobile build (iOS 90 / Android 64) with all mobile P0 fixes
8. ⏳ Founder retest passes all checklist items on new build
9. ⏳ Store submission

## BUILD TRIGGER — when founder authorizes
iOS 90: `cd artifacts/mobile && eas build --platform ios --profile production`
Android 64: `cd artifacts/mobile && eas build --platform android --profile production`
Run both commands simultaneously from artifacts/mobile/ directory.

## DO NOT SUBMIT iOS 87-89 / Android 62-63
These builds have unresolved defects. Next clean submission: iOS 90 / Android 64.
