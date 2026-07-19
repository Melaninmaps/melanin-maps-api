# Mapping With Melanin™ — Production Release Checklist

**Version:** 1.0  
**Effective from:** Community Beta 2 (iOS Build 85 / Android Build 61)  
**Owner:** Melanin Maps LLC Engineering  
**Purpose:** Every production release — mobile, API, or web — follows this checklist without exception. The process does not compress under schedule pressure.

---

## How to use this checklist

Copy the **Release Record** template at the bottom of this document into a new file named `docs/releases/YYYY-MM-DD-<release-name>.md` before starting work. Fill it in as you go. A release is not complete until every field in that record is populated and the final verdict is written.

The **GO FOR TESTER DISTRIBUTION** signal requires:
- Every checklist item marked ✅
- 15/15 (or current total) smoke tests passing on production
- Founder device test passing on each target platform
- Final verdict written in the release record

---

## Phase 1 — Pre-Deployment

### 1.1 Commit verification

- [ ] Identify the exact HEAD commit hash to be deployed
- [ ] Confirm working tree is clean (no uncommitted tracked changes)
- [ ] Confirm the dist build is current and matches HEAD source
- [ ] Scan committed dist for secrets: no `sk_live_`, `sk_test_`, credentials, `.env` contents, service-account files, or certificates
- [ ] Record the commit hash in the release record

### 1.2 Environment variable audit

- [ ] Query Railway environment variables via API (names only — never expose values in logs or chat)
- [ ] Confirm every required variable is present:
  - `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
  - `GOOGLE_MAPS_API_KEY`, `WMATA_API_KEY`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `REVENUECAT_API_KEY`, `REVENUECAT_API_KEY_V2`, `REVENUECAT_WEBHOOK_AUTH_KEY`
  - `CRON_SECRET`, `COMPANY_MAILING_ADDRESS`
  - `ADMIN_EMAILS`, `NODE_ENV`, `FRONTEND_URL`
  - `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
  - `DOCUSIGN_RSA_PRIVATE_KEY`, `DOCUSIGN_USER_ID`
- [ ] Confirm `PORT` is **NOT** manually set (Railway auto-injects)
- [ ] Confirm `NODE_ENV=production`
- [ ] Confirm `FRONTEND_URL=https://www.mappingwithmelanin.com` (not an internal Railway URL)
- [ ] Confirm `REPLIT_DOMAINS` includes `www.mappingwithmelanin.com` (controls Stripe webhook auto-registration URL)
- [ ] Record PASS/FAIL for each variable in the release record

### 1.3 Webhook route verification

- [ ] Confirm Stripe canonical route: `POST /api/stripe/webhook` (registered on `app` directly, before `express.json`)
- [ ] Confirm RevenueCat canonical route: `POST /api/revenuecat/webhook` (registered via router at `/api`)
- [ ] Verify Stripe webhook endpoint exists in Stripe Dashboard at `https://www.mappingwithmelanin.com/api/stripe/webhook`
- [ ] Verify Stripe signing secret belongs to that exact endpoint and is production mode (`whsec_...`)
- [ ] Verify RevenueCat webhook is configured in RevenueCat Dashboard with `Authorization: <REVENUECAT_WEBHOOK_AUTH_KEY>`
- [ ] Test Stripe rejects missing signature → 400 ✅
- [ ] Test Stripe rejects invalid signature → 400 ✅
- [ ] Test RevenueCat rejects missing auth → 401 ✅ (fails closed — not fail-open)
- [ ] Test RevenueCat rejects wrong auth → 401 ✅

### 1.4 Database backup

**This step is mandatory. No schema change runs before backup is confirmed.**

- [ ] Open Railway dashboard → Postgres service → Backups
- [ ] Create manual backup (or confirm an automated backup is current, within the last 24 hours)
- [ ] Wait for backup status: **Complete**
- [ ] Record backup ID or timestamp in the release record

### 1.5 Schema diff review

- [ ] Run schema push against Railway Postgres in **preview mode** where possible
- [ ] If no dry-run is available, manually inspect the Drizzle schema for any changes since the last Railway schema push
- [ ] Confirm the diff is **additive only**: new tables, new columns with defaults, new indexes
- [ ] Confirm no drops, renames, truncations, or non-nullable columns added to existing populated tables without a default
- [ ] If any destructive change is present: **STOP**, resolve it (provide a default, use a migration, or remove the change), and re-review
- [ ] Record the schema diff summary in the release record

### 1.6 Rollback plan

- [ ] Confirm prior Railway deployment ID (the one to roll back to if the new deploy fails)
- [ ] Confirm Railway can redeploy a previous build (Railway keeps deployment history — re-deploy from Railway dashboard → Deployments → select prior deploy → Redeploy)
- [ ] For schema changes: confirm the backup from 1.4 can be restored via Railway dashboard if a migration causes data loss
- [ ] Record the rollback target deployment ID in the release record

---

## Phase 2 — Deployment

### 2.1 GitHub authentication

- [ ] Authenticate using `gh auth login --web` (browser device-code flow — no PAT in chat or Replit secrets)
- [ ] Confirm authentication: `gh auth status`

### 2.2 Database schema sync

- [ ] Run `DATABASE_URL="<railway-postgres-url>" pnpm --filter @workspace/db run push`
- [ ] Review output line by line — confirm no unexpected drops or warnings
- [ ] Save full push output to the release record
- [ ] Verify targeted tables exist after push by querying Railway Postgres directly

### 2.3 Code push and Railway redeploy

- [ ] Clone or update the deployment repo (`Melaninmaps/melanin-maps-api`)
- [ ] Copy new `dist/` and `dist/public/` to the deployment repo
- [ ] Commit with message format: `deploy: <release-name> (<commit-hash>)`
- [ ] Push to GitHub
- [ ] Trigger Railway redeploy via GraphQL `serviceInstanceDeploy` with `latestCommit: true`
- [ ] Wait for Railway deployment status: **SUCCESS**
- [ ] Record Railway deployment ID in the release record

### 2.4 Startup verification

- [ ] `GET /api/healthz` → `{"status":"ok"}` ✅
- [ ] Review Railway production logs for errors in the first 2 minutes after startup
- [ ] Confirm no `FATAL`, `ERROR`, or `Stripe init failed` messages in logs
- [ ] Confirm server is running on the correct commit (check `meta.commitHash` via Railway API)

---

## Phase 3 — Smoke Tests

**All tests must pass. Partial pass is not acceptable for GO.**  
**All test accounts must be disposable and clearly labeled.**  
**Do not trigger real charges, uncontrolled marketing emails, or uncontrolled SMS.**

### 3.1 Core 15 smoke tests

| # | Test | Expected |
|---|------|----------|
| 1 | `GET /api/healthz` | `{"status":"ok"}` |
| 2 | `GET /api/businesses` | 200, array of businesses |
| 3 | `GET /api/businesses?search=<term>` | 200, filtered results |
| 4 | `GET /api/membership/stats` | 200, foundingMemberCount present |
| 5 | `POST /api/auth/forgot-password` | 200, `{success:true}` |
| 6 | `POST /api/auth/phone/send-otp` | 200, `{success:true}` |
| 7 | `POST /api/auth/register` (disposable account) | 200, token returned |
| 8 | `POST /api/auth/login-email` | 200, token returned |
| 9 | `GET /api/auth/user` (Bearer token) | 200, user object |
| 10 | `POST /api/saved-places` | 200, saved |
| 11 | `POST /api/community/posts` | 200, post created |
| 12 | `POST /api/community/posts` (repeat, <30s) | 409, dedup blocked |
| 13 | `GET /api/membership/plan` | 200, tier present |
| 14 | `POST /api/referrals/track` (no auth) | 401 |
| 15 | `GET /api/cultural-sites/stories/pending` (no auth) | 403 |

### 3.2 Security and infrastructure tests

| # | Test | Expected |
|---|------|----------|
| 16 | Cron route without `CRON_SECRET` | 401/403 denied |
| 17 | Cron route with correct `CRON_SECRET` | 200 accepted |
| 18 | `POST /api/revenuecat/webhook` — no Authorization | 401 |
| 19 | `POST /api/revenuecat/webhook` — wrong Authorization | 401 |
| 20 | `POST /api/stripe/webhook` — invalid signature | 400 |
| 21 | `POST /api/auth/forgot-password` full flow | Email received, code works |
| 22 | Sign-out all devices | Sessions invalidated |
| 23 | Web asset loading (`https://www.mappingwithmelanin.com`) | HTML, CSS, JS load without 404 |

### 3.3 Direct DB verification (do not infer from server startup)

- [ ] Query Railway Postgres directly for each critical table/column: do not assume a table exists because the server started without crashing
- [ ] Verify: `users.marketing_opt_out`, `users.failed_login_attempts`, `users.locked_until`
- [ ] Verify: `auth_events` table row count is accessible
- [ ] Verify: `stripe_processed_events` table row count is accessible
- [ ] Verify: `businesses` columns include `hidden_gem_label`, `is_reference_only`, `flag_count`

---

## Phase 4 — Founder Verification

- [ ] Test production web at `https://www.mappingwithmelanin.com` in a browser
  - Homepage loads
  - Business search returns results
  - Map renders
  - Membership page loads
- [ ] Install iOS Build (TestFlight) on a physical device and complete:
  - Cold launch (no crash)
  - Login or sign-up
  - Business discovery
  - KinfolkAI response
  - Save a business
- [ ] Install Android Build (internal track) on a physical device and complete:
  - Cold launch (no crash)
  - Login or sign-up
  - Business discovery

---

## Phase 5 — Test Data Cleanup

- [ ] Delete or permanently label all disposable smoke-test accounts created on production
- [ ] Delete smoke-test community posts (label format used: `[SMOKE TEST - disposable]`)
- [ ] Delete smoke-test saved-place records
- [ ] Confirm no test membership tier or premium entitlement remains on any test account
- [ ] Document any transactional email or SMS triggered during testing (subject, recipient, time)
- [ ] Confirm no test charges appear in Stripe Dashboard

---

## Phase 6 — Tester Rollout

**Testers are invited only after Phase 4 passes on all target platforms.**

- [ ] Write release announcement using the format:  
  `"Everyone should now be testing [Release Name] (iOS Build [N] / Android Version [V] Build [N])."`
- [ ] Distribute via TestFlight (iOS) and Play Console internal track (Android)
- [ ] Post announcement to tester group

---

## Phase 7 — Post-Release Monitoring

- [ ] Monitor Railway production logs for the first 30 minutes after tester distribution
- [ ] Check Stripe Dashboard for any webhook failures
- [ ] Check RevenueCat Dashboard for any webhook failures
- [ ] Check Resend (email) for any delivery failures
- [ ] Monitor crash rate on Expo / EAS dashboard
- [ ] Set a calendar reminder: 24-hour post-release log review

---

## Rollback Procedure

If production is degraded after deployment:

1. **Immediate:** Redeploy the prior Railway deployment from Railway dashboard → Deployments → select prior ID → Redeploy. Takes ~2 minutes.
2. **If schema push caused data issues:** Restore Railway Postgres from the backup taken in Phase 1.4. Railway dashboard → Postgres → Backups → Restore.
3. **Mobile:** If a build causes crashes, pull it from TestFlight / Play Console internal track. Testers revert to the prior build.
4. **Communicate:** Notify testers that the release is being rolled back. Do not leave them testing a broken build.

---

## Release Record Template

Copy this block into `docs/releases/YYYY-MM-DD-<release-name>.md` at the start of each release.

```
# Release Record: [Release Name]
Date: YYYY-MM-DD
Engineer: Replit Agent + Founder
iOS Build: [N]
Android Version: [V] Build [N]

## Commit
Deployed commit: [hash]
Railway deployment ID: [id]

## Environment Variables
[PASS/FAIL for each required variable — names only, no values]

## Database
Backup ID/timestamp: [value]
Schema diff summary: [additive changes listed, or "no schema changes"]
Schema push output: [saved to this file or linked]
Direct DB verification: [PASS/FAIL for each critical table/column]

## Webhooks
Stripe endpoint: [URL] — [PASS/FAIL]
RevenueCat endpoint: [URL] — [PASS/FAIL]

## Smoke Tests
[Results for all 23 tests — PASS or FAIL with notes]

## Production Log Review
[Summary of first 30 minutes of logs post-deploy]

## Founder Verification
Web: [PASS/FAIL — notes]
iOS Build [N] on [device]: [PASS/FAIL — notes]
Android Build [N] on [device]: [PASS/FAIL — notes]

## Test Data Cleanup
[Accounts deleted/labeled, posts removed, no entitlements remaining]

## Rollback Target
Prior deployment ID: [id]
Rollback tested: [yes/no]

## Final Verdict
[ ] GO FOR FOUNDER DEVICE TESTING
[ ] GO FOR TESTER DISTRIBUTION
[ ] NO GO — CORRECTION REQUIRED: [describe]
```

---

*This checklist is a living document. Update it when new infrastructure is added, new routes require webhook configuration, or the release process changes. The version number increments when the structure changes — not when individual releases are completed.*
