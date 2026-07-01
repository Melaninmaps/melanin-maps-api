---
name: Launch version state
description: Current app store submission state as of July 1, 2026 — Android and iOS build versions and track status.
---

# Launch Version State (as of July 1, 2026)

## Android
- versionCode in app.json: 32 (next build to use)
- Release 30 (1.0.3): Live to closed testers now (Closed testing - MWM, 14 testers)
- Release 31 (1.0.3): In Google review (old code, pre-new features)
- Release 32: Needs to be built and uploaded — contains new features (DMs, @mentions, minority expansion, smart promotions)
- 14-day closed testing clock: running, check Publishing overview for progress
- To build: cd artifacts/mobile && eas build --platform android --profile production --no-wait

## iOS
- buildNumber in app.json: 11
- Build submitted via Transporter and eas submit on Jul 1, 2026 — Waiting for Apple review (24-48 hrs)
- TestFlight Build 9: Live to MWM Testers group now
- Once Apple approves → goes live publicly on App Store

## Key reminders
- Android versionCode must always increase; current approved max is 31, next must be 32+
- iOS: use Transporter on Mac to manually upload IPA (Safari downloads .ipa correctly)
- Android: Safari renames .aab to .zip — right-click → rename → change extension to .aab before uploading to Play Console
- EAS builds: always run from user's terminal (cd artifacts/mobile first), never from main agent
- eas.json production android has credentialsSource: "remote" — do not remove this
