---
name: Allied Partner Journey — 5-stage architecture
description: DB table, routes, and business logic for the allied partner program (#84)
---

# Allied Partner Journey

## The 5 Stages (in order)
1. `applied` — owner submits application (requires ≥5 community signals)
2. `under_review` — admin picks it up for review
3. `agreement_pending` — admin approved; waiting for owner to confirm agreement
4. `active_partner` — active paying partner
5. `rejected` / `withdrawn` — terminal states (rejected has 60-day cooldown)

## DB Table
`allied_partner_applications` — created in startup-migrations via `ensureAlliedPartnerApplications()`.
**No FK constraints** — same pattern as other tables in this codebase (Railway Postgres rejects FK constraints in some configs).
Unique index: `allied_partner_one_open_per_biz` (one open app per business).

Businesses table has `allied_partner` (bool) + `allied_partner_since` (timestamptz) columns added on boot.

## Routes (all in `allied-partners.ts`)
- `GET /businesses/:id/partner-eligibility` — public, returns community score + can_apply
- `POST /businesses/:id/partner-application` — auth required, submits application
- `GET /me/partner-applications` — auth required, user's own applications
- `GET /admin/partner-applications` — admin only, list all with optional stage filter
- `GET /admin/partner-applications/:id` — admin only, single application detail
- `POST /admin/partner-applications/:id/advance` — admin only, advances to next stage
- `POST /admin/partner-applications/:id/reject` — admin only, rejects with reason
- `POST /businesses/:id/partner-application/withdraw` — auth required, owner withdraws

## Community Threshold
`COMMUNITY_CHECKIN_THRESHOLD = 5` (unique member check-ins + half of endorsements).
`REJECTION_COOLDOWN_DAYS = 60`

## Email Notifications
Uses `sendEmail` (now exported from `lib/email.ts`) — fires at `under_review`, `agreement_pending`, `active_partner` stage transitions.
Admin notified on every new application submission.

**Why:** The "earned it" mechanism ensures businesses can't buy their way into the partner program — they must build real community presence first.
