import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { checkContent } from "../lib/contentFilter";
import {
  ORGANIZATION_FACTUAL_STATUSES,
  SURFACE_STATUSES,
  type OrganizationFactualStatus,
  type SurfaceStatus,
} from "./policy";
import {
  PostgresOrganizationTransparencyRepository,
  type OrganizationModerationDecision,
  type OrganizationTransparencyRepository,
} from "./postgresOrganizationTransparencyRepository";
import {
  validateOrganizationExperience,
  validateOrganizationOwnerAction,
  validateOrganizationSubmission,
} from "./validation";

function isAdministrator(req: Request): boolean {
  const user = req.user as { role?: string; email?: string } | undefined;
  if (user?.role === "admin") return true;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return Boolean(user?.email && adminEmails.includes(user.email));
}

function requiredMemberId(req: Request, res: Response): string | null {
  const memberId = req.user?.id;
  if (!memberId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return memberId;
}

function queryText(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > maxLength) return null;
  return text;
}

function statusValue(
  value: unknown,
  allowed: readonly string[],
  field: string,
): string {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`${field} is invalid`);
  }
  return value;
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
  ) as OrganizationFactualStatus;
  const searchStatus = statusValue(
    body.searchStatus,
    SURFACE_STATUSES,
    "searchStatus",
  ) as SurfaceStatus;
  const mapPinStatus = statusValue(
    body.mapPinStatus,
    SURFACE_STATUSES,
    "mapPinStatus",
  ) as SurfaceStatus;
  const kinfolkStatus = statusValue(
    body.kinfolkStatus,
    SURFACE_STATUSES,
    "kinfolkStatus",
  ) as SurfaceStatus;
  const promotionStatus = statusValue(
    body.promotionStatus,
    SURFACE_STATUSES,
    "promotionStatus",
  ) as SurfaceStatus;
  const experienceStatus = statusValue(
    body.experienceStatus,
    SURFACE_STATUSES,
    "experienceStatus",
  ) as SurfaceStatus;
  const reason = queryText(body.reason, "reason", 2_000);
  if (!reason) throw new Error("reason is required");

  const states = [
    searchStatus,
    mapPinStatus,
    kinfolkStatus,
    promotionStatus,
    experienceStatus,
  ];
  if (factualStatus !== "factual_approved" && states.includes("eligible")) {
    throw new Error(
      "A non-approved factual profile cannot be eligible on a member-facing surface",
    );
  }
  if (promotionStatus === "eligible" || kinfolkStatus === "eligible") {
    // Promotion and Kinfolk require current identity, official-presence, and
    // ownership receipts. This foundation intentionally does not accept an
    // admin toggle as proof; the dedicated evidence-receipt slice must approve it.
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
    searchStatus,
    mapPinStatus,
    kinfolkStatus,
    promotionStatus,
    experienceStatus,
    reason,
  };
}

/**
 * Registers the standalone Organization Transparency contract. app.ts only
 * calls this behind ORGANIZATION_TRANSPARENCY_ENABLED=true, which defaults off
 * until the approval-required migration and release review are complete.
 */
export function registerOrganizationTransparencyRoutes(
  app: Express,
  repository: OrganizationTransparencyRepository = new PostgresOrganizationTransparencyRepository(
    pool as never,
  ),
): void {
  app.get(
    "/api/organizations/duplicate-candidates",
    async (req: Request, res: Response) => {
      const legalName = queryText(req.query.legalName, "legalName", 255);
      const city = queryText(req.query.city, "city", 100);
      const state = queryText(req.query.state, "state", 100) ?? undefined;
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

  app.post(
    "/api/community/organizations",
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      try {
        const input = validateOrganizationSubmission(req.body);
        const duplicates = await repository.findDuplicateCandidates(input);
        if (duplicates.length > 0) {
          res.status(409).json({
            error:
              "A matching organization may already exist. Choose the existing organization or request a factual correction.",
            code: "POSSIBLE_DUPLICATE_ORGANIZATION",
            candidates: duplicates,
          });
          return;
        }
        if (input.submitterNote) {
          const content = checkContent(input.submitterNote);
          if (!content.ok) {
            res.status(422).json({
              error: content.reason,
              code: "CONTENT_POLICY_VIOLATION",
            });
            return;
          }
        }
        const created = await repository.createMemberSubmission(
          input,
          memberId,
        );
        res.status(201).json({
          organizationId: created.organizationId,
          locationId: created.locationId,
          factualStatus: "pending_moderation",
          message:
            "Organization submitted for factual and duplicate review. It is not searchable, pinnable, recommended, or promotable until separately approved.",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Invalid organization submission";
        res.status(400).json({ error: message });
      }
    },
  );

  app.get(
    "/api/organizations/:organizationId",
    async (req: Request, res: Response) => {
      try {
        const profile = await repository.getPublicProfile(
          String(req.params.organizationId),
        );
        if (!profile) {
          res.status(404).json({ error: "Organization not found" });
          return;
        }
        const experienceSummary = await repository.getExperienceSummary(
          profile.id,
        );
        res.json({
          profile,
          experienceSummary,
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
    async (req: Request, res: Response) => {
      try {
        const profile = await repository.getPublicProfile(
          String(req.params.organizationId),
        );
        if (!profile) {
          res.status(404).json({ error: "Organization not found" });
          return;
        }
        const summary = await repository.getExperienceSummary(profile.id);
        res.json({
          summary,
          moderation:
            "Published summaries exclude private, held, rejected, and pending experiences.",
          ratingModel: "No star rating or universal score is used.",
        });
      } catch (error) {
        req.log?.error({ error }, "organization experience summary failed");
        res
          .status(500)
          .json({ error: "Unable to load organization experience summary" });
      }
    },
  );

  app.post(
    "/api/organizations/:organizationId/experiences",
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      const organizationId = String(req.params.organizationId);
      try {
        const organization =
          await repository.getOrganizationForExperience(organizationId);
        if (!organization) {
          res.status(404).json({
            error:
              "Organization not found or not approved for member experiences",
          });
          return;
        }
        if (organization.experienceStatus !== "eligible") {
          res.status(409).json({
            error: "Member experiences are not open for this organization",
          });
          return;
        }
        const input = validateOrganizationExperience(
          req.body,
          organization.organizationType,
        );
        if (input.narrative) {
          const content = checkContent(input.narrative);
          if (!content.ok) {
            res.status(422).json({
              error: content.reason,
              code: "CONTENT_POLICY_VIOLATION",
            });
            return;
          }
        }
        const experience = await repository.createExperience(
          input,
          organizationId,
          memberId,
        );
        res.status(201).json({
          experience,
          message:
            "Experience received for moderation. It will not publish as a rating, ownership claim, clinical-quality claim, or promotion signal.",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Invalid organization experience";
        res.status(400).json({ error: message });
      }
    },
  );

  app.post(
    "/api/organizations/:organizationId/claim",
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      const note =
        queryText(
          (req.body as Record<string, unknown> | undefined)?.note,
          "note",
          2_000,
        ) ?? undefined;
      try {
        const claim = await repository.createOwnerClaim(
          String(req.params.organizationId),
          memberId,
          note,
        );
        res.status(201).json({
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
    async (req: Request, res: Response) => {
      const memberId = requiredMemberId(req, res);
      if (!memberId) return;
      const organizationId = String(req.params.organizationId);
      try {
        const isOwner = await repository.hasApprovedOwnerClaim(
          organizationId,
          memberId,
        );
        if (!isOwner) {
          res.status(403).json({
            error: "An approved organization owner claim is required",
          });
          return;
        }
        const input = validateOrganizationOwnerAction(req.body);
        const content = checkContent(input.body);
        if (!content.ok) {
          res
            .status(422)
            .json({ error: content.reason, code: "CONTENT_POLICY_VIOLATION" });
          return;
        }
        const action = await repository.createOwnerAction(
          input,
          organizationId,
          memberId,
        );
        res.status(201).json({
          action,
          message:
            "Owner action received for moderation. It does not alter or remove a member experience.",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid owner action";
        res.status(400).json({ error: message });
      }
    },
  );

  app.post(
    "/api/admin/organizations/:organizationId/moderation",
    async (req: Request, res: Response) => {
      const adminMemberId = requiredMemberId(req, res);
      if (!adminMemberId) return;
      if (!isAdministrator(req)) {
        res.status(403).json({ error: "Administrator access required" });
        return;
      }
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
        res.json({ state, auditReason: decision.reason });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Invalid moderation decision";
        res.status(400).json({ error: message });
      }
    },
  );
}
