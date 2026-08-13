---
name: Shawn Hill Homes — repeated unresolved search failure
description: The founder has reported this specific search failure multiple times and explicitly asked it be tracked. Treat any future mention of Shawn Hill or Shawn Hill Homes as a top-priority regression.
---

## The issue
Searching "Shawn Hill" or "Shawn Hill Homes" on the /businesses page returns "No results" despite the business existing in the database (`id: 8bf062a2`, Los Angeles CA, `listing_status: live_unclaimed`, `status: active`).

## Why it has failed repeatedly
Two compounding bugs in `artifacts/api-server/src/routes/universal-search.ts`:

1. **PASS 1 applied a geo radius filter even for `named_business` intent.**
   "Shawn Hill" geocoded to Shawn Hill, IL (50-mile radius). "Shawn Hill Homes" is in LA — 1,600 miles away — excluded silently.
   Fix committed Aug 13 2026: skip `geoClause` in PASS 1 when `intentType === "named_business"`.

2. **Server-side business-first gate used exact `ILIKE $1` only** (no prefix match).
   `"Shawn Hill" ILIKE "Shawn Hill"` never matches `"Shawn Hill Homes"`.
   Fix committed Aug 13 2026: add `OR name ILIKE geoQ || '%'` to the gate query.

The geo-extract *endpoint* (maps.ts) had the correct prefix fix already. universal-search.ts did not — that inconsistency is what caused the repeated failures.

## What the founder asked to be recorded
The founder has raised this issue multiple times across multiple sessions and been told it was fixed each time. They asked explicitly that this be noted and that any future mention of "I asked this before" or "again" be flagged immediately without requiring them to re-explain.

## Verification required before declaring fixed
- Restart the API server workflow with the new build
- Test `GET /api/search/universal?q=Shawn+Hill+Homes` — must return the LA business
- Test `GET /api/search/universal?q=Shawn+Hill` — must return "Shawn Hill Homes" as a genuine name match, NOT namedBusinessNotFound=true
- Confirm in the Replit web preview AND on Railway production (separate DB — verify business exists there too)

## Railway production risk
Railway has its own separate Postgres database. If "Shawn Hill Homes" does not exist there, the search will still fail in production even with the code fix. Must verify Railway DB contains the record or add it to startup-migrations seed.

**Why:** executeSql("production") in CodeExecution is Replit's DB, NOT Railway's. See railway-verification-method.md.
