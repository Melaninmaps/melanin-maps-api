---
name: KinfolkAI catalog pool.query + missing Railway columns
description: Root cause of KinfolkAI saying "no listings" for Phuket/Bangkok despite data existing in DB
---

## The Bug
KinfolkAI said "I don't have any listings for Phuket/Bangkok" even when the Railway prod DB had 13 Phuket and 25 Bangkok businesses. The outer `try/catch` swallowed every error silently.

## Root Causes (layered)

### 1. Drizzle db.select() with leftJoin fails silently in esbuild bundle
`db.select(...).from(businessesTable).leftJoin(businessIdentityTable, ...)` threw an error in Railway's esbuild bundle that the outer catch swallowed. **Fix: use `pool.query(SQL, params)` instead** — pool.query is proven to work on Railway.

### 2. pool.query had columns missing from Railway prod DB
After switching to pool.query, the SQL selected `bi.audience_type`, `bi.environment_tags`, `bi.amenity_tags` — columns that were added to the Drizzle schema but never applied to the Railway prod DB via startup migration. This caused error `42703 (column does not exist)`, also silently swallowed.

**Fix: add startup migrations to add these columns, then restore full column set.**

### 3. Geo-radius fallback had the same column bug
The inner geo-radius fallback (for destinations with sub-area city names like Karon/Patong/Chalong for "Phuket") had the same 3 missing columns in its SQL. Fixed the same way.

### 4. AI prompt: too strict category matching
Even after the catalog worked (13 rows returned), the AI said "doesn't have listings for **restaurants**" because the MWM businesses had categories like "Food" not "Restaurant." The instruction said "if no platform businesses **match what the user is looking for**."

**Fix: updated prompt to "ALWAYS surface these by name — do NOT require exact category match" and "only say doesn't have a listing when the MWM section is COMPLETELY EMPTY."**

## Diagnostics Process
- `console.log` is NOT captured by Railway's log API — use `req.log?.info()` (pino) to get log lines in Railway
- The `catalogErr` pino field is stripped by Railway's log display — inline the error into the message string: `` `err="${errMsg}"` ``
- Railway reports the new deploy SHA before startup migrations finish — always wait 30-35s after deploy before testing

## Startup Migrations Added
In `startup-migrations.ts` (names: `business_identity_audience_type_col_v1`, `business_identity_environment_tags_col_v1`, `business_identity_amenity_tags_col_v1`):
```sql
ALTER TABLE business_identity ADD COLUMN IF NOT EXISTS audience_type VARCHAR(30) NOT NULL DEFAULT 'unknown'
ALTER TABLE business_identity ADD COLUMN IF NOT EXISTS environment_tags JSONB NOT NULL DEFAULT '[]'::jsonb
ALTER TABLE business_identity ADD COLUMN IF NOT EXISTS amenity_tags JSONB NOT NULL DEFAULT '[]'::jsonb
```

**Why:** These were added to the Drizzle schema post-Railway-migration without a startup migration to backfill them. This pattern will recur if new columns are added to the schema without a corresponding startup migration.

**How to apply:** Any time you add a column to a Drizzle schema table, also add an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` entry to `startup-migrations.ts`. Otherwise Railway prod DB will diverge.

## Final Proof
- Phuket: `businesses: ['Suay Restaurant — Phuket', 'Naka Weekend Market Phuket']`
- Bangkok: `businesses: ['Issaya Siamese Club', 'Paste Restaurant', 'Soul Food Mahanakorn', 'Blue Elephant Royal Thai Cuisine']`
- Railway logs: `dest="Phuket" rows=13`, `dest="Bangkok" rows=25`
