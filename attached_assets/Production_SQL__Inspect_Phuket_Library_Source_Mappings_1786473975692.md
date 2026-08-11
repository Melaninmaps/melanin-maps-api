# Production SQL: Inspect Phuket Library Source Mappings

Run these queries from the **Railway API service’s production database connection**, not from a local, preview, or separate migration database. They are read-only and do not expose user data, tokens, or credentials.

## Step 1 — Confirm the actual Library table names and columns

Run this first. It is safe even if the expected table names differ.

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%knowledge%'
    OR table_name ILIKE '%source%'
    OR table_name ILIKE '%topic%'
    OR table_name ILIKE '%evidence%'
  )
ORDER BY table_name, ordinal_position;
```

> Use the result to confirm the exact production names for the topic/node table, the source table, and the topic-to-source mapping table. The working query below assumes `knowledge_nodes`, `knowledge_topic_sources`, and `knowledge_sources`. If Step 1 shows a different name, replace only that table name—do not change unrelated application tables.

## Step 2 — Inspect every Phuket topic and its direct source mappings

```sql
WITH phuket_topics AS (
  SELECT
    n.id,
    n.topic_name,
    n.node_type,
    n.category,
    n.status,
    n.geography_ref
  FROM knowledge_nodes AS n
  WHERE n.topic_name ILIKE '%phuket%'
),
source_rows AS (
  SELECT
    pt.id AS topic_id,
    pt.topic_name,
    pt.node_type,
    pt.category,
    pt.status AS topic_status,
    pt.geography_ref,
    kts.id AS mapping_id,
    kts.scope AS mapping_scope,
    kts.status AS mapping_status,
    kts.confidence,
    kts.is_primary,
    s.id AS source_id,
    s.source_name,
    s.source_url,
    s.authority_tier,
    s.status AS source_status,
    s.last_verified
  FROM phuket_topics AS pt
  LEFT JOIN knowledge_topic_sources AS kts
    ON kts.topic_id = pt.id
  LEFT JOIN knowledge_sources AS s
    ON s.id = kts.source_id
)
SELECT
  topic_id,
  topic_name,
  node_type,
  category,
  topic_status,
  geography_ref,
  COUNT(DISTINCT source_id) FILTER (WHERE source_status = 'active') AS active_source_count,
  COUNT(DISTINCT source_id) FILTER (WHERE mapping_scope = 'verified_topic') AS direct_verified_source_count,
  COUNT(DISTINCT source_id) FILTER (WHERE mapping_scope = 'destination_context') AS destination_context_source_count,
  ARRAY_AGG(DISTINCT source_name) FILTER (WHERE source_id IS NOT NULL) AS source_names,
  ARRAY_AGG(DISTINCT source_url) FILTER (WHERE source_url IS NOT NULL) AS source_urls
FROM source_rows
GROUP BY
  topic_id, topic_name, node_type, category, topic_status, geography_ref
ORDER BY active_source_count ASC, topic_name;
```

**Expected current finding:** child nodes such as `Kata Beach & Kata Noi, Phuket` should appear with `active_source_count = 0`, while the parent `Phuket` node should show source mappings that require deduplication.

## Step 3 — Find duplicate source relationships for the Phuket parent

```sql
SELECT
  n.id AS topic_id,
  n.topic_name,
  s.id AS source_id,
  s.source_name,
  s.source_url,
  COUNT(*) AS duplicate_mapping_count,
  ARRAY_AGG(kts.id ORDER BY kts.created_at) AS mapping_ids,
  MIN(kts.created_at) AS first_mapped_at,
  MAX(kts.created_at) AS last_mapped_at
FROM knowledge_nodes AS n
JOIN knowledge_topic_sources AS kts
  ON kts.topic_id = n.id
JOIN knowledge_sources AS s
  ON s.id = kts.source_id
WHERE n.id = '281bf2d8-e386-4a50-b726-d25db398b279'
GROUP BY n.id, n.topic_name, s.id, s.source_name, s.source_url
HAVING COUNT(*) > 1
ORDER BY duplicate_mapping_count DESC, source_name;
```

**Expected current finding:** the same Tourism Authority of Thailand and Lonely Planet sources may each have three mappings for the `Phuket` parent. Confirm the actual mapping IDs before removing or archiving anything.

## Step 4 — Identify published Travel and regional topics with no active direct source

```sql
SELECT
  n.id,
  n.topic_name,
  n.node_type,
  n.category,
  n.status,
  n.geography_ref,
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.status = 'active'
      AND kts.status = 'active'
      AND kts.scope = 'verified_topic'
  ) AS direct_verified_source_count
FROM knowledge_nodes AS n
LEFT JOIN knowledge_topic_sources AS kts
  ON kts.topic_id = n.id
LEFT JOIN knowledge_sources AS s
  ON s.id = kts.source_id
WHERE n.status = 'published'
  AND (
    n.category IN ('travel', 'geography', 'diaspora', 'history', 'culture')
    OR n.geography_ref IS NOT NULL
    OR n.node_type IN ('geography', 'place', 'country', 'destination')
  )
GROUP BY n.id, n.topic_name, n.node_type, n.category, n.status, n.geography_ref
HAVING COUNT(DISTINCT s.id) FILTER (
  WHERE s.status = 'active'
    AND kts.status = 'active'
    AND kts.scope = 'verified_topic'
) = 0
ORDER BY n.category, n.topic_name;
```

## If the current schema uses a direct `topic_id` on `knowledge_sources`

Some implementations do not have a mapping table. If Step 1 reveals that `knowledge_sources` contains `topic_id`, use this alternate inspection query:

```sql
SELECT
  n.id,
  n.topic_name,
  n.node_type,
  n.category,
  n.status,
  n.geography_ref,
  COUNT(s.id) FILTER (WHERE s.status = 'active') AS active_source_count,
  ARRAY_AGG(DISTINCT s.source_name) FILTER (WHERE s.id IS NOT NULL) AS source_names,
  ARRAY_AGG(DISTINCT s.source_url) FILTER (WHERE s.id IS NOT NULL) AS source_urls
FROM knowledge_nodes AS n
LEFT JOIN knowledge_sources AS s
  ON s.topic_id = n.id
WHERE n.topic_name ILIKE '%phuket%'
GROUP BY n.id, n.topic_name, n.node_type, n.category, n.status, n.geography_ref
ORDER BY active_source_count ASC, n.topic_name;
```

## Required evidence back to the founder

Replit should return the redacted result sets from Steps 2–4, plus the exact production database name/connection fingerprint used by the Railway API service. They should not expose a full connection string, password, or user data.
