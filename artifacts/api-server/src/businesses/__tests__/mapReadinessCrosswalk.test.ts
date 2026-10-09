import { describe, expect, it } from "vitest";
import { DOCUMENTED_DISCOVERY_POLICY_VERSION } from "../documentedDiscoveryEligibility";
import { assessMapReadiness, type MapReadinessCandidate } from "../mapReadinessCrosswalk";

const now = new Date("2026-10-09T00:00:00.000Z");
const current = {
  id: "map-ready",
  name: "Map Ready Business",
  city: "Philadelphia",
  state: "PA",
  status: "active",
  listingStatus: "live_unclaimed",
  isDuplicate: false,
  duplicateOfId: null,
  isSuperseded: false,
  address: "123 Walnut Street, Philadelphia, PA 19103",
  serviceArea: null,
  publicLocationKind: "storefront",
  latitude: 39.9492,
  longitude: -75.1587,
  eligibilityStatus: "qualified",
  policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
  identityEvidenceId: "identity",
  ownershipEvidenceId: "ownership",
  officialWebsiteEvidenceId: "website",
  officialSocialEvidenceId: null,
  addressEvidenceId: "address",
  mapPinEvidenceId: "map-pin",
  ownershipSourceExpiresAt: "2027-01-01T00:00:00.000Z",
  reviewAfter: "2026-12-01T00:00:00.000Z",
  eligibilityDecisionReason: "Current documented qualification",
  reconciliationState: "reviewed_qualified",
  reconciliationReasonCode: "source_ownership_and_official_presence_verified",
  reconciliationRecommendedAction: "qualify_kinfolk_current",
} as const satisfies MapReadinessCandidate;

describe("map readiness crosswalk", () => {
  it("marks only a current canonical business with all map evidence as map-ready", () => {
    expect(assessMapReadiness(current, now)).toMatchObject({
      category: "A_VERIFIED_AND_MAP_READY",
      exactTechnicalBlockers: [],
      isCurrentDocumentedEligibility: true,
      hasTrustworthyCoordinates: true,
    });
  });

  it("separates a missing map receipt/linkage from missing verification evidence", () => {
    expect(assessMapReadiness({ ...current, mapPinEvidenceId: null }, now)).toMatchObject({
      category: "B_VERIFIED_BUT_TECHNICALLY_BLOCKED",
      exactTechnicalBlockers: ["approved_geocoder_map_receipt", "map_audit_attachment"],
    });
    expect(assessMapReadiness({ ...current, ownershipEvidenceId: null }, now)).toMatchObject({
      category: "C_VERIFIABLE_WITH_ADDITIONAL_EVIDENCE",
    });
  });

  it("does not equate a street address or legacy city-center coordinate with a map-ready location", () => {
    expect(assessMapReadiness({
      ...current,
      latitude: 39.9526,
      longitude: -75.1652,
      mapPinEvidenceId: null,
    }, now)).toMatchObject({
      category: "C_VERIFIABLE_WITH_ADDITIONAL_EVIDENCE",
      hasTrustworthyCoordinates: false,
      exactTechnicalBlockers: ["approved_geocoder_coordinates", "approved_geocoder_map_receipt"],
    });
  });

  it("keeps explicit service-area providers out of public pin candidacy", () => {
    expect(assessMapReadiness({
      ...current,
      serviceArea: "Philadelphia metro",
      address: null,
      addressEvidenceId: null,
      mapPinEvidenceId: null,
      latitude: null,
      longitude: null,
    }, now)).toMatchObject({
      category: "D_LOCATION_NOT_SUITABLE_FOR_PUBLIC_PIN",
      publicLocationSuitability: "explicitly_not_suitable",
    });
  });

  it("holds conflicts and duplicate/superseded records before any map action", () => {
    expect(assessMapReadiness({
      ...current,
      reconciliationReasonCode: "source_identity_mismatch",
    }, now)).toMatchObject({ category: "E_IDENTITY_OR_OWNERSHIP_CONFLICT" });
    expect(assessMapReadiness({
      ...current,
      isDuplicate: true,
      duplicateOfId: "canonical-business",
    }, now)).toMatchObject({ category: "F_CLOSED_DUPLICATE_OR_OTHER_REVIEW_HOLD" });
  });
});
