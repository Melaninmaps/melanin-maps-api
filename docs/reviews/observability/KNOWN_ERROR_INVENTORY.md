# Known Error Inventory — Mapping With Melanin™
## Manus Review Package — Build 97
**Date:** July 27, 2026
**Coverage window:** Last 30 days (where records exist)

---

## ⚠️ Critical Gap: No Mobile Crash Reporting System

**Mapping With Melanin™ does not have a mobile crash reporting system (Sentry, Bugsnag, Crashlytics, or equivalent) installed.**

This means:
- Native iOS crashes (signal 11, signal 6, OOM) are **invisible** without device logs
- React Native JS exceptions are **invisible** unless the user reports them
- Crash frequency, affected OS versions, and affected device models are **unknown**
- Apple's App Store Connect and TestFlight crash reports are the only source of mobile crash data — and they require builds to be distributed before generating data
- No stack traces, no breadcrumbs, no affected user counts are available for any pre-Build 97 crash

**Manus should assess whether this is acceptable for 30 testers and Apple review.** Recommendation: Install Sentry or equivalent before Build 97 is distributed to testers.

---

## Known Confirmed Errors

### ERR-001 — DB Pool Exhaustion / Auth Failure (Build 96)

| Field | Value |
|-------|-------|
| Timestamp | July 27, 2026, 03:01 UTC (peak); also 20:31 and 22:59 UTC prior evening |
| Platform | iOS (Apple review device), Web |
| Build | 96 |
| Screen / Route | `POST /api/auth/apple`, `POST /api/auth/login-email`, `POST /api/auth/register`, `GET /api/businesses` |
| Error | HTTP 500 — "timeout exceeded when trying to connect" from pg.Pool |
| User Impact | All authentication failed — app was non-functional for Apple reviewer |
| Frequency | 3 confirmed episodes in ~6-hour window |
| Root Cause | StripeSync per-webhook `new pg.Pool(max:10)` exhausted Railway Postgres connections |
| Fix Status | ✅ Code fixed in Replit dev — NOT yet deployed to Railway production |
| Regression Test | Load test: 30 concurrent users, 100% success at 8+2=10 max connections (Replit env) |
| Severity | **P0 — Caused Apple rejection** |

---

### ERR-002 — Map Load Failure on iOS (Historical, Pre-Build 97)

| Field | Value |
|-------|-------|
| Timestamp | Noted in project memory as "Android VC66 regression" era |
| Platform | iOS (also affected Android) |
| Build | Pre-VC67/pre-97 |
| Screen / Route | Map tab — `react-native-maps` |
| Error | `StyleSheet.absoluteFillObject` removed in RN 0.86 — resolves to `undefined` at runtime; MapView gets zero size, `onMapReady` never fires, screen stays black |
| User Impact | Map tab non-functional |
| Frequency | Consistent — reproducible |
| Root Cause | RN 0.86 breaking change: `StyleSheet.absoluteFillObject` removed |
| Fix Status | ✅ Fixed (explicit position coords or `StyleSheet.absoluteFill`) — in builds from VC67 onward |
| Regression Test | Not formally documented |
| Severity | P0 (historical) — resolved |

---

### ERR-003 — Apple Sign-In Nonce Enforcement (Historical, iOS 26+)

| Field | Value |
|-------|-------|
| Timestamp | July 2026 (iOS 26 enforcement) |
| Platform | iOS 26+ |
| Build | Pre-fix |
| Screen / Route | Apple Sign-In flow |
| Error | iOS 26+ enforces cryptographic nonce — without it, `signInAsync` rejects the credential |
| User Impact | Apple Sign-In would fail on iOS 26+ devices |
| Root Cause | iOS 26 hardened nonce requirement |
| Fix Status | ✅ Fixed — client uses `expo-crypto` `getRandomBytesAsync(32)` + SHA256, passes `hashedNonce` to `signInAsync`, `rawNonce` to server; server verifies `SHA256(rawNonce)===payload.nonce` |
| Regression Test | Not formally documented — requires physical iOS 26 device test |
| Severity | P0 (historical) — resolved for iOS 26+ |

---

### ERR-004 — Expo SDK Version Mismatch (Historical)

| Field | Value |
|-------|-------|
| Timestamp | Prior to Build 96 |
| Platform | Android |
| Error | Mismatched expo-* package versions (e.g. 56.x on SDK 54) caused `NoClassDefFoundError` on Android launch |
| Fix Status | ✅ Resolved — project is on Expo SDK 57 / React Native 0.86 consistently |
| Severity | P0 (historical) — resolved |

---

### ERR-005 — Duplicate Android Permissions in app.json (Build 96)

| Field | Value |
|-------|-------|
| Timestamp | July 27, 2026 (discovered during Build 97 prep) |
| Platform | Android |
| Build | 96 (and prior) |
| Error | 9 Android permissions listed twice each in `app.json` |
| User Impact | Potential Play Store lint warnings; no confirmed user-visible impact |
| Fix Status | ✅ Fixed in `app.json` for Build 97 |
| Severity | P1 |

---

### ERR-006 — Spurious iOS Permission Strings (Build 96)

| Field | Value |
|-------|-------|
| Timestamp | July 27, 2026 (discovered during Build 97 prep) |
| Platform | iOS |
| Build | 96 |
| Error | 4 iOS permission strings in Info.plist using unresolved template variable `$(PRODUCT_NAME)` and unexplained permission declarations (FaceID, Motion, Location Always) |
| User Impact | Apple may flag unresolved template variables or unexplained permission requests |
| Fix Status | ✅ Removed from `artifacts/mobile/ios/.../Info.plist` for Build 97 |
| Severity | P1 |

---

### ERR-007 — react-native-maps iOS Pod Failure (Historical)

| Field | Value |
|-------|-------|
| Timestamp | Prior to Build 96 |
| Platform | iOS |
| Error | Setting `ios.config.googleMapsApiKey` in `app.config.js` triggers Expo's Maps.js to inject `pod 'react-native-google-maps'` — the npm package has no such podspec — all iOS builds fail |
| Fix Status | ✅ Fixed — key removed from iOS config in `app.config.js`; project uses `withRnMapsPodfileFix` plugin |
| Severity | P0 (historical) — resolved |

---

## Observability Infrastructure Assessment

| System | Status | Coverage |
|--------|--------|----------|
| Mobile crash reporting (Sentry/Bugsnag) | ❌ **Not installed** | None |
| Railway API logs | ✅ Available | Server-side errors, DB events |
| Railway deployment history | ✅ Available | Restart events, deployment events |
| Railway CPU/memory metrics | ✅ Available in Railway dashboard | Not exported to project |
| Railway Postgres metrics | ✅ Available in Railway dashboard | Not exported to project |
| App Store Connect crashes | ✅ Available after TestFlight distribution | No data yet for Build 97 |
| TestFlight crash reports | ✅ Available after TestFlight distribution | No data yet for Build 97 |
| Google Play Android Vitals | ✅ Available after Play distribution | Limited data (internal track) |
| Sentry / Bugsnag / similar | ❌ Not configured | None |
| Authentication error counts | 🔶 Partially — Railway logs show errors but no structured count | Manual log inspection only |
| HTTP 4xx/5xx counts | 🔶 Railway logs — no dashboarding | Manual log inspection only |
| API latency percentiles | 🔶 Pino-http logs include response time | No dashboard |
| KinfolkAI failures | 🔶 Logged via pino to Railway | No structured count |
| DB connection failures | ✅ Logged via pool error events | In Railway logs |
| Stripe webhook errors | 🔶 Logged | No dashboard |

### `/api/readyz/history` — 12-Hour Health Monitor

The API server runs a 5-minute synthetic DB health check and stores the last 12 hours in an in-memory ring buffer. Accessible at:
```
GET /api/readyz/history
```
This provides structured evidence of DB availability over time. **This endpoint exists in code but is running against the pre-fix server on Railway. The ring buffer will show failures if pool exhaustion is occurring.**

---

## Questions for Manus

1. Is the current observability infrastructure sufficient for 30 testers? What minimum crash reporting would you recommend before TestFlight distribution?
2. Is pino-structured logging to Railway sufficient for Apple review support, or is a dedicated APM/crash tool required?
3. Should Sentry or a similar SDK be added as a condition of Build 97 acceptance?
4. What Railway metrics should be monitored during the first 48 hours after tester distribution?
