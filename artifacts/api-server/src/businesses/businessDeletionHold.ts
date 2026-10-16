import { randomUUID } from "crypto";
import type { Pool } from "pg";

export const BUSINESS_DELETION_HOLD_DAYS = 7;
export const BUSINESS_DELETION_HOLD_REASON =
  "Administrator-requested permanent deletion held for seven days";

export type BusinessDeletionHoldClient = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    statement: string,
    values?: readonly unknown[],
  ) => Promise<{ rows: T[] }>;
};

type HoldEventAction =
  | "scheduled"
  | "cancelled"
  | "permanently_deleted"
  | "blocked"
  | "missing";

export type BusinessDeletionHoldWorkerLogger = {
  info: (details: Record<string, unknown>, message: string) => void;
  warn: (details: Record<string, unknown>, message: string) => void;
  error: (details: Record<string, unknown>, message: string) => void;
};

export function sevenDaysFrom(requestedAt: Date): Date {
  return new Date(
    requestedAt.getTime() + BUSINESS_DELETION_HOLD_DAYS * 24 * 60 * 60 * 1000,
  );
}

export async function ensureBusinessDeletionHoldSchema(
  client: BusinessDeletionHoldClient,
): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_permanent_deletion_audit_events (
      id            UUID PRIMARY KEY,
      business_id   TEXT NOT NULL,
      actor_user_id TEXT,
      reason        TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
      snapshot      JSONB NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS business_permanent_deletion_audit_business_created_idx
      ON business_permanent_deletion_audit_events(business_id, created_at DESC)
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_deletion_holds (
      business_id      TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
      requested_by     TEXT,
      requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      delete_after     TIMESTAMPTZ NOT NULL,
      reason           TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
      snapshot         JSONB NOT NULL,
      state            TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'blocked')),
      last_error       TEXT,
      blocked_at       TIMESTAMPTZ,
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS business_deletion_holds_due_idx
      ON business_deletion_holds(state, delete_after)
      WHERE state = 'pending'
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_deletion_hold_events (
      id              UUID PRIMARY KEY,
      business_id     TEXT NOT NULL,
      action          TEXT NOT NULL CHECK (action IN ('scheduled', 'cancelled', 'permanently_deleted', 'blocked', 'missing')),
      actor_user_id   TEXT,
      reason          TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
      delete_after    TIMESTAMPTZ,
      snapshot        JSONB NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS business_deletion_hold_events_business_created_idx
      ON business_deletion_hold_events(business_id, created_at DESC)
  `);
  await client.query(`
    CREATE OR REPLACE FUNCTION prevent_business_deletion_hold_event_mutation()
    RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'business_deletion_hold_events are immutable';
    END;
    $$ LANGUAGE plpgsql
  `);
  await client.query(`
    DROP TRIGGER IF EXISTS business_deletion_hold_events_immutable
      ON business_deletion_hold_events
  `);
  await client.query(`
    CREATE TRIGGER business_deletion_hold_events_immutable
      BEFORE UPDATE OR DELETE ON business_deletion_hold_events
      FOR EACH ROW EXECUTE FUNCTION prevent_business_deletion_hold_event_mutation()
  `);
}

export async function recordBusinessDeletionHoldEvent(
  client: BusinessDeletionHoldClient,
  input: {
    businessId: string;
    action: HoldEventAction;
    actorUserId: string | null;
    reason: string;
    deleteAfter: Date | string | null;
    snapshot: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO business_deletion_hold_events
       (id, business_id, action, actor_user_id, reason, delete_after, snapshot)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      randomUUID(),
      input.businessId,
      input.action,
      input.actorUserId,
      input.reason,
      input.deleteAfter,
      JSON.stringify(input.snapshot),
    ],
  );
}

export async function cancelBusinessDeletionHold(
  client: BusinessDeletionHoldClient,
  input: {
    businessId: string;
    actorUserId: string | null;
    reason: string;
  },
): Promise<boolean> {
  const result = await client.query<{
    delete_after: string;
    snapshot: Record<string, unknown>;
  }>(
    `DELETE FROM business_deletion_holds
      WHERE business_id = $1
      RETURNING delete_after, snapshot`,
    [input.businessId],
  );
  const hold = result.rows[0];
  if (!hold) return false;
  await recordBusinessDeletionHoldEvent(client, {
    businessId: input.businessId,
    action: "cancelled",
    actorUserId: input.actorUserId,
    reason: input.reason,
    deleteAfter: hold.delete_after,
    snapshot: hold.snapshot,
  });
  return true;
}

/** Legacy entry point retained for callers, but expiration is never deletion.
 * Existing pending Kinfolk Current Delete Review holds are safe without a DB
 * migration: neither this entry point nor startup performs a query or deletion.
 * Administrators must explicitly move records into Delete Queue and separately
 * confirm permanent deletion after its new seven-day eligibility period.
 */
export async function processDueBusinessDeletionHolds(
  _pool: Pool,
  _logger: BusinessDeletionHoldWorkerLogger,
  _limit = 100,
): Promise<{ deleted: number; missing: number; blocked: number }> {
  return { deleted: 0, missing: 0, blocked: 0 };
}

export function startBusinessDeletionHoldWorker(
  _pool: Pool,
  logger: BusinessDeletionHoldWorkerLogger,
): () => void {
  logger.info({}, "Automatic business deletion disabled; Delete Queue requires separate confirmation");
  return () => undefined;
}
