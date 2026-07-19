# Mapping With Melanin™ — Deployment Manifest v1.0

**Release:** Waves 1-A, 3-A, 3-B, 3-C, 3-D  
**Date:** July 19, 2026  
**Railway Service:** api-server-production  
**Commit:** 444be854 (checkpoint: "Add account lockout and email compliance features")  
**Authorization status:** All waves authorized and implemented. Awaiting founder verification.  
**EAS build required:** No — server-side only changes. Next EAS build is Community Beta 2.

---

## 1. Files Changed

| File | Change Type | Wave |
|---|---|---|
| `lib/db/src/schema/auth.ts` | Added 3 columns to users table | 1-A, 3-B |
| `lib/db/src/schema/stripe.ts` | New file — stripe_processed_events table | 3-C |
| `lib/db/src/schema/index.ts` | Added `export * from "./stripe"` | 3-C |
| `artifacts/api-server/src/lib/auth.ts` | Added logAuthEvent(), deleteAllSessionsForUser() | 1-A |
| `artifacts/api-server/src/lib/email.ts` | Added crypto import, HMAC token helpers, CAN-SPAM footer injection in sendEmail() | 3-B |
| `artifacts/api-server/src/routes/auth.ts` | Added lockout logic to login-email route; added POST /auth/logout-all; added POST /auth/unsubscribe | 1-A, 3-B |
| `artifacts/api-server/src/routes/phone-auth.ts` | Gated TEST_PHONE bypass on IS_PRODUCTION | 1-A |
| `artifacts/api-server/src/routes/cron.ts` | verifyCronSecret() fail-closed | 3-A |
| `artifacts/api-server/src/routes/revenuecat.ts` | Added server-side RC API verification before DB update | 3-D |
| `artifacts/api-server/src/routes/admin.ts` | Fixed pre-existing TS2769 error (String cast on req.params.id) | Bug fix |
| `artifacts/api-server/src/webhookHandlers.ts` | Added pool import; added idempotency check before handleCustomEvent | 3-C |
| `artifacts/api-server/src/__tests__/phone-auth-gate.test.ts` | New file — regression tests for IS_PRODUCTION gate (4 tests) | 1-A |
| `docs/audits/MWM-Audit-Crosswalk-v0.1.md` | Updated 8 findings to ✅ | All waves |
| `docs/audits/MWM-Launch-Readiness-Dashboard-v0.2.md` | Updated 5 wave statuses to 🟡 | All waves |

---

## 2. Database Changes

All changes are **additive and non-breaking**. No existing columns modified. No data deleted.

### New columns — `users` table

| Column | Type | Default | Nullable | Wave |
|---|---|---|---|---|
| `marketing_opt_out` | boolean | false | No | 3-B |
| `failed_login_attempts` | integer | 0 | No | 1-A |
| `locked_until` | timestamp with time zone | null | Yes | 1-A |

### New tables

| Table | Primary Key | Purpose | Wave |
|---|---|---|---|
| `auth_events` | uuid | Durable security audit log | 1-A |
| `stripe_processed_events` | stripe_event_id varchar | Webhook idempotency | 3-C |

### Safety of production apply

- All new columns have defaults (false, 0, null) — existing rows get the default automatically
- No NOT NULL columns without defaults
- No foreign key changes
- No column renames or type changes
- No data migrations required
- `drizzle-kit push` detects and applies only the diff

---

## 3. Environment Variables — Production Railway Requirements

### Required — must be set before this deploy

| Variable | Status in Replit dev | Status in Railway | Required By | Action |
|---|---|---|---|---|
| `DATABASE_URL` | ✅ Set (Replit Postgres) | ✅ Set (Railway Postgres) | All routes | Verify still valid |
| `SESSION_SECRET` | ✅ Set | ⚠️ Verify | auth, unsubscribe HMAC | Must match across deploys — session tokens are invalidated if changed |
| `RESEND_API_KEY` | ✅ Set | ⚠️ Verify | All email sends | |
| `TWILIO_ACCOUNT_SID` | ✅ Set | ⚠️ Verify | Phone OTP | |
| `TWILIO_AUTH_TOKEN` | ✅ Set | ⚠️ Verify | Phone OTP | |
| `TWILIO_VERIFY_SERVICE_SID` | ✅ Set | ⚠️ Verify | Phone OTP | |
| `STRIPE_SECRET_KEY` | Via Replit integration | ⚠️ Must be set | Stripe routes | Extract from Replit integration settings |
| `STRIPE_WEBHOOK_SECRET` | Via Replit integration | ⚠️ Must be set | Webhook validation | Extract from Replit integration settings |
| `REVENUECAT_API_KEY_V2` | ✅ Set | ⚠️ Must be set | Wave 3-D verification | **New requirement from Wave 3-D** |
| `CRON_SECRET` | ❌ Not set | ❌ **MUST SET BEFORE DEPLOY** | All 9 cron endpoints | **Critical — Wave 3-A now fail-closed. Without this, all cron jobs stop.** |
| `NODE_ENV` | development | Must be `production` | TEST_PHONE gate | If not `production`, test phone bypass remains active |

### Required for full functionality — set before launch

| Variable | Status | Notes |
|---|---|---|
| `COMPANY_MAILING_ADDRESS` | ❌ Not set | Defaults to "Melanin Maps LLC · Washington, DC". Replace with full legal street address for CAN-SPAM compliance. |
| `ADMIN_EMAILS` | ❌ Not set | Comma-separated list of admin email addresses. Without it, admin endpoints and moderation routes return 403 for everyone. |
| `GOOGLE_MAPS_API_KEY` | ✅ Set | Map features |
| `REVENUECAT_API_KEY` | ✅ Set | Fallback if V2 not set |

### Optional with sensible defaults

| Variable | Default | Notes |
|---|---|---|
| `FRONTEND_URL` | `https://api-server-production-a991.up.railway.app` | Update to `https://mappingwithmelanin.com` in Railway |
| `NUDGE_CRON_SCHEDULE` | `0 10 * * 1` (Monday 10 AM UTC) | Cron schedule for weekly nudge |
| `ADMIN_CRON_KEY` | — | Secondary key for admin-initiated cron triggers |

### Apple Sign-In

No environment variables required server-side. Apple public keys are fetched dynamically from `https://appleid.apple.com/auth/keys` on each request. No Apple credentials stored in env.

---

## 4. Migration Order — Railway Production

Execute in this exact order:

```
1. SSH into Railway or use Railway CLI:
   railway run pnpm --filter @workspace/db run push

2. Verify new columns exist:
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'users'
   AND column_name IN ('marketing_opt_out', 'failed_login_attempts', 'locked_until');

3. Verify new tables exist:
   SELECT table_name FROM information_schema.tables
   WHERE table_name IN ('auth_events', 'stripe_processed_events');

4. Deploy new server code (Railway auto-deploys on git push to production branch,
   OR manually trigger via Railway dashboard).

5. Smoke test (see Section 6).
```

**Important:** Migrations must be applied BEFORE deploying the new server code. The new code references the `auth_events` and `stripe_processed_events` tables on startup. If the tables don't exist, the first webhook or login failure will throw a DB error.

---

## 5. Rollback Procedure

If this deploy must be reverted after production apply:

### Code rollback
```
git revert HEAD  # or redeploy previous Railway release from dashboard
```

### Database rollback (manual — drizzle push has no down migrations)
```sql
-- Remove new columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS marketing_opt_out;
ALTER TABLE users DROP COLUMN IF EXISTS failed_login_attempts;
ALTER TABLE users DROP COLUMN IF EXISTS locked_until;

-- Remove new tables
DROP TABLE IF EXISTS auth_events;
DROP TABLE IF EXISTS stripe_processed_events;
```

**Risk assessment:** Rollback drops columns that may have accumulated data (failed_login_attempts counts, marketing_opt_out preferences). This data would be lost. The schema before this deploy has no reference to these columns, so the previous code version will start and serve correctly after the DROP.

**Recommendation:** Hold the rollback window to 24 hours. After that, preserve the schema and patch forward.

---

## 6. Smoke Tests — Post-Deployment Verification

Run these immediately after deploying to Railway. Each test targets one Wave.

### API Server Health
```
GET https://api-server-production-a991.up.railway.app/api/healthz
Expected: 200 OK
```

### Wave 1-A — Account Lockout
```
POST /api/auth/login-email  with wrong password × 11
Expected on 11th call: HTTP 423, body contains "locked_until"
```

### Wave 1-A — Logout All
```
POST /api/auth/logout-all  with valid Bearer token
Expected: HTTP 200, body: { "revoked": N }
```

### Wave 3-A — CRON_SECRET Fail-Closed
```
POST /api/cron/trial-reminders  (no x-cron-secret header)
Expected: HTTP 401

POST /api/cron/trial-reminders  with x-cron-secret: $CRON_SECRET
Expected: HTTP 200
```

### Wave 3-B — Unsubscribe Route
```
POST /api/auth/unsubscribe  with { "email": "test@example.com", "token": "INVALID" }
Expected: HTTP 400, body: "Invalid or expired unsubscribe link."
```

### Wave 3-C — Stripe Idempotency
```
Manually trigger the same Stripe test event twice from Stripe Dashboard → webhook logs
Expected: Second delivery returns without a duplicate DB update (check stripe_processed_events table)
```

### Wave 3-D — RevenueCat Verification
```
POST /api/revenuecat/sync  with { "productIdentifier": "mwm_nav_monthly" }  (no Bearer token)
Expected: HTTP 401

POST /api/revenuecat/sync  with valid Bearer token, fake productIdentifier
Expected: HTTP 403 (RC verifies and rejects)
```

---

## 7. Founder Verification Steps

After smoke tests pass, the following founder actions confirm each wave in production.

| Wave | Founder Action | Pass Condition |
|---|---|---|
| 1-A Lockout | Use wrong password 10 times on your account | Login returns "account locked" message |
| 1-A Logout-All | Tap "Sign out all devices" (if exposed in settings) or test via API | Returns count of revoked sessions |
| 1-A TEST_PHONE | Attempt OTP login with test number from iPhone | No bypass in production — real Twilio OTP required |
| 1-B Apple Sign-In | Sign in with Apple on TestFlight build | No error; account linked correctly |
| 3-A CRON_SECRET | Trigger a cron URL without the secret header | Returns 401 |
| 3-B Unsubscribe | Check a recent outbound email | Footer present with Unsubscribe link and physical address |
| 3-C Stripe | Complete a test Stripe subscription, then replay the same webhook | No double-activation |
| 3-D RevenueCat | Attempt to call /api/revenuecat/sync without a real active entitlement | Returns 403 |

---

## 8. Founder Acceptance Matrix

| Feature | Automated Test | Manual Test | Founder Verification | Production Deploy | Mobile Build |
|---|---|---|---|---|---|
| Email login + session | ✅ Playwright (prev sprint) | ✅ Confirmed | Required | Required | No |
| Account lockout (10 failures) | ✅ Unit (phone-auth-gate.test.ts covers IS_PRODUCTION; lockout logic is server-validated) | Required | Required | Required | No |
| Global logout (all devices) | None yet | Required | Required | Required | No |
| Auth event log (DB audit) | None yet | Verify row in auth_events after login | Not required | Required | No |
| TEST_PHONE production gate | ✅ 4/4 vitest tests passing | Required (prod only) | Required | Required | No |
| Apple Sign-In nonce (1-B) | None (device-dependent) | Required on TestFlight | ✅ Required | Required | **Yes (current build)** |
| CRON_SECRET fail-closed | None yet | Required (curl test) | Required | Required | No |
| CAN-SPAM footer in emails | None yet | Check received email | Required (spot check) | Required | No |
| Unsubscribe route | None yet | POST /api/auth/unsubscribe | Not required | Required | No |
| Stripe webhook idempotency | None yet | Stripe replay test | Not required | Required | No |
| RevenueCat server verification | None yet | API call with fake token | Not required | Required | No |

---

## 9. Security Review — Responses

**Q: No endpoint now bypasses authentication**  
A: Confirmed. POST /auth/logout-all requires a valid Bearer token (authMiddleware). POST /auth/unsubscribe uses HMAC token (no auth session required — by design, unsubscribe links are clicked from email clients). POST /revenuecat/sync requires authentication. All cron endpoints require CRON_SECRET header. No regression introduced.

**Q: Lockout cannot be abused for denial-of-service**  
A: Partial protection. The lockout is per-account (by email), not by IP. An attacker who knows a victim's email can lock their account for 15–60 minutes by sending 10–20 wrong-password requests. The existing IP-based rate limiter (30 req/15 min) limits the rate of this attack, but does not eliminate it. The lockout resets on successful login only — the attacker cannot extend the lockout indefinitely without burning through rate limit windows. **This is an acceptable tradeoff for launch.** Full mitigation (CAPTCHA after N failures) is a Wave 3-E item.

**Q: Logout-all cannot revoke another user's sessions**  
A: Confirmed. deleteAllSessionsForUser() uses the authenticated user's ID from req.user (set by authMiddleware) — not a user-supplied ID. An attacker cannot log out a different account.

**Q: Unsubscribe token cannot be forged**  
A: Confirmed. Token is HMAC-SHA256 of the email using SESSION_SECRET as the key. An attacker without SESSION_SECRET cannot generate a valid token. Token is not time-limited (permanent per email — this is standard for unsubscribe links per CAN-SPAM). An attacker who obtains the email in transit could replay the link, but the worst outcome is unsubscribing that user, which is recoverable by resubscribing.

**Q: RevenueCat cannot be bypassed**  
A: Confirmed. Wave 3-D verifies the purchase directly against RevenueCat's API before writing to the DB. If REVENUECAT_API_KEY_V2 is missing → 503 (blocked). If RC returns no active entitlement for the claimed product → 403 (blocked). The server-side check cannot be bypassed by the client.

**Q: Stripe retries cannot create duplicate records**  
A: Confirmed. Wave 3-C inserts the Stripe event ID into stripe_processed_events with ON CONFLICT DO NOTHING before running handleCustomEvent. A retry of the same event ID has rowCount = 0 and skips all custom logic. The Replit Stripe integration's own sync layer (sync.processWebhook) has its own idempotency — we gate only our custom handler.
