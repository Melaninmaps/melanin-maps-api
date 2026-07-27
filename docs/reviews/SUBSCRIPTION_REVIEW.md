# Subscription and Apple Commerce Review
## Mapping With Melanin™ — Build 97
**Date:** July 27, 2026

---

## Overview

Mapping With Melanin™ uses a tiered membership model with two payment paths:
- **iOS/Android:** RevenueCat (wrapping Apple IAP and Google Play Billing)
- **Web:** Stripe (direct subscription)

---

## RevenueCat Integration

**SDK:** `react-native-purchases@^10.4.2` (listed in mobile `package.json`)
**Package:** `@replit/revenuecat-sdk@^4.2.0` (in root `package.json`)
**Server route:** RevenueCat webhooks and entitlement checks — router exists (`revenuecatRouter` in routes/index.ts)

### Product Identifiers (from eas.json — PUBLIC env vars)

| Platform | Key | Value (from eas.json) |
|----------|-----|----------------------|
| iOS | `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | `appl_evRvvCBBMxNrhJJKrqQELZrxeJv` |
| Android | `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | `goog_YtlteQfYyxtiWoOvOylWcxKaIBk` |
| Test | `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` | `appl_evRvvCBBMxNrhJJKrqQELZrxeJv` |

**Note:** These are public API keys (not secret keys) — safe to include in client-side code and build environments.

### Membership Tiers and Product IDs

Tier limits are defined in `artifacts/api-server/src/constants/membershipTiers.ts`.

| Tier | Identifier in DB (`memberType`) | iOS Product ID | Android Product ID | Price |
|------|--------------------------------|---------------|-------------------|-------|
| Individual (free) | `individual` | N/A (free) | N/A (free) | $0 |
| Navigator | `navigator` | **[Product ID in RevenueCat dashboard — not in codebase]** | **[Product ID in RevenueCat dashboard]** | **[See ASC]** |
| Trailblazer | `trailblazer` | **[Product ID in RevenueCat dashboard]** | **[Product ID in RevenueCat dashboard]** | **[See ASC]** |
| Founding Member | `founding` | **[Historical — may be legacy]** | — | — |

**Gap:** Exact App Store Connect product IDs are not hardcoded in the reviewed codebase — they are configured in the RevenueCat dashboard and fetched at runtime. The founder must confirm:
1. All subscription products are created in App Store Connect (ASC)
2. All subscription products are in "Ready to Submit" or approved status
3. RevenueCat dashboard is connected to the correct ASC app (App ID: 6783773366)

### App Store Connect Product Status

**Not confirmed in project documentation.** The founder must verify in ASC that:
- Products exist for Navigator and Trailblazer tiers
- Products are approved or "Ready to Submit"
- Sandbox testing is enabled
- Pricing is set (and displays correctly in the app)

### Google Play Product Status

**Not confirmed.** Similar verification required in Google Play Console:
- In-app purchases or subscriptions created
- Products are active in the internal testing track

---

## Membership Screen

**Mobile screen:** `app/membership.tsx` (or similar — exact path from project memory confirms this exists)
**What it shows:**
- Current plan chips (AI pool usage, family seat availability)
- Upgrade options for Navigator and Trailblazer
- Pricing displayed via RevenueCat SDK (pulled from store at runtime — not hardcoded)
- Privacy Policy and Terms links (required by Apple)

---

## Purchase Flow (iOS)

1. User taps upgrade option on membership screen
2. `Purchases.purchasePackage()` called via RevenueCat SDK
3. Apple IAP sheet presented natively
4. On success: RevenueCat updates entitlement → webhook to `/api/revenuecat/webhook` → DB updated
5. `memberType` updated on user record

**Restore Purchases:** Implemented. `Purchases.restorePurchases()` called on "Restore" tap. Required by Apple.

---

## Purchase Flow (Android)

**Business plan purchases on iOS redirect to web.** From project memory: "iOS business plans redirect to web" — this is intentional. Standard Android billing follows the same RevenueCat pattern as iOS.

---

## Purchase Flow (Web)

**Route:** `POST /api/billing/checkout` creates a Stripe subscription session.
**Component:** `MembershipGate` gates web features behind subscription check.
**Stripe integration:** Subscription managed via Stripe; webhook at `/api/stripe/webhook`.

---

## Entitlement Checks

**Mobile:** `getUserTier()` in `artifacts/api-server/src/middleware/requireMembership.ts` — checks `users.memberType`
**Web:** `MembershipGate` component
**KinfolkAI:** `checkAiPool()` and `getTierFromMemberType()` in `membershipTiers.ts`
**Family plan:** `family_ai_usage` and `family_add_on_seats` tables

---

## Subscription State Persistence

Stripe subscription status stored as:
- `users.stripeCustomerId`
- `users.stripeSubscriptionId`

For iOS RevenueCat purchases, project memory notes:
- `stripe_subscription_id = "rc_<productId>"` (synthetic ID pattern used to store RC purchases in the Stripe column)
- This allows unified entitlement checking via the same DB field

---

## Privacy/Terms Links

Required by Apple in the purchase flow. These must appear:
1. On the membership/subscription screen
2. In the App Store Connect metadata
3. In RevenueCat configuration (if using RevenueCat Paywalls)

**Current status:** Privacy Policy URL exists at `mappingwithmelanin.com/privacy`. Terms URL should exist at a similar path. The founder must verify both URLs are live and the correct content.

---

## External Payment Paths

**Guideline 3.1 risk area:**

| Path | Type | Risk |
|------|------|------|
| iOS in-app subscription | Apple IAP via RevenueCat | ✅ Compliant |
| Android in-app subscription | Google Play Billing via RevenueCat | ✅ Compliant |
| Web Stripe subscription | External payment | ⚠️ Must NOT be promoted or linked from within the iOS app in a way that bypasses Apple IAP |
| "Business plan → web" redirect on iOS | External | ⚠️ Must be reviewed — Apple may object to in-app links that route around IAP |

**Apple Guideline 3.1.1:** Apps may not include buttons, external links, or other calls to action that direct customers to purchasing mechanisms other than in-app purchase for digital content.

**Risk:** If the app links to `mappingwithmelanin.com/membership` or `mappingwithmelanin.com/billing` from within the iOS app for purchasing a membership, this may violate Guideline 3.1.1. Manus should assess this specific flow.

---

## Test / Sandbox Status

| Item | Status |
|------|--------|
| Apple Sandbox IAP testing | **Not confirmed complete for Build 97** |
| RevenueCat test environment | Test API key matches iOS key — likely sandbox |
| Sandbox product availability | **Founder must confirm products visible in sandbox** |
| Restore Purchases in sandbox | **Not confirmed tested** |

---

## Known Failures

| Failure | Status |
|---------|--------|
| RevenueCat SDK version compatibility with Expo 57 / RN 0.86 | Not confirmed tested in Build 97 |
| Sandbox purchase flow on iPad | Not confirmed tested |
| Family plan seat purchase | Implemented; sandbox tested status unknown |

---

## Questions for Manus

1. Is there any Apple Guideline 3.1 risk in the current subscription implementation?
2. Does the iOS membership screen comply with Apple's requirements (Privacy Policy link, Terms link, Restore Purchases button)?
3. Is redirecting "business plan" purchases to web a Guideline 3.1.1 violation on iOS?
4. What must the founder confirm in App Store Connect before Build 97 is submitted?
5. Is the synthetic `"rc_<productId>"` pattern for storing RevenueCat purchases in the `stripe_subscription_id` column a sound architecture for entitlement checking?
