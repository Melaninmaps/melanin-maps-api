import { randomUUID } from "node:crypto";

/**
 * Source-only retention executor for a separately approved scheduled worker.
 * It is deliberately not registered on API startup: enabling scheduling and
 * production data deletion need their own operational approval.
 */
export type JourneyRetentionClient = {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: T[]; rowCount?: number | null }>;
  release(): void;
};

export type JourneyRetentionPool = {
  connect(): Promise<JourneyRetentionClient>;
};

type ExpiredJourney = { id: string; user_id: string };

export type JourneyRetentionRun = Readonly<{
  scanned: number;
  deletedJourneyIds: string[];
}>;

/**
 * Removes expired, member-selected Journey content in bounded transactions.
 * Provider connections are account-scoped and are intentionally untouched.
 */
export async function expireMemberSelectedJourneys(input: {
  pool: JourneyRetentionPool;
  now?: Date;
  limit?: number;
}): Promise<JourneyRetentionRun> {
  const now = input.now ?? new Date();
  const limit = Math.max(1, Math.min(100, input.limit ?? 25));
  const client = await input.pool.connect();
  const deletedJourneyIds: string[] = [];

  try {
    await client.query("BEGIN");
    const candidates = await client.query<ExpiredJourney>(
      `SELECT id, user_id
       FROM kinfolk_journeys
       WHERE deleted_at IS NULL
         AND retention_policy = 'delete_after_trip'
         AND retention_expires_at IS NOT NULL
         AND retention_expires_at <= $1
       ORDER BY retention_expires_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT $2`,
      [now, limit],
    );

    for (const journey of candidates.rows) {
      await client.query(
        `UPDATE kinfolk_journey_imports
         SET status='deleted', parsed_facts='[]'::jsonb, deleted_at=$3
         WHERE journey_id=$1 AND user_id=$2 AND deleted_at IS NULL`,
        [journey.id, journey.user_id, now],
      );
      await client.query(
        `UPDATE kinfolk_journey_items
         SET payload='{}'::jsonb, status='cancelled', updated_at=$3
         WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, journey.user_id, now],
      );
      await client.query(
        `UPDATE kinfolk_journey_collaborators
         SET status='revoked', updated_at=$3
         WHERE journey_id=$1 AND owner_user_id=$2`,
        [journey.id, journey.user_id, now],
      );
      await client.query(
        `UPDATE kinfolk_journey_reminders
         SET state='deleted', updated_at=$3
         WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, journey.user_id, now],
      );
      await client.query(
        `UPDATE kinfolk_journeys
         SET status='deleted', deleted_at=$3, updated_at=$3
         WHERE id=$1 AND user_id=$2`,
        [journey.id, journey.user_id, now],
      );
      await client.query(
        `INSERT INTO kinfolk_journey_audit (id, journey_id, user_id, event_type, metadata)
         VALUES ($1,$2,$3,'journey_retention_expired',$4::jsonb)`,
        [
          randomUUID(),
          journey.id,
          journey.user_id,
          JSON.stringify({ localAccessRemoved: true }),
        ],
      );
      deletedJourneyIds.push(journey.id);
    }

    await client.query("COMMIT");
    return { scanned: candidates.rows.length, deletedJourneyIds };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
