-- APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE in application startup, this task, staging, or production.
-- Additive private manual Trip itinerary entries only. No backfill or migration of AsyncStorage or other local entries.
-- No provider, calendar, flight, hotel, event, document, booking, task, reminder, notification,
-- delivery, recipient-sharing, chat-memory, profile, discovery/Map/Directory/Community/Safety, analytics,
-- address, location, or coordinates. This migration contains schema only and no data operations.
BEGIN;

CREATE TABLE kinfolk_trip_itinerary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_label TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_day_label TEXT NOT NULL,
  day_label_encryption_key_id VARCHAR(64) NOT NULL,
  day_order INTEGER NOT NULL,
  start_time_label TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_start_time_label TEXT NOT NULL,
  start_time_label_encryption_key_id VARCHAR(64) NOT NULL,
  end_time_label TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_end_time_label TEXT NOT NULL,
  end_time_label_encryption_key_id VARCHAR(64) NOT NULL,
  title TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_title TEXT NOT NULL,
  title_encryption_key_id VARCHAR(64) NOT NULL,
  note TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_note TEXT NOT NULL,
  note_encryption_key_id VARCHAR(64) NOT NULL,
  member_confirmed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kinfolk_trip_itinerary_entries_owner_trip_fk
    FOREIGN KEY (trip_id, user_id) REFERENCES kinfolk_trips (id, user_id) ON DELETE CASCADE,
  CONSTRAINT kinfolk_trip_itinerary_entries_day_label_encrypted_check CHECK (day_label = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_trip_itinerary_entries_start_time_label_encrypted_check CHECK (start_time_label = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_trip_itinerary_entries_end_time_label_encrypted_check CHECK (end_time_label = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_trip_itinerary_entries_title_encrypted_check CHECK (title = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_trip_itinerary_entries_note_encrypted_check CHECK (note = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_trip_itinerary_entries_day_order_check CHECK (day_order >= 1),
  CONSTRAINT kinfolk_trip_itinerary_entries_trip_order_key UNIQUE (trip_id, day_order)
);
CREATE INDEX kinfolk_trip_itinerary_entries_owner_trip_order_idx
  ON kinfolk_trip_itinerary_entries (user_id, trip_id, day_order, created_at, id);

COMMIT;
