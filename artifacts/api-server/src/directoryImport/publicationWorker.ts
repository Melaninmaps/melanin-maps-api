import type { Pool } from "pg";
import { canonicalDirectoryPayload, directoryWorkerConcurrency, sha256Hex } from "./reviewPipeline";
import { publishDirectoryCommand } from "./productionPublisher";
import { geocodeDirectoryCandidate } from "./registerDirectoryImportRoutes";

const pause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function isPhysical(payload: Record<string, unknown>): boolean {
  return String(payload.target_kind ?? payload.targetKind ?? "business") !== "online_business";
}

function hasVerifiedCoordinates(payload: Record<string, unknown>): boolean {
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
}

/**
 * Coordinates are never invented. A single-concurrency worker resolves only a
 * numbered, source-backed physical address through the existing strict address
 * matcher. Any non-match is held for review rather than retried as a blind map
 * pin. The short pause also respects Nominatim's public-service rate guidance.
 */
async function preparePublicationPayload(
  reviewPool: Pool,
  row: { id: string; candidate_id: string; payload: Record<string, unknown> },
): Promise<{ payload: Record<string, unknown>; payloadHash: string } | null> {
  const payload = row.payload;
  if (!isPhysical(payload) || hasVerifiedCoordinates(payload)) {
    return { payload, payloadHash: sha256Hex(canonicalDirectoryPayload(payload)) };
  }

  await pause(1_100);
  const coordinates = await geocodeDirectoryCandidate({
    address: typeof payload.address === "string" ? payload.address : null,
    city: typeof payload.city === "string" ? payload.city : "",
    state: typeof payload.state === "string" ? payload.state : null,
  });
  if (!coordinates) {
    await reviewPool.query(`UPDATE directory_import_candidates SET status='needs_research',updated_at=now() WHERE id=$1`, [row.candidate_id]);
    await reviewPool.query(`UPDATE directory_review_outbox SET status='failed',last_error='geocode_unverified: held for review',
      available_at=now()+interval '365 days',lease_token=NULL,lease_until=NULL WHERE id=$1`, [row.id]);
    return null;
  }

  const enriched = {
    ...payload,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    location_evidence: coordinates,
  };
  const payloadHash = sha256Hex(canonicalDirectoryPayload(enriched));
  await reviewPool.query(`UPDATE directory_review_outbox SET payload=$2,payload_hash=$3,last_error=NULL WHERE id=$1`, [
    row.id,
    enriched,
    payloadHash,
  ]);
  return { payload: enriched, payloadHash };
}

export function startDirectoryPublicationWorker(
  reviewPool: Pool, productionPool: Pool, environment: NodeJS.ProcessEnv = process.env,
): (() => void) | null {
  if (environment.DIRECTORY_PUBLICATION_WORKER_ENABLED !== "1") return null;
  const batchChecksum = environment.DIRECTORY_PUBLICATION_BATCH_SHA256?.trim().toLowerCase() ?? "";
  if (!/^[a-f0-9]{64}$/.test(batchChecksum)) {
    throw new Error(
      "DIRECTORY_PUBLICATION_BATCH_SHA256 must be the exact 64-character manifest checksum for the one approved directory batch.",
    );
  }
  let stopped = false;
  const concurrency = directoryWorkerConcurrency(environment);
  const run = async () => {
    while (!stopped) {
      const result = await reviewPool.query(`WITH claim AS (
        SELECT o.id FROM directory_review_outbox o
        JOIN directory_import_candidates c ON c.id=o.candidate_id
        JOIN directory_import_batches b ON b.id=c.batch_id
        WHERE o.status IN ('pending','failed') AND o.available_at <= now()
        AND (lease_until IS NULL OR lease_until < now())
        AND b.source_sha256=$1
        ORDER BY o.created_at FOR UPDATE OF o SKIP LOCKED LIMIT 1)
        UPDATE directory_review_outbox o SET status='sending', lease_token=gen_random_uuid()::text,
        lease_until=now()+interval '2 minutes', attempts=attempts+1 FROM claim
        WHERE o.id=claim.id RETURNING o.*`, [batchChecksum]);
      const row = result.rows[0];
      if (!row) { await new Promise((resolve) => setTimeout(resolve, 1000)); continue; }
      try {
        const prepared = await preparePublicationPayload(reviewPool, row);
        if (!prepared) continue;
        await publishDirectoryCommand(productionPool, {
          eventKey: row.event_key, payload: prepared.payload, payloadHash: prepared.payloadHash,
        });
        await reviewPool.query(`UPDATE directory_review_outbox SET status='sent',sent_at=now(),
          lease_token=NULL,lease_until=NULL WHERE id=$1`, [row.id]);
        await reviewPool.query(`INSERT INTO directory_review_acknowledgements(event_key,payload_hash,status)
          VALUES($1,$2,'accepted') ON CONFLICT(event_key) DO UPDATE SET payload_hash=EXCLUDED.payload_hash`,
          [row.event_key, prepared.payloadHash]);
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
