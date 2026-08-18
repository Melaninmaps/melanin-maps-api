BEGIN;

CREATE TABLE IF NOT EXISTS public.community_business_submissions (
  id uuid PRIMARY KEY,
  submission_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','declined','needs_more_info')),
  source text NOT NULL DEFAULT 'website' CHECK (source IN ('website','instagram','facebook','tiktok','linkedin','qr','other')),
  source_campaign text,
  submitter_member_id uuid,
  submitter_name text,
  submitter_email text,
  business_name text NOT NULL,
  business_description text NOT NULL,
  primary_category text NOT NULL,
  specialties text[] NOT NULL DEFAULT '{}',
  community_tags text[] NOT NULL DEFAULT '{}',
  owner_name text,
  owner_role text,
  owner_identity_text text,
  location_label text,
  address_line1 text,
  city text,
  state_region text,
  postal_code text,
  country_code text NOT NULL DEFAULT 'US',
  latitude numeric(9,6),
  longitude numeric(9,6),
  phone text,
  email text,
  website_url text,
  instagram_handle text,
  facebook_url text,
  tiktok_handle text,
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  published_business_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(btrim(business_name)) BETWEEN 2 AND 160),
  CHECK (char_length(btrim(business_description)) BETWEEN 20 AND 3000),
  CHECK (cardinality(community_tags) <= 8),
  CHECK (cardinality(specialties) <= 12)
);
CREATE INDEX IF NOT EXISTS community_business_submissions_status_created_idx ON public.community_business_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS community_business_submissions_city_category_idx ON public.community_business_submissions(city, primary_category);

-- Each new business is held in this queue until the founder approves it. It must not be
-- returned by local search, Map pins, Kinfolk professional results, or public directory APIs.
CREATE TABLE IF NOT EXISTS public.business_submission_audit_events (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.community_business_submissions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('submitted','edited','approved','declined','needs_more_info','published')),
  actor_member_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_submission_audit_events_submission_idx ON public.business_submission_audit_events(submission_id, created_at DESC);

COMMIT;
