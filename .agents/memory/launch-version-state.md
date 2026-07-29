---
name: Launch version state
description: Current iOS buildNumber, Android versionCode, version string — check before any EAS build commands.
---

**Current Build (as of July 29 2026):**
- version: 1.1.5
- iOS buildNumber: 100 (commit f938b045)
- Android versionCode: 75 (commit f938b045)
- eas.json production profile: has `channel: "production"` field ✅

**Build 100 EAS submissions (July 29 2026):**
- iOS Build 100: `183a3d97-7eea-4c2f-8c87-dab80a28f55f` — queued, auto-submit to TestFlight ✅
  Submission ID: fb2d0184-1f85-4249-a881-ad90ca6f5faf
- Android versionCode 75: `5c268981-7657-4ba2-8805-ef430d3ac00e` — queued ✅

**Apple Reviewer Account (Build 100):**
- Email: reviewer@melaninmaps.com  Password: MapReview2026!
- User ID: 5a1b220b-6b3f-4195-ba50-2c5a62a2606e
- Tier: navigator | 10 saved businesses | 5 community posts | Login confirmed ✅
- Review notes: docs/reviews/BUILD_100_APPLE_REVIEW_NOTES.md

**Previously submitted (already in stores):**
- iOS Build 99 / Android VC74 — commit 123527c, submitted ~July 29 2026

**Why:**  
Always check app.json build numbers before giving build commands. Expo uses these exact values for store submission versioning.

**How to apply:**  
Increment iOS buildNumber and Android versionCode for every EAS production build. Never reuse a build number.
