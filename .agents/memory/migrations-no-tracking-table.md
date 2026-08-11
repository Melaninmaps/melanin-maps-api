---
name: MIGRATIONS array runs on every boot — no tracking table
description: Every entry in the MIGRATIONS array executes on every server start, not just once. This caused tester accounts to be deleted on every deploy.
---

## The Rule
The `MIGRATIONS` array in `startup-migrations.ts` has NO migration tracking table. Every SQL statement in that array runs on **every single server boot** — every deploy, every crash-restart, every Railway healthcheck restart.

## Why This Matters
- Statements that use `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` are safe (idempotent)
- Any statement that **deletes, truncates, or destroys data** will run on every boot

## The Incident
`tester_clean_slate_v2` and `tester_verification_cleanup_v1` were in the MIGRATIONS array. They deleted all tester user accounts by email list. This ran on every server start. Any UPSERT migration that created accounts immediately had those accounts deleted by the clean_slate migration running later in the same array.

**Result:** No tester could ever log in. Every account was wiped on every boot.

**Fix:** Removed both DELETE migrations from the array. Replaced with `tester_accounts_restore_v1` (UPSERT — idempotent, creates missing, corrects existing).

## Permanent Rule
**NEVER add DELETE FROM, TRUNCATE, or DROP to the MIGRATIONS array.** These will execute on every deploy and every crash-restart. The array is for idempotent schema changes (ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS, INSERT ... ON CONFLICT DO NOTHING, UPSERT).

**Why:** No tracking table exists. The `name` field is only for log output.

**How to apply:** Before adding anything to MIGRATIONS, ask: "Is this safe to run 1000 times?" If not, it does not belong in MIGRATIONS.
