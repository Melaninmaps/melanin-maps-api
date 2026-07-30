---
name: Launch version state
description: Current iOS buildNumber, Android versionCode, version string — check before any EAS build commands.
---

**Current Build (as of July 30 2026):**
- version: 1.1.5
- iOS buildNumber: 101 (commit 0450c381)
- Android versionCode: 76 (commit 0450c381)
- eas.json production profile: has `channel: "production"` field ✅

**Build 101 purpose:**
- Removes @sentry/react-native native SDK — caused pre-JS native crash for ALL testers on Build 100
- Root cause: KSCrash auto-init before JS with undefined SENTRY_ORG/SENTRY_PROJECT
- JS crash logger (AsyncStorage + Railway POST) remains active
- Build 101 NOT yet submitted — founder must run: cd artifacts/mobile && eas build --platform ios --profile production --auto-submit

**Previously submitted:**
- iOS Build 100: `183a3d97-7eea-4c2f-8c87-dab80a28f55f` — crashed on launch (Sentry native)
- iOS Build 99 / Android VC74 — commit 123527c, submitted ~July 29 2026

**Why:**  
Always check app.json build numbers before giving build commands. Expo uses these exact values for store submission versioning.

**How to apply:**  
Increment iOS buildNumber and Android versionCode for every EAS production build. Never reuse a build number.
