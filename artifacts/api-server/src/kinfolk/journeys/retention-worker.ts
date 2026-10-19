import { randomUUID } from "node:crypto";
import { objectStorageClient } from "../../lib/objectStorage";

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
type JourneyPrivateAsset = { id: string; object_key: string };

export type JourneyPrivateStorageClient = {
  bucket(bucketId: string): {
    file(objectKey: string): {
      delete(options: { ignoreNotFound: true }): Promise<unknown>;
    };
  };
};

export type JourneyRetentionRun = Readonly<{
  scanned: number;
  deletedJourneyIds: string[];
}>;

function privateJourneyBucketId(): string {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID?.trim();
  if (!bucketId) {
    throw new Error(
      "Journey retention requires private object storage configuration.",
    );
  }
  return bucketId;
}

async function purgeExclusivelyOwnedPrivateJourneyAssets(input: {
  client: JourneyRetentionClient;
  journey: ExpiredJourney;
  storageClient: JourneyPrivateStorageClient;
}): Promise<void> {
  const assets = await input.client.query<JourneyPrivateAsset>(
    `SELECT media_asset.id::text AS id, media_asset.object_key
       FROM media_assets AS media_asset
      WHERE media_asset.uploader_id=$2
        AND media_asset.purpose='kinfolk_journey_private'
        AND media_asset.status='ready'
        AND EXISTS (
          SELECT 1
            FROM kinfolk_journey_imports AS journey_import
           WHERE journey_import.journey_id=$1
             AND journey_import.user_id=$2
             AND journey_import.deleted_at IS NULL
             AND journey_import.asset_id=media_asset.id::text
        )
        AND NOT EXISTS (
          SELECT 1
            FROM kinfolk_journey_imports AS active_import
           WHERE active_import.user_id=$2
             AND active_import.journey_id<>$1
             AND active_import.deleted_at IS NULL
             AND active_import.asset_id=media_asset.id::text
        )
      FOR UPDATE`,
    [input.journey.id, input.journey.user_id],
  );
  if (assets.rows.length === 0) return;

  const bucket = input.storageClient.bucket(privateJourneyBucketId());
  for (const asset of assets.rows) {
    await bucket.file(asset.object_key).delete({ ignoreNotFound: true });
  }
  await input.client.query(
    `DELETE FROM media_assets
      WHERE uploader_id=$1
        AND purpose='kinfolk_journey_private'
        AND status='ready'
        AND id::text = ANY($2::text[])`,
    [input.journey.user_id, assets.rows.map((asset) => asset.id)],
  );
}

/**
 * Removes expired, member-selected Journey content in bounded transactions.
 * Provider connections are account-scoped and are intentionally untouched.
 */
export async function expireMemberSelectedJourneys(input: {
  pool: JourneyRetentionPool;
  storageClient?: JourneyPrivateStorageClient;
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
      await purgeExclusivelyOwnedPrivateJourneyAssets({
        client,
        journey,
        storageClient:
          input.storageClient ??
          (objectStorageClient as unknown as JourneyPrivateStorageClient),
      });
      await client.query(
        `DELETE FROM kinfolk_journey_sources
         WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, journey.user_id],
      );
      await client.query(
        `DELETE FROM kinfolk_journey_imports
         WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, journey.user_id],
      );
      await client.query(
        `DELETE FROM kinfolk_journey_items
         WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, journey.user_id],
      );
      await client.query(
        `DELETE FROM kinfolk_journey_collaborators
         WHERE journey_id=$1 AND owner_user_id=$2`,
        [journey.id, journey.user_id],
      );
      await client.query(
        `DELETE FROM kinfolk_journey_reminders
         WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, journey.user_id],
      );
      await client.query(
        `DELETE FROM kinfolk_journey_flight_watches
         WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, journey.user_id],
      );
      await client.query(
        `DELETE FROM kinfolk_journey_audit
         WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, journey.user_id],
      );
      await client.query(
        `UPDATE kinfolk_journeys
         SET status='deleted',
             title='Removed private Journey',
             destination_label=NULL,
             destination_city=NULL,
             destination_region=NULL,
             time_zone=NULL,
             start_date=NULL,
             end_date=NULL,
             preferences='{}'::jsonb,
             origin_kinfolk_session_id=NULL,
             retention_policy='keep_until_deleted',
             retention_expires_at=NULL,
             deleted_at=$3,
             updated_at=$3
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
          JSON.stringify({ localAccessRemoved: true, contentPurged: true }),
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
