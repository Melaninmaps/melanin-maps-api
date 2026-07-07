---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 7, 2026)

## Android
- **versionCode in app.json: 41** — versionCode 40 was already consumed by Play Console (rejected July 7 2026)
- **RULE: Before every Android build, read app.json versionCode, confirm it is higher than any versionCode ever submitted to Play Console, then increment by 1.**
- Build profile: `production` → produces `.aab`, `credentialsSource: remote`

## iOS
- buildNumber in app.json: 15
- Track: TestFlight / App Store Connect

## Key reminders
- **versionCode must ALWAYS be incremented before every Android build** — wasted builds cost real money
- Before build: grep app.json for versionCode, confirm > max previously submitted, increment +1
- Android: Safari renames .aab to .zip — right-click → rename → change extension to .aab before uploading
- iOS: use Transporter on Mac to upload IPA
- EAS builds: always run from user's terminal (`cd artifacts/mobile` first), NEVER from Replit agent
- eas.json production android has `credentialsSource: "remote"` — do not remove this
- Build command: `cd artifacts/mobile && eas build --platform android --profile production`
- Submit command: `cd artifacts/mobile && eas submit --platform android --profile production`
