import { describe, expect, it } from "vitest";
import {
  mapPinOnlyPatch,
  storedAddressMatchesMapEvidence,
  validateDocumentedDiscoveryReviewInput,
  validateMapPinEvidenceReviewInput,
} from "../registerDocumentedDiscoveryReviewRoutes";

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
    observedValue: {
      websiteUrl: "https://acme.example/",
      identityMatch: true,
      matchingSignals: ["business_name", "city"],
    },
  },
  {
    field: "official_social",
    sourceKind: "business_official",
    sourceUrl: "https://acme.example/contact",
    observedAt: "2026-10-05T00:00:00.000Z",
    confidence: "high",
    observedValue: {
      profileUrl: "https://www.instagram.com/acme/",
      identityMatch: true,
      matchingSignals: ["business_name"],
    },
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

const websiteCleanup = {
  status: "identity_mismatch" as const,
  originalWebsite: "https://unrelated.example/",
  finalDestination: "https://unrelated.example/landing",
  evidenceSourceUrl: "https://evidence.example/receipt/acme",
  evidenceSummary: "The destination identifies an unrelated business.",
  checkedAt: "2026-10-05T00:00:00.000Z",
};

function mapEvidenceRequest() {
  return {
    decisionReason: "An official contact page and approved geocoder confirm the unchanged physical address.",
    batchReference: "map-pilot-001",
    addressEvidence: {
      field: "address" as const,
      sourceKind: "business_official" as const,
      sourceUrl: "https://acme.example/contact",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: {
        address: "123 Example Street, Philadelphia, PA 19103",
        addressType: "physical",
        identityMatch: true,
        matchingSignals: ["business_name", "city", "address"],
      },
    },
    mapPinEvidence: {
      field: "map_pin" as const,
      sourceKind: "official_geocoder" as const,
      sourceUrl: "https://maps.googleapis.com/maps/api/geocode/json",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: {
        latitude: 39.9526,
        longitude: -75.1652,
        queryAddress: "123 Example Street, Philadelphia, PA 19103",
        formattedAddress: "123 Example Street, Philadelphia, PA 19103",
        addressMatch: true,
      },
    },
  };
}

describe("documented discovery review input", () => {
  it("requires ownership plus one official presence for a qualified decision", () => {
    const result = validateDocumentedDiscoveryReviewInput(qualified(), now);
    expect(result.eligibilityStatus).toBe("qualified");
    expect(result.evidence).toHaveLength(4);
    expect(validateDocumentedDiscoveryReviewInput(qualified(baseEvidence.slice(0, 3)), now).eligibilityStatus).toBe("qualified");
    expect(() => validateDocumentedDiscoveryReviewInput(qualified(baseEvidence.slice(0, 2)), now))
      .toThrow("official website or official social receipt");
  });

  it("accepts an identity-matched direct official social receipt without requiring a website link", () => {
    const socialOnly = [baseEvidence[1], {
      field: "official_social" as const,
      sourceKind: "business_official" as const,
      sourceUrl: "https://www.instagram.com/acme/",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: {
        profileUrl: "https://www.instagram.com/acme/",
        identityMatch: true,
        matchingSignals: ["business_name", "city"],
      },
    }];
    expect(validateDocumentedDiscoveryReviewInput(qualified(socialOnly), now)).toMatchObject({
      eligibilityStatus: "qualified",
      reconciliationReasonCode: "social_only_public_business",
    });
  });

  it("accepts an identity-matching LinkedIn or YouTube business profile as complete official-social evidence", () => {
    for (const profileUrl of ["https://www.linkedin.com/company/acme/", "https://www.youtube.com/@acme", "https://m.facebook.com/acme/"]) {
      const socialOnly = [baseEvidence[1], {
        field: "official_social" as const,
        sourceKind: "business_official" as const,
        sourceUrl: profileUrl,
        observedAt: "2026-10-05T00:00:00.000Z",
        confidence: "high" as const,
        observedValue: { profileUrl, identityMatch: true, matchingSignals: ["business_name"] },
      }];
      expect(validateDocumentedDiscoveryReviewInput(qualified(socialOnly), now).eligibilityStatus).toBe("qualified");
    }
  });

  it("rejects Yelp, marketplaces, and social profiles as an official website", () => {
    const yelp = structuredClone(baseEvidence);
    (yelp[2] as { observedValue: { websiteUrl: string } }).observedValue.websiteUrl = "https://www.yelp.com/biz/acme";
    expect(() => validateDocumentedDiscoveryReviewInput(qualified(yelp), now))
      .toThrow("official website may not be a directory, marketplace, or social profile");
  });

  it("rejects a generic directory as official-social proof", () => {
    const socialOnly = [baseEvidence[1], {
      field: "official_social" as const,
      sourceKind: "business_official" as const,
      sourceUrl: "https://www.instagram.com/acme/",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: {
        profileUrl: "https://www.yelp.com/biz/acme",
        identityMatch: true,
        matchingSignals: ["business_name"],
      },
    }];
    expect(() => validateDocumentedDiscoveryReviewInput(qualified(socialOnly), now))
      .toThrow("official social profile must use an approved business-controlled social host");
  });

  it("rejects an otherwise direct social profile when no identity-matching signal is recorded", () => {
    const socialOnly = [baseEvidence[1], {
      field: "official_social" as const,
      sourceKind: "business_official" as const,
      sourceUrl: "https://www.instagram.com/acme/",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: { profileUrl: "https://www.instagram.com/acme/" },
    }];
    expect(() => validateDocumentedDiscoveryReviewInput(qualified(socialOnly), now))
      .toThrow("official social evidence requires identityMatch: true");
  });

  it("allows an audited website cleanup while qualified official social remains active", () => {
    const socialOnly = [baseEvidence[1], baseEvidence[3]];
    const result = validateDocumentedDiscoveryReviewInput({ ...qualified(socialOnly), websiteCleanup }, now);
    expect(result.eligibilityStatus).toBe("qualified");
    expect(result.websiteCleanup).toMatchObject({ status: "identity_mismatch", originalWebsite: "https://unrelated.example/" });
  });

  it("allows a website-only cleanup with a reversible public hold when no valid official presence exists", () => {
    const result = validateDocumentedDiscoveryReviewInput({
      eligibilityStatus: "review_hold",
      decisionReason: "Stored website is unrelated and no official social or replacement site is currently evidenced.",
      websiteCleanup: { ...websiteCleanup, status: "unsafe_spam" as const },
    }, now);
    expect(result.eligibilityStatus).toBe("review_hold");
    expect(result.evidence).toEqual([]);
    expect(result.websiteCleanup?.status).toBe("unsafe_spam");
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

  it("accepts a separately audited physical address plus official-geocoder map pin", () => {
    const addressAndPin = [...baseEvidence, {
      field: "address" as const,
      sourceKind: "business_official" as const,
      sourceUrl: "https://acme.example/contact",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: { address: "123 Example Street, Philadelphia, PA 19103" },
    }, {
      field: "map_pin" as const,
      sourceKind: "official_geocoder" as const,
      sourceUrl: "https://maps.googleapis.com/maps/api/geocode/json",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: { latitude: 39.9526, longitude: -75.1652 },
    }];
    const result = validateDocumentedDiscoveryReviewInput(qualified(addressAndPin), now);
    expect((result.evidence ?? []).map((item) => item.field)).toContain("address");
    expect((result.evidence ?? []).map((item) => item.field)).toContain("map_pin");
  });

  it("accepts a map-only attachment only for an identity-matched exact physical address and approved geocoder", () => {
    const result = validateMapPinEvidenceReviewInput(mapEvidenceRequest(), now);
    expect(storedAddressMatchesMapEvidence("123 Example Street, Philadelphia, PA 19103", result)).toBe(true);
    expect(mapPinOnlyPatch(result, "address-receipt", "pin-receipt")).toEqual({
      latitude: 39.9526,
      longitude: -75.1652,
      addressEvidenceId: "address-receipt",
      mapPinEvidenceId: "pin-receipt",
    });
  });

  it("rejects map-only attachment without identity-matched official address evidence", () => {
    const request = mapEvidenceRequest();
    request.addressEvidence.observedValue.identityMatch = false;
    expect(() => validateMapPinEvidenceReviewInput(request, now)).toThrow("address evidence requires identityMatch: true");
  });

  it("rejects non-approved geocoder hosts and mismatched geocoder addresses", () => {
    const unknownGeocoder = mapEvidenceRequest();
    unknownGeocoder.mapPinEvidence.sourceUrl = "https://www.google.com/maps";
    expect(() => validateMapPinEvidenceReviewInput(unknownGeocoder, now)).toThrow("approved geocoder endpoint");

    const mismatch = mapEvidenceRequest();
    mismatch.mapPinEvidence.observedValue.formattedAddress = "124 Example Street, Philadelphia, PA 19103";
    expect(() => validateMapPinEvidenceReviewInput(mismatch, now)).toThrow("exact approved-geocoder address match");
  });

  it("rejects service areas, invalid coordinates, and attempts to use map evidence to change an address", () => {
    const serviceArea = mapEvidenceRequest();
    serviceArea.addressEvidence.observedValue.addressType = "service_area";
    expect(() => validateMapPinEvidenceReviewInput(serviceArea, now)).toThrow("physical street address");

    const invalidCoordinates = mapEvidenceRequest();
    invalidCoordinates.mapPinEvidence.observedValue.latitude = 91;
    expect(() => validateMapPinEvidenceReviewInput(invalidCoordinates, now)).toThrow("finite observedValue.latitude");

    const result = validateMapPinEvidenceReviewInput(mapEvidenceRequest(), now);
    expect(storedAddressMatchesMapEvidence("124 Example Street, Philadelphia, PA 19103", result)).toBe(false);
    expect(Object.keys(mapPinOnlyPatch(result, "address-receipt", "pin-receipt")).sort()).toEqual([
      "addressEvidenceId", "latitude", "longitude", "mapPinEvidenceId",
    ]);
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
