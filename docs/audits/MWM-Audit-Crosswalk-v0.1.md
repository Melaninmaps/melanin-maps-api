# Mapping With Melanin™ — Audit Crosswalk

**Version:** 0.1  
**Date:** July 19, 2026  
**Purpose:** Bridge document between the 12 audits and implementation. For every audit finding: current code state → audit requirement → gap → dependencies → workstream.  
**Status:** Review Mode. No implementation authorization granted by this document.  
**Update Rule:** This document must be updated after every implemented workstream before that workstream is marked complete.

> This crosswalk was produced by direct codebase inspection. It is the authoritative record of what exists today vs. what the audits require. Do not substitute Phase 0 proposals or wave plans for this document.

---

## How to Read This Document

| Column | Meaning |
|---|---|
| Finding | The audit requirement in plain language |
| Current Code State | What actually exists in the codebase today |
| Gap | What is missing or incomplete |
| Workstream | Which WS-XX resolves this finding |
| Status | ❌ Absent / ⚠️ Partial / ✅ Exists |

---

## Domain 1 — Identity & Authentication (Audit Score: 58/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Email registration and login | `POST /auth/register` and `POST /auth/login-email` exist in `auth.ts`. Diagnostic logging added (AUTH_LOGIN_SUCCESS etc.). Password hashed. | None critical — confirmed working via Playwright. | WS-01 | ✅ |
| Session persistence across restart | DB-backed sessions table. `authMiddleware.ts` validates on every request. Cookie + Bearer token both supported. Sessions expire at 7 days. | No "remember me" vs. short session distinction. No session list visible to user. | WS-01 | ✅ |
| Session revocation on logout | `GET /logout` and `POST /mobile-auth/logout` both call `deleteSession(sid)` — removes record from DB. Token is immediately invalid. | No "logout from all devices" (no bulk revocation by userId). | WS-01 | ⚠️ |
| Rate limiting on auth endpoints | `authLimiter`: 30 requests / 15 min applied to `/api`. `generalLimiter`: 200 requests / 15 min. | No per-account failed-attempt tracking. No lockout after N failures. Rate limit is IP-based only — does not distinguish account-targeted attacks. | WS-01 | ⚠️ |
| Brute-force protection | `express-rate-limit` exists. | No account lockout. No exponential backoff. No failed-attempt counter per account. | WS-01 | ❌ |
| Phone OTP registration and login | `POST /auth/phone/send-otp` and `POST /auth/phone/verify-otp` exist in `phone-auth.ts`. Twilio Verify integration. Test-phone bypass present. | OTP delivery not verified end-to-end on production numbers in this sprint. | WS-02 | ✅ |
| Apple Sign-In | Route exists at `POST /auth/apple`. Identity token verified via Apple public keys. Nonce matching implemented. | 🟡 **Wave 1-B implemented** — login.tsx now passes SHA256(rawNonce) to signInAsync. Awaiting founder verification on TestFlight build. Server-side was already correct. | WS-02 | 🟡 |
| Password reset — full cycle | `POST /auth/forgot-password` (6-digit code, sha256 hashed, email sent). `POST /auth/reset-password` (verifies and updates passwordHash). Mobile deep link handled. | Full human cycle (real inbox → enter code) not yet verified on production. | WS-01 | ⚠️ |
| Account recovery | Password reset flow serves as account recovery. | No secondary recovery method (backup codes, trusted contact). | WS-01 | ⚠️ |
| Auth security audit log | `req.log.info` used for diagnostic events (AUTH_LOGIN_SUCCESS etc.). | No structured DB-level security event log. No record of password changes, failed attempts, or session creation survives log rotation. | WS-01 | ❌ |
| Global token revocation (all devices) | Single-session logout works. | No bulk `DELETE FROM sessions WHERE userId = X`. A compromised account cannot be fully signed out remotely. | WS-01 | ❌ |
| Profile data validation on registration | Username uniqueness checked. Email format validated. | No enforcement of display name length, no profanity filter on usernames, no phone format validation before Twilio call. | WS-01 | ⚠️ |

---

## Domain 2 — Business Discovery (Audit Score: 62/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Confidence score freshness | `confidence_score` column exists on `businesses` table. Used for ranking in `businesses.ts` L158. | No TTL, decay function, or scheduled recalculation. A business with zero recent activity retains its historic score indefinitely. | WS-04 | ⚠️ |
| Business data accuracy / source integrity | Businesses seeded from static array + DB. | No source-of-truth attestation. No mechanism to flag or re-verify stale data. No "last verified" timestamp. | WS-04 | ❌ |
| Search injection prevention | Business search exists. | No parameterized search review confirmed. SQL injection risk not verified. Full-text search implementation unclear. | WS-04 | ⚠️ |
| Owner claim lifecycle | `business_claims` table with `pending` status and timestamps exists. `business-owner-links.ts` handles final association. | No claim expiry. No duplicate claim prevention. No notification to owner on claim approval/rejection. No appeal pathway for rejected claims. | WS-04 | ⚠️ |
| Non-inferred ownership | KinfolkAI system prompt instructs using platform business list. | No explicit "Ownership Integrity" rule in AI system prompt. AI can infer or assert ownership from sparse data. | WS-08 | ❌ |
| Confidence score not displayed | Score used internally for ranking. | Member-facing explanation of what the confidence score means and how to improve it does not exist. | WS-04 | ❌ |

---

## Domain 3 — Maps & Location (Audit Score: 47/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Maps API key exposure | `GET /api/maps/js-key` delivers key server-side. | Key delivered to client browser on request — still exposed in browser DevTools network tab. No domain restriction confirmed. API key restrictions (HTTP referrer lock) not verified. | WS-05 | ⚠️ |
| Coordinate validation | `numeric(10, 7)` type in schema. NaN check in `/community-alerts/nearby`. | No explicit rejection of `lat: 0, lng: 0` (Gulf of Guinea). Businesses with failed geocoding could publish at origin. No boundary check (lat must be -90 to 90, lng -180 to 180). | WS-05 | ⚠️ |
| Safety-overlay accuracy | Safety scores displayed on map. | Safety overlay sourced from community reports without confidence threshold gate. Low-evidence overlays not distinguished from high-evidence ones. | WS-06 | ⚠️ |
| Pin clustering failures | Map pins exist. | Clustering behavior at zoom levels not verified. Overlapping pins at same coordinate not handled. | WS-05 | ❌ |
| Offline handling | Map loads from Google Maps JS API. | No offline fallback. Map fails silently if API unavailable. `gm_authFailure` handler exists on web but no member-facing explanation. | WS-05 | ⚠️ |
| Location permission consent screen | Mobile permission flow exists. | No pre-permission explanation screen before system prompt on iOS/Android. Permission denied state not gracefully handled in all map contexts. | WS-05 | ⚠️ |
| Location data retention / deletion | `location_shares` has cascade delete on user delete. | No retention schedule. Location history not purged on schedule. User cannot delete location history without deleting account. | WS-05 | ❌ |
| Service-area / home-based business | Business type field exists. | Home-based businesses still require lat/lng coordinate. No "service area" model. Home address would be published as pin. | WS-05 | ❌ |

---

## Domain 4 — Community & Social (Audit Score: 55/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Content moderation on post creation | `contentFilter.ts` uses regex for EXPLICIT_SEXUAL, HATE_SPEECH, THREATS, CYBERBULLYING, DOXXING. Synchronous check on post/message creation. | Regex-only detection. No AI-assisted moderation. No appeals for wrongly filtered content. | WS-07 | ⚠️ |
| Blocking enforcement — community feed | `community_boundaries` table exists. Block creation route exists. | `GET /community/posts` does NOT filter blocked users from feed results. Blocked user's posts appear in blocker's feed. | WS-07 | ❌ |
| Blocking enforcement — DMs | Message request system exists (pending/accepted). Private accounts require follow. | `pauseDMs` preference defined in schema but NOT enforced in `conversations.ts`. No block check before DM creation. | WS-07 | ❌ |
| Blocking enforcement — circles, events | Circles and events routes exist. | No block enforcement in `circles.ts` or `events.ts`. Blocked users can join circles or events of blocker. | WS-07 | ❌ |
| Shared-location revocation on block | `location_shares` table exists. | No automatic revocation of active location shares when a block is created. Blocker must manually stop sharing. | WS-07 | ❌ |
| Reporter protection | `reporterId` stored in `content_reports`. Not returned in public API. | No active retaliation protection (e.g., blocking the reporter from being identified as "frequent reporter"). No anonymization of report pattern. | WS-07 | ⚠️ |
| Post permanence | Posts stored in DB. | No audit trail for edited or deleted posts. No record of who moderated a post or why. | WS-07 | ❌ |
| Privacy-boundary enforcement — safe_space_preferences | Table defined in schema: `pauseDMs`, `requireFollowers`, `verifiedUsersOnly`. | None of these preferences are enforced in route handlers. Schema exists but has no effect. | WS-07 | ❌ |
| Community-space governance | Circles exist with admin roles. | No graduated moderation roles within circles. Circle admin has no moderation tools beyond removing members. | WS-07 | ⚠️ |
| Event cancellation notification | Events table and routes exist. | No event cancellation lifecycle. No attendee notification on cancel. No material-change tracking. | WS-10 | ❌ |
| Harassment detection | Content filter covers threats and cyberbullying. | No pattern detection across multiple messages (serial harassment). No escalation path for repeat offenders. | WS-07 | ⚠️ |

---

## Domain 5 — Safety Systems (Audit Score: 61/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Unique confirmation per reporter | `POST /community-alerts/:id/confirm` increments `confirmed_count`. | NO check whether the same `userId` has already confirmed. One user can confirm the same alert unlimited times, inflating the count. | WS-06 | ❌ |
| Alert geo targeting | Haversine formula in `/community-alerts/nearby`. 16.09km (10 mile) radius. | Fixed radius — no alert-type-specific radius. A neighborhood event alert covers same radius as an emergency. | WS-06 | ⚠️ |
| Alert expiry mechanism | `EXPIRY_MINUTES` registry by alert type (police: 60m, festival: 1440m). | Expiry logic exists but must be verified as actively enforced by cron. No evidence expiry cron is running. | WS-06 | ⚠️ |
| Alert clearing mechanism | Alerts clear when `cleared_count >= 3`. `isActive` set to false. | Same user can submit multiple clears. No unique-clearer enforcement. Clearing threshold is hardcoded. | WS-06 | ⚠️ |
| Reporter identity protection | `reportedBy` stored internally. Not returned in public `/nearby` endpoint. | No protection against admin-level exposure of reporter identity. No anonymization in the moderation queue. | WS-06 | ⚠️ |
| Safety score integrity for minority businesses | Safety scores applied to businesses. | No audit of whether safety scores disproportionately penalize minority-owned businesses with sparse positive data. No minimum evidence threshold before score publication. | WS-06 | ❌ |
| Emergency alert validation | Alert submission accepts any input. | No secondary verification required for emergency-level alerts. A single unverified report can trigger emergency-level push to all nearby users. | WS-06 | ❌ |
| False-report consequences | Content reporting exists. | No mechanism to track and penalize repeat false reporters. No false-report counter on user record. | WS-06 | ❌ |
| Report manipulation prevention | No manipulation detection found. | No signal detection for coordinated report campaigns, identical language patterns, or source independence checks. | WS-06 | ❌ |

---

## Domain 6 — AI / KinfolkAI (Audit Score: 41/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Hallucination handling | System prompt instructs use of platform businesses. | No structured fact-checking layer. AI can assert information not in platform data without flagging it as inferred. | WS-08 | ❌ |
| Source attribution | Business names cited in narrative responses. | No structured citation metadata in API response. Member cannot verify the source of a specific claim. | WS-08 | ⚠️ |
| Ownership Integrity enforcement | System prompt uses platform business list. | No explicit rule prohibiting inference of ownership from name, listing category, or cultural signals. AI can assert or imply ownership incorrectly. | WS-08 | ❌ |
| Compassion Protocol™ (FD-7.2) | "Warm and direct" voice defined in system prompt. | No Compassion Protocol implementation. No three-level crisis response (stress → distress → emergency). No localized culturally affirming resources. | WS-08 | ❌ |
| Professional consultation threshold (FD-7.1) | No implementation found. | AI provides health, legal, financial responses without threshold-based professional referral trigger. | WS-08 | ❌ |
| Uncertainty disclosure (FD-7.5/7.6) | Soft disclosure: "search for new spots" if data missing. | No explicit uncertainty rule. AI does not state "I don't have reliable information on this" when data is insufficient. No knowledge currency disclosure for time-sensitive domains. | WS-08 | ⚠️ |
| AI-generated content labeling | Feature named KinfolkAI throughout UI. | No technical "AI-generated" metadata field in API response. No on-screen label distinguishing AI responses from human content in feeds. | WS-08 | ❌ |
| Conversation deletion (FD-7.3/7.4) | `kinfolk_sessions` table exists. | No `DELETE /kinfolk/sessions/:id` or delete-all route. Member cannot delete conversation history. Sealed founder decision requires member-controlled deletion. | WS-08 | ❌ |
| Proactive AI controls | KinfolkAI responds to member prompts. | No opt-in gate for proactive AI suggestions. AI can push recommendations without member requesting them. | WS-08 | ❌ |
| AI rate limiting | `checkAiPool` enforces monthly limits by tier. | Rate limit is on AI volume, not prompt injection detection. No defense against prompt injection attacks. | WS-08 | ⚠️ |
| Prompt injection defense | No implementation found. | No sanitization of member-supplied content before inclusion in AI prompt context. | WS-08 | ❌ |

---

## Domain 7 — Membership & Commerce (Audit Score: 53/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Stripe webhook idempotency | `webhookHandlers.ts` processes events and updates DB. | No idempotency check. Stripe may retry webhooks on timeout — a retry would double-process the event (e.g., extend trial twice, credit twice). No processed-event log. | WS-09 | ❌ |
| RevenueCat server-to-server verification | `POST /revenuecat/sync` exists. Client passes `productIdentifier` after purchase. | Client-initiated sync — not a secure server webhook. A client could pass any productIdentifier and grant itself any tier. No server-side purchase receipt verification. | WS-09 | ❌ |
| One active entitlement rule | `requireMembership` checks `member_type` and `stripe_subscription_id`. | No enforcement of one-subscription-per-account. User could theoretically hold both a Stripe and RevenueCat subscription simultaneously without resolution. | WS-09 | ⚠️ |
| Family plan seat boundaries | `family_circle_members` table. Capacity = included seats + add-on seats. `getFamilyMemberCount` checks live count. | AI usage pool shared across family not verified as enforced at request time. No test of over-capacity edge case. | WS-09 | ⚠️ |
| Grace period on subscription expiry | 6-month grace for safety features (new accounts). | On `customer.subscription.deleted`, `stripe_subscription_id` is nulled immediately. No grace period for paid features after accidental cancellation. | WS-09 | ❌ |
| Billing transparency | Billing history route exists. | No member-facing view of all charges, failed payments, or upcoming renewals in-app. | WS-09 | ⚠️ |
| Cancellation flow | Subscription deletion handled via Stripe webhook. | No in-app cancellation flow. Member must cancel through Stripe portal. No confirmation of what features they will lose. | WS-09 | ❌ |
| Trial abuse prevention | `trial_ends_at` column. Single trial per account. | No device fingerprinting or payment method check to prevent serial trial creation with new accounts. | WS-09 | ⚠️ |
| Webhook failure handling | Webhooks processed synchronously. | No dead-letter queue. If webhook processing fails, Stripe retries but the platform may serve the wrong entitlement state until next successful delivery. | WS-09 | ❌ |

---

## Domain 8 — Data Architecture (Audit Score: 48/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Migration strategy | Drizzle push (`drizzle-kit push`) used. No migration files. No `migrations/` folder. | No rollback capability. A failed push to production cannot be undone. Schema changes go directly to production. No migration history record. | WS-14 | ❌ |
| CRON_SECRET fail-closed | `verifyCronSecret` checks `x-cron-secret` header against `process.env.CRON_SECRET`. | **If `CRON_SECRET` env var is not set, the check returns `true` — cron endpoints are open to anyone.** This is a P0 security vulnerability. | WS-14 | ❌ |
| Connection pool configuration | `pg` Pool initialized with `DATABASE_URL`. SSL enabled (rejectUnauthorized: false for non-local). | Pool size not configured explicitly. Under high load, connection exhaustion is possible. No pool health monitoring. | WS-14 | ⚠️ |
| Cascade deletes | Defined on: safety_checkins, location_shares, messages, business_improvement_plans, business_click_events. | Not comprehensive across all tables. Orphaned records possible for some foreign key relationships (e.g., community_posts → deleted users). | WS-14 | ⚠️ |
| PII retention enforcement | PII stored in users table (name, email, location). Privacy policy served at `/privacy`. | No automated retention schedule. No data scrubbing cron. No member-facing data deletion request flow beyond account delete. | WS-14 | ❌ |
| Backup verification | Likely managed at infrastructure level (Replit/Railway Postgres). | No application-level backup health check. No verified restore test record. Platform cannot confirm data is recoverable. | WS-14 | ❌ |
| Orphaned record cleanup | Some cascades exist. | No cleanup cron for orphaned records from non-cascaded deletes (e.g., kinfolk_sessions for deleted users, marketplace items for deleted accounts). | WS-14 | ❌ |
| Cross-table consistency | Each route manages its own DB state. | No transactional consistency enforcement across related tables. A failed webhook could leave membership in partially updated state. | WS-14 | ⚠️ |

---

## Domain 9 — Events & Experiences (Audit Score: 55/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Event cancellation lifecycle | Events table and basic CRUD routes exist. | No `status` field for cancelled/rescheduled. No data model for material changes. No attendee list query for notification targeting. | WS-10 | ❌ |
| Material-change notification | No implementation found. | No mechanism to notify RSVPed attendees when event time, location, or format changes. | WS-10 | ❌ |
| Capacity enforcement | Events can have capacity field. | Enforcement of max capacity at RSVP time not verified. Over-capacity RSVPs may succeed. | WS-10 | ⚠️ |
| Experience-completion tracking | Check-ins exist for businesses. | No event attendance completion tracking. No post-event follow-up hook. | WS-10 | ❌ |
| Booking data integrity | RSVPs stored. | No RSVP deduplication confirmed. Same user could RSVP multiple times. | WS-10 | ⚠️ |

---

## Domain 10 — Communications (Audit Score: 55/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Quiet hours enforcement (FD-10.1-10.3) | Push notification infrastructure exists (`pushNotifications.ts`, Expo SDK). | **No quiet hours check anywhere in push or email dispatch.** Notifications sent immediately on trigger regardless of time. 10 PM – 8 AM window not implemented. | WS-11 | ❌ |
| Unsubscribe infrastructure | No unsubscribe links in email templates (`email.ts`). | **CAN-SPAM violation.** No unsubscribe mechanism exists. No opt-out backend route. No per-category email preference management. | WS-11 | ❌ |
| Physical address in emails | "Melanin Maps LLC" and website included. | **CAN-SPAM violation.** No full physical street address in email footers as legally required. | WS-11 | ❌ |
| Email retry / reliability | Resend API used. Manual `delay()` calls in loops. | No retry queue. No dead-letter handling. Failed email sends are logged but not retried. | WS-11 | ❌ |
| Duplicate notification prevention | Alert push uses Set for deduplication within one send. Negative review alert triggers only at count of 3. | No global idempotency layer. Cron retries could re-send same notification. Bulk email blasts have no sent-log deduplication. | WS-11 | ⚠️ |
| Delivery classes | Some differentiation between safety and promotional content exists. | No formal delivery class system. Emergency and promotional notifications share same dispatch path. | WS-11 | ❌ |
| Explain Every Notification™ (FD-10.4) | Push notifications sent with title/body. | No "why you received this" explanation in notification payload or in-app notification history. | WS-11 | ❌ |
| Communication history | `notificationsTable` exists for in-app history. | Email history not stored. Member cannot see what emails were sent to them. | WS-11 | ⚠️ |

---

## Domain 11 — Administration & Governance (Audit Score: 30/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| Single admin authorization model (FD-11.1) | `isAdmin(req)` helper function exists. Uses email allowlist (`ADMIN_EMAILS` env var) OR `user.role === 'admin'` DB check. | **Four incompatible models in practice:** email allowlist, DB role, frontend email comparison, hardcoded bootstrap. Each route re-implements or imports differently. No shared Express middleware (`requireAdmin`). | WS-12 | ❌ |
| Admin MFA | No implementation found anywhere. | Admin accounts have no MFA, device trust, or session binding. A compromised admin password = full admin access. | WS-12 | ❌ |
| Decision Ledger / institutional audit log | Admin actions logged via `req.log.info`. Status columns updated on decisions (content_reports, reviews, etc.). | **No append-only Decision Ledger DB table.** Log entries do not survive log rotation. No evidence, rationale, or reviewer field on decisions. No audit trail for role promotions. | WS-13 | ❌ |
| Appeals system | "Appeal" button in ResolutionCenter UI shows "Appeal submissions open in the next update." Members directed to email hello@mappingwithmelanin.com. | **No appeals table. No appeals route. No structured appeals workflow.** Email-based appeals have no tracking, SLA, or documented outcome. | WS-13 | ❌ |
| Durable governance record for role promotion | Admin role promotion updates `user.role` in DB. | No record of who promoted whom, when, and why. Promotion is unilateral and untracked. | WS-12 | ❌ |
| Bootstrap endpoint security | Bootstrap route exists for initial admin setup. | No expiry on bootstrap window. No lockout after first use. No notification. No audit record of bootstrap use. | WS-12 | ❌ |
| Conflict-of-interest protection | No implementation found. | Admin can act on content or accounts where they have a personal relationship. No recusal mechanism. | WS-12 | ❌ |
| Emergency Authority™ (FD-11.6/11.11) | No implementation found. | No emergency authority model. No expiry. No secondary review requirement. No Decision Ledger entry for emergency actions. | WS-12 | ❌ |

---

## Domain 12 — Cross-System Integration (Audit Score: 40/100)

| Finding | Current Code State | Gap | WS | Status |
|---|---|---|---|---|
| CRON_SECRET fail-closed | `verifyCronSecret`: `if (!CRON_SECRET) return true` | **P0 security vulnerability.** If env var is unset in any environment, all cron endpoints are publicly accessible. Must fail closed. | WS-14 | ❌ |
| Authenticated identity context completeness | `req.user` populated by `authMiddleware`. Contains `id`, `email`, `role`, `memberType`. | `trustLevel`, `quietHoursActive`, `accountSuspended`, `familyPlanOwnerId` not included. Institutional decisions made without full member context. | WS-03 | ⚠️ |
| Trust level staleness | `trustLevel` stored on user record. | Trust level is display-oriented. Not connected to permission decisions. A member's trust level does not affect what they can access. | WS-03 | ❌ |
| Signal cross-pollination | Each subsystem (membership, safety, trust, AI) manages its own state independently. | Membership tier does not affect safety confidence weighting. Trust score does not affect AI depth. Block status does not affect search results. Signals are siloed. | WS-03 | ❌ |
| Constitutional principles enforcement | Principles documented in Constitution and docs. | No shared constitutional middleware, no enforced constraints, no algorithmic constitutional checks at route level. Principles have no technical expression in the platform. | WS-03 | ❌ |
| Member state divergence | State spread across `users` table, `requireMembership` middleware, session object. | A member's subscription state can differ between what the session says, what the DB says, and what RevenueCat says during the same request lifecycle. | WS-03 | ❌ |
| Event data model for cancellation | Events table has basic fields. | No `cancelled_at`, `cancellation_reason`, `rescheduled_to` fields. Material-change history not storable. | WS-10 | ❌ |
| Safety reporter outcome feedback | Reports accepted and stored. | Reporter receives no acknowledgement of what happened to their report. No outcome notification (reviewed / dismissed / actioned). | WS-06 | ❌ |
| Business verification notifications and appeals | Verification status stored on business record. | No notification to business on verification approval or rejection. No appeal pathway for rejected verification. | WS-04 | ❌ |
| Graceful degradation standard | Each service fails independently. | No platform-wide graceful degradation contract. KinfolkAI failure returns unhandled error. Push notification failure is silent. No fallback display state. | WS-14 | ❌ |

---

## Summary Table — Gap Count by Workstream

| Workstream | ❌ Absent | ⚠️ Partial | ✅ Exists | Notes |
|---|---|---|---|---|
| WS-01 Auth lifecycle | 3 | 5 | 2 | Brute force, global revocation, audit log absent |
| WS-02 Mobile auth | 0 | 1 | 1 | Apple nonce is the blocking item |
| WS-03 Unified identity | 3 | 1 | 0 | Trust, signals, member state all siloed |
| WS-04 Business data integrity | 3 | 2 | 1 | No freshness, no verification appeals, no 0,0 guard |
| WS-05 Geographic integrity | 3 | 3 | 0 | Coordinate validation weakest domain |
| WS-06 Community safety alerts | 5 | 3 | 2 | Unique confirmation, manipulation detection absent |
| WS-07 Blocking & privacy | 6 | 3 | 0 | Block table exists; enforcement absent everywhere |
| WS-08 KinfolkAI safety layer | 7 | 2 | 1 | Lowest-scoring content domain — most absent |
| WS-09 Membership commerce | 4 | 3 | 0 | Webhook idempotency and RC verification critical |
| WS-10 Event lifecycle | 3 | 2 | 0 | No cancellation, material-change, or completion model |
| WS-11 Communications | 5 | 2 | 0 | CAN-SPAM violations; quiet hours absent |
| WS-12 Admin authority | 5 | 0 | 0 | Worst domain — admin MFA, ledger, appeals all absent |
| WS-13 Decision Ledger | 2 | 0 | 0 | No table, no structure, no appeals |
| WS-14 Deployment resilience | 4 | 2 | 0 | CRON_SECRET P0; no migration rollback |
| WS-15 Launch experience polish | Assessed per-domain above | | | Depends on WS-01, 04, 05 stabilizing |
| WS-16 Verification | Not applicable — runs after each WS | | | |

---

## Highest-Priority Absent Items (P0, No Dependencies)

These are findings where nothing exists in the codebase and no other workstream must complete first:

1. **CRON_SECRET fails open** — `if (!CRON_SECRET) return true` — single-line fix, immediate deploy
2. **Unique alert confirmation not enforced** — same user can confirm unlimited times
3. **Quiet hours not implemented** — notifications sent at any hour
4. **CAN-SPAM: no unsubscribe link in any email** — legal compliance violation
5. **CAN-SPAM: no physical address in emails** — legal compliance violation
6. **Blocking not enforced in feed, DMs, circles, events** — table exists; queries ignore it
7. **RevenueCat sync is client-controlled** — no server-side purchase verification
8. **Stripe webhook not idempotent** — retry = double-process
9. **Decision Ledger table does not exist** — FD-12.5 requires it at launch
10. **Admin MFA does not exist** — FD-11.1 requires single authority + secure sessions

---

## Document Maintenance Rule

This document is updated **after every implemented workstream**, before that workstream is marked complete. The update must include:
- Status change for each resolved finding (⚠️ or ❌ → ✅)
- Evidence reference (Playwright test name, Railway log timestamp, or human test record)
- Version bump (v0.1 → v0.2, etc.)
- Any new gaps discovered during implementation added immediately

This document is never deleted. It is the implementation memory of the platform.
