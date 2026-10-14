-- APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE in application startup, this task, staging, or production.
-- Additive manual private availability blocks only. No data migration, backfill, local-storage import, or provider activation.
-- No external calendar read/connect/sync/block, chat-memory, profile, discovery/Map/Directory/Community/Safety,
-- provider, reminder, notification, sharing, analytics, address, coordinates, or automatic planning use.
BEGIN;

CREATE TABLE kinfolk_private_availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_label TEXT NOT NULL,
  label_encryption_key_id VARCHAR(64) NOT NULL,
  start_at TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_start_at TEXT NOT NULL,
  start_at_encryption_key_id VARCHAR(64) NOT NULL,
  end_at TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_end_at TEXT NOT NULL,
  end_at_encryption_key_id VARCHAR(64) NOT NULL,
  time_zone TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_time_zone TEXT NOT NULL,
  time_zone_encryption_key_id VARCHAR(64) NOT NULL,
  planning_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  member_confirmed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kinfolk_private_availability_blocks_label_encrypted_check CHECK (label = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_private_availability_blocks_start_at_encrypted_check CHECK (start_at = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_private_availability_blocks_end_at_encrypted_check CHECK (end_at = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_private_availability_blocks_time_zone_encrypted_check CHECK (time_zone = '[Encrypted private memory]')
);
CREATE INDEX kinfolk_private_availability_blocks_owner_updated_idx
  ON kinfolk_private_availability_blocks (user_id, updated_at DESC);

COMMIT;
