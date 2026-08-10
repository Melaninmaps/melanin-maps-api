---
name: Library Taxonomy Architecture
description: Collection→Book→Subtopic hierarchy, seeding pattern, API filter params, Browse UI wiring, and content gap forensic audit (Aug 10 2026)
---

## Architecture

Three-tier knowledge hierarchy in `knowledge_topics`:
- **Collection** (`topicType='collection'`) — 11 top-level shelves (Places, Culture & Community, History, Health, Faith & Spirituality, Careers & Professional, Travel, Community, Education, Business, Divine Nine)
- **Book** (`topicType='book'`) — canonical topics within a collection (34 seeded: 9 Divine Nine, 14 Health, 11 Faith)
- **General/geography** (`topicType='general'|'geography'`) — existing 209 general topics + 69 geography nodes

Hierarchy stored in `topic_relationships` (existing table):
- `parent_topic_id` = Collection id, `child_topic_id` = Book id, `relationship_type = 'contains'`

## API Filter Params (GET /knowledge/topics)

- `?topicType=collection` — returns only Collections (for Browse grid)
- `?excludeType=collection` — returns all non-Collection topics (for topic list)
- Both params added Aug 10 2026 to routes/knowledge.ts

## Browse UI Pattern (library.tsx)

1. Fetch Collections: `GET /knowledge/topics?topicType=collection`
2. Fetch Topics: `GET /knowledge/topics?excludeType=collection`
3. Browse tab shows Collection grid (11 tiles, 2-col) when no collection selected
4. Clicking Collection → `setSelectedCollection(c)` → filters topics by `t.category === c.category`
5. Back button clears `selectedCollection`
6. Search always universal — clears selectedCollection when search string is typed
7. Fallback: if no Collections returned (API empty), shows existing flat topic list

## Category Mapping (Collection.category → topics with same category)

- Places → `geography` (69 geo nodes, linked via topic_relationships)
- Culture & Community → `diaspora`
- History → `history`
- Health → `health` (14 book nodes)
- Faith & Spirituality → `faith` (11 book nodes)
- Careers & Professional → `employment`
- Travel → `travel`
- Community → `community`
- Education → `education`
- Business → `business`
- Divine Nine → `culture` (9 book nodes)

## Startup Migration

`ensureLibraryCollections` in startup-migrations.ts (at end of file), called from seed guards at line 1684. Fully idempotent via ON CONFLICT DO NOTHING. Seeded Aug 10 2026.

**Why:** Founder requires Collection→Book→Subtopic hierarchy; flat 160-topic list doesn't communicate structure to members.

**How to apply:** To add new Collections or Books, add rows via `ensureLibraryCollections` using the same pattern. Do NOT add Collection nodes to the flat KNOWLEDGE_LIBRARY_SEED array — that's for general topics only.

---

## CONTENT GAP — FORENSIC AUDIT (Aug 10 2026)

**DATA SAFETY BASELINE (do not touch):**
- knowledge_topics: 254 (11 collections, 34 books, 209 general)
- topic_relationships: 112 (111 'contains', 1 'related_to')
- knowledge_sources: 2 rows (both on Philadelphia Black History UUID topic)
- knowledge_articles: 19 rows (separate reading-feed system)
- user_topic_follows: 0

**ROOT CAUSE A — No knowledge_sources seeded for any of the 34 Books**
The `ensureLibraryCollections()` migration seeds Book nodes, Collection nodes, and `contains` relationships, but seeds ZERO rows into `knowledge_sources`. Every Book shows "We're building this Book" because `hasSources = (data?.sources.length ?? 0) > 0` is always false. The Book panel in `library.tsx` reads `data.sources` from `GET /api/knowledge/graph/:topicId?surface=library`, which calls `fetchSources(topicId)` in `routes/knowledge-graph.ts`.

**ROOT CAUSE C+E — Graph endpoint returns 404 for UUID-ID general topics**
Books use short IDs (e.g. `book_d9_aka`, `book_h_diabetes`) — graph endpoint works for these. General topics use UUIDs — graph endpoint returns `{error: "Knowledge node not found", topicId}` for them. The `fetchNode()` function at line 92 queries `knowledge_topics WHERE id = $1` which should work for both formats. Likely cause: `node_type` column is NULL on general topics (added by a later migration), and some downstream filter excludes NULL-node_type rows. One targeted SQL check needed to confirm before fixing.

**SPECIFICALLY BROKEN — Philadelphia Black History:**
Has 2 real knowledge_sources (Smithsonian NMAAHC + W.E.B. Du Bois Institute) but its UUID ID makes the graph endpoint 404. The sources exist in the DB but are completely unreachable via the UI. Fix: backfill `node_type` on general topics so `fetchNode()` returns them.

**TWO CONTENT SYSTEMS — NEVER CONFLATE THEM:**
- `knowledge_sources` → feeds the Book panel (via graph endpoint) — currently 2 rows, all on a broken UUID topic
- `knowledge_articles` → feeds the Library reading feed (GET /knowledge/feed) — currently 19 rows, 9 topics have articles
- These are independent systems. The Book panel ONLY reads knowledge_sources. The reading feed ONLY reads knowledge_articles. They do NOT share data.
- KinfolkAI Layer 3 uses a THIRD path (graph node relationships) — also independent.

**PRESERVED — all 209 original general topics intact:**
Nothing was deleted when Collections/Books were seeded. HBCU Admissions, FAFSA, First-Gen, Philadelphia Black History, all country/travel topics — all in DB.

**MISSING from Library spec but not yet seeded:**
- Books for 8 Collections: Education, Business, Career, History, Community, Culture, Places, Travel — only general topics serve as surrogates
- 45 of 53 African countries missing from country topics (20 exist)

**PRIORITY FIX ORDER:**
1. Backfill `node_type` on general topics (UUID endpoint fix)
2. Philadelphia Black History — 2 existing sources will surface once UUID fix is in
3. HBCU Admissions & Scholarships, Alpha Kappa Alpha, Diabetes, AME, Maternal Health, Mental Health (seed knowledge_sources for each)
