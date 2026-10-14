import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());
vi.mock("@workspace/db", () => ({ pool: { query } }));
vi.mock("../../../lib/objectStorage", () => ({
  kinfolkQuestionImageStorageClient: { bucket: vi.fn() },
}));

import {
  extractJourneyPrivateDocument,
  MAX_JOURNEY_PRIVATE_PDF_EXTRACTION_BYTES,
} from "../attachment-extraction";

const ASSET_ID = "00000000-0000-4000-8000-000000000123";

function assetRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: ASSET_ID,
    object_key:
      "media-uploads/kinfolk-journeys-private/member-a/confirmation.pdf",
    byte_size: 640,
    mime_type: "application/pdf",
    ...overrides,
  };
}

function storageFor(contents: string | Buffer) {
  const download = vi.fn().mockResolvedValue([Buffer.from(contents)]);
  return {
    storageClient: { bucket: () => ({ file: () => ({ download }) }) },
    download,
  };
}

describe("Journey private document extraction", () => {
  beforeEach(() => {
    query.mockReset();
    vi.stubEnv("DEFAULT_OBJECT_STORAGE_BUCKET_ID", "journey-private-test");
  });

  it("extracts only owner-scoped PDF text and returns review-only parsed facts", async () => {
    query.mockResolvedValueOnce({ rows: [assetRow()] });
    const { storageClient, download } = storageFor("pdf");
    const pdfExtractor = vi.fn().mockResolvedValue({
      text: "Delta confirmation DL 1234 ATL -> LAX 2026-11-03 confirmation ABC123",
      pageCount: 1,
    });

    const result = await extractJourneyPrivateDocument({
      userId: "member-a",
      assetId: ASSET_ID,
      storageClient,
      pdfExtractor,
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("uploader_id=$2"),
      [ASSET_ID, "member-a"],
    );
    expect(download).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ source: "pdf", pageCount: 1 });
    expect(result.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "flight_number", value: "DL1234" }),
        expect.objectContaining({
          field: "confirmation_code",
          value: "ABC123",
        }),
      ]),
    );
    expect(result).not.toHaveProperty("text");
    expect(JSON.stringify(result)).not.toContain("Delta confirmation DL");
  });

  it("reduces only a selected .eml confirmation to review-only facts", async () => {
    query.mockResolvedValueOnce({
      rows: [
        assetRow({
          object_key:
            "media-uploads/kinfolk-journeys-private/member-a/confirmation.eml",
          mime_type: "message/rfc822",
        }),
      ],
    });
    const { storageClient } = storageFor(
      "Subject: Delta confirmation DL 234\r\nContent-Type: text/plain\r\n\r\nConfirmation: AB1234\nDL 234 ATL -> LAX\n2026-11-03",
    );

    const result = await extractJourneyPrivateDocument({
      userId: "member-a",
      assetId: ASSET_ID,
      storageClient,
    });

    expect(result).toMatchObject({ source: "email", pageCount: null });
    expect(result.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "flight_number", value: "DL234" }),
        expect.objectContaining({
          field: "confirmation_code",
          value: "AB1234",
        }),
      ]),
    );
    expect(JSON.stringify(result)).not.toContain("Subject: Delta");
  });

  it("parses one selected .ics event as a review-only proposal", async () => {
    query.mockResolvedValueOnce({
      rows: [
        assetRow({
          object_key:
            "media-uploads/kinfolk-journeys-private/member-a/concert.ics",
          mime_type: "application/ics",
        }),
      ],
    });
    const { storageClient } = storageFor(
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "SUMMARY:Atlanta concert",
        "DTSTART:20261103T190000",
        "DTEND:20261103T220000",
        "LOCATION:Downtown venue",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
    );

    const result = await extractJourneyPrivateDocument({
      userId: "member-a",
      assetId: ASSET_ID,
      storageClient,
    });

    expect(result).toMatchObject({ source: "calendar", kind: "event" });
    expect(result.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "title", value: "Atlanta concert" }),
        expect.objectContaining({ field: "start_date", value: "2026-11-03" }),
      ]),
    );
  });

  it("fails closed for a missing, unsupported, or oversized member attachment", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await expect(
      extractJourneyPrivateDocument({ userId: "member-a", assetId: ASSET_ID }),
    ).rejects.toMatchObject({ code: "JOURNEY_NOT_FOUND", status: 404 });

    query.mockResolvedValueOnce({
      rows: [assetRow({ mime_type: "image/jpeg" })],
    });
    await expect(
      extractJourneyPrivateDocument({ userId: "member-a", assetId: ASSET_ID }),
    ).rejects.toMatchObject({ code: "JOURNEY_INVALID", status: 422 });

    query.mockResolvedValueOnce({
      rows: [
        assetRow({
          byte_size: MAX_JOURNEY_PRIVATE_PDF_EXTRACTION_BYTES + 1,
        }),
      ],
    });
    await expect(
      extractJourneyPrivateDocument({ userId: "member-a", assetId: ASSET_ID }),
    ).rejects.toMatchObject({ code: "JOURNEY_INVALID", status: 422 });
  });

  it("does not treat an unreadable PDF as a source of facts", async () => {
    query.mockResolvedValueOnce({ rows: [assetRow()] });
    const { storageClient } = storageFor("pdf");
    await expect(
      extractJourneyPrivateDocument({
        userId: "member-a",
        assetId: ASSET_ID,
        storageClient,
        pdfExtractor: vi.fn().mockRejectedValue(new Error("unreadable")),
      }),
    ).rejects.toMatchObject({ code: "JOURNEY_UNAVAILABLE", status: 503 });
  });
});
