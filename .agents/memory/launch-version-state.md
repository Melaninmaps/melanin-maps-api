---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 15, 2026)

## iOS
- **buildNumber 38 — built July 15 2026, pending eas submit to TestFlight**
- v1.1.4, EAS auto-incremented 36→37→38 across two back-to-back build runs
- Build 38 includes: email login timeout fix (30s), password reset improvements, full pre-submission audit
- **autoIncrement: true in eas.json — EAS queries Apple automatically before each build. No manual tracking needed.**
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **versionCode 50 — not yet built for v1.1.4, build in progress July 15 2026**
- Submit command: `eas submit --platform android --profile production`
- Google Play service account key: `./google-service-account.json` (must exist in artifacts/mobile)
- Track: internal
- **autoIncrement: true in eas.json — EAS now queries Google automatically before each build. No manual tracking needed.**

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

## Railway redeployment (July 15, 2026)
- v1.1.3 dist pushed to Melaninmaps/melanin-maps-api GitHub repo and deployed via GraphQL mutation
- /api/vibes/list confirmed live on Railway production
- GitHub push requires PAT (password auth disabled); Railway CLI broken — use GraphQL only
- GraphQL mutation: serviceInstanceDeploy(serviceId, environmentId, latestCommit: true)
