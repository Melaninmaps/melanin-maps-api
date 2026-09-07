/** Durable retention worker for consented Discovery V1 events. */
export type DiscoveryRetentionDb = {
  query<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: T[]; rowCount?: number | null }>;
};

export async function runDiscoveryRetentionSweep(db: DiscoveryRetentionDb): Promise<number> {
  await db.query(`
    INSERT INTO discovery_retention_jobs (job_name, last_started_at, last_error, updated_at)
    VALUES ('discovery_events_v1', NOW(), NULL, NOW())
    ON CONFLICT (job_name) DO UPDATE SET last_started_at=EXCLUDED.last_started_at, last_error=NULL, updated_at=NOW()
  `);
  try {
    const deleted = await db.query(`DELETE FROM discovery_events_v1 WHERE retention_expires_at <= NOW()`);
    const count = deleted.rowCount ?? 0;
    await db.query(`
      UPDATE discovery_retention_jobs
      SET last_succeeded_at=NOW(), deleted_count=$1, last_error=NULL, updated_at=NOW()
      WHERE job_name='discovery_events_v1'
    `, [count]);
    return count;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "unknown retention failure";
    await db.query(`
      UPDATE discovery_retention_jobs
      SET last_failed_at=NOW(), last_error=$1, updated_at=NOW()
      WHERE job_name='discovery_events_v1'
    `, [message]).catch(() => undefined);
    throw error;
  }
}