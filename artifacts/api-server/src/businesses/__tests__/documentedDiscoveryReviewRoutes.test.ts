import { describe, expect, it } from "vitest";
import {
  isExactMapPinAttachmentReplay,
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
        isServiceArea: false,
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

  it("rejects map pin evidence from the broad eligibility route", () => {
    const withPin = [...baseEvidence, {
      field: "map_pin" as const,
      sourceKind: "official_geocoder" as const,
      sourceUrl: "https://maps.googleapis.com/maps/api/geocode/json",
      observedAt: "2026-10-05T00:00:00.000Z",
      confidence: "high" as const,
      observedValue: { latitude: 39.9526, longitude: -75.1652 },
    }];
    expect(() => validateDocumentedDiscoveryReviewInput(qualified(withPin), now))
      .toThrow("dedicated audited map-evidence attachment route");
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

  it("accepts only complete address-component equivalents for directional and street-type abbreviations", () => {
    const request = mapEvidenceRequest();
    request.addressEvidence.observedValue.address = "1226 N 52nd St, Philadelphia, PA 19131";
    request.mapPinEvidence.sourceUrl = "https://nominatim.openstreetmap.org/search?format=jsonv2";
    request.mapPinEvidence.observedValue.queryAddress = "1226 N 52nd St, Philadelphia, PA 19131";
    request.mapPinEvidence.observedValue.formattedAddress = "1226, North 52nd Street, Carroll Park, Philadelphia, Pennsylvania, 19131, United States";
    (request.mapPinEvidence.observedValue as Record<string, unknown>).addressComponents = {
      houseNumber: "1226",
      directional: "North",
      streetName: "52nd",
      streetType: "Street",
      city: "Philadelphia",
      state: "Pennsylvania",
      postalCode: "19131",
    };

    const result = validateMapPinEvidenceReviewInput(request, now);
    expect(storedAddressMatchesMapEvidence("1226 N. 52nd Street, Philadelphia, PA 19131", result)).toBe(true);
    expect(storedAddressMatchesMapEvidence("1226 N. 52nd Street, Philadelphia, PA", result)).toBe(false);
  });

  it("rejects a component-equivalent map request when the approved geocoder postcode conflicts", () => {
    const request = mapEvidenceRequest();
    request.addressEvidence.observedValue.address = "1226 N 52nd St, Philadelphia, PA 19131";
    request.mapPinEvidence.sourceUrl = "https://nominatim.openstreetmap.org/search?format=jsonv2";
    request.mapPinEvidence.observedValue.queryAddress = "1226 N 52nd St, Philadelphia, PA 19131";
    request.mapPinEvidence.observedValue.formattedAddress = "1226, North 52nd Street, Philadelphia, Pennsylvania, 19199, United States";
    (request.mapPinEvidence.observedValue as Record<string, unknown>).addressComponents = {
      houseNumber: "1226",
      directional: "North",
      streetName: "52nd",
      streetType: "Street",
      city: "Philadelphia",
      state: "Pennsylvania",
      postalCode: "19199",
    };

    expect(() => validateMapPinEvidenceReviewInput(request, now)).toThrow("exact approved-geocoder address match");
  });

  it("rejects a partial address-component receipt rather than falling back to string equality", () => {
    const request = mapEvidenceRequest();
    (request.mapPinEvidence.observedValue as Record<string, unknown>).addressComponents = { postalCode: "19103" };
    expect(() => validateMapPinEvidenceReviewInput(request, now)).toThrow("exact approved-geocoder address match");
  });

  it("rejects an unsupported supplied directional component instead of treating it as absent", () => {
    const request = mapEvidenceRequest();
    (request.mapPinEvidence.observedValue as Record<string, unknown>).addressComponents = {
      houseNumber: "123",
      directional: "northeast",
      streetName: "Example",
      streetType: "Street",
      city: "Philadelphia",
      state: "Pennsylvania",
      postalCode: "19103",
    };
    expect(() => validateMapPinEvidenceReviewInput(request, now)).toThrow("exact approved-geocoder address match");
  });

  it("rejects an incomplete stored address even when legacy receipt strings match literally", () => {
    const request = mapEvidenceRequest();
    request.addressEvidence.observedValue.address = "123 Example Street, Philadelphia, PA";
    request.mapPinEvidence.observedValue.queryAddress = "123 Example Street, Philadelphia, PA";
    request.mapPinEvidence.observedValue.formattedAddress = "123 Example Street, Philadelphia, PA";
    const result = validateMapPinEvidenceReviewInput(request, now);
    expect(storedAddressMatchesMapEvidence("123 Example Street, Philadelphia, PA", result)).toBe(false);
  });

  it("recognizes only an exact committed map attachment as a safe retry", () => {
    const result = validateMapPinEvidenceReviewInput(mapEvidenceRequest(), now);
    const existing = {
      latitude: "39.9526",
      longitude: "-75.1652",
      decisionReason: result.decisionReason,
      addressEvidence: {
        id: "address-receipt",
        fieldName: result.addressEvidence.field,
        sourceKind: result.addressEvidence.sourceKind,
        sourceUrl: result.addressEvidence.sourceUrl,
        sourceLabel: null,
        observedAt: new Date(result.addressEvidence.observedAt),
        sourceExpiresAt: null,
        confidence: result.addressEvidence.confidence,
        observedValue: result.addressEvidence.observedValue,
      },
      mapPinEvidence: {
        id: "map-receipt",
        fieldName: result.mapPinEvidence.field,
        sourceKind: result.mapPinEvidence.sourceKind,
        sourceUrl: result.mapPinEvidence.sourceUrl,
        sourceLabel: null,
        observedAt: new Date(result.mapPinEvidence.observedAt),
        sourceExpiresAt: null,
        confidence: result.mapPinEvidence.confidence,
        observedValue: result.mapPinEvidence.observedValue,
      },
    };
    expect(isExactMapPinAttachmentReplay(result, existing)).toBe(true);
    expect(isExactMapPinAttachmentReplay({ ...result, decisionReason: "A newly observed correction requires a separate audit event." }, existing)).toBe(false);
    expect(isExactMapPinAttachmentReplay({
      ...result,
      mapPinEvidence: {
        ...result.mapPinEvidence,
        observedValue: { ...result.mapPinEvidence.observedValue, longitude: -75.1653 },
      },
    }, existing)).toBe(false);
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

  it("rejects service areas, malformed coordinates, and attempts to use map evidence to change an address", () => {
    const serviceArea = mapEvidenceRequest();
    serviceArea.addressEvidence.observedValue.addressType = "service_area";
    expect(() => validateMapPinEvidenceReviewInput(serviceArea, now)).toThrow("physical street address");

    const malformedServiceArea = mapEvidenceRequest();
    (malformedServiceArea.addressEvidence.observedValue as Record<string, unknown>).isServiceArea = "false";
    expect(() => validateMapPinEvidenceReviewInput(malformedServiceArea, now)).toThrow("physical street address");

    const invalidCoordinates = mapEvidenceRequest();
    invalidCoordinates.mapPinEvidence.observedValue.latitude = 91;
    expect(() => validateMapPinEvidenceReviewInput(invalidCoordinates, now)).toThrow("finite observedValue.latitude");

    for (const malformed of [Number.NaN]) {
      const malformedCoordinates = mapEvidenceRequest();
      (malformedCoordinates.mapPinEvidence.observedValue as Record<string, unknown>).latitude = malformed;
      expect(() => validateMapPinEvidenceReviewInput(malformedCoordinates, now)).toThrow("finite observedValue.latitude");
    }
    for (const malformed of [null, "", true, "39.9526"]) {
      const malformedCoordinates = mapEvidenceRequest();
      (malformedCoordinates.mapPinEvidence.observedValue as Record<string, unknown>).latitude = malformed;
      expect(() => validateMapPinEvidenceReviewInput(malformedCoordinates, now)).toThrow("finite numeric observedValue.latitude");
    }

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
