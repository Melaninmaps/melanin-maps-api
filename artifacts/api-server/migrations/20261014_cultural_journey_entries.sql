-- Source-only migration: do not apply outside an explicitly authorized isolated environment.
-- Member-owned cultural-site references and reflections; no engagement counters or location trail.
CREATE TABLE IF NOT EXISTS cultural_journey_entries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  cultural_site_id varchar(128) NOT NULL,
  site_name varchar(180) NOT NULL,
  source_label varchar(120) NOT NULL,
  library_question varchar(500) NOT NULL,
  reflection text,
  member_confirmed_at timestamptz NOT NULL DEFAULT now(),
  reflection_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);

CREATE INDEX IF NOT EXISTS cultural_journey_entries_owner_site_active_idx
  ON cultural_journey_entries (user_id, cultural_site_id, removed_at);
CREATE INDEX IF NOT EXISTS cultural_journey_entries_owner_active_created_idx
  ON cultural_journey_entries (user_id, removed_at, created_at);
