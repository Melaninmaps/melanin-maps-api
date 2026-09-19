import type { Pool } from "pg";
import { directoryWorkerConcurrency } from "./reviewPipeline";
import { publishDirectoryCommand } from "./productionPublisher";

export function startDirectoryPublicationWorker(
  reviewPool: Pool, productionPool: Pool, environment: NodeJS.ProcessEnv = process.env,
): (() => void) | null {
  if (environment.DIRECTORY_PUBLICATION_WORKER_ENABLED !== "1") return null;
  let stopped = false;
  const concurrency = directoryWorkerConcurrency(environment);
  const run = async () => {
    while (!stopped) {
      const result = await reviewPool.query(`WITH claim AS (
        SELECT id FROM directory_review_outbox
        WHERE status IN ('pending','failed') AND available_at <= now()
        AND (lease_until IS NULL OR lease_until < now())
        ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)
        UPDATE directory_review_outbox o SET status='sending', lease_token=gen_random_uuid()::text,
        lease_until=now()+interval '2 minutes', attempts=attempts+1 FROM claim
        WHERE o.id=claim.id RETURNING o.*`);
      const row = result.rows[0];
      if (!row) { await new Promise((resolve) => setTimeout(resolve, 1000)); continue; }
      try {
        await publishDirectoryCommand(productionPool, {
          eventKey: row.event_key, payload: row.payload, payloadHash: row.payload_hash,
        });
        await reviewPool.query(`UPDATE directory_review_outbox SET status='sent',sent_at=now(),
          lease_token=NULL,lease_until=NULL WHERE id=$1`, [row.id]);
        await reviewPool.query(`INSERT INTO directory_review_acknowledgements(event_key,payload_hash,status)
          VALUES($1,$2,'accepted') ON CONFLICT(event_key) DO UPDATE SET payload_hash=EXCLUDED.payload_hash`,
          [row.event_key, row.payload_hash]);
      } catch (error) {
        await reviewPool.query(`UPDATE directory_review_outbox SET status='failed',
          last_error=$2,available_at=now()+interval '1 minute',lease_token=NULL,lease_until=NULL WHERE id=$1`,
          [row.id, String(error)]);
      }
    }
  };
  for (let i = 0; i < concurrency; i++) void run();
  return () => { stopped = true; };
}