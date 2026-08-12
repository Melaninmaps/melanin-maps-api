-- Kinfolk → Library direct-topic navigation preflight
--
-- IMPORTANT
-- This feature does NOT need a new navigation table, topic table, foreign key,
-- or source-mapping table. Kinfolk returns a canonical existing knowledge_topics.id
-- in a structured chat response; the client routes to /library?topic=:id.
--
-- This script is intentionally a guarded no-schema-change migration. It proves
-- the production Library topic table is compatible before the application code
-- for deep linking is released. It inserts no rows and changes no user data.
--
-- Run against the Railway API service's production database only after taking a
-- normal backup/snapshot and confirming the active deployment uses knowledge_topics.

BEGIN;

DO $$
DECLARE
  topic_table regclass;
  id_column_exists boolean;
  status_column_exists boolean;
BEGIN
  topic_table := to_regclass('public.knowledge_topics');

  IF topic_table IS NULL THEN
    RAISE EXCEPTION
      'Kinfolk→Library navigation blocked: public.knowledge_topics does not exist in this database. Stop; do not create a parallel table.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'knowledge_topics'
      AND column_name = 'id'
  ) INTO id_column_exists;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'knowledge_topics'
      AND column_name = 'status'
  ) INTO status_column_exists;

  IF NOT id_column_exists THEN
    RAISE EXCEPTION
      'Kinfolk→Library navigation blocked: knowledge_topics.id is missing.';
  END IF;

  IF NOT status_column_exists THEN
    RAISE EXCEPTION
      'Kinfolk→Library navigation blocked: knowledge_topics.status is missing. The route must validate published visibility before deep linking.';
  END IF;
END
$$;

-- The canonical ID used by the first integration test must exist and be published.
-- This assertion intentionally does not create or alter the topic.
DO $$
DECLARE
  is_published boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM knowledge_topics
    WHERE id = 'fbfbc161-5121-4eca-a0a4-c35731b010f6'
      AND status = 'published'
  ) INTO is_published;

  IF NOT is_published THEN
    RAISE EXCEPTION
      'Kinfolk→Library navigation blocked: African Diaspora History is absent or not published.';
  END IF;
END
$$;

COMMIT;

-- Application implementation requirements (not SQL):
-- 1. Server emits navigationActions[] only after resolving a published canonical topic ID.
-- 2. Client routes to /library?topic=:id&focus=overview|evidence|related&from=kinfolk.
-- 3. Library validates the ID against knowledge_topics and opens the existing panel.
-- 4. No raw chat query, sensitive context, or user-identifying data belongs in the URL.
