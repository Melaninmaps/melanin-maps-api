---
name: Knowledge Graph Layer 1 — schema and seeding lessons
description: Columns, tables, constraints, and idempotency lessons from Layer 1 implementation.
---

## Layer 1 Schema (live in dev DB Aug 9 2026)

### knowledge_topics — actual column names
- Primary key: `id` (VARCHAR, gen_random_uuid())
- Topic name: `topic_name` (VARCHAR 200, NOT NULL) — NOT `title`, NOT `name`
- NO `subcategory`, `tags`, or `is_published` columns exist
- Layer 1 additions: `node_type` TEXT DEFAULT 'topic', `geography_ref` TEXT, `status` TEXT DEFAULT 'published'

### New tables added
- **topic_relationships** — parent/child topic graph; UNIQUE(parent_topic_id, child_topic_id, relationship_type)
- **knowledge_sources** — 4-tier provenance; contributor_id is VARCHAR (users.id is VARCHAR, NOT UUID)

### library_entity_connections extension
- Extended entity_type via DO block (find+drop auto-named constraint, add named `lec_entity_type_check`)
- Valid types now: business, cultural_site, event, community_org, community_post, ambassador_content, knowledge_article

## Idempotency rule — PERMANENT
knowledge_topics has NO unique constraint on topic_name. `ON CONFLICT DO NOTHING` alone does NOT prevent duplicates across boots. Always use WHERE NOT EXISTS pattern for topic seeding.

## Philadelphia proof (confirmed live)
- Philadelphia geography node → 7 subtopics via 'contains' relationships
- Philadelphia Black History → Philadelphia Faith via 'related_to' (weight 0.9)
- Mother Bethel AME (cultural_sites) connected to 3 topics — NO duplicate entity rows
- 4 knowledge_sources on Philadelphia Black History: Smithsonian (authoritative), W.E.B. Du Bois 1899 (professional), MWM member (community), MWM Ambassador (ambassador)

## Big Cousin behavioral contract
All 4 tiers remain distinguishable. Kinfolk MUST NOT silently convert community/ambassador opinion into verified fact. Architectural requirement — applies to every retrieval in Layer 3.
