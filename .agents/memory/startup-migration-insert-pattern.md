---
name: Startup migration INSERT pattern — two-step pre-check required
description: INSERT...SELECT...WHERE NOT EXISTS silently fails for businesses table on Railway; use pre-check Set pattern instead
---

## Rule
For `businesses` table inserts in startup migrations, use the proven **two-step pre-check** pattern:
1. Query existing rows into a `Set<string>` (by name.toLowerCase())
2. For each missing row, INSERT with a simple `VALUES (...)` — no `ON CONFLICT`, no `SELECT...WHERE NOT EXISTS`, no `dedupe_key`

## Why
`INSERT INTO businesses (...) SELECT ... WHERE NOT EXISTS (...)` silently returns `rowCount=0` on Railway even when no matching row exists.
Root cause unclear (possible interaction with partial unique indexes on `dedupe_key`), but the failure is consistent and hard to debug (try/catch catches the error, no Railway log access).
The `INSERT ... SELECT ... WHERE NOT EXISTS` pattern works in theory but has proven unreliable for this table in practice.

## How to apply
See `ensureAtlantaBlackGroceryStores` (fixed Aug 14 2026) and `ensureDirectoryBusinesses` / `ensureTourBusinesses` as canonical examples.
Key points:
- Pre-load existing names with `SELECT lower(name) FROM businesses WHERE lower(city) = $city`
- Skip stores whose `name.toLowerCase()` is in the Set
- Use `VALUES ($1,...,$N)` with no `dedupe_key` in the column list (avoids `businesses_canonical_dedupe_key_unique` partial index)
- `ownership_designations` passes as a raw JSON string (no `::jsonb` cast needed — pg driver handles type coercion)
