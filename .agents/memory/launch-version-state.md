---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 9, 2026)

## iOS
- **buildNumber in app.json: 18** — build 17 was the last submitted to App Store Connect (rejected, subscriptions not attached)
- **RULE: Before every iOS build, read app.json buildNumber, confirm it is higher than the last submitted build, increment by 1.**
- Build 18 is the current build being submitted — includes cookie banner removal and targets App Store submission with subscriptions
- Build profile: `production`, credentialsSource: `local`
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **versionCode in app.json: 42**
- **RULE: Before every Android build, read app.json versionCode, confirm it is higher than any versionCode ever submitted to Play Console, then increment by 1.**
- Build 41 (.aab) is ready to upload to Google Play — upload key hold expires July 9 2026 at 1:06 AM EST
- Build profile: `production` → produces `.aab`, `credentialsSource: remote`

## Key reminders
- **ALWAYS check and increment build numbers before every build** — wasted builds cost real money
- Before iOS build: grep app.json for buildNumber, confirm > last submitted, set to next integer
- Before Android build: grep app.json for versionCode, confirm > last submitted, set to next integer
- EAS builds: always run from Replit Shell tab (`cd artifacts/mobile` first), NEVER triggered by agent bash tool
- Build + auto-submit iOS: `cd artifacts/mobile && eas build --platform ios --profile production --auto-submit`
- Build Android only: `cd artifacts/mobile && eas build --platform android --profile production`
- eas.json production android has `credentialsSource: "remote"` — do not remove this
- eas.json has `autoIncrement: false` — build numbers MUST be manually updated in app.json before each build
