-- =============================================================================
-- Mapping With Melanin — Tour-City Readiness & Search-to-Brick Aggregation
-- Supabase / PostgreSQL additive migration
-- Suggested path:
--   supabase/migrations/20260811_tour_city_readiness_search_to_brick.sql
--
-- Purpose:
--   1) Prepare tour markets proactively through managed readiness profiles.
--   2) Convert only eligible, de-identified, non-sensitive search patterns into
--      thresholded aggregate demand signals and research tasks.
--
-- Non-negotiable privacy rules enforced by this schema:
--   - no raw user message column;
--   - no persistent raw user ID in aggregate events;
--   - no exact GPS coordinates;
--   - no sensitive/high-consequence event is eligible for aggregation;
--   - no aggregate signal exists below the configured threshold.
--
-- SCOPE: Additive only. Do not alter auth, sessions, Maps, Safety workflows,
-- business tables, Library source tables, Marketplace, Circles, or navigation.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Uses the timestamp helper introduced in the universal evidence migration.
-- Create safely if this migration is applied before that migration.
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
-- 1. City readiness profiles: planned markets are prepared by the product roadmap,
-- not by any individual tester or private query.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_city_readiness_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_city text NOT NULL,
  region text,
  country_code char(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  timezone text,
  lifecycle text NOT NULL DEFAULT 'planned'
    CHECK (lifecycle IN ('planned', 'research', 'seeded', 'tester_ready', 'launch_ready', 'maintained', 'paused')),
  tour_priority integer NOT NULL DEFAULT 0 CHECK (tour_priority BETWEEN 0 AND 1000),
  target_launch_window text,
  owner_user_id uuid,
  research_notes text,
  last_audited_at timestamptz,
  last_refreshed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS kinfolk_city_readiness_profiles_city_uniq
  ON public.kinfolk_city_readiness_profiles (lower(canonical_city), COALESCE(region, ''), country_code);

DROP TRIGGER IF EXISTS kinfolk_city_readiness_profiles_set_updated_at
  ON public.kinfolk_city_readiness_profiles;
CREATE TRIGGER kinfolk_city_readiness_profiles_set_updated_at
BEFORE UPDATE ON public.kinfolk_city_readiness_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Scores are retained as history rather than overwritten, allowing a tour team to
-- see whether a city is improving or regressing.
CREATE TABLE IF NOT EXISTS public.kinfolk_city_readiness_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_profile_id uuid NOT NULL REFERENCES public.kinfolk_city_readiness_profiles(id) ON DELETE CASCADE,
  business_coverage_score smallint NOT NULL CHECK (business_coverage_score BETWEEN 0 AND 100),
  cultural_coverage_score smallint NOT NULL CHECK (cultural_coverage_score BETWEEN 0 AND 100),
  evidence_coverage_score smallint NOT NULL CHECK (evidence_coverage_score BETWEEN 0 AND 100),
  search_alias_coverage_score smallint NOT NULL CHECK (search_alias_coverage_score BETWEEN 0 AND 100),
  safety_resource_coverage_score smallint NOT NULL CHECK (safety_resource_coverage_score BETWEEN 0 AND 100),
  community_readiness_score smallint NOT NULL CHECK (community_readiness_score BETWEEN 0 AND 100),
  kinfolk_acceptance_score smallint NOT NULL CHECK (kinfolk_acceptance_score BETWEEN 0 AND 100),
  overall_readiness_score smallint NOT NULL CHECK (overall_readiness_score BETWEEN 0 AND 100),
  scoring_version text NOT NULL DEFAULT 'v1',
  calculated_by text NOT NULL CHECK (calculated_by IN ('system', 'admin', 'researcher')),
  calculated_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS kinfolk_city_readiness_scorecards_city_time_idx
  ON public.kinfolk_city_readiness_scorecards (city_profile_id, calculated_at DESC);

CREATE TABLE IF NOT EXISTS public.kinfolk_city_readiness_blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_profile_id uuid NOT NULL REFERENCES public.kinfolk_city_readiness_profiles(id) ON DELETE CASCADE,
  blocker_type text NOT NULL CHECK (blocker_type IN (
    'business_coverage', 'cultural_coverage', 'library_evidence', 'search_alias',
    'safety_resource', 'community_pathway', 'kinfolk_acceptance', 'operational'
  )),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'launch_blocker')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  owner_user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS kinfolk_city_readiness_blockers_city_status_idx
  ON public.kinfolk_city_readiness_blockers (city_profile_id, status, severity);

-- -----------------------------------------------------------------------------
-- 2. Preplanned research queue. A city can be researched before any member joins.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_city_research_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_profile_id uuid NOT NULL REFERENCES public.kinfolk_city_readiness_profiles(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN (
    'business_coverage', 'cultural_site_coverage', 'library_evidence', 'search_alias',
    'safety_resource', 'current_event_source', 'zero_result_follow_up',
    'business_outreach', 'creator_outreach', 'acceptance_test'
  )),
  source_policy_slug text,
  normalized_intent text CHECK (normalized_intent IS NULL OR normalized_intent ~ '^[a-z0-9_:-]{2,180}$'),
  category text,
  priority integer NOT NULL DEFAULT 100 CHECK (priority BETWEEN 0 AND 1000),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'researching', 'pending_review', 'approved', 'completed', 'dismissed')),
  origin text NOT NULL CHECK (origin IN ('tour_plan', 'coverage_audit', 'aggregate_demand', 'admin', 'tester_submission')),
  aggregate_demand_signal_id uuid,
  task_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- task_payload must never contain raw user messages or member identifiers.
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  owner_user_id uuid
);

DROP TRIGGER IF EXISTS kinfolk_city_research_tasks_set_updated_at
  ON public.kinfolk_city_research_tasks;
CREATE TRIGGER kinfolk_city_research_tasks_set_updated_at
BEFORE UPDATE ON public.kinfolk_city_research_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS kinfolk_city_research_tasks_queue_idx
  ON public.kinfolk_city_research_tasks (city_profile_id, status, priority DESC, created_at ASC);

-- -----------------------------------------------------------------------------
-- 3. Search-to-Brick aggregation policy. Founder/admin sets thresholds by city.
-- k must remain >= 10 by database constraint to limit re-identification risk.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_search_brick_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_profile_id uuid REFERENCES public.kinfolk_city_readiness_profiles(id) ON DELETE CASCADE,
  category text,
  enabled boolean NOT NULL DEFAULT true,
  minimum_unique_members integer NOT NULL DEFAULT 10 CHECK (minimum_unique_members >= 10),
  aggregation_window interval NOT NULL DEFAULT interval '30 days'
    CHECK (aggregation_window >= interval '1 day' AND aggregation_window <= interval '90 days'),
  event_retention interval NOT NULL DEFAULT interval '90 days'
    CHECK (event_retention >= interval '7 days' AND event_retention <= interval '180 days'),
  allow_business_outreach boolean NOT NULL DEFAULT false,
  allow_creator_outreach boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- one policy per city/category; city_profile_id NULL acts as a global category policy
  UNIQUE NULLS NOT DISTINCT (city_profile_id, category)
);

DROP TRIGGER IF EXISTS kinfolk_search_brick_policies_set_updated_at
  ON public.kinfolk_search_brick_policies;
CREATE TRIGGER kinfolk_search_brick_policies_set_updated_at
BEFORE UPDATE ON public.kinfolk_search_brick_policies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Baseline global policy. This permits internal research tasks only; business or
-- creator outreach must be separately enabled by city/category after review.
INSERT INTO public.kinfolk_search_brick_policies (
  city_profile_id, category, enabled, minimum_unique_members,
  aggregation_window, event_retention, allow_business_outreach, allow_creator_outreach
) VALUES (
  NULL, NULL, true, 10, interval '30 days', interval '90 days', false, false
)
ON CONFLICT (city_profile_id, category) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Eligible aggregate event store. This is deliberately not a raw search log.
-- anonymous_actor_key must be a server HMAC(user_id + rotating privacy window).
-- Its rotation key must never be stored in Postgres.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_search_brick_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  privacy_window_key text NOT NULL CHECK (privacy_window_key ~ '^[0-9]{4}-W[0-9]{2}$'),
  anonymous_actor_key char(64) NOT NULL CHECK (anonymous_actor_key ~ '^[a-f0-9]{64}$'),
  city_profile_id uuid NOT NULL REFERENCES public.kinfolk_city_readiness_profiles(id) ON DELETE RESTRICT,
  neighborhood_bucket text,
  normalized_intent text NOT NULL CHECK (normalized_intent ~ '^[a-z0-9_:-]{2,180}$'),
  intent text NOT NULL CHECK (intent ~ '^[a-z_]{2,80}$'),
  category text NOT NULL CHECK (category ~ '^[a-z_:-]{2,80}$'),
  result_state text NOT NULL CHECK (result_state IN ('satisfied', 'partial', 'zero_results', 'user_flagged_unhelpful')),
  topic_sensitivity text NOT NULL DEFAULT 'non_sensitive'
    CHECK (topic_sensitivity = 'non_sensitive'),
  consequence text NOT NULL CHECK (consequence IN ('low', 'medium')),
  source_policy_slug text,
  eligible_for_aggregation boolean NOT NULL DEFAULT true CHECK (eligible_for_aggregation = true),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- One member can count once per exact intent/city/week. This prevents one
  -- individual, household, or repeated refresh from manufacturing demand.
  UNIQUE (privacy_window_key, anonymous_actor_key, city_profile_id, normalized_intent)
);

CREATE INDEX IF NOT EXISTS kinfolk_search_brick_events_aggregate_idx
  ON public.kinfolk_search_brick_events (city_profile_id, normalized_intent, occurred_at DESC)
  WHERE topic_sensitivity = 'non_sensitive';
CREATE INDEX IF NOT EXISTS kinfolk_search_brick_events_expiry_idx
  ON public.kinfolk_search_brick_events (expires_at);

-- -----------------------------------------------------------------------------
-- 5. Aggregate demand signals. No raw user ID or anonymous actor key is copied.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kinfolk_aggregate_demand_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_profile_id uuid NOT NULL REFERENCES public.kinfolk_city_readiness_profiles(id) ON DELETE CASCADE,
  neighborhood_bucket text,
  normalized_intent text NOT NULL CHECK (normalized_intent ~ '^[a-z0-9_:-]{2,180}$'),
  category text NOT NULL,
  status text NOT NULL DEFAULT 'candidate'
    CHECK (status IN ('candidate', 'qualified', 'task_created', 'dismissed', 'expired')),
  unique_member_count integer NOT NULL DEFAULT 0 CHECK (unique_member_count >= 0),
  minimum_threshold integer NOT NULL CHECK (minimum_threshold >= 10),
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  source_policy_slug text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  qualified_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS kinfolk_aggregate_demand_signals_window_uniq
  ON public.kinfolk_aggregate_demand_signals (
    city_profile_id, COALESCE(neighborhood_bucket, ''), normalized_intent, window_start, window_end
  );

DROP TRIGGER IF EXISTS kinfolk_aggregate_demand_signals_set_updated_at
  ON public.kinfolk_aggregate_demand_signals;
CREATE TRIGGER kinfolk_aggregate_demand_signals_set_updated_at
BEFORE UPDATE ON public.kinfolk_aggregate_demand_signals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS kinfolk_aggregate_demand_signals_city_status_idx
  ON public.kinfolk_aggregate_demand_signals (city_profile_id, status, updated_at DESC);

-- Add the delayed FK after aggregate signal table exists.
ALTER TABLE public.kinfolk_city_research_tasks
  DROP CONSTRAINT IF EXISTS kinfolk_city_research_tasks_signal_fk;
ALTER TABLE public.kinfolk_city_research_tasks
  ADD CONSTRAINT kinfolk_city_research_tasks_signal_fk
  FOREIGN KEY (aggregate_demand_signal_id)
  REFERENCES public.kinfolk_aggregate_demand_signals(id)
  ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 6. Server-side RPC: record only eligible, non-sensitive normalized events.
-- The application has already applied the Router privacy policy. This function
-- independently refuses high consequence or sensitive values as defense in depth.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_eligible_search_brick_event(
  p_privacy_window_key text,
  p_anonymous_actor_key char(64),
  p_city_profile_id uuid,
  p_neighborhood_bucket text,
  p_normalized_intent text,
  p_intent text,
  p_category text,
  p_result_state text,
  p_consequence text,
  p_source_policy_slug text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_policy public.kinfolk_search_brick_policies%ROWTYPE;
  v_event_id uuid;
BEGIN
  IF p_consequence NOT IN ('low', 'medium') THEN
    RAISE EXCEPTION 'Search-to-Brick refuses high-consequence requests';
  END IF;

  IF p_category IN (
    'medical', 'mental_health', 'sexual_health', 'fertility', 'hiv',
    'legal', 'financial', 'safety', 'immigration', 'relationship', 'trauma'
  ) THEN
    RAISE EXCEPTION 'Search-to-Brick refuses sensitive category aggregation';
  END IF;

  SELECT * INTO v_policy
  FROM public.kinfolk_search_brick_policies p
  WHERE p.enabled = true
    AND (p.city_profile_id = p_city_profile_id OR p.city_profile_id IS NULL)
    AND (p.category = p_category OR p.category IS NULL)
  ORDER BY (p.city_profile_id IS NOT NULL) DESC, (p.category IS NOT NULL) DESC
  LIMIT 1;

  IF v_policy.id IS NULL THEN
    RAISE EXCEPTION 'No active Search-to-Brick aggregation policy for city/category';
  END IF;

  INSERT INTO public.kinfolk_search_brick_events (
    privacy_window_key, anonymous_actor_key, city_profile_id,
    neighborhood_bucket, normalized_intent, intent, category, result_state,
    topic_sensitivity, consequence, source_policy_slug, expires_at
  ) VALUES (
    p_privacy_window_key, p_anonymous_actor_key, p_city_profile_id,
    p_neighborhood_bucket, p_normalized_intent, p_intent, p_category, p_result_state,
    'non_sensitive', p_consequence, p_source_policy_slug, now() + v_policy.event_retention
  )
  ON CONFLICT (privacy_window_key, anonymous_actor_key, city_profile_id, normalized_intent)
  DO UPDATE SET
    result_state = EXCLUDED.result_state,
    occurred_at = now(),
    expires_at = EXCLUDED.expires_at
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. Server-side RPC: refresh a demand signal only after k distinct actors.
-- This function cannot return or expose actor identifiers.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_search_brick_demand_signal(
  p_city_profile_id uuid,
  p_normalized_intent text,
  p_category text,
  p_neighborhood_bucket text DEFAULT NULL
)
RETURNS TABLE (
  signal_id uuid,
  qualified boolean,
  unique_member_count integer,
  minimum_threshold integer
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_policy public.kinfolk_search_brick_policies%ROWTYPE;
  v_start timestamptz;
  v_count integer;
  v_signal_id uuid;
BEGIN
  SELECT * INTO v_policy
  FROM public.kinfolk_search_brick_policies p
  WHERE p.enabled = true
    AND (p.city_profile_id = p_city_profile_id OR p.city_profile_id IS NULL)
    AND (p.category = p_category OR p.category IS NULL)
  ORDER BY (p.city_profile_id IS NOT NULL) DESC, (p.category IS NOT NULL) DESC
  LIMIT 1;

  IF v_policy.id IS NULL THEN
    RAISE EXCEPTION 'No active Search-to-Brick aggregation policy for city/category';
  END IF;

  v_start := now() - v_policy.aggregation_window;

  SELECT count(DISTINCT anonymous_actor_key)::integer
  INTO v_count
  FROM public.kinfolk_search_brick_events
  WHERE city_profile_id = p_city_profile_id
    AND normalized_intent = p_normalized_intent
    AND category = p_category
    AND topic_sensitivity = 'non_sensitive'
    AND eligible_for_aggregation = true
    AND occurred_at >= v_start
    AND occurred_at <= now()
    AND (p_neighborhood_bucket IS NULL OR neighborhood_bucket = p_neighborhood_bucket);

  INSERT INTO public.kinfolk_aggregate_demand_signals (
    city_profile_id, neighborhood_bucket, normalized_intent, category,
    status, unique_member_count, minimum_threshold, window_start, window_end,
    reason
  ) VALUES (
    p_city_profile_id, p_neighborhood_bucket, p_normalized_intent, p_category,
    CASE WHEN v_count >= v_policy.minimum_unique_members THEN 'qualified' ELSE 'candidate' END,
    v_count, v_policy.minimum_unique_members, v_start, now(),
    CASE WHEN v_count >= v_policy.minimum_unique_members
      THEN 'Qualified non-sensitive aggregate demand signal'
      ELSE 'Below k-anonymity threshold'
    END
  )
  ON CONFLICT (city_profile_id, (COALESCE(neighborhood_bucket, '')), normalized_intent, window_start, window_end)
  DO UPDATE SET
    unique_member_count = EXCLUDED.unique_member_count,
    status = EXCLUDED.status,
    updated_at = now(),
    qualified_at = CASE
      WHEN EXCLUDED.status = 'qualified' THEN COALESCE(public.kinfolk_aggregate_demand_signals.qualified_at, now())
      ELSE public.kinfolk_aggregate_demand_signals.qualified_at
    END
  RETURNING id INTO v_signal_id;

  RETURN QUERY SELECT v_signal_id, v_count >= v_policy.minimum_unique_members, v_count, v_policy.minimum_unique_members;
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. Server-side RPC: turn a qualified aggregate signal into a private internal
-- research task. It does NOT notify businesses, creators, members, or Circles.
-- Those later channels require their own policy/consent/audience checks.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_city_research_task_from_signal(
  p_signal_id uuid,
  p_owner_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_signal public.kinfolk_aggregate_demand_signals%ROWTYPE;
  v_task_id uuid;
BEGIN
  SELECT * INTO v_signal
  FROM public.kinfolk_aggregate_demand_signals
  WHERE id = p_signal_id
  FOR UPDATE;

  IF v_signal.id IS NULL THEN
    RAISE EXCEPTION 'Demand signal not found';
  END IF;

  IF v_signal.status <> 'qualified' OR v_signal.unique_member_count < v_signal.minimum_threshold THEN
    RAISE EXCEPTION 'Demand signal does not meet threshold';
  END IF;

  INSERT INTO public.kinfolk_city_research_tasks (
    city_profile_id, task_type, normalized_intent, category, priority,
    status, origin, aggregate_demand_signal_id, task_payload, owner_user_id
  ) VALUES (
    v_signal.city_profile_id,
    'zero_result_follow_up',
    v_signal.normalized_intent,
    v_signal.category,
    LEAST(1000, 250 + v_signal.unique_member_count * 10),
    'queued',
    'aggregate_demand',
    v_signal.id,
    jsonb_build_object(
      'aggregateSignalsOnly', true,
      'memberSearchesIncluded', false,
      'uniqueMemberCount', v_signal.unique_member_count,
      'minimumThreshold', v_signal.minimum_threshold
    ),
    p_owner_user_id
  )
  RETURNING id INTO v_task_id;

  UPDATE public.kinfolk_aggregate_demand_signals
  SET status = 'task_created', updated_at = now()
  WHERE id = v_signal.id;

  RETURN v_task_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 9. Read-only readiness summary used by internal dashboard/API. No member data.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.kinfolk_city_readiness_summary AS
SELECT
  cp.id AS city_profile_id,
  cp.canonical_city,
  cp.region,
  cp.country_code,
  cp.lifecycle,
  cp.tour_priority,
  cp.target_launch_window,
  latest.business_coverage_score,
  latest.cultural_coverage_score,
  latest.evidence_coverage_score,
  latest.search_alias_coverage_score,
  latest.safety_resource_coverage_score,
  latest.community_readiness_score,
  latest.kinfolk_acceptance_score,
  latest.overall_readiness_score,
  count(b.id) FILTER (WHERE b.status IN ('open', 'in_progress')) AS open_blocker_count,
  count(t.id) FILTER (WHERE t.status IN ('queued', 'researching', 'pending_review')) AS open_research_task_count
FROM public.kinfolk_city_readiness_profiles cp
LEFT JOIN LATERAL (
  SELECT *
  FROM public.kinfolk_city_readiness_scorecards s
  WHERE s.city_profile_id = cp.id
  ORDER BY s.calculated_at DESC
  LIMIT 1
) latest ON true
LEFT JOIN public.kinfolk_city_readiness_blockers b ON b.city_profile_id = cp.id
LEFT JOIN public.kinfolk_city_research_tasks t ON t.city_profile_id = cp.id
GROUP BY cp.id, latest.id;

-- -----------------------------------------------------------------------------
-- 10. RLS: No client role may read raw aggregate events or research queue. The
-- API/server uses service role. City dashboard access should be admin-only.
-- -----------------------------------------------------------------------------
ALTER TABLE public.kinfolk_search_brick_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_aggregate_demand_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_city_research_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_city_readiness_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_city_readiness_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinfolk_city_readiness_blockers ENABLE ROW LEVEL SECURITY;

-- Deliberately create NO broad authenticated policies. Service-role server code
-- and a separately audited admin authorization layer manage these tables.

COMMIT;

-- =============================================================================
-- Post-migration verification (run separately after COMMIT)
-- =============================================================================
-- SELECT to_regclass('public.kinfolk_city_readiness_profiles');
-- SELECT to_regclass('public.kinfolk_search_brick_events');
-- SELECT to_regclass('public.kinfolk_aggregate_demand_signals');
-- SELECT to_regclass('public.kinfolk_city_research_tasks');
--
-- Confirm raw searches are impossible to store:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='kinfolk_search_brick_events';
--
-- Required staging smoke tests:
-- 1) Create a planned Los Angeles profile manually; no member/tester data needed.
-- 2) Record ten distinct non-sensitive HMAC actors for an eligible zero-result
--    category and confirm only then does refresh_search_brick_demand_signal()
--    return qualified=true.
-- 3) Try p_consequence='high' or p_category='medical' and confirm RPC rejects it.
-- 4) Confirm create_city_research_task_from_signal() creates an internal task,
--    not a user/business/creator notification.
-- 5) Confirm no authenticated client can SELECT aggregate events through RLS.
-- =============================================================================
