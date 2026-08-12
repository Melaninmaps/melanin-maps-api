---
name: Fuzzy fallback scope — PERMANENT rule
description: businesses.ts fuzzy SQL fallback must carry all caller-supplied restrictive filters
---

# Fuzzy Fallback Scope — Permanent Rule

## The Bug

When a city-filtered business search returned zero Drizzle results, the fallback path in `businesses.ts` ran raw trigram SQL without the city/state/country/listing_status filters. This allowed a `city=Phuket&search=hair` request to return `Hair by Kamaria (Washington, DC)` — a different city entirely.

**Root cause:** The fuzzy SQL blocks hard-coded `WHERE b.status = 'active'` only, discarding all caller-supplied filters.

## The Fix

Both fuzzy SQL branches (`tokens.length > 1` multi-token, and full-phrase similarity) now build a scope array:

```
fuzzyScope: ["b.status = 'active'"]
```
Then conditionally add:
- `listing_status IN ('live_unclaimed', 'live_claimed')` (if not isTester)
- `LOWER(b.city) LIKE LOWER($N)` (if city param present)
- `LOWER(b.state) LIKE LOWER($N)` (if state param present)
- `LOWER(b.country) LIKE LOWER($N)` (if country param present)

All conditions are parameterized — no user input in SQL text.

## How to apply

Any future SQL fallback path that fires when primary results are empty MUST carry the same scope as the primary query. "Zero results in city X" must not cause "return results from any city." The contract is: a supplied city filter is NEVER relaxed, even in fuzzy mode.

**Why:** MWM is a safety-first platform. Returning businesses from the wrong city is not just a UX problem — it can send someone to the wrong place physically.
