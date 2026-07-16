---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 16, 2026)

## iOS
- **Current buildNumber in app.json: 54, version 1.1.5**
- eas.json has `"autoIncrement": true` — EAS will auto-increment BEFORE building, so next build will be 55
- Builds 40–53 all FAILED at pod install (react-native-google-maps name mismatch)
- **Definitive fix applied: `react-native.config.js` podspecPath override** — fixes autolinking at source so Podfile NEVER gets the wrong pod name
- Belt-and-suspenders: `plugins/withRnMapsPodfileFix.js` also patches the Podfile if needed (handles both single and double quotes)
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **versionCode 54, version 1.1.5 — not yet submitted**
- Android Metro bundler error reported but NOT REPRODUCED LOCALLY — every file passes Babel transforms
- Build 53 was the first Android attempt after many feature additions; error origin unknown
- Need to see lines 1-18 of the EAS Android build log to diagnose the actual error
- Build command: `eas build --platform android --profile production`
- Submit command: `eas submit --platform android --profile production`
- eas.json production android has `credentialsSource: "local"` — do not change this

## Build commands (user runs from their own terminal, inside artifacts/mobile/)
- iOS: `cd artifacts/mobile && eas build --platform ios --profile production`
- iOS submit: `cd artifacts/mobile && eas submit --platform ios --profile production`
- Android: `cd artifacts/mobile && eas build --platform android --profile production`
- Android submit: `cd artifacts/mobile && eas submit --platform android --profile production`

## Railway production fixes applied July 14, 2026
- RESEND_API_KEY: was wrong key — replaced with correct Production key
- DATABASE_URL: was hardcoded public proxy URL — replaced with ${{ Postgres.DATABASE_URL }} (internal network)
- Both fixes confirmed working: registration returns 201, emails send

## Railway redeployment pattern
- Push dist to Melaninmaps/melanin-maps-api GitHub repo (requires PAT — password auth disabled)
- Trigger via Railway GraphQL: serviceInstanceDeploy(serviceId, environmentId, latestCommit: true)
- Service: a77b49bb-e448-4be8-9d02-de7a3b43136b, Environment: 2292b38f-3d0d-4cad-92a4-ad36cabda629
