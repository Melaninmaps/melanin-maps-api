---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 24, 2026)

## iOS Build 96 — SUBMITTED TO APPLE (July 24, 2026)
- EAS Build ID: fa7ac51c-29ba-43d0-b440-b920ec6b290a
- Submission ID: c63f908d-cbaf-4d4b-9255-c1912b0d3b7b
- Build URL: https://expo.dev/accounts/tlindsay428/projects/mobile/builds/fa7ac51c-29ba-43d0-b440-b920ec6b290a
- Version: 1.1.5, Build number: 96
- Android versionCode: 71 (unchanged)
- Profile: production, ASC App ID: 6783773366
- Key changes in 96:
  - Heritage Sites fully disabled in FullMapView (HERITAGE_SITES_ENABLED = false)
  - logger.ts err.cause serializer deployed to Railway (commit 3c9ad6af)
  - All 6 production verification gates passed before build
- Railway deployment: b25d498e (SUCCESS, commit 3c9ad6af7d10e19a235dd3314b85dc8ea32aae8d)

## Android versionCode 71 — CURRENT (not submitted to Play Store)
- Version: 1.1.5, versionCode: 71
- Status: Available to testers
- Next Android build: versionCode 72 — when needed

## App Store identifiers
- App Store Connect App ID: 6783773366
- Apple Team: Y46Y4A5MMZ
- Bundle ID: com.melaninmaps.app (iOS + Android)
- EAS submit appleId: tlindsay428@yahoo.com

## Build commands
- iOS: cd artifacts/mobile && GIT_INDEX_FILE=/tmp/eas-git-index EAS_SKIP_AUTO_FINGERPRINT=1 eas build --platform ios --profile production --non-interactive
- Android: cd artifacts/mobile && GIT_INDEX_FILE=/tmp/eas-git-index EAS_SKIP_AUTO_FINGERPRINT=1 eas build --platform android --profile production --non-interactive
- Submit iOS: cd artifacts/mobile && eas submit --platform ios --profile production
- MUST run from artifacts/mobile/ — root picks wrong project config

# Historical record

## iOS Build 95 — SUBMITTED TO APPLE REVIEW (July 22, 2026)
- Version: 1.1.5, Build number: 95
- Status: Saved for Apple review (submitted July 22, 2026)
- Key changes in 95: Apple Sign-In working (APPLE_KEY_ID corrected Z2NB4XAZY7), TN3194 revocation stored, nonce enforced
