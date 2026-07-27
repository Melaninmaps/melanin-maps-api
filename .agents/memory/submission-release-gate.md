---
name: Submission Release Gate
description: 11-gate checklist required before every EAS submission. Closes the gap that caused Build 96 rejection — Railway log audit, fresh Apple Sign-In registration on production, iPad test, and review account are all required gates with evidence.
---

# Submission Release Gate

**File:** `docs/product/SUBMISSION_RELEASE_GATE.md`
**Effective:** Build 97 and every build thereafter
**Status:** PERMANENT — not overridable by schedule pressure

## Why this exists

Build 96 was rejected because Apple's reviewer hit a 3-minute Railway Postgres outage at 03:01 AM UTC July 27, 2026. The existing release gates (typecheck + two HTTP checks) passed before submission. The Railway log audit that would have detected the intermittent DB failure pattern was not run. No fresh Apple Sign-In registration was tested against production. No review account was created. No iPad test was performed.

The same Railway log query that found the failure after rejection would have found the same pattern (20:31, 22:59 failures) if run the morning of submission.

## The 11 required gates

1. `pnpm run typecheck` — zero errors
2. Production API spot check (healthz, login-email, businesses)
3. **Railway log audit — 24 hours before submission — zero DB errors** ← new, was missing
4. Apple Key Z2NB4XAZY7 status = Active (founder manual check)
5. **Fresh Apple Sign-In registration on production (new Apple ID)** ← new, was missing
6. Apple Sign-In returning user on production
7. Email registration and login on production
8. **iPad layout verification** ← new, was missing
9. **Review account created, verified, and uploaded to ASC** ← new, was missing
10. Railway log audit after testing (APPLE_TOKEN_EXCHANGED event confirmed)
11. Evidence file committed to `docs/product/releases/BUILD_<N>_RELEASE_GATE_EVIDENCE.md`

## What the Railway log audit checks

Before submission, query the Railway deployment logs for:
- No `"Failed to fetch businesses"` entries
- No `"Unhandled error"` entries
- No `"POST /api/auth/apple error"` entries
- No `"POST /api/auth/login-email error"` entries
- No `[db-pool] idle client error` entries

If any appear in the 24-hour window, investigate before submitting.

## How to apply

When a new EAS submission is being prepared, open `docs/product/SUBMISSION_RELEASE_GATE.md` and step through all 11 gates in order. Do not run `eas build --platform ios --profile production` until gate 11 is committed.

## Root cause memory

The Build 96 failure path: Railway Postgres dropped connections at 03:01 AM → businesses failed → Apple auth failed → email login failed → registration failed. Apple reviewer saw "Apple Sign-In failed. Please try again." All Apple-specific code was correct. PATH B (secrets missing) eliminated. PATH A (token exchange failed) eliminated. PATH C (no authCode) eliminated. Actual failure: PATH D (outer catch — DB connection error during first user lookup query).

**Why:** Build 96 released without production stability window verification or end-to-end Apple registration evidence.
