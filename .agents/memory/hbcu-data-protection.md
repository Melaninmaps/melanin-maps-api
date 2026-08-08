---
name: HBCU Data Protection Rule
description: Permanent rule — HBCU count floor is 107. No deploy may reduce this. Audit process and how to reseed gaps.
---

# HBCU Data Protection — Permanent Rule

## The Non-Negotiable Rule
**The platform must always have 107 HBCU entries in cultural_sites.** This is the complete U.S. Dept. of Education recognized list. Any deploy that reduces this count below 107 is a data regression — it must be caught and fixed immediately.

**Why:** The founder explicitly called this out as a hard requirement. These institutions represent 180+ years of Black education under oppression. Losing them from the map is unacceptable and disrespectful to the community the platform serves.

## Current State (confirmed Aug 8 2026)
- Seed file: `artifacts/api-server/src/data/hbcu-complete-seed.ts` — 107 HBCUs
- Production DB before fix: 83 unique HBCU sites (74 labeled "HBCU" + 27 "hbcu" — case inconsistency, overlapping)
- 20 confirmed missing before fix: Fisk, Howard, Johnson C. Smith, LeMoyne-Owen, Miles, Morehouse College, Morehouse School of Medicine, Morgan State, Norfolk State, NC Central, Paul Quinn, Savannah State, Shaw, Southern U and A&M, Spelman, Texas Southern, Tougaloo, Tuskegee, Virginia Union, Xavier
- **Self-healing fix deployed Aug 8 2026**: `runStartupMigrations()` in startup-migrations.ts now calls `ensureAllHBCUs()` on every boot — inserts any missing schools automatically, dedup-safe by name+state

## Self-Healing Architecture (PERMANENT)
`artifacts/api-server/src/lib/startup-migrations.ts` — `ensureAllHBCUs()` function runs on every server boot:
- Loops all 107 entries in HBCU_COMPLETE_SEED
- Checks `WHERE LOWER(name)=LOWER($1) AND LOWER(state)=LOWER($2)` — skips existing
- Inserts missing entries with category="HBCU", heritage_category="HBCU", pin_type="hbcu"
- Logs: "HBCU integrity guard: X inserted, Y already present. Total in seed: 107"
- **Never remove this function** — it's the permanent protection layer

## How to Audit After Any Deploy
```sql
SELECT COUNT(*) FROM cultural_sites 
WHERE UPPER(category) = 'HBCU' 
   OR UPPER(pin_type) = 'HBCU' 
   OR UPPER(heritage_category) = 'HBCU';
```
Expected result: **≥ 107**. If below, check Railway logs for "HBCU integrity guard" — if that line shows 0 inserted AND count is below 107, there is a deletion bug that must be found immediately.

## Manual Reseed (if needed — e.g., table truncated)
Admin panel → POST `/admin/seed-hbcu-complete` — dedup-safe, can run multiple times

## The 107 Schools (Complete List — Source of Truth)
Alabama A&M, Alabama State, Albany State, Alcorn State, Allen, American Baptist College,
Benedict, Bennett, Bethune-Cookman, Bishop State CC, Bluefield State, Bowie State,
Central State, Cheyney, Claflin, Clark Atlanta, Coahoma CC, Coppin State,
Delaware State, Denmark Technical, Dillard, Edward Waters, Elizabeth City State,
Fayetteville State, Fisk, Florida A&M, Florida Memorial, Fort Valley State,
Gadsden State CC, Grambling State, Hampton, Harris-Stowe State,
H. Councill Trenholm State Technical, Hinds CC–Utica, Howard, Huston-Tillotson,
ITC (Interdenominational Theological Center), Jackson State, Jarvis Christian,
J.F. Drake State, Johnson C. Smith, Kentucky State, Lane, Langston,
Lawson State CC, LeMoyne-Owen, Lewis College of Business,
Lincoln U of Missouri, Lincoln U of Pennsylvania, Livingstone,
Medgar Evers (CUNY), Meharry Medical, Miles, Mississippi Valley State,
Morehouse College, Morehouse School of Medicine, Morgan State,
Morris Brown, Morris College, Norfolk State, NC A&T, NC Central,
Oakwood, Paine, Paul Quinn, Philander Smith, Prairie View A&M,
Rust, Saint Augustine's, Savannah State, Selma, Shaw, Shelton State CC,
Simmons College of Kentucky, South Carolina State, Southern U and A&M College,
Southern U at New Orleans, Southern U at Shreveport, Southwestern Christian,
Spelman, Stillman, Talladega, Tennessee State, Texas College, Texas Southern,
Tougaloo, Tuskegee, U of Arkansas at Pine Bluff, U of Maryland Eastern Shore,
U of the District of Columbia, U of the Virgin Islands,
Virginia State, Virginia Union, Virginia U of Lynchburg,
Voorhees, West Virginia State, Wilberforce, Wiley, Winston-Salem State,
Xavier University of Louisiana
