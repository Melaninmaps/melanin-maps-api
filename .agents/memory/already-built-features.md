---
name: Already-built platform features
description: Major features that were fully implemented in prior sessions — check before rebuilding any of these.
---

## Stripe & Billing
- `webhookHandlers.ts` handles: `checkout.session.completed` → `sendTrialStarted`, `customer.subscription.trial_will_end` → `sendTrialEndingSoon`, `customer.subscription.deleted` → `sendTrialExpired` or `sendMembershipCancelled`
- `/api/cron/trial-reminders` — daily cron endpoint (guarded by `CRON_SECRET` env var)
- `/api/billing/invoices` — Stripe invoice list, wired in `billing.ts` route
- `billing.tsx` (web) — full invoice history + subscription status page at `/billing`
- Annual/monthly billing toggle already in `membership.tsx` (state: `billing` "monthly"|"annual", prices wired)

## Auth & Membership
- `requireMembership(tier)` middleware in `artifacts/api-server/src/middleware/requireMembership.ts`
- `reviewLimiter` on POST `/api/reviews`, `surveyLimiter` on POST `/api/surveys`
- `UpgradeModal` component at `artifacts/mobile/components/UpgradeModal.tsx` — used in community.tsx and business/[id].tsx

## Content & Community
- `content-reports` route + `contentReportsTable` in DB — `ReportButton.tsx` component exists on mobile
- `verification.ts` route + `verificationRequestsTable` in DB — web form at `/verify-business`
- `referrals.ts` route — `referralCode` + `referralCount` columns already on `usersTable`

## Admin
- `admin.tsx` (web, 1060 lines) — full admin panel with waitlist, users, members tabs; supports editing `memberType`, `trialEndsAt`, `foundingMemberNumber` per user

## Onboarding & Navigation
- `welcome.tsx` (web) — 3-step post-signup onboarding at `/welcome`
- Deep links in `app.json`: scheme `mappingwithmelanin`, `intentFilters` for `https://mappingwithmelanin.com`
- `business-dashboard.tsx` (web, 228 lines) — business owner portal at `/business-dashboard`

## Session-added features (this session)
- DB tables: `flash_deals`, `business_stories`, `points_redemptions`, `mentorship_profiles`
- API routes: `/api/deals`, `/api/stories`, `/api/rewards`, `/api/redemptions`, `/api/mentorship`
- Mobile hooks: `useDeals`, `useStories`, `useRedemptions`
- Mobile components: `FlashDealsSection`, `BusinessStoriesSection`, `SafetyPulseWidget`, `MilestoneSection`, `PointsRedemptionModal`
- Mobile screen: `mentorship.tsx` (full directory + filter)
- Web pages: `affiliate.tsx` (partner discounts), `mentorship.tsx` (profile directory + create form)
- Home screen: Vibe Match chips (8 vibes, category-based filter)
- Profile: MilestoneSection + PointsRedemptionModal + Mentorship Network in SETTINGS
- Business detail: UpgradeModal shown on 403 from review submission
- `useReviews.submitReview` throws `{ code: "MEMBERSHIP_REQUIRED" }` on 403

**Why:** Recording these to avoid rebuilding already-complete work across sessions.
