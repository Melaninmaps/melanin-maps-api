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

## Group Travel Planning (current session)
- `groupInvites` and `groupItineraries` DB tables added to `lib/db/src/schema/groups.ts`; `maxMembers` column added to `groups` table
- API: POST /api/groups/:id/invite (admin-only), GET /api/groups/my-invites, POST /api/groups/invites/:id/respond (accept/decline), POST /api/groups/:id/plan-trip (OpenAI), GET /api/groups/:id/itineraries
- GET /api/users/search?q=name added to users.ts
- Mobile screens: `group/invite.tsx` (search + send invite), `group/my-invites.tsx` (accept/decline), `group/plan-trip.tsx` (AI itinerary generator with 3 options)
- `group/[id].tsx` updated: member action cards (Plan a Trip + Invite), pending invite list for admins, saved trip plans section
- `useGroups` Group interface updated to include `maxMembers`
- Mobile screens CANNOT import from `@workspace/db/schema` — define types locally instead

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

## Safety Features (6 features)
- `safety_checkins` DB table — userId, trustedContactEmail, scheduledAt, status (pending/checked_in/overdue/cancelled), notifiedAt
- `location_shares` DB table — sharerId, shareToken (unique), expiresAt, currentLat/Lng, isActive
- `meetup_verifications` DB table — initiatorId, partnerId, connectionId (optional int FK), status (pending/confirmed/expired)
- API routes: `GET/POST /api/safety/checkins`, `PATCH /api/safety/checkins/:id/confirm`, `DELETE /api/safety/checkins/:id`
- API routes: `GET/POST /api/safety/location-shares`, `PATCH /api/safety/location-shares/:token/update`, `GET /api/safety/location-shares/:token/view`, `DELETE /api/safety/location-shares/:id`
- API routes: `GET/POST /api/meetups`, `PATCH /api/meetups/:id/confirm`
- Cron: `POST /api/cron/safety-checkins` — finds pending check-ins past scheduledAt, emails trusted contact via `sendCheckinOverdueEmail`, marks status=overdue
- `sendCheckinOverdueEmail` added to `email.ts`
- `contentFilter.ts` enhanced: added CYBERBULLYING and DOXXING pattern arrays (checked via `buildPhrasePattern`) alongside existing THREATS, HATE_SPEECH, EXPLICIT_SEXUAL
- Mobile screens: `app/safety-hub.tsx` (dashboard with live check-in/share/meetup status), `app/checkin.tsx` (full check-in flow), `app/location-share.tsx` (live location share + copy link)
- `hooks/useGeoSafeAlert.ts` — expo-location → Google reverse geocode → query surveys by city → amber banner in MapTabView if avg safety score < 45 (1hr cooldown per city in AsyncStorage)
- Geo alert banner wired into `MapTabView.tsx`; Safety Hub wired into `settings.tsx` under Privacy & Safety

**Why:** Recording these to avoid rebuilding already-complete work across sessions.
