# Submission Release Gate
**Version 1.0 — Effective Build 97 and every build thereafter**
**Status: PERMANENT — not overridable by schedule pressure, investor timing, or feature urgency**

---

## Why this document exists

Build 96 was rejected because Apple's reviewer hit a 3-minute Railway Postgres outage at 03:01 AM UTC on July 27, 2026. Every authentication method they tried — Apple Sign-In, email login, direct registration — failed for the same reason: the database was unavailable.

The permanent release gates already in `replit.md` passed before Build 96 was submitted. Those gates check whether the API responds at a single point in time. They do not check whether it is stable over the hours surrounding submission, and they do not require end-to-end human-exercised flows against production.

The Railway logs that identified the 03:01 failure also showed the same DB failure pattern at 20:31 and 22:59 the night before submission. That query was not run before Build 96 was submitted. It is now a required step before every submission.

---

## The gap this gate closes

| What was checked before Build 96 | What was missed |
|---|---|
| `typecheck` — zero errors | DB stability over 24 hours before submission |
| `POST /api/auth/login-email` → 200 | Fresh Apple Sign-In registration on production |
| `GET /api/businesses?limit=3` → 200 | iPad-specific device test |
| Apple secrets present in Replit | Railway log audit for intermittent failures |
| Heritage Sites disabled (code) | Apple review account created and verified |
| | `APPLE_TOKEN_EXCHANGE_*` log events reviewed |
| | End-to-end registration flow by a human, not just curl |

---

## Required evidence before any EAS submission

Every item below must be completed and its evidence recorded. "It should be fine" and "it passed last time" are not evidence. The exact outputs must be captured.

---

### GATE 1 — Typecheck and build
**Who:** Agent
**Evidence required:** Terminal output showing zero errors

```
pnpm run typecheck
```

Zero errors. Any error blocks submission.

---

### GATE 2 — Production API spot check
**Who:** Agent
**Evidence required:** HTTP status and response time for each

```
GET  https://www.mappingwithmelanin.com/api/healthz         → 200 < 2s
POST https://www.mappingwithmelanin.com/api/auth/login-email → 200 < 2s
GET  https://www.mappingwithmelanin.com/api/businesses?limit=3 → 200 < 2s
```

This matches the existing permanent release gates in `replit.md`. Still required.

---

### GATE 3 — Railway log audit (24-hour window)
**Who:** Agent
**Evidence required:** Log query output showing zero DB failures in the 24 hours before submission

Query the Railway deployment logs for the active deployment and confirm:
- No `"Failed to fetch businesses"` entries
- No `"Unhandled error"` entries
- No `"POST /api/auth/apple error"` entries
- No `"POST /api/auth/login-email error"` entries
- No `"POST /api/auth/register error"` entries
- No `[db-pool] idle client error` entries

If ANY of these appear in the 24-hour window before submission, the pattern must be investigated and resolved before submitting. Do not submit if the database is showing intermittent failures.

**This gate was missing before Build 96. It now runs before every submission.**

---

### GATE 4 — Apple Key status (manual)
**Who:** Founder
**Evidence required:** Screenshot or verbal confirmation

Open: developer.apple.com → Certificates, Identifiers & Profiles → Keys

Confirm:
- Key ID `Z2NB4XAZY7` status = **Active** (not Revoked, not Expired)
- Team ID matches the app record

If the key is not Active, it must be replaced and all Railway Apple secrets updated before submission.

---

### GATE 5 — Fresh Apple Sign-In registration on production
**Who:** Founder or designated tester on a physical iPhone
**Evidence required:** Screenshots at each step OR Railway log showing APPLE_TOKEN_EXCHANGED event

Using a real Apple ID that has **never** authorized this app:
1. Open the current TestFlight build
2. Tap "Sign in with Apple"
3. Complete Apple authentication
4. Confirm app reaches the home screen or profile setup
5. Check Railway logs for `APPLE_TOKEN_EXCHANGED` event — confirms the authorization code was successfully exchanged

**Do not use an Apple ID that previously authorized the app for this test.** Apple only sends email, name, and a fresh authorization code on first authorization. A returning Apple ID exercises a different code path.

If this step fails, DO NOT SUBMIT. Identify the failure from Railway logs before proceeding.

---

### GATE 6 — Apple Sign-In returning user on production
**Who:** Founder or designated tester (same Apple ID from Gate 5, immediately after)
**Evidence required:** Successful login confirmation

Using the same Apple ID from Gate 5 (now an existing user):
1. Log out
2. Tap "Sign in with Apple" again
3. Confirm app reaches the home screen without error

This exercises the existing-user code path separately.

---

### GATE 7 — Email registration and login on production
**Who:** Agent (via curl) or tester
**Evidence required:** HTTP 200 responses and session token returned

```
POST /api/auth/register    → 200 + token
POST /api/auth/login-email → 200 + token (with same credentials)
POST /api/auth/logout      → 200
POST /api/auth/login-email → 200 + token (session restore)
```

All four must succeed against production.

---

### GATE 8 — iPad layout verification
**Who:** Founder or designated tester on an iPad or iPad simulator
**Evidence required:** Screenshot of login screen on iPad

Every submission that touches any screen must be verified on iPad before Apple sees it. Apple tests on iPad. The login screen, specifically, must show:
- Apple Sign-In button visible without scrolling
- All buttons readable and tappable
- No layout overflow or clipped content

Acceptable alternatives if no physical iPad is available:
- Xcode iPad Air (M3) simulator
- Screenshot via Simulator

---

### GATE 9 — Review account verified and uploaded
**Who:** Agent (create account) + Founder (confirm in ASC)
**Evidence required:** Founder confirmation that credentials are in ASC App Review Information for the exact build being submitted

A real email/password account must exist on the production backend with:
- Email verified (no pending verification step)
- No waitlist approval pending
- Full feature access (not demo-only)
- Password known to the founder

The credentials must be entered in App Store Connect → App Review Information **for the specific build being submitted**, not a prior build.

If demo mode is listed as the reviewer path, an email/password account must also be provided as a backup.

---

### GATE 10 — Railway log audit after testing (post-Gate 5–9)
**Who:** Agent
**Evidence required:** Log query output

After completing Gates 5 through 9, query Railway logs again for the 30 minutes covering the test window. Confirm:
- `APPLE_TOKEN_EXCHANGED` event appears (from Gate 5)
- No unexpected DB errors during the test window
- All auth routes returned 200, not 500

This proves that what was tested matches what is actually running on production.

---

### GATE 11 — Evidence package assembled
**Who:** Agent
**Evidence required:** A dated evidence file committed to the repo before the EAS build command is run

Create a file at `docs/product/releases/BUILD_<N>_RELEASE_GATE_EVIDENCE.md` containing:
- Build number and version
- Date and time of each gate completion
- Output or screenshot reference for each gate
- Name of who completed each gate
- Confirmation that typecheck passed
- Confirmation that Railway logs were clean for 24 hours before submission

**The EAS build command should not be run until this file is committed.**

---

## What blocks submission immediately

Any of the following blocks submission with no exceptions:

| Condition | Block reason |
|---|---|
| `pnpm run typecheck` has errors | Binary is broken |
| Railway logs show DB failure in last 24h | Infrastructure is unstable |
| Fresh Apple Sign-In registration fails | Reviewer will see the same failure |
| Apple Key Z2NB4XAZY7 is not Active | Token exchange will fail for all new users |
| No review account in ASC | Apple will reject for missing credentials |
| iPad layout is broken | Apple tests on iPad |
| Evidence file not committed | Gate has not been completed |

---

## What does NOT substitute for this gate

- "It worked last week" — does not count
- "Tests pass in dev" — production only
- "The code is correct" — correctness does not prove stability
- "Apple approved a similar build before" — each submission is evaluated independently
- Schedule pressure, investor calls, or travel dates — not a release gate exception

---

## When this gate can be updated

This gate can be expanded (more checks added) at any time by the agent after a new failure class is identified. It can only be contracted (checks removed) with explicit founder approval and a written reason in this file explaining what alternative coverage replaces the removed check.

---

## Accountability record

| Build | Gate result | Notes |
|---|---|---|
| 96 | GATE 3 and GATES 5–9 were not run | DB instability present before submission; not detected |
| 97 | Pending | |

---

*This document is a permanent operational standard. It lives at `docs/product/SUBMISSION_RELEASE_GATE.md` and is referenced in agent memory. It is not a draft, not a suggestion, and not a starting point for negotiation.*
