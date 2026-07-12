---
name: App Store submission checklist
description: Owner requested reminder at next session start — work through these before running eas build
---

# App Store Submission Checklist

**REMIND THE OWNER AT THE START OF THE NEXT SESSION.**
They asked to pick this up the following day (noted July 12, 2026 evening).

## Items to work through together

1. **Demo credentials** — create a test business owner account + test consumer account to paste into App Store Connect reviewer notes. Without these, Apple can't test auth-gated features.

2. **Privacy nutrition labels** — audit and declare in App Store Connect:
   - Location (when in use — map, neighborhood safety)
   - Email address / phone number (auth)
   - User ID / device ID (sessions)
   - Usage data (analytics)
   - User-generated content (community feed, reviews, safety surveys)

3. **Content moderation disclosure** — community feed + reviews requires a visible report/moderation mechanism. Confirm the report flow is discoverable to a first-time reviewer.

4. **Release notes draft** — I can write these; owner needs to paste into App Store Connect.

5. **Version bump** — bump `buildNumber` (iOS) and `versionCode` (Android) in `artifacts/mobile/app.json` before build. Current as of July 11: iOS build 20, Android versionCode 44, version 1.1.2. Next build needs those incremented.

6. **Run build from owner's terminal** (Replit sandbox blocks git/EAS):
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios
   ```

7. **App Store Connect settings** — set release to "Automatically release upon approval" so it goes live without a manual step.

## Why this matters
App has payments (Stripe/RevenueCat), user content (community feed, reviews), location, and phone auth — each adds an Apple review touchpoint. Missing demo creds or inaccurate privacy labels are the top rejection causes for apps at this stage.
