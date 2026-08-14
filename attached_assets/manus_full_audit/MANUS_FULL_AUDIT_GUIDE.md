# Mapping With Melanin — Complete Manus Audit Guide
**Version:** August 14, 2026  
**Prepared by:** MWM Engineering  
**Audit scope:** All user-facing platform features — web and mobile

---

## Part 1 — Tester Credentials

### Login Endpoint (Web API)
```
POST https://<dev-domain>/api/auth/login-email
Content-Type: application/json

{ "email": "manus.tester.01@mwm.audit", "password": "ManusAudit@2026!" }
```

Response: `{ "token": "<session-id>", "mustChangePassword": false }`  
Use the token as a Bearer header: `Authorization: Bearer <token>`  
OR set the `mwm_sid` cookie for browser-based testing.

### 30 Tester Accounts

All accounts share the same password: **`ManusAudit@2026!`**

| # | Email | Username | Role |
|---|-------|----------|------|
| 01 | manus.tester.01@mwm.audit | @manustester01 | tester |
| 02 | manus.tester.02@mwm.audit | @manustester02 | tester |
| 03 | manus.tester.03@mwm.audit | @manustester03 | tester |
| 04 | manus.tester.04@mwm.audit | @manustester04 | tester |
| 05 | manus.tester.05@mwm.audit | @manustester05 | tester |
| 06 | manus.tester.06@mwm.audit | @manustester06 | tester |
| 07 | manus.tester.07@mwm.audit | @manustester07 | tester |
| 08 | manus.tester.08@mwm.audit | @manustester08 | tester |
| 09 | manus.tester.09@mwm.audit | @manustester09 | tester |
| 10 | manus.tester.10@mwm.audit | @manustester10 | tester |
| 11 | manus.tester.11@mwm.audit | @manustester11 | tester |
| 12 | manus.tester.12@mwm.audit | @manustester12 | tester |
| 13 | manus.tester.13@mwm.audit | @manustester13 | tester |
| 14 | manus.tester.14@mwm.audit | @manustester14 | tester |
| 15 | manus.tester.15@mwm.audit | @manustester15 | tester |
| 16 | manus.tester.16@mwm.audit | @manustester16 | tester |
| 17 | manus.tester.17@mwm.audit | @manustester17 | tester |
| 18 | manus.tester.18@mwm.audit | @manustester18 | tester |
| 19 | manus.tester.19@mwm.audit | @manustester19 | tester |
| 20 | manus.tester.20@mwm.audit | @manustester20 | tester |
| 21 | manus.tester.21@mwm.audit | @manustester21 | tester |
| 22 | manus.tester.22@mwm.audit | @manustester22 | tester |
| 23 | manus.tester.23@mwm.audit | @manustester23 | tester |
| 24 | manus.tester.24@mwm.audit | @manustester24 | tester |
| 25 | manus.tester.25@mwm.audit | @manustester25 | tester |
| 26 | manus.tester.26@mwm.audit | @manustester26 | tester |
| 27 | manus.tester.27@mwm.audit | @manustester27 | tester |
| 28 | manus.tester.28@mwm.audit | @manustester28 | tester |
| 29 | manus.tester.29@mwm.audit | @manustester29 | tester |
| 30 | manus.tester.30@mwm.audit | @manustester30 | tester |

### Admin Account (use for admin-panel tests only)
Admin access is restricted to the founder's accounts. For any audit item that requires admin panel access, coordinate with the founder. Do not attempt to escalate privileges from a tester account.

---

## Part 2 — Platform Overview

Mapping With Melanin (MWM) is a culturally-anchored travel, discovery, and community platform for the Black diaspora. Core pillars:

1. **Business Discovery** — find Black-owned and culturally-relevant businesses on an interactive map
2. **KinfolkAI** — AI travel companion with cultural intelligence
3. **Community** — social feed, circles, safety alerts, endorsements
4. **Library** — curated knowledge system (books, articles, cultural sources)
5. **Events** — community events, festivals, and markets on the map
6. **Cultural Sites** — murals, monuments, historical sites, tour stops
7. **Membership** — freemium with individual and family tiers

---

## Part 3 — Feature Audit Checklist

For each feature below, record: **PASS / FAIL / PARTIAL / BLOCKED**  
Use tester account `manus.tester.01@mwm.audit` as the primary test account unless otherwise noted.

---

### A. Authentication & Account

**A1 — Email/Password Login**
- [ ] POST `/api/auth/login-email` with correct credentials → returns `{ token, mustChangePassword: false }`
- [ ] `mustChangePassword` is `false` (no forced password change)
- [ ] GET `/api/auth/user` with the Bearer token → returns full user object with role `tester`
- [ ] `approved: true`, `emailVerified: true`, `profileSetupComplete: true`
- PASS condition: Token returned, user object contains role=tester, no redirect to onboarding

**A2 — Bad Password**
- [ ] POST `/api/auth/login-email` with wrong password → 401 `"Invalid email or password."`
- PASS condition: 401, no token returned

**A3 — Logout**
- [ ] POST `/api/auth/logout-all` or `/api/mobile-auth/logout` with valid session → session invalidated
- [ ] GET `/api/auth/user` after logout → 401

---

### B. Business Discovery

**B1 — Atlanta Grocery Search**
- [ ] GET `/api/businesses?city=Atlanta&category=Grocery` → returns exactly 4 stores: Wadada, Sevananda, Nourish+Bloom Cascade, Goodr
- [ ] Each result has: name, address, phone (where available), website, latitude, longitude, black_owned=true
- PASS condition: 4 results, all have website URLs

**B2 — Search by name**
- [ ] GET `/api/businesses?search=Wadada` → returns Wadada result
- [ ] GET `/api/businesses?search=Goodr` → returns Goodr Community Market on Edgewood
- PASS condition: Correct stores returned by name

**B3 — Business detail page**
- [ ] GET `/api/businesses/c09df6ab-c5de-458a-b314-282fc90ec53d` (Wadada) → full record with description, ownership_designations, website
- [ ] GET `/api/businesses/71bf880e-8bce-4d45-8c97-5c7918fd4ec8` (Goodr) → full record
- PASS condition: 200, full profile returned

**B4 — Website URL clickability**
- [ ] For each Atlanta grocery store, the `website` field contains a valid HTTPS URL
- [ ] Open each URL in a browser: all 4 should load their respective store websites
- URLs to verify:
  - Wadada: https://www.wadadaatl.com
  - Sevananda: https://sevananda.coop
  - Nourish+Bloom: https://www.nourishandbloommarket.com
  - Goodr: https://goodr.co

**B5 — Black-owned filter**
- [ ] GET `/api/businesses?city=Atlanta&blackOwned=true` → includes all 4 grocery stores
- PASS condition: All 4 appear, no non-black-owned stores in results

**B6 — Map pins**
- [ ] GET `/api/maps/discoverability-pins` (or equivalent) → includes pins for all 4 Atlanta grocery stores
- [ ] Each pin has latitude, longitude within Atlanta bounding box (lat 33.64–33.89, lon -84.55 to -84.28)
- PASS condition: 4 pins exist, coordinates valid

**B7 — Duplicate protection**
- [ ] Perform two identical business searches for "Atlanta grocery" → same records returned both times, count does not grow
- PASS condition: Results are stable across repeated calls

**B8 — Hidden records not exposed**
- [ ] Any business with `is_duplicate=true` or `listing_status` not in `live_unclaimed`/`live_claimed` must NOT appear in search, map, or detail results for tester accounts
- PASS condition: No hidden records leak into public results

---

### C. KinfolkAI

**C1 — Basic cultural query**
- [ ] POST `/api/kinfolk/chat` with `{ "message": "What are some Black-owned restaurants in Washington DC?" }`
- [ ] Response includes culturally-relevant suggestions with source citations
- [ ] Response does NOT hallucinate or return generic non-cultural content
- PASS condition: Response mentions real DC neighborhoods (Shaw, U Street, etc.) or verified businesses

**C2 — Travel planning**
- [ ] POST `/api/kinfolk/chat` with `{ "message": "I'm planning a trip to Atlanta. What neighborhoods should I explore?" }`
- [ ] Response mentions culturally significant Atlanta neighborhoods (Sweet Auburn, West End, etc.)
- PASS condition: Culturally grounded response, no generic travel boilerplate

**C3 — International destination**
- [ ] POST `/api/kinfolk/chat` with `{ "message": "Tell me about the Black community experience in Phuket, Thailand" }`
- [ ] Response references the Phuket cultural context (if available) or flags limited data
- PASS condition: Response does not hallucinate; if limited data, says so clearly

**C4 — Inappropriate request handling**
- [ ] POST `/api/kinfolk/chat` with off-topic request (e.g., legal advice, medical diagnosis)
- [ ] Response redirects to appropriate resources, does not provide legal/medical guidance
- PASS condition: Graceful deflection, culturally appropriate tone

**C5 — Rate limiting**
- [ ] Submit 5 rapid Kinfolk queries with the same account
- [ ] At some point, a KINFOLK_BUSY or rate-limit response should appear
- PASS condition: System gracefully queues or throttles, does not 500

**C6 — Authentication gate**
- [ ] POST `/api/kinfolk/chat` without a valid session → 401 or 403
- PASS condition: Unauthenticated requests are rejected

---

### D. Community Feed

**D1 — Browse public feed**
- [ ] GET `/api/community/posts?feed=everyone` → list of community posts
- [ ] Each post has: id, content, created_at, user info
- PASS condition: Posts returned, no auth required for public feed

**D2 — Browse following feed**
- [ ] GET `/api/community/posts?feed=following` (authenticated) → posts from followed users
- [ ] For a fresh tester account with no follows, returns empty array (not error)
- PASS condition: 200, empty or populated array

**D3 — Create a post**
- [ ] POST `/api/community/posts` with `{ "content": "Testing Manus audit - ignore", "visibility": "public" }` → post created
- [ ] Post appears in GET `/api/community/posts?feed=everyone`
- PASS condition: Post created, visible in public feed

**D4 — Delete a post**
- [ ] DELETE `/api/community/posts/:id` on a post owned by the current user → 200
- [ ] Post no longer appears in feed
- PASS condition: Deleted successfully

**D5 — Privacy: following-only post**
- [ ] POST `/api/community/posts` with `{ "content": "Private test", "visibility": "followers" }` → created
- [ ] GET from a different tester account that doesn't follow the author → post NOT visible
- PASS condition: Follower-only visibility enforced

---

### E. Safety Features

**E1 — Safety report submission**
- [ ] POST `/api/safety/reports` (or equivalent) with a safety concern about a location
- [ ] Report is accepted and stored
- PASS condition: 201, report ID returned

**E2 — Community safety stats on business page**
- [ ] For a business with community safety data, the business detail page should show safety/vibe indicators
- [ ] For businesses without data, the field should be absent or null (not an error)
- PASS condition: Safety data shown when available, graceful absence when not

**E3 — Welcoming Environment badge**
- [ ] For businesses that meet the community threshold, confirm "Welcoming Environment" badge appears in the API response or UI
- PASS condition: Badge shown on qualifying businesses, absent on others

---

### F. Library (Knowledge System)

**F1 — Browse collections**
- [ ] GET `/api/library/collections` → list of Library Collections (Divine Nine, Health, Faith, etc.)
- [ ] At least 11 collections returned
- PASS condition: 11+ collections, each with title and description

**F2 — Browse a collection's books**
- [ ] GET `/api/library/collections/:id` → books within a collection
- PASS condition: Books listed with titles and source counts

**F3 — Knowledge sources**
- [ ] GET `/api/library/sources` or `/api/library/books/:id/sources` → list of sources
- [ ] Sources have: title, url, link_state
- [ ] `link_state` for available sources is `available` or `redirected` (not `unavailable`)
- PASS condition: Sources returned with link status

**F4 — Topics**
- [ ] GET `/api/library/topics` → knowledge topics list (81+ topics expected)
- PASS condition: Topics returned, no error

---

### G. Events / What's Happening

**G1 — Browse events**
- [ ] GET `/api/events` or `/api/community/events` → list of upcoming events
- [ ] Events have: title, date, city, category
- [ ] Past events should NOT appear in the results
- PASS condition: Only future events returned

**G2 — Events by city**
- [ ] GET `/api/events?city=Atlanta` → Atlanta events only
- [ ] GET `/api/events?city=Washington` → DC events only
- PASS condition: City filter works correctly

**G3 — Event count**
- [ ] Total events across all cities should be ~200+ (platform has 457+ geocoded events)
- PASS condition: Large event catalog confirmed

---

### H. Cultural Sites

**H1 — Browse cultural sites**
- [ ] GET `/api/cultural-sites` or `/api/tours/cultural-sites` → list of sites
- [ ] Expect 794+ sites
- PASS condition: Large site catalog, all have coordinates

**H2 — Site detail**
- [ ] GET `/api/cultural-sites/:id` → full site record with name, description, coordinates
- PASS condition: Full profile returned

**H3 — Map pins**
- [ ] Cultural site map pins all have valid coordinates
- [ ] External links on sites use `https://` protocol (not javascript: or relative URLs)
- PASS condition: All pins have coordinates, external links are safe

---

### I. User Profile & Social

**I1 — View own profile**
- [ ] GET `/api/auth/user` → returns profile for logged-in tester
- [ ] Fields present: email, firstName, lastName, username, role, tier
- PASS condition: Full profile returned, tier is calculated

**I2 — Follow another user**
- [ ] POST `/api/users/:id/follow` for a user ID that exists → follow relationship created
- [ ] GET `/api/community/posts?feed=following` → that user's posts now appear
- PASS condition: Follow works, feed reflects it

**I3 — User handle**
- [ ] Each tester account has a `handle` field (e.g., `@manustester01`)
- [ ] Handle is unique across all users
- PASS condition: Handle present and unique

---

### J. Business Claims & Ownership

**J1 — Submit a business claim**
- [ ] POST `/api/businesses/:id/claim` with ownership evidence → claim submitted
- [ ] Claim enters review queue (not auto-approved)
- [ ] Claiming the same business twice from the same account → error or idempotent response
- PASS condition: Claim submitted, goes to review, not duplicated

**J2 — View claim status**
- [ ] GET `/api/businesses/:id/claim-status` (or equivalent) → returns current claim state
- PASS condition: Status returned

---

### K. Membership & Billing

**K1 — View membership status**
- [ ] GET `/api/auth/user` → `tier` field shows `free`, `individual`, or `family`
- [ ] Tester accounts should have tester access (no paywall for gated features)
- PASS condition: Tier returned, tester bypass active

**K2 — Paywall gate (non-tester)**
- [ ] Attempt a membership-gated endpoint with a fresh non-tester account (or without auth)
- [ ] Should return 402 or 403 with upgrade prompt
- PASS condition: Paywall triggers correctly

**K3 — Billing history**
- [ ] GET `/api/billing/history` (authenticated) → list of past charges (empty for test accounts)
- PASS condition: 200, empty array for test accounts (no error)

---

### L. Ingestion Pipeline (Admin)

**L1 — Natural language query**
- [ ] POST `/api/businesses/ingest` with admin auth, `{ "kind": "query", "text": "Find Black-owned grocery stores in Atlanta", "ownershipAttribute": "Black / African American-Owned" }`
- [ ] Returns candidates with action: UPDATED_EXISTING (for the 4 known stores) or NEEDS_REVIEW
- [ ] No new duplicate rows created for already-known stores
- PASS condition: Returns known stores as UPDATED_EXISTING, no duplicates created

**L2 — URL ingestion**
- [ ] POST `/api/businesses/ingest` with `{ "kind": "url", "url": "https://www.wadadaatl.com" }`
- [ ] Returns UPDATED_EXISTING for Wadada (already in DB)
- PASS condition: Existing record matched, not duplicated

**L3 — Repeat query idempotency**
- [ ] Submit the same query twice in a row
- [ ] Business count in DB does not increase
- PASS condition: DB count stable, existing IDs returned

---

### M. Admin Panel (requires admin account — coordinate with founder)

**M1 — Business review queue**
- [ ] GET `/api/admin/business-review` → list of items pending review
- [ ] Items have: candidate name, address, evidence, score, review_type, status

**M2 — Merge a duplicate**
- [ ] PATCH `/api/admin/business-review/:id` with `{ "action": "merge", "canonicalId": "..." }`
- [ ] Duplicate business row gets `is_duplicate=true`, `duplicate_of_id` set, disappears from public results
- [ ] Review item status becomes `resolved`
- [ ] Repeat the Merge → no second mutation

**M3 — Admin user lookup**
- [ ] GET `/api/admin/users` → list of users (admin only)
- [ ] Manus test accounts appear with role=tester

---

## Part 4 — Known Limitations (Not Failures)

- **Image ingestion** (POST `/api/businesses/ingest` with `kind: image`) requires a publicly accessible image URL with a business name/address visible in the image.
- **Nourish + Bloom** and **Goodr** have no phone numbers — autonomous/cashierless stores. `ℹ️ NO PHONE` is correct.
- **Goodr's website** (`goodr.co`) is the parent organization homepage. The Edgewood Community Market is one of their programs. This is the authoritative URL.
- **Sevananda** is a community co-op, not a single-owner Black business — its EatOkra listing confirms its Black-serving designation.
- **KinfolkAI** international responses may be limited for less-documented destinations. The system should say so rather than hallucinate.
- **Business claim submission** (Feature J) sends to review — approval requires admin action and is not instant.
- **Membership paywall** (Feature K) is bypassed for tester accounts. To test the paywall itself, use a non-tester API endpoint without auth or with a non-tester role.
- **Concurrency limit** on KinfolkAI: the platform throttles to 4 concurrent sessions. Testing with all 30 tester accounts simultaneously may trigger the KINFOLK_BUSY queue message — this is expected behavior, not a failure.

---

## Part 5 — API Base URLs

| Environment | Base URL |
|-------------|----------|
| Development (Replit preview) | `https://<replit-dev-domain>/api` |
| Production (Railway) | `https://api.mappingwithmelanin.com/api` *(pending GoDaddy CNAME unlock)* |

All endpoints require: `Content-Type: application/json`  
Authenticated endpoints require: `Authorization: Bearer <token>` OR `Cookie: mwm_sid=<token>`

---

## Part 6 — Return Format

For each feature section (A through M), return:

```
FEATURE [ID]: PASS / FAIL / PARTIAL / BLOCKED
  Request: [method + path + body]
  Response: [status + key fields]
  Notes: [any unexpected behavior, workarounds, or error messages]
```

For FAIL items, include:
- The exact error response body
- Whether the error is consistent (every time) or intermittent
- Any patterns (only fails when unauthenticated, only fails for certain accounts, etc.)

---

## Part 7 — Session from This Audit

This audit covers platform state as of:
- **Git commit:** a1945340 (Atlanta grocery stores + Manus v2 patches)
- **Railway deploy:** pending — may deploy automatically from GitHub push
- **Dev environment:** Replit dev server, built from commit a1945340
- **DB state:** 30 Manus tester accounts created August 14, 2026
