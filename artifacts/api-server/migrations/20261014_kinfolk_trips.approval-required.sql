-- APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE in application startup, this task, staging, or production.
-- Additive private Trip foundation only. No backfill/migration of AsyncStorage or other local itineraries.
-- No provider, calendar, flight, hotel, event, document, reminder, delivery, recipient-sharing,
-- chat-memory, profile, discovery/Map/Directory/Community/Safety, analytics, address, or coordinates.
BEGIN;

CREATE TABLE kinfolk_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_title TEXT NOT NULL,
  title_encryption_key_id VARCHAR(64) NOT NULL,
  destination TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_destination TEXT NOT NULL,
  destination_encryption_key_id VARCHAR(64) NOT NULL,
  note TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_note TEXT NOT NULL,
  note_encryption_key_id VARCHAR(64) NOT NULL,
  member_confirmed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kinfolk_trips_title_encrypted_check CHECK (title = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_trips_destination_encrypted_check CHECK (destination = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_trips_note_encrypted_check CHECK (note = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_trips_id_owner_key UNIQUE (id, user_id)
);
CREATE INDEX kinfolk_trips_owner_updated_idx ON kinfolk_trips (user_id, updated_at DESC);

COMMIT;
