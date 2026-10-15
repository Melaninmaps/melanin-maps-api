import type { Express, Request, RequestHandler, Response } from "express";
import { pool } from "@workspace/db";
import { isNamedAdmin } from "../lib/adminAuth";
import { requireApprovedMember } from "../middlewares/requireAuth";
import {
  organizationExperienceLimiter,
  organizationTransparencySubmissionLimiter,
} from "../middleware/rateLimiter";
import {
  assessOrganizationExperienceNarrative,
  OrganizationExperienceSafetyError,
} from "./experienceSafety";
import {
  ORGANIZATION_FACTUAL_STATUSES,
  SURFACE_STATUSES,
  type OrganizationFactualStatus,
  type SurfaceStatus,
} from "./policy";
import {
  DuplicateOrganizationSubmissionError,
  PostgresOrganizationTransparencyRepository,
  type ExperienceAppealDecision,
  type OrganizationModerationDecision,
  type OrganizationTransparencyRepository,
} from "./postgresOrganizationTransparencyRepository";
import {
  EXPERIENCE_REVIEW_DISPOSITIONS,
  type ExperienceReviewDecision,
} from "./reviewWorkflow";
import {
  validateOrganizationExperience,
  validateOrganizationExperienceAppeal,
  validateOrganizationOwnerAction,
  validateOrganizationSubmission,
} from "./validation";

type RouteDependencies = Readonly<{
  repository?: OrganizationTransparencyRepository;
  approvedMemberMiddleware?: RequestHandler;
  submissionLimiter?: RequestHandler;
  experienceLimiter?: RequestHandler;
}>;

function requiredMemberId(req: Request, res: Response): string | null {
  const memberId = req.user?.id;
  if (!memberId) {
    res
      .status(401)
      .json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return null;
  }
  return memberId;
}

function requiredNamedAdministrator(
  req: Request,
  res: Response,
): string | null {
  const memberId = requiredMemberId(req, res);
  if (!memberId) return null;
  if (!isNamedAdmin(req)) {
    res
      .status(403)
      .json({
        error: "Named administrator access required",
        code: "ADMIN_REQUIRED",
      });
    return null;
  }
  return memberId;
}

function queryText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
}

function queryLimit(value: unknown, fallback = 25, max = 100): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  return Math.max(1, Math.min(max, Number(value)));
}

function statusValue<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
): T[number] {
  if (typeof value !== "string" || !allowed.includes(value))
    throw new Error(`${field} is invalid`);
  return value as T[number];
}

export function parseOrganizationModerationDecision(
  input: unknown,
): OrganizationModerationDecision {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("moderation decision is required");
  const body = input as Record<string, unknown>;
  const factualStatus = statusValue(
    body.factualStatus,
    ORGANIZATION_FACTUAL_STATUSES,
    "factualStatus",
  );
  const locationStatus = statusValue(
    body.locationStatus,
    ORGANIZATION_FACTUAL_STATUSES,
    "locationStatus",
  );
  const searchStatus = statusValue(
    body.searchStatus,
    SURFACE_STATUSES,
    "searchStatus",
  );
  const mapPinStatus = statusValue(
    body.mapPinStatus,
    SURFACE_STATUSES,
    "mapPinStatus",
  );
  const kinfolkStatus = statusValue(
    body.kinfolkStatus,
    SURFACE_STATUSES,
    "kinfolkStatus",
  );
  const promotionStatus = statusValue(
    body.promotionStatus,
    SURFACE_STATUSES,
    "promotionStatus",
  );
  const experienceStatus = statusValue(
    body.experienceStatus,
    SURFACE_STATUSES,
    "experienceStatus",
  );
  const reason = queryText(body.reason, 2_000);
  if (!reason) throw new Error("reason is required");

  const surfaceStates = [
    searchStatus,
    mapPinStatus,
    kinfolkStatus,
    promotionStatus,
    experienceStatus,
  ];
  if (
    factualStatus !== "factual_approved" &&
    surfaceStates.includes("eligible")
  ) {
    throw new Error(
      "A non-approved factual profile cannot be eligible on a member-facing surface",
    );
  }
  if (
    factualStatus === "factual_approved" &&
    locationStatus !== "factual_approved"
  ) {
    throw new Error(
      "A member-visible organization requires an independently approved primary location",
    );
  }
  if (
    factualStatus !== "factual_approved" &&
    locationStatus === "factual_approved"
  ) {
    throw new Error(
      "A primary location cannot be approved while its organization is not factually approved",
    );
  }
  if (promotionStatus === "eligible" || kinfolkStatus === "eligible") {
    throw new Error(
      "Kinfolk and promotion eligibility require a separate evidence-receipt review",
    );
  }
  if (mapPinStatus === "eligible" && searchStatus !== "eligible") {
    throw new Error(
      "A map pin requires an independently searchable factual profile",
    );
  }
  return {
    factualStatus,
    locationStatus,
    searchStatus,
    mapPinStatus,
    kinfolkStatus,
    promotionStatus,
    experienceStatus,
    reason,
  };
}

function parseExperienceReviewDecision(
  input: unknown,
): ExperienceReviewDecision {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("experience decision is required");
  const body = input as Record<string, unknown>;
  const disposition = statusValue(
    body.disposition,
    EXPERIENCE_REVIEW_DISPOSITIONS,
    "disposition",
  );
  const reason = queryText(body.reason, 2_000);
  if (!reason) throw new Error("reason is required");
  return { disposition, reason };
}

function parseExperienceAppealDecision(
  input: unknown,
): ExperienceAppealDecision {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("appeal decision is required");
  const body = input as Record<string, unknown>;
  const disposition = statusValue(
    body.disposition,
    ["reopen", "decline"] as const,
    "disposition",
  );
  const reason = queryText(body.reason, 2_000);
  if (!reason) throw new Error("reason is required");
  return { disposition, reason };
}

function errorResponse(error: unknown, res: Response): boolean {
  if (error instanceof DuplicateOrganizationSubmissionError) {
    res
      .status(409)
      .json({
        error: error.message,
        code: error.code,
        organizationId: error.organizationId,
      });
    return true;
  }
  if (error instanceof OrganizationExperienceSafetyError) {
    res.status(422).json({ error: error.message, code: error.code });
    return true;
  }
  return false;
}

/**
 * Registers the Organization Transparency contract behind the explicit runtime
 * flag in app.ts. The routes are member-gated even though they precede the
 * aggregate router: source-only profile/experience data must not become a
 * public scrape target through registration order.
 */
export function registerOrganizationTransparencyRoutes(
  app: Express,
  dependencies: RouteDependencies = {},
): void {
  const repository =
    dependencies.repository ??
    new PostgresOrganizationTransparencyRepository(pool as never);
  const approvedMember =
    dependencies.approvedMemberMiddleware ?? requireApprovedMember;
  const submissionLimiter =
    dependencies.submissionLimiter ?? organizationTransparencySubmissionLimiter;
  const experienceLimiter =
    dependencies.experienceLimiter ?? organizationExperienceLimiter;

  app.get(
    "/api/organizations/duplicate-candidates",
    approvedMember,
    async (req: Request, res: Response) => {
      const legalName = queryText(req.query.legalName, 255);
      const city = queryText(req.query.city, 100);
      const state = queryText(req.query.state, 100) ?? undefined;
      if (!legalName || !city) {
        res.status(400).json({ error: "legalName and city are required" });
        return;
      }
      try {
        const candidates = await repository.findDuplicateCandidates({
          legalName,
          organizationType: "other",
          ownershipStatus: "unknown",
          location: { city, state },
          relationshipToOrganization: "customer",
        });
        res.json({ candidates, exactMatchOnly: true });
      } catch (error) {
        req.log?.error({ error }, "organization duplicate lookup failed");
        res
          .status(500)
          .json({ error: "Unable to check existing organizations" });
      }
    },
  );

  app.get(
    "/api/organizations",
    approvedMember,
    async (req: Request, res: Response) => {
      try {
        const organizations = await repository.listPublicOrganizations({
          query: queryText(req.query.query, 120) ?? undefined,
          city: queryText(req.query.city, 100) ?? undefined,
          limit: queryLimit(req.query.limit),
        });
        res.json({
          organizations,
          total: organizations.length,
          memberOnly: true,
        });
      } catch (error) {
        req.log?.error({ error }, "organization search failed");
        res.status(500).json({ error: "Unable to search organizations" });
      }
    },
  );

  app.post(
    "/api/community/organizations",
    approvedMember,
    submissionLimiter,
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      try {
        const body = (req.body ?? {}) as Record<string, unknown>;
        const input = validateOrganizationSubmission({
          ...body,
          clientRequestId:
            body.clientRequestId ?? req.header("idempotency-key"),
        });
        if (input.clientRequestId) {
          const existing = await repository.findMemberSubmissionByClientRequest(
            memberId,
            input.clientRequestId,
          );
          if (existing) {
            res
              .status(200)
              .json({
                ...existing,
                factualStatus: "pending_moderation",
                duplicateRetry: true,
                message:
                  "This organization submission is already saved for factual and duplicate review.",
              });
            return;
          }
        }
        const duplicates = await repository.findDuplicateCandidates(input);
        if (duplicates.length > 0) {
          res
            .status(409)
            .json({
              error:
                "A matching organization may already exist. Choose the existing organization or request a factual correction.",
              code: "POSSIBLE_DUPLICATE_ORGANIZATION",
              candidates: duplicates,
            });
          return;
        }
        const created = await repository.createMemberSubmission(
          input,
          memberId,
        );
        res
          .status(201)
          .json({
            ...created,
            factualStatus: "pending_moderation",
            duplicateRetry: false,
            message:
              "Organization submitted for factual and duplicate review. It is not searchable, pinnable, recommended, or promotable until separately approved.",
          });
      } catch (error) {
        if (errorResponse(error, res)) return;
        const message =
          error instanceof Error
            ? error.message
            : "Invalid organization submission";
        res
          .status(400)
          .json({ error: message, code: "INVALID_ORGANIZATION_SUBMISSION" });
      }
    },
  );

  app.get(
    "/api/community/organizations/mine",
    approvedMember,
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      try {
        const activity = await repository.listMemberActivity(memberId);
        res.json(activity);
      } catch (error) {
        req.log?.error({ error }, "organization member activity failed");
        res
          .status(500)
          .json({ error: "Unable to load your organization activity" });
      }
    },
  );

  app.patch(
    "/api/community/organizations/:organizationId",
    approvedMember,
    submissionLimiter,
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      try {
        const input = validateOrganizationSubmission(req.body);
        const amended = await repository.updateMemberSubmission(
          String(req.params.organizationId),
          input,
          memberId,
        );
        if (!amended) {
          res
            .status(409)
            .json({
              error:
                "Only your own organization submission awaiting a correction can be updated.",
              code: "ORGANIZATION_SUBMISSION_NOT_AMENDABLE",
            });
          return;
        }
        res.json({
          ...amended,
          factualStatus: "pending_moderation",
          message:
            "Your corrected organization submission has returned to factual review.",
        });
      } catch (error) {
        if (errorResponse(error, res)) return;
        res
          .status(400)
          .json({
            error:
              error instanceof Error
                ? error.message
                : "Invalid organization correction",
            code: "INVALID_ORGANIZATION_CORRECTION",
          });
      }
    },
  );

  app.get(
    "/api/organizations/:organizationId",
    approvedMember,
    async (req: Request, res: Response) => {
      try {
        const profile = await repository.getPublicProfile(
          String(req.params.organizationId),
        );
        if (!profile) {
          res.status(404).json({ error: "Organization not found" });
          return;
        }
        const [experienceSummary, locations, experiences] = await Promise.all([
          repository.getExperienceSummary(profile.id),
          repository.listPublicLocations(profile.id),
          repository.listPublicExperiences(profile.id, 5),
        ]);
        res.json({
          profile,
          locations,
          experienceSummary,
          experiences,
          transparency: {
            factualListing: true,
            mapPinEligible: profile.mapPinStatus === "eligible",
            kinfolkEligible: profile.kinfolkStatus === "eligible",
            promotionEligible: profile.promotionStatus === "eligible",
            experienceEligible: profile.experienceStatus === "eligible",
            note: "These surface states are independent. A factual listing does not imply promotion, a map pin, or a Kinfolk recommendation.",
          },
        });
      } catch (error) {
        req.log?.error({ error }, "organization profile lookup failed");
        res.status(500).json({ error: "Unable to load organization profile" });
      }
    },
  );

  app.get(
    "/api/organizations/:organizationId/experiences",
    approvedMember,
    async (req: Request, res: Response) => {
      try {
        const profile = await repository.getPublicProfile(
          String(req.params.organizationId),
        );
        if (!profile) {
          res.status(404).json({ error: "Organization not found" });
          return;
        }
        const [summary, experiences] = await Promise.all([
          repository.getExperienceSummary(profile.id),
          repository.listPublicExperiences(
            profile.id,
            queryLimit(req.query.limit),
          ),
        ]);
        res.json({
          summary,
          experiences,
          moderation:
            "Published experiences are pseudonymous and exclude private, held, rejected, and pending submissions.",
          ratingModel: "No star rating or universal score is used.",
        });
      } catch (error) {
        req.log?.error({ error }, "organization experience lookup failed");
        res
          .status(500)
          .json({ error: "Unable to load organization experiences" });
      }
    },
  );

  app.post(
    "/api/organizations/:organizationId/experiences",
    approvedMember,
    experienceLimiter,
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      const organizationId = String(req.params.organizationId);
      try {
        const organization =
          await repository.getOrganizationForExperience(organizationId);
        if (!organization) {
          res
            .status(404)
            .json({
              error:
                "Organization not found or not approved for member experiences",
            });
          return;
        }
        if (organization.experienceStatus !== "eligible") {
          res
            .status(409)
            .json({
              error: "Member experiences are not open for this organization",
              code: "EXPERIENCE_SURFACE_NOT_ELIGIBLE",
            });
          return;
        }
        const body = (req.body ?? {}) as Record<string, unknown>;
        const input = validateOrganizationExperience(
          {
            ...body,
            clientRequestId:
              body.clientRequestId ?? req.header("idempotency-key"),
          },
          organization.organizationType,
        );
        if (input.clientRequestId) {
          const existing = await repository.findExperienceByClientRequest(
            organizationId,
            memberId,
            input.clientRequestId,
          );
          if (existing) {
            res
              .status(200)
              .json({
                experience: existing,
                duplicateRetry: true,
                message:
                  "This experience is already in the moderation workflow.",
              });
            return;
          }
        }
        const locations = await repository.listPublicLocations(organizationId);
        const locationId =
          input.organizationLocationId ??
          (locations.length === 1 ? locations[0]?.id : undefined);
        if (
          !locationId ||
          !locations.some((location) => location.id === locationId)
        ) {
          res
            .status(400)
            .json({
              error:
                locations.length > 1
                  ? "Choose the organization location your experience concerns."
                  : "The selected organization location is not available for member experiences.",
              code: "ORGANIZATION_EXPERIENCE_LOCATION_REQUIRED",
            });
          return;
        }
        const assessment = assessOrganizationExperienceNarrative(
          input.narrative,
          input.relationship === "patient" || input.relationship === "caregiver"
            ? "care"
            : input.relationship === "customer"
              ? "customer"
              : "workplace",
        );
        const experience = await repository.createExperience(
          {
            ...input,
            narrative: assessment.normalizedNarrative,
            organizationLocationId: locationId,
          },
          organizationId,
          memberId,
          assessment.moderationFlags,
        );
        res
          .status(201)
          .json({
            experience,
            duplicateRetry: false,
            message:
              "Experience received for moderation. It will not publish as a rating, ownership claim, clinical-quality claim, or promotion signal.",
          });
      } catch (error) {
        if (errorResponse(error, res)) return;
        res
          .status(400)
          .json({
            error:
              error instanceof Error
                ? error.message
                : "Invalid organization experience",
            code: "INVALID_ORGANIZATION_EXPERIENCE",
          });
      }
    },
  );

  app.post(
    "/api/organization-experiences/:experienceId/appeals",
    approvedMember,
    experienceLimiter,
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      try {
        const input = validateOrganizationExperienceAppeal(req.body);
        const assessment = assessOrganizationExperienceNarrative(
          input.body,
          "customer",
        );
        const appeal = await repository.createExperienceAppeal(
          String(req.params.experienceId),
          memberId,
          { ...input, body: assessment.normalizedNarrative ?? input.body },
        );
        res
          .status(appeal.created ? 201 : 200)
          .json({
            appeal,
            message: appeal.created
              ? "Your appeal is with a reviewer. It does not change the original publication status by itself."
              : "Your existing appeal is already with a reviewer.",
          });
      } catch (error) {
        if (errorResponse(error, res)) return;
        res
          .status(400)
          .json({
            error:
              error instanceof Error
                ? error.message
                : "Invalid organization experience appeal",
            code: "INVALID_ORGANIZATION_EXPERIENCE_APPEAL",
          });
      }
    },
  );

  app.post(
    "/api/organizations/:organizationId/claim",
    approvedMember,
    submissionLimiter,
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      const note =
        queryText(
          (req.body as Record<string, unknown> | undefined)?.note,
          2_000,
        ) ?? undefined;
      try {
        const claim = await repository.createOwnerClaim(
          String(req.params.organizationId),
          memberId,
          note,
        );
        res
          .status(201)
          .json({
            claim,
            message:
              "Claim received for verification. Approval grants correction, public-response, and dispute workflows only; it does not grant suppression, deletion, promotion, or Kinfolk eligibility.",
          });
      } catch (error) {
        req.log?.error({ error }, "organization owner claim failed");
        res.status(500).json({ error: "Unable to record organization claim" });
      }
    },
  );

  app.post(
    "/api/organizations/:organizationId/owner-actions",
    approvedMember,
    submissionLimiter,
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      const organizationId = String(req.params.organizationId);
      try {
        if (
          !(await repository.hasApprovedOwnerClaim(organizationId, memberId))
        ) {
          res
            .status(403)
            .json({
              error: "An approved organization owner claim is required",
              code: "OWNER_CLAIM_REQUIRED",
            });
          return;
        }
        const input = validateOrganizationOwnerAction(req.body);
        const assessment = assessOrganizationExperienceNarrative(
          input.body,
          "customer",
        );
        const action = await repository.createOwnerAction(
          { ...input, body: assessment.normalizedNarrative ?? input.body },
          organizationId,
          memberId,
        );
        res
          .status(201)
          .json({
            action,
            message:
              "Owner action received for moderation. It does not alter or remove a member experience.",
          });
      } catch (error) {
        if (errorResponse(error, res)) return;
        res
          .status(400)
          .json({
            error:
              error instanceof Error ? error.message : "Invalid owner action",
            code: "INVALID_OWNER_ACTION",
          });
      }
    },
  );

  app.get(
    "/api/admin/organizations/review-queue",
    approvedMember,
    async (req: Request, res: Response) => {
      if (!requiredNamedAdministrator(req, res)) return;
      try {
        res.json({
          items: await repository.listReviewQueue(
            queryLimit(req.query.limit, 50, 100),
          ),
        });
      } catch (error) {
        req.log?.error({ error }, "organization review queue failed");
        res
          .status(500)
          .json({ error: "Unable to load organization review queue" });
      }
    },
  );

  app.post(
    "/api/admin/organizations/:organizationId/moderation",
    approvedMember,
    async (req: Request, res: Response) => {
      const adminMemberId = requiredNamedAdministrator(req, res);
      if (!adminMemberId) return;
      try {
        const decision = parseOrganizationModerationDecision(req.body);
        const state = await repository.applyModerationDecision(
          String(req.params.organizationId),
          adminMemberId,
          decision,
        );
        if (!state) {
          res.status(404).json({ error: "Organization not found" });
          return;
        }
        res.json({
          state,
          locationStatus: decision.locationStatus,
          auditReason: decision.reason,
        });
      } catch (error) {
        res
          .status(400)
          .json({
            error:
              error instanceof Error
                ? error.message
                : "Invalid moderation decision",
            code: "INVALID_ORGANIZATION_MODERATION",
          });
      }
    },
  );

  app.post(
    "/api/admin/organization-experiences/:experienceId/decision",
    approvedMember,
    async (req: Request, res: Response) => {
      const adminMemberId = requiredNamedAdministrator(req, res);
      if (!adminMemberId) return;
      try {
        const decision = parseExperienceReviewDecision(req.body);
        const result = await repository.applyExperienceReview(
          String(req.params.experienceId),
          adminMemberId,
          decision,
        );
        if (!result) {
          res
            .status(409)
            .json({
              error: "Experience is no longer awaiting moderation",
              code: "EXPERIENCE_ALREADY_DECIDED",
            });
          return;
        }
        res.json({
          result,
          message:
            result.status === "published"
              ? "Experience published pseudonymously."
              : "Experience retained outside public view.",
        });
      } catch (error) {
        res
          .status(400)
          .json({
            error:
              error instanceof Error
                ? error.message
                : "Invalid experience moderation decision",
            code: "INVALID_EXPERIENCE_MODERATION",
          });
      }
    },
  );

  app.post(
    "/api/admin/organization-experience-appeals/:appealId/decision",
    approvedMember,
    async (req: Request, res: Response) => {
      const adminMemberId = requiredNamedAdministrator(req, res);
      if (!adminMemberId) return;
      try {
        const decision = parseExperienceAppealDecision(req.body);
        const result = await repository.applyExperienceAppealDecision(
          String(req.params.appealId),
          adminMemberId,
          decision,
        );
        if (!result) {
          res
            .status(409)
            .json({
              error: "Appeal is no longer awaiting review",
              code: "APPEAL_ALREADY_DECIDED",
            });
          return;
        }
        res.json({
          result,
          message:
            result.status === "accepted"
              ? "Appeal accepted; the original experience returned to moderation."
              : "Appeal declined; the original experience remains unchanged.",
        });
      } catch (error) {
        res
          .status(400)
          .json({
            error:
              error instanceof Error
                ? error.message
                : "Invalid experience appeal decision",
            code: "INVALID_EXPERIENCE_APPEAL_DECISION",
          });
      }
    },
  );
}
