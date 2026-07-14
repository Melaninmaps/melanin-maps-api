---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 14, 2026)

## iOS
- **buildNumber in app.json: 27**
- Build 26: "Waiting for Review" in App Store Connect (submitted July 14, 2026)
- Build 27: pending — fixes Apple Sign-In nonce double-hash bug (login.tsx + signup.tsx)
- **autoIncrement: true in eas.json — EAS queries Apple automatically before each build. No manual tracking needed.**
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app
- Rejection history: Guideline 2.1a (API offline during review — now fixed); IAP violations fixed in build 26

## Android
- **versionCode in app.json: 46**
- Upload key mismatch pending Google reset (~48hr from July 12, 2026)
- **autoIncrement: true in eas.json — EAS now queries Google automatically before each build. No manual tracking needed.**
- Submit command: `eas submit --platform android --profile production`
- Google Play service account key: `./google-service-account.json` (must exist in artifacts/mobile)
- Track: internal

## Key reminders
- **autoIncrement: true is set** — EAS handles build numbers automatically going forward
- EAS builds: always instruct user to run from their own terminal (never from Replit agent bash)
- Build iOS: `cd artifacts/mobile && eas build --platform ios --profile production`
- Submit iOS: `cd artifacts/mobile && eas submit --platform ios --profile production`
- Build Android: `cd artifacts/mobile && eas build --platform android --profile production`
- Submit Android: `cd artifacts/mobile && eas submit --platform android --profile production`
- eas.json production android has `credentialsSource: "local"` — do not change this

## Railway production fixes applied July 14, 2026
- RESEND_API_KEY: was wrong key (no activity) — replaced with correct Production key
- DATABASE_URL: was hardcoded public proxy URL — replaced with ${{ Postgres.DATABASE_URL }} (internal network)
- Both fixes confirmed working: registration returns 201, emails will now send
