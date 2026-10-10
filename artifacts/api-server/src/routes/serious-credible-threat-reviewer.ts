import { Router, type IRouter, type Request, type Response } from "express";
import { isNamedAdmin } from "../lib/adminAuth";
import type { ThreatEvidenceReference } from "../safety/seriousCredibleThreat";
import {
  unavailableSeriousCredibleThreatPrivateModerator,
  type PrivateSeriousThreatReviewDecisionInput,
  type PrivateSeriousThreatReviewRecord,
  type SeriousCredibleThreatPrivateModerator,
} from "../safety/seriousCredibleThreatReviewQueue";

const APPROVAL_KEYS = new Set([
  "decision",
  "evidence",
  "publicSummary",
  "requestedExpiresAt",
]);
const REJECTION_KEYS = new Set(["decision"]);
const EVIDENCE_KEYS = new Set([
  "referenceId",
  "kind",
  "independentlyVerified",
  "verifiedAt",
]);
const EVIDENCE_KINDS = new Set([
  "official_public_safety_source",
  "trusted_organization",
  "independent_witness_record",
]);

export interface SeriousCredibleThreatPrivateModeratorRouterDependencies {
  moderator?: SeriousCredibleThreatPrivateModerator;
  now?: () => Date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.size && keys.every((key) => allowed.has(key));
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length > 64) return null;
  const parsed = new Date(value);
  return isValidDate(parsed) ? parsed : null;
}

function parseEvidence(value: unknown): readonly ThreatEvidenceReference[] | null {
  if (!Array.isArray(value) || value.length > 20) return null;
  const parsed: ThreatEvidenceReference[] = [];
  for (const reference of value) {
    if (!isRecord(reference) || !hasOnlyKeys(reference, EVIDENCE_KEYS)) return null;
    if (
      typeof reference.referenceId !== "string"
      || reference.referenceId.trim().length === 0
      || reference.referenceId.trim().length > 160
      || typeof reference.kind !== "string"
      || !EVIDENCE_KINDS.has(reference.kind)
      || reference.independentlyVerified !== true
    ) {
      return null;
    }
    const verifiedAt = parseDate(reference.verifiedAt);
    if (!verifiedAt) return null;
    parsed.push({
      referenceId: reference.referenceId.trim(),
      kind: reference.kind as ThreatEvidenceReference["kind"],
      independentlyVerified: true,
      verifiedAt,
    });
  }
  return parsed;
}

/**
 * The moderator identity and review time are derived by the server. Request
 * payloads cannot name a moderator, set notice/delivery status, or add fields
 * outside this strictly private review decision.
 */
function parsePrivateReviewDecision(
  value: unknown,
  moderatorId: string,
  reviewedAt: Date,
): PrivateSeriousThreatReviewDecisionInput | null {
  if (!isRecord(value) || typeof value.decision !== "string") return null;
  if (value.decision === "rejected") {
    return hasOnlyKeys(value, REJECTION_KEYS)
      ? {
          reportId: "",
          decision: "rejected",
          moderatorId,
          reviewedAt,
        }
      : null;
  }
  if (value.decision !== "approved" || !hasOnlyKeys(value, APPROVAL_KEYS)) {
    return null;
  }
  if (
    typeof value.publicSummary !== "string"
    || value.publicSummary.trim().length === 0
    || value.publicSummary.trim().length > 280
  ) {
    return null;
  }
  const evidence = parseEvidence(value.evidence);
  const requestedExpiresAt = parseDate(value.requestedExpiresAt);
  if (!evidence || !requestedExpiresAt) return null;
  return {
    reportId: "",
    decision: "approved",
    moderatorId,
    reviewedAt,
    evidence,
    publicSummary: value.publicSummary.trim(),
    requestedExpiresAt,
  };
}

function requireNamedModerator(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  if (!isNamedAdmin(req)) {
    res.status(403).json({ error: "Private moderator access required" });
    return null;
  }
  return req.user.id;
}

/**
 * Deliberately small private projection. The durable store retains the opaque
 * reporter identifier for a separately governed follow-up process, but this
 * route never returns it (nor a raw assessment, notice, or delivery state).
 */
function privateModeratorItem(record: PrivateSeriousThreatReviewRecord) {
  return {
    reportId: record.reportId,
    receivedAt: record.receivedAt,
    reviewState: record.reviewState,
    category: record.candidateSubmission.category,
    consent: record.candidateSubmission.consent,
    area: record.candidateSubmission.area,
    evidence: record.candidateSubmission.evidence.map((reference) => ({
      referenceId: reference.referenceId,
      kind: reference.kind,
      independentlyVerified: reference.independentlyVerified,
      verifiedAt: reference.verifiedAt,
    })),
  };
}

/**
 * Named-admin-only reviewer surface. It is intentionally isolated from the
 * ordinary moderation router and exposes no publishing, notification, deletion,
 * reporter-identity, or retention-management operation.
 */
export function createSeriousCredibleThreatPrivateModeratorRouter(
  dependencies: SeriousCredibleThreatPrivateModeratorRouterDependencies = {},
): IRouter {
  const router: IRouter = Router();
  const moderator = dependencies.moderator
    ?? unavailableSeriousCredibleThreatPrivateModerator;
  const now = dependencies.now ?? (() => new Date());

  router.get(
    "/moderation/serious-credible-threats/reviews",
    async (req: Request, res: Response): Promise<void> => {
      if (!requireNamedModerator(req, res)) return;
      try {
        const reviews = await moderator.listPendingPrivateReviews(25);
        if (!reviews.available) {
          res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
          return;
        }
        res.json({ items: reviews.items.map(privateModeratorItem) });
      } catch (error) {
        req.log?.error(
          { error },
          "Failed to load serious credible-threat private review items",
        );
        res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
      }
    },
  );

  router.patch(
    "/moderation/serious-credible-threats/reviews/:reportId",
    async (req: Request, res: Response): Promise<void> => {
      const moderatorId = requireNamedModerator(req, res);
      if (!moderatorId) return;
      const reportId = typeof req.params.reportId === "string"
        ? req.params.reportId.trim()
        : "";
      const reviewedAt = now();
      if (
        reportId.length === 0
        || reportId.length > 160
        || !isValidDate(reviewedAt)
      ) {
        res.status(400).json({ error: "REVIEW_DECISION_INVALID" });
        return;
      }
      const decision = parsePrivateReviewDecision(
        req.body,
        moderatorId,
        reviewedAt,
      );
      if (!decision) {
        res.status(400).json({ error: "REVIEW_DECISION_INVALID" });
        return;
      }

      try {
        const result = await moderator.decidePrivateReview({
          ...decision,
          reportId,
        });
        if (!result.accepted) {
          if (result.reason === "unavailable") {
            res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
          } else if (result.reason === "not_found") {
            res.status(404).json({ error: "PRIVATE_REVIEW_NOT_FOUND" });
          } else if (result.reason === "already_reviewed") {
            res.status(409).json({ error: "PRIVATE_REVIEW_ALREADY_DECIDED" });
          } else {
            res.status(400).json({ error: "REVIEW_DECISION_INVALID" });
          }
          return;
        }

        // An accepted private review is intentionally not a publication or
        // notification claim. A separate explicit workflow would be required.
        res.json({
          reportId: result.record.reportId,
          reviewState: result.record.reviewState,
          privateDecision: {
            decision: result.record.privateDecision?.decision,
            reviewedAt: result.record.privateDecision?.reviewedAt,
            publicationState: "not_published",
          },
        });
      } catch (error) {
        req.log?.error(
          { error },
          "Failed to record serious credible-threat private review decision",
        );
        res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
      }
    },
  );

  return router;
}

const seriousCredibleThreatPrivateModeratorRouter =
  createSeriousCredibleThreatPrivateModeratorRouter();

export default seriousCredibleThreatPrivateModeratorRouter;
