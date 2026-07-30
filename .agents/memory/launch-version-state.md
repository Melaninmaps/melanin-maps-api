---
name: Launch version state
description: Current iOS buildNumber, Android versionCode, version string — check before any EAS build commands.
---

**Current Build (as of July 30 2026):**
- version: 1.1.5
- iOS buildNumber: 101 (commit 0450c381)
- Android versionCode: 76 (commit 0450c381)
- eas.json production profile: has `channel: "production"` field ✅

**Build 101 EAS submissions (July 30 2026):**
- iOS Build 101: f37b8d5c-bdb7-4330-bef6-f8456f1ad719 — queued, auto-submit to TestFlight ✅
  iOS Submission ID: a6e62b20-f144-465d-86a8-9a427e39f693
- Android VC76: 7b522362-f2d5-40aa-922a-42915e6641ad — queued, auto-submit to Play Internal ✅
  Android Submission ID: 3b54d4b2-645c-48cc-9de3-d55a938f3010
- Purpose: removes @sentry/react-native native SDK (KSCrash caused pre-JS crash on Build 100)
- JS crash logger (AsyncStorage + Railway POST) remains active

**Previously submitted:**
- iOS Build 100: `183a3d97-7eea-4c2f-8c87-dab80a28f55f` — crashed on launch (Sentry native)
- iOS Build 99 / Android VC74 — commit 123527c, submitted ~July 29 2026

**Why:**  
Always check app.json build numbers before giving build commands. Expo uses these exact values for store submission versioning.

**How to apply:**  
Increment iOS buildNumber and Android versionCode for every EAS production build. Never reuse a build number.
