---
name: Web Membership + Trial Email System
description: Full trial expiry email sequences, Stripe web checkout route, MembershipGate component, and mission section on /membership page.
---

## Email sequences (artifacts/api-server/src/lib/email.ts)

- `sendTrialEndingSoon` — 3-day warning (already existed, now has green mission block)
- `sendTrialEnding1Day` — NEW: 1-day urgent warning with web-first + scholarship story
- `sendTrialExpired` — day-of expiry (already existed, now has green mission block)
- `sendMissionWinBack` — NEW: 3-days-after win-back with full scholarship/health/grants story

All emails link to https://mappingwithmelanin.com/membership and emphasize web > IAP for community impact.

## Deduplication tracking (lib/db/src/schema/auth.ts)

4 new timestamp columns on `usersTable`:
- `trialReminder3DaySentAt`
- `trialReminder1DaySentAt`
- `trialExpiredEmailSentAt`
- `winBackEmailSentAt`

**Why:** The original cron had no dedup — it would re-send emails on every daily run to all users still in the window.

## Cron (artifacts/api-server/src/routes/cron.ts → POST /cron/trial-reminders)

Now runs 4 queries, each gated by `IS NULL` on the corresponding sentAt column. After sending, immediately marks the column. Windows:
- 3-day: `trialEndsAt BETWEEN now+1day AND now+3days`
- 1-day: `trialEndsAt BETWEEN now AND now+25h`  
- Expiry: `trialEndsAt < now AND stripeSubscriptionId IS NULL`
- Win-back: `trialEndsAt BETWEEN now-7days AND now-2days AND stripeSubscriptionId IS NULL`

## Web Stripe checkout (artifacts/api-server/src/routes/billing.ts)

**POST /api/billing/checkout** — requires auth. Body: `{ plan: "navigator"|"trailblazer", interval: "monthly"|"annual" }`.
- Creates/gets Stripe customer, stores `stripeCustomerId` on user
- Creates subscription checkout session with `price_data` (inline, no pre-configured price IDs)
- Passes `metadata: { userId, planType }` so webhook can update `memberType`
- Success URL: `/membership?subscribed=1&plan=<plan>`

**POST /api/billing/portal** — opens Stripe billing portal for subscription management.

Prices:
- navigator monthly: $7.99, annual: $79.99
- trailblazer monthly: $14.99, annual: $149.99

## Webhook update (artifacts/api-server/src/webhookHandlers.ts)

`checkout.session.completed` now reads `metadata.planType` and updates `memberType` accordingly. Works for both new signups (no prior trial) and re-subscriptions.

## Web MembershipGate component (artifacts/web/src/components/membership-gate.tsx)

`<MembershipGate requiredTier="navigator|trailblazer" currentTier={...} featureName="..." featureDescription="...">` — wraps any premium feature. If tier insufficient, shows blurred preview + upgrade card with inline Stripe checkout CTA + mission note. Calls POST /api/billing/checkout directly.

## Membership page (artifacts/web/src/pages/membership.tsx)

- Added dark-green mission section between hero and pricing (3-card grid: Scholarship / Health / Business Grants + ~$11/yr savings callout)
- Navigator + Trailblazer buttons now call `handleStartMembership()` → Stripe checkout for logged-in users, `/login?redirect=/membership` for guests
- Buttons show `<Loader2>` spinner while checkout session is being created
