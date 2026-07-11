---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 11, 2026)

## iOS
- **buildNumber in app.json: 20** — build 19 was rejected (3 guidelines: 2.1(a) iPad sign-in, 2.3.10 screenshots, 3.1.1 IAP)
- **RULE: Before every iOS build, read app.json buildNumber, confirm it is higher than the last submitted build, increment by 1.**
- Build 20 includes: iPad SSO sign-in fix, "Restore Purchases" button, better IAP loading state
- Build profile: `production`, credentialsSource: `local`
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **versionCode in app.json: 44**
- **RULE: Before every Android build, read app.json versionCode, confirm it is higher than any versionCode ever submitted to Play Console, then increment by 1.**
- Build profile: `production` → produces `.aab`, `credentialsSource: remote`

## Key reminders
- **ALWAYS check and increment build numbers before every build** — wasted builds cost real money
- Before iOS build: grep app.json for buildNumber, confirm > last submitted, set to next integer
- Before Android build: grep app.json for versionCode, confirm > last submitted, set to next integer
- EAS builds: always instruct user to run from their own terminal (never from Replit agent bash)
- Build + auto-submit iOS: `cd artifacts/mobile && eas build --platform ios --profile production --auto-submit`
- Build Android only: `cd artifacts/mobile && eas build --platform android --profile production`
- eas.json production android has `credentialsSource: "remote"` — do not remove this
- eas.json has `autoIncrement: false` — build numbers MUST be manually updated in app.json before each build
