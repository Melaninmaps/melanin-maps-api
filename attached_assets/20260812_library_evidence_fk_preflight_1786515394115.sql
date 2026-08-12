-- Mapping With Melanin — Library evidence seeding foreign-key preflight
--
-- READ-ONLY. Run this in the same production database used by Railway's API service
-- BEFORE the full evidence seed. It reveals the actual deployed Library schema,
-- foreign keys, required columns, and source-link model. It does not insert,
-- update, delete, or alter any row.

-- 1. Confirm the active Library tables, not assumed table names.
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'knowledge_topics',
    'knowledge_sources',
    'knowledge_topic_sources',
    'topic_relationships',
    'knowledge_articles'
  )
ORDER BY c.table_name, c.ordinal_position;

-- 2. Return all real foreign-key constraints affecting Library tables.
-- This is authoritative for production; do not infer constraints from TypeScript.
SELECT
  con.conname AS constraint_name,
  conrelid::regclass AS child_table,
  pg_get_constraintdef(con.oid) AS constraint_definition,
  confrelid::regclass AS parent_table,
  con.confdeltype AS on_delete_code,
  con.confupdtype AS on_update_code
FROM pg_constraint AS con
WHERE con.contype = 'f'
  AND (
    conrelid::regclass::text IN (
      'public.knowledge_topics',
      'public.knowledge_sources',
      'public.knowledge_topic_sources',
      'public.topic_relationships',
      'public.knowledge_articles'
    )
    OR confrelid::regclass::text IN (
      'public.knowledge_topics',
      'public.knowledge_sources',
      'public.knowledge_topic_sources',
      'public.topic_relationships',
      'public.knowledge_articles'
    )
  )
ORDER BY child_table::text, constraint_name;

-- 3. Confirm the actual source-link model used in production.
-- Expected active API model: knowledge_sources.topic_id directly references
-- knowledge_topics.id. If a junction table exists, report it but do not use it
-- unless the active production graph route is confirmed to read it.
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'knowledge_sources'
      AND column_name = 'topic_id'
  ) AS direct_source_topic_column_exists,
  to_regclass('public.knowledge_topic_sources') IS NOT NULL
    AS junction_table_exists;

-- 4. Identify source rows that would violate a direct-topic relationship.
-- This must return zero rows before any bulk seed is declared healthy.
SELECT
  ks.id AS source_id,
  ks.topic_id,
  ks.source_name,
  ks.source_url
FROM knowledge_sources AS ks
LEFT JOIN knowledge_topics AS kt
  ON kt.id = ks.topic_id
WHERE ks.topic_id IS NOT NULL
  AND kt.id IS NULL
ORDER BY ks.created_at DESC NULLS LAST;

-- 5. Verify required source fields exist before writing.
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'knowledge_sources'
  AND column_name IN (
    'id', 'topic_id', 'authority_tier', 'source_name', 'source_url',
    'claim', 'status', 'confidence', 'is_primary', 'last_verified',
    'retrieved_at', 'created_at', 'contributor_id'
  )
ORDER BY column_name;

-- 6. Detect duplicates under the active direct-link source model.
-- Normalize URLs only in the check. The seed job should store canonical URLs and
-- enforce its own idempotent lookup by topic_id + normalized source URL.
SELECT
  ks.topic_id,
  lower(regexp_replace(trim(trailing '/' FROM ks.source_url), '^https?://(www\.)?', ''))
    AS normalized_source_url,
  COUNT(*) AS duplicate_count,
  array_agg(ks.id ORDER BY ks.created_at) AS source_ids
FROM knowledge_sources AS ks
WHERE ks.source_url IS NOT NULL
GROUP BY
  ks.topic_id,
  lower(regexp_replace(trim(trailing '/' FROM ks.source_url), '^https?://(www\.)?', ''))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, ks.topic_id;

-- 7. Baseline: published topics currently lacking active direct source evidence.
SELECT
  kt.id,
  kt.topic_name,
  kt.category,
  COUNT(ks.id) FILTER (WHERE ks.status = 'active') AS active_direct_source_count
FROM knowledge_topics AS kt
LEFT JOIN knowledge_sources AS ks
  ON ks.topic_id = kt.id
WHERE kt.status = 'published'
GROUP BY kt.id, kt.topic_name, kt.category
HAVING COUNT(ks.id) FILTER (WHERE ks.status = 'active') = 0
ORDER BY kt.category, kt.topic_name;

-- Safe write order after this preflight passes:
-- A. Read and cache the set of existing published knowledge_topics IDs.
-- B. For each researched canonical source, verify topic_id exists in that set.
-- C. Upsert knowledge_sources using a deterministic duplicate check scoped to
--    (topic_id, normalized canonical URL); source rows are the actual direct mapping.
-- D. Never insert a source with a missing/non-published topic_id.
-- E. Seed topic_relationships only if a distinct hierarchy task requires it;
--    evidence seeding must not alter the taxonomy.
-- F. Seed knowledge_articles only in a separate reviewed content project;
--    sources alone satisfy the verified-evidence layer.
