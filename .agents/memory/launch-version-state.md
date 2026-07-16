---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 16, 2026 — end of session)

## iOS
- **Current buildNumber in app.json: 51, version 1.1.5**
- autoIncrement: true in eas.json — EAS auto-increments from 51 onward
- All recent builds (build ~40–51) FAILED at pod install — NOT yet submitted to TestFlight or App Store
- The pod install fix is now in place (see rnmaps-podspec-patch.md) — next build should succeed
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app
- **NEXT SESSION ACTION: run `eas build --platform ios --profile production`, then `eas submit --platform ios --profile production`**

## Android
- **versionCode 52, version 1.1.5 — already submitted to Google Play internal track**
- Submit command: `eas submit --platform android --profile production`
- autoIncrement: true in eas.json
- eas.json production android has `credentialsSource: "local"` — do not change this

## Build commands (user runs from their own terminal, inside artifacts/mobile/)
- `cd artifacts/mobile && eas build --platform ios --profile production`
- `cd artifacts/mobile && eas submit --platform ios --profile production`

## Railway production fixes applied July 14, 2026
- RESEND_API_KEY: was wrong key — replaced with correct Production key
- DATABASE_URL: was hardcoded public proxy URL — replaced with ${{ Postgres.DATABASE_URL }} (internal network)
- Both fixes confirmed working: registration returns 201, emails send

## Railway redeployment pattern
- Push dist to Melaninmaps/melanin-maps-api GitHub repo (requires PAT — password auth disabled)
- Trigger via Railway GraphQL: serviceInstanceDeploy(serviceId, environmentId, latestCommit: true)
- Service: a77b49bb-e448-4be8-9d02-de7a3b43136b, Environment: 2292b38f-3d0d-4cad-92a4-ad36cabda629
