import { pool } from "@workspace/db";
import { kinfolkQuestionImageStorageClient } from "../../lib/objectStorage";
import {
  extractKinfolkQuestionPdfText,
  KinfolkQuestionDocumentError,
  type KinfolkQuestionDocumentExtraction,
} from "../question-document-assets";
import {
  parseJourneyConfirmationText,
  parseJourneyIcs,
  type JourneyParsedFact,
} from "./confirmation-parser";
import { JourneyActionError } from "./domain";

export const MAX_JOURNEY_PRIVATE_PDF_EXTRACTION_BYTES = 2 * 1024 * 1024;
export const MAX_JOURNEY_PRIVATE_TEXT_EXTRACTION_BYTES = 1 * 1024 * 1024;

const JOURNEY_TEXT_DOCUMENT_MIMES = new Set([
  "message/rfc822",
  "text/calendar",
  "application/ics",
]);

type JourneyDocumentSource = "pdf" | "email" | "calendar";

export type JourneyAttachmentStorageFile = {
  download(): Promise<[Buffer]>;
};

export type JourneyAttachmentStorageClient = {
  bucket(bucketId: string): {
    file(objectKey: string): JourneyAttachmentStorageFile;
  };
};

type JourneyPrivateAttachmentRow = {
  id: string;
  object_key: string;
  byte_size: number;
  mime_type: string;
};

export type JourneyPrivateDocumentExtraction = Readonly<{
  source: JourneyDocumentSource;
  pageCount: number | null;
  kind:
    | "flight"
    | "lodging"
    | "reservation"
    | "event"
    | "transport"
    | "unknown";
  facts: readonly JourneyParsedFact[];
  warnings: readonly string[];
}>;

/** Kept for the original PDF-specific caller/tests. */
export type JourneyPrivatePdfExtraction = JourneyPrivateDocumentExtraction;

function privateBucketId(): string | null {
  return process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID?.trim() || null;
}

function unavailable(message: string): JourneyActionError {
  return new JourneyActionError(message, 503, "JOURNEY_UNAVAILABLE");
}

function invalid(message: string): JourneyActionError {
  return new JourneyActionError(message, 422, "JOURNEY_INVALID");
}

function textDocumentSource(mime: string): JourneyDocumentSource | null {
  if (mime === "message/rfc822") return "email";
  if (mime === "text/calendar" || mime === "application/ics") return "calendar";
  return null;
}

function trimPrivateText(value: string): string {
  return value
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .slice(0, MAX_JOURNEY_PRIVATE_TEXT_EXTRACTION_BYTES)
    .trim();
}

function unfoldMailHeaders(value: string): string {
  return value.replace(/\r?\n[ \t]+/g, " ");
}

function emailHeader(value: string, name: string): string | null {
  const match = unfoldMailHeaders(value).match(
    new RegExp(`^${name}\\s*:\\s*(.+)$`, "im"),
  );
  return match?.[1]?.trim() || null;
}

function decodeQuotedPrintable(value: string): string {
  return value
    .replace(/=\r?\n/g, "")
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

function decodeMailPart(headers: string, body: string): string {
  const encoding = emailHeader(
    headers,
    "content-transfer-encoding",
  )?.toLowerCase();
  let decoded = body;
  if (encoding === "base64") {
    try {
      decoded = Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf8");
    } catch {
      decoded = "";
    }
  } else if (encoding === "quoted-printable") {
    decoded = decodeQuotedPrintable(body);
  }
  const contentType = emailHeader(headers, "content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/html")) {
    decoded = decoded
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\s*\/p\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ");
  }
  return trimPrivateText(decoded);
}

/**
 * Reduces a member-selected .eml file to its Subject and first readable body
 * part. It deliberately ignores binary/attached MIME parts, payment content,
 * QR/barcode images, and the member's unselected mailbox.
 */
function selectedEmailText(value: Buffer): string {
  const source = trimPrivateText(value.toString("utf8"));
  const divider = source.search(/\r?\n\r?\n/);
  const headers = divider >= 0 ? source.slice(0, divider) : source;
  const body =
    divider >= 0 ? source.slice(divider).replace(/^\r?\n\r?\n/, "") : "";
  const subject = emailHeader(headers, "subject");
  const contentType = emailHeader(headers, "content-type")?.toLowerCase() ?? "";
  const boundary = contentType.match(/boundary=["']?([^"';\s]+)/i)?.[1];
  let readable = "";
  if (boundary) {
    const parts = body.split(
      new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:--)?`),
    );
    for (const part of parts) {
      const partDivider = part.search(/\r?\n\r?\n/);
      if (partDivider < 0) continue;
      const partHeaders = part.slice(0, partDivider);
      const partType =
        emailHeader(partHeaders, "content-type")?.toLowerCase() ?? "";
      if (!partType.includes("text/plain") && !partType.includes("text/html"))
        continue;
      readable = decodeMailPart(
        partHeaders,
        part.slice(partDivider).replace(/^\r?\n\r?\n/, ""),
      );
      if (readable) break;
    }
  } else {
    readable = decodeMailPart(headers, body);
  }
  return trimPrivateText(
    [subject ? `Subject: ${subject}` : "", readable].filter(Boolean).join("\n"),
  );
}

async function ownedPrivateAttachment(input: {
  userId: string;
  assetId: string;
}): Promise<JourneyPrivateAttachmentRow> {
  const asset = await pool.query<JourneyPrivateAttachmentRow>(
    `SELECT id, object_key, byte_size, mime_type
       FROM media_assets
      WHERE id=$1
        AND uploader_id=$2
        AND purpose='kinfolk_journey_private'
        AND status='ready'
        AND public_url IS NULL
        AND deleted_at IS NULL
      LIMIT 1`,
    [input.assetId, input.userId],
  );
  const row = asset.rows[0];
  if (!row)
    throw new JourneyActionError(
      "Private Journey attachment not found.",
      404,
      "JOURNEY_NOT_FOUND",
    );
  return row;
}

/**
 * Extracts one owner-scoped Journey document into review-only facts. File bytes
 * and raw text exist only in server memory for this request; they are never
 * persisted, logged, returned to the client, or sent to ordinary Kinfolk chat.
 */
export async function extractJourneyPrivateDocument(input: {
  userId: string;
  assetId: string;
  storageClient?: JourneyAttachmentStorageClient;
  pdfExtractor?: (pdf: Buffer) => Promise<KinfolkQuestionDocumentExtraction>;
}): Promise<JourneyPrivateDocumentExtraction> {
  const row = await ownedPrivateAttachment(input);
  const textSource = textDocumentSource(row.mime_type);
  const isPdf = row.mime_type === "application/pdf";
  if (!isPdf && !textSource)
    throw invalid(
      "Automatic review supports a selected PDF, .eml confirmation, or .ics calendar file. Keep other files private and add the relevant details manually.",
    );
  const maxBytes = isPdf
    ? MAX_JOURNEY_PRIVATE_PDF_EXTRACTION_BYTES
    : MAX_JOURNEY_PRIVATE_TEXT_EXTRACTION_BYTES;
  if (row.byte_size > maxBytes)
    throw invalid(
      isPdf
        ? "Automatic PDF review is limited to files under 2 MB. Keep this file attached privately and add the relevant details manually."
        : "Automatic .eml and .ics review is limited to files under 1 MB. Keep this file attached privately and add the relevant details manually.",
    );
  const bucketId = privateBucketId();
  if (!bucketId)
    throw unavailable(
      "Private document review is temporarily unavailable. Your attachment remains private; please try again later or add details manually.",
    );

  try {
    const storage =
      input.storageClient ??
      (kinfolkQuestionImageStorageClient as unknown as JourneyAttachmentStorageClient);
    const [file] = await storage
      .bucket(bucketId)
      .file(row.object_key)
      .download();
    if (isPdf) {
      const extraction = await (
        input.pdfExtractor ?? extractKinfolkQuestionPdfText
      )(file);
      const parsed = parseJourneyConfirmationText(extraction.text);
      return {
        source: "pdf",
        pageCount: extraction.pageCount,
        kind: parsed.kind,
        facts: parsed.facts,
        warnings: parsed.warnings,
      };
    }
    const selectedText =
      textSource === "email"
        ? selectedEmailText(file)
        : trimPrivateText(file.toString("utf8"));
    if (!selectedText)
      throw invalid(
        "No readable confirmation details were found in this private document. Keep it attached privately and add the details manually.",
      );
    const parsed =
      textSource === "calendar"
        ? parseJourneyIcs(selectedText)
        : parseJourneyConfirmationText(selectedText);
    return {
      source: textSource!,
      pageCount: null,
      kind: parsed.kind,
      facts: parsed.facts,
      warnings: parsed.warnings,
    };
  } catch (error) {
    if (error instanceof JourneyActionError) throw error;
    if (error instanceof KinfolkQuestionDocumentError)
      throw invalid(error.message);
    throw unavailable(
      "Private document review is temporarily unavailable. Your attachment remains private; please try again later or add details manually.",
    );
  }
}

/** Backward-compatible PDF-only entry point. */
export async function extractJourneyPrivatePdf(input: {
  userId: string;
  assetId: string;
  storageClient?: JourneyAttachmentStorageClient;
  extractor?: (pdf: Buffer) => Promise<KinfolkQuestionDocumentExtraction>;
}): Promise<JourneyPrivatePdfExtraction> {
  return extractJourneyPrivateDocument({
    ...input,
    pdfExtractor: input.extractor,
  });
}
