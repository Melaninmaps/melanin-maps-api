import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { registerOrganizationTransparencyRoutes } from "../registerOrganizationTransparencyRoutes";
import type { OrganizationTransparencyRepository } from "../postgresOrganizationTransparencyRepository";

const passThrough = (_req: Request, _res: Response, next: NextFunction) =>
  next();

function appFor(
  repository: OrganizationTransparencyRepository,
  memberId: string,
  role: "member" | "admin",
) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: memberId, role, email: `${memberId}@example.test` } as any;
    req.log = { error: () => undefined } as any;
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

function createP0Repository(): OrganizationTransparencyRepository {
  let organizationSubmitted = false;
  let organizationApproved = false;
  let experienceSubmitted = false;
  let experiencePublished = false;
  const profile = {
    id: "org-1",
    legalName: "Example Employer",
    displayName: null,
    organizationType: "employer" as const,
    ownershipStatus: "unknown",
    website: "https://example.test/",
    phone: null,
    factualStatus: "factual_approved" as const,
    searchStatus: "eligible" as const,
    mapPinStatus: "not_eligible" as const,
    kinfolkStatus: "not_eligible" as const,
    promotionStatus: "not_eligible" as const,
    experienceStatus: "eligible" as const,
    city: "Philadelphia",
    state: "PA",
    country: "USA",
  };
  const location = {
    id: "loc-1",
    organizationId: "org-1",
    name: "Main office",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    isPrimary: true,
  };

  return {
    findDuplicateCandidates: async () => [],
    findMemberSubmissionByClientRequest: async () => null,
    createMemberSubmission: async () => {
      organizationSubmitted = true;
      return { organizationId: "org-1", locationId: "loc-1" };
    },
    updateMemberSubmission: async () => null,
    getPublicProfile: async () => (organizationApproved ? profile : null),
    listPublicOrganizations: async () =>
      organizationApproved ? [profile] : [],
    listPublicLocations: async () => (organizationApproved ? [location] : []),
    getOrganizationForExperience: async () =>
      organizationApproved
        ? { organizationType: "employer", experienceStatus: "eligible" }
        : null,
    createExperience: async () => {
      experienceSubmitted = true;
      return { experienceId: "exp-1", status: "pending_moderation" as const };
    },
    findExperienceByClientRequest: async () => null,
    getExperienceSummary: async () => {
      const categoryCounts: Record<string, number> = experiencePublished
        ? { workplace_culture: 1 }
        : {};
      const relationshipCounts: Record<string, number> = experiencePublished
        ? { former_employee: 1 }
        : {};
      return {
        totalPublished: experiencePublished ? 1 : 0,
        categoryCounts,
        relationshipCounts,
      };
    },
    listPublicExperiences: async () =>
      experiencePublished
        ? [
            {
              id: "exp-1",
              organizationId: "org-1",
              organizationLocationId: "loc-1",
              city: "Philadelphia",
              state: "PA",
              relationship: "former_employee" as const,
              relationshipLabel: "Former employee",
              categoryCodes: ["workplace_culture"],
              narrative: "A moderator-approved contextual account.",
              submittedAt: "2026-10-15T00:00:00.000Z",
            },
          ]
        : [],
    listMemberActivity: async () => ({ organizations: [], experiences: [] }),
    createExperienceAppeal: async () => ({
      appealId: "appeal-1",
      status: "pending_moderation",
      created: true,
    }),
    listReviewQueue: async () => {
      const entries = [] as any[];
      if (organizationSubmitted && !organizationApproved)
        entries.push({
          kind: "organization",
          id: "org-1",
          organizationId: "org-1",
          organizationName: "Example Employer",
          organizationType: "employer",
          city: "Philadelphia",
          state: "PA",
          submittedAt: "2026-10-15T00:00:00.000Z",
          status: "pending_moderation",
        });
      if (experienceSubmitted && !experiencePublished)
        entries.push({
          kind: "experience",
          id: "exp-1",
          organizationId: "org-1",
          organizationName: "Example Employer",
          organizationType: "employer",
          city: "Philadelphia",
          state: "PA",
          submittedAt: "2026-10-15T00:01:00.000Z",
          status: "pending_moderation",
          relationship: "former_employee",
          privacyLevel: "pseudonymous_public",
          categoryCodes: ["workplace_culture"],
          narrative: "A moderator-approved contextual account.",
          moderationFlags: [],
        });
      return entries;
    },
    applyExperienceReview: async (_experienceId, _reviewerId, decision) => {
      if (decision.disposition !== "publish" || !experienceSubmitted)
        return null;
      experiencePublished = true;
      return {
        experienceId: "exp-1",
        status: "published" as const,
        privacyLevel: "pseudonymous_public" as const,
        reviewerReason: decision.reason,
      };
    },
    applyExperienceAppealDecision: async () => null,
    createOwnerClaim: async () => ({
      claimId: "claim-1",
      status: "pending_verification",
    }),
    hasApprovedOwnerClaim: async () => false,
    createOwnerAction: async () => ({
      actionId: "action-1",
      status: "pending_moderation",
    }),
    applyModerationDecision: async (_organizationId, _reviewerId, decision) => {
      if (
        decision.factualStatus !== "factual_approved" ||
        decision.locationStatus !== "factual_approved"
      )
        return null;
      organizationApproved = true;
      return {
        factualStatus: "factual_approved",
        searchStatus: "eligible",
        mapPinStatus: "not_eligible",
        kinfolkStatus: "not_eligible",
        promotionStatus: "not_eligible",
        experienceStatus: "eligible",
      };
    },
  };
}

describe("Organization Transparency P0 flow", () => {
  it("keeps organization and experience submissions private until independent moderator decisions, then exposes only a pseudonymous published experience", async () => {
    const repository = createP0Repository();
    const member = appFor(repository, "member-1", "member");
    const reviewer = appFor(repository, "admin-1", "admin");
    const anotherMember = appFor(repository, "member-2", "member");

    await request(member)
      .post("/api/community/organizations")
      .send({
        legalName: "Example Employer",
        organizationType: "employer",
        ownershipStatus: "unknown",
        location: { city: "Philadelphia", state: "PA" },
        relationshipToOrganization: "former_employee",
        clientRequestId: "organization-p0-flow-001",
      })
      .expect(201);

    await request(anotherMember).get("/api/organizations/org-1").expect(404);
    expect(
      (
        await request(reviewer)
          .get("/api/admin/organizations/review-queue")
          .expect(200)
      ).body.items,
    ).toHaveLength(1);

    await request(reviewer)
      .post("/api/admin/organizations/org-1/moderation")
      .send({
        factualStatus: "factual_approved",
        locationStatus: "factual_approved",
        searchStatus: "eligible",
        mapPinStatus: "not_eligible",
        kinfolkStatus: "not_eligible",
        promotionStatus: "not_eligible",
        experienceStatus: "eligible",
        reason: "Identity and primary location evidence reviewed.",
      })
      .expect(200);

    await request(member)
      .post("/api/organizations/org-1/experiences")
      .send({
        relationship: "former_employee",
        categoryCodes: ["workplace_culture"],
        privacyLevel: "pseudonymous_public",
        narrative: "A moderator-approved contextual account.",
        clientRequestId: "experience-p0-flow-001",
      })
      .expect(201);

    const experienceQueue = await request(reviewer)
      .get("/api/admin/organizations/review-queue")
      .expect(200);
    expect(experienceQueue.body.items[0]).toMatchObject({
      kind: "experience",
      id: "exp-1",
    });

    await request(reviewer)
      .post("/api/admin/organization-experiences/exp-1/decision")
      .send({
        disposition: "publish",
        reason: "Contextual narrative is safe for pseudonymous publication.",
      })
      .expect(200);

    const published = await request(anotherMember)
      .get("/api/organizations/org-1/experiences")
      .expect(200);
    expect(published.body).toMatchObject({
      summary: { totalPublished: 1 },
      experiences: [
        { relationshipLabel: "Former employee", city: "Philadelphia" },
      ],
    });
    expect(published.body.experiences[0]).not.toHaveProperty("authorMemberId");
  });
});
