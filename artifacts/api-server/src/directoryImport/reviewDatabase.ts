import { Pool, type PoolConfig } from "pg";
import { resolveIsolatedDirectoryReviewConfig } from "./reviewDatabaseConfig";

/** Review data is intentionally never initialized on the production pool. */
export const REVIEW_SCHEMA = `
CREATE TABLE IF NOT EXISTS directory_import_batches (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), source_name TEXT NOT NULL,
 source_sha256 TEXT NOT NULL UNIQUE, source_row_count INTEGER NOT NULL,
 manifest_count INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'staged'
 CHECK (status IN ('staged','in_review','paused','completed','cancelled')),
 created_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS directory_import_candidates (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), batch_id UUID NOT NULL REFERENCES directory_import_batches(id),
 source_row INTEGER NOT NULL, source_row_id TEXT NOT NULL, target_kind TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending_review',
 dedupe_key TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, state TEXT,
 country TEXT NOT NULL DEFAULT 'United States', category TEXT NOT NULL, raw_record JSONB NOT NULL,
 review_revision INTEGER NOT NULL DEFAULT 0, reviewed_by TEXT, reviewed_at TIMESTAMPTZ,
 review_note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(batch_id, source_row), UNIQUE(batch_id, source_row_id)
);
CREATE TABLE IF NOT EXISTS directory_import_decision_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id UUID NOT NULL,
 batch_id UUID NOT NULL, action TEXT NOT NULL, actor_id TEXT NOT NULL,
 idempotency_key TEXT NOT NULL UNIQUE, payload_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS directory_review_outbox (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_key TEXT NOT NULL UNIQUE,
 candidate_id UUID NOT NULL, payload JSONB NOT NULL, payload_hash TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
 attempts INTEGER NOT NULL DEFAULT 0, available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 last_error TEXT, sent_at TIMESTAMPTZ, lease_token TEXT, lease_until TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS directory_review_acknowledgements (
 event_key TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 status TEXT NOT NULL CHECK(status IN ('accepted','rejected')), detail TEXT
);
CREATE INDEX IF NOT EXISTS directory_review_outbox_ready
 ON directory_review_outbox(available_at, created_at) WHERE status IN ('pending','failed');
`;

export function createDirectoryReviewPool(environment: NodeJS.ProcessEnv = process.env): Pool | null {
  const config = resolveIsolatedDirectoryReviewConfig(environment);
  if (!config) return null;
  return new Pool({ connectionString: config.reviewDatabaseUrl, max: 4 } satisfies PoolConfig);
}

export async function bootstrapDirectoryReviewSchema(pool: Pool): Promise<void> {
  await pool.query(REVIEW_SCHEMA);
  const check = await pool.query<{ missing: string[] }>(`
    SELECT ARRAY(
      SELECT required_name FROM unnest(ARRAY[
        'directory_import_batches','directory_import_candidates',
        'directory_import_decision_events','directory_review_outbox',
        'directory_review_acknowledgements'
      ]) required_name
      WHERE to_regclass(required_name) IS NULL
    ) AS missing`);
  if ((check.rows[0]?.missing?.length ?? 0) > 0)
    throw new Error(`Directory review schema incomplete: ${check.rows[0]!.missing.join(", ")}`);
}