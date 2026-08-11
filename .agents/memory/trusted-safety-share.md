---
name: Trusted Safety Share
description: Feature that mirrors severe safety alerts to trusted contacts — DB tables, API routes, alert library, and mobile screen all built Aug 11 2026.
---

# Trusted Safety Share — Implementation State

**Status:** Backend + mobile screen fully built and deployed. Three integration gaps remain as proposed tasks (#242, #243, #244).

## What was built

### DB Tables (via MIGRATIONS in startup-migrations.ts)
- `trusted_safety_shares` — owner, contact (mwm_user/phone/email), status lifecycle, invite_token for non-MWM contacts
- `trusted_safety_alert_log` — audit log of every delivery attempt

### API Routes
- File: `artifacts/api-server/src/routes/trusted-safety-share.ts`
- Mounted in `artifacts/api-server/src/routes/index.ts`
- POST `/safety/trusted-shares` — create (owner adds contact, sends invite push/SMS/email)
- GET `/safety/trusted-shares` — list owner's outgoing shares
- GET `/safety/trusted-shares/received` — list incoming (MWM contacts)
- DELETE `/safety/trusted-shares/:id` — revoke (instant, silent)
- PATCH `/safety/trusted-shares/:id/pause` — manual pause toggle
- PATCH `/safety/trusted-shares/:id/respond` — MWM contact accepts/declines
- GET `/safety/trusted-shares/accept/:token` — public, for invite landing page
- POST `/safety/trusted-shares/accept-token` — public, non-MWM accept/decline by token

### Alert Delivery Library
- File: `artifacts/api-server/src/lib/trustedSafetyShareAlerts.ts`
- `notifyTrustedSafetyContacts(payload)` — the function to call when any severe alert fires
- Filters: weather | civil_emergency | natural_disaster | community_safety ONLY
- Auto-pauses when owner's home_city matches alert city (they're home)
- Delivery: Expo push (MWM users), Twilio SMS (phone contacts), Resend email (email contacts)
- Logs every attempt to trusted_safety_alert_log

### Mobile Screen
- File: `artifacts/mobile/app/trusted-safety-share.tsx`
- Entry point: `artifacts/mobile/app/settings.tsx` → App Settings → "Trusted Safety Share"
- Master enable toggle, contact list (up to 5), Add Contact modal (name + phone or email)
- Status badges: pending / active / paused / declined

## Alert filter rule (founder-specified)
- ✅ Hurricane, tornado, earthquake, tsunami, wildfire, flash flood, blizzard
- ✅ Government emergency alerts (FEMA)
- ✅ Active community threat (shooting)
- ❌ ICE checkpoints, police checkpoints, road closures, administrative alerts
- ❌ Minor weather (rain, heat advisory)
- **Why:** "relevant alerts don't tell mom the road is closed but true safe alerts — not ice present warn mom but hurricane/shooting yes"

## Notification text (exact, founder-specified)
"Safety Alert — [Name] is currently in [City, Region]. [Alert title] has been issued for that area. This alert was also sent to them. No action is required unless you hear otherwise."

## Privacy contract (non-negotiable)
- Contact sees ONLY: owner first name, general city/region, alert text
- No GPS coordinates, no searches, no saves, no activity ever
- Owner can revoke at any time; revocation is instant and silent
- Mutual consent required: MWM contacts accept via push notification + in-app respond route; non-MWM contacts accept via invite link (token)
- Auto-pauses when owner is home (home_city match)
- Max 5 trusted contacts per user

## Existing trusted_contact_shares (DIFFERENT FEATURE)
- Table in lib/db/src/schema/connections.ts
- Routes in artifacts/api-server/src/routes/connections.ts (lines 117-288)
- That feature: share with external contact through an existing MWM connection (different use case)
- Do NOT confuse with trusted_safety_shares (the new table)

## What's still needed (proposed tasks #242-244)
- #242: NOAA/NWS + FEMA polling scheduler to actually trigger notifyTrustedSafetyContacts for real weather emergencies
- #243: Web landing page for invite acceptance (GET /safety/trusted-shares/accept/:token exists, just needs a web page)
- #244: Wire notifyTrustedSafetyContacts into sendSafetyReportPushForCity in pushNotifications.ts for community safety cluster alerts
