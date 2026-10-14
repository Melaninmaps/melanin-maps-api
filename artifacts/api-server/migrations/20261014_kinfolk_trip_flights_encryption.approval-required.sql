-- APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE in application startup, this task, staging, or production.
-- Ordered prerequisite: apply only after separately approved kinfolk_trips migration. This migration is unregistered.
-- Additive owner-only Trip context and encrypted flight envelope only. No backfill, copy, rewrite, migration, or data operation is authorized.
-- No PNR/booking reference, exact address, coordinates, live location, provider activation/status, calendar, reminder,
-- chat-memory, recommendations, sharing, Directory, Map, Community, Safety, analytics, or public/read-share relation.
BEGIN;

-- Placeholders require room beyond the legacy varchar limits. This is schema-only and preserves every existing value.
ALTER TABLE travel_flights
  ALTER COLUMN flight_number TYPE TEXT,
  ALTER COLUMN airline TYPE TEXT,
  ALTER COLUMN departure_date TYPE TEXT,
  ALTER COLUMN origin TYPE TEXT,
  ALTER COLUMN destination TYPE TEXT,
  ADD COLUMN trip_id UUID NULL,
  ADD COLUMN encrypted_flight_number TEXT NULL,
  ADD COLUMN flight_number_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN encrypted_airline TEXT NULL,
  ADD COLUMN airline_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN encrypted_departure_date TEXT NULL,
  ADD COLUMN departure_date_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN encrypted_origin TEXT NULL,
  ADD COLUMN origin_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN encrypted_destination TEXT NULL,
  ADD COLUMN destination_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN encrypted_notes TEXT NULL,
  ADD COLUMN notes_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN member_confirmed_at TIMESTAMPTZ NULL,
  ADD COLUMN updated_at TIMESTAMPTZ NULL;

-- kinfolk_trips has the matching (id, user_id) uniqueness. The nullable link deliberately leaves legacy flights unlinked.
-- Only trip_id is nulled on deletion: user_id must stay owner-bound and NOT NULL.
ALTER TABLE travel_flights
  ADD CONSTRAINT travel_flights_owner_trip_fk
  FOREIGN KEY (trip_id, user_id) REFERENCES kinfolk_trips (id, user_id) ON DELETE SET NULL (trip_id);
CREATE INDEX travel_flights_owner_trip_created_idx ON travel_flights (user_id, trip_id, created_at DESC, id);

-- New/corrected writes must carry a complete encrypted envelope and placeholders. An untouched all-null legacy envelope
-- may only keep every existing canonical field unchanged (for an explicit link/unlink); it cannot create or rewrite plaintext.
-- DELETE is intentionally absent: a member can remove legacy, partial, tampered, or key-unavailable rows without crypto.
CREATE OR REPLACE FUNCTION travel_flights_no_new_plaintext_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  new_complete BOOLEAN :=
    NEW.flight_number = '[Encrypted private memory]' AND NEW.airline = '[Encrypted private memory]' AND
    NEW.departure_date = '[Encrypted private memory]' AND NEW.origin = '[Encrypted private memory]' AND
    NEW.destination = '[Encrypted private memory]' AND NEW.notes = '[Encrypted private memory]' AND
    NEW.encrypted_flight_number IS NOT NULL AND NEW.flight_number_encryption_key_id IS NOT NULL AND
    NEW.encrypted_airline IS NOT NULL AND NEW.airline_encryption_key_id IS NOT NULL AND
    NEW.encrypted_departure_date IS NOT NULL AND NEW.departure_date_encryption_key_id IS NOT NULL AND
    NEW.encrypted_origin IS NOT NULL AND NEW.origin_encryption_key_id IS NOT NULL AND
    NEW.encrypted_destination IS NOT NULL AND NEW.destination_encryption_key_id IS NOT NULL AND
    NEW.encrypted_notes IS NOT NULL AND NEW.notes_encryption_key_id IS NOT NULL;
  old_legacy BOOLEAN := TG_OP = 'UPDATE' AND
    OLD.encrypted_flight_number IS NULL AND OLD.flight_number_encryption_key_id IS NULL AND
    OLD.encrypted_airline IS NULL AND OLD.airline_encryption_key_id IS NULL AND
    OLD.encrypted_departure_date IS NULL AND OLD.departure_date_encryption_key_id IS NULL AND
    OLD.encrypted_origin IS NULL AND OLD.origin_encryption_key_id IS NULL AND
    OLD.encrypted_destination IS NULL AND OLD.destination_encryption_key_id IS NULL AND
    OLD.encrypted_notes IS NULL AND OLD.notes_encryption_key_id IS NULL AND
    OLD.flight_number IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.airline IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.departure_date IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.origin IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.destination IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.notes IS DISTINCT FROM '[Encrypted private memory]';
  safe_detach BOOLEAN := TG_OP = 'UPDATE' AND NEW.trip_id IS NULL AND
    NEW.user_id IS NOT DISTINCT FROM OLD.user_id AND
    NEW.flight_number IS NOT DISTINCT FROM OLD.flight_number AND
    NEW.encrypted_flight_number IS NOT DISTINCT FROM OLD.encrypted_flight_number AND
    NEW.flight_number_encryption_key_id IS NOT DISTINCT FROM OLD.flight_number_encryption_key_id AND
    NEW.airline IS NOT DISTINCT FROM OLD.airline AND
    NEW.encrypted_airline IS NOT DISTINCT FROM OLD.encrypted_airline AND
    NEW.airline_encryption_key_id IS NOT DISTINCT FROM OLD.airline_encryption_key_id AND
    NEW.departure_date IS NOT DISTINCT FROM OLD.departure_date AND
    NEW.encrypted_departure_date IS NOT DISTINCT FROM OLD.encrypted_departure_date AND
    NEW.departure_date_encryption_key_id IS NOT DISTINCT FROM OLD.departure_date_encryption_key_id AND
    NEW.origin IS NOT DISTINCT FROM OLD.origin AND NEW.encrypted_origin IS NOT DISTINCT FROM OLD.encrypted_origin AND
    NEW.origin_encryption_key_id IS NOT DISTINCT FROM OLD.origin_encryption_key_id AND
    NEW.destination IS NOT DISTINCT FROM OLD.destination AND NEW.encrypted_destination IS NOT DISTINCT FROM OLD.encrypted_destination AND
    NEW.destination_encryption_key_id IS NOT DISTINCT FROM OLD.destination_encryption_key_id AND
    NEW.notes IS NOT DISTINCT FROM OLD.notes AND NEW.encrypted_notes IS NOT DISTINCT FROM OLD.encrypted_notes AND
    NEW.notes_encryption_key_id IS NOT DISTINCT FROM OLD.notes_encryption_key_id;
BEGIN
  IF new_complete THEN RETURN NEW; END IF;
  -- A member can revoke a Trip attachment even if a prior ciphertext is damaged
  -- or a key cannot be read. This changes only trip_id/audit metadata; no flight
  -- content, ciphertext, or key ID is read, written, or replaced.
  IF safe_detach THEN RETURN NEW; END IF;
  IF old_legacy AND NEW.encrypted_flight_number IS NULL AND NEW.flight_number_encryption_key_id IS NULL AND
      NEW.encrypted_airline IS NULL AND NEW.airline_encryption_key_id IS NULL AND
      NEW.encrypted_departure_date IS NULL AND NEW.departure_date_encryption_key_id IS NULL AND
      NEW.encrypted_origin IS NULL AND NEW.origin_encryption_key_id IS NULL AND
      NEW.encrypted_destination IS NULL AND NEW.destination_encryption_key_id IS NULL AND
      NEW.encrypted_notes IS NULL AND NEW.notes_encryption_key_id IS NULL AND
      NEW.flight_number IS NOT DISTINCT FROM OLD.flight_number AND NEW.airline IS NOT DISTINCT FROM OLD.airline AND
      NEW.departure_date IS NOT DISTINCT FROM OLD.departure_date AND NEW.origin IS NOT DISTINCT FROM OLD.origin AND
      NEW.destination IS NOT DISTINCT FROM OLD.destination AND NEW.notes IS NOT DISTINCT FROM OLD.notes THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'travel_flights must use a complete encrypted private-memory envelope';
END;
$$;
CREATE TRIGGER travel_flights_no_new_plaintext_guard
  BEFORE INSERT OR UPDATE ON travel_flights FOR EACH ROW EXECUTE FUNCTION travel_flights_no_new_plaintext_guard();

COMMIT;
