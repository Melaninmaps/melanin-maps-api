-- Kinfolk Connected Apps & Permissions (SOURCE-ONLY REVIEW MIGRATION)
--
-- Do not apply without separate approval. This is additive and does not activate
-- provider credentials, OAuth, native permissions, account connections, polling,
-- notifications, health/financial data access, or changes to existing member data.

CREATE TABLE IF NOT EXISTS kinfolk_connected_app_permissions (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  app_key varchar(80) NOT NULL,
  category varchar(24) NOT NULL,
  authorization_mode varchar(32) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'requested',
  purpose varchar(160) NOT NULL,
  data_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  token_envelope text,
  granted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_connected_app_permissions_category_check CHECK (category IN ('travel','health','finance','everyday')),
  CONSTRAINT kinfolk_connected_app_permissions_mode_check CHECK (authorization_mode IN ('oauth','native_permission','selected_import','provider_contract','unsupported')),
  CONSTRAINT kinfolk_connected_app_permissions_status_check CHECK (status IN ('requested','authorized','revoked','deleted','unavailable')),
  CONSTRAINT kinfolk_connected_app_permissions_member_unique UNIQUE (user_id, app_key, purpose)
);
CREATE INDEX IF NOT EXISTS kinfolk_connected_app_permissions_member_category_idx
  ON kinfolk_connected_app_permissions (user_id, category, updated_at DESC);

-- Contains lifecycle events only; never copy a token, provider response,
-- imported document, health record, financial record, or source content here.
CREATE TABLE IF NOT EXISTS kinfolk_connected_app_audit (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  permission_id varchar(36),
  app_key varchar(80) NOT NULL,
  action varchar(32) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kinfolk_connected_app_audit_member_created_idx
  ON kinfolk_connected_app_audit (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kinfolk_connected_app_audit_permission_idx
  ON kinfolk_connected_app_audit (permission_id);

-- REVIEW-ONLY ROLLBACK (after a verified export and explicit approval):
-- DROP TABLE IF EXISTS kinfolk_connected_app_audit;
-- DROP TABLE IF EXISTS kinfolk_connected_app_permissions;
