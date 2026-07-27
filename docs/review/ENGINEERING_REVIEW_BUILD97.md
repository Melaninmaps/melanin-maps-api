# Senior Engineering Review — Mapping With Melanin
**Scope:** Apple App Review rejection root-cause analysis + pre-submission gate audit
**Build target:** iOS Build 97 (version 1.1.5)
**Conducted:** July 27, 2026
**Reviewer:** Replit Agent (full codebase access)

---

## Executive Summary

Build 96 was rejected because Apple's reviewer hit a live database outage at 03:01 AM UTC. The root cause was **a third-party library (`stripe-replit-sync`) creating a new `pg.Pool(max:10)` on every Stripe webhook call**, exhausting Railway Postgres connections. This is confirmed, fixed, and documented. No Apple guideline violation was involved — Apple simply couldn't log in because the backend was down.

Build 97 contains the fix. This review confirms readiness and surfaces four additional issues that must be resolved before the EAS build command runs.

---

## 1. Confirmed Root Cause: StripeSync Pool Leak

**Severity:** P0 — was the direct cause of Build 96 rejection

**Evidence:**
```
stripe-replit-sync/dist/index.js:37 — this.pool = new pg.Pool(config.poolConfig)
stripe-replit-sync/dist/index.js:560 — poolConfig.max = 10 (default)
```

The app called `new StripeSync({ poolConfig })` on **every Stripe webhook event**. Each call created a new `pg.Pool(max:10)` that was never `.end()`'d. After 2–3 webhook events, 20–30 open connections existed outside the app's own pool. Railway's connection limit was exhausted.

**Fix status:** ✅ Fixed in Build 97
- `stripeClient.ts` now uses a promise-based singleton — one `pg.Pool(max:2)` per process
- Stripe pool is drained in graceful shutdown alongside the app pool
- App pool increased from 5→8 (justified by load test showing peak demand of 6 at 30 concurrent users)
- readyz fast-fail corrected: `waiting > 0 && total >= 8 && idle === 0` (true exhaustion, not transient in-use)

**Load test evidence (90 requests, 3 waves, 30 concurrent):**
```
Wave 1: 30/30 ok, p95 492ms
Wave 2: 30/30 ok, p95 317ms
Wave 3: 30/30 ok, p95 356ms
Overall: 100% success, p95 489ms, max 493ms
```

---

## 2. BUG: Duplicate Android Permissions in app.json

**Severity:** P1 — must fix before Build 97 EAS build

**Location:** `artifacts/mobile/app.json` lines 62–88

The `android.permissions` array has 9 permissions declared **exactly twice**:

```json
"android.permission.ACCESS_FINE_LOCATION",   ← appears at lines 63 AND 73
"android.permission.ACCESS_COARSE_LOCATION", ← duplicated
"android.permission.CAMERA",                 ← duplicated
"android.permission.READ_MEDIA_IMAGES",       ← duplicated
"android.permission.READ_EXTERNAL_STORAGE",  ← duplicated
"android.permission.WRITE_EXTERNAL_STORAGE", ← duplicated
"android.permission.INTERNET",               ← duplicated
"android.permission.POST_NOTIFICATIONS",     ← duplicated
"android.permission.RECEIVE_BOOT_COMPLETED", ← duplicated
"android.permission.VIBRATE"                 ← duplicated
```

This has no runtime impact on Android (the manifest deduplicates them), but it is a clear code quality signal to any reviewer and creates unnecessary noise. Fix: remove the first block of duplicates.

---

## 3. RISK: Generic Permission Strings in Info.plist

**Severity:** P1 — Apple has rejected apps for unexplained permission requests

**Location:** `artifacts/mobile/ios/MappingWithMelanin/Info.plist`

Three permission strings were NOT customized and still contain placeholder language:

| Key | Current value | Risk |
|-----|--------------|------|
| `NSFaceIDUsageDescription` | `"Allow $(PRODUCT_NAME) to use Face ID"` | Generic template + unresolved variable. If Apple's review device prompts Face ID access and sees this string, it will flag as incomplete |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | `"Allow $(PRODUCT_NAME) to access your location"` | Generic template + unresolved variable |
| `NSMotionUsageDescription` | `"Allow $(PRODUCT_NAME) to detect your current motion activity"` | Generic template — no feature in the app uses motion |

**The Face ID and Motion strings are particularly problematic.** If the app does not use Face ID for any user-facing feature, the `NSFaceIDUsageDescription` key should not exist at all — its presence suggests the app requests Face ID access that cannot be explained.

**Note:** These keys are in the committed `Info.plist` which is the pre-Expo-managed file. They may be overridden by the EAS build using values from `app.json`'s `infoPlist` block. However, the `infoPlist` block in `app.json` does **not** include `NSFaceIDUsageDescription` or `NSMotionUsageDescription` — so whether the final binary carries the generic string depends on how Expo merges these during the build.

**Action required:** Confirm whether the final built binary contains these strings. If it does, either add correct purpose strings to `app.json`'s `infoPlist` block or remove the keys from `Info.plist` entirely if the features are unused.

---

## 4. RISK: iOS Build Number Not Incremented

**Severity:** P0 — App Store Connect will reject the binary on upload if buildNumber is unchanged

**Location:** `artifacts/mobile/app.json` line 13

```json
"buildNumber": "96"
```

Build 96 was already submitted and rejected. Apple will reject an upload of another build with `buildNumber: "96"`. This **must** be incremented to `97` (or higher) before the EAS build runs.

The `Info.plist` shows `CFBundleVersion: 83` — this is the pre-build artifact from a much earlier build and will be overwritten by EAS. The authoritative source is `app.json`. **Confirm it reads `"buildNumber": "97"` before running `eas build`.**

---

## 5. RISK: Android versionCode Not Verified

**Severity:** P1 — silent rejection if versionCode is lower than previously uploaded

**Location:** `artifacts/mobile/app.json` line 90

```json
"versionCode": 71
```

Per the memory file, the previous Android build was VC66. The value 71 in `app.json` suggests 5 builds have been registered since then. **Confirm that versionCode 71 is higher than whatever was last successfully uploaded to Play Console.** If any versionCode between 67 and 71 was ever uploaded (even a rejected build), the next must be higher than the highest previously uploaded.

---

## 6. RISK: runMigrations Startup Pool (Accepted — Bounded)

**Severity:** P2 — accepted risk, documented

**Location:** `artifacts/api-server/src/index.ts:27-28`

```typescript
const { runMigrations } = await import("stripe-replit-sync");
await runMigrations({ databaseUrl });
```

This creates a `pg.Pool` at startup that is never explicitly `.end()`'d. From package source (lines 2400–2435), this is a one-time migration check, not a recurring call. The pool's connections will be released when Railway Postgres closes them on idle timeout (typically 30s–5min).

**This is NOT the root cause** of the Build 96 outage and has been accepted as bounded risk. Noted for completeness.

---

## 7. Authentication Architecture: Confirmed Clean

**Apple Sign-In compliance:**
- Nonce enforcement: ✅ `expo-crypto` SHA256 nonce, `rawNonce` sent to server, server verifies `SHA256(rawNonce) === payload.nonce`
- Credential revocation: ✅ `AppState` foreground check + `AppleAuthentication.getCredentialStateAsync()`
- Token revocation on delete: ✅ AES-256-GCM encrypted refresh token stored, `revokeAppleToken()` on delete
- Authorization code exchange: handled server-side via JWKS endpoint

**Account deletion (App Store Guideline 5.1.1):**
- Accessible: ✅ Settings → Delete Account
- Confirmation: ✅ `Alert.alert` with destructive styling before any delete action
- Atomic: ✅ `pool.connect()` → `BEGIN/COMMIT/ROLLBACK` → `client.release()` in `finally`
- Apple token revoked: ✅ Server-side revocation on delete
- Stated in Privacy Policy: ✅ `privacy-policy.tsx` documents 30-day window

**Restore Purchases (App Store Guideline 3.1.1):**
- Present: ✅ `RestorePurchasesButton` component at `membership.tsx:1108`
- Implementation: RevenueCat `useSubscription().restore()`

---

## 8. UGC Compliance (App Store Guideline 1.2)

All required mechanisms confirmed:

| Requirement | Status |
|-------------|--------|
| Report mechanism | ✅ `ReportContentModal` on business profiles and community posts |
| Community Guidelines | ✅ In-app `community-standards.tsx` screen |
| Terms of Service | ✅ In-app `terms.tsx` screen |
| Privacy Policy | ✅ In-app `privacy-policy.tsx` screen |
| Contact email | ✅ `hello@mappingwithmelanin.com` in privacy policy |
| Admin moderation | ✅ Admin panel with reports management |

---

## 9. Permission Strings Audit

Permissions declared in `app.json` (authoritative for EAS builds):

| Permission | Purpose String | Assessment |
|------------|----------------|-----------|
| Location (when in use) | "...show nearby minority-owned businesses and community safety information." | ✅ Specific and accurate |
| Camera | "...update your profile photo." | ✅ |
| Photo Library (read) | "...choose a profile picture." | ✅ |
| Photo Library (write) | "...saves photos to your library." | ✅ |
| Notifications | "...nearby businesses, community safety alerts, and activity in your circles." | ✅ |
| Microphone (via expo-audio plugin) | "...send voice messages to Kinfolk AI." | ✅ |
| Contacts (via expo-contacts plugin) | "...find friends who are already on the platform." | ✅ |
| UserDefaults privacy manifest | Reason CA92.1 | ✅ |
| App Tracking Transparency | Not declared (no tracking) | ✅ Correct |
| Encryption | `ITSAppUsesNonExemptEncryption: false` | ✅ |

**Note on Info.plist:** The committed `Info.plist` also contains `NSLocationAlwaysAndWhenInUseUsageDescription` with a generic string. Since the app requests location only "when in use," the `Always` variant should not exist. Verify the EAS build output does not include this key.

---

## 10. API Stability Architecture

**Health monitoring:**
- `/api/healthz` — process liveness only (fast, no DB probe)
- `/api/readyz` — DB-aware readiness: pool stats → `SELECT 1` with 3s timeout → 503 if pool truly exhausted (`waiting > 0 && total >= 8 && idle === 0`)
- `/api/readyz/history` — 12.5-hour ring buffer of 5-minute checks

**Resilience:**
- `withDbRetry` applied to 5 critical routes: `POST /auth/apple`, `POST /auth/login-email`, `POST /auth/register`, `GET /auth/check-username`, `GET /businesses`
- Single retry after 500ms on `ECONNRESET`, `ETIMEDOUT`, pool timeout errors
- No retry on validation, auth, or duplicate-key errors

---

## Pre-Submission Checklist: Required Before `eas build`

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | **Increment `buildNumber` to `97`** in `app.json` | Agent | ⬜ Required |
| 2 | **Remove duplicate Android permissions** from `app.json` | Agent | ⬜ Required |
| 3 | **Audit Info.plist permission strings** — remove or fix NSFaceIDUsageDescription, NSMotionUsageDescription, NSLocationAlwaysAndWhenInUseUsageDescription | Agent | ⬜ Required |
| 4 | Railway service restarted manually | Founder | ⬜ Required |
| 5 | `GET https://www.mappingwithmelanin.com/api/readyz` → `status: ok` | Agent | ⬜ After step 4 |
| 6 | Railway log 24-hour audit — zero error entries | Agent | ⬜ After step 4 |
| 7 | 12-hour health monitor window — 100% uptime | Auto | ⬜ After step 4 |
| 8 | Review account created and confirmed in ASC | Agent + Founder | ⬜ After step 4 |
| 9 | Fresh Apple Sign-In on production binary (physical device) | Founder/tester | ⬜ |
| 10 | iPad layout verification (simulator acceptable) | Founder/tester | ⬜ |
| 11 | RevenueCat IAP products confirmed available to Apple sandbox | Founder | ⬜ |
| 12 | ASC metadata reviewed (screenshots, description, support URL) | Founder | ⬜ |

---

## Files Requiring Changes Before Build

| File | Change |
|------|--------|
| `artifacts/mobile/app.json` | Increment `buildNumber` from `"96"` to `"97"` |
| `artifacts/mobile/app.json` | Remove first block of 9 duplicate Android permissions |
| `artifacts/mobile/ios/MappingWithMelanin/Info.plist` | Remove or fix NSFaceIDUsageDescription, NSMotionUsageDescription, NSLocationAlwaysUsageDescription, NSLocationAlwaysAndWhenInUseUsageDescription |

---

## What Is NOT an Issue

- **Apple Sign-In code logic:** Clean. Nonce, revocation, and token exchange all correct.
- **Account deletion:** Fully compliant with 5.1.1.
- **UGC reporting:** All mechanisms in place.
- **IAP restore:** Present and using RevenueCat.
- **Privacy manifest:** UserDefaults reason CA92.1 declared.
- **Encryption compliance:** `ITSAppUsesNonExemptEncryption: false` declared.
- **App Transport Security:** `NSAllowsArbitraryLoads: false`, only local networking exception (correct for development, acceptable for production if needed for OTA updates).
- **The primary rejection cause:** Fixed. Was backend infrastructure, not a guideline violation.
