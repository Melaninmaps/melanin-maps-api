import { pool } from "@workspace/db";
import { isTemporaryStayExpired, openTemporaryStay } from "./temporary-stays-policy";

type TemporaryStayRetentionRow = Readonly<{
  id: string;
  user_id: string;
  encrypted_payload: string;
  encryption_key_version: string;
}>;

type Queryable = Pick<typeof pool, "query">;

type RetentionLogger = Readonly<{
  info?: (payload: Record<string, unknown>, message: string) => void;
  warn?: (payload: Record<string, unknown>, message: string) => void;
}>;

const TEMPORARY_STAY_RETENTION_INTERVAL_MS = 5 * 60 * 1_000;
let retentionTimer: NodeJS.Timeout | undefined;

/**
 * Delete only rows whose encrypted departure date is past the visible grace
 * window. Rows that cannot be decrypted are deliberately retained and reported
 * only as a count; no cipher, address, coordinate, label, or provider error is
 * ever written to logs.
 */
export async function purgeExpiredTemporaryStays(input: {
  database?: Queryable;
  environment?: NodeJS.ProcessEnv;
  ownerId?: string;
  now?: Date;
  limit?: number;
} = {}): Promise<{ deleted: number; retainedUnreadable: number; scanned: number }> {
  const database = input.database ?? pool;
  const limit = Math.max(1, Math.min(100, Math.trunc(input.limit ?? 50)));
  const now = input.now ?? new Date();
  const rows = input.ownerId
    ? await database.query<TemporaryStayRetentionRow>(
      `SELECT id, user_id, encrypted_payload, encryption_key_version
         FROM kinfolk_temporary_stays
        WHERE user_id = $1
        ORDER BY updated_at ASC
        LIMIT $2`,
      [input.ownerId, limit],
    )
    : await database.query<TemporaryStayRetentionRow>(
      `SELECT id, user_id, encrypted_payload, encryption_key_version
         FROM kinfolk_temporary_stays
        ORDER BY updated_at ASC
        LIMIT $1`,
      [limit],
    );

  let deleted = 0;
  let retainedUnreadable = 0;
  for (const row of rows.rows) {
    try {
      const payload = openTemporaryStay(row.encrypted_payload, row.encryption_key_version, input.environment);
      if (!isTemporaryStayExpired(payload, now)) continue;
      const result = await database.query(
        "DELETE FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2 RETURNING id",
        [row.id, row.user_id],
      );
      if (result.rowCount === 1) deleted += 1;
    } catch {
      retainedUnreadable += 1;
    }
  }
  return { deleted, retainedUnreadable, scanned: rows.rows.length };
}

export function startTemporaryStayRetentionScheduler(log: RetentionLogger = {}): void {
  if (retentionTimer) return;
  const run = () => {
    void purgeExpiredTemporaryStays()
      .then(({ deleted, retainedUnreadable, scanned }) => {
        if (deleted > 0 || retainedUnreadable > 0) {
          log.info?.({ deleted, retainedUnreadable, scanned }, "Temporary Stay retention cleanup completed");
        }
      })
      .catch(() => log.warn?.({}, "Temporary Stay retention cleanup deferred"));
  };
  run();
  retentionTimer = setInterval(run, TEMPORARY_STAY_RETENTION_INTERVAL_MS);
  retentionTimer.unref?.();
}

export function stopTemporaryStayRetentionScheduler(): void {
  if (!retentionTimer) return;
  clearInterval(retentionTimer);
  retentionTimer = undefined;
}
