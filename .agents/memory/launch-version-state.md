---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 16, 2026)

## iOS
- **Current buildNumber in app.json: 66, version 1.1.5**
- eas.json has `"autoIncrement": true` — EAS will auto-increment BEFORE building, so next build will be 67
- Builds 40–53 all FAILED at pod install (react-native-google-maps name mismatch)
- **Definitive fix applied: `react-native.config.js` podspecPath override** — fixes autolinking at source so Podfile NEVER gets the wrong pod name
- Belt-and-suspenders: `plugins/withRnMapsPodfileFix.js` also patches the Podfile if needed (handles both single and double quotes)
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **versionCode 54, version 1.1.5 — not yet submitted**
- **ROOT CAUSE FOUND AND FIXED (July 16, 2026):**
  - A stray `app.json` existed at the workspace root with `projectId: 94a42921`, making EAS use the wrong EAS project (`workspace`, not `mobile`) and infer `sdkVersion: "54.0.0"`
  - Root `package.json` also had `expo: ~54.0.27` which brought in `@expo/metro-config@54` and `@react-native/codegen@0.81.5`
  - SDK 54 codegen tried to parse `react-native@0.86.0`'s `VirtualViewExperimentalNativeComponent.js` which uses a newer event API (`onModeChange`) the old codegen doesn't understand → crash
  - **Fixed:** deleted `/home/runner/workspace/app.json`, removed `expo: ~54.0.27` from root `package.json`
- Build command: `eas build --platform android --profile production`
- Submit command: `eas submit --platform android --profile production`
- eas.json production android has `credentialsSource: "local"` — do not change this

## CRITICAL: Build commands MUST be run from artifacts/mobile/
- iOS: `cd artifacts/mobile && eas build --platform ios --profile production`
- iOS submit: `cd artifacts/mobile && eas submit --platform ios --profile production`
- Android: `cd artifacts/mobile && eas build --platform android --profile production`
- Android submit: `cd artifacts/mobile && eas submit --platform android --profile production`
- Running from workspace root picks up root package.json and wrong project config → BROKEN

## Railway production fixes applied July 14, 2026
- RESEND_API_KEY: was wrong key — replaced with correct Production key
- DATABASE_URL: was hardcoded public proxy URL — replaced with ${{ Postgres.DATABASE_URL }} (internal network)
- Both fixes confirmed working: registration returns 201, emails send

## Railway redeployment pattern
- Push dist to Melaninmaps/melanin-maps-api GitHub repo (requires PAT — password auth disabled)
- Trigger via Railway GraphQL: serviceInstanceDeploy(serviceId, environmentId, latestCommit: true)
- Service: a77b49bb-e448-4be8-9d02-de7a3b43136b, Environment: 2292b38f-3d0d-4cad-92a4-ad36cabda629
