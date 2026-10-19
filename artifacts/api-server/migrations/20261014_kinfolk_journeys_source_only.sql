-- Kinfolk Journeys (SOURCE-ONLY REVIEW MIGRATION)
--
-- Do not apply without separate migration approval. This migration is additive,
-- creates no public data, and does not modify Life Journeys, businesses, auth,
-- memberships, directory data, Maps, or Safety Hub tables.
--
-- Rollback guidance appears at the end. Before a production apply, validate the
-- current media_assets purpose constraint/schema and provider-token key policy.

CREATE TABLE IF NOT EXISTS kinfolk_journeys (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  title varchar(180) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'draft',
  destination_label varchar(255),
  destination_city varchar(120),
  destination_region varchar(120),
  time_zone varchar(80),
  start_date varchar(10),
  end_date varchar(10),
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  origin_kinfolk_session_id varchar(36),
  retention_policy varchar(40) NOT NULL DEFAULT 'keep_until_deleted',
  retention_expires_at timestamptz,
  member_consented_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_journeys_status_check CHECK (status IN ('draft','review_needed','confirmed','active','completed','archived','deleted')),
  CONSTRAINT kinfolk_journeys_retention_check CHECK (retention_policy IN ('delete_after_trip','keep_until_deleted','keep_until_member_changes_it')),
  -- The scheduled redaction worker uses this explicit timestamp. A Journey may
  -- not claim delete-after-trip retention without a member-supplied end date.
  CONSTRAINT kinfolk_journeys_delete_after_trip_expiry_check CHECK (
    retention_policy <> 'delete_after_trip'
    OR (end_date IS NOT NULL AND retention_expires_at IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS kinfolk_journeys_user_updated_idx ON kinfolk_journeys (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS kinfolk_journeys_user_status_idx ON kinfolk_journeys (user_id, status);

CREATE TABLE IF NOT EXISTS kinfolk_journey_items (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id varchar(36) NOT NULL,
  user_id varchar(255) NOT NULL,
  kind varchar(32) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'proposed',
  title varchar(255) NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  time_zone varchar(80),
  location_label varchar(255),
  canonical_business_id varchar(36),
  source_import_id varchar(36),
  member_confirmed_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_journey_items_kind_check CHECK (kind IN ('flight','lodging','transport','reservation','event','place','note','reminder')),
  CONSTRAINT kinfolk_journey_items_status_check CHECK (status IN ('proposed','tentative','confirmed','cancelled','skipped'))
);
CREATE INDEX IF NOT EXISTS kinfolk_journey_items_journey_time_idx ON kinfolk_journey_items (journey_id, starts_at);
CREATE INDEX IF NOT EXISTS kinfolk_journey_items_user_idx ON kinfolk_journey_items (user_id);
CREATE INDEX IF NOT EXISTS kinfolk_journey_items_business_idx ON kinfolk_journey_items (canonical_business_id);

CREATE TABLE IF NOT EXISTS kinfolk_journey_sources (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id varchar(36) NOT NULL,
  item_id varchar(36),
  user_id varchar(255) NOT NULL,
  field_key varchar(80) NOT NULL,
  source_kind varchar(32) NOT NULL,
  source_label varchar(255) NOT NULL,
  confidence varchar(16) NOT NULL DEFAULT 'low',
  extraction_status varchar(32) NOT NULL DEFAULT 'review_needed',
  source_fingerprint varchar(128) NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  member_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_journey_sources_kind_check CHECK (source_kind IN ('member_entry','kinfolk_governed','confirmation_text','document','image','email','calendar','provider')),
  CONSTRAINT kinfolk_journey_sources_confidence_check CHECK (confidence IN ('high','medium','low')),
  CONSTRAINT kinfolk_journey_sources_status_check CHECK (extraction_status IN ('not_requested','review_needed','parsed','confirmed','conflict','unavailable','deleted')),
  CONSTRAINT kinfolk_journey_sources_unique_fingerprint UNIQUE (journey_id, field_key, source_fingerprint)
);
CREATE INDEX IF NOT EXISTS kinfolk_journey_sources_journey_idx ON kinfolk_journey_sources (journey_id);

CREATE TABLE IF NOT EXISTS kinfolk_journey_imports (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id varchar(36) NOT NULL,
  user_id varchar(255) NOT NULL,
  source_kind varchar(32) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'review_needed',
  asset_id varchar(36),
  provider_message_hash varchar(128),
  content_digest varchar(128) NOT NULL,
  parsed_facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  member_consented_at timestamptz NOT NULL,
  reviewed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_journey_imports_kind_check CHECK (source_kind IN ('confirmation_text','document','image','email','calendar','provider')),
  CONSTRAINT kinfolk_journey_imports_status_check CHECK (status IN ('review_needed','parsed','confirmed','conflict','unavailable','deleted')),
  CONSTRAINT kinfolk_journey_imports_owner_digest UNIQUE (journey_id, content_digest)
);
CREATE INDEX IF NOT EXISTS kinfolk_journey_imports_journey_idx ON kinfolk_journey_imports (journey_id, created_at DESC);

CREATE TABLE IF NOT EXISTS kinfolk_journey_connections (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  provider varchar(40) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'not_configured',
  access_mode varchar(40) NOT NULL DEFAULT 'manual',
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  token_envelope text,
  -- HMAC-derived, owner-scoped opaque references; never raw provider IDs.
  provider_account_ref varchar(96),
  selected_calendar_ref varchar(96),
  oauth_state_hash varchar(128),
  oauth_nonce_hash varchar(128),
  consented_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_journey_connections_provider_check CHECK (provider IN ('google_calendar','microsoft_calendar','gmail','outlook_mail','device_calendar','flight_status')),
  CONSTRAINT kinfolk_journey_connections_status_check CHECK (status IN ('disabled','not_configured','pending_consent','connected','expired','needs_reconnect','revoked','disconnect_pending')),
  CONSTRAINT kinfolk_journey_connections_access_check CHECK (access_mode IN ('free_busy','selected_items','calendar_details','manual')),
  CONSTRAINT kinfolk_journey_connections_provider_account_ref_check CHECK (provider_account_ref IS NULL OR provider_account_ref ~ '^journey_ref_v1_[A-Za-z0-9_-]{43}$'),
  CONSTRAINT kinfolk_journey_connections_selected_calendar_ref_check CHECK (selected_calendar_ref IS NULL OR selected_calendar_ref ~ '^journey_ref_v1_[A-Za-z0-9_-]{43}$'),
  CONSTRAINT kinfolk_journey_connections_selected_calendar_owner_check CHECK (selected_calendar_ref IS NULL OR provider_account_ref IS NOT NULL),
  CONSTRAINT kinfolk_journey_connections_connected_identity_check CHECK (status <> 'connected' OR provider_account_ref IS NOT NULL),
  CONSTRAINT kinfolk_journey_connections_owner_provider UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS kinfolk_journey_collaborators (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id varchar(36) NOT NULL,
  owner_user_id varchar(255) NOT NULL,
  collaborator_user_id varchar(255),
  invitation_hash varchar(128),
  role varchar(16) NOT NULL DEFAULT 'viewer',
  status varchar(16) NOT NULL DEFAULT 'disabled',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_journey_collaborators_role_check CHECK (role IN ('viewer','editor')),
  CONSTRAINT kinfolk_journey_collaborators_status_check CHECK (status IN ('disabled','pending','accepted','revoked','expired'))
);
CREATE INDEX IF NOT EXISTS kinfolk_journey_collaborators_owner_idx ON kinfolk_journey_collaborators (owner_user_id, journey_id);

CREATE TABLE IF NOT EXISTS kinfolk_journey_reminders (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id varchar(36) NOT NULL,
  user_id varchar(255) NOT NULL,
  item_id varchar(36),
  channel varchar(16) NOT NULL DEFAULT 'in_app',
  state varchar(16) NOT NULL DEFAULT 'enabled',
  due_at timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_journey_reminders_channel_check CHECK (channel IN ('in_app','push','email')),
  CONSTRAINT kinfolk_journey_reminders_state_check CHECK (state IN ('enabled','paused','sent','deleted'))
);
CREATE INDEX IF NOT EXISTS kinfolk_journey_reminders_due_idx ON kinfolk_journey_reminders (state, due_at);
CREATE INDEX IF NOT EXISTS kinfolk_journey_reminders_owner_idx ON kinfolk_journey_reminders (user_id, journey_id);

-- Source-only: a future approved flight-status integration may store only a
-- member-confirmed flight reference and normalized advisory state. This table
-- contains no PNR, traveler identity, loyalty, ticket, payment, raw provider
-- payload, airline credential, or booking-management data.
CREATE TABLE IF NOT EXISTS kinfolk_journey_flight_watches (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id varchar(36) NOT NULL,
  user_id varchar(255) NOT NULL,
  item_id varchar(36),
  operating_carrier varchar(3) NOT NULL,
  flight_number varchar(4) NOT NULL,
  scheduled_departure_date varchar(10) NOT NULL,
  origin_iata varchar(3) NOT NULL,
  destination_iata varchar(3) NOT NULL,
  notification_channel varchar(12) NOT NULL DEFAULT 'in_app',
  state varchar(32) NOT NULL DEFAULT 'pending_provider',
  provider_key varchar(40),
  provider_reference_hash varchar(128),
  last_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_observed_at timestamptz,
  fresh_until timestamptz,
  consented_at timestamptz NOT NULL,
  paused_at timestamptz,
  revoked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_journey_flight_watches_channel_check CHECK (notification_channel IN ('in_app','push','email')),
  CONSTRAINT kinfolk_journey_flight_watches_state_check CHECK (state IN ('pending_provider','active','paused','completed','revoked','deleted')),
  CONSTRAINT kinfolk_journey_flight_watches_identity_check CHECK (operating_carrier ~ '^[A-Z0-9]{2,3}$' AND flight_number ~ '^[A-Z0-9]{1,4}$' AND origin_iata ~ '^[A-Z]{3}$' AND destination_iata ~ '^[A-Z]{3}$')
);
CREATE INDEX IF NOT EXISTS kinfolk_journey_flight_watches_owner_idx ON kinfolk_journey_flight_watches (user_id, journey_id);
CREATE INDEX IF NOT EXISTS kinfolk_journey_flight_watches_state_idx ON kinfolk_journey_flight_watches (state, scheduled_departure_date);
CREATE UNIQUE INDEX IF NOT EXISTS kinfolk_journey_flight_watches_owner_flight
  ON kinfolk_journey_flight_watches (user_id, journey_id, operating_carrier, flight_number, scheduled_departure_date, origin_iata, destination_iata)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS kinfolk_journey_audit (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id varchar(36) NOT NULL,
  user_id varchar(255) NOT NULL,
  event_type varchar(80) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kinfolk_journey_audit_journey_idx ON kinfolk_journey_audit (journey_id, created_at DESC);

-- REVIEW-ONLY ROLLBACK (run only after verified data export and explicit approval):
-- DROP TABLE IF EXISTS kinfolk_journey_audit;
-- DROP TABLE IF EXISTS kinfolk_journey_flight_watches;
-- DROP TABLE IF EXISTS kinfolk_journey_reminders;
-- DROP TABLE IF EXISTS kinfolk_journey_collaborators;
-- DROP TABLE IF EXISTS kinfolk_journey_connections;
-- DROP TABLE IF EXISTS kinfolk_journey_imports;
-- DROP TABLE IF EXISTS kinfolk_journey_sources;
-- DROP TABLE IF EXISTS kinfolk_journey_items;
-- DROP TABLE IF EXISTS kinfolk_journeys;
