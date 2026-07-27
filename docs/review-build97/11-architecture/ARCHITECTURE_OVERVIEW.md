# Architecture Overview
## Mapping With Melanin™ — Build 97
**Date:** July 27, 2026

---

## A. SYSTEM COMPONENTS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                          │
├──────────────────┬──────────────────┬──────────────────┬────────────────┤
│   Web Browser    │  iPhone (iOS)    │   iPad (iPadOS)  │ Android Phone  │
│  React/Vite SPA  │  Expo/RN 0.86   │  Expo/RN 0.86   │  Expo/RN 0.86  │
│  mappingwith     │  Build 97        │  Build 97        │  versionCode   │
│  melanin.com     │  iOS 16.4+       │  iOS 16.4+       │  71, API 26+   │
├──────────────────┴──────────────────┴──────────────────┴────────────────┤
│                    Android Tablet (also versionCode 71)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RAILWAY — API SERVER                                  │
│  Express 5 / Node.js / TypeScript                                        │
│  www.mappingwithmelanin.com (production)                                 │
│  Port: 8080 (Railway assigns external port)                              │
│  Replicas: 1                                                             │
│  Health: GET /api/readyz (DB-aware)                                      │
│  Pool: app max:8, StripeSync max:2 = 10 total                           │
└────────────────┬──────────────────────────────────────────┬─────────────┘
                 │                                          │
        ┌────────┘                                 ┌────────┘
        ▼                                          ▼
┌──────────────────────┐                 ┌──────────────────────┐
│ RAILWAY POSTGRESQL   │                 │  REPLIT OBJECT       │
│ Single instance      │                 │  STORAGE (GCS)       │
│ ~37+ tables          │                 │  Profile photos,     │
│ Drizzle ORM          │                 │  verification images │
│ 10 max connections   │                 │  Business photos     │
│ from API server      │                 │                      │
└──────────────────────┘                 └──────────────────────┘
```

---

## B. EXTERNAL SERVICES

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                │
├────────────────────────┬────────────────────────┬───────────────────────┤
│ EXPO / EAS             │ APPLE                   │ GOOGLE               │
│ Build: eas build       │ Sign-In: OIDC/JWT       │ Maps JS API (web)    │
│ OTA: eas update        │ IAP: App Store          │ Maps SDK (mobile)    │
│ Updates URL:           │ TestFlight: internal    │ Play Billing (Android│
│ u.expo.dev/0f873107..  │ ASC App: 6783773366     │ Play Console:        │
│ Project: mobile        │ Team: Y46Y4A5MMZ        │ internal track       │
│ Owner: tlindsay428     │ Reviewer device:        │ Package:             │
│                        │ iPad Air M3/iPadOS 26.5 │ com.melaninmaps.app  │
├────────────────────────┼────────────────────────┼───────────────────────┤
│ OPENAI (via Replit AI  │ REVENUECAT              │ STRIPE               │
│ Integrations proxy)    │ iOS: appl_evRvv...      │ Subscriptions (web)  │
│ KinfolkAI completions  │ Android: goog_Ytlt...   │ Webhooks: /api/stripe│
│ TTS audio              │ Entitlement mgmt        │ /webhook             │
│ Model: gpt-4o (current)│ RevenueCat webhook:     │ stripe-replit-sync:  │
│                        │ /api/revenuecat/webhook │ Stripe→DB sync       │
├────────────────────────┼────────────────────────┼───────────────────────┤
│ OPEN-METEO             │ RESEND                  │ TWILIO               │
│ Live weather (free)    │ Transactional email     │ Phone auth (partial) │
│ No API key required    │ (trial/membership)      │                      │
│ Used by KinfolkAI      │ RESEND_API_KEY env var  │                      │
├────────────────────────┼────────────────────────┼───────────────────────┤
│ DOCUSIGN               │ WMATA (DC Metro)        │ GITHUB               │
│ Seller/founding/       │ Transit data for DC     │ Source control       │
│ verification docs      │ WMATA_API_KEY env var   │ Melaninmaps/         │
│                        │                         │ melanin-maps-api     │
└────────────────────────┴────────────────────────┴───────────────────────┘
```

---

## C. REQUEST FLOWS

### Apple Sign-In Registration (Mobile → API)

```
1. User taps "Continue with Apple" on mobile
2. expo-apple-authentication: signInAsync({ requestedScopes: [EMAIL, FULL_NAME] })
   - iOS 26+: cryptographic nonce (expo-crypto SHA256) passed as hashedNonce
3. Apple returns: identityToken (JWT), authorizationCode, user info
4. Mobile: POST /api/auth/apple { identityToken, authorizationCode, nonce: rawNonce }
5. API server:
   a. Verifies identityToken via Apple JWKS endpoint (jsonwebtoken + crypto)
   b. Verifies SHA256(rawNonce) === payload.nonce
   c. Exchanges authorizationCode for refreshToken (AES-256-GCM encrypted → DB)
   d. Creates or finds user in users table (withDbRetry applied)
   e. Creates session → session cookie
6. Mobile: receives session, stores securely (expo-secure-store)
7. If new user: redirect to /profile-setup (4-step onboarding)
```

### Email Registration / Login

```
1. User enters email + password on mobile/web
2. POST /api/auth/register { email, password, firstName, lastName }
   or POST /api/auth/login-email { email, password }
3. API server (withDbRetry applied):
   a. Register: bcrypt hash password, create user, send welcome email (Resend)
   b. Login: bcrypt compare, check emailVerified, create session
4. Session cookie returned
5. Mobile: stores session in expo-secure-store
```

### Session Restoration

```
1. App launches or foregrounds
2. Mobile reads session cookie from expo-secure-store
3. GET /api/auth/me (session cookie attached)
4. API server: validates session from sessions table, returns user object
5. If expired: redirect to login screen
6. If Apple Sign-In: AppState foreground check verifies Apple credential state
```

### Business Discovery

```
1. User opens Explore/Map tab
2. GET /api/businesses?lat=&lng=&radius=&category= (withDbRetry)
3. API server: Drizzle query against businesses table with geospatial filter
4. Returns paginated business list with lat/lng
5. Mobile: renders business cards + map pins
6. User taps business: GET /api/businesses/:id → detail screen
```

### Map Loading

```
1. User opens Map tab
2. FullMapView.tsx initializes react-native-maps (MapView)
3. withRnMapsPodfileFix plugin ensures Google Maps initialized natively on iOS
4. GET /api/businesses (viewport bounds)
5. GET /api/cultural-sites (heritage overlay — always on by default)
6. Business pins and heritage pins rendered on map
7. Tap pin → "View Details" → deep link to business or heritage screen
```

### KinfolkAI Request

```
1. User types message in KinfolkAI chat
2. POST /api/kinfolk/chat { message, sessionId }
3. API server:
   a. checkAiPool() — verify user hasn't exceeded monthly limit
   b. fetchWeatherContext(location) — Open-Meteo (5s timeout)
   c. Load user preferences, settings, life journey, saved places
   d. buildSystemPrompt(tier, preferences, ...)
   e. Load session history from kinfolk_sessions
   f. openai.chat.completions.create({ messages, model })
   g. incrementAiUsage() — update monthly counter
   h. Save response to kinfolk_sessions
4. Returns AI response text
5. Optional: POST /api/kinfolk/voice → TTS audio (OpenAI)
```

### Stripe Webhook Processing (New Singleton Pattern)

```
1. Stripe sends webhook to POST /api/stripe/webhook
2. Stripe router validates signature (STRIPE_WEBHOOK_SECRET)
3. getStripeSync() — returns cached singleton (ONE pg.Pool(max:2) per process)
4. sync.processWebhook(payload, signature)
5. StripeSync updates stripe_* tables in Railway Postgres
6. User membership state updated if subscription event
```

### Account Deletion

```
1. User taps Delete Account in Settings
2. DELETE /api/auth/account
3. API server:
   a. revokeAppleToken() — revokes Apple refresh token via Apple API
   b. Cancels Stripe subscription if active
   c. Deletes user record (cascade to related tables — extent of cascade TBD)
   d. Clears session
4. User redirected to splash screen
```

---

## D. RELEASE FLOW

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  Replit Dev     │───▶│  GitHub Repo     │───▶│  Railway Deploy      │
│  Workspace      │    │  Melaninmaps/    │    │  API Server          │
│  (this env)     │    │  melanin-maps-api│    │  Auto-deploy on push │
└─────────────────┘    └──────────────────┘    └──────────────────────┘

Mobile Release:
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  Replit Dev     │───▶│  EAS Build       │───▶│  App Store Connect  │
│  eas build      │    │  Cloud Build     │    │  TestFlight         │
│  (iOS/Android)  │    │  artifacts/      │    │  Apple Review       │
└─────────────────┘    │  mobile/         │    └──────────────────────┘
                        └──────────────────┘    ┌──────────────────────┐
                                               │  Google Play Console │
                                               │  Internal Track      │
                                               └──────────────────────┘

OTA Updates:
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  Replit Dev     │───▶│  EAS Update      │───▶│  Expo Update CDN    │
│  eas update     │    │  u.expo.dev/...  │    │  App downloads on   │
│  --channel prod │    │                  │    │  next launch        │
└─────────────────┘    └──────────────────┘    └──────────────────────┘
```

---

## E. SINGLE POINTS OF FAILURE

| Component | SPOF Risk | Mitigation |
|-----------|-----------|-----------|
| Railway PostgreSQL | **HIGH** — one instance, no replica | Connection retry helper; graceful pool management; health monitor |
| Railway API Server | Medium — one replica | SIGTERM graceful shutdown; Railway auto-restart on crash |
| OpenAI API | Medium — KinfolkAI depends on it | Error handling returns user-friendly message; retry not implemented |
| Apple Sign-In | Medium — iOS auth depends on it | Email login as fallback |
| Stripe webhooks | Low — StripeSync singleton now; one pool | Webhook retry by Stripe if endpoint returns non-200 |
| Resend email | Low — emails are non-critical for auth | Logged on failure; auth succeeds without welcome email |
| Open-Meteo | Low — 5s timeout, returns null on failure | KinfolkAI proceeds without weather context |
| Google Maps API | Medium — map tab non-functional without it | `gm_authFailure` fallback UI |
| RevenueCat | Low — entitlement check falls back to DB | `memberType` cached in DB |
| EAS / Expo CDN | Low — affects OTA only; builds are standalone | Builds work without OTA CDN |

---

## F. WHICH COMPONENTS MANUS SHOULD CONSIDER RELEASE RISKS

| Component | Assessment | Reason |
|-----------|-----------|--------|
| Railway Postgres connection management | **MUST VERIFY** | Root cause of Build 96 rejection; fix not yet deployed |
| Apple Sign-In flow (nonce + JWKS verification) | **MUST TEST** | iOS 26+ nonce enforcement; not re-tested since fix |
| iPad layout on all screens | **MUST TEST** | Build 96 rejection was on iPad; no iPad regression test documented |
| Historical Sundown Towns (if in scope) | **HIGH RISK** | Data not confirmed imported; UI not confirmed built |
| RevenueCat sandbox (IAP) | **MUST VERIFY** | Products must be active in ASC before submission |
| Observability (crash reporting) | **SHOULD FIX** | No crash reporting = blind to production failures |
