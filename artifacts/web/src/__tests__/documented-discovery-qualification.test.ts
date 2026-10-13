import { describe, expect, it } from "vitest";
import { buildDocumentedDiscoveryQualification } from "../lib/documentedDiscoveryQualification";

const valid = () => ({
  businessName: "3B Moving & Transportation, LLC",
  ownershipDesignations: ["Black / African American-Owned"],
  ownershipSourceUrl: "https://beechcompanies.com/files/2021-black-business-directory.pdf",
  ownershipSourceLabel: "Beech Community Services 2021 Philadelphia Black Biz Directory",
  ownershipSourceKind: "approved_public" as const,
  officialWebsiteUrl: "https://www.3bmandt.com/",
  officialSocialUrl: "https://www.facebook.com/3bmandt/",
  observedOn: "2026-10-13",
  ownershipExpiresOn: "2027-10-13",
  reviewOn: "2027-04-13",
  decisionReason: "Current official website and Facebook identity match the retained business; Beech directory entry supports the recorded designation.",
  batchReference: "KINFOLK_DIRECTORY_COMPLETION_20261013_BATCH_001",
});

describe("documented discovery qualification payload", () => {
  it("creates a bounded audited qualification with ownership and both verified presence receipts", () => {
    const payload = buildDocumentedDiscoveryQualification(valid());
    expect(payload.eligibilityStatus).toBe("qualified");
    expect(payload.evidence.map((e) => e.field)).toEqual(["identity", "ownership", "official_website", "official_social"]);
    expect(payload.reconciliationReasonCode).toBe("source_ownership_and_official_presence_verified");
    expect(JSON.stringify(payload)).not.toMatch(/listingStatus|latitude|longitude|isDuplicate|blackOwned|map_pin/);
  });

  it("allows a social-only presence decision without inventing a website", () => {
    const payload = buildDocumentedDiscoveryQualification({ ...valid(), officialWebsiteUrl: "" });
    expect(payload.evidence.map((e) => e.field)).toEqual(["identity", "ownership", "official_social"]);
    expect(payload.reconciliationReasonCode).toBe("social_only_public_business");
  });

  it("rejects missing designation, official presence, non-HTTPS evidence, and stale review dates", () => {
    expect(() => buildDocumentedDiscoveryQualification({ ...valid(), ownershipDesignations: [] })).toThrow("recorded ownership designation");
    expect(() => buildDocumentedDiscoveryQualification({ ...valid(), officialWebsiteUrl: "", officialSocialUrl: "" })).toThrow("official website or official social");
    expect(() => buildDocumentedDiscoveryQualification({ ...valid(), officialWebsiteUrl: "http://example.test" })).toThrow("must use HTTPS");
    expect(() => buildDocumentedDiscoveryQualification({ ...valid(), reviewOn: "2026-10-13" })).toThrow("Next review date");
  });
});
