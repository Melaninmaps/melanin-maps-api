---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 12, 2026)

## iOS
- **buildNumber in app.json: 22**
- Build 20: currently "Waiting for Review" in App Store Connect (submitted, active)
- Build 21: uploaded to Apple's servers previously (counts as "used" even without review)
- Build 22: set in app.json, ready for next build if needed
- **autoIncrement: true in eas.json — EAS now queries Apple automatically before each build. No manual tracking needed.**
- Pending Apple response: Guideline 2.3.10 — metadata references third-party platforms. Must reply to Apple message in App Store Connect before resubmitting.
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **versionCode in app.json: 45**
- Build versionCode 45: built on July 12, 2026 — check if finished, then submit
- **autoIncrement: true in eas.json — EAS now queries Google automatically before each build. No manual tracking needed.**
- Submit command: `eas submit --platform android --profile production`
- Google Play service account key: `./google-service-account.json` (must exist in artifacts/mobile)
- Track: internal

## Key reminders
- **autoIncrement: true is set** — EAS handles build numbers automatically going forward
- EAS builds: always instruct user to run from their own terminal (never from Replit agent bash)
- Build iOS: `cd artifacts/mobile && eas build --platform ios --profile production`
- Submit iOS: `cd artifacts/mobile && eas submit --platform ios --profile production`
- Build Android: `cd artifacts/mobile && eas build --platform android --profile production`
- Submit Android: `cd artifacts/mobile && eas submit --platform android --profile production`
- eas.json production android has `credentialsSource: "local"` — do not change this
