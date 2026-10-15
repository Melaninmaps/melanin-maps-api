import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { registerOrganizationTransparencyRoutes } from "../registerOrganizationTransparencyRoutes";
import type { OrganizationTransparencyRepository } from "../postgresOrganizationTransparencyRepository";

const passThrough = (_req: Request, _res: Response, next: NextFunction) =>
  next();

function makeRepository(): OrganizationTransparencyRepository {
  return {
    findDuplicateCandidates: vi.fn().mockResolvedValue([]),
    findMemberSubmissionByClientRequest: vi.fn().mockResolvedValue(null),
    createMemberSubmission: vi
      .fn()
      .mockResolvedValue({ organizationId: "org-1", locationId: "loc-1" }),
    updateMemberSubmission: vi.fn().mockResolvedValue(null),
    getPublicProfile: vi.fn().mockResolvedValue({
      id: "org-1",
      legalName: "Example Employer",
      displayName: null,
      organizationType: "employer",
      ownershipStatus: "non_minority_owned",
      website: "https://example.test/",
      phone: null,
      factualStatus: "factual_approved",
      searchStatus: "eligible",
      mapPinStatus: "not_eligible",
      kinfolkStatus: "not_eligible",
      promotionStatus: "not_eligible",
      experienceStatus: "eligible",
      city: "Philadelphia",
      state: "PA",
      country: "USA",
    }),
    listPublicOrganizations: vi.fn().mockResolvedValue([]),
    listPublicLocations: vi
      .fn()
      .mockResolvedValue([
        {
          id: "loc-1",
          organizationId: "org-1",
          name: null,
          city: "Philadelphia",
          state: "PA",
          country: "USA",
          isPrimary: true,
        },
      ]),
    getOrganizationForExperience: vi
      .fn()
      .mockResolvedValue({
        organizationType: "employer",
        experienceStatus: "eligible",
      }),
    createExperience: vi
      .fn()
      .mockResolvedValue({
        experienceId: "exp-1",
        status: "pending_moderation",
      }),
    findExperienceByClientRequest: vi.fn().mockResolvedValue(null),
    getExperienceSummary: vi
      .fn()
      .mockResolvedValue({
        totalPublished: 0,
        categoryCounts: {},
        relationshipCounts: {},
      }),
    listPublicExperiences: vi.fn().mockResolvedValue([]),
    listMemberActivity: vi
      .fn()
      .mockResolvedValue({ organizations: [], experiences: [] }),
    createExperienceAppeal: vi
      .fn()
      .mockResolvedValue({
        appealId: "appeal-1",
        status: "pending_moderation",
        created: true,
      }),
    listReviewQueue: vi.fn().mockResolvedValue([]),
    applyExperienceReview: vi.fn().mockResolvedValue(null),
    applyExperienceAppealDecision: vi.fn().mockResolvedValue(null),
    createOwnerClaim: vi
      .fn()
      .mockResolvedValue({
        claimId: "claim-1",
        status: "pending_verification",
      }),
    hasApprovedOwnerClaim: vi.fn().mockResolvedValue(false),
    createOwnerAction: vi
      .fn()
      .mockResolvedValue({
        actionId: "action-1",
        status: "pending_moderation",
      }),
    applyModerationDecision: vi.fn().mockResolvedValue(null),
  };
}

function appWith(
  repository: OrganizationTransparencyRepository,
  role: "member" | "admin" = "member",
) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: "member-1", role, email: `${role}@example.test` } as any;
    req.log = { error: vi.fn(), warn: vi.fn() } as any;
    next();
  });
  registerOrganizationTransparencyRoutes(app, {
    repository,
    approvedMemberMiddleware: passThrough,
    submissionLimiter: passThrough,
    experienceLimiter: passThrough,
  });
  return app;
}

describe("Organization Transparency routes", () => {
  it("shows factual availability without implying a map pin, Kinfolk answer, or promotion", async () => {
    const response = await request(appWith(makeRepository()))
      .get("/api/organizations/org-1")
      .expect(200);
    expect(response.body.transparency).toMatchObject({
      factualListing: true,
      mapPinEligible: false,
      kinfolkEligible: false,
      promotionEligible: false,
      experienceEligible: true,
    });
  });

  it("requires a duplicate check and holds a new organization for moderation", async () => {
    const repository = makeRepository();
    const response = await request(appWith(repository))
      .post("/api/community/organizations")
      .send({
        legalName: "Example Employer",
        organizationType: "employer",
        ownershipStatus: "non_minority_owned",
        location: { city: "Philadelphia", state: "PA" },
        relationshipToOrganization: "current_employee",
        clientRequestId: "organization-req-0002",
      })
      .expect(201);
    expect(response.body).toMatchObject({
      organizationId: "org-1",
      factualStatus: "pending_moderation",
    });
    expect(repository.createMemberSubmission).toHaveBeenCalledTimes(1);
  });

  it("submits a location-attributed structured experience for moderation without a star rating", async () => {
    const repository = makeRepository();
    const response = await request(appWith(repository))
      .post("/api/organizations/org-1/experiences")
      .send({
        relationship: "former_employee",
        categoryCodes: ["workplace_culture", "management_respect"],
        privacyLevel: "pseudonymous_public",
        narrative: "A bounded workplace account for moderator review.",
        clientRequestId: "experience-req-0001",
      })
      .expect(201);
    expect(response.body.experience).toMatchObject({
      experienceId: "exp-1",
      status: "pending_moderation",
    });
    expect(repository.createExperience).toHaveBeenCalledWith(
      expect.objectContaining({ organizationLocationId: "loc-1" }),
      "org-1",
      "member-1",
      [],
    );

    await request(appWith(repository))
      .post("/api/organizations/org-1/experiences")
      .send({
        relationship: "former_employee",
        categoryCodes: ["workplace_culture"],
        privacyLevel: "pseudonymous_public",
        rating: 5,
      })
      .expect(400);
  });

  it("blocks direct identifiers in public or private experience narratives before storage", async () => {
    const repository = makeRepository();
    await request(appWith(repository))
      .post("/api/organizations/org-1/experiences")
      .send({
        relationship: "former_employee",
        categoryCodes: ["workplace_culture"],
        privacyLevel: "pseudonymous_public",
        narrative: "Call me at 215-555-0123 to discuss this workplace issue.",
      })
      .expect(422);
    expect(repository.createExperience).not.toHaveBeenCalled();
  });

  it("does not grant owner action access before an approved claim", async () => {
    const repository = makeRepository();
    await request(appWith(repository))
      .post("/api/organizations/org-1/owner-actions")
      .send({
        actionType: "public_response",
        targetExperienceId: "exp-1",
        body: "We appreciate this feedback.",
      })
      .expect(403);
    expect(repository.createOwnerAction).not.toHaveBeenCalled();
  });

  it("returns only repository-projected pseudonymous public experiences", async () => {
    const repository = makeRepository();
    vi.mocked(repository.listPublicExperiences).mockResolvedValue([
      {
        id: "exp-1",
        organizationId: "org-1",
        organizationLocationId: "loc-1",
        city: "Philadelphia",
        state: "PA",
        relationship: "former_employee",
        relationshipLabel: "Former employee",
        categoryCodes: ["workplace_culture"],
        narrative: "A moderated contextual experience.",
        submittedAt: "2026-10-15T00:00:00.000Z",
      },
    ]);
    const response = await request(appWith(repository))
      .get("/api/organizations/org-1/experiences")
      .expect(200);
    expect(response.body.experiences[0]).toMatchObject({
      relationshipLabel: "Former employee",
      city: "Philadelphia",
    });
    expect(response.body.experiences[0]).not.toHaveProperty("authorMemberId");
  });

  it("does not let an admin toggle substitute for a location receipt or Kinfolk/promotion evidence", async () => {
    const repository = makeRepository();
    await request(appWith(repository, "admin"))
      .post("/api/admin/organizations/org-1/moderation")
      .send({
        factualStatus: "factual_approved",
        locationStatus: "factual_approved",
        searchStatus: "eligible",
        mapPinStatus: "not_eligible",
        kinfolkStatus: "eligible",
        promotionStatus: "eligible",
        experienceStatus: "eligible",
        reason: "No evidence receipt has been supplied.",
      })
      .expect(400);
    expect(repository.applyModerationDecision).not.toHaveBeenCalled();
  });
});
