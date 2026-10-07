import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());
const deleteObject = vi.hoisted(() => vi.fn());

vi.mock("@workspace/db", () => ({
  pool: { query },
}));

vi.mock("../../lib/objectStorage", () => ({
  kinfolkQuestionImageStorageClient: {
    bucket: () => ({
      file: () => ({ delete: deleteObject }),
    }),
  },
}));

import {
  KinfolkQuestionImageError,
  normalizeKinfolkQuestionImageAssetIds,
  purgeKinfolkQuestionImages,
  resolveConsentedKinfolkQuestionImages,
} from "../question-image-assets";

const FIRST_ASSET = "00000000-0000-4000-8000-000000000001";
const SECOND_ASSET = "00000000-0000-4000-8000-000000000002";

describe("Kinfolk private question image policy", () => {
  beforeEach(() => {
    query.mockReset();
    deleteObject.mockReset();
    deleteObject.mockResolvedValue(undefined);
    vi.stubEnv("DEFAULT_OBJECT_STORAGE_BUCKET_ID", "kinfolk-private-test");
    vi.stubEnv("KINFOLK_MEDIA_BUCKET_ID", "kinfolk-question-media-test");
  });

  it("accepts only distinct bounded UUID asset references", () => {
    expect(normalizeKinfolkQuestionImageAssetIds([FIRST_ASSET, SECOND_ASSET])).toEqual([
      FIRST_ASSET,
      SECOND_ASSET,
    ]);
    expect(normalizeKinfolkQuestionImageAssetIds([FIRST_ASSET, FIRST_ASSET, "not-an-asset"])).toEqual([
      FIRST_ASSET,
    ]);
  });

  it("requires an affirmative per-answer vision consent before any database lookup", async () => {
    await expect(resolveConsentedKinfolkQuestionImages({
      userId: "member-a",
      assetIds: [FIRST_ASSET],
      explicitVisionConsent: false,
    })).rejects.toMatchObject({
      code: "VISION_CONSENT_REQUIRED",
      status: 400,
    } satisfies Partial<KinfolkQuestionImageError>);
    expect(query).not.toHaveBeenCalled();
  });

  it("resolves only the requesting member's unexpired consented images into short-lived provider URLs", async () => {
    const getSignedUrl = vi.fn().mockResolvedValue(["https://storage.example.test/private-signed"]);
    query.mockResolvedValueOnce({
      rows: [{
        id: FIRST_ASSET,
        object_key: "media-uploads/kinfolk-private/member-a/image.jpg",
        retention_expires_at: new Date(Date.now() + 60_000),
      }],
    });

    const urls = await resolveConsentedKinfolkQuestionImages({
      userId: "member-a",
      assetIds: [FIRST_ASSET],
      explicitVisionConsent: true,
      storageClient: { bucket: () => ({ file: () => ({ getSignedUrl }) }) },
    });

    expect(urls).toEqual(["https://storage.example.test/private-signed"]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("uploader_id = $1"),
      ["member-a", [FIRST_ASSET]],
    );
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toContain("vision_consent_granted_at IS NOT NULL");
    expect(sql).toContain("retention_expires_at > NOW()");
    expect(sql).toContain("deleted_at IS NULL");
    expect(getSignedUrl).toHaveBeenCalledWith({ action: "read", expires: expect.any(Number) });
  });

  it("fails closed if any asset is expired, unowned, missing, or duplicated", async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: FIRST_ASSET, object_key: "media-uploads/kinfolk-private/member-a/image.jpg" }],
    });

    await expect(resolveConsentedKinfolkQuestionImages({
      userId: "member-a",
      assetIds: [FIRST_ASSET, SECOND_ASSET],
      explicitVisionConsent: true,
    })).rejects.toMatchObject({
      code: "VISION_IMAGES_INVALID",
      status: 400,
    } satisfies Partial<KinfolkQuestionImageError>);
  });

  it("does not fall back to general private storage when the dedicated Kinfolk bucket is unavailable", async () => {
    vi.stubEnv("KINFOLK_MEDIA_BUCKET_ID", "");
    query.mockResolvedValueOnce({
      rows: [{
        id: FIRST_ASSET,
        object_key: "media-uploads/kinfolk-private/member-a/image.jpg",
        retention_expires_at: new Date(Date.now() + 60_000),
      }],
    });

    await expect(resolveConsentedKinfolkQuestionImages({
      userId: "member-a",
      assetIds: [FIRST_ASSET],
      explicitVisionConsent: true,
    })).rejects.toMatchObject({
      code: "VISION_IMAGES_UNAVAILABLE",
      status: 503,
    } satisfies Partial<KinfolkQuestionImageError>);
  });

  it("deletes owner-scoped image objects and marks the private records deleted", async () => {
    query
      .mockResolvedValueOnce({ rows: [{
        id: FIRST_ASSET,
        object_key: "media-uploads/kinfolk-private/member-a/image.jpg",
        retention_expires_at: new Date(Date.now() + 60_000),
      }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const result = await purgeKinfolkQuestionImages({
      userId: "member-a",
      assetIds: [FIRST_ASSET],
      storageClient: {
        bucket: () => ({
          file: () => ({ getSignedUrl: vi.fn(), delete: deleteObject }),
        }),
      },
    });

    expect(result).toEqual({ deleted: 1, pending: 0 });
    expect(deleteObject).toHaveBeenCalledWith({ ignoreNotFound: true });
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining("deleted_at = NOW()"),
      [[FIRST_ASSET], "member-a"],
    );
  });
});
