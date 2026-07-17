---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 17, 2026)

## iOS
- **buildNumber 84, version 1.1.5** — submitted to App Store Connect, pending Apple review
- eas.json has `"autoIncrement": true` — next build will be 85
- Builds 40–53 failed (react-native-google-maps pod name mismatch) — fixed via withRnMapsPodfileFix.js shim + pnpm patch
- Build 83 rejected by Apple: Apple Sign-In nonce requirement on iPadOS 26 — fix submitted as build 84
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **versionCode 60, version 1.1.5** — submitted to Play Store internal testing, CONFIRMED NO CRASH on device (July 17, 2026)
- Previous build 59 crashed immediately on launch — fixed by: installing expo-asset, deduplicating React to 19.2.3, removing invalid app.json fields, updating plugins to expo/config-plugins
- eas.json production android has `credentialsSource: "local"` — do not change this

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
- API: api-server-production-a991.up.railway.app, v1.1.5 live
- Service: a77b49bb-e448-4be8-9d02-de7a3b43136b, Environment: 2292b38f-3d0d-4cad-92a4-ad36cabda629
- Redeployment: push dist to Melaninmaps/melanin-maps-api, trigger via Railway GraphQL serviceInstanceDeploy
