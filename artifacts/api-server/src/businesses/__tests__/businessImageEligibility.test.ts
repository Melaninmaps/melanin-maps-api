import { describe, expect, it, vi } from "vitest";
import {
  LEGACY_NEUTRAL_BUSINESS_PLACEHOLDER_URL,
  attachEligibleBusinessImages,
  classifyImageAuditReasons,
  validateBusinessImageReceipt,
} from "../businessImageEligibility";

const business = {
  id: "business-1",
  imageUrl: "https://cdn.example.test/cover.jpg",
  photos: ["https://cdn.example.test/cover.jpg", "https://cdn.example.test/gallery.jpg"],
  website: "https://example.test/about",
  instagram: "https://instagram.com/examplebusiness",
  tiktok: null,
  facebook: null,
};

describe("business image receipt eligibility", () => {
  it("fails closed when there is no approved receipt", async () => {
    const query = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const [record] = await attachEligibleBusinessImages(query, [business]);
    expect(record.imageUrl).toBe(LEGACY_NEUTRAL_BUSINESS_PLACEHOLDER_URL);
    expect(record.photos).toEqual([]);
    expect(record.imageEligibility).toBe("suppressed_unverified");
  });

  it("exposes only the exact URLs covered by approved receipts", async () => {
    const query = {
      query: vi.fn().mockResolvedValue({
        rows: [{ business_id: "business-1", image_url: "https://cdn.example.test/gallery.jpg" }],
      }),
    };
    const [record] = await attachEligibleBusinessImages(query, [business]);
    expect(record.imageUrl).toBe("https://cdn.example.test/gallery.jpg");
    expect(record.photos).toEqual(["https://cdn.example.test/gallery.jpg"]);
    expect(record.imageEligibility).toBe("receipt_verified");
  });

  it("requires an official website receipt to match the current business website", () => {
    expect(() => validateBusinessImageReceipt(business, {
      imageUrl: business.imageUrl,
      sourceType: "official_business_website",
      sourceUrl: "https://unrelated.example.test/photo",
    })).toThrow("current official website");

    expect(validateBusinessImageReceipt(business, {
      imageUrl: business.imageUrl,
      sourceType: "official_business_website",
      sourceUrl: "https://example.test/gallery",
    }).sourceUrl).toBe("https://example.test/gallery");
  });

  it("requires owner and member receipts to retain the authenticated contributor", () => {
    expect(() => validateBusinessImageReceipt(business, {
      imageUrl: business.imageUrl,
      sourceType: "business_owner_upload",
    })).toThrow("uploading owner");
    expect(validateBusinessImageReceipt(business, {
      imageUrl: business.imageUrl,
      sourceType: "approved_member_visit",
      submittedByUserId: "member-1",
    }).submittedByUserId).toBe("member-1");
  });

  it("identifies duplicate, generic, and unreceipted assets for review", () => {
    expect(classifyImageAuditReasons({
      imageUrl: "https://images.unsplash.com/stock-image.jpg",
      usageCount: 3,
      hasApprovedReceipt: false,
    })).toEqual(expect.arrayContaining([
      "no_approved_source_receipt",
      "duplicated_across_businesses",
      "stock_or_generic_host",
    ]));
  });
});
