---
name: Multicultural seed endpoint
description: POST /admin/seed-multicultural — idempotent insert of 12 demo businesses + 5 Philadelphia cultural pins. Must be called after each Railway deployment to populate production DB.
---

## Endpoint
`POST /api/admin/seed-multicultural`
Auth: `Authorization: Bearer CRON_SECRET`

## What it seeds
- 12 demo businesses in Philadelphia with diverse ownershipDesignations (Caribbean, Hispanic/Latino, Indigenous, MENA, Immigrant, Women-owned, LGBTQ+, Disability-owned, Veteran-owned, Multicultural, Black diaspora). Names prefixed with "[DEMO — Test Record]" in description.
- 5 Philadelphia cultural sites: Independence Hall (LGBTQ+), Penn Treaty Park (Native American), Norris Square Park (Hispanic/Latino), Pennsylvania Hall Site (Women's), 9th Street Italian Market (Immigrant).

## Idempotency
Checks `name + city` uniqueness before each insert. Safe to call multiple times.

**Why:** Production DB had 102/105 businesses as blackOwned=true, zero ownershipDesignations set. Removing demographic preference showed no visible change because data composition was overwhelmingly one identity. Seed fixes the data composition — no code filter change needed.

**How to apply:** After every Railway deployment that includes new admin.ts, call:
```
curl -X POST https://www.mappingwithmelanin.com/api/admin/seed-multicultural \
  -H "Authorization: Bearer $CRON_SECRET"
```
