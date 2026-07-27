# External Engineering Review Package
**App:** Mapping With Melanin™
**Platform:** iOS (React Native / Expo)
**Bundle ID:** `com.melaninmaps.app`
**ASC App ID:** 6783773366
**Apple Team ID:** Y46Y4A5MMZ
**Current submission target:** iOS Build 97, version 1.1.5
**Prepared:** July 27, 2026

---

## 1. Apple App Review Rejection Details

### Build 96 — Rejection (July 27, 2026)

**Root cause (engineer-confirmed, not Apple's stated reason):**

Apple's reviewer attempted to log in during a 3-minute Railway Postgres database outage at approximately 03:01 AM UTC on July 27, 2026. Every authentication method failed — Apple Sign-In, email login, and direct registration — because the backend database was unavailable. The same DB failure pattern was visible in Railway production logs at 20:31 and 22:59 the prior evening.

**Apple guidelines cited:** The exact App Store rejection message is held in App Store Connect and must be retrieved by the founder. Based on the failure pattern, the likely cited guidelines are:
- **2.1 Performance — App Completeness:** App failed to complete basic flows during review
- **4.0 Design / 4.8:** Incomplete demo credentials or failed login

**Apple's screenshots/attachments:** Retrieved from App Store Connect by founder — not available in codebase.

**Prior rejection history:** Build 96 is the submission currently under review. No prior iOS submission history is documented in the codebase.

---

## 2. Source Code & Configuration

### Technology Stack
- **Framework:** Expo SDK 57 (React Native 0.86.0)
- **Language:** TypeScript 6.0
- **Navigation:** Expo Router (file-based, typed routes)
- **State management:** TanStack React Query + React Context
- **Auth:** Custom OIDC proxy via Express, `expo-auth-session`, tokens in `expo-secure-store`
- **Payments (iOS):** RevenueCat (`react-native-purchases` 10.4.2)
- **Maps (iOS):** Apple Maps via `react-native-maps` 1.27.2 with `PROVIDER_DEFAULT`
- **Backend:** Express 5 + Drizzle ORM + PostgreSQL (Railway)
- **OTA updates:** Expo Updates / EAS Update

### app.json (key fields)

```json
{
  "name": "Mapping With Melanin",
  "version": "1.1.5",
  "ios": {
    "bundleIdentifier": "com.melaninmaps.app",
    "buildNumber": "96",              ← will be 97 for next build
    "supportsTablet": true,
    "associatedDomains": ["applinks:mappingwithmelanin.com"],
    "entitlements": {
      "com.apple.developer.applesignin": ["Default"]
    },
    "ITSAppUsesNonExemptEncryption": false
  },
  "runtimeVersion": { "policy": "appVersion" },
  "updates": { "url": "https://u.expo.dev/0f873107-7787-46ab-9a04-685c2a6756b1" }
}
```

### eas.json (production profile)

```json
{
  "production": {
    "channel": "production",
    "environment": "production",
    "autoIncrement": false,
    "ios": {
      "credentialsSource": "local",
      "resourceClass": "m-medium"
    },
    "android": {
      "buildType": "app-bundle",
      "credentialsSource": "local"
    }
  }
}
```

### iOS deployment target: 16.4
### Android: minSdk 26, targetSdk 36, compileSdk 36

---

## 3. Info.plist (iOS native config)

Key permission strings from the committed `Info.plist`:

| Key | Value |
|-----|-------|
| `NSLocationWhenInUseUsageDescription` | "Mapping With Melanin uses your location to show nearby minority-owned businesses and community safety information." |
| `NSCameraUsageDescription` | "Mapping With Melanin uses your camera so you can update your profile photo." |
| `NSPhotoLibraryUsageDescription` | "Mapping With Melanin accesses your photo library so you can choose a profile picture." |
| `NSPhotoLibraryAddUsageDescription` | "Mapping With Melanin saves photos to your library." |
| `NSMicrophoneUsageDescription` | "Mapping With Melanin uses your microphone so you can send voice messages to Kinfolk AI." |
| `NSContactsUsageDescription` | "Mapping With Melanin would like to find friends who are already on the platform." |
| `NSUserNotificationsUsageDescription` | "Mapping With Melanin sends notifications about nearby businesses, community safety alerts, and activity in your circles." |
| `NSFaceIDUsageDescription` | "Allow $(PRODUCT_NAME) to use Face ID" ← **UNRESOLVED TEMPLATE — flagged for fix** |
| `NSMotionUsageDescription` | "Allow $(PRODUCT_NAME) to detect your current motion activity" ← **GENERIC — flagged for fix** |
| `ITSAppUsesNonExemptEncryption` | `false` |
| `NSAllowsArbitraryLoads` | `false` |
| `NSAllowsLocalNetworking` | `true` |

**Note:** EAS builds with `app.json`'s `infoPlist` block as the authoritative source. The `app.json` infoPlist block does not include NSFaceIDUsageDescription or NSMotionUsageDescription, which means these keys should be removed from the source `Info.plist` entirely.

---

## 4. Architecture Overview

```
┌─────────────────────────────────────┐
│         Expo React Native App        │
│  (iOS / Android / Web)               │
│  Expo Router file-based navigation   │
│  expo-secure-store for session token │
└──────────────┬──────────────────────┘
               │ HTTPS (Bearer token)
               ▼
┌─────────────────────────────────────┐
│         Express 5 API Server         │
│  Railway deployment                  │
│  Port 8080, path /api                │
│  Drizzle ORM + pg Pool (max:8)       │
│  StripeSync Pool (max:2, singleton)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Railway PostgreSQL           │
│  Internal host: postgres.railway.    │
│  internal:5432/railway               │
└─────────────────────────────────────┘

Auth flow:
  Apple Sign-In: Client → /api/auth/apple → JWKS verification → session token
  Email: Client → /api/auth/login-email → bcrypt verify → session token
  Sessions: Bearer token in Authorization header, stored in SecureStore

Payments (iOS):
  RevenueCat → App Store IAP → webhook → /api/billing/revenuecat-webhook

OTA Updates:
  EAS Update channel "production" → expo-updates SDK
  Runtime version policy: appVersion (major/minor updates require new binary)
```

---

## 5. API Documentation

**Base URL:** `https://www.mappingwithmelanin.com/api`

**OpenAPI spec location:** `lib/api-spec/openapi.yaml` (1,306 lines)

**Key endpoint groups:**

| Group | Base path | Auth required |
|-------|-----------|---------------|
| Health | `/api/healthz`, `/api/readyz` | No |
| Auth | `/api/auth/*` | Varies |
| Businesses | `/api/businesses` | No (list); Yes (save/review) |
| Saved Places | `/api/saved-places` | Yes |
| Safety Surveys | `/api/surveys` | Yes |
| Community Feed | `/api/community` | Yes |
| Events | `/api/events` | Yes |
| KinfolkAI | `/api/kinfolk` | Yes |
| Users | `/api/users/me` | Yes |
| Membership | `/api/billing`, `/api/membership` | Yes |

**Critical auth endpoints for Apple review:**
```
POST /api/auth/apple          Apple Sign-In code exchange
POST /api/auth/login-email    Email + password login
POST /api/auth/register       New account registration
DELETE /api/auth/logout       Session termination
DELETE /api/users/me          Account deletion (App Store 5.1.1)
```

---

## 6. Database Schema (High-Level)

**Engine:** PostgreSQL 15 on Railway

**Core tables:**

| Table | Purpose |
|-------|---------|
| `users` | Accounts — email, apple_id, session tokens, membership tier |
| `businesses` | Business directory — name, category, location (lat/lng), verification status |
| `saved_places` | User → business save/favorite relationships |
| `neighborhood_surveys` | Community safety reports (anonymous) |
| `community_posts` | Feed posts, visibility controls |
| `events` | Community event listings |
| `kinfolk_sessions` | KinfolkAI conversation history |
| `stripe_events` | Processed Stripe webhook deduplication |
| `content_reports` | UGC moderation reports |
| `sessions` | Express session store (connect-pg-simple) |

**Notable:** User GPS coordinates are never stored. Location is used in-flight to filter results and discarded. Documented in `privacy-policy.tsx`.

---

## 7. Privacy & Compliance

### Privacy Policy
- **In-app screen:** `artifacts/mobile/app/privacy-policy.tsx`
- **Web URL:** `https://www.mappingwithmelanin.com/privacy` (to be confirmed live)
- **Contact:** `hello@mappingwithmelanin.com`, 48-hour response commitment

### Data Collected

| Data | Purpose | Stored |
|------|---------|--------|
| Email address | Account creation, login, transactional email | Yes |
| Name | Profile display | Yes |
| Password (bcrypt hash) | Authentication | Yes (hashed only) |
| Apple ID (opaque string) | Apple Sign-In linking | Yes |
| Profile photo | User profile display | Yes (object storage) |
| Current location | Proximity search (businesses, safety) | No — discarded after use |
| Community posts | User-authored content | Yes |
| Safety survey responses | Anonymous neighborhood reports | Yes (anonymized) |
| Push notification token | Notifications delivery | Yes |
| Contacts (optional) | Find friends already on platform | No — matched in-flight, not stored |
| Subscription status | Feature gating | Yes (via RevenueCat) |

### Deletion
- Account deletion available in-app: Settings → Delete Account
- Deletion is atomic: user row, sessions, Apple token revocation in one transaction
- Privacy policy states 30-day data deletion window

---

## 8. Known Issues and Mitigations

### Confirmed Fixed in Build 97

| Issue | Cause | Fix |
|-------|-------|-----|
| DB pool exhaustion → all auth fails | `stripe-replit-sync` created `pg.Pool(max:10)` per Stripe webhook | Singleton pool, `max:2`, drained on shutdown |
| readyz false positive (transient in-use reported as exhausted) | Fast-fail fired on `idle === 0` even when not exhausted | Fix: requires `waiting > 0 && total >= 8 && idle === 0` |

### Open Before Build 97

| Issue | Severity | Fix |
|-------|----------|-----|
| iOS `buildNumber` must increment to 97 | P0 | Edit `app.json` |
| Duplicate Android permissions in `app.json` | P1 | Remove first block of 9 duplicates |
| Generic permission strings in committed `Info.plist` (NSFaceIDUsageDescription, NSMotionUsageDescription) | P1 | Remove from `Info.plist` |
| RevenueCat IAP products availability in Apple sandbox | P1 | Founder must confirm in RC dashboard |
| Railway service needs manual restart to clear exhausted pool | P0 | Founder: Railway Dashboard → Restart |
| 12-hour stability window not yet completed | P0 | Starts after Railway restart |
| Review account not yet created | P0 | After Railway restart |

---

## 9. Build & Diagnostics

### Build command (run from `artifacts/mobile/` directory)
```bash
eas build --platform ios --profile production
```

### Pre-build typecheck
```bash
pnpm run typecheck
```
**Status:** Zero errors on API server. Pre-existing TypeScript errors in mobile (from `react-native 0.86.0` removing `StyleSheet.absoluteFillObject`, `expo-router` unstable-native-tabs type) — not introduced by recent changes.

### EAS Project ID
`0f873107-7787-46ab-9a04-685c2a6756b1`

### Health endpoints
```
GET https://www.mappingwithmelanin.com/api/healthz   → process liveness
GET https://www.mappingwithmelanin.com/api/readyz    → DB-aware readiness
GET https://www.mappingwithmelanin.com/api/readyz/history → 12.5h stability buffer
```

---

## 10. Demo / Review Credentials

**Status:** Will be created after Railway service restart clears the pool exhaustion.

**Planned account:**
- Email: `appstorereview@mappingwithmelanin.com`
- Username: `mwmreviewer97`
- Password: (set by founder, entered in ASC App Review Information — not stored in code)
- No email verification required at login
- No waitlist, no MFA, full feature access
- Membership: Free tier (all non-premium features available)
- KinfolkAI: Available (AI chat with community context)
- Map: Loads with Apple Maps, businesses visible
- Community: Can post and view feed

---

## 11. Key Files for Deep Review

| File | What it contains |
|------|-----------------|
| `artifacts/mobile/app.json` | All iOS/Android config, permissions, plugins |
| `artifacts/mobile/app.config.js` | Runtime env injection (Google Maps key excluded from iOS — intentional) |
| `artifacts/mobile/eas.json` | EAS profiles, submit config |
| `artifacts/mobile/ios/MappingWithMelanin/Info.plist` | Native iOS plist (pre-EAS; EAS may override some keys) |
| `artifacts/mobile/app/_layout.tsx` | Root layout, auth initialization, RevenueCat init |
| `artifacts/mobile/app/(tabs)/` | All tab screens (home, map, community, safety, profile) |
| `artifacts/mobile/app/login.tsx` | Email login screen |
| `artifacts/mobile/app/membership.tsx` | IAP/subscription screen, RestorePurchasesButton |
| `artifacts/mobile/app/settings.tsx` | Account deletion flow |
| `artifacts/mobile/app/privacy-policy.tsx` | In-app privacy policy |
| `artifacts/mobile/app/terms.tsx` | In-app terms of service |
| `artifacts/mobile/app/community-standards.tsx` | In-app community guidelines |
| `artifacts/api-server/src/routes/auth.ts` | All authentication routes |
| `artifacts/api-server/src/routes/users.ts` | Account deletion (atomic transaction, Apple revocation) |
| `artifacts/api-server/src/stripeClient.ts` | StripeSync singleton (root cause fix) |
| `artifacts/api-server/src/lib/healthMonitor.ts` | 5-minute DB health checks |
| `artifacts/api-server/src/app.ts` | /api/readyz + error middleware |
| `lib/db/src/index.ts` | pg.Pool singleton (max:8, lazy init) |
| `docs/product/SUBMISSION_RELEASE_GATE.md` | 11-gate permanent submission standard |
| `docs/product/releases/BUILD_97_RELEASE_GATE_EVIDENCE.md` | Gate evidence for Build 97 |
