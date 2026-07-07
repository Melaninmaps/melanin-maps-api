---
name: RevenueCat subscription storage pattern
description: How RC iOS purchases are persisted server-side — reuses stripeSubscriptionId column with "rc_" prefix
---

## Rule

After a successful RevenueCat purchase on iOS, the server endpoint `POST /api/revenuecat/sync` updates:
- `member_type` → the tier key (navigator, trailblazer, community_builder, legacy_member)
- `stripe_subscription_id` → `"rc_<productIdentifier>"` (e.g. `"rc_mwm_navigator_monthly"`)

The `requireMembership` middleware treats any truthy `stripe_subscription_id` as an active subscription, so the "rc_" prefix is recognized automatically — no schema migration needed.

**Why:** Avoids adding a new `rc_subscription_id` column to the users table while still allowing `requireMembership` to gate features correctly for RC subscribers.

**How to apply:** When checking if a user has an active subscription, `stripeSubscriptionId` can start with either a Stripe sub ID or "rc_". Both signal active. For cancellation webhooks (future work), strip the "rc_" prefix to identify the RC product.

## Product → tier mapping (canonical)

| Product identifier           | memberType          |
|------------------------------|---------------------|
| mwm_navigator_monthly/annual | navigator           |
| mwm_trailblazer_monthly/annual | trailblazer       |
| mwm_community_builder_monthly/annual | community_builder |
| mwm_legacy_member_monthly/annual | legacy_member   |

## Business plans on iOS

Business plans (Growth/Premium/Founding Business) redirect to `https://www.mappingwithmelanin.com/membership` on iOS rather than going through IAP, to avoid Apple's 30% commission on B2B subscriptions.
