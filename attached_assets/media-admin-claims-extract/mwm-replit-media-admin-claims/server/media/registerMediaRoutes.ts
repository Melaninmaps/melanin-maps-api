import { randomUUID } from "crypto";
import type { Express, NextFunction, Request, Response } from "express";
import type { Pool } from "pg";

type RequestWithMember = Request & { member?: { id: string; role: string } };
type ObjectStorage = { createUploadUrl(input: { key: string; mimeType: string; byteSize: number }): Promise<{ uploadUrl: string; publicUrl: string; headers?: Record<string, string> }>; objectExists(key: string): Promise<boolean> };
const ALLOWED = new Set(["image/jpeg","image/png","image/webp","image/heic","video/mp4","video/quicktime"]);
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export function registerMediaRoutes(app: Express, pool: Pool, storage: ObjectStorage) {
  app.post("/api/media/uploads/sign", async (request: RequestWithMember, response: Response, next: NextFunction) => {
    try {
      if (!request.member) throw Object.assign(new Error("AUTH_REQUIRED"), { status: 401 });
      const { filename, mimeType, byteSize } = request.body ?? {};
      if (typeof filename !== "string" || typeof mimeType !== "string" || !Number.isInteger(byteSize) || !ALLOWED.has(mimeType)) throw Object.assign(new Error("UNSUPPORTED_MEDIA"), { status: 400 });
      if ((mimeType.startsWith("image/") && byteSize > MAX_IMAGE) || (mimeType.startsWith("video/") && byteSize > MAX_VIDEO) || byteSize <= 0) throw Object.assign(new Error("MEDIA_SIZE_INVALID"), { status: 400 });
      const id = randomUUID(); const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120); const storageKey = `community/${request.member.id}/${id}/${safeName}`;
      const upload = await storage.createUploadUrl({ key: storageKey, mimeType, byteSize });
      await pool.query(`INSERT INTO media_assets (id, storage_key, public_url, mime_type, byte_size, original_filename, uploader_member_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'uploading')`, [id, storageKey, upload.publicUrl, mimeType, byteSize, filename.slice(0, 255), request.member.id]);
      return response.status(201).json({ assetId: id, uploadUrl: upload.uploadUrl, headers: upload.headers ?? {}, publicUrl: upload.publicUrl });
    } catch (error) { return next(error); }
  });

  app.post("/api/media/uploads/:assetId/complete", async (request: RequestWithMember, response: Response, next: NextFunction) => {
    try {
      if (!request.member) throw Object.assign(new Error("AUTH_REQUIRED"), { status: 401 });
      const { rows } = await pool.query(`SELECT storage_key FROM media_assets WHERE id=$1 AND uploader_member_id=$2 AND status='uploading'`, [request.params.assetId, request.member.id]);
      if (!rows[0]) throw Object.assign(new Error("UPLOAD_NOT_FOUND"), { status: 404 });
      if (!(await storage.objectExists(rows[0].storage_key))) throw Object.assign(new Error("UPLOAD_NOT_RECEIVED"), { status: 409 });
      await pool.query(`UPDATE media_assets SET status='ready' WHERE id=$1`, [request.params.assetId]);
      return response.json({ assetId: request.params.assetId, status: "ready" });
    } catch (error) { return next(error); }
  });
}
