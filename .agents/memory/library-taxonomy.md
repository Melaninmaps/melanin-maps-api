---
name: Library Taxonomy Architecture
description: Collection→Book→Subtopic hierarchy, seeding pattern, API filter params, and Browse UI wiring
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
