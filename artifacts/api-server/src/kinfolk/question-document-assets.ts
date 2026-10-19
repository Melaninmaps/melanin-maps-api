import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { pool } from "@workspace/db";
import { kinfolkQuestionImageStorageClient } from "../lib/objectStorage";

const MAX_KINFOLK_QUESTION_DOCUMENTS = 1;
export const MAX_KINFOLK_QUESTION_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const MAX_KINFOLK_QUESTION_DOCUMENT_PAGES = 12;
export const MAX_KINFOLK_QUESTION_DOCUMENT_TEXT_CHARS = 20_000;
const KINFOLK_QUESTION_DOCUMENT_RETENTION_MS = 15 * 60 * 1000;
const PDF_COMMAND_TIMEOUT_MS = 2_500;
const PDF_INFO_MAX_BYTES = 8 * 1024;
const PDF_TEXT_MAX_BYTES = MAX_KINFOLK_QUESTION_DOCUMENT_TEXT_CHARS * 4 + 1_024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const execFileAsync = promisify(execFile);

type PrivateStorageFile = {
  download(): Promise<[Buffer]>;
  delete?(options?: { ignoreNotFound?: boolean }): Promise<unknown>;
};
type PrivateStorageClient = {
  bucket(bucketId: string): { file(objectKey: string): PrivateStorageFile };
};
type PrivateDeletionStorageFile = {
  delete?(options?: { ignoreNotFound?: boolean }): Promise<unknown>;
};
type PrivateDeletionStorageClient = {
  bucket(bucketId: string): {
    file(objectKey: string): PrivateDeletionStorageFile;
  };
};
type QuestionDocumentRow = {
  id: string;
  object_key: string;
  retention_expires_at: Date | string;
};

type PdfCommandResult = { stdout: string; stderr: string };
export type KinfolkPdfCommandRunner = (
  command: "pdfinfo" | "pdftotext",
  args: readonly string[],
  options: { timeoutMs: number; maxBuffer: number },
) => Promise<PdfCommandResult>;

export type KinfolkQuestionDocumentExtraction = Readonly<{
  text: string;
  pageCount: number;
}>;

export class KinfolkQuestionDocumentError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code:
      | "DOCUMENT_CONSENT_REQUIRED"
      | "DOCUMENT_INVALID"
      | "DOCUMENT_TOO_LARGE"
      | "DOCUMENT_TOO_MANY_PAGES"
      | "DOCUMENT_UNREADABLE"
      | "DOCUMENT_TEXT_LIMIT"
      | "DOCUMENT_UNAVAILABLE",
  ) {
    super(message);
  }
}

export function normalizeKinfolkQuestionDocumentAssetIds(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== "string") continue;
    const id = candidate.trim().toLowerCase();
    if (UUID_PATTERN.test(id)) unique.add(id);
  }
  return [...unique].slice(0, MAX_KINFOLK_QUESTION_DOCUMENTS);
}

function privateBucketId(): string | null {
  // Documents use the same dedicated Kinfolk media identity as images. They
  // never fall back to general private or public media storage.
  return process.env.KINFOLK_MEDIA_BUCKET_ID?.trim() || null;
}

function asDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function isPdf(buffer: Buffer): boolean {
  return (
    buffer.byteLength >= 8 &&
    buffer.subarray(0, 8).toString("ascii").startsWith("%PDF-")
  );
}

async function runPdfCommand(
  command: "pdfinfo" | "pdftotext",
  args: readonly string[],
  options: { timeoutMs: number; maxBuffer: number },
): Promise<PdfCommandResult> {
  const result = await execFileAsync(command, [...args], {
    encoding: "utf8",
    timeout: options.timeoutMs,
    maxBuffer: options.maxBuffer,
    windowsHide: true,
  });
  return {
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
  };
}

function commandFailureIsEncrypted(error: unknown): boolean {
  const details =
    error && typeof error === "object"
      ? `${String((error as { message?: unknown }).message ?? "")}\n${String((error as { stderr?: unknown }).stderr ?? "")}`
      : "";
  return /encrypt|password/i.test(details);
}

function commandFailureExceededTextLimit(error: unknown): boolean {
  const details =
    error && typeof error === "object"
      ? `${String((error as { code?: unknown }).code ?? "")}\n${String((error as { message?: unknown }).message ?? "")}`
      : "";
  return /maxbuffer/i.test(details);
}

function documentErrorFromCommandFailure(
  error: unknown,
  stage: "metadata" | "text",
): KinfolkQuestionDocumentError {
  if (commandFailureIsEncrypted(error)) {
    return new KinfolkQuestionDocumentError(
      "Kinfolk cannot read password-protected or encrypted PDFs. Please remove the protection and try again.",
      422,
      "DOCUMENT_UNREADABLE",
    );
  }
  if (stage === "text" && commandFailureExceededTextLimit(error)) {
    return new KinfolkQuestionDocumentError(
      "This PDF has too much readable text for one Kinfolk question. Please share a shorter document or a smaller section.",
      413,
      "DOCUMENT_TEXT_LIMIT",
    );
  }
  return new KinfolkQuestionDocumentError(
    "Kinfolk could not read this PDF. It may be malformed, encrypted, scanned, or unsupported.",
    422,
    "DOCUMENT_UNREADABLE",
  );
}

/**
 * Extracts bounded text from one member-supplied PDF using local Poppler tools.
 * The file exists only inside an owner-only temporary directory for the duration
 * of this call. No filename, path, byte content, or command output is logged.
 */
export async function extractKinfolkQuestionPdfText(
  pdf: Buffer,
  input: { runner?: KinfolkPdfCommandRunner } = {},
): Promise<KinfolkQuestionDocumentExtraction> {
  if (!isPdf(pdf)) {
    throw new KinfolkQuestionDocumentError(
      "Kinfolk can read PDF documents only. Please choose a PDF with selectable text.",
      415,
      "DOCUMENT_INVALID",
    );
  }
  if (pdf.byteLength > MAX_KINFOLK_QUESTION_DOCUMENT_BYTES) {
    throw new KinfolkQuestionDocumentError(
      "Private Kinfolk PDFs must be under 2 MB.",
      413,
      "DOCUMENT_TOO_LARGE",
    );
  }

  const directory = await mkdtemp(join(tmpdir(), "kinfolk-pdf-"));
  const sourcePath = join(directory, "question.pdf");
  const runner = input.runner ?? runPdfCommand;
  try {
    await writeFile(sourcePath, pdf, { mode: 0o600 });
    let info: PdfCommandResult;
    try {
      info = await runner("pdfinfo", [sourcePath], {
        timeoutMs: PDF_COMMAND_TIMEOUT_MS,
        maxBuffer: PDF_INFO_MAX_BYTES,
      });
    } catch (error) {
      throw documentErrorFromCommandFailure(error, "metadata");
    }
    if (/^Encrypted:\s+yes/im.test(info.stdout)) {
      throw new KinfolkQuestionDocumentError(
        "Kinfolk cannot read password-protected or encrypted PDFs. Please remove the protection and try again.",
        422,
        "DOCUMENT_UNREADABLE",
      );
    }
    const pageMatch = info.stdout.match(/^Pages:\s+(\d+)\s*$/im);
    const pageCount = pageMatch ? Number(pageMatch[1]) : NaN;
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      throw new KinfolkQuestionDocumentError(
        "Kinfolk could not read this PDF. It may be malformed, encrypted, scanned, or unsupported.",
        422,
        "DOCUMENT_UNREADABLE",
      );
    }
    if (pageCount > MAX_KINFOLK_QUESTION_DOCUMENT_PAGES) {
      throw new KinfolkQuestionDocumentError(
        "Private Kinfolk PDFs can contain up to 12 pages. Please share a shorter section.",
        413,
        "DOCUMENT_TOO_MANY_PAGES",
      );
    }

    let textResult: PdfCommandResult;
    try {
      textResult = await runner(
        "pdftotext",
        ["-enc", "UTF-8", "-f", "1", "-l", String(pageCount), sourcePath, "-"],
        {
          timeoutMs: PDF_COMMAND_TIMEOUT_MS,
          maxBuffer: PDF_TEXT_MAX_BYTES,
        },
      );
    } catch (error) {
      throw documentErrorFromCommandFailure(error, "text");
    }
    const text = textResult.stdout
      .replace(/\u0000/g, "")
      .replace(/\r\n/g, "\n")
      .trim();
    if (!/[\p{L}\p{N}]/u.test(text)) {
      throw new KinfolkQuestionDocumentError(
        "Kinfolk could not find readable text in this PDF. It may be a scanned or image-only document.",
        422,
        "DOCUMENT_UNREADABLE",
      );
    }
    if (text.length > MAX_KINFOLK_QUESTION_DOCUMENT_TEXT_CHARS) {
      throw new KinfolkQuestionDocumentError(
        "This PDF has too much readable text for one Kinfolk question. Please share a shorter document or a smaller section.",
        413,
        "DOCUMENT_TEXT_LIMIT",
      );
    }
    return { text, pageCount };
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(
      () => undefined,
    );
  }
}

/**
 * Downloads one owned, unexpired private PDF and returns bounded extracted text
 * for the active model request only. Neither the PDF nor its text is returned
 * to the browser or persisted in Kinfolk memory/session history.
 */
export async function resolveConsentedKinfolkQuestionDocument(input: {
  userId: string;
  assetIds: readonly string[];
  explicitDocumentConsent: boolean;
  storageClient?: PrivateStorageClient;
  extractor?: (pdf: Buffer) => Promise<KinfolkQuestionDocumentExtraction>;
}): Promise<KinfolkQuestionDocumentExtraction | null> {
  const assetIds = normalizeKinfolkQuestionDocumentAssetIds(input.assetIds);
  if (assetIds.length === 0) return null;
  if (!input.explicitDocumentConsent) {
    throw new KinfolkQuestionDocumentError(
      "Choose whether to share the PDF with Kinfolk for this answer before sending it.",
      400,
      "DOCUMENT_CONSENT_REQUIRED",
    );
  }
  if (
    assetIds.length !== input.assetIds.length ||
    input.assetIds.length > MAX_KINFOLK_QUESTION_DOCUMENTS
  ) {
    throw new KinfolkQuestionDocumentError(
      "Kinfolk can review one valid PDF at a time.",
      400,
      "DOCUMENT_INVALID",
    );
  }
  const rows = await pool
    .query<QuestionDocumentRow>(
      `SELECT id, object_key, retention_expires_at
       FROM media_assets
      WHERE uploader_id = $1
        AND purpose = 'kinfolk_question_document'
        AND status = 'ready'
        AND mime_type = 'application/pdf'
        AND retention_expires_at > NOW()
        AND deleted_at IS NULL
        AND id = ANY($2::uuid[])`,
      [input.userId, assetIds],
    )
    .catch(() => ({ rows: [] as QuestionDocumentRow[] }));
  const row = rows.rows[0];
  if (!row || rows.rows.length !== 1) {
    throw new KinfolkQuestionDocumentError(
      "This PDF is unavailable, expired, or does not belong to this account. Please add it again.",
      400,
      "DOCUMENT_INVALID",
    );
  }
  const expiry = asDate(row.retention_expires_at);
  if (!expiry || expiry.getTime() <= Date.now()) {
    throw new KinfolkQuestionDocumentError(
      "This PDF has expired. Please add it again.",
      400,
      "DOCUMENT_INVALID",
    );
  }
  const bucketId = privateBucketId();
  if (!bucketId) {
    throw new KinfolkQuestionDocumentError(
      "Private document review is temporarily unavailable. Please try again later.",
      503,
      "DOCUMENT_UNAVAILABLE",
    );
  }
  const storageClient =
    input.storageClient ??
    (kinfolkQuestionImageStorageClient as unknown as PrivateStorageClient);
  try {
    const [pdf] = await storageClient
      .bucket(bucketId)
      .file(row.object_key)
      .download();
    return await (input.extractor ?? extractKinfolkQuestionPdfText)(pdf);
  } catch (error) {
    if (error instanceof KinfolkQuestionDocumentError) throw error;
    throw new KinfolkQuestionDocumentError(
      "Private document review is temporarily unavailable. Please try again later.",
      503,
      "DOCUMENT_UNAVAILABLE",
    );
  }
}

export async function purgeKinfolkQuestionDocuments(input: {
  userId: string;
  assetIds: readonly string[];
  storageClient?: PrivateDeletionStorageClient;
}): Promise<{ deleted: number; pending: number }> {
  const assetIds = normalizeKinfolkQuestionDocumentAssetIds(input.assetIds);
  if (assetIds.length === 0) return { deleted: 0, pending: 0 };
  const rows = await pool
    .query<QuestionDocumentRow>(
      `SELECT id, object_key, retention_expires_at
       FROM media_assets
      WHERE uploader_id = $1
        AND purpose = 'kinfolk_question_document'
        AND status = 'ready'
        AND id = ANY($2::uuid[])`,
      [input.userId, assetIds],
    )
    .catch(() => ({ rows: [] as QuestionDocumentRow[] }));
  return deleteQuestionDocumentRows(
    rows.rows,
    input.storageClient,
    input.userId,
  );
}

async function deleteQuestionDocumentRows(
  rows: readonly QuestionDocumentRow[],
  storageClient: PrivateDeletionStorageClient | undefined,
  ownerId?: string,
): Promise<{ deleted: number; pending: number }> {
  if (rows.length === 0) return { deleted: 0, pending: 0 };
  const bucketId = privateBucketId();
  if (!bucketId) return { deleted: 0, pending: rows.length };
  const client =
    storageClient ??
    (kinfolkQuestionImageStorageClient as unknown as PrivateStorageClient);
  const deletedIds: string[] = [];
  for (const row of rows) {
    try {
      const file = client.bucket(bucketId).file(row.object_key);
      if (!file.delete) continue;
      await file.delete({ ignoreNotFound: true });
      deletedIds.push(row.id);
    } catch {
      // The bounded expiry pass retries without logging paths, URLs, or content.
    }
  }
  if (deletedIds.length > 0) {
    await pool
      .query(
        `UPDATE media_assets
          SET status = 'deleted', public_url = NULL, deleted_at = NOW()
        WHERE id = ANY($1::uuid[])
          AND ($2::text IS NULL OR uploader_id = $2)`,
        [deletedIds, ownerId ?? null],
      )
      .catch(() => undefined);
  }
  return {
    deleted: deletedIds.length,
    pending: rows.length - deletedIds.length,
  };
}

export async function purgeExpiredKinfolkQuestionDocuments(
  input: {
    storageClient?: PrivateDeletionStorageClient;
    limit?: number;
  } = {},
): Promise<{ deleted: number; pending: number }> {
  const limit = Math.max(1, Math.min(100, Math.trunc(input.limit ?? 50)));
  const rows = await pool
    .query<QuestionDocumentRow>(
      `SELECT id, object_key, retention_expires_at
       FROM media_assets
      WHERE purpose = 'kinfolk_question_document'
        AND status = 'ready'
        AND retention_expires_at <= NOW()
      ORDER BY retention_expires_at ASC
      LIMIT $1`,
      [limit],
    )
    .catch(() => ({ rows: [] as QuestionDocumentRow[] }));
  return deleteQuestionDocumentRows(rows.rows, input.storageClient);
}

export const KINFOLK_QUESTION_DOCUMENT_RETENTION_MINUTES = Math.round(
  KINFOLK_QUESTION_DOCUMENT_RETENTION_MS / 60_000,
);
