---
name: Launch version state
description: Current iOS buildNumber, Android versionCode, version string — check before any EAS build commands.
---

**Current Build (as of July 27 2026):**
- version: 1.1.5
- iOS buildNumber: 97 (Build 97)
- Android versionCode: 71
- eas.json production profile: has `channel: "production"` field ✅

**Build 97 EAS submissions (July 27 2026):**
- iOS Build 97: `ddb83b3e-a6fb-4cfd-bbf2-5773d4e4e011` — FINISHED ✅  
  Artifact: https://expo.dev/artifacts/eas/KNLKNeLS-LfRwJ2ftCDADl_dozFtyX1Oa74f3jvvPUs.ipa
- Android versionCode 71: `926bb936-dc23-4920-ba26-d57e9d0a4455` — started 2026-07-27T20:30 UTC, status pending check

**Why:**  
Always check app.json build numbers before giving build commands. Expo uses these exact values for store submission versioning.

**How to apply:**  
Increment iOS buildNumber and Android versionCode for every EAS production build. Never reuse a build number.
