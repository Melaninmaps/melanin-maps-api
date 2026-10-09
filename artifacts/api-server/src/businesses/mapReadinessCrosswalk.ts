import { hasTrustworthyMapCoordinate } from "./mapCoordinateIntegrity";
import { DOCUMENTED_DISCOVERY_POLICY_VERSION } from "./documentedDiscoveryEligibility";

export type MapReadinessCategory =
  | "A_VERIFIED_AND_MAP_READY"
  | "B_VERIFIED_BUT_TECHNICALLY_BLOCKED"
  | "C_VERIFIABLE_WITH_ADDITIONAL_EVIDENCE"
  | "D_LOCATION_NOT_SUITABLE_FOR_PUBLIC_PIN"
  | "E_IDENTITY_OR_OWNERSHIP_CONFLICT"
  | "F_CLOSED_DUPLICATE_OR_OTHER_REVIEW_HOLD";

export type MapReadinessCandidate = Readonly<{
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  status: string | null;
  listingStatus: string | null;
  isDuplicate: boolean;
  duplicateOfId: string | null;
  isSuperseded: boolean;
  address: string | null;
  serviceArea: string | null;
  publicLocationKind: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  eligibilityStatus: string | null;
  policyVersion: string | null;
  identityEvidenceId: string | null;
  ownershipEvidenceId: string | null;
  officialWebsiteEvidenceId: string | null;
  officialSocialEvidenceId: string | null;
  addressEvidenceId: string | null;
  mapPinEvidenceId: string | null;
  legacyMapLocationAttested?: boolean | null;
  ownershipSourceExpiresAt: string | null;
  reviewAfter: string | null;
  eligibilityDecisionReason: string | null;
  reconciliationState: string | null;
  reconciliationReasonCode: string | null;
  reconciliationRecommendedAction: string | null;
}>;

export type MapReadinessAssessment = Readonly<{
  category: MapReadinessCategory;
  exactTechnicalBlockers: string[];
  isCurrentDocumentedEligibility: boolean;
  hasTrustworthyCoordinates: boolean;
  publicLocationSuitability: "physical_location_evidenced" | "legacy_physical_location_attested" | "explicitly_not_suitable" | "unknown";
}>;

function hasFutureDate(value: string | null | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > now.getTime();
}

function normalized(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase("en-US") ?? "";
}

function isExplicitlyNotSuitableForPublicPin(candidate: MapReadinessCandidate): boolean {
  const kind = normalized(candidate.publicLocationKind);
  return ["online", "online_only", "service_area", "private", "private_residence", "home_based"].includes(kind)
    || Boolean(candidate.serviceArea?.trim());
}

function hasIdentityOrOwnershipConflict(candidate: MapReadinessCandidate): boolean {
  const text = [
    candidate.eligibilityStatus,
    candidate.eligibilityDecisionReason,
    candidate.reconciliationState,
    candidate.reconciliationReasonCode,
    candidate.reconciliationRecommendedAction,
  ].filter(Boolean).join(" ").toLocaleLowerCase("en-US");
  return /identity.*(conflict|mismatch)|ownership.*(conflict|mismatch)|conflict.*(identity|ownership)|identity_review/.test(text);
}

function isClosedDuplicateOrHeld(candidate: MapReadinessCandidate): boolean {
  const status = normalized(candidate.status);
  const listingStatus = normalized(candidate.listingStatus);
  const reconciliation = normalized(candidate.reconciliationState);
  return candidate.isDuplicate
    || Boolean(candidate.duplicateOfId)
    || candidate.isSuperseded
    || ["duplicate", "permanently_hidden", "removed", "deleted", "closed"].includes(status)
    || ["archived", "suspended", "removed"].includes(listingStatus)
    || reconciliation === "archive";
}

/**
 * This is deliberately stricter than a stored latitude/longitude test.  It
 * classifies a record from the current evidence graph and names every missing
 * map-only component instead of silently promoting a legacy coordinate.
 */
export function assessMapReadiness(
  candidate: MapReadinessCandidate,
  now: Date = new Date(),
): MapReadinessAssessment {
  const hasTrustworthyCoordinates = hasTrustworthyMapCoordinate({
    city: candidate.city,
    stateCode: candidate.state,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
  });
  const currentDocumentedEligibility = candidate.eligibilityStatus === "qualified"
    && candidate.policyVersion === DOCUMENTED_DISCOVERY_POLICY_VERSION
    && Boolean(candidate.identityEvidenceId)
    && Boolean(candidate.ownershipEvidenceId)
    && Boolean(candidate.officialWebsiteEvidenceId || candidate.officialSocialEvidenceId)
    && hasFutureDate(candidate.ownershipSourceExpiresAt, now)
    && hasFutureDate(candidate.reviewAfter, now);
  const explicitLocationHold = isExplicitlyNotSuitableForPublicPin(candidate);
  const hasPhysicalAddress = Boolean(candidate.address?.trim());
  const legacyLocationAttested = candidate.legacyMapLocationAttested === true;

  if (isClosedDuplicateOrHeld(candidate)) {
    return {
      category: "F_CLOSED_DUPLICATE_OR_OTHER_REVIEW_HOLD",
      exactTechnicalBlockers: ["canonical_public_lifecycle_hold"],
      isCurrentDocumentedEligibility: currentDocumentedEligibility,
      hasTrustworthyCoordinates,
      publicLocationSuitability: explicitLocationHold ? "explicitly_not_suitable" : "unknown",
    };
  }
  if (hasIdentityOrOwnershipConflict(candidate)) {
    return {
      category: "E_IDENTITY_OR_OWNERSHIP_CONFLICT",
      exactTechnicalBlockers: ["identity_or_ownership_conflict"],
      isCurrentDocumentedEligibility: currentDocumentedEligibility,
      hasTrustworthyCoordinates,
      publicLocationSuitability: explicitLocationHold ? "explicitly_not_suitable" : "unknown",
    };
  }
  if (explicitLocationHold) {
    return {
      category: "D_LOCATION_NOT_SUITABLE_FOR_PUBLIC_PIN",
      exactTechnicalBlockers: ["explicit_service_area_online_or_private_location"],
      isCurrentDocumentedEligibility: currentDocumentedEligibility,
      hasTrustworthyCoordinates,
      publicLocationSuitability: "explicitly_not_suitable",
    };
  }

  const missingEligibility: string[] = [];
  if (candidate.eligibilityStatus !== "qualified") missingEligibility.push("qualified_documented_eligibility");
  if (candidate.policyVersion !== DOCUMENTED_DISCOVERY_POLICY_VERSION) missingEligibility.push("current_policy_version");
  if (!candidate.identityEvidenceId) missingEligibility.push("identity_evidence_receipt");
  if (!candidate.ownershipEvidenceId) missingEligibility.push("ownership_evidence_receipt");
  if (!candidate.officialWebsiteEvidenceId && !candidate.officialSocialEvidenceId) {
    missingEligibility.push("official_website_or_social_evidence_receipt");
  }
  if (!hasFutureDate(candidate.ownershipSourceExpiresAt, now)) missingEligibility.push("current_ownership_evidence");
  if (!hasFutureDate(candidate.reviewAfter, now)) missingEligibility.push("current_review_window");

  if (!currentDocumentedEligibility) {
    return {
      category: "C_VERIFIABLE_WITH_ADDITIONAL_EVIDENCE",
      exactTechnicalBlockers: missingEligibility,
      isCurrentDocumentedEligibility: false,
      hasTrustworthyCoordinates,
      publicLocationSuitability: hasPhysicalAddress ? "unknown" : "unknown",
    };
  }

  const mapBlockers: string[] = [];
  if (!hasPhysicalAddress) mapBlockers.push("public_physical_street_address");
  if (!candidate.addressEvidenceId && !legacyLocationAttested) mapBlockers.push("first_party_physical_address_receipt");
  if (!hasTrustworthyCoordinates) mapBlockers.push("approved_geocoder_coordinates");
  if (!candidate.mapPinEvidenceId && !legacyLocationAttested) mapBlockers.push("approved_geocoder_map_receipt");

  if (mapBlockers.length === 0) {
    return {
      category: "A_VERIFIED_AND_MAP_READY",
      exactTechnicalBlockers: [],
      isCurrentDocumentedEligibility: true,
      hasTrustworthyCoordinates: true,
      publicLocationSuitability: legacyLocationAttested
        ? "legacy_physical_location_attested"
        : "physical_location_evidenced",
    };
  }

  // A current documented record with an address receipt and trustworthy
  // coordinates has the location facts already, but lacks the separate audited
  // map receipt/linkage. It is the narrow technical-attachment cohort.
  if (candidate.addressEvidenceId && hasTrustworthyCoordinates && !candidate.mapPinEvidenceId && !legacyLocationAttested) {
    return {
      category: "B_VERIFIED_BUT_TECHNICALLY_BLOCKED",
      exactTechnicalBlockers: ["approved_geocoder_map_receipt", "map_audit_attachment"],
      isCurrentDocumentedEligibility: true,
      hasTrustworthyCoordinates: true,
      publicLocationSuitability: "physical_location_evidenced",
    };
  }

  return {
    category: "C_VERIFIABLE_WITH_ADDITIONAL_EVIDENCE",
    exactTechnicalBlockers: mapBlockers,
    isCurrentDocumentedEligibility: true,
    hasTrustworthyCoordinates,
    publicLocationSuitability: "unknown",
  };
}
