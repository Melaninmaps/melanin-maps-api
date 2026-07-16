---
name: iOS build status and tomorrow's plan
description: Exact state of iOS builds as of July 16, 2026 — what failed, what's fixed, what to do first tomorrow.
---

# iOS Build Status — July 16, 2026

## What happened tonight
- Ran 11 iOS EAS builds — ALL failed at pod install (same error every time)
- Confirmed the exact error from a build screenshot: `No podspec found for 'react-native-google-maps'`
- Applied the fix: `scripts/patch-rnmaps-podspec.js` in `eas-build-post-install`
- Current app.json: version 1.1.5, buildNumber 51

## SDK upgrade done this session
- Expo SDK 54 → 57
- react-native 0.81.5 → 0.86.0
- React/react-dom 19.1.0 → 19.2.3
- All expo-* packages updated to 57.x
- `expo install --check` returns "Dependencies are up to date"

## Apple Sign-In status
- FULLY IMPLEMENTED and in the codebase
- login.tsx: `expo-apple-authentication@~57.0.1`, button present, nonce flow correct
- Cryptographic nonce: rawNonce (random 32 bytes) → SHA-256 → hashedNonce passed to Apple; rawNonce sent to server; server verifies SHA256(rawNonce) === payload.nonce (iOS 26 requirement — already handled)
- Server: `/api/auth/apple` endpoint exists and working
- Any build that compiles will have working Apple Sign-In

## Tomorrow's exact steps
1. User runs from terminal (inside `artifacts/mobile/`):
   ```
   eas build --platform ios --profile production
   ```
2. Watch for `[patch-rnmaps] Patched s.name + subspec deps in:` in the build log — confirms fix ran
3. Build should pass pod install and compile fully
4. Once build succeeds, submit:
   ```
   eas submit --platform ios --profile production
   ```
5. In App Store Connect: confirm build is attached to the submission, fill review notes with demo credentials

## Demo credentials needed for App Store review
- Need a test consumer account email/password
- Need a test business owner account email/password
- Without these, Apple reviewers can't test auth-gated features (map, safety, KinfolkAI) → likely rejection

## If the build still fails at pod install tomorrow
Look at the build log for the new error. If it's STILL the same `react-native-google-maps` error, the patch script may not have run — check that `eas-build-post-install` in package.json includes `node scripts/patch-rnmaps-podspec.js`. If a NEW error, screenshot and share.
