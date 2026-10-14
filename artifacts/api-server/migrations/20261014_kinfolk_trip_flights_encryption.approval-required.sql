-- APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE in application startup, this task, staging, or production.
-- Ordered prerequisite: apply only after separately approved kinfolk_trips migration. This migration is unregistered.
-- Additive owner-only Trip context and encrypted flight envelope only. No backfill, copy, rewrite, migration, or data operation is authorized.
-- No PNR/booking reference, exact address, coordinates, live location, provider activation/status, calendar, reminder,
-- chat-memory, recommendations, sharing, Directory, Map, Community, Safety, analytics, or public/read-share relation.
-- If the canonical flight guard already exists, this migration fails before changing it; a separate reviewed plan is required.
BEGIN;

-- Keep every established column type unchanged. [private] fits the legacy 10-character destination/date/origin columns.
ALTER TABLE travel_flights
  ADD COLUMN IF NOT EXISTS trip_id UUID NULL,
  ADD COLUMN IF NOT EXISTS encrypted_flight_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS flight_number_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS encrypted_airline TEXT NULL,
  ADD COLUMN IF NOT EXISTS airline_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS encrypted_departure_date TEXT NULL,
  ADD COLUMN IF NOT EXISTS departure_date_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS encrypted_origin TEXT NULL,
  ADD COLUMN IF NOT EXISTS origin_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS encrypted_destination TEXT NULL,
  ADD COLUMN IF NOT EXISTS destination_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS encrypted_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS notes_encryption_key_id VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS member_confirmed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NULL;

-- kinfolk_trips has the matching (id, user_id) uniqueness. An existing constraint is preserved.
DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'travel_flights_owner_trip_fk'
      AND conrelid = 'travel_flights'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE travel_flights
      ADD CONSTRAINT travel_flights_owner_trip_fk
      FOREIGN KEY (trip_id, user_id) REFERENCES kinfolk_trips (id, user_id)
      ON DELETE SET NULL (trip_id)';
  END IF;
END;
$constraint$;
CREATE INDEX IF NOT EXISTS travel_flights_owner_trip_created_idx ON travel_flights (user_id, trip_id, created_at DESC, id);

-- New/corrected writes use a short generic marker plus complete ciphertext. All-null envelopes retain owner-only legacy reads.
CREATE FUNCTION travel_flights_no_new_plaintext_guard_v1() RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE
  new_complete BOOLEAN :=
    NEW.flight_number = '[private]' AND NEW.airline = '[private]' AND
    NEW.departure_date = '[private]' AND NEW.origin = '[private]' AND
    NEW.destination = '[private]' AND NEW.notes = '[private]' AND
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
    OLD.flight_number IS DISTINCT FROM '[private]' AND OLD.flight_number IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.airline IS DISTINCT FROM '[private]' AND OLD.airline IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.departure_date IS DISTINCT FROM '[private]' AND OLD.departure_date IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.origin IS DISTINCT FROM '[private]' AND OLD.origin IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.destination IS DISTINCT FROM '[private]' AND OLD.destination IS DISTINCT FROM '[Encrypted private memory]' AND
    OLD.notes IS DISTINCT FROM '[private]' AND OLD.notes IS DISTINCT FROM '[Encrypted private memory]';
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
$function$;

-- Never replace an existing guard. A clean destination receives the new short-marker safeguard.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'travel_flights'::regclass
      AND tgname = 'travel_flights_no_new_plaintext_guard'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'existing Trip flight guard is preserved; use a separately reviewed migration plan';
  END IF;

  EXECUTE 'CREATE TRIGGER travel_flights_no_new_plaintext_guard
    BEFORE INSERT OR UPDATE ON travel_flights
    FOR EACH ROW
    EXECUTE FUNCTION travel_flights_no_new_plaintext_guard_v1()';
END;
$migration$;

COMMIT;
