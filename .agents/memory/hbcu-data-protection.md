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
- Production DB: 101 HBCUs (74 labeled "HBCU" + 27 labeled "hbcu" — case inconsistency)
- Gap: ~6 missing entries (exact list determined by audit)
- Admin endpoint to reseed (dedup-safe): `POST /admin/seed-hbcu-complete`

## Known Data Issue
- Category stored as both "HBCU" (uppercase) and "hbcu" (lowercase) — causes API filter `?category=hbcu` to miss the uppercase ones
- Fix: Normalize all HBCU category values to uppercase "HBCU" in a one-time migration

## How to Audit (run after any deploy that touches cultural_sites)
```sql
SELECT COUNT(*) FROM cultural_sites 
WHERE UPPER(category) = 'HBCU' 
   OR UPPER(pin_type) = 'HBCU' 
   OR UPPER(heritage_category) = 'HBCU';
```
Expected result: **≥ 107**

## How to Reseed Missing HBCUs
1. Log in to the admin panel as admin
2. Go to Admin → Cultural Sites → Seed HBCUs (runs `POST /admin/seed-hbcu-complete`)
3. The endpoint is dedup-safe — it checks name+state before inserting, so running it twice is safe
4. Re-run the audit query to confirm count = 107

## Pre-Deploy Gate
Before every build that modifies cultural_sites table, routes, or seed data:
1. Run the audit query above on production
2. Confirm count ≥ 107
3. If below 107, run the reseed endpoint BEFORE pushing new code

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
