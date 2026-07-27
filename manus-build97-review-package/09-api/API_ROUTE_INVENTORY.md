# API Route Inventory — Mapping With Melanin™
## Build 97 Manus Review Package
**Date:** July 27, 2026
**Base URL:** `https://www.mappingwithmelanin.com`
**All routes prefixed with `/api` (mounted at `app.use("/api", router)`)**

---

## Authentication Middleware

All protected routes use `requireAuth` middleware:
- Reads session cookie (`SESSION_COOKIE`)
- Looks up session in `sessions` table
- Attaches user to `req.user`
- Returns 401 if no valid session

`requireMembership(tier)` middleware gates routes behind subscription tier.

---

## Health and Readiness

| Method | Path | Auth | Purpose | DB | Notes |
|--------|------|------|---------|-----|-------|
| GET | `/api/healthz` | None | Process liveness (no DB probe) | No | Returns immediately — Railway container liveness |
| GET | `/api/readyz` | None | DB-aware readiness | Yes | Pool stats + `SELECT 1` with 2s timeout |
| GET | `/api/readyz/history` | None | 12-hour health ring buffer | No | In-memory; shows 5-min synthetic check results |

---

## Authentication Routes (`/api/auth/*`)

| Method | Path | Auth | Purpose | DB | Retry | Notes |
|--------|------|------|---------|-----|-------|-------|
| POST | `/api/auth/apple` | None | Apple Sign-In / registration | Yes | ✅ withDbRetry | iOS 26+ nonce verified |
| POST | `/api/auth/login-email` | None | Email + password login | Yes | ✅ withDbRetry | bcrypt compare |
| POST | `/api/auth/register` | None | Email registration | Yes | ✅ withDbRetry | bcrypt hash; sends welcome email |
| GET | `/api/auth/check-username` | None | Username availability check | Yes | ✅ withDbRetry | Called during registration |
| GET | `/api/auth/me` | Required | Session validation + user object | Yes | No | Mobile polls this on launch |
| POST | `/api/auth/logout` | Required | Session invalidation | Yes | No | Clears session cookie |
| DELETE | `/api/auth/account` | Required | Account deletion | Yes | No | Revokes Apple token, cancels Stripe |
| POST | `/api/auth/forgot-password` | None | Send 6-digit reset code | Yes | No | Resend email |
| POST | `/api/auth/reset-password` | None | Apply reset code + new password | Yes | No | 15-min code expiry |
| GET | `/api/auth/login` | None | OIDC login init (web) | No | No | Replit OIDC flow |
| GET | `/api/auth/callback` | None | OIDC callback (web) | Yes | No | Web session creation |
| GET | `/api/mobile-auth/init` | None | Mobile OIDC init | No | No | Proxies OIDC for mobile |
| GET | `/api/mobile-auth/done` | None | Mobile OIDC completion | Yes | No | Returns session token via deep link |
| POST | `/api/auth/verify-email` | None | Email verification | Yes | No | Token from welcome email |

---

## Business Routes (`/api/businesses/*`)

| Method | Path | Auth | Purpose | DB | Covered in Build 97 |
|--------|------|------|---------|-----|---------------------|
| GET | `/api/businesses` | Optional | List/search businesses | Yes ✅ retry | ✅ Yes |
| GET | `/api/businesses/:id` | Optional | Business detail | Yes | ✅ Yes |
| POST | `/api/businesses` | Required (admin) | Create business | Yes | Admin only |
| PUT | `/api/businesses/:id` | Required (owner/admin) | Update business | Yes | Business owner |
| POST | `/api/businesses/community-reference` | Required | Add community reference | Yes | ✅ Yes |
| GET | `/api/businesses/:id/preview` | Optional | Business preview card | Yes | ✅ Yes |
| POST | `/api/businesses/:id/claim` | Required | Submit ownership claim | Yes | ✅ Yes |
| GET | `/api/businesses/:id/identity` | Optional | Ownership/diaspora identity | Yes | ✅ Yes |

---

## Maps Routes (`/api/maps/*`)

| Method | Path | Auth | Purpose | Notes |
|--------|------|------|---------|-------|
| GET | `/api/maps/js-key` | Optional | Google Maps API key (server-side) | Returns key — not embedded in client bundle |

---

## Heritage/Cultural Sites (`/api/cultural-sites/*`)

| Method | Path | Auth | Purpose | Covered in Build 97 |
|--------|------|------|---------|---------------------|
| GET | `/api/cultural-sites` | Optional | List/search cultural sites | ✅ Yes |
| GET | `/api/cultural-sites/:id` | Optional | Site detail | ✅ Yes |

---

## KinfolkAI Routes (`/api/kinfolk/*`)

| Method | Path | Auth | Tier | Purpose | Rate Limited |
|--------|------|------|------|---------|-------------|
| POST | `/api/kinfolk/chat` | Required | Any | Primary chat completion | Yes — monthly quota |
| GET | `/api/kinfolk/sessions` | Required | Any | Conversation history | No |
| GET | `/api/kinfolk/sessions/:id` | Required | Any | Session detail | No |
| DELETE | `/api/kinfolk/sessions/:id` | Required | Any | Delete session | No |
| POST | `/api/kinfolk/feedback` | Required | Any | Thumbs up/down | No |
| POST | `/api/kinfolk/voice` | Required | Any | TTS audio | Yes — character quota |
| GET | `/api/kinfolk/voice-usage` | Required | Any | Voice usage stats | No |

---

## Community Routes (`/api/community/*`)

| Method | Path | Auth | Purpose | Covered in Build 97 |
|--------|------|------|---------|---------------------|
| GET | `/api/community/posts` | Optional | Feed (everyone / following) | ✅ Yes |
| POST | `/api/community/posts` | Required | Create post | ✅ Yes |
| GET | `/api/community/posts/:id` | Optional | Post detail | ✅ Yes |
| PUT | `/api/community/posts/:id` | Required | Edit post | ✅ Yes |
| DELETE | `/api/community/posts/:id` | Required | Delete post | ✅ Yes |
| POST | `/api/community/posts/:id/like` | Required | Like/unlike | ✅ Yes |
| POST | `/api/community/posts/:id/repost` | Required | Repost | ✅ Yes |
| GET | `/api/community/posts/:id/comments` | Optional | Comments | ✅ Yes |
| POST | `/api/community/posts/:id/comments` | Required | Add comment | ✅ Yes |

---

## Events Routes (`/api/events/*`)

| Method | Path | Auth | Purpose | Covered in Build 97 |
|--------|------|------|---------|---------------------|
| GET | `/api/events` | Optional | List events | ✅ Yes |
| GET | `/api/events/:id` | Optional | Event detail | ✅ Yes |
| POST | `/api/events` | Required | Create event | ✅ Yes |
| POST | `/api/event-rsvps` | Required | RSVP to event | ✅ Yes |

---

## Safety and Reports

| Method | Path | Auth | Purpose | Covered in Build 97 |
|--------|------|------|---------|---------------------|
| POST | `/api/reports` | Required | Submit safety/discrimination report | ✅ Yes |
| GET | `/api/reports` | Required (admin) | List reports (admin) | Admin only |
| POST | `/api/content-reports` | Required | Report UGC content | ✅ Yes |
| GET | `/api/safety-checkins` | Required | Safety check-ins | ✅ Yes |
| POST | `/api/safety-checkins` | Required | Create check-in | ✅ Yes |

---

## Membership/Subscription Routes

| Method | Path | Auth | Purpose | Notes |
|--------|------|------|---------|-------|
| GET | `/api/membership/plan` | Required | Current plan info | — |
| POST | `/api/billing/checkout` | Required | Create Stripe checkout session | Web subscription |
| GET | `/api/billing/history` | Required | Billing history | — |
| POST | `/api/stripe/webhook` | None (Stripe sig) | Stripe webhook | Singleton pool fix applied |
| POST | `/api/revenuecat/webhook` | None (RC sig) | RevenueCat webhook | iOS/Android IAP events |
| GET | `/api/family/ai-usage` | Required | Family plan AI pool | — |
| POST | `/api/family/add-seat` | Required | Add family seat | — |

---

## User/Profile Routes

| Method | Path | Auth | Purpose | Covered in Build 97 |
|--------|------|------|---------|---------------------|
| GET | `/api/users/:id` | Optional | Public user profile | ✅ Yes |
| PUT | `/api/users/profile` | Required | Update profile | ✅ Yes |
| GET | `/api/users/me/settings` | Required | User settings | ✅ Yes |
| PUT | `/api/users/me/settings` | Required | Update settings | ✅ Yes |
| POST | `/api/users/follows/:id` | Required | Follow/unfollow user | ✅ Yes |
| GET | `/api/saved-places` | Required | Saved places list | ✅ Yes |
| POST | `/api/saved-places` | Required | Save a place | ✅ Yes |
| DELETE | `/api/saved-places/:id` | Required | Unsave | ✅ Yes |

---

## Admin Routes (`/api/admin/*`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/admin/bootstrap` | First admin only | Promote first admin |
| GET | `/api/admin/users` | Admin | User list |
| PUT | `/api/admin/users/:id` | Admin | Update user (approve, role, etc.) |
| GET | `/api/admin/businesses` | Admin | All businesses |
| POST | `/api/admin/businesses/:id/approve` | Admin | Approve business |
| GET | `/api/admin/reports` | Admin | Content/safety reports |
| GET | `/api/admin/export/businesses` | Admin | CSV export (leads) |
| GET | `/api/admin/export/outreach` | Admin | CSV export (outreach) |

---

## Other Notable Routes

| Method | Path | Auth | Purpose | Notes |
|--------|------|------|---------|-------|
| GET | `/api/reviews` | Optional | Business reviews | |
| POST | `/api/reviews` | Required | Submit review | |
| GET | `/api/notifications` | Required | Notification list | |
| POST | `/api/push-token` | Required | Register push token | |
| GET | `/api/jobs` | Optional | Opportunity Center jobs | Near-me Haversine |
| GET | `/api/mentorship` | Optional | Mentor profiles | |
| POST | `/api/submit-business` | Required | Community business submission | |
| GET | `/api/og/:id` | None | OG image generation | Satori-based |
| GET | `/api/knowledge` | Optional | Topic library | |

---

## Routes That Are Missing, Unstable, Mocked, or Undocumented

| Route | Status | Notes |
|-------|--------|-------|
| Historical Sundown Towns | ❓ Unknown | No confirmed dedicated route; `cultural-sites` may serve this data |
| `/api/dl/review-package` | Temporary | Added for this review package; should be removed before production |
| `/api/phone-auth/*` | Partial | Twilio phone auth router exists; implementation scope unclear |
| Emergency/historical safety data | None | No confirmed route for historical sundown data yet |

---

## Test Coverage

| Route Group | Tested | Test Type |
|-------------|--------|-----------|
| Auth (login, register, Apple Sign-In) | 🔶 Partial | E2E setup exists (`tests/` directory); full suite not confirmed running |
| Businesses | 🔶 Partial | |
| KinfolkAI | ❌ Unknown | |
| Community | ❌ Unknown | |
| Admin | ❌ Unknown | |

**No unit or integration tests are confirmed for most API routes.** E2E test infrastructure exists (Playwright-based via testing skill). See `docs/product/releases/ENGINEERING_REVIEW_BUILD97.md` for E2E test status.
