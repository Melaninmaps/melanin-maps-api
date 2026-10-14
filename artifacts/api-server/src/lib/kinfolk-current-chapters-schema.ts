import { pool } from "@workspace/db";

/** Source-only additive startup DDL. No backfill, inference, member rows or preference writes. */
export const CURRENT_CHAPTER_SCHEMA_DDL = `
  CREATE TABLE IF NOT EXISTS kinfolk_current_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(32) NOT NULL,
    note TEXT NOT NULL DEFAULT '[Encrypted private memory]',
    encrypted_content TEXT NOT NULL,
    encryption_key_id VARCHAR(64) NOT NULL,
    is_sensitive BOOLEAN NOT NULL,
    allow_relevant_use BOOLEAN NOT NULL DEFAULT FALSE,
    member_confirmed_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT kinfolk_current_chapters_kind_check CHECK (kind IN ('career_change','relocation','caregiving','family_change','health_support','fertility','pregnancy','pregnancy_loss','later_pregnancy','grief','other')),
    CONSTRAINT kinfolk_current_chapters_note_check CHECK (note = '[Encrypted private memory]'),
    CONSTRAINT kinfolk_current_chapters_sensitive_check CHECK (is_sensitive = (kind IN ('health_support','fertility','pregnancy','pregnancy_loss','later_pregnancy','grief'))),
    CONSTRAINT kinfolk_current_chapters_dates_check CHECK (ended_at IS NULL OR ended_at >= started_at)
  );
  CREATE INDEX IF NOT EXISTS kinfolk_current_chapters_owner_history_idx
    ON kinfolk_current_chapters (user_id, ended_at, started_at);
  CREATE OR REPLACE FUNCTION kinfolk_current_chapters_immutable_origin() RETURNS trigger AS $chapter$
  BEGIN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.id IS DISTINCT FROM OLD.id
      OR NEW.started_at IS DISTINCT FROM OLD.started_at OR NEW.created_at IS DISTINCT FROM OLD.created_at
      OR (OLD.ended_at IS NOT NULL AND NEW.ended_at IS DISTINCT FROM OLD.ended_at) THEN
      RAISE EXCEPTION 'Current Chapter origin and ended history are immutable';
    END IF;
    RETURN NEW;
  END;
  $chapter$ LANGUAGE plpgsql;
  DO $chapter$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'kinfolk_current_chapters_immutable_origin_trigger'
      AND tgrelid = 'kinfolk_current_chapters'::regclass) THEN
      CREATE TRIGGER kinfolk_current_chapters_immutable_origin_trigger BEFORE UPDATE ON kinfolk_current_chapters
        FOR EACH ROW EXECUTE FUNCTION kinfolk_current_chapters_immutable_origin();
    END IF;
  END $chapter$;
`;
export async function ensureKinfolkCurrentChaptersSchema(log: (message: string) => void, warn: (message: string) => void): Promise<void> {
  try {
    await pool.query(CURRENT_CHAPTER_SCHEMA_DDL);
    log("Current Chapter encrypted structure ready");
  } catch {
    warn("Current Chapter structure unavailable");
    throw new Error("Current Chapter structure unavailable");
  }
}
