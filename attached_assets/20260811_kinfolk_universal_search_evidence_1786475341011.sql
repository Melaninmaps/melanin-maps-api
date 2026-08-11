-- =============================================================================
-- Mapping With Melanin — Kinfolk Universal Search, Evidence & Adaptive Delivery
-- Supabase / PostgreSQL migration
-- Suggested path: supabase/migrations/20260811_kinfolk_universal_search_evidence.sql
--
-- SCOPE: Additive only. This migration does NOT alter authentication, sessions,
-- Maps, Safety Hub, business-listing tables, Marketplace, Circles, or navigation.
--
-- PRE-FLIGHT:
--   1) Back up production.
--   2) Run MWM_Library_Source_Mapping_SQL.md and record output.
--   3) Confirm the actual current Library tables are public.knowledge_nodes and
--      public.knowledge_sources with uuid id columns. If names differ, change
--      only the marked REFERENCES/ALTER statements below.
--   4) Apply first to Supabase staging, then run the regression suite.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 0. Defensive pre-flight: fail loudly rather than creating a competing Library.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.knowledge_nodes') IS NULL THEN
    RAISE EXCEPTION 'Expected table public.knowledge_nodes does not exist. Stop and map this migration to the existing Library topic table.';
  END IF;

  IF to_regclass('public.knowledge_sources') IS NULL THEN
    RAISE EXCEPTION 'Expected table public.knowledge_sources does not exist. Stop and map this migration to the existing Library source table.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Shared updated_at trigger helper (safe to reuse across new tables).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Evidence domains: medical, legal, automotive, entertainment, etc.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_evidence_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  default_consequence text NOT NULL
    CHECK (default_consequence IN ('low', 'medium', 'high')),
  default_citation_mode text NOT NULL
    CHECK (default_citation_mode IN ('none', 'recommended', 'required')),
  allows_community_experience boolean NOT NULL DEFAULT false,
  requires_human_review_for_library_publish boolean NOT NULL DEFAULT false,
  is_sensitive boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER kinfolk_evidence_domains_set_updated_at
BEFORE UPDATE ON public.kinfolk_evidence_domains
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stable IDs make policy seeding deterministic across environments.
INSERT INTO public.kinfolk_evidence_domains (
  id, slug, display_name, description, default_consequence,
  default_citation_mode, allows_community_experience,
  requires_human_review_for_library_publish, is_sensitive
) VALUES
  ('10000000-0000-0000-0000-000000000001', 'medical', 'Medical & Health', 'Health education and medical-information topics.', 'high', 'required', false, true, true),
  ('10000000-0000-0000-0000-000000000002', 'legal', 'Legal & Regulated', 'Legal education, rights, and regulated services.', 'high', 'required', false, true, true),
  ('10000000-0000-0000-0000-000000000003', 'financial', 'Financial & Insurance', 'Financial education, insurance, and regulated money topics.', 'high', 'required', false, true, true),
  ('10000000-0000-0000-0000-000000000004', 'safety', 'Safety & Emergency', 'Emergency, physical, emotional, and safety-support information.', 'high', 'required', false, true, true),
  ('10000000-0000-0000-0000-000000000005', 'automotive', 'Automotive & Vintage Cars', 'Cars, repairs, clubs, driving, and automotive culture.', 'medium', 'recommended', true, false, false),
  ('10000000-0000-0000-0000-000000000006', 'entertainment', 'Music, Arts & Entertainment', 'Music, television, film, arts, and popular culture.', 'low', 'recommended', true, false, false),
  ('10000000-0000-0000-0000-000000000007', 'sports', 'Sports', 'Teams, athletes, leagues, and sports culture.', 'low', 'recommended', true, false, false),
  ('10000000-0000-0000-0000-000000000008', 'travel', 'Travel & Relocation', 'Destinations, travel planning, relocation, and local discovery.', 'medium', 'recommended', true, false, false),
  ('10000000-0000-0000-0000-000000000009', 'culture_history', 'Culture, History & Diaspora', 'History, cultural heritage, diaspora, language, and civic context.', 'medium', 'recommended', true, false, false),
  ('10000000-0000-0000-0000-000000000010', 'business', 'Business & Professional Development', 'Business education, professional development, and owner resources.', 'medium', 'recommended', true, false, false)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  default_consequence = EXCLUDED.default_consequence,
  default_citation_mode = EXCLUDED.default_citation_mode,
  allows_community_experience = EXCLUDED.allows_community_experience,
  requires_human_review_for_library_publish = EXCLUDED.requires_human_review_for_library_publish,
  is_sensitive = EXCLUDED.is_sensitive,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 3. Source policies and domain allow/block/prefer rules.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_source_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  domain_id uuid NOT NULL REFERENCES public.kinfolk_evidence_domains(id) ON DELETE RESTRICT,
  consequence text NOT NULL CHECK (consequence IN ('low', 'medium', 'high')),
  citation_mode text NOT NULL CHECK (citation_mode IN ('none', 'recommended', 'required')),
  search_mode text NOT NULL CHECK (search_mode IN ('none', 'library_first', 'web_optional', 'web_required')),
  minimum_distinct_sources integer NOT NULL DEFAULT 0 CHECK (minimum_distinct_sources >= 0),
  minimum_authoritative_sources integer NOT NULL DEFAULT 0 CHECK (minimum_authoritative_sources >= 0),
  community_evidence_allowed boolean NOT NULL DEFAULT false,
  library_auto_promotion_allowed boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER kinfolk_source_policies_set_updated_at
BEFORE UPDATE ON public.kinfolk_source_policies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.kinfolk_source_policy_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_policy_id uuid NOT NULL REFERENCES public.kinfolk_source_policies(id) ON DELETE CASCADE,
  domain text NOT NULL,
  list_type text NOT NULL CHECK (list_type IN ('allow', 'block', 'prefer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_policy_id, domain, list_type)
);

INSERT INTO public.kinfolk_source_policies (
  id, slug, domain_id, consequence, citation_mode, search_mode,
  minimum_distinct_sources, minimum_authoritative_sources,
  community_evidence_allowed, library_auto_promotion_allowed
)
SELECT
  v.id, v.slug, d.id, v.consequence, v.citation_mode, v.search_mode,
  v.minimum_distinct_sources, v.minimum_authoritative_sources,
  v.community_evidence_allowed, v.library_auto_promotion_allowed
FROM (
  VALUES
    ('20000000-0000-0000-0000-000000000001'::uuid, 'medical-authoritative-v1', 'medical', 'high', 'required', 'library_first', 2, 1, false, false),
    ('20000000-0000-0000-0000-000000000002'::uuid, 'legal-authoritative-v1', 'legal', 'high', 'required', 'library_first', 2, 1, false, false),
    ('20000000-0000-0000-0000-000000000003'::uuid, 'financial-authoritative-v1', 'financial', 'high', 'required', 'library_first', 2, 1, false, false),
    ('20000000-0000-0000-0000-000000000004'::uuid, 'safety-official-current-v1', 'safety', 'high', 'required', 'web_required', 1, 1, false, false),
    ('20000000-0000-0000-0000-000000000005'::uuid, 'automotive-discovery-v1', 'automotive', 'medium', 'recommended', 'web_required', 1, 0, true, true),
    ('20000000-0000-0000-0000-000000000006'::uuid, 'culture-conversational-v1', 'entertainment', 'low', 'recommended', 'web_optional', 0, 0, true, true),
    ('20000000-0000-0000-0000-000000000007'::uuid, 'travel-discovery-v1', 'travel', 'medium', 'recommended', 'library_first', 1, 0, true, true)
) AS v(id, slug, domain_slug, consequence, citation_mode, search_mode, minimum_distinct_sources, minimum_authoritative_sources, community_evidence_allowed, library_auto_promotion_allowed)
JOIN public.kinfolk_evidence_domains d ON d.slug = v.domain_slug
ON CONFLICT (slug) DO UPDATE SET
  domain_id = EXCLUDED.domain_id,
  consequence = EXCLUDED.consequence,
  citation_mode = EXCLUDED.citation_mode,
  search_mode = EXCLUDED.search_mode,
  minimum_distinct_sources = EXCLUDED.minimum_distinct_sources,
  minimum_authoritative_sources = EXCLUDED.minimum_authoritative_sources,
  community_evidence_allowed = EXCLUDED.community_evidence_allowed,
  library_auto_promotion_allowed = EXCLUDED.library_auto_promotion_allowed,
  updated_at = now();

-- Domain preferences, intentionally narrow for high-stakes categories.
INSERT INTO public.kinfolk_source_policy_domains (source_policy_id, domain, list_type)
SELECT p.id, x.domain, x.list_type
FROM public.kinfolk_source_policies p
JOIN (
  VALUES
    ('medical-authoritative-v1', 'cdc.gov', 'allow'),
    ('medical-authoritative-v1', 'nih.gov', 'allow'),
    ('medical-authoritative-v1', 'who.int', 'allow'),
    ('medical-authoritative-v1', 'facebook.com', 'block'),
    ('medical-authoritative-v1', 'reddit.com', 'block'),
    ('legal-authoritative-v1', 'facebook.com', 'block'),
    ('legal-authoritative-v1', 'reddit.com', 'block'),
    ('safety-official-current-v1', 'facebook.com', 'block'),
    ('safety-official-current-v1', 'reddit.com', 'block')
) AS x(policy_slug, domain, list_type) ON p.slug = x.policy_slug
ON CONFLICT (source_policy_id, domain, list_type) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Map existing Library topics to one or more evidence domains.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_knowledge_node_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_node_id uuid NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.kinfolk_evidence_domains(id) ON DELETE RESTRICT,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_node_id, domain_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS kinfolk_one_primary_domain_per_node
  ON public.kinfolk_knowledge_node_domains (knowledge_node_id)
  WHERE is_primary;

-- -----------------------------------------------------------------------------
-- 5. Extend existing source records: canonical URL, tier, and review state.
-- -----------------------------------------------------------------------------
ALTER TABLE public.knowledge_sources
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS publisher_name text,
  ADD COLUMN IF NOT EXISTS source_kind text,
  ADD COLUMN IF NOT EXISTS source_tier text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_due_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'knowledge_sources_review_status_check'
  ) THEN
    ALTER TABLE public.knowledge_sources
      ADD CONSTRAINT knowledge_sources_review_status_check
      CHECK (review_status IN ('pending_review', 'verified', 'needs_reverification', 'rejected', 'archived'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'knowledge_sources_source_tier_check'
  ) THEN
    ALTER TABLE public.knowledge_sources
      ADD CONSTRAINT knowledge_sources_source_tier_check
      CHECK (source_tier IS NULL OR source_tier IN ('authoritative', 'professional', 'credible_general', 'community'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_sources_active_canonical_url_uniq
  ON public.knowledge_sources (canonical_url)
  WHERE canonical_url IS NOT NULL AND review_status <> 'archived';

-- -----------------------------------------------------------------------------
-- 6. Explicit evidence scope: direct topic evidence vs destination/background.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_knowledge_source_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_node_id uuid NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE RESTRICT,
  source_policy_id uuid REFERENCES public.kinfolk_source_policies(id) ON DELETE SET NULL,
  scope text NOT NULL CHECK (scope IN ('verified_topic', 'destination_context', 'background_context', 'community_experience')),
  claim text,
  evidence_section text,
  confidence text NOT NULL CHECK (confidence IN ('verified', 'high', 'community')),
  mapping_status text NOT NULL DEFAULT 'pending_review'
    CHECK (mapping_status IN ('pending_review', 'active', 'rejected', 'archived')),
  is_primary boolean NOT NULL DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_node_id, source_id, scope)
);

CREATE INDEX IF NOT EXISTS kinfolk_source_mappings_node_status_scope_idx
  ON public.kinfolk_knowledge_source_mappings (knowledge_node_id, mapping_status, scope);
CREATE INDEX IF NOT EXISTS kinfolk_source_mappings_source_idx
  ON public.kinfolk_knowledge_source_mappings (source_id);

CREATE TRIGGER kinfolk_knowledge_source_mappings_set_updated_at
BEFORE UPDATE ON public.kinfolk_knowledge_source_mappings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Claims and auditable evidence support.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_evidence_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_node_id uuid NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.kinfolk_evidence_domains(id) ON DELETE RESTRICT,
  claim_text text NOT NULL,
  claim_risk text NOT NULL CHECK (claim_risk IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'verified', 'needs_reverification', 'rejected', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kinfolk_claim_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.kinfolk_evidence_claims(id) ON DELETE CASCADE,
  mapping_id uuid NOT NULL REFERENCES public.kinfolk_knowledge_source_mappings(id) ON DELETE CASCADE,
  support_level text NOT NULL CHECK (support_level IN ('direct', 'contextual', 'contradictory')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (claim_id, mapping_id)
);

CREATE TRIGGER kinfolk_evidence_claims_set_updated_at
BEFORE UPDATE ON public.kinfolk_evidence_claims
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. Adaptive delivery profile and user-controlled learning permissions.
-- user_id is intentionally not foreign-keyed to avoid touching the existing
-- identity/auth architecture. Application code must supply authenticated user ID.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_delivery_profiles (
  user_id uuid PRIMARY KEY,
  detail_level text NOT NULL DEFAULT 'standard'
    CHECK (detail_level IN ('quick', 'standard', 'deep')),
  tone_preference text NOT NULL DEFAULT 'default'
    CHECK (tone_preference IN ('default', 'warm', 'professional', 'plain_language', 'regional_opt_in')),
  learning_mode text NOT NULL DEFAULT 'guided'
    CHECK (learning_mode IN ('guided', 'self_directed')),
  notification_cadence text NOT NULL DEFAULT 'essential_only'
    CHECK (notification_cadence IN ('none', 'essential_only', 'weekly_digest', 'opt_in_updates')),
  age_band text NOT NULL DEFAULT 'unknown'
    CHECK (age_band IN ('under_13', '13_17', '18_24', '25_plus', 'unknown')),
  regional_language_opt_in boolean NOT NULL DEFAULT false,
  regional_reference text,
  allow_related_branches boolean NOT NULL DEFAULT false,
  allow_non_sensitive_recommendations boolean NOT NULL DEFAULT false,
  allow_civic_safety_updates boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER kinfolk_delivery_profiles_set_updated_at
BEFORE UPDATE ON public.kinfolk_delivery_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.kinfolk_user_learning_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain_id uuid NOT NULL REFERENCES public.kinfolk_evidence_domains(id) ON DELETE RESTRICT,
  allowed_for_private_help boolean NOT NULL DEFAULT true,
  allowed_for_recommendations boolean NOT NULL DEFAULT false,
  allowed_for_circle_use boolean NOT NULL DEFAULT false,
  allowed_for_anonymous_aggregate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, domain_id),
  -- Sensitive domains cannot be used in circles through a default database row.
  CHECK (NOT allowed_for_circle_use OR allowed_for_private_help)
);

CREATE TRIGGER kinfolk_user_learning_scopes_set_updated_at
BEFORE UPDATE ON public.kinfolk_user_learning_scopes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 9. Ephemeral research, source provenance, governed Library candidates.
-- Raw sensitive queries are NEVER stored here; store minimum operational metadata.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_research_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid,
  user_id_hash text NOT NULL,
  source_policy_id uuid NOT NULL REFERENCES public.kinfolk_source_policies(id) ON DELETE RESTRICT,
  intent text NOT NULL,
  search_mode text NOT NULL CHECK (search_mode IN ('none', 'library_first', 'web_optional', 'web_required')),
  provider text,
  external_search_used boolean NOT NULL DEFAULT false,
  retention_class text NOT NULL CHECK (retention_class IN ('ephemeral', 'analytics_aggregated', 'library_candidate')),
  citation_count integer NOT NULL DEFAULT 0 CHECK (citation_count >= 0),
  request_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS kinfolk_research_runs_retention_expiry_idx
  ON public.kinfolk_research_runs (retention_class, expires_at);
CREATE INDEX IF NOT EXISTS kinfolk_research_runs_user_created_idx
  ON public.kinfolk_research_runs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.kinfolk_research_run_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_run_id uuid NOT NULL REFERENCES public.kinfolk_research_runs(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.knowledge_sources(id) ON DELETE SET NULL,
  canonical_url text NOT NULL,
  title text,
  publisher_name text,
  source_tier text CHECK (source_tier IS NULL OR source_tier IN ('authoritative', 'professional', 'credible_general', 'community')),
  cited_in_answer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (research_run_id, canonical_url)
);

CREATE TABLE IF NOT EXISTS public.kinfolk_library_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_run_id uuid REFERENCES public.kinfolk_research_runs(id) ON DELETE SET NULL,
  knowledge_node_id uuid REFERENCES public.knowledge_nodes(id) ON DELETE SET NULL,
  domain_id uuid NOT NULL REFERENCES public.kinfolk_evidence_domains(id) ON DELETE RESTRICT,
  proposed_source_url text NOT NULL,
  proposed_claim text,
  proposed_scope text NOT NULL CHECK (proposed_scope IN ('verified_topic', 'destination_context', 'background_context', 'community_experience')),
  candidate_status text NOT NULL DEFAULT 'pending_review'
    CHECK (candidate_status IN ('pending_review', 'approved', 'rejected', 'archived')),
  submitted_by_type text NOT NULL CHECK (submitted_by_type IN ('system', 'member', 'business_owner', 'reviewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_note text
);

CREATE INDEX IF NOT EXISTS kinfolk_library_candidates_queue_idx
  ON public.kinfolk_library_candidates (candidate_status, domain_id, created_at);

-- -----------------------------------------------------------------------------
-- 10. Optional proactive-delivery audit. This records only evaluated delivery,
-- not sensitive message text or personal inferences.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_proactive_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain_id uuid REFERENCES public.kinfolk_evidence_domains(id) ON DELETE SET NULL,
  delivery_kind text NOT NULL CHECK (delivery_kind IN ('branch_suggestion', 'saved_topic_update', 'safety_alert', 'community_digest')),
  source_policy_id uuid REFERENCES public.kinfolk_source_policies(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('suppressed', 'delivered', 'dismissed', 'opened')),
  suppression_reason text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kinfolk_proactive_delivery_log_user_created_idx
  ON public.kinfolk_proactive_delivery_log (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 11. Read-only public graph summary view. Existing graph endpoint may call it.
-- This prevents child topics from inheriting a parent source as direct proof.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.kinfolk_library_source_summary AS
SELECT
  n.id AS knowledge_node_id,
  count(m.id) FILTER (WHERE m.mapping_status = 'active' AND m.scope = 'verified_topic') AS verified_topic_count,
  count(m.id) FILTER (WHERE m.mapping_status = 'active' AND m.scope = 'destination_context') AS destination_context_count,
  count(m.id) FILTER (WHERE m.mapping_status = 'active' AND m.scope = 'background_context') AS background_context_count,
  count(m.id) FILTER (WHERE m.mapping_status = 'active' AND m.scope = 'community_experience') AS community_experience_count,
  max(m.last_verified_at) FILTER (WHERE m.mapping_status = 'active') AS last_verified_at,
  CASE
    WHEN count(m.id) FILTER (WHERE m.mapping_status = 'active' AND m.scope = 'verified_topic') > 0 THEN 'verified_topic'
    WHEN count(m.id) FILTER (WHERE m.mapping_status = 'active' AND m.scope IN ('destination_context', 'background_context')) > 0 THEN 'destination_context_only'
    ELSE 'overview_pending_sources'
  END AS evidence_status
FROM public.knowledge_nodes n
LEFT JOIN public.kinfolk_knowledge_source_mappings m ON m.knowledge_node_id = n.id
GROUP BY n.id;

-- -----------------------------------------------------------------------------
-- 12. Row Level Security.
-- Service-role server routes may read/write research/evidence records. Users can
-- only read/update their own adaptive-delivery profile and learning scopes.
-- -----------------------------------------------------------------------------
ALTER TABLE public.kinfolk_delivery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_user_learning_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_proactive_delivery_log ENABLE ROW LEVEL SECURITY;

-- Recreate safely on reruns.
DROP POLICY IF EXISTS kinfolk_delivery_profiles_select_own ON public.kinfolk_delivery_profiles;
CREATE POLICY kinfolk_delivery_profiles_select_own
  ON public.kinfolk_delivery_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS kinfolk_delivery_profiles_update_own ON public.kinfolk_delivery_profiles;
CREATE POLICY kinfolk_delivery_profiles_update_own
  ON public.kinfolk_delivery_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS kinfolk_delivery_profiles_insert_own ON public.kinfolk_delivery_profiles;
CREATE POLICY kinfolk_delivery_profiles_insert_own
  ON public.kinfolk_delivery_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS kinfolk_user_learning_scopes_select_own ON public.kinfolk_user_learning_scopes;
CREATE POLICY kinfolk_user_learning_scopes_select_own
  ON public.kinfolk_user_learning_scopes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS kinfolk_user_learning_scopes_update_own ON public.kinfolk_user_learning_scopes;
CREATE POLICY kinfolk_user_learning_scopes_update_own
  ON public.kinfolk_user_learning_scopes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS kinfolk_user_learning_scopes_insert_own ON public.kinfolk_user_learning_scopes;
CREATE POLICY kinfolk_user_learning_scopes_insert_own
  ON public.kinfolk_user_learning_scopes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS kinfolk_proactive_delivery_log_select_own ON public.kinfolk_proactive_delivery_log;
CREATE POLICY kinfolk_proactive_delivery_log_select_own
  ON public.kinfolk_proactive_delivery_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Evidence/research tables are service-role only by default. Do not add broad
-- authenticated SELECT policies until the Library API performs scope filtering.
ALTER TABLE public.kinfolk_research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_research_run_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_library_candidates ENABLE ROW LEVEL SECURITY;

COMMIT;

-- =============================================================================
-- Post-migration verification (run separately after COMMIT)
-- =============================================================================
-- SELECT to_regclass('public.kinfolk_evidence_domains');
-- SELECT to_regclass('public.kinfolk_source_policies');
-- SELECT to_regclass('public.kinfolk_knowledge_source_mappings');
-- SELECT to_regclass('public.kinfolk_delivery_profiles');
-- SELECT count(*) FROM public.kinfolk_evidence_domains;
-- SELECT evidence_status, count(*) FROM public.kinfolk_library_source_summary GROUP BY evidence_status;
--
-- Required smoke tests:
-- 1) Existing Library Health topics still render.
-- 2) Phuket child topics show overview_pending_sources until direct evidence is seeded.
-- 3) A user can edit only their own delivery profile.
-- 4) Existing auth, Map, Safety, business pages, Marketplace, and Circles are unchanged.
-- =============================================================================
