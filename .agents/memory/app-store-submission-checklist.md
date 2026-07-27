---
name: App Store submission checklist
description: iOS/Android build status and submission checklist — updated July 16 2026
---

# App Store Submission Checklist

## Current build state (July 16 2026)
- iOS buildNumber: **57** (version 1.1.5) — next build to attempt
- Android versionCode: **56** (version 1.1.5) — Android build running/pending result

## iOS pod install fix (react-native-maps)
The `withRnMapsPodfileFix.js` plugin now injects Ruby into the **Podfile** (not node_modules).
This is the only approach that survives `pnpm install --no-frozen-lockfile` in the PREBUILD phase.
Do NOT revert to node_modules patching — it gets reset every build.

## Items to work through for App Store submission

1. **Demo credentials** — create a test business owner account + test consumer account for reviewer notes.

2. **Privacy nutrition labels** — declare in App Store Connect:
   - Location (when in use)
   - Email / phone (auth)
   - User ID / device ID (sessions)
   - Usage data, user-generated content

3. **Content moderation disclosure** — confirm report flow is discoverable.

4. **Release notes** — draft in App Store Connect.

5. **Run EAS build from owner's terminal** (always from `artifacts/mobile/`):
   ```bash
   cd artifacts/mobile && eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```
