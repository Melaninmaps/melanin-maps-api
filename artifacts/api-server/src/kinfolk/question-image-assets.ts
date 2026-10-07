import { pool } from "@workspace/db";
import { kinfolkQuestionImageStorageClient } from "../lib/objectStorage";

const MAX_KINFOLK_QUESTION_IMAGES = 2;
const KINFOLK_QUESTION_IMAGE_RETENTION_MS = 15 * 60 * 1000;
const KINFOLK_QUESTION_IMAGE_MODEL_URL_MS = 5 * 60 * 1000;
const KINFOLK_QUESTION_IMAGE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PrivateStorageFile = {
  getSignedUrl(options: { action: "read"; expires: number }): Promise<[string]>;
  delete?(options?: { ignoreNotFound?: boolean }): Promise<unknown>;
};

type PrivateStorageClient = {
  bucket(bucketId: string): { file(objectKey: string): PrivateStorageFile };
};

type QuestionImageRow = {
  id: string;
  object_key: string;
  retention_expires_at: Date | string;
};

export class KinfolkQuestionImageError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: "VISION_CONSENT_REQUIRED" | "VISION_IMAGES_UNAVAILABLE" | "VISION_IMAGES_INVALID",
  ) {
    super(message);
  }
}

export function normalizeKinfolkQuestionImageAssetIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== "string") continue;
    const id = candidate.trim().toLowerCase();
    if (UUID_PATTERN.test(id)) unique.add(id);
  }
  return [...unique].slice(0, MAX_KINFOLK_QUESTION_IMAGES);
}

function privateBucketId(): string | null {
  // Kinfolk question images must never be mixed with general private media.
  // There is intentionally no fallback to DEFAULT_OBJECT_STORAGE_BUCKET_ID.
  return process.env.KINFOLK_MEDIA_BUCKET_ID?.trim() || null;
}

function asDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/**
 * Resolves one member's consented, private question images to short-lived URLs
 * only for the active model request. URLs are never returned to a browser or
 * stored in a Kinfolk session.
 */
export async function resolveConsentedKinfolkQuestionImages(input: {
  userId: string;
  assetIds: readonly string[];
  explicitVisionConsent: boolean;
  now?: Date;
  storageClient?: PrivateStorageClient;
}): Promise<string[]> {
  const assetIds = normalizeKinfolkQuestionImageAssetIds(input.assetIds);
  if (assetIds.length === 0) return [];
  if (!input.explicitVisionConsent) {
    throw new KinfolkQuestionImageError(
      "Choose whether to share the image with Kinfolk for this answer before sending it.",
      400,
      "VISION_CONSENT_REQUIRED",
    );
  }
  if (assetIds.length !== input.assetIds.length || input.assetIds.length > MAX_KINFOLK_QUESTION_IMAGES) {
    throw new KinfolkQuestionImageError(
      "Kinfolk can review up to two valid images at a time.",
      400,
      "VISION_IMAGES_INVALID",
    );
  }

  const now = input.now ?? new Date();
  const rows = await pool.query<QuestionImageRow>(
    `SELECT id, object_key, retention_expires_at
       FROM media_assets
      WHERE uploader_id = $1
        AND purpose = 'kinfolk_question'
        AND status = 'ready'
        AND mime_type LIKE 'image/%'
        AND vision_consent_granted_at IS NOT NULL
        AND retention_expires_at > NOW()
        AND deleted_at IS NULL
        AND id = ANY($2::uuid[])`,
    [input.userId, assetIds],
  ).catch(() => ({ rows: [] as QuestionImageRow[] }));

  const byId = new Map(rows.rows.map((row) => [row.id, row]));
  if (byId.size !== assetIds.length) {
    throw new KinfolkQuestionImageError(
      "One or more images are unavailable, expired, or do not belong to this account. Please add them again.",
      400,
      "VISION_IMAGES_INVALID",
    );
  }

  const bucketId = privateBucketId();
  if (!bucketId) {
    throw new KinfolkQuestionImageError(
      "Private image review is temporarily unavailable. Please try again later.",
      503,
      "VISION_IMAGES_UNAVAILABLE",
    );
  }

  const storageClient = input.storageClient ?? (kinfolkQuestionImageStorageClient as unknown as PrivateStorageClient);
  try {
    return await Promise.all(assetIds.map(async (id) => {
      const row = byId.get(id)!;
      const expiry = asDate(row.retention_expires_at);
      if (!expiry || expiry.getTime() <= now.getTime()) {
        throw new KinfolkQuestionImageError(
          "One or more images have expired. Please add them again.",
          400,
          "VISION_IMAGES_INVALID",
        );
      }
      const [signedUrl] = await storageClient.bucket(bucketId).file(row.object_key).getSignedUrl({
        action: "read",
        expires: Math.min(expiry.getTime(), now.getTime() + KINFOLK_QUESTION_IMAGE_MODEL_URL_MS),
      });
      return signedUrl;
    }));
  } catch (error) {
    if (error instanceof KinfolkQuestionImageError) throw error;
    throw new KinfolkQuestionImageError(
      "Private image review is temporarily unavailable. Please try again later.",
      503,
      "VISION_IMAGES_UNAVAILABLE",
    );
  }
}

export async function purgeKinfolkQuestionImages(input: {
  userId: string;
  assetIds: readonly string[];
  storageClient?: PrivateStorageClient;
}): Promise<{ deleted: number; pending: number }> {
  const assetIds = normalizeKinfolkQuestionImageAssetIds(input.assetIds);
  if (assetIds.length === 0) return { deleted: 0, pending: 0 };

  const rows = await pool.query<QuestionImageRow>(
    `SELECT id, object_key, retention_expires_at
       FROM media_assets
      WHERE uploader_id = $1
        AND purpose = 'kinfolk_question'
        AND status = 'ready'
        AND id = ANY($2::uuid[])`,
    [input.userId, assetIds],
  ).catch(() => ({ rows: [] as QuestionImageRow[] }));
  return deleteQuestionImageRows(rows.rows, input.storageClient, input.userId);
}

async function deleteQuestionImageRows(
  rows: readonly QuestionImageRow[],
  storageClient: PrivateStorageClient | undefined,
  ownerId?: string,
): Promise<{ deleted: number; pending: number }> {
  if (rows.length === 0) return { deleted: 0, pending: 0 };
  const bucketId = privateBucketId();
  if (!bucketId) return { deleted: 0, pending: rows.length };

  const client = storageClient ?? (kinfolkQuestionImageStorageClient as unknown as PrivateStorageClient);
  const deletedIds: string[] = [];
  for (const row of rows) {
    try {
      const file = client.bucket(bucketId).file(row.object_key);
      if (!file.delete) continue;
      await file.delete({ ignoreNotFound: true });
      deletedIds.push(row.id);
    } catch {
      // Leave the row ready so the bounded cleanup pass can retry without
      // recording object keys, URLs, or member content in logs.
    }
  }
  if (deletedIds.length > 0) {
    await pool.query(
      `UPDATE media_assets
          SET status = 'deleted', public_url = NULL, deleted_at = NOW()
        WHERE id = ANY($1::uuid[])
          AND ($2::text IS NULL OR uploader_id = $2)`,
      [deletedIds, ownerId ?? null],
    ).catch(() => undefined);
  }
  return { deleted: deletedIds.length, pending: rows.length - deletedIds.length };
}

export async function purgeExpiredKinfolkQuestionImages(input: {
  storageClient?: PrivateStorageClient;
  limit?: number;
} = {}): Promise<{ deleted: number; pending: number }> {
  const limit = Math.max(1, Math.min(100, Math.trunc(input.limit ?? 50)));
  const rows = await pool.query<QuestionImageRow>(
    `SELECT id, object_key, retention_expires_at
       FROM media_assets
      WHERE purpose = 'kinfolk_question'
        AND status = 'ready'
        AND retention_expires_at <= NOW()
      ORDER BY retention_expires_at ASC
      LIMIT $1`,
    [limit],
  ).catch(() => ({ rows: [] as QuestionImageRow[] }));
  return deleteQuestionImageRows(rows.rows, input.storageClient);
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startKinfolkQuestionImageRetentionScheduler(log: {
  info?: (payload: Record<string, unknown>, message: string) => void;
  warn?: (payload: Record<string, unknown>, message: string) => void;
}): void {
  if (cleanupTimer) return;
  const run = () => {
    void purgeExpiredKinfolkQuestionImages()
      .then(({ deleted, pending }) => {
        if (deleted > 0 || pending > 0) {
          log.info?.({ deleted, pending }, "Kinfolk private question-image cleanup completed");
        }
      })
      .catch(() => log.warn?.({}, "Kinfolk private question-image cleanup deferred"));
  };
  run();
  cleanupTimer = setInterval(run, KINFOLK_QUESTION_IMAGE_CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();
}

export function stopKinfolkQuestionImageRetentionScheduler(): void {
  if (!cleanupTimer) return;
  clearInterval(cleanupTimer);
  cleanupTimer = null;
}

export const KINFOLK_QUESTION_IMAGE_RETENTION_MINUTES = Math.round(
  KINFOLK_QUESTION_IMAGE_RETENTION_MS / 60_000,
);
