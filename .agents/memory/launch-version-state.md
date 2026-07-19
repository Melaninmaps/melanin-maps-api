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
- Latest deployed commit: ca61f65b (July 19, auth P0 fix — throttle + 401-only signout)
- Previous: fca3d699 (July 19, rolling session logging)
- Deploy method: Dockerfile copies pre-built dist/ — must build dist THEN push source to Railway
- Railway CLI broken in Replit environment (token format incompatible with CLI auth)
- Deploy via: Git Data API (blob → tree → commit → patch ref) to Melaninmaps/melanin-maps-api

## P0 FIX STATUS (July 19, 2026)
### Server-side fixes — DEPLOYED (commit ca61f65b, Railway auto-deploys on push)
1. authMiddleware.ts: renewalThrottle Map — session DB writes limited to once/hr per sid
2. auth.tsx (mobile): fetchUser() now only signs out on HTTP 401 — NOT on 500/transient errors
   - NOTE: This is in mobile code — changes are in the repo but require a new EAS build to ship

### Mobile-only fixes — IN REPO, REQUIRE NEW BUILD (iOS 88 / Android 63)
3. business/[id].tsx: openCircleSheet Alert.alert instead of router.push('/login') on !token
4. auth.tsx: fetchUser 401-only signout (same file, mobile build required)

## P0 ROOT CAUSE IDENTIFIED
The circles button (Feather "users" icon in business screen top-right header) sits next to
the save/heart button. openCircleSheet() at line 527 did router.push("/login") if
SecureStore returned no token — instead of an alert. Additionally, fetchUser() signed
users out on ANY non-user response (incl. 500 errors), not just 401.

## RELEASE GATE: STILL NO GO — pending:
1. New mobile build (iOS 88 / Android 63) with the circles-button + fetchUser fixes
2. Password-reset full production trace (status: INVESTIGATING — not yet started)
3. Founder retest passes all checklist items on the new build

## DO NOT SUBMIT iOS 87 / Android 62
These builds have the P0 defect. Next submission: iOS 88 / Android 63.
