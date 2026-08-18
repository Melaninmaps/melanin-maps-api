import { type Express, type Request, type Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { objectStorageClient } from "../lib/objectStorage";
import { pool } from "@workspace/db";

// ── MIME type allow-lists ─────────────────────────────────────────────────
const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
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
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_DOC_BYTES = 10 * 1024 * 1024;   // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES },
});

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
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

export function registerMediaRoutes(app: Express): void {
  // ── POST /api/media/upload ─────────────────────────────────────────────
  // Authenticated — upload a single file (image, video, or document).
  // Returns { url, assetId, type } on success.
  // The returned URL is a public GCS URL; assetId is a DB record for tracking.
  //
  // Query params:
  //   ?purpose=community_post|business_submission|business_claim|business_photo
  app.post(
    "/api/media/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user?.id) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const purpose = (req.query["purpose"] as string) ?? "general";
      const mime = req.file.mimetype;

      // ── Validate MIME type ──────────────────────────────────────────────
      const isImage = IMAGE_MIMES.has(mime);
      const isVideo = VIDEO_MIMES.has(mime);
      const isDoc = DOC_MIMES.has(mime);

      if (!isImage && !isVideo && !isDoc) {
        res.status(415).json({
          error: "File type not supported. Please upload JPEG, PNG, WebP, HEIC, MP4, MOV, or PDF.",
        });
        return;
      }

      // ── Enforce size limits ─────────────────────────────────────────────
      if (isVideo && req.file.size > MAX_VIDEO_BYTES) {
        res.status(413).json({ error: "Video files must be under 50 MB." });
        return;
      }
      if (!isVideo && req.file.size > MAX_IMAGE_BYTES) {
        res.status(413).json({
          error: isDoc
            ? "Documents must be under 10 MB."
            : "Image files must be under 10 MB.",
        });
        return;
      }

      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!bucketId) {
        res.status(500).json({ error: "Object storage not configured" });
        return;
      }

      try {
        const ext = extFromMime(mime);
        const folder = isVideo
          ? "media-uploads/videos"
          : isDoc
          ? "media-uploads/docs"
          : "media-uploads/images";
        const assetId = randomUUID();
        const objectKey = `${folder}/${user.id}/${assetId}.${ext}`;

        const bucket = objectStorageClient.bucket(bucketId);
        const gcsFile = bucket.file(objectKey);
        await gcsFile.save(req.file.buffer, { contentType: mime });
        await gcsFile.makePublic();
        const url = `https://storage.googleapis.com/${bucketId}/${objectKey}`;

        // ── Record asset in DB ──────────────────────────────────────────
        await pool.query(
          `INSERT INTO media_assets
             (id, uploader_id, purpose, mime_type, byte_size, object_key,
              public_url, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'ready',NOW())
           ON CONFLICT (id) DO NOTHING`,
          [assetId, user.id, purpose, mime, req.file.size, objectKey, url],
        ).catch(() => {
          // Non-fatal if media_assets table isn't on this instance yet
        });

        const fileType = isVideo ? "video" : isDoc ? "document" : "image";
        res.status(201).json({ url, assetId, type: fileType });
      } catch (err: unknown) {
        console.error("[media-upload] error:", err);
        res.status(500).json({ error: "Upload failed. Please try again." });
      }
    },
  );
}
