import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());
const deleteObject = vi.hoisted(() => vi.fn());
vi.mock("@workspace/db", () => ({ pool: { query } }));
vi.mock("../../lib/objectStorage", () => ({
  kinfolkQuestionImageStorageClient: {
    bucket: () => ({ file: () => ({ delete: deleteObject }) }),
  },
}));

import {
  extractKinfolkQuestionPdfText,
  KinfolkQuestionDocumentError,
  normalizeKinfolkQuestionDocumentAssetIds,
  purgeKinfolkQuestionDocuments,
  resolveConsentedKinfolkQuestionDocument,
  type KinfolkPdfCommandRunner,
} from "../question-document-assets";

const ASSET_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_ASSET_ID = "00000000-0000-4000-8000-000000000002";

function buildTextPdf(text: string): Buffer {
  const escaped = text.replace(/([\\()])/g, "\\$1");
  const stream = `BT\n/F1 12 Tf\n72 720 Td\n(${escaped}) Tj\nET\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "binary");
}

function runnerWith(info: string, text = "Readable PDF text"): KinfolkPdfCommandRunner {
  return async (command) => command === "pdfinfo"
    ? { stdout: info, stderr: "" }
    : { stdout: text, stderr: "" };
}

describe("Kinfolk private question PDF policy", () => {
  beforeEach(() => {
    query.mockReset();
    deleteObject.mockReset();
    deleteObject.mockResolvedValue(undefined);
    vi.stubEnv("KINFOLK_MEDIA_BUCKET_ID", "kinfolk-question-media-test");
  });

  it("accepts only one distinct UUID reference", () => {
    expect(normalizeKinfolkQuestionDocumentAssetIds([ASSET_ID, OTHER_ASSET_ID])).toEqual([ASSET_ID]);
    expect(normalizeKinfolkQuestionDocumentAssetIds([ASSET_ID, ASSET_ID, "not-an-asset"])).toEqual([ASSET_ID]);
  });

  it("extracts selectable PDF text locally with Poppler", async () => {
    const result = await extractKinfolkQuestionPdfText(buildTextPdf("Kinfolk reads this selectable line."));
    expect(result.pageCount).toBe(1);
    expect(result.text).toContain("Kinfolk reads this selectable line.");
  });

  it("rejects malformed, encrypted, scanned, and over-page PDFs without returning document content", async () => {
    await expect(extractKinfolkQuestionPdfText(Buffer.from("not a PDF"))).rejects.toMatchObject({
      code: "DOCUMENT_INVALID",
      status: 415,
    } satisfies Partial<KinfolkQuestionDocumentError>);
    await expect(extractKinfolkQuestionPdfText(buildTextPdf("placeholder"), {
      runner: runnerWith("Pages: 1\nEncrypted: yes\n"),
    })).rejects.toMatchObject({ code: "DOCUMENT_UNREADABLE", status: 422 });
    await expect(extractKinfolkQuestionPdfText(buildTextPdf("placeholder"), {
      runner: runnerWith("Pages: 1\nEncrypted: no\n", "\n \n"),
    })).rejects.toMatchObject({ code: "DOCUMENT_UNREADABLE", status: 422 });
    await expect(extractKinfolkQuestionPdfText(buildTextPdf("placeholder"), {
      runner: runnerWith("Pages: 13\nEncrypted: no\n"),
    })).rejects.toMatchObject({ code: "DOCUMENT_TOO_MANY_PAGES", status: 413 });
  });

  it("requires affirmative consent before an owner-scoped database lookup", async () => {
    await expect(resolveConsentedKinfolkQuestionDocument({
      userId: "member-a",
      assetIds: [ASSET_ID],
      explicitDocumentConsent: false,
    })).rejects.toMatchObject({ code: "DOCUMENT_CONSENT_REQUIRED", status: 400 });
    expect(query).not.toHaveBeenCalled();
  });

  it("resolves only one owned unexpired PDF and passes bounded extracted text only to the active request", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "One bounded private excerpt.", pageCount: 1 });
    query.mockResolvedValueOnce({ rows: [{
      id: ASSET_ID,
      object_key: "media-uploads/kinfolk-private-documents/member-a/private.pdf",
      retention_expires_at: new Date(Date.now() + 60_000),
    }] });
    const result = await resolveConsentedKinfolkQuestionDocument({
      userId: "member-a",
      assetIds: [ASSET_ID],
      explicitDocumentConsent: true,
      storageClient: { bucket: () => ({ file: () => ({ download: vi.fn().mockResolvedValue([buildTextPdf("safe")]) }) }) },
      extractor,
    });
    expect(result).toEqual({ text: "One bounded private excerpt.", pageCount: 1 });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("uploader_id = $1"), ["member-a", [ASSET_ID]]);
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toContain("purpose = 'kinfolk_question_document'");
    expect(sql).toContain("retention_expires_at > NOW()");
    expect(sql).toContain("deleted_at IS NULL");
  });

  it("fails closed for an unowned, expired, missing, or duplicate document reference", async () => {
    query.mockResolvedValueOnce({ rows: [{ id: ASSET_ID, object_key: "private.pdf", retention_expires_at: new Date(Date.now() + 60_000) }] });
    await expect(resolveConsentedKinfolkQuestionDocument({
      userId: "member-a",
      assetIds: [ASSET_ID, OTHER_ASSET_ID],
      explicitDocumentConsent: true,
    })).rejects.toMatchObject({ code: "DOCUMENT_INVALID", status: 400 });
  });

  it("deletes only the requesting member's private PDF object and marks its record deleted", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: ASSET_ID, object_key: "media-uploads/kinfolk-private-documents/member-a/private.pdf", retention_expires_at: new Date(Date.now() + 60_000) }] })
      .mockResolvedValueOnce({ rowCount: 1 });
    const result = await purgeKinfolkQuestionDocuments({
      userId: "member-a",
      assetIds: [ASSET_ID],
      storageClient: { bucket: () => ({ file: () => ({ download: vi.fn(), delete: deleteObject }) }) },
    });
    expect(result).toEqual({ deleted: 1, pending: 0 });
    expect(deleteObject).toHaveBeenCalledWith({ ignoreNotFound: true });
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining("deleted_at = NOW()"), [[ASSET_ID], "member-a"]);
  });
});
