-- APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE in application startup, this task, staging, or production.
-- Additive encrypted reflection storage for existing Cultural Journey entries only.
-- This file deliberately has no INSERT, UPDATE, DELETE, backfill, rewrite, key activation, provider, or storage work.
-- Existing legacy reflections remain readable only through owner-scoped application code until an explicit confirmed edit.
-- If the canonical guard trigger already exists, this migration fails before changing it; a separate reviewed plan is required.
BEGIN;

-- Nullable, default-free columns are additive so existing rows remain untouched.
ALTER TABLE cultural_journey_entries
  ADD COLUMN IF NOT EXISTS encrypted_reflection TEXT,
  ADD COLUMN IF NOT EXISTS reflection_encryption_key_id VARCHAR(64);

-- A versioned function avoids replacing any pre-existing database safeguard.
CREATE FUNCTION cultural_journey_entries_require_encrypted_reflection_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.reflection IS NULL
     AND NEW.encrypted_reflection IS NULL
     AND NEW.reflection_encryption_key_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.reflection = '[Encrypted private memory]'
     AND NEW.encrypted_reflection IS NOT NULL
     AND btrim(NEW.encrypted_reflection) <> ''
     AND NEW.reflection_encryption_key_id IS NOT NULL
     AND btrim(NEW.reflection_encryption_key_id) <> '' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'cultural_journey_entries reflections must use an encrypted envelope';
END;
$function$;

-- Never drop, replace, or weaken a guard that may already protect this table.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'cultural_journey_entries'::regclass
      AND tgname = 'cultural_journey_entries_require_encrypted_reflection'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'existing cultural journey reflection guard is preserved; use a separately reviewed migration plan';
  END IF;

  EXECUTE 'CREATE TRIGGER cultural_journey_entries_require_encrypted_reflection
    BEFORE INSERT OR UPDATE OF reflection, encrypted_reflection, reflection_encryption_key_id
    ON cultural_journey_entries
    FOR EACH ROW
    EXECUTE FUNCTION cultural_journey_entries_require_encrypted_reflection_v1()';
END;
$migration$;

COMMIT;
