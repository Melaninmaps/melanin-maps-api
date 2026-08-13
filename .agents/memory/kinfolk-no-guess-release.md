---
name: Kinfolk No-Guess Cultural Context v1 — Release Notes
description: What was built, what bugs were hit, and the permanent rules for the resolver layer.
---

## What shipped (Aug 13 2026)

DB-backed entity resolver with 3 deterministic output states (resolved / needs_clarification / unconfirmed).
The LLM never decides the resolution state.

## Critical bug found and fixed BEFORE Railway deploy

**Root cause**: `queryEntitiesByAlias` SQL used `s.source_status = 'active'` but
the column in `kinfolk_source_records` is `status` (not `source_status`).
The query threw a PostgreSQL column-not-found error, which was silently swallowed by
`catch { continue; }`. Result: all candidates always empty → always `needs_clarification`.

**Fix**: `s.source_status` → `s.status` in every FILTER clause.

**Lesson**: When a catch{continue} silently swallows DB errors in a resolver loop,
the visible symptom is always `needs_clarification` even for unambiguous queries.
Test first against the DB, not just TypeScript types.

## Other fixes in same pass

- `getQueryClass` education_nearby regex: `college` → `colleges?` (plural match)
  "What colleges are near me?" was falling to `local_business` via "near me"
- `context-resolver.ts` needs_clarification branch: `suppressBusinessRecommendations`
  now `false` when no candidates found (e.g. "Tell me about HBCUs" should show
  general results, not suppress them)
- Vitest global `testTimeout: 20000` for DB-backed tests
- NG-18 parallel calls: 30 → 12 (pool-safe)
- afterAll: pool.end() with 3s race timeout

## Column name for source status

`kinfolk_source_records` column is `status` (NOT `source_status`).
Always use `s.status = 'active'` in queries joining this table.

## NG-01–NG-18 regression suite

File: `artifacts/api-server/src/kinfolk/__tests__/cultural-context-release-gate.test.ts`
Run: `cd artifacts/api-server && npx vitest run src/kinfolk/__tests__/cultural-context-release-gate.test.ts`
Must all pass before any release. 27/27 passed Aug 13 2026.

## Why `suppressBusinessRecommendations` is conditional on candidates

In context-resolver.ts, `needs_clarification` branch: only suppress business recs
when `entityResult.candidates.length > 0` (i.e. we have specific candidates to
disambiguate between). If 0 candidates (no entity found at all), don't suppress —
the LLM should still show general relevant results.

## Seeded data locations

Sources: 9 rows in `kinfolk_source_records`
Entities: 8 rows in `kinfolk_entities`
Aliases: ~28 rows in `kinfolk_entity_aliases`
Source links: ~10 rows in `kinfolk_entity_source_links`
All seeded by `ensureKinfolkCulturalContextV1` which runs every boot (idempotent).

**WARNING**: `ensureKinfolkCulturalContextV1` uses `ON CONFLICT (id) DO NOTHING`
for entity inserts. Since `id` is auto-UUID, this never conflicts. On second boot,
entities are RE-INSERTED with new UUIDs → DUPLICATES. The lookup-by-canonical-name
fallback covers the case where the entity already exists, but the ON CONFLICT clause
itself provides no dedup protection. To properly fix: add UNIQUE(canonical_name) to
kinfolk_entities and use ON CONFLICT(canonical_name) DO UPDATE.
