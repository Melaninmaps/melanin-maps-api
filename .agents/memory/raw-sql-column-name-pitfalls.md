---
name: Raw SQL column name pitfalls
description: Known cases where raw pool.query() SQL used wrong column names vs. actual DB schema — caught by live simulation.
---

## The rule
Any time a raw `pool.query()` string is written (instead of Drizzle ORM), cross-check column names against `lib/db/src/schema/` immediately. Drizzle camelCase field names map to snake_case in the DB — the schema file shows both.

**Why:** Two bugs shipped to production staging that only surfaced during live API simulation:
1. `community_posts` table: raw SQL used `user_id` — actual column is `author_id`
2. `family_add_on_seats` table: raw SQL used `seats` and `user_id` — actual columns are `seat_count` and `owner_id`

Both caused 500 errors on high-value routes (`POST /community/posts`, `GET /membership/plan`).

## How to apply
- Before writing any `pool.query(sql, params)`: open the relevant schema file in `lib/db/src/schema/` and verify every column name in the SQL string against the actual `pgTable` definition.
- Prefer Drizzle ORM queries (which enforce column names at compile time) over raw SQL wherever possible.
- After writing a new raw SQL route, test it with curl before shipping — column errors are silent until runtime.

## Known correct column names (verified July 2026)
- `community_posts.author_id` (NOT user_id)
- `family_add_on_seats.seat_count` (NOT seats), `family_add_on_seats.owner_id` (NOT user_id)
