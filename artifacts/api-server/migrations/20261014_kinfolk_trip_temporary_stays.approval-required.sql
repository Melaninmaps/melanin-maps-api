-- APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE in application startup, this task, staging, or production.
-- Ordered prerequisite: apply only after separately approved kinfolk_trips and kinfolk_temporary_stays table migrations.
-- First add the Temporary Stay (id, user_id) uniqueness below; only then create the owner-consistent composite foreign key.
-- Additive schema only: no backfill, copy, migration of legacy storage, or data operation is authorized.
-- The link stores only opaque IDs, owner ID, explicit member-confirmation timestamp, and lifecycle timestamps.
-- It stores no exact address, coordinates, encrypted payload, encryption/key material, Google/provider result, booking identifier,
-- calendar/chat-memory/profile/discovery/Map/Directory/Community/Safety/analytics/reminder/sharing material.
BEGIN;

ALTER TABLE kinfolk_temporary_stays
  ADD CONSTRAINT kinfolk_temporary_stays_id_owner_key UNIQUE (id, user_id);

CREATE TABLE kinfolk_trip_temporary_stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,
  temporary_stay_id UUID NOT NULL,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_confirmed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kinfolk_trip_temporary_stays_owner_trip_fk
    FOREIGN KEY (trip_id, user_id) REFERENCES kinfolk_trips (id, user_id) ON DELETE CASCADE,
  CONSTRAINT kinfolk_trip_temporary_stays_owner_temporary_stay_fk
    FOREIGN KEY (temporary_stay_id, user_id) REFERENCES kinfolk_temporary_stays (id, user_id) ON DELETE CASCADE,
  CONSTRAINT kinfolk_trip_temporary_stays_trip_stay_key UNIQUE (trip_id, temporary_stay_id)
);
CREATE INDEX kinfolk_trip_temporary_stays_owner_trip_idx
  ON kinfolk_trip_temporary_stays (user_id, trip_id, created_at);

COMMIT;
