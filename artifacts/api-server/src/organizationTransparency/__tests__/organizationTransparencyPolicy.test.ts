import { describe, expect, it } from "vitest";
import {
  assertExperienceBoundary,
  experienceCategoriesFor,
  experienceContextForRelationship,
  initialOrganizationSurfaceState,
  isSurfacePubliclyAvailable,
  ownerActionMayMutateExperience,
  recommendedOrganizationSurfaceState,
} from "../policy";
import {
  validateOrganizationExperience,
  validateOrganizationSubmission,
} from "../validation";

describe("Organization Transparency surface separation", () => {
  it("starts every member-added organization outside public search, map, Kinfolk, and promotion", () => {
    const initial = initialOrganizationSurfaceState();
    expect(initial.factualStatus).toBe("pending_moderation");
    expect(isSurfacePubliclyAvailable(initial, "search")).toBe(false);
    expect(isSurfacePubliclyAvailable(initial, "map")).toBe(false);
    expect(isSurfacePubliclyAvailable(initial, "kinfolk")).toBe(false);
    expect(isSurfacePubliclyAvailable(initial, "promotion")).toBe(false);
  });

  it("allows a factual listing to be searchable without treating it as a map pin, Kinfolk result, or promotion", () => {
    const state = recommendedOrganizationSurfaceState({
      factualStatus: "factual_approved",
      ownershipStatus: "non_minority_owned",
      evidence: {
        hasCurrentIdentityEvidence: true,
        hasCurrentOfficialPresenceEvidence: true,
        hasCurrentOwnershipEvidence: false,
        hasVerifiedLocationEvidence: false,
      },
    });
    expect(isSurfacePubliclyAvailable(state, "search")).toBe(true);
    expect(isSurfacePubliclyAvailable(state, "map")).toBe(false);
    expect(isSurfacePubliclyAvailable(state, "kinfolk")).toBe(false);
    expect(isSurfacePubliclyAvailable(state, "promotion")).toBe(false);
    expect(isSurfacePubliclyAvailable(state, "experience")).toBe(true);
  });

  it("requires separate current ownership evidence before Kinfolk or promotional eligibility", () => {
    const withoutOwnershipReceipt = recommendedOrganizationSurfaceState({
      factualStatus: "factual_approved",
      ownershipStatus: "verified_minority_owned",
      evidence: {
        hasCurrentIdentityEvidence: true,
        hasCurrentOfficialPresenceEvidence: true,
        hasCurrentOwnershipEvidence: false,
        hasVerifiedLocationEvidence: true,
      },
    });
    expect(withoutOwnershipReceipt.kinfolkStatus).toBe("not_eligible");
    expect(withoutOwnershipReceipt.promotionStatus).toBe("not_eligible");

    const withReceipts = recommendedOrganizationSurfaceState({
      factualStatus: "factual_approved",
      ownershipStatus: "verified_minority_owned",
      evidence: {
        hasCurrentIdentityEvidence: true,
        hasCurrentOfficialPresenceEvidence: true,
        hasCurrentOwnershipEvidence: true,
        hasVerifiedLocationEvidence: true,
      },
    });
    expect(withReceipts.mapPinStatus).toBe("eligible");
    expect(withReceipts.kinfolkStatus).toBe("eligible");
    expect(withReceipts.promotionStatus).toBe("eligible");
  });
});

describe("Organization Experience boundaries", () => {
  it("uses care context for patient/caregiver and workplace context for workers", () => {
    expect(experienceContextForRelationship("patient")).toBe("care");
    expect(experienceContextForRelationship("caregiver")).toBe("care");
    expect(experienceContextForRelationship("former_employee")).toBe(
      "workplace",
    );
    expect(
      experienceCategoriesFor({
        organizationType: "hospital",
        relationship: "current_employee",
      }),
    ).toContain("staffing");
    expect(
      experienceCategoriesFor({
        organizationType: "hospital",
        relationship: "patient",
      }),
    ).toContain("informed_consent");
  });

  it("rejects role/context mismatches and universal star ratings", () => {
    expect(() =>
      assertExperienceBoundary({
        relationship: "patient",
        context: "workplace",
        categoryCodes: ["respect"],
        privacyLevel: "pseudonymous_public",
      }),
    ).toThrow("must use care context");

    expect(() =>
      validateOrganizationExperience(
        {
          relationship: "current_employee",
          categoryCodes: ["workplace_culture"],
          privacyLevel: "pseudonymous_public",
          rating: 5,
        },
        "employer",
      ),
    ).toThrow("structured themes, not star ratings");
  });

  it("does not allow an owner action to mutate member experience", () => {
    expect(ownerActionMayMutateExperience("public_response")).toBe(false);
    expect(ownerActionMayMutateExperience("factual_correction")).toBe(false);
    expect(ownerActionMayMutateExperience("dispute")).toBe(false);
  });
});

describe("Organization intake validation", () => {
  it("accepts a bounded factual member submission without promotion fields", () => {
    const input = validateOrganizationSubmission({
      legalName: "Example Care Network",
      organizationType: "healthcare_facility",
      ownershipStatus: "unknown",
      website: "example.org",
      location: { city: "Philadelphia", state: "PA" },
      relationshipToOrganization: "caregiver",
      clientRequestId: "organization-req-0001",
    });
    expect(input.website).toBe("https://example.org/");
    expect(input.organizationType).toBe("healthcare_facility");
    expect((input as Record<string, unknown>).promotionStatus).toBeUndefined();
  });

  it("does not let member intake self-assign a verified ownership status", () => {
    expect(() =>
      validateOrganizationSubmission({
        legalName: "Evidence Review Required Organization",
        organizationType: "employer",
        ownershipStatus: "verified_minority_owned",
        location: { city: "Philadelphia" },
        relationshipToOrganization: "customer",
      }),
    ).toThrow("separate evidence review");
  });
});
