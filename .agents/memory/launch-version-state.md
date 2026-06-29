---
name: Launch version state
description: Current app store submission state as of June 29, 2026 — Android and iOS build versions and track status.
---

# Launch Version State (as of June 29, 2026)

## Android
- versionCode: 29, version: 1.0.3, buildNumber: 9
- EAS build ID: 4daab8ec-71ce-4bbb-8963-ca1ceab93334
- Status: Submitted to Play Store closed testing (track: Closed testing - MWM)
- Google review in progress — expected approval July 1-2

## iOS
- version: 1.0.3, buildNumber: 9
- EAS build ID: 2ca2b460-f370-43b3-88c4-1e5778de19cd
- Status: IPA uploaded via Transporter, processing in TestFlight
- Previous submission (v1.0.0) was developer-rejected (removed before Apple reviewed it)
- Next step: install via TestFlight on device, then submit for App Store review

## Key fix in both builds
- Added `react-native-worklets/plugin` to babel.config.js
- This was the root cause of the startup crash on real devices

## Next version code to use
- Android: 30
- iOS buildNumber: 10
