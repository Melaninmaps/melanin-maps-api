---
name: Knowledge Topics Schema — keywords type trap
description: keywords column in knowledge_topics is text[] not jsonb — bulk INSERT silently fails if you cast it as ::jsonb
---

# Knowledge Topics Schema — keywords type trap

## The rule
`knowledge_topics.keywords` is declared as `text("keywords").array()` (a PostgreSQL `text[]` column).
`knowledge_topics.trusted_sources` is declared as `jsonb("trusted_sources")` (a PostgreSQL `jsonb` column).

When doing a parameterized bulk INSERT with node-postgres:
- **keywords**: pass the JS array directly as a parameter with NO cast — `$N` (pg infers `text[]`)
- **trusted_sources**: pass `JSON.stringify(value)` with `$N::jsonb` cast

**Why:** If you pass `JSON.stringify(keywords)::jsonb` for a `text[]` column, Postgres silently rejects the row (type mismatch) or the catch block swallows the error. The startup migration guard will log "0 inserted" and move on, leaving the Library empty.

## How to apply
Any time you write to `knowledge_topics.keywords` in raw SQL or parameterized queries, never use `::jsonb`. Use the array directly.

Schema location: `lib/db/src/schema/knowledge.ts` lines 63–100.
Seed data location: `artifacts/api-server/src/data/knowledge-library-seed.ts`.
Startup guard: `ensureKnowledgeTopics()` in `artifacts/api-server/src/lib/startup-migrations.ts`.
