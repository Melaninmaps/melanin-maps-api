---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 20, 2026)

## Community Beta 1 — IN PROGRESS ON EAS

### iOS Build 90
- EAS Build ID: 697a5458-1184-48a0-a448-f356d93a6952
- Status: in progress (started 7/20/2026 4:58 PM)
- Logs: https://expo.dev/accounts/tlindsay428/projects/mobile/builds/697a5458-1184-48a0-a448-f356d93a6952
- Version: 1.1.5, Build number: 90, SDK: 57.0.0
- Commit: 4bf2646c7d1681e6f6160c05ce97f241fbd22b94
- Profile: production, distribution: store
- credentialsSource: local (credentials.json)
- resourceClass: m-medium

### Android Version Code 64
- EAS Build ID: d10a6478-d2d6-4403-804d-4cde546aea9e
- Status: in progress (started 7/20/2026 4:55 PM)
- Logs: https://expo.dev/accounts/tlinksay428/projects/mobile/builds/d10a6478-d2d6-4403-804d-4cde546aea9e
- Version: 1.1.5, Version code: 64, SDK: 57.0.0
- Commit: 4bf2646c7d1681e6f6160c05ce97f241fbd22b94
- Profile: production, buildType: app-bundle
- credentialsSource: local (credentials.json)

## App Store identifiers
- App Store Connect App ID: 6783773366
- Apple Team: Y46Y4A5MMZ
- Bundle ID: com.melaninmaps.app (iOS + Android)
- EAS submit appleId: tlindsay428@yahoo.com

## autoIncrement note
- autoIncrement was temporarily set to false to allow iOS build to queue without a git commit
- Restored to true after iOS build was queued
- app.json currently shows iOS buildNumber="90", Android versionCode=64
- NEXT build: iOS must be ≥ 91, Android must be ≥ 65

## Post-build defect (do NOT reopen this release for this)
- business-owner/vibe-tags.tsx, family-plan.tsx, hooks/useFamilyPlan.ts
  use EXPO_PUBLIC_API_URL which is not set in eas.json production env
  → those 3 screens will have empty API base in production
  → not a submission blocker; add EXPO_PUBLIC_API_URL=https://www.mappingwithmelanin.com
    to eas.json production env in the NEXT release cycle

## DO NOT SUBMIT until device smoke test passes
Per Community Beta 1 checklist:
  1. Install TestFlight build (iOS 90) on physical device
  2. Cold launch → sign in → KinfolkAI → Map → business profile
  3. Only submit after hands-on test passes

## Railway production (July 20, 2026)
- API: www.mappingwithmelanin.com → Railway (server: railway-hikari) ✅
- GoDaddy CNAME resolved ✅
- NODE_ENV=production confirmed ✅
- 12/12 smoke tests PASS ✅
- DB schema confirmed: stripe_processed_events, failed_login_attempts,
  locked_until, marketing_opt_out, auth_events all present ✅

## Build commands (for future reference)
- iOS: cd artifacts/mobile && eas build --platform ios --profile production
- Android: cd artifacts/mobile && eas build --platform android --profile production
- Submit iOS: cd artifacts/mobile && eas submit --platform ios --profile production
- Submit Android: cd artifacts/mobile && eas submit --platform android --profile production
- MUST run from artifacts/mobile/ — root picks wrong project config
