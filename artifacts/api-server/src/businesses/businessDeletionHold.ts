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

async function finalizeOneDueHold(
  pool: Pool,
  logger: BusinessDeletionHoldWorkerLogger,
  businessId: string,
): Promise<"deleted" | "missing" | "blocked" | "skipped"> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const holdResult = await client.query<{
      business_id: string;
      requested_by: string | null;
      delete_after: string;
      reason: string;
      snapshot: Record<string, unknown>;
    }>(
      `SELECT business_id, requested_by, delete_after, reason, snapshot
         FROM business_deletion_holds
        WHERE business_id = $1
          AND state = 'pending'
          AND delete_after <= NOW()
        FOR UPDATE`,
      [businessId],
    );
    const hold = holdResult.rows[0];
    if (!hold) {
      await client.query("ROLLBACK");
      return "skipped";
    }

    const currentResult = await client.query<{
      snapshot: Record<string, unknown>;
    }>(
      `SELECT to_jsonb(businesses) AS snapshot
         FROM businesses
        WHERE id = $1
        FOR UPDATE`,
      [businessId],
    );
    const current = currentResult.rows[0];
    if (!current) {
      await recordBusinessDeletionHoldEvent(client, {
        businessId,
        action: "missing",
        actorUserId: hold.requested_by,
        reason:
          "Seven-day deletion hold expired after the business was already absent",
        deleteAfter: hold.delete_after,
        snapshot: hold.snapshot,
      });
      await client.query(
        "DELETE FROM business_deletion_holds WHERE business_id = $1",
        [businessId],
      );
      await client.query("COMMIT");
      return "missing";
    }

    const queuedReview = await client.query<{ business_id: string }>(
      `SELECT business_id
         FROM kinfolk_current_online_presence_reviews
        WHERE business_id = $1
          AND state = 'queued'
        FOR UPDATE`,
      [businessId],
    );
    if (queuedReview.rows[0]) {
      throw new Error(
        "Business is in Kinfolk Current Delete Review and cannot be permanently deleted until specifically resolved through review",
      );
    }

    const cohortReceipts = await client.query<{
      snapshot: Record<string, unknown>;
    }>(
      `SELECT to_jsonb(business_inventory_cohort_receipts) AS snapshot
         FROM business_inventory_cohort_receipts
        WHERE business_id = $1
        FOR UPDATE`,
      [businessId],
    );
    const deletionSnapshot = {
      business: current.snapshot,
      inventoryCohortReceipt: cohortReceipts.rows[0]?.snapshot ?? null,
      deletionHoldSnapshot: hold.snapshot,
    };

    await client.query(
      `INSERT INTO business_permanent_deletion_audit_events
         (id, business_id, actor_user_id, reason, snapshot)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        randomUUID(),
        businessId,
        hold.requested_by,
        "Seven-day administrative deletion hold elapsed",
        JSON.stringify(deletionSnapshot),
      ],
    );
    await recordBusinessDeletionHoldEvent(client, {
      businessId,
      action: "permanently_deleted",
      actorUserId: hold.requested_by,
      reason: "Seven-day administrative deletion hold elapsed",
      deleteAfter: hold.delete_after,
      snapshot: deletionSnapshot,
    });
    await client.query(
      "DELETE FROM business_inventory_cohort_receipts WHERE business_id = $1",
      [businessId],
    );
    // Deliberately no CASCADE: linked community, owner, review, or media data
    // blocks the final deletion and leaves the held listing recoverable.
    await client.query("DELETE FROM businesses WHERE id = $1", [businessId]);
    await client.query("COMMIT");
    return "deleted";
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => undefined);
    const detail =
      error instanceof Error
        ? error.message.slice(0, 900)
        : "Unknown final-deletion error";
    try {
      await client.query("BEGIN");
      const held = await client.query<{
        delete_after: string;
        snapshot: Record<string, unknown>;
      }>(
        `UPDATE business_deletion_holds
            SET state = 'blocked',
                last_error = $2,
                blocked_at = NOW(),
                updated_at = NOW()
          WHERE business_id = $1
            AND state = 'pending'
          RETURNING delete_after, snapshot`,
        [businessId, detail],
      );
      const hold = held.rows[0];
      if (hold) {
        await recordBusinessDeletionHoldEvent(client, {
          businessId,
          action: "blocked",
          actorUserId: null,
          reason:
            "Seven-day deletion hold ended but protected linked records blocked removal",
          deleteAfter: hold.delete_after,
          snapshot: hold.snapshot,
        });
      }
      await client.query("COMMIT");
    } catch (recordError) {
      await client.query("ROLLBACK").catch(() => undefined);
      logger.error(
        { businessId, error: recordError },
        "Could not record blocked business deletion hold",
      );
    }
    logger.error(
      { businessId, error },
      "Business deletion hold finalization failed; listing remains archived and recoverable",
    );
    return "blocked";
  } finally {
    client.release();
  }
}

export async function processDueBusinessDeletionHolds(
  pool: Pool,
  logger: BusinessDeletionHoldWorkerLogger,
  limit = 100,
): Promise<{ deleted: number; missing: number; blocked: number }> {
  const batchSize = Math.max(1, Math.min(limit, 500));
  const due = await pool.query<{ business_id: string }>(
    `SELECT business_id
       FROM business_deletion_holds
      WHERE state = 'pending'
        AND delete_after <= NOW()
      ORDER BY delete_after ASC, business_id ASC
      LIMIT $1`,
    [batchSize],
  );
  const results = { deleted: 0, missing: 0, blocked: 0 };
  for (const row of due.rows) {
    const outcome = await finalizeOneDueHold(pool, logger, row.business_id);
    if (outcome === "deleted") results.deleted += 1;
    else if (outcome === "missing") results.missing += 1;
    else if (outcome === "blocked") results.blocked += 1;
  }
  return results;
}

export function startBusinessDeletionHoldWorker(
  pool: Pool,
  logger: BusinessDeletionHoldWorkerLogger,
): () => void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await processDueBusinessDeletionHolds(pool, logger);
      if (result.deleted || result.missing || result.blocked) {
        logger.info(result, "Processed due seven-day business deletion holds");
      }
    } catch (error) {
      logger.error({ error }, "Business deletion hold worker pass failed");
    } finally {
      running = false;
    }
  };
  void run();
  const interval = setInterval(() => void run(), 5 * 60 * 1000);
  interval.unref();
  return () => clearInterval(interval);
}
