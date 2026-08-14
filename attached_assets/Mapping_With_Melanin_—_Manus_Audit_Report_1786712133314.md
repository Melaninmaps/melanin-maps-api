# Mapping With Melanin — Manus Audit Report
**Date:** August 14, 2026  
**Environment:** Replit Development Preview  
**Prepared for:** Manus AI Audit System

---

## Connection Details

### Web App (browser / UI tests)
```
https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/
```

### API Base (direct HTTP tests)
```
https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/api
```

> **Note:** This is a Replit development preview URL. It is live for the current session. If you receive a connection error, request a fresh URL from the founder before continuing — do not fabricate results.

---

## Before You Start — Connection Verification

Run this first. If it fails, stop and request a new URL.

```bash
curl -s "https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/api/healthz"
```

**Expected:** `{"status":"ok",...}` with HTTP 200  
**If 404 or timeout:** URL has changed. Contact founder.

---

## Tester Credentials

**Password (all 30 accounts):** `ManusAudit@2026!`

| # | Email |
|---|-------|
| 01 | manus.tester.01@mwm.audit |
| 02 | manus.tester.02@mwm.audit |
| 03 | manus.tester.03@mwm.audit |
| 04 | manus.tester.04@mwm.audit |
| 05 | manus.tester.05@mwm.audit |
| 06 | manus.tester.06@mwm.audit |
| 07 | manus.tester.07@mwm.audit |
| 08 | manus.tester.08@mwm.audit |
| 09 | manus.tester.09@mwm.audit |
| 10 | manus.tester.10@mwm.audit |
| 11 | manus.tester.11@mwm.audit |
| 12 | manus.tester.12@mwm.audit |
| 13 | manus.tester.13@mwm.audit |
| 14 | manus.tester.14@mwm.audit |
| 15 | manus.tester.15@mwm.audit |
| 16 | manus.tester.16@mwm.audit |
| 17 | manus.tester.17@mwm.audit |
| 18 | manus.tester.18@mwm.audit |
| 19 | manus.tester.19@mwm.audit |
| 20 | manus.tester.20@mwm.audit |
| 21 | manus.tester.21@mwm.audit |
| 22 | manus.tester.22@mwm.audit |
| 23 | manus.tester.23@mwm.audit |
| 24 | manus.tester.24@mwm.audit |
| 25 | manus.tester.25@mwm.audit |
| 26 | manus.tester.26@mwm.audit |
| 27 | manus.tester.27@mwm.audit |
| 28 | manus.tester.28@mwm.audit |
| 29 | manus.tester.29@mwm.audit |
| 30 | manus.tester.30@mwm.audit |

**Business-owner account (for business dashboard checks):**
- Email: `manus.biz.owner@mwm.audit`
- Password: `ManusAudit@2026!`
- Has `is_business_owner = true`

All accounts: role=`tester`, approved, email verified, no forced password change, full platform access.

---

## How to Log In

### Get a session token
```bash
curl -s -X POST "{API_BASE}/auth/login-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"manus.tester.01@mwm.audit","password":"ManusAudit@2026!"}'
```

**Expected response:**
```json
{ "token": "<session-id>", "mustChangePassword": false }
```

### Use the token
All authenticated requests: add `Authorization: Bearer <token>` header.  
Or use the session cookie `mwm_sid=<token>` for browser-based tests.

### Verify the session
```bash
curl -s "{API_BASE}/auth/user" -H "Authorization: Bearer <token>"
```

**Expected:** User object with `role: "tester"`, `approved: true`, `emailVerified: true`

---

## Test Suite

Use `{API_BASE}` = `https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/api`  
Use `{TOKEN}` = token returned from login.

Record each result as **PASS / FAIL / PARTIAL** with the actual HTTP status and response body.

---

### 1. Authentication

**1.1 — Valid login**
```bash
curl -s -X POST "{API_BASE}/auth/login-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"manus.tester.01@mwm.audit","password":"ManusAudit@2026!"}'
```
✅ Pass: HTTP 200, `token` present, `mustChangePassword: false`

**1.2 — Wrong password**
```bash
curl -s -X POST "{API_BASE}/auth/login-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"manus.tester.01@mwm.audit","password":"wrongpassword"}'
```
✅ Pass: HTTP 401, `"Invalid email or password."`

**1.3 — Unauthenticated access to protected route**
```bash
curl -s "{API_BASE}/auth/user"
```
✅ Pass: HTTP 401

**1.4 — Session retrieval**
```bash
curl -s "{API_BASE}/auth/user" -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, `role: "tester"`, `approved: true`

---

### 2. Business Search & Map

**2.1 — General search**
```bash
curl -s "{API_BASE}/businesses?search=restaurant&city=Atlanta" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, array of businesses, each with `name`, `address`, `city`

**2.2 — Atlanta Black-owned grocery stores**
```bash
curl -s "{API_BASE}/businesses?city=Atlanta&search=grocery" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: Returns at least Wadada, Sevananda, Nourish+Bloom, Goodr

**2.3 — Search by exact name**
```bash
curl -s "{API_BASE}/businesses?search=Wadada" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: Wadada Healthy Market appears in results

**2.4 — Black-owned filter**
```bash
curl -s "{API_BASE}/businesses?city=Atlanta&blackOwned=true" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: Results all have `black_owned: true`

**2.5 — Business detail**
Take an `id` from test 2.1 results, then:
```bash
curl -s "{API_BASE}/businesses/{id}" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, full profile with `name`, `address`, `website`, `phone`, `latitude`, `longitude`

**2.6 — Duplicate records not exposed**
```bash
curl -s "{API_BASE}/businesses?search=Wadada&limit=20" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: Wadada appears exactly once, not duplicated

**2.7 — Map discovery pins**
```bash
curl -s "{API_BASE}/maps/discoverability-pins" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, array of pins each with `lat`, `lng`, `type`

---

### 3. KinfolkAI

**3.1 — Basic cultural query**
```bash
curl -s -X POST "{API_BASE}/kinfolk/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"message":"What are some Black-owned restaurants in Washington DC?"}'
```
✅ Pass: HTTP 200, response includes culturally grounded suggestions (Shaw, U Street, etc.). No generic boilerplate.

**3.2 — Atlanta neighborhood guidance**
```bash
curl -s -X POST "{API_BASE}/kinfolk/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"message":"I am visiting Atlanta. Which neighborhoods have the most Black cultural history?"}'
```
✅ Pass: Response mentions Sweet Auburn, West End, or similar. Does not hallucinate.

**3.3 — International destination**
```bash
curl -s -X POST "{API_BASE}/kinfolk/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"message":"What should I know as a Black traveler visiting Phuket, Thailand?"}'
```
✅ Pass: Culturally aware response. If data is limited, response says so clearly rather than fabricating.

**3.4 — Off-topic deflection**
```bash
curl -s -X POST "{API_BASE}/kinfolk/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"message":"Can you help me draft a legal contract?"}'
```
✅ Pass: Graceful deflection. Does not provide legal advice. Culturally appropriate tone.

**3.5 — Unauthenticated block**
```bash
curl -s -X POST "{API_BASE}/kinfolk/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```
✅ Pass: HTTP 401 or 403. No AI response returned.

---

### 4. Community Feed

**4.1 — Public feed**
```bash
curl -s "{API_BASE}/community/posts?feed=everyone" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, array of posts with `id`, `content`, `created_at`

**4.2 — Following feed (empty for new account)**
```bash
curl -s "{API_BASE}/community/posts?feed=following" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, empty array (no error)

**4.3 — Create a post**
```bash
curl -s -X POST "{API_BASE}/community/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"content":"Manus audit test post — please ignore","visibility":"public"}'
```
✅ Pass: HTTP 201, post `id` returned

**4.4 — Delete own post**
Take the `id` from test 4.3, then:
```bash
curl -s -X DELETE "{API_BASE}/community/posts/{id}" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200

---

### 5. Library (Knowledge System)

**5.1 — Collections list**
```bash
curl -s "{API_BASE}/library/collections" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, at least 11 collections (Divine Nine, Health, Faith, Places, etc.)

**5.2 — Knowledge topics**
```bash
curl -s "{API_BASE}/library/topics" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, at least 81 topics

**5.3 — Sources within a collection**
Take a collection `id` from test 5.1, then:
```bash
curl -s "{API_BASE}/library/collections/{id}" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, sources listed with `title`, `url`, `link_state`

---

### 6. Events (What's Happening)

**6.1 — Upcoming events**
```bash
curl -s "{API_BASE}/community/events" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, array of events. All events have `date` in the future. No past events.

**6.2 — Events by city**
```bash
curl -s "{API_BASE}/community/events?city=Atlanta" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, only Atlanta events returned

**6.3 — Event count**
```bash
curl -s "{API_BASE}/community/events?limit=500" \
  -H "Authorization: Bearer {TOKEN}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Total events:', len(d) if isinstance(d,list) else d.get('total','unknown'))"
```
✅ Pass: 200+ events in catalog

---

### 7. Cultural Sites

**7.1 — Site list**
```bash
curl -s "{API_BASE}/cultural-sites?limit=10" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, results include `name`, `description`, `latitude`, `longitude`

**7.2 — Site detail**
Take a site `id` from test 7.1, then:
```bash
curl -s "{API_BASE}/cultural-sites/{id}" \
  -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: Full site record, any external `website` URL starts with `https://`

---

### 8. User Profile

**8.1 — Own profile**
```bash
curl -s "{API_BASE}/auth/user" -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: `email`, `firstName`, `lastName`, `username`, `role: "tester"`, `handle` all present

**8.2 — Handle format**
From test 8.1 response, confirm `handle` = `manustester01` (for account 01)  
✅ Pass: Handle present and matches expected pattern

---

### 9. Business-Owner Account

Use `manus.biz.owner@mwm.audit` / `ManusAudit@2026!` for these tests.

**9.1 — Login as business owner**
```bash
curl -s -X POST "{API_BASE}/auth/login-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"manus.biz.owner@mwm.audit","password":"ManusAudit@2026!"}'
```
✅ Pass: HTTP 200, token returned

**9.2 — Profile shows business-owner flag**
```bash
curl -s "{API_BASE}/auth/user" -H "Authorization: Bearer {BIZ_TOKEN}"
```
✅ Pass: `isBusinessOwner: true` in response

**9.3 — Business claim submission**
Take any live business `id` from test 2.1, then:
```bash
curl -s -X POST "{API_BASE}/businesses/{id}/claim" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BIZ_TOKEN}" \
  -d '{"ownershipType":"sole_proprietor","evidenceDescription":"Manus audit test — disposable claim"}'
```
✅ Pass: HTTP 200 or 201. Claim enters review queue. Does NOT auto-approve.  
⚠️ Note: This creates a real claim in the review queue. The founder will need to dismiss it after the audit.

---

### 10. Concurrent 30-Account Load Check

Run all 30 logins in parallel and verify all succeed. Python:

```python
import requests, concurrent.futures, json

BASE = "https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/api"
PASSWORD = "ManusAudit@2026!"

def login(n):
    email = f"manus.tester.{n:02d}@mwm.audit"
    r = requests.post(f"{BASE}/auth/login-email",
                      json={"email": email, "password": PASSWORD}, timeout=30)
    return {"account": n, "status": r.status_code, "has_token": "token" in r.json()}

with concurrent.futures.ThreadPoolExecutor(max_workers=30) as ex:
    results = list(ex.map(login, range(1, 31)))

passed = [r for r in results if r["status"] == 200 and r["has_token"]]
failed = [r for r in results if r not in passed]
print(f"PASS: {len(passed)}/30   FAIL: {len(failed)}/30")
if failed: print("Failed accounts:", failed)
```

✅ Pass: 30/30 logins return HTTP 200 with token  
⚠️ Note: Some accounts may briefly queue if the server is under load — retry any that return 429 or 503 once before marking as FAIL.

---

### 11. Membership & Tier

**11.1 — Tester tier bypass**
```bash
curl -s "{API_BASE}/auth/user" -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: `tier` field is present. Tester accounts should access all platform features without a paywall prompt.

**11.2 — Billing history (empty for test accounts)**
```bash
curl -s "{API_BASE}/billing/history" -H "Authorization: Bearer {TOKEN}"
```
✅ Pass: HTTP 200, empty array. No error.

---

### 12. Safety Features

**12.1 — Safety report endpoint exists**
```bash
curl -s -X POST "{API_BASE}/safety/reports" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"businessId":"{any_business_id}","type":"general","description":"Manus audit test — please disregard","severity":"low"}'
```
✅ Pass: HTTP 200 or 201. Report accepted.  
⚠️ Note: This creates a real report in the moderation queue. The founder will need to dismiss it after the audit.

---

## Result Recording Template

For each test above, record:

```
TEST [ID]: PASS | FAIL | PARTIAL | BLOCKED
  HTTP Status: [code]
  Response snippet: [first 200 chars of body]
  Notes: [any unexpected behavior]
```

For FAIL, always include:
- Is it consistent (every run) or intermittent?
- Does it occur on all 30 accounts or just some?
- Exact error message

---

## Out of Scope for This Audit

The following require founder/admin access and are **excluded**:

- Admin business review queue (`/api/admin/...`)
- Approving or rejecting business claims
- User management in the admin panel
- Sending platform notifications
- Moderation queue review

---

## Known Platform Behavior (Not Failures)

- **KinfolkAI** throttles to 4 concurrent sessions. If you run all 30 accounts simultaneously against KinfolkAI, some will receive a queue/busy message. This is correct behavior.
- **Goodr** and **Nourish + Bloom** have no phone numbers — they are autonomous stores. Absence of `phone` is correct.
- **Business claim** (test 9.3) goes to review by design — it will not auto-approve and is not a failure.
- **Safety report** (test 12.1) goes to moderation queue by design.
- The `tier` field on tester accounts may show `free` or `tester` depending on implementation — either is acceptable as long as gated content is accessible.
