#!/usr/bin/env bash
set -euo pipefail

APPLY=0
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=1
elif [[ $# -gt 0 ]]; then
  echo "Usage: $0 [--apply]" >&2
  exit 2
fi

: "${DATABASE_URL:?DATABASE_URL is required}"
ENTRY_ID="52c30b42-cd57-42dd-8c2a-d5d09a16512e"
ED_SOURCE_ID="5cd1642e-14ab-46bc-a460-afbe519a570f"
PEW_SOURCE_ID="48774803-7dce-4269-b80a-1adeb60b4f53"
NORMALIZED_QUESTION="what are historically black colleges and universities hbcus"

if [[ "${DEPLOYMENT_TIER:-}" != "local_staging" || "${DIRECTORY_IMPORT_LOCAL_STAGING:-}" != "1" ]]; then
  echo "HBCU_LIBRARY_BLOCKED: isolated staging environment markers are required" >&2
  exit 1
fi
DATABASE_NAME="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "SELECT current_database()")"
DATABASE_HOST="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "SELECT COALESCE(host(inet_server_addr()), '')")"
if [[ "$DATABASE_NAME" != "mwm_directory_staging" || "$DATABASE_HOST" != "127.0.0.1" ]]; then
  echo "HBCU_LIBRARY_BLOCKED: database identity is not approved isolated staging" >&2
  exit 1
fi
if [[ "$APPLY" == "1" && "${HBCU_LIBRARY_APPLY_ACK:-}" != "founder-approved-isolated-staging" ]]; then
  echo "HBCU_LIBRARY_BLOCKED: explicit isolated-staging apply acknowledgment is required" >&2
  exit 1
fi

TOPIC_COUNT="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "
  SELECT COUNT(*)
  FROM public.library_topics
  WHERE slug IN ('education-learning', 'places-our-history')
    AND active = true
")"
COLLISION_COUNT="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "
  SELECT COUNT(*)
  FROM public.library_entries
  WHERE id = '$ENTRY_ID'
    AND normalized_question <> '$NORMALIZED_QUESTION'
")"
NATURAL_KEY_COLLISION_COUNT="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "
  SELECT COUNT(*)
  FROM public.library_entries
  WHERE normalized_question = '$NORMALIZED_QUESTION'
    AND domain = 'education'
    AND id <> '$ENTRY_ID'
")"
SOURCE_COLLISION_COUNT="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "
  SELECT COUNT(*)
  FROM public.library_entry_sources
  WHERE id IN ('$ED_SOURCE_ID', '$PEW_SOURCE_ID')
    AND NOT (
      entry_id = '$ENTRY_ID'
      AND (
        (id = '$ED_SOURCE_ID' AND url = 'https://sites.ed.gov/whhbcu/one-hundred-and-five-historically-black-colleges-and-universities/')
        OR
        (id = '$PEW_SOURCE_ID' AND url = 'https://www.pewresearch.org/short-reads/2024/10/02/a-look-at-historically-black-colleges-and-universities-in-the-u-s/')
      )
    )
")"

if [[ "$TOPIC_COUNT" != "2" || "$COLLISION_COUNT" != "0" || "$NATURAL_KEY_COLLISION_COUNT" != "0" || "$SOURCE_COLLISION_COUNT" != "0" ]]; then
  echo "HBCU_LIBRARY_BLOCKED: required topics or entry identity precondition failed" >&2
  exit 1
fi

if [[ "$APPLY" != "1" ]]; then
  echo "HBCU_LIBRARY_DRY_RUN_OK topics=2 entry_collision=0 natural_key_collision=0 source_collision=0 apply_required=true"
  exit 0
fi

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  --set=entry_id="$ENTRY_ID" \
  --set=ed_source_id="$ED_SOURCE_ID" \
  --set=pew_source_id="$PEW_SOURCE_ID" <<'SQL'
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('mwm-hbcu-library-entry-v1', 0));

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.library_entries
    WHERE normalized_question = 'what are historically black colleges and universities hbcus'
      AND domain = 'education'
      AND id <> '52c30b42-cd57-42dd-8c2a-d5d09a16512e'
  ) THEN
    RAISE EXCEPTION 'HBCU_LIBRARY_BLOCKED: natural-key collision';
  END IF;
END
$guard$;

INSERT INTO public.library_entries (
  id, topic_id, question, normalized_question, title, summary, body, domain,
  community_lens, location_label, disclaimer, source_count, created_at, refreshed_at,
  publication_status, related_questions, provider_name
)
SELECT
  :'entry_id', topic.id,
  'What are Historically Black Colleges and Universities (HBCUs)?',
  'what are historically black colleges and universities hbcus',
  'What Are Historically Black Colleges and Universities (HBCUs)?',
  'Historically Black Colleges and Universities are accredited U.S. institutions established principally to educate Black Americans during eras when access to higher education was systematically denied. They remain open to students of all races and continue to play an important role in education, culture, research, and economic mobility.',
  'The Higher Education Act defines an HBCU as an accredited college or university established before 1964 whose principal mission was, and is, the education of Black Americans. HBCUs were created in response to exclusion from much of American higher education, especially during and after slavery and segregation. Today, HBCUs include public and private institutions and enroll students from many racial and ethnic backgrounds. Members can use the U.S. Department of Education and NCES links below to find institutions and compare programs, admissions, tuition, and other current information. The Library treats HBCUs as both an education subject and part of the history of Black communities in the United States.',
  'education',
  'African diaspora and historically marginalized communities (editorial perspective; no member identity inferred)',
  NULL, NULL, 2, NOW(), NOW(), 'published',
  '["Which HBCUs offer the program I want to study?", "Which HBCUs are near me?", "How do public and private HBCUs differ?", "What scholarships and grants support HBCU students?"]'::jsonb,
  'internal'
FROM public.library_topics topic
WHERE topic.slug = 'education-learning'
ON CONFLICT (id) DO UPDATE SET
  topic_id = EXCLUDED.topic_id,
  question = EXCLUDED.question,
  normalized_question = EXCLUDED.normalized_question,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  body = EXCLUDED.body,
  domain = EXCLUDED.domain,
  community_lens = EXCLUDED.community_lens,
  location_label = NULL,
  disclaimer = NULL,
  source_count = EXCLUDED.source_count,
  refreshed_at = NOW(),
  publication_status = 'published',
  related_questions = EXCLUDED.related_questions,
  provider_name = EXCLUDED.provider_name;

INSERT INTO public.library_entry_sources (
  id, entry_id, url, title, publisher, excerpt, source_tier, published_at, retrieved_at
) VALUES
(
  :'ed_source_id', :'entry_id',
  'https://sites.ed.gov/whhbcu/one-hundred-and-five-historically-black-colleges-and-universities/',
  'What is a Historically Black College and University (HBCU)?',
  'U.S. Department of Education, White House Initiative on HBCUs',
  'Official statutory definition of an HBCU and links to NCES College Navigator and HBCU Fast Facts.',
  'primary', NULL, NOW()
),
(
  :'pew_source_id', :'entry_id',
  'https://www.pewresearch.org/short-reads/2024/10/02/a-look-at-historically-black-colleges-and-universities-in-the-u-s/',
  'A look at historically Black colleges and universities in the U.S.',
  'Pew Research Center',
  'Nonpartisan overview of HBCU history, institutional types, enrollment, and educational role using NCES data.',
  'public-service', '2024-10-02T00:00:00Z', NOW()
)
ON CONFLICT (entry_id, url) DO UPDATE SET
  title = EXCLUDED.title,
  publisher = EXCLUDED.publisher,
  excerpt = EXCLUDED.excerpt,
  source_tier = EXCLUDED.source_tier,
  published_at = EXCLUDED.published_at,
  retrieved_at = NOW();

INSERT INTO public.library_entry_topic_links (entry_id, topic_id, relevance, created_at)
SELECT :'entry_id', topic.id, 0.95, NOW()
FROM public.library_topics topic
WHERE topic.slug = 'places-our-history'
ON CONFLICT (entry_id, topic_id) DO UPDATE SET relevance = EXCLUDED.relevance;

SELECT (
  (SELECT COUNT(*) FROM public.library_entries e
   JOIN public.library_topics t ON t.id=e.topic_id
   WHERE e.id=:'entry_id' AND e.publication_status='published'
     AND e.source_count=2 AND t.slug='education-learning') = 1
  AND
  (SELECT COUNT(*) FROM public.library_entries e
   WHERE e.normalized_question='what are historically black colleges and universities hbcus'
     AND e.domain='education') = 1
  AND
  (SELECT COUNT(*) FROM public.library_entry_sources s
   WHERE s.entry_id=:'entry_id' AND s.url LIKE 'https://%') = 2
  AND
  (SELECT COUNT(*) FROM public.library_entry_topic_links l
   JOIN public.library_topics t ON t.id=l.topic_id
   WHERE l.entry_id=:'entry_id' AND t.slug='places-our-history') = 1
)::int AS postcondition_ok
\gset

\if :postcondition_ok
  COMMIT;
\else
  ROLLBACK;
  \echo 'HBCU_LIBRARY_POSTCONDITION_FAILED'
  \quit 3
\endif
SQL

echo "HBCU_LIBRARY_APPLIED entry=1 sources=2 status=published"
