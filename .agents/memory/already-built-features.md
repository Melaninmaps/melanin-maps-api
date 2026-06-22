---
name: Already-built platform features
description: Major features that were fully implemented in prior sessions — check before rebuilding any of these.
---

## Stripe & Billing
- `webhookHandlers.ts` handles: `checkout.session.completed` → `sendTrialStarted`, `customer.subscription.trial_will_end` → `sendTrialEndingSoon`, `customer.subscription.deleted` → `sendTrialExpired` or `sendMembershipCancelled`
- `/api/cron/trial-reminders` — daily cron endpoint in `routes/cron.ts` (guarded by `CRON_SECRET` env var); queries DB directly for expiring/expired trials
- `/api/cron/weekly-digest` — weekly digest cron in `routes/cron.ts`; queries businesses added in last 7 days, emails all approved users via `sendWeeklyDigest()` in email.ts
- `/api/billing/invoices` — Stripe invoice list, wired in `billing.ts` route
- `billing.tsx` (web) — full invoice history + subscription status page at `/billing`
- Annual/monthly billing toggle already in `membership.tsx` (state: `billing` "monthly"|"annual", prices wired)

## Auth & Membership
- `requireMembership(tier)` middleware in `artifacts/api-server/src/middleware/requireMembership.ts`
- `reviewLimiter` on POST `/api/reviews` in `routes/reviews.ts`
- `UpgradeModal` component at `artifacts/mobile/components/UpgradeModal.tsx`
  - Used in: `community.tsx`, `business/[id].tsx`, `travel.tsx`, and `MapTabView.tsx` (safety insights gate)

## Content & Community
- Community "Start a Group" FAB in `community.tsx` — full form modal (name, description, category chips, city), calls `POST /api/groups`, refetches on success with haptic feedback
- `content-reports` route + `contentReportsTable` in DB — `ReportButton.tsx` component exists on mobile
- Admin content moderation queue: "Reports" tab in `admin.tsx` — shows all reports, type/reason/status/date, dismiss + action buttons hitting `PATCH /api/admin/content-reports/:id`
- `verification.ts` route + `verificationRequestsTable` in DB — web form at `/verify-business`
- `referrals.ts` route — `referralCode` + `referralCount` columns already on `usersTable`
- `/r/:code` referral redirect route in web App.tsx → `pages/referral-redirect.tsx` → redirects to `/?ref=:code`

## Push Notifications & In-App Notifications
- `pushNotifications.ts` in api-server/src/lib — `sendPushToUser(userId, message)` and `sendPushToUsersWithSavedBusiness(businessId, message)` using `pushTokensTable`
- Wired to POST `/api/reviews`: notifies business owner + users who saved the business on new review submission
- `notificationsTable` in DB (`lib/db/src/schema/notifications.ts`) — fields: id, userId, type, title, body, read, createdAt
- `GET /api/notifications` — returns user's 50 most recent notifications (auth required)
- `POST /api/notifications/mark-all-read` — marks all user notifications read (auth required)
- `POST /api/notifications/:id/read` — marks single notification read (auth required)
- NOTE: mark-all-read route MUST be declared before :id/read in notifications.ts to avoid route collision

## Native Maps
- `app.json` android section has `"googleMapsApiKey": "${GOOGLE_MAPS_API_KEY}"` — reads from EAS build environment

## Admin
- `admin.tsx` (web, 1370+ lines) — full admin panel with waitlist analytics, users, members, reviews, and reports tabs; supports editing `memberType`, `trialEndsAt`, `foundingMemberNumber` per user
- Waitlist tab has: KPI cards, 14-day growth sparkline, city leaderboard, referral leaderboard, enhanced table with referral counts
- Reports tab: full content reports moderation queue with dismiss/action actions

## Onboarding & Navigation
- `welcome.tsx` (web) — 3-step post-signup onboarding at `/welcome`
- Deep links in `app.json`: scheme `mappingwithmelanin`, `intentFilters` for `https://mappingwithmelanin.com`
- `business-dashboard.tsx` (web, 228 lines) — business owner portal at `/business-dashboard`

## Web Business Detail
- Save/unsave button (top-right hero area)
- Check-in button (beside save button) — POSTs to `/api/checkins`, shows +points toast, turns green when done

## Mobile Business Detail
- Full check-in via `useCheckins` hook + `handleCheckIn` with animated points toast

## Mental Health & Recovery Resources
- `resources.tsx` (mobile, standalone screen) — crisis lines (988, SAMHSA, DV hotline), Black mental health orgs (6), AA/NA meeting finders (5), treatment locators (4); all tappable via `Linking.openURL`
- Community tab "Resources" — 4th tab in TABS array in `community.tsx`; renders same resource categories inline with tap-to-call/text crisis buttons at top
- `resources.tsx` (web) — full page at `/resources` with dark hero, red crisis banner, 4 card grid sections; route added in App.tsx
- "Resources" added to web nav (`layout.tsx` navItems between Safety and Businesses); "Mental Health & Recovery" added to footer Community section

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
