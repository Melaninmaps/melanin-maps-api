import { describe, expect, it } from "vitest";
import { validateDocumentedDiscoveryReviewInput } from "../registerDocumentedDiscoveryReviewRoutes";

const now = new Date("2026-10-05T00:00:00.000Z");
const future = "2026-12-01T00:00:00.000Z";
const baseEvidence = [
  { field: "identity", sourceKind: "business_official", sourceUrl: "https://acme.example/about", observedAt: "2026-10-05T00:00:00.000Z", confidence: "high", observedValue: { businessName: "Acme" } },
  { field: "ownership", sourceKind: "approved_public", sourceUrl: "https://approved-directory.example/acme", observedAt: "2026-10-05T00:00:00.000Z", sourceExpiresAt: future, confidence: "high", observedValue: { designation: "Black / African American-Owned" } },
  { field: "official_website", sourceKind: "business_official", sourceUrl: "https://acme.example/", observedAt: "2026-10-05T00:00:00.000Z", confidence: "high", observedValue: { websiteUrl: "https://acme.example/" } },
  { field: "official_social", sourceKind: "business_official", sourceUrl: "https://acme.example/contact", observedAt: "2026-10-05T00:00:00.000Z", confidence: "high", observedValue: { profileUrl: "https://www.instagram.com/acme/" } },
] as const;
function publicEligible(evidence: readonly unknown[] = baseEvidence) { return { eligibilityStatus: "public_eligible", decisionReason: "Reviewed official website, social link, and dated ownership source.", ownershipDesignations: ["Black / African American-Owned"], ownershipSourceExpiresAt: future, reviewAfter: future, evidence }; }

describe("documented Directory review input", () => {
  it("requires identity, ownership, and one official presence for a public eligible decision", () => {
    const result = validateDocumentedDiscoveryReviewInput(publicEligible(), now);
    expect(result.eligibilityStatus).toBe("public_eligible"); expect(result.evidence).toHaveLength(4);
    expect(validateDocumentedDiscoveryReviewInput(publicEligible(baseEvidence.slice(0, 3)), now).eligibilityStatus).toBe("public_eligible");
    expect(() => validateDocumentedDiscoveryReviewInput(publicEligible(baseEvidence.slice(1, 3)), now)).toThrow("identity, ownership");
  });
  it("accepts a founder-directory observed official social receipt without requiring a website link", () => {
    const socialOnly = [baseEvidence[0], baseEvidence[1], { field: "official_social" as const, sourceKind: "founder_directory" as const, sourceUrl: "https://founder-directory.example/listing/acme", observedAt: "2026-10-05T00:00:00.000Z", confidence: "high" as const, observedValue: { profileUrl: "https://www.instagram.com/acme/" } }];
    expect(validateDocumentedDiscoveryReviewInput(publicEligible(socialOnly), now).eligibilityStatus).toBe("public_eligible");
  });
  it("rejects Yelp, marketplaces, and social profiles as an official website", () => {
    const yelp = structuredClone(baseEvidence); (yelp[2] as { observedValue: { websiteUrl: string } }).observedValue.websiteUrl = "https://www.yelp.com/biz/acme";
    expect(() => validateDocumentedDiscoveryReviewInput(publicEligible(yelp), now)).toThrow("official website may not be a directory, marketplace, or social profile");
  });
  it("requires an address receipt before a sourced geocode can enable a pin", () => {
    const withPin = [...baseEvidence, { field: "map_pin" as const, sourceKind: "official_geocoder" as const, sourceUrl: "https://maps.googleapis.com/maps/api/geocode/json", observedAt: "2026-10-05T00:00:00.000Z", confidence: "high" as const, observedValue: { latitude: 39.9526, longitude: -75.1652 } }];
    expect(() => validateDocumentedDiscoveryReviewInput(publicEligible(withPin), now)).toThrow("map pin qualification requires a documented physical-address receipt");
  });
  it("requires evidence for an explicit non-public review state", () => {
    const hold = validateDocumentedDiscoveryReviewInput({ eligibilityStatus: "official_presence_unresolved", decisionReason: "No verified official social profile has been recorded yet.", evidence: [baseEvidence[0]] }, now);
    expect(hold.eligibilityStatus).toBe("official_presence_unresolved");
    expect(() => validateDocumentedDiscoveryReviewInput({ eligibilityStatus: "unreviewed", decisionReason: "No source" }, now)).toThrow("held decisions require");
  });
});
