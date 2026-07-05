---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 5, 2026)

## Android
- **versionCode in app.json: 37** (next build to use — 36 was already consumed by Play Console)
- versionCode 36 was rejected: "Version code 36 has already been used" — bumped to 37
- Always check Play Console's Latest releases and bundles before building to confirm the max used versionCode
- Build profile: `production` → produces `.aab` (App Bundle), `credentialsSource: remote`

## iOS
- buildNumber in app.json: 11
- Track status: check App Store Connect for current review state

## Key reminders
- **versionCode must ALWAYS be incremented before every Android build** — check app.json before running eas build
- Before build: grep app.json for versionCode, confirm it is higher than any previously submitted build
- Android: Safari renames .aab to .zip — right-click → rename → change extension to .aab before uploading to Play Console
- iOS: use Transporter on Mac to manually upload IPA
- EAS builds: always run from user's terminal (`cd artifacts/mobile` first), NEVER from Replit agent
- eas.json production android has `credentialsSource: "remote"` — do not remove this
- Build command: `cd artifacts/mobile && eas build --platform android --profile production`
- Submit command: `cd artifacts/mobile && eas submit --platform android --profile production`
