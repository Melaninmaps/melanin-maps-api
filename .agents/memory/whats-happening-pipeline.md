---
name: What's Happening governed pipeline
description: Architecture and invariants for the What's Happening article submission + source validation pipeline (tasks #294, #295, aliases).
---

## Tables (all created in startup-migrations.ts)
- `happening_submissions` — member-submitted URLs; `is_load_test=true` for silent no-ops
- `happening_sources` — canonical URLs with `source_status` (held/active/deprecated); dedup by `UNIQUE(canonical_url)`
- `happening_topics` — curator-managed topics; only `context_ready`/`active` shown to members
- `happening_topic_sources` — topic ↔ source links
- `happening_topic_library_links` — topic ↔ Library (knowledge topics) links
- `safety_monitoring_cases` — one-per-topic via `UNIQUE(happening_topic_id)`; `requires_curator_review=true` is permanent
- `happening_delivery_preferences` / `safety_monitoring_preferences` — explicit opt-in only; defaults all false
- `compound_tag_tokens` — hashtag parsing for Kinfolk entity+place candidate recall
- `community_place_aliases` — city-scoped neighborhood aliases; `UNIQUE(normalized_alias, parent_city, parent_country_code)`

## Route architecture
- `POST /api/whats-happening/submit` — URL safety check (url-safety-validator.ts) FIRST before any DB write; rate limit 10/day in-process; source tier A/B/C/D classified by publisher hostname
- `GET /api/whats-happening/topics` — only `context_ready`/`active` with `sensitivity_tier IN ('standard','public_interest')`
- Admin routes use `isAdmin(req)` inline from `lib/adminAuth.ts` (no separate requireAdmin middleware exists)
- **No external notification, push, email, DM, or Circle event in this release** (spec §H.6)

## URL Safety Validator
File: `src/lib/url-safety-validator.ts`
- Rejects: non-HTTPS, localhost, 127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x (AWS metadata), metadata.google.internal
- Follows up to 3 redirects; checks each hop hostname
- Returns `{ safe: false, reason }` — callers never need try/catch
- `findExistingSource(canonicalUrl)` queries `happening_sources` for dedup

## Kinfolk semantic retrieval (task #295)
Files: `src/kinfolk/cultural-retrieval.ts`, `src/kinfolk/cultural-reranker.ts`
- `vectorCandidates()`: cosine similarity on `kinfolk_cultural_documents.embedding vector(1536)` via HNSW index; degrades gracefully to `[]` when `KINFOLK_EMBEDDING_DIMENSIONS` env var absent
- `fullTextCandidates()`: tsquery on `content_tsv` GIN index; tokens OR-joined
- `rerankCulturalCandidates()`: merges paths by entity_id (take highest score); preference boost max +80; explicit qualifier conflicts discard candidate entirely
- Called in `context-resolver.ts` `no_entity` fallback only — does not change responseMode
- HNSW index: `USING hnsw (embedding vector_cosine_ops) WHERE status='active' AND embedding_status='ready'`

## Kinfolk entity duplicate seeding fix
**Root cause**: `ON CONFLICT (id) DO NOTHING` on auto-UUID never fires → new row every boot.
**Fix**: Added `UNIQUE(canonical_name)` constraint migration + changed insert to `ON CONFLICT (canonical_name) DO UPDATE SET ...`. Entity seeding is now truly idempotent.

## Release gate tests
- `WH-01–10`: `src/whats-happening/__tests__/whats-happening-release-gate.test.ts`
- `SM-01–09`: `src/whats-happening/__tests__/safety-monitoring-release-gate.test.ts`
- `ALIAS-01–14`: `src/kinfolk/__tests__/alias-release-gate.test.ts`
- All 68 tests pass (including existing NG-01–27)

**Why:**
Spec §H, §I, §K.2, §K.3, aliases addendum. Core constraint: safety monitoring always requires curator action (`requires_curator_review=true`). No proactive delivery without explicit member opt-in. URL safety check must happen before any outbound fetch or DB write.
