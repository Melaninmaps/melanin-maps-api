import { describe, expect, it } from "vitest";
import { validateDocumentedDiscoveryReviewInput } from "../registerDocumentedDiscoveryReviewRoutes";

const now = new Date("2026-10-05T00:00:00.000Z");
const future = "2026-12-01T00:00:00.000Z";
const baseEvidence = [
  {
    field: "identity",
    sourceKind: "business_official",
    sourceUrl: "https://acme.example/about",
    observedAt: "2026-10-05T00:00:00.000Z",
    confidence: "high",
    observedValue: { businessName: "Acme" },
  },
  {
    field: "ownership",
    sourceKind: "approved_public",
    sourceUrl: "https://approved-directory.example/acme",
    observedAt: "2026-10-05T00:00:00.000Z",
    sourceExpiresAt: future,
    confidence: "high",
    observedValue: { designation: "Black / African American-Owned" },
  },
  {
    field: "official_website",
    sourceKind: "business_official",
    sourceUrl: "https://acme.example/",
    observedAt: "2026-10-05T00:00:00.000Z",
    confidence: "high",
    observedValue: { websiteUrl: "https://acme.example/" },
  },
  {
    field: "official_social",
    sourceKind: "business_official",
    sourceUrl: "https://acme.example/contact",
    observedAt: "2026-10-05T00:00:00.000Z",
    confidence: "high",
    observedValue: { profileUrl: "https://www.instagram.com/acme/" },
  },
] as const;

function qualified(evidence: readonly unknown[] = baseEvidence) {
  return {
    eligibilityStatus: "qualified",
    decisionReason: "Reviewed official website, social link, and dated ownership source.",
    ownershipDesignations: ["Black / African American-Owned"],
    ownershipSourceExpiresAt: future,
    reviewAfter: future,
    evidence,
  };
}

describe("documented discovery review input", () => {
  it("requires the complete receipt chain for a qualified decision", () => {
    const result = validateDocumentedDiscoveryReviewInput(qualified(), now);
    expect(result.eligibilityStatus).toBe("qualified");
    expect(result.evidence).toHaveLength(4);
    expect(() => validateDocumentedDiscoveryReviewInput(qualified(baseEvidence.slice(0, 3)), now))
      .toThrow("official social receipts");
  });

  it("rejects Yelp, marketplaces, and social profiles as an official website", () => {
    const yelp = structuredClone(baseEvidence);
    (yelp[2] as { observedValue: { websiteUrl: string } }).observedValue.websiteUrl = "https://www.yelp.com/biz/acme";
    expect(() => validateDocumentedDiscoveryReviewInput(qualified(yelp), now))
      .toThrow("official website may not be a directory, marketplace, or social profile");
  });

  it("requires an address receipt before a sourced geocode can enable a pin", () => {
    const withPin = [...baseEvidence, {
      field: "map_pin" as const,
      sourceKind: "official_geocoder" as const,
      sourceUrl: "https://maps.googleapis.com/maps/api/geocode/json",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: { latitude: 39.9526, longitude: -75.1652 },
    }];
    expect(() => validateDocumentedDiscoveryReviewInput(qualified(withPin), now))
      .toThrow("map pin qualification requires a documented physical-address receipt");
  });

  it("allows a reversible direct-name-only hold without inventing recommendation evidence", () => {
    const result = validateDocumentedDiscoveryReviewInput({
      eligibilityStatus: "direct_name_only",
      decisionReason: "No verified official social profile has been recorded yet.",
    }, now);
    expect(result.eligibilityStatus).toBe("direct_name_only");
    expect(result.evidence).toEqual([]);
  });
});
