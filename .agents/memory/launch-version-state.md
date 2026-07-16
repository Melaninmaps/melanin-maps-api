---
name: Launch version state
description: Current app store submission state — Android and iOS build versions and track status. Update this every build.
---

# Launch Version State (as of July 16, 2026)

## iOS
- **Next build: auto-incremented by EAS from 40 — will be 41+**
- v1.1.5 (bumped from 1.1.4 — includes Cultural Heritage Explorer, Living Heritage Places, External Click Tracking)
- **autoIncrement: true in eas.json — EAS queries Apple automatically before each build. No manual tracking needed.**
- App Store Connect App ID: 6783773366, Apple Team: Y46Y4A5MMZ, Bundle ID: com.melaninmaps.app

## Android
- **Next build: auto-incremented by EAS from 51 — will be 52+**
- v1.1.5
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

## Railway redeployment pattern
- Push dist to Melaninmaps/melanin-maps-api GitHub repo (requires PAT — password auth disabled)
- Trigger via Railway GraphQL: serviceInstanceDeploy(serviceId, environmentId, latestCommit: true)
- Service: a77b49bb-e448-4be8-9d02-de7a3b43136b, Environment: 2292b38f-3d0d-4cad-92a4-ad36cabda629
