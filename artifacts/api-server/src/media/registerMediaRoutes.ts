import { type Express, type Request, type Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import {
  getObjectStorageDiagnostics,
  objectStorageClient,
  ObjectStorageConfigurationError,
} from "../lib/objectStorage";
import { pool } from "@workspace/db";

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);
const DOC_MIMES = new Set([
  "application/pdf",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_DOC_BYTES = 10 * 1024 * 1024;
const MAX_KINFOLK_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PURPOSES = new Set([
  "general", "community_post", "business_submission", "business_claim", "business_photo", "kinfolk_question",
]);

export const MEDIA_UPLOAD_ERROR_CODES = {
  FILE_REQUIRED: "MEDIA_FILE_REQUIRED",
  PURPOSE_UNSUPPORTED: "MEDIA_PURPOSE_UNSUPPORTED",
  UNSUPPORTED_TYPE: "MEDIA_UNSUPPORTED_TYPE",
  SIZE_LIMIT: "MEDIA_SIZE_LIMIT",
  STORAGE_NOT_CONFIGURED: "MEDIA_STORAGE_NOT_CONFIGURED",
  STORAGE_AUTH_FAILED: "MEDIA_STORAGE_AUTH_FAILED",
  STORAGE_SAVE_FAILED: "MEDIA_STORAGE_SAVE_FAILED",
  PUBLICATION_FAILED: "MEDIA_PUBLICATION_FAILED",
} as const;

type MediaUploadErrorCode = typeof MEDIA_UPLOAD_ERROR_CODES[keyof typeof MEDIA_UPLOAD_ERROR_CODES];
type PublicationMode = "object_acl" | "bucket_iam";

type StorageFile = {
  save(data: Buffer, options: { contentType: string }): Promise<unknown>;
  makePublic(): Promise<unknown>;
  getSignedUrl(options: { action: "read"; expires: number }): Promise<[string]>;
  delete?(options?: { ignoreNotFound?: boolean }): Promise<unknown>;
};
type StorageClient = {
  bucket(bucketId: string): { file(objectKey: string): StorageFile };
};

type RegisterMediaRouteOptions = {
  storageClient?: StorageClient;
  recordAsset?: (values: readonly unknown[]) => Promise<unknown>;
};

type PublicDeliveryConfiguration = {
  mode: PublicationMode;
  bucketId: string | null;
  publicBaseUrl: string | null;
  blocker: string | null;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES },
});

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/pjpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "application/pdf": "pdf",
  };
  return map[mime] ?? "bin";
}

function getRequestId(req: Request, res: Response): string {
  const existing = res.getHeader("x-request-id");
  const incoming = req.header("x-request-id");
  const candidate = typeof existing === "string"
    ? existing
    : typeof incoming === "string"
    ? incoming
    : typeof req.id === "string"
    ? req.id
    : "";
  // Request IDs are returned to clients and logged; reject malformed values rather
  // than reflecting header control characters or unbounded caller-supplied text.
  const requestId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(candidate)
    ? candidate
    : randomUUID();
  res.setHeader("x-request-id", requestId);
  return requestId;
}

function respondWithError(
  res: Response,
  status: number,
  code: MediaUploadErrorCode,
  error: string,
  requestId: string,
): void {
  res.status(status).json({ error, code, requestId });
}

function providerErrorDetails(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") return { errorType: "UnknownProviderError" };
  const value = error as Record<string, unknown>;
  const rawCode = value.code ?? value.statusCode ?? value.status;
  // Provider string codes can contain opaque credentials; retain only a numeric
  // status for operations and never log provider-supplied messages.
  const providerCode = typeof rawCode === "number" ? String(rawCode) : undefined;
  const status = typeof value.statusCode === "number"
    ? value.statusCode
    : typeof value.status === "number"
    ? value.status
    : typeof value.code === "number"
    ? value.code
    : undefined;
  return {
    errorType: (error as { constructor?: { name?: string } }).constructor?.name ?? "ProviderError",
    ...(providerCode ? { providerCode } : {}),
    ...(status ? { providerStatus: status } : {}),
  };
}

function isProviderAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as Record<string, unknown>;
  const status = value.statusCode ?? value.status ?? value.code;
  if (status === 401 || status === 403 || status === "401" || status === "403") return true;
  const message = typeof value.message === "string" ? value.message.toLowerCase() : "";
  return message.includes("credential") || message.includes("unauthenticated") || message.includes("invalid_grant");
}

function logUploadFailure(
  req: Request,
  level: "warn" | "error",
  payload: Record<string, unknown>,
  message: string,
): void {
  // Only operational enums and provider status/code are logged. Filenames,
  // buffers, credential JSON, signed URLs, and provider messages are excluded.
  if (level === "error") req.log?.error(payload, message);
  else req.log?.warn(payload, message);
}

function normalizePublicBaseUrl(raw: string | undefined): string | null {
  const value = raw?.trim().replace(/\/+$/, "");
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:")
      ? url.toString().replace(/\/+$/, "")
      : null;
  } catch {
    return null;
  }
}

function getPublicDeliveryConfiguration(): PublicDeliveryConfiguration {
  const rawMode = process.env.MEDIA_PUBLICATION_MODE?.trim().toLowerCase();
  const rawPublicBase = process.env.MEDIA_PUBLIC_BASE_URL?.trim();
  const publicBaseUrl = normalizePublicBaseUrl(rawPublicBase);
  if (rawPublicBase && !publicBaseUrl) {
    return { mode: "bucket_iam", bucketId: null, publicBaseUrl: null, blocker: "MEDIA_PUBLIC_BASE_URL must be an HTTPS URL." };
  }
  if (rawMode && rawMode !== "object_acl" && rawMode !== "bucket_iam") {
    return { mode: "object_acl", bucketId: null, publicBaseUrl, blocker: "MEDIA_PUBLICATION_MODE must be object_acl or bucket_iam." };
  }

  const mode: PublicationMode = rawMode === "bucket_iam" || (!rawMode && publicBaseUrl)
    ? "bucket_iam"
    : "object_acl";
  const privateBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID?.trim() || null;
  const dedicatedPublicBucketId = process.env.PUBLIC_MEDIA_BUCKET_ID?.trim() || null;

  if (mode === "bucket_iam") {
    if (!dedicatedPublicBucketId) {
      return { mode, bucketId: null, publicBaseUrl, blocker: "PUBLIC_MEDIA_BUCKET_ID is required for bucket-IAM/public-base delivery." };
    }
    if (privateBucketId && dedicatedPublicBucketId === privateBucketId) {
      return { mode, bucketId: null, publicBaseUrl, blocker: "PUBLIC_MEDIA_BUCKET_ID must be separate from the private object-storage bucket." };
    }
    return { mode, bucketId: dedicatedPublicBucketId, publicBaseUrl, blocker: null };
  }

  // Object-level ACL publication still exposes the full object to the internet.
  // Never fall back to DEFAULT_OBJECT_STORAGE_BUCKET_ID: that bucket can also hold
  // private object entities and must not become a mixed public/private bucket.
  if (!dedicatedPublicBucketId) {
    return { mode, bucketId: null, publicBaseUrl, blocker: "PUBLIC_MEDIA_BUCKET_ID is required for public media uploads." };
  }
  if (privateBucketId && dedicatedPublicBucketId === privateBucketId) {
    return { mode, bucketId: null, publicBaseUrl, blocker: "PUBLIC_MEDIA_BUCKET_ID must be separate from the private object-storage bucket." };
  }
  return { mode, bucketId: dedicatedPublicBucketId, publicBaseUrl, blocker: null };
}

function publicObjectUrl(configuration: PublicDeliveryConfiguration, objectKey: string): string {
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  if (configuration.publicBaseUrl) return `${configuration.publicBaseUrl}/${encodedKey}`;
  return `https://storage.googleapis.com/${encodeURIComponent(configuration.bucketId!)}/${encodedKey}`;
}

export function getMediaUploadReadiness(): Record<string, unknown> {
  const storage = getObjectStorageDiagnostics();
  const delivery = getPublicDeliveryConfiguration();
  const privateBucketConfigured = Boolean(process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID?.trim());
  const blockers = [
    ...(storage.configured ? [] : ["Object-storage credential mode is invalid or incomplete."]),
    ...(delivery.blocker ? [delivery.blocker] : []),
    ...(privateBucketConfigured ? [] : ["DEFAULT_OBJECT_STORAGE_BUCKET_ID is required for private Kinfolk uploads."]),
  ];
  return {
    ready: blockers.length === 0,
    credentialMode: storage.credentialMode,
    publicDeliveryMode: delivery.mode,
    publicBucketConfigured: Boolean(delivery.bucketId),
    privateBucketConfigured,
    publicBaseConfigured: Boolean(delivery.publicBaseUrl),
    blockers,
  };
}

async function bestEffortDelete(file: StorageFile): Promise<void> {
  if (!file.delete) return;
  await file.delete({ ignoreNotFound: true }).catch(() => undefined);
}

export function registerMediaRoutes(app: Express, options: RegisterMediaRouteOptions = {}): void {
  const storageClient = options.storageClient ?? objectStorageClient as unknown as StorageClient;
  const recordAsset = options.recordAsset ?? (async (values: readonly unknown[]) => pool.query(
    `INSERT INTO media_assets
       (id, uploader_id, purpose, mime_type, byte_size, object_key,
        public_url, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'ready',NOW())
     ON CONFLICT (id) DO NOTHING`,
    [...values],
  ));

  app.get("/api/media/readiness", (req: Request, res: Response) => {
    const requestId = getRequestId(req, res);
    const user = (req as Request & { user?: { id?: string } }).user;
    if (!user?.id) {
      res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED", requestId });
      return;
    }
    const readiness = getMediaUploadReadiness();
    res.status(readiness.ready ? 200 : 503).json({ ...readiness, requestId });
  });

  app.post("/api/media/upload", (req: Request, res: Response) => {
    const requestId = getRequestId(req, res);
    upload.single("file")(req, res, (uploadError: unknown) => {
      if (uploadError) {
        const isSizeError = uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE";
        const code = isSizeError ? MEDIA_UPLOAD_ERROR_CODES.SIZE_LIMIT : MEDIA_UPLOAD_ERROR_CODES.STORAGE_SAVE_FAILED;
        logUploadFailure(req, isSizeError ? "warn" : "error", {
          event: "media_upload_rejected",
          requestId,
          code,
          ...providerErrorDetails(uploadError),
        }, "Media upload multipart processing failed");
        respondWithError(
          res,
          isSizeError ? 413 : 500,
          code,
          isSizeError ? "Files must be under 50 MB." : "Upload failed before the file could be processed.",
          requestId,
        );
        return;
      }
      void handleMediaUpload(req, res, requestId, storageClient, recordAsset);
    });
  });
}

async function handleMediaUpload(
  req: Request,
  res: Response,
  requestId: string,
  storageClient: StorageClient,
  recordAsset: (values: readonly unknown[]) => Promise<unknown>,
): Promise<void> {
  const user = (req as Request & { user?: { id?: string } }).user;
  if (!user?.id) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED", requestId });
    return;
  }
  if (!req.file) {
    respondWithError(res, 400, MEDIA_UPLOAD_ERROR_CODES.FILE_REQUIRED, "No file provided.", requestId);
    return;
  }

  const purpose = (req.query["purpose"] as string) ?? "general";
  if (!ALLOWED_PURPOSES.has(purpose)) {
    respondWithError(res, 400, MEDIA_UPLOAD_ERROR_CODES.PURPOSE_UNSUPPORTED, "Unsupported upload purpose.", requestId);
    return;
  }

  const mime = req.file.mimetype.toLowerCase();
  const isImage = IMAGE_MIMES.has(mime);
  const isVideo = VIDEO_MIMES.has(mime);
  const isDoc = DOC_MIMES.has(mime);
  if (!isImage && !isVideo && !isDoc) {
    logUploadFailure(req, "warn", { event: "media_upload_rejected", requestId, code: MEDIA_UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE, purpose, mime }, "Media upload type rejected");
    respondWithError(res, 415, MEDIA_UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE, "File type not supported. Please upload JPEG, PNG, WebP, HEIC, MP4, MOV, WebM, or PDF.", requestId);
    return;
  }

  const maximumBytes = isVideo ? MAX_VIDEO_BYTES : isDoc ? MAX_DOC_BYTES : MAX_IMAGE_BYTES;
  if (req.file.size > maximumBytes) {
    logUploadFailure(req, "warn", { event: "media_upload_rejected", requestId, code: MEDIA_UPLOAD_ERROR_CODES.SIZE_LIMIT, purpose, mime, byteSize: req.file.size, maximumBytes }, "Media upload size rejected");
    const message = isVideo ? "Video files must be under 50 MB." : isDoc ? "Documents must be under 10 MB." : "Image files must be under 10 MB.";
    respondWithError(res, 413, MEDIA_UPLOAD_ERROR_CODES.SIZE_LIMIT, message, requestId);
    return;
  }
  if (purpose === "kinfolk_question" && (!isImage || req.file.size > MAX_KINFOLK_IMAGE_BYTES)) {
    const status = !isImage ? 415 : 413;
    const code = !isImage ? MEDIA_UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE : MEDIA_UPLOAD_ERROR_CODES.SIZE_LIMIT;
    respondWithError(res, status, code, !isImage ? "Kinfolk questions currently accept images only." : "Kinfolk images must be under 5 MB.", requestId);
    return;
  }

  const isPrivate = purpose === "kinfolk_question";
  const delivery = getPublicDeliveryConfiguration();
  const bucketId = isPrivate ? process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID?.trim() || null : delivery.bucketId;
  const configurationBlocker = isPrivate && !bucketId ? "DEFAULT_OBJECT_STORAGE_BUCKET_ID is required." : delivery.blocker;
  if (!bucketId || configurationBlocker) {
    logUploadFailure(req, "error", {
      event: "media_upload_failed",
      requestId,
      code: MEDIA_UPLOAD_ERROR_CODES.STORAGE_NOT_CONFIGURED,
      purpose,
      credentialMode: getObjectStorageDiagnostics().credentialMode,
      publicationMode: delivery.mode,
      configurationBlocker,
    }, "Media upload storage configuration is incomplete");
    respondWithError(res, 503, MEDIA_UPLOAD_ERROR_CODES.STORAGE_NOT_CONFIGURED, "Media storage is not configured for this deployment. Contact support with the request ID.", requestId);
    return;
  }

  const ext = extFromMime(mime);
  const folder = isPrivate
    ? "media-uploads/kinfolk-private"
    : isVideo
    ? "media-uploads/videos"
    : isDoc
    ? "media-uploads/docs"
    : "media-uploads/images";
  const assetId = randomUUID();
  const objectKey = `${folder}/${user.id}/${assetId}.${ext}`;
  let storageFile: StorageFile;

  try {
    storageFile = storageClient.bucket(bucketId).file(objectKey);
    await storageFile.save(req.file.buffer, { contentType: mime });
  } catch (error: unknown) {
    const authFailure = error instanceof ObjectStorageConfigurationError || isProviderAuthError(error);
    const code = authFailure ? MEDIA_UPLOAD_ERROR_CODES.STORAGE_AUTH_FAILED : MEDIA_UPLOAD_ERROR_CODES.STORAGE_SAVE_FAILED;
    logUploadFailure(req, "error", {
      event: "media_upload_failed",
      requestId,
      code,
      purpose,
      mime,
      byteSize: req.file.size,
      credentialMode: getObjectStorageDiagnostics().credentialMode,
      ...providerErrorDetails(error),
    }, authFailure ? "Media storage authentication failed" : "Media storage save failed");
    respondWithError(res, 502, code, authFailure ? "Media storage authentication failed. Contact support with the request ID." : "The media provider could not save this file. Try again or contact support with the request ID.", requestId);
    return;
  }

  let url: string;
  try {
    if (isPrivate) {
      const [signedUrl] = await storageFile.getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
      url = signedUrl;
    } else {
      if (delivery.mode === "object_acl") await storageFile.makePublic();
      url = publicObjectUrl(delivery, objectKey);
    }
  } catch (error: unknown) {
    await bestEffortDelete(storageFile);
    logUploadFailure(req, "error", {
      event: "media_upload_failed",
      requestId,
      code: MEDIA_UPLOAD_ERROR_CODES.PUBLICATION_FAILED,
      purpose,
      publicationMode: isPrivate ? "signed_url" : delivery.mode,
      ...providerErrorDetails(error),
    }, "Media publication failed");
    respondWithError(res, 502, MEDIA_UPLOAD_ERROR_CODES.PUBLICATION_FAILED, "The file was saved but could not be made available. Try again or contact support with the request ID.", requestId);
    return;
  }

  await recordAsset([assetId, user.id, purpose, mime, req.file.size, objectKey, url]).catch((error: unknown) => {
    logUploadFailure(req, "warn", {
      event: "media_asset_record_failed",
      requestId,
      purpose,
      ...providerErrorDetails(error),
    }, "Media asset tracking record failed");
  });

  const fileType = isVideo ? "video" : isImage ? "image" : "document";
  res.status(201).json({
    url,
    assetId,
    type: fileType,
    requestId,
    expiresAt: isPrivate ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
  });
}
