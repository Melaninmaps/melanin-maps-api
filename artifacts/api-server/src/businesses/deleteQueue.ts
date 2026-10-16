export const DELETE_QUEUE_HOLD_DAYS = 7;
const HOLD_MILLISECONDS = DELETE_QUEUE_HOLD_DAYS * 24 * 60 * 60 * 1000;

export function getDeleteQueueEligibleAt(queuedAt: Date = new Date()): Date {
  return new Date(queuedAt.getTime() + HOLD_MILLISECONDS);
}

export function isDeleteQueueEligible(eligibleAt: Date | string, now: Date = new Date()): boolean {
  const time = new Date(eligibleAt).getTime();
  return Number.isFinite(time) && time <= now.getTime();
}

export function deleteQueueConfirmation(count: number): string {
  return `MOVE ${count} ${count === 1 ? "BUSINESS" : "BUSINESSES"} TO DELETE QUEUE`;
}

export function removeFromDeleteQueueConfirmation(count: number): string {
  return `REMOVE ${count} ${count === 1 ? "BUSINESS" : "BUSINESSES"} FROM DELETE QUEUE`;
}

export type DeleteQueueClient = {
  query: (statement: string, values?: readonly unknown[]) => Promise<unknown>;
};

/** Additive DDL only, called by explicit Admin mutations, never a startup job.
 * No backfill, data migration, expiry worker, or automatic deletion is installed.
 * Receipts have no business FK so evidence survives separately confirmed deletion.
 */
export async function ensureBusinessDeleteQueueSchema(client: DeleteQueueClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_delete_queue_entries (
      id UUID PRIMARY KEY,
      business_id TEXT NOT NULL,
      source_vault TEXT NOT NULL CHECK (source_vault IN ('archive', 'duplicates', 'permanently_closed')),
      queued_by_user_id TEXT,
      reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
      snapshot JSONB NOT NULL,
      queued_at TIMESTAMPTZ NOT NULL,
      eligible_at TIMESTAMPTZ NOT NULL CHECK (eligible_at >= queued_at + INTERVAL '168 hours'),
      removed_at TIMESTAMPTZ,
      removed_by_user_id TEXT,
      removal_reason TEXT,
      permanent_deleted_at TIMESTAMPTZ
    )
  `);
  // Older reference queue tables may exist even when this release has no UI.
  // Add the evidence column without backfilling or moving any business record.
  await client.query(`
    ALTER TABLE business_delete_queue_entries
      ADD COLUMN IF NOT EXISTS snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE business_delete_queue_entries
      DROP CONSTRAINT IF EXISTS business_delete_queue_entries_source_vault_check;
    ALTER TABLE business_delete_queue_entries
      ADD CONSTRAINT business_delete_queue_entries_source_vault_check
      CHECK (source_vault IN ('archive', 'duplicates', 'permanently_closed'));
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS business_delete_queue_active_business_idx
      ON business_delete_queue_entries(business_id)
      WHERE removed_at IS NULL AND permanent_deleted_at IS NULL
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_delete_queue_events (
      id UUID PRIMARY KEY,
      business_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('queued', 'removed', 'permanently_deleted')),
      actor_user_id TEXT,
      details JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE OR REPLACE FUNCTION public.prevent_business_delete_queue_event_mutation()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'business_delete_queue_events are immutable';
    END;
    $$;
    DROP TRIGGER IF EXISTS business_delete_queue_events_immutable ON business_delete_queue_events;
    CREATE TRIGGER business_delete_queue_events_immutable
      BEFORE UPDATE OR DELETE ON business_delete_queue_events
      FOR EACH ROW EXECUTE FUNCTION public.prevent_business_delete_queue_event_mutation();

    CREATE OR REPLACE FUNCTION public.prevent_business_delete_queue_receipt_mutation()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'business_delete_queue_entries receipts must be retained';
      END IF;
      IF (to_jsonb(OLD) - ARRAY['removed_at', 'removed_by_user_id', 'removal_reason', 'permanent_deleted_at'])
        IS DISTINCT FROM
         (to_jsonb(NEW) - ARRAY['removed_at', 'removed_by_user_id', 'removal_reason', 'permanent_deleted_at']) THEN
        RAISE EXCEPTION 'business_delete_queue_entries original evidence and retention clock are immutable';
      END IF;
      RETURN NEW;
    END;
    $$;
    DROP TRIGGER IF EXISTS business_delete_queue_entries_receipts_immutable ON business_delete_queue_entries;
    CREATE TRIGGER business_delete_queue_entries_receipts_immutable
      BEFORE UPDATE OR DELETE ON business_delete_queue_entries
      FOR EACH ROW EXECUTE FUNCTION public.prevent_business_delete_queue_receipt_mutation();

    CREATE OR REPLACE FUNCTION public.prevent_active_delete_queue_lifecycle_mutation()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM business_delete_queue_entries queue
         WHERE queue.business_id::text = OLD.id::text
           AND queue.removed_at IS NULL AND queue.permanent_deleted_at IS NULL
      ) AND (
        NEW.listing_status IS DISTINCT FROM 'archived'
        OR NEW.status IS DISTINCT FROM 'suspended'
        OR NEW.promotion_eligible IS DISTINCT FROM false
        OR NEW.featured IS DISTINCT FROM false
        OR NEW.promoted_until IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Business % is in Delete Queue and must remain nonpublic', OLD.id;
      END IF;
      RETURN NEW;
    END;
    $$;
    DROP TRIGGER IF EXISTS businesses_prevent_active_delete_queue_lifecycle_mutation ON businesses;
    CREATE TRIGGER businesses_prevent_active_delete_queue_lifecycle_mutation
      BEFORE UPDATE OF listing_status, status, promotion_eligible, featured, promoted_until ON businesses
      FOR EACH ROW EXECUTE FUNCTION public.prevent_active_delete_queue_lifecycle_mutation();

    CREATE OR REPLACE FUNCTION public.prevent_active_delete_queue_deletion()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM business_delete_queue_entries queue
         WHERE queue.business_id::text = OLD.id::text
           AND queue.removed_at IS NULL AND queue.permanent_deleted_at IS NULL
      ) THEN
        RAISE EXCEPTION 'Business % requires separately confirmed eligible Delete Queue deletion', OLD.id;
      END IF;
      RETURN OLD;
    END;
    $$;
    DROP TRIGGER IF EXISTS businesses_prevent_active_delete_queue_deletion ON businesses;
    CREATE TRIGGER businesses_prevent_active_delete_queue_deletion
      BEFORE DELETE ON businesses
      FOR EACH ROW EXECUTE FUNCTION public.prevent_active_delete_queue_deletion();
  `);
}
