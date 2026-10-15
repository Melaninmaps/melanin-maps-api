/**
 * Organization Transparency policy
 *
 * This module is the server-authoritative separation between factual directory
 * identity, member experience, ownership/claim workflow, map presence, Kinfolk
 * research eligibility, and promotional eligibility.  A record may satisfy one
 * surface without satisfying another; no client value can bridge those states.
 */

export const ORGANIZATION_TRANSPARENCY_POLICY_VERSION =
  "organization_transparency_v1" as const;

export const ORGANIZATION_TYPES = [
  "business",
  "employer",
  "healthcare_facility",
  "hospital",
  "school",
  "professional_service",
  "retailer",
  "nonprofit",
  "government_service",
  "other",
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const OWNERSHIP_STATUSES = [
  "unknown",
  "self_identified_minority_owned",
  "verified_minority_owned",
  "non_minority_owned",
] as const;
export type OwnershipStatus = (typeof OWNERSHIP_STATUSES)[number];

export const EXPERIENCE_RELATIONSHIPS = [
  "current_employee",
  "former_employee",
  "contractor",
  "job_applicant",
  "customer",
  "patient",
  "caregiver",
] as const;
export type ExperienceRelationship = (typeof EXPERIENCE_RELATIONSHIPS)[number];

export const EXPERIENCE_CONTEXTS = ["workplace", "customer", "care"] as const;
export type ExperienceContext = (typeof EXPERIENCE_CONTEXTS)[number];

export const EXPERIENCE_PRIVACY_LEVELS = [
  "pseudonymous_public",
  "private_to_moderators",
] as const;
export type ExperiencePrivacyLevel = (typeof EXPERIENCE_PRIVACY_LEVELS)[number];

export const EXPERIENCE_STATUSES = [
  "pending_moderation",
  "published",
  "held",
  "rejected",
  "withdrawn",
] as const;
export type ExperienceStatus = (typeof EXPERIENCE_STATUSES)[number];

export const ORGANIZATION_FACTUAL_STATUSES = [
  "pending_moderation",
  "factual_approved",
  "correction_requested",
  "hidden",
  "rejected",
] as const;
export type OrganizationFactualStatus =
  (typeof ORGANIZATION_FACTUAL_STATUSES)[number];

export const SURFACE_STATUSES = [
  "not_eligible",
  "review_required",
  "eligible",
  "suppressed",
] as const;
export type SurfaceStatus = (typeof SURFACE_STATUSES)[number];

export const EMPLOYER_EXPERIENCE_CATEGORIES = [
  "management_respect",
  "compensation_and_advancement",
  "discrimination_and_retaliation",
  "accommodations",
  "scheduling_and_benefits",
  "complaint_handling",
  "workplace_culture",
] as const;

export const HEALTHCARE_PATIENT_EXPERIENCE_CATEGORIES = [
  "communication",
  "informed_consent",
  "pain_management",
  "respect",
  "accessibility",
  "discharge_follow_up",
] as const;

export const HEALTHCARE_STAFF_EXPERIENCE_CATEGORIES = [
  "staffing",
  "management",
  "safety_reporting",
  "scheduling",
  "advancement",
  "discrimination_and_retaliation",
] as const;

export const CUSTOMER_EXPERIENCE_CATEGORIES = [
  "service_respect",
  "accessibility",
  "communication",
  "complaint_handling",
] as const;

export type OrganizationSurfaceState = Readonly<{
  factualStatus: OrganizationFactualStatus;
  searchStatus: SurfaceStatus;
  mapPinStatus: SurfaceStatus;
  kinfolkStatus: SurfaceStatus;
  promotionStatus: SurfaceStatus;
  experienceStatus: SurfaceStatus;
}>;

export type OrganizationEvidenceState = Readonly<{
  hasCurrentIdentityEvidence: boolean;
  hasCurrentOfficialPresenceEvidence: boolean;
  hasCurrentOwnershipEvidence: boolean;
  hasVerifiedLocationEvidence: boolean;
}>;

export type OrganizationEligibilityInput = Readonly<{
  factualStatus: OrganizationFactualStatus;
  ownershipStatus: OwnershipStatus;
  evidence: OrganizationEvidenceState;
}>;

export type ExperienceInputBoundary = Readonly<{
  relationship: ExperienceRelationship;
  context: ExperienceContext;
  categoryCodes: readonly string[];
  privacyLevel: ExperiencePrivacyLevel;
}>;

export function experienceContextForRelationship(
  relationship: ExperienceRelationship,
): ExperienceContext {
  if (relationship === "patient" || relationship === "caregiver") return "care";
  if (
    relationship === "current_employee" ||
    relationship === "former_employee" ||
    relationship === "contractor" ||
    relationship === "job_applicant"
  )
    return "workplace";
  return "customer";
}

export function experienceCategoriesFor(input: {
  organizationType: OrganizationType;
  relationship: ExperienceRelationship;
}): readonly string[] {
  const context = experienceContextForRelationship(input.relationship);
  if (context === "care") return HEALTHCARE_PATIENT_EXPERIENCE_CATEGORIES;
  if (
    context === "workplace" &&
    (input.organizationType === "healthcare_facility" ||
      input.organizationType === "hospital")
  ) {
    return HEALTHCARE_STAFF_EXPERIENCE_CATEGORIES;
  }
  if (context === "workplace") return EMPLOYER_EXPERIENCE_CATEGORIES;
  return CUSTOMER_EXPERIENCE_CATEGORIES;
}

/**
 * Member-created records always begin isolated from public search, pins,
 * Kinfolk, promotion, and publishing. Moderation sets each surface explicitly.
 */
export function initialOrganizationSurfaceState(): OrganizationSurfaceState {
  return {
    factualStatus: "pending_moderation",
    searchStatus: "not_eligible",
    mapPinStatus: "not_eligible",
    kinfolkStatus: "not_eligible",
    promotionStatus: "not_eligible",
    experienceStatus: "review_required",
  };
}

/**
 * Determines a *review recommendation*, never a write. The administrator must
 * persist every approved surface separately and record an audit receipt.
 */
export function recommendedOrganizationSurfaceState(
  input: OrganizationEligibilityInput,
): OrganizationSurfaceState {
  if (input.factualStatus !== "factual_approved") {
    return initialOrganizationSurfaceState();
  }

  const searchable =
    input.evidence.hasCurrentIdentityEvidence &&
    input.evidence.hasCurrentOfficialPresenceEvidence;
  const ownershipPromotionEvidence =
    input.ownershipStatus === "verified_minority_owned" &&
    input.evidence.hasCurrentOwnershipEvidence;
  const mapEligible = searchable && input.evidence.hasVerifiedLocationEvidence;

  return {
    factualStatus: "factual_approved",
    // Factual search is broader than promoted discovery. It is intentionally
    // independent from ownership status, payment, claims, or review sentiment.
    searchStatus: searchable ? "eligible" : "review_required",
    mapPinStatus: mapEligible ? "eligible" : "not_eligible",
    // Kinfolk and promotion require current factual/official/ownership evidence.
    kinfolkStatus:
      ownershipPromotionEvidence && searchable ? "eligible" : "not_eligible",
    promotionStatus:
      ownershipPromotionEvidence && searchable ? "eligible" : "not_eligible",
    experienceStatus: "eligible",
  };
}

export function isSurfacePubliclyAvailable(
  state: OrganizationSurfaceState,
  surface: "search" | "map" | "kinfolk" | "promotion" | "experience",
): boolean {
  const statusBySurface = {
    search: state.searchStatus,
    map: state.mapPinStatus,
    kinfolk: state.kinfolkStatus,
    promotion: state.promotionStatus,
    experience: state.experienceStatus,
  } as const;
  return (
    state.factualStatus === "factual_approved" &&
    statusBySurface[surface] === "eligible"
  );
}

export function assertExperienceBoundary(input: ExperienceInputBoundary): void {
  const expectedContext = experienceContextForRelationship(input.relationship);
  if (input.context !== expectedContext) {
    throw new Error(
      `relationship ${input.relationship} must use ${expectedContext} context`,
    );
  }
  if (input.categoryCodes.length === 0 || input.categoryCodes.length > 3) {
    throw new Error("Select between one and three experience categories");
  }
  const allowed = new Set(
    input.context === "care"
      ? HEALTHCARE_PATIENT_EXPERIENCE_CATEGORIES
      : input.context === "workplace"
        ? [
            ...EMPLOYER_EXPERIENCE_CATEGORIES,
            ...HEALTHCARE_STAFF_EXPERIENCE_CATEGORIES,
          ]
        : CUSTOMER_EXPERIENCE_CATEGORIES,
  );
  for (const category of input.categoryCodes) {
    if (!allowed.has(category as never)) {
      throw new Error(`Unsupported experience category: ${category}`);
    }
  }
}

/**
 * Owner access permits narrowly scoped correction, response, or dispute records.
 * It never creates an implicit ability to edit, suppress, rank, or delete a
 * member experience; those choices belong to policy and moderation.
 */
export function ownerActionMayMutateExperience(_actionType: string): false {
  return false;
}

export const ORGANIZATION_TRANSPARENCY_POLICY_SUMMARY =
  "A factual organization listing, map pin, Kinfolk answer, promotional placement, ownership status, and member experience are separate decisions. Member experience never proves clinical quality, ownership, or legal compliance. Owner identity grants correction, response, and dispute workflows only; it never grants suppression or deletion of member experience.";
