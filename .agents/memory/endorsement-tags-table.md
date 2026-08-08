---
name: Endorsement tags table — no DB table, labels from tag_key
description: The endorsement tag system stores taps in business_endorsement_taps but there is NO endorsement_tags table. Labels must come from the_real_tags JOIN or INITCAP(REPLACE(tag_key,'_',' ')).
---

## Rule

`endorsement_tags` is NOT a database table. Do not LEFT JOIN it in SQL queries.

## What exists

- `business_endorsement_taps` — stores (business_id, user_id, tag_key) rows; user_id FK to users.id; id is a serial integer (auto-generated, do NOT insert it)
- `the_real_tags` — seeded DB table with (tag_key, label, category, type, ...) for THE REAL professional trust tags
- Endorsement tag label constants — TypeScript constants only, never a DB table

## Correct pattern for endorsements query

```sql
SELECT
  t.tag_key,
  COALESCE(
    rt.label,
    INITCAP(REPLACE(t.tag_key, '_', ' '))
  ) AS label,
  COUNT(*)::int AS count
FROM business_endorsement_taps t
LEFT JOIN the_real_tags rt ON rt.tag_key = t.tag_key
WHERE t.business_id = $1
GROUP BY t.tag_key, rt.label
HAVING COUNT(*) >= $2
ORDER BY count DESC
LIMIT 20
```

## Demo users for tap seeding

12 demo users exist: UUIDs `00000000-0000-0000-0000-000000000001` through `...000012`.
Use these when seeding demo endorsement taps. All have `listing_status = 'live_unclaimed'`.

**Why:** The original query joined `endorsement_tags` which doesn't exist → 500 error on every endorsements request.
