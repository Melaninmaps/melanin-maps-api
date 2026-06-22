---
name: Already-built platform features
description: Major features that were fully implemented in prior sessions — check before rebuilding any of these.
---

## Stripe & Billing
- `webhookHandlers.ts` handles: `checkout.session.completed` → `sendTrialStarted`, `customer.subscription.trial_will_end` → `sendTrialEndingSoon`, `customer.subscription.deleted` → `sendTrialExpired` or `sendMembershipCancelled`
- `/api/cron/trial-reminders` — daily cron endpoint in `routes/cron.ts` (guarded by `CRON_SECRET` env var); queries DB directly for expiring/expired trials
- `/api/billing/invoices` — Stripe invoice list, wired in `billing.ts` route
- `billing.tsx` (web) — full invoice history + subscription status page at `/billing`
- Annual/monthly billing toggle already in `membership.tsx` (state: `billing` "monthly"|"annual", prices wired)

## Auth & Membership
- `requireMembership(tier)` middleware in `artifacts/api-server/src/middleware/requireMembership.ts`
- `reviewLimiter` on POST `/api/reviews` in `routes/reviews.ts`
- `UpgradeModal` component at `artifacts/mobile/components/UpgradeModal.tsx`
  - Used in: `community.tsx`, `business/[id].tsx`, `travel.tsx`, and `MapTabView.tsx` (safety insights gate)

## Content & Community
- `content-reports` route + `contentReportsTable` in DB — `ReportButton.tsx` component exists on mobile
- `verification.ts` route + `verificationRequestsTable` in DB — web form at `/verify-business`
- `referrals.ts` route — `referralCode` + `referralCount` columns already on `usersTable`
- `/r/:code` referral redirect route in web App.tsx → `pages/referral-redirect.tsx` → redirects to `/?ref=:code`

## Admin
- `admin.tsx` (web, 1100+ lines) — full admin panel with waitlist analytics, users, members tabs; supports editing `memberType`, `trialEndsAt`, `foundingMemberNumber` per user
- Waitlist tab has: KPI cards, 14-day growth sparkline, city leaderboard, referral leaderboard, enhanced table with referral counts

## Onboarding & Navigation
- `welcome.tsx` (web) — 3-step post-signup onboarding at `/welcome`
- Deep links in `app.json`: scheme `mappingwithmelanin`, `intentFilters` for `https://mappingwithmelanin.com`
- `business-dashboard.tsx` (web, 228 lines) — business owner portal at `/business-dashboard`

## Session-added features (prior sessions)
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
