---
name: Launch version state
description: Current iOS buildNumber, Android versionCode, version string — check before any EAS build commands.
---

**Current Build (as of Aug 7 2026):**
- version: 1.1.5
- iOS buildNumber: 102
- Android versionCode: 77 (EAS build 853a927e, submission 13bc8a66)
- eas.json production profile: has `channel: "production"` field ✅
- Android VC77 auto-submitted to Play Internal track; release notes: "All features free. In-App Purchases removed. Community platform update."

**Build 101 EAS submissions (July 30 2026) — SECOND ATTEMPT (first errored):**
- iOS Build 101: 2f46adcc-fbac-47a5-b830-0d74a78fc940 — queued, auto-submit to TestFlight ✅
  iOS Submission ID: 08b68cee-d37e-44fb-a6d8-7485a41ea6e5
- Android VC76: 9dc3377e-1642-453b-aa68-3df86b04cdf4 — queued, auto-submit to Play Internal ✅
  Android Submission ID: c7964b7d-0526-422e-b2a9-55ea9f6d8409
- First attempt errored: app/debug/crash-log.tsx still imported @sentry/react-native after package removal
- Purpose: removes @sentry/react-native native SDK (KSCrash caused pre-JS crash on Build 100)
- JS crash logger (AsyncStorage + Railway POST) remains active

**Previously submitted:**
- iOS Build 100: `183a3d97-7eea-4c2f-8c87-dab80a28f55f` — crashed on launch (Sentry native)
- iOS Build 99 / Android VC74 — commit 123527c, submitted ~July 29 2026

**Why:**  
Always check app.json build numbers before giving build commands. Expo uses these exact values for store submission versioning.

**How to apply:**  
Increment iOS buildNumber and Android versionCode for every EAS production build. Never reuse a build number.
