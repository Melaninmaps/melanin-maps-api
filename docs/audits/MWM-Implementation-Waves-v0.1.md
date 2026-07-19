# Mapping With Melanin™ — Implementation Waves

**Version:** 0.1  
**Date:** July 19, 2026  
**Status:** Awaiting founder approval. No implementation begins until approved.  
**Source:** Derived from Audit Crosswalk v0.1 and Consolidated Audit Implementation Register v0.1.  
**Authorization phrase:** "Please implement." — applies per wave, not to the whole document.

> This document converts crosswalk gap findings into sequenced, dependency-ordered implementation waves. Each wave specifies audit findings resolved, systems affected, dependencies, deployment risk, EAS build requirement, tester experience impact, and verification plan.

---

## RevenueCat Attack Path — Addressed Before Wave Table

The advisor flagged this finding for explicit explanation before any implementation begins.

**The exact attack path today:**

1. A member opens the iOS app with a valid auth token (logged in normally).
2. They skip the App Store purchase flow entirely.
3. They call `POST /api/revenuecat/sync` directly — for example via curl or a proxy tool — with `{ productIdentifier: "mwm_trail_monthly" }` and their Bearer token.
4. The API server receives the request, maps `"mwm_trail_monthly"` to the Trailblazer tier, and executes `UPDATE users SET member_type = 'trailblazer', stripe_subscription_id = 'rc_mwm_trail_monthly' WHERE id = X`.
5. The member now has full Trailblazer access. No money changed hands. No App Store transaction occurred. No RevenueCat subscription exists.

**Why this works:** The route trusts the `productIdentifier` string sent by the client. There is no server-side call to RevenueCat's API to verify that a real purchase for this user exists.

**The proposed fix:** RevenueCat provides a REST API at `GET https://api.revenuecat.com/v1/subscribers/{app_user_id}`. The server can call this endpoint using the RevenueCat secret API key and verify that the user's active entitlements actually include the claimed product. The `/revenuecat/sync` route should be restructured to:
1. Accept the `app_user_id` from the client.
2. Call RevenueCat's API server-side.
3. Read the `entitlements` object from RevenueCat's response.
4. Set `member_type` based on what RevenueCat confirms — not what the client claims.

RevenueCat also supports webhooks (server-to-server event delivery on purchase, renewal, cancellation) which would replace the client-initiated sync entirely. That is the preferred long-term architecture and is included in WS-09.

This is classified as a **P0 launch blocker** because it directly undermines the business model and the membership gate integrity.

---

## Wave 1 — Founding Member Reliability

**Goal:** A tester can reliably create an account, sign in on any device, stay signed in, reset their password, and have privacy controls that actually work.  
**Why first:** This is the first 10 minutes of every founding member's experience. Failures here end the session before anything else can be evaluated.

---

### Wave 1-A: Authentication Hardening

**Audit findings resolved:**
- Audit 1: No account lockout after failed attempts
- Audit 1: No global session revocation (logout all devices)
- Audit 1: Auth security events not durably logged
- Audit 12: Member auth state incomplete in req.user context

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/middleware/rateLimiter.ts` — new login-specific limiter with per-account failed-attempt counter |
| API | `artifacts/api-server/src/routes/auth.ts` — failed attempt tracking, lockout logic, global logout route |
| API | `artifacts/api-server/src/middleware/authMiddleware.ts` — extend req.user with accountLocked, failedAttempts |
| DB | `lib/db/src/schema/auth.ts` — add `failedLoginAttempts integer`, `lockedUntil timestamp`, `lastLoginAt timestamp` to users table |

**Dependencies:** None. Can start immediately.

**Deployment risk:** LOW. Additive columns and new middleware. Existing auth routes not broken.

**EAS build required:** No. Server-side changes only.

**Tester experience change:** Yes — testers who enter wrong password 10 times will see a lockout message. Testers can now log out all devices via a new route.

**Verification plan (WS-16):**
- API test: POST /auth/login-email with wrong password 11 times → 429 on 11th attempt
- API test: Lockout clears after configured window
- Playwright: Email login → wrong password 3 times → correct error message shown
- Human test: Founder verifies lockout message is helpful, not alarming

---

### Wave 1-B: Apple Sign-In Nonce Fix (EAS Build Required)

**Audit findings resolved:**
- Audit 1: Apple Sign-In broken on iOS 26+ (nonce enforcement)
- Audit 2 (WS-02): Mobile authentication release

**Systems affected:**

| Layer | Files changed |
|---|---|
| Mobile | `artifacts/mobile/app/(auth)/login.tsx` (or equivalent Apple Sign-In screen) — generate rawNonce with `expo-crypto`, hash it, pass hashedNonce to signInAsync, rawNonce to server |
| API | `artifacts/api-server/src/routes/auth.ts` — Apple route: verify SHA256(rawNonce) === payload.nonce |

**Dependencies:** None. Can start immediately in parallel with 1-A.

**Deployment risk:** LOW. Isolated change to Apple auth flow. Email and phone auth unaffected.

**EAS build required:** YES. Mobile code changes require a new binary distributed to testers.

**Tester experience change:** Yes — Apple Sign-In will work on iOS 26+. Currently fails silently for iOS 26 users.

**Verification plan:**
- Human device test: iOS 26 device → Apple Sign-In → authenticated state confirmed
- Human device test: iOS 25 device → Apple Sign-In still works (regression check)
- API test: POST /auth/apple with invalid nonce → 401 returned

---

### Wave 1-C: Blocking Enforcement Across All Surfaces

**Audit findings resolved:**
- Audit 4: Blocking not enforced in community feed
- Audit 4: Blocking not enforced in DMs
- Audit 4: Blocking not enforced in circles
- Audit 4: Blocking not enforced in events
- Audit 4: safe_space_preferences (pauseDMs, verifiedUsersOnly) not enforced
- Audit 4: Shared-location access not revoked on block

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/routes/community.ts` — add blocked-user filter to GET /community/posts query |
| API | `artifacts/api-server/src/routes/conversations.ts` — check block + pauseDMs before creating conversation |
| API | `artifacts/api-server/src/routes/circles.ts` — check block before circle join/view |
| API | `artifacts/api-server/src/routes/events.ts` — check block before RSVP |
| API | `artifacts/api-server/src/routes/location-shares.ts` — revoke active shares on block creation |
| API | `artifacts/api-server/src/routes/community-boundaries.ts` — trigger location share revocation on POST /boundaries |
| DB | No schema changes. `community_boundaries` table already exists. |

**Dependencies:** Wave 1-A helpful but not required. Blocking uses separate table.

**Deployment risk:** MEDIUM. Touches multiple high-traffic read routes. Each change is additive (a WHERE NOT IN clause) but must be tested for performance at scale.

**EAS build required:** No. All enforcement is server-side. Mobile app receives filtered responses automatically.

**Tester experience change:** Yes. Blocked users disappear from feed, DMs disabled with blocked users, location shares revoked.

**Verification plan:**
- API test: User A blocks User B → GET /community/posts as User A → User B's posts absent
- API test: User A blocks User B → POST conversation as User B to User A → 403
- Playwright: Block a user via web → refresh feed → blocked user's posts gone
- Human test: Founder blocks a test account → confirms disappears from all surfaces

---

## Wave 2 — Trust & Safety

**Goal:** The platform's core promises hold. Safety alerts cannot be gamed. Members in distress are met with care. Privacy controls are real.  
**Why second:** These are the constitutional commitments visible in the first week of a beta. Founding members will test the safety features.

---

### Wave 2-A: Safety Alert Integrity

**Audit findings resolved:**
- Audit 5: Same user can confirm an alert unlimited times (unique confirmation absent)
- Audit 5: Same user can submit unlimited clears
- Audit 5: Emergency alert has no secondary verification before mass push
- Audit 5: False-report tracking absent

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/routes/community-alerts.ts` — add userId uniqueness check on confirm and clear; add emergency-level secondary confirmation requirement |
| DB | `lib/db/src/schema/` — add `alert_confirmations(alertId, userId, confirmedAt)` table with unique constraint; add `alert_clears(alertId, userId, clearedAt)` table |
| DB | `lib/db/src/schema/auth.ts` — add `falseReportCount integer` to users table |

**Dependencies:** None.

**Deployment risk:** LOW. New constraint tables; existing alert logic augmented not replaced.

**EAS build required:** No.

**Tester experience change:** Minimal — only noticed if a tester tries to confirm an alert twice.

**Verification plan:**
- API test: User A confirms alert → User A confirms same alert again → 409 returned
- API test: Two different users confirm alert → confirmed_count increments to 2
- API test: Emergency-level alert posted by single unverified user → does not trigger mass push

---

### Wave 2-B: Quiet Hours Enforcement

**Audit findings resolved:**
- Audit 10 / FD-10.1: Quiet hours (10 PM – 8 AM) not enforced on push or email

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/lib/pushNotifications.ts` — add quiet-hours check using user's stored timezone or homeCity timezone before dispatch; queue non-urgent notifications |
| API | `artifacts/api-server/src/lib/email.ts` — add quiet-hours gate for non-transactional emails |
| DB | `lib/db/src/schema/user-settings.ts` — confirm or add `timezone varchar` field |

**Dependencies:** None. Emergency override (Safety, Security delivery class) bypasses quiet hours automatically.

**Deployment risk:** LOW. Additive gate before dispatch. No existing behavior broken for urgent notifications.

**EAS build required:** No.

**Tester experience change:** Yes — testers will not receive promotional or low-priority notifications between 10 PM and 8 AM local time.

**Verification plan:**
- API test: Trigger promotional notification for user with timezone set → if current local time is 11 PM → notification queued, not sent
- API test: Trigger safety alert for same user at 11 PM → notification sent immediately (emergency override)
- Human test: Founder confirms no push received at 11 PM for a digest notification

---

### Wave 2-C: KinfolkAI Constitutional Safety Layer (Partial)

**Audit findings resolved:**
- Audit 6 / FD-7.2: Compassion Protocol absent
- Audit 6 / FD-7.3/7.4: Conversation deletion absent
- Audit 6 / FD-7.5/7.6: Uncertainty disclosure absent
- Audit 6 / FD-7.1: Professional consultation threshold absent
- Audit 6: AI-generated content labeling absent

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/routes/kinfolk.ts` — update system prompt with Compassion Protocol rules (3-level: stress → distress → emergency); add uncertainty disclosure rules; add professional-consultation threshold rules; add Ownership Integrity prohibition |
| API | `artifacts/api-server/src/routes/kinfolk.ts` — add `DELETE /kinfolk/sessions/:id` and `DELETE /kinfolk/sessions` (all) routes |
| API | Response payload — add `isAiGenerated: true` metadata field to all KinfolkAI responses |
| DB | No schema changes (kinfolk_sessions table already exists; DELETE uses existing table) |

**Dependencies:** None. System prompt and route additions only.

**Deployment risk:** LOW for route additions. MEDIUM for system prompt changes — AI behavior will change and must be human-reviewed before deployment.

**EAS build required:** No. All changes are server-side.

**Tester experience change:** Yes — KinfolkAI responds differently to distress keywords. Members can now delete conversation history.

**Verification plan:**
- Human test: Type "I'm feeling really unsafe" → AI responds with warm acknowledgement + resources, not deflection
- Human test: Type "I'm in danger right now" → emergency resources returned immediately
- Human test: Type "Is this neighborhood safe?" → response includes explicit uncertainty statement
- Human test: Type "Should I buy this house?" → professional consultation referral included
- API test: DELETE /kinfolk/sessions/:id → session removed from DB → confirmed absent on GET
- Human review: 10 prompt bank scenarios reviewed by founder before deployment

---

## Wave 3 — Institutional Integrity

**Goal:** The platform's operational and compliance infrastructure is solid. Revenue is protected. Regulators and investors see an institution that governs itself.  
**Why third:** These changes are largely invisible to testers but prevent legal, financial, and governance failures.

---

### Wave 3-A: CRON_SECRET Fail-Closed (P0 Security — Immediate)

**Audit findings resolved:**
- Audit 12 / Audit 8: CRON_SECRET fails open (P0)

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/routes/cron.ts` — change `if (!CRON_SECRET) return true` to `if (!CRON_SECRET) return false` (one line) |

**Dependencies:** None. This is the lowest-risk highest-impact change in the entire crosswalk.

**Deployment risk:** VERY LOW. Single conditional change. Risk: if CRON_SECRET env var is not set in Railway production, cron jobs will stop running. Mitigation: verify CRON_SECRET is set in Railway before deploying.

**EAS build required:** No.

**Tester experience change:** No. Invisible security fix.

**Verification plan:**
- Before deploy: Confirm CRON_SECRET is set in Railway production env
- API test: Call any cron endpoint without CRON_SECRET header → 401 returned
- API test: Call any cron endpoint with correct CRON_SECRET → 200 returned
- Monitor: Cron job success logs in Railway for 24 hours post-deploy

---

### Wave 3-B: CAN-SPAM Compliance

**Audit findings resolved:**
- Audit 10: No unsubscribe link in emails
- Audit 10: No physical address in emails
- Audit 10: No email preference management

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/lib/email.ts` — add footer to all templates: physical address + one-click unsubscribe link |
| API | `artifacts/api-server/src/routes/` — add `GET /unsubscribe?token=X&category=Y` route |
| DB | `lib/db/src/schema/` — add `email_preferences(userId, category, unsubscribedAt)` table or column on users |

**Dependencies:** None.

**Deployment risk:** LOW. Additive to email templates.

**EAS build required:** No.

**Tester experience change:** Yes — unsubscribe links appear in all emails.

**Verification plan:**
- Playwright: Trigger password reset email → confirm footer contains physical address and unsubscribe link
- API test: GET /unsubscribe?token=X&category=marketing → preference recorded → subsequent marketing emails not sent
- Human test: Founder triggers a test email → confirms footer content is correct

---

### Wave 3-C: Stripe Webhook Idempotency

**Audit findings resolved:**
- Audit 7: Stripe webhook not idempotent (retry = double-process)

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/webhookHandlers.ts` — check processed-event log before handling; record event ID after successful processing |
| DB | `lib/db/src/schema/` — add `processed_webhook_events(eventId varchar primary key, processedAt timestamp, eventType varchar)` table |

**Dependencies:** None.

**Deployment risk:** MEDIUM. Touches payment processing. Requires testing with Stripe test-mode webhooks.

**EAS build required:** No.

**Tester experience change:** No. Reliability improvement invisible to members.

**Verification plan:**
- API test: Send same Stripe checkout.session.completed event twice → DB updated once, second request returns 200 without reprocessing
- Monitor: Stripe webhook delivery dashboard shows 200s; DB shows correct entitlement state

---

### Wave 3-D: RevenueCat Server-Side Verification

**Audit findings resolved:**
- Audit 7: RevenueCat sync is client-controlled (attack path detailed above)

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | `artifacts/api-server/src/routes/revenuecat.ts` — replace client-supplied `productIdentifier` trust with server-side call to `GET https://api.revenuecat.com/v1/subscribers/{app_user_id}` using `REVENUECAT_API_KEY_V2` |
| API | Response now based on RevenueCat's confirmed `entitlements` object, not client claim |
| Env | `REVENUECAT_API_KEY_V2` already available as a secret |

**Dependencies:** None. `REVENUECAT_API_KEY_V2` already in secrets.

**Deployment risk:** MEDIUM. Changes how iOS subscribers get their tier. Existing RC subscribers must be verified to continue working.

**EAS build required:** No. Server-side change. Mobile app continues calling same endpoint.

**Tester experience change:** Minimal — legitimate purchasers will notice no difference. Unauthorized access is blocked.

**Verification plan:**
- API test: POST /revenuecat/sync with valid RC app_user_id for real subscriber → correct tier granted
- API test: POST /revenuecat/sync with fabricated productIdentifier for non-subscriber → 403 returned
- Human test: Founder makes real RevenueCat test purchase on iOS → verifies tier activates correctly

---

### Wave 3-E: Decision Ledger & Admin Authority

**Audit findings resolved:**
- Audit 11: No Decision Ledger or institutional audit log
- Audit 11: Four incompatible admin authorization models
- Audit 11: No admin MFA
- Audit 11: Admin role promotion untracked

**Systems affected:**

| Layer | Files changed |
|---|---|
| DB | Add `decision_ledger(id, actorId, action, targetType, targetId, evidence, rationale, outcome, appealEligible, createdAt)` table — append-only |
| DB | Add `admin_mfa_sessions(userId, totpSecret, verifiedAt, deviceId)` table |
| API | Create `artifacts/api-server/src/middleware/requireAdmin.ts` — single shared middleware using DB role check only; deprecate email allowlist |
| API | Update all admin routes to import `requireAdmin` from shared middleware |
| API | Add `POST /admin/mfa/setup` and `POST /admin/mfa/verify` routes |
| API | Log every admin action to `decision_ledger` via shared helper |

**Dependencies:** Foundational for Wave 3-F (appeals).

**Deployment risk:** MEDIUM-HIGH. Replaces admin authorization across all routes. Must be tested exhaustively before deploy. Admin lockout risk if middleware misconfigured.

**EAS build required:** No.

**Tester experience change:** No (admin-only changes).

**Verification plan:**
- API test: Admin route without admin session → 403
- API test: Admin route with valid admin session → 200; decision_ledger row created
- API test: Non-admin attempts to use admin route → 403 even with admin email in env (email allowlist deprecated)
- Human test: Founder performs an admin action → confirms Decision Ledger entry visible in admin panel

---

## Wave 4 — Experience Polish

**Goal:** The platform feels polished, intentional, and welcoming. Founding members leave wanting to invite others.  
**Why fourth:** Experience polish built on an unstable foundation is wasted. This wave requires Waves 1–3 to be stable and verified.

---

### Wave 4-A: Welcome Home Experience™ & Onboarding Persistence

**Audit findings resolved:**
- Audit 1 (WS-15): Onboarding preferences not persisted after sign-up
- Audit 2 (WS-15): Welcome Home Experience™ not implemented

**Systems affected:**

| Layer | Files changed |
|---|---|
| DB | Confirm or add onboarding preference columns on users (interests, identity, homeCity stored) |
| API | `POST /auth/register` or onboarding route — persist preferences on save |
| Mobile | Onboarding screens save to API, not just AsyncStorage |
| Web | Onboarding flow equivalent on web (if applicable) |
| Mobile | Welcome Home Experience™ screen — first experience after registration completion |

**Dependencies:** Wave 1 (auth must be stable). Wave 3-E (Decision Ledger for admin to see onboarding completions).

**Deployment risk:** MEDIUM. UI changes visible to all new testers. Onboarding data persistence requires DB and API alignment.

**EAS build required:** Yes. Mobile UI changes.

**Tester experience change:** Yes — new testers will see the Welcome Home Experience™ for the first time.

**Verification plan:**
- Playwright: Complete registration → complete onboarding → log out → log back in → preferences retained
- Human test: Founder completes full new-user flow on fresh install → confirms Welcome Home Experience™ appears and preferences saved
- iOS device test: Full registration → onboarding → Welcome Home Experience™ on physical device

---

### Wave 4-B: Business Discovery & Profile Polish

**Audit findings resolved:**
- Audit 2 (WS-04/WS-15): Business data accuracy, profile stability, confidence freshness

**Systems affected:**

| Layer | Files changed |
|---|---|
| API | Business routes — add confidence score freshness tracking (lastCalculatedAt) |
| API | Business submission — add 0,0 coordinate rejection |
| Mobile/Web | Business profile UI — stability improvements from crosswalk findings |

**Dependencies:** Wave 3 (data architecture resilience helpful).

**Deployment risk:** LOW.

**EAS build required:** Yes (mobile UI changes).

**Tester experience change:** Yes — business profiles more stable, data more accurate.

**Verification plan:**
- API test: Submit business with lat: 0, lng: 0 → rejected with clear error
- Playwright: Business search → results load without crash → filter by category works
- Human test: Founder browses 10 businesses → no crashes, data looks accurate

---

## Wave Summary

| Wave | Name | EAS Build | Risk | Tester Visible | Can Start |
|---|---|---|---|---|---|
| 1-A | Auth hardening | No | Low | Minimal | Immediately |
| 1-B | Apple nonce fix | **Yes** | Low | Yes (iOS 26+) | Immediately |
| 1-C | Blocking enforcement | No | Medium | Yes | Immediately |
| 2-A | Alert integrity | No | Low | Minimal | After 1-A |
| 2-B | Quiet hours | No | Low | Yes | Immediately |
| 2-C | KinfolkAI safety layer | No | Medium | Yes | Immediately |
| 3-A | CRON_SECRET fix | No | Very Low | No | **Now — no approval needed beyond security** |
| 3-B | CAN-SPAM compliance | No | Low | Yes | Immediately |
| 3-C | Stripe idempotency | No | Medium | No | Immediately |
| 3-D | RevenueCat server verification | No | Medium | Minimal | Immediately |
| 3-E | Decision Ledger + admin MFA | No | Med-High | No | After all others stable |
| 4-A | Welcome Home + onboarding | **Yes** | Medium | Yes | After Waves 1–3 |
| 4-B | Business discovery polish | **Yes** | Low | Yes | After Wave 3 |

**EAS builds required in total:** Wave 1-B (Apple nonce — urgent), Wave 4-A and 4-B (experience — can be batched into one build).

---

## What This Document Does Not Cover

The following workstreams from the Implementation Register are deferred to post-founding-beta:

- **WS-05** (Geographic integrity — home-based business model, service area) — requires product decisions
- **WS-06** (Safety alert manipulation prevention, safety score integrity for minority businesses) — requires constitutional algorithm review
- **WS-10** (Full event cancellation lifecycle) — events not a primary founding-member path
- **WS-14 remainder** (Migration strategy, backup verification) — requires infrastructure planning
- **WS-15 remainder** (Community Journey™, full discovery polish) — post-stabilization
- **WS-16** (Traceability matrix population) — ongoing after each wave

These are not forgotten. They are explicitly deferred and will be sequenced in the next sprint after founding-member stability is confirmed.

---

## Founding Member Build List — What's True at Each Stage

### In the exact tester build right now (iOS 84 / Android 60)
- Email registration and login ✅
- Phone OTP ✅
- Password reset (web UI) ✅
- Profile (crash fixed on web) ✅
- Business search ✅
- Maps ✅
- Community feed ✅
- KinfolkAI (without constitutional safety layer) ✅
- Safety Center (without alert integrity) ✅
- Membership gates ✅
- Events ✅

### Being added during founding beta (these Waves)
- Apple Sign-In on iOS 26+ (Wave 1-B, new EAS build)
- Blocking enforcement across all surfaces (Wave 1-C)
- Password reset full cycle human-verified (Wave 1-A)
- Quiet hours (Wave 2-B)
- Compassion Protocol™ in KinfolkAI (Wave 2-C)
- Conversation deletion (Wave 2-C)
- Unsubscribe in emails / CAN-SPAM (Wave 3-B)
- Stripe + RevenueCat integrity (Wave 3-C, 3-D)
- Decision Ledger (Wave 3-E)
- Welcome Home Experience™ (Wave 4-A, new EAS build)

### Longer-term institutional vision (post-beta)
- Full Invisible Architecture™ — Trust Engine, Safety Intelligence Engine, etc.
- City Maturity Model™ and Business Maturity Model™
- Constitutional Intelligence Layer™ enforcement in algorithms
- Full appeals system with SLAs
- Heritage Site map expansion
- Kinfolk Circles full governance model
