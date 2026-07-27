# Privacy and Data Collection Summary
## Mapping With Melanin™ — Build 97
**Date:** July 27, 2026
**Note:** This document reflects code behavior based on DB schema and route inspection. The founder should verify alignment with the current Privacy Policy and App Store Privacy labels.

---

## Policy URLs

| Document | URL |
|----------|-----|
| Privacy Policy | `https://mappingwithmelanin.com/privacy` |
| Terms of Service | `https://mappingwithmelanin.com/terms` (expected — verify) |
| Community Standards | `https://mappingwithmelanin.com/community-standards` (expected — verify) |
| Support | `https://mappingwithmelanin.com/support` (expected — verify) |
| Account deletion | In-app: Settings → Account → Delete Account; calls `DELETE /api/auth/account` |

---

## Data Collection Inventory

### Identity Data

| Data | Collected | Purpose | Required | Public | Retention | Deletion | Third Party | KinfolkAI | Personalization |
|------|-----------|---------|----------|--------|-----------|----------|-------------|-----------|----------------|
| Email | ✅ | Authentication, communication | Required (non-Apple login) | No | Account lifetime | On account delete | Resend (transactional email) | System prompt (masked) | No |
| Name (first/last) | ✅ | Profile | Required at setup | Partial (display name) | Account lifetime | On account delete | None | System prompt | Yes |
| Username | ✅ | Public identity | Required | Yes | Account lifetime | On account delete | None | No | No |
| Password hash | ✅ | Authentication | Required (email login) | Never | Account lifetime | On account delete | None | No | No |
| Profile image | ✅ | Profile display | Optional | Yes (if profile public) | Until changed/deleted | On account delete | Replit Object Storage | No | No |
| Date of birth | ✅ | Age verification, content ratings | Required at setup | No | Account lifetime | On account delete | None | No | No |
| Apple ID (internal) | ✅ | Apple Sign-In authentication | Required (Apple login) | No | Account lifetime | On account delete (+ Apple token revocation) | Apple | No | No |

### Location Data

| Data | Collected | Purpose | Required | Public | Notes |
|------|-----------|---------|----------|--------|-------|
| Location (when in use) | ✅ On permission | Show nearby businesses, safety context | Optional | No — used for search only | `NSLocationWhenInUseUsageDescription` declared |
| Location (always) | ❌ Not collected | — | — | — | `NSLocationAlwaysUsageDescription` removed from Build 97 |
| Home city | ✅ | KinfolkAI personalization, profile | Optional | Optional (user controls) | Free-text field |
| Search location queries | ✅ Transient | Map search | Session only | No | Not persisted beyond session |

### Activity Data

| Data | Collected | Purpose | Required | Personalization | Notes |
|------|-----------|---------|----------|----------------|-------|
| Saved places | ✅ | Personal saves, KinfolkAI context | Optional | Yes | User can make public |
| Business views / clicks | ✅ | Analytics, business insights | Implicit | Yes | `external_click_events`, `business_click_events` |
| Search queries | ✅ | Business discovery, KinfolkAI | Implicit | Yes | `kinfolk_search_events` table |
| Community posts | ✅ | Community feed | User-initiated | No | Visibility controlled by user |
| Event RSVPs | ✅ | Events | User-initiated | No | |
| Reviews and ratings | ✅ | Business discovery | User-initiated | No | Attributed to username |
| Safety reports | ✅ | Community safety | User-initiated | Aggregate only | Individual reports not public |
| Discrimination reports | ✅ | Community safety | User-initiated | Aggregate only | |
| Profile views | ✅ | Social | Implicit | No | `profile_views` table |
| Skip feedback | ✅ | Business recommendation improvement | Implicit | Yes | `business_skip_feedback` |
| Points and achievements | ✅ | Gamification | Implicit | Optional | |

### KinfolkAI Data

| Data | Collected | Purpose | Retention | Third Party | Notes |
|------|-----------|---------|-----------|-------------|-------|
| KinfolkAI conversation history | ✅ | Multi-turn context, session recall | Account lifetime | OpenAI API (transient) | `kinfolk_sessions` table; messages sent to OpenAI as context |
| User preferences (dietary, travel, etc.) | ✅ | KinfolkAI personalization | Account lifetime | OpenAI API (transient, in system prompt) | `user_preferences` table |
| Lifestyle services | ✅ | KinfolkAI personalization | Account lifetime | OpenAI API (transient) | `lifestyleServices` JSONB in `user_preferences` |
| Voice usage | ✅ | TTS limits | Monthly | OpenAI TTS API | `voice_usage` table |

**Critical privacy note:** Conversation history is sent to OpenAI as context on each request. OpenAI's data retention and use policies apply to these messages. This should be disclosed in the Privacy Policy.

### Subscription and Payment Data

| Data | Collected | Purpose | Third Party |
|------|-----------|---------|-------------|
| Stripe customer ID | ✅ | Subscription management | Stripe |
| Stripe subscription ID | ✅ | Entitlement check | Stripe |
| RevenueCat transaction data | ✅ (iOS/Android) | IAP subscription management | RevenueCat |
| Apple purchase receipt | ✅ (iOS IAP) | Subscription verification | Apple, RevenueCat |

**Note:** Credit card numbers and payment details are NEVER stored by the app. All payment processing is handled by Stripe and Apple/RevenueCat.

### Device Data

| Data | Collected | Purpose | Notes |
|------|-----------|---------|-------|
| Push token | ✅ | Push notifications | `push_tokens` table; optional |
| Device type | 🔶 Implicit in requests | Analytics | HTTP user-agent, not explicitly tracked |
| Device identifiers | ❌ Not explicitly collected | — | RevenueCat may collect for fraud prevention |

### Business Owner Data

| Data | Collected | Purpose | Notes |
|------|-----------|---------|-------|
| Business information | ✅ | Directory listing | Business owners submit; may be public |
| Business identity (ownership designations, diaspora) | ✅ | Discovery | `business_identity` table |
| Verification documents | ✅ | Identity verification | Stored in object storage; admin review |
| Business analytics | ✅ | Owner insights | `business-analytics` routes |

---

## Permissions Declared vs. Used

### iOS

| Permission | Declared | Used For | Required |
|-----------|----------|---------|----------|
| NSLocationWhenInUseUsageDescription | ✅ | Nearby business discovery, safety | Optional |
| NSCameraUsageDescription | ✅ | Profile photo | Optional |
| NSPhotoLibraryUsageDescription | ✅ | Profile photo selection | Optional |
| NSPhotoLibraryAddUsageDescription | ✅ | Save photos to library | Optional |
| NSMicrophoneUsageDescription | ✅ | KinfolkAI voice input | Optional |
| NSContactsUsageDescription | ✅ | Find friends on platform | Optional |
| NSUserNotificationsUsageDescription | ✅ | Business alerts, safety, circles | Optional |
| NSPrivacyAccessedAPICategoryUserDefaults | ✅ | Reason: CA92.1 (app functionality) | Required declaration |
| NSLocationAlwaysUsageDescription | ❌ Removed in Build 97 | — | — |
| NSFaceIDUsageDescription | ❌ Removed in Build 97 | — | — |
| NSMotionUsageDescription | ❌ Removed in Build 97 | — | — |

### Android

All permissions declared in `app.json` (16 permissions listed). See `docs/reviews/native/ANDROID_CONFIG.md`.

---

## Potential Mismatches to Investigate

| Item | Risk | Action |
|------|------|--------|
| OpenAI data retention in KinfolkAI conversations | Privacy Policy may not disclose AI processor | Verify Privacy Policy covers OpenAI as a data processor |
| Contacts permission use | `READ_CONTACTS` + `WRITE_CONTACTS` declared on Android | Verify this is used only for "find friends" and disclosed |
| Business click/view tracking | Users may not be aware of implicit tracking | Verify Privacy Policy discloses behavioral tracking |
| `user_locations` table | `saved-community-locations.ts` schema exists | Clarify what location data is stored and for how long |
| Safety reports anonymity | Reports attributed to user; what's shown to businesses? | Verify reports are not disclosed to reported parties |

---

## Account Deletion

**Route:** `DELETE /api/auth/account`
**What is deleted:** User record from `users` table (cascade behavior depends on schema foreign key configuration)
**Apple requirement:** Must be accessible from within the app. Location in app: Settings → Account → Delete Account.
**Apple Sign-In revocation:** Implemented — `revokeAppleToken()` called on account deletion; Apple refresh token stored encrypted (`AES-256-GCM`) in `users.appleRefreshToken`.

**Gap:** It is not confirmed whether all related tables (posts, reviews, saved places, KinfolkAI sessions) are cascade-deleted or soft-deleted on account removal. Manus should verify the deletion is complete.

---

## App Store Privacy Labels (Current Status)

**Current App Store Privacy answers:** Not exported to this package. The founder should retrieve these from App Store Connect and verify they match this data inventory.

**Google Play Data Safety:** Not available in project documentation. Android submission requires accurate Data Safety form completion.
