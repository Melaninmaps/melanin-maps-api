-- APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE in application startup, this task, staging, or production.
-- Additive encrypted reflection storage for existing Cultural Journey entries only.
-- This file deliberately has no INSERT, UPDATE, DELETE, backfill, rewrite, key activation, provider, or storage work.
-- Existing legacy reflections remain readable only through owner-scoped application code until an explicit confirmed edit.
BEGIN;

-- Nullable, default-free columns are additive so existing rows remain untouched.
ALTER TABLE cultural_journey_entries
  ADD COLUMN IF NOT EXISTS encrypted_reflection TEXT,
  ADD COLUMN IF NOT EXISTS reflection_encryption_key_id VARCHAR(64);

-- New writes and any reflection-changing write must carry the generic placeholder plus a complete envelope.
-- UPDATE OF deliberately excludes removed_at so a member can remove a legacy, tampered, or key-unavailable entry.
CREATE OR REPLACE FUNCTION cultural_journey_entries_require_encrypted_reflection()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

DROP TRIGGER IF EXISTS cultural_journey_entries_require_encrypted_reflection ON cultural_journey_entries;
CREATE TRIGGER cultural_journey_entries_require_encrypted_reflection
BEFORE INSERT OR UPDATE OF reflection, encrypted_reflection, reflection_encryption_key_id
ON cultural_journey_entries
FOR EACH ROW
EXECUTE FUNCTION cultural_journey_entries_require_encrypted_reflection();

COMMIT;
