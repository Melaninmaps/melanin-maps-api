import { randomUUID } from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  SERIOUS_CREDIBLE_THREAT_KIND,
  assessSeriousCredibleThreat,
  isCoarseThreatArea,
  type CoarseThreatArea,
  type SeriousCredibleThreatSubmission,
} from "../safety/seriousCredibleThreat";
import {
  unavailableSeriousCredibleThreatReviewQueue,
  type SeriousCredibleThreatReviewQueue,
} from "../safety/seriousCredibleThreatReviewQueue";

const REPORT_KEYS = new Set(["category", "consent", "area"]);
const CONSENT_KEYS = new Set(["privateReview", "anonymousCityLevelNotice"]);

interface ReporterThreatInput {
  category: string;
  consent: {
    privateReview: true;
    anonymousCityLevelNotice: true;
  };
  area: CoarseThreatArea;
}

export interface SeriousCredibleThreatRouterDependencies {
  reviewQueue?: SeriousCredibleThreatReviewQueue;
  now?: () => Date;
  createReportId?: () => string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.size && keys.every((key) => allowed.has(key));
}

/**
 * Member reports are intentionally smaller than the policy's privileged review
 * model. Clients may report only a threat category, both consent choices, and a
 * strict city/region area. They cannot provide a moderation decision, verified
 * evidence, expiry, or any precise location that could be converted to a notice.
 */
function parseReporterThreatInput(value: unknown): ReporterThreatInput | null {
  if (!isRecord(value) || !hasOnlyKeys(value, REPORT_KEYS)) return null;
  if (
    typeof value.category !== "string" ||
    value.category.trim().length === 0 ||
    value.category.trim().length > 100
  )
    return null;
  if (!isRecord(value.consent) || !hasOnlyKeys(value.consent, CONSENT_KEYS))
    return null;
  if (
    value.consent.privateReview !== true ||
    value.consent.anonymousCityLevelNotice !== true
  )
    return null;
  if (!isCoarseThreatArea(value.area)) return null;

  return {
    category: value.category.trim(),
    consent: {
      privateReview: true,
      anonymousCityLevelNotice: true,
    },
    area: {
      city: value.area.city.trim(),
      region: value.area.region.trim(),
    },
  };
}

/**
 * Dedicated member-reporting endpoint for serious credible threats. This is not
 * a Police/ICE observation endpoint, does not publish a notice, and has no push
 * provider integration. It only hands an unreviewed candidate to a private,
 * durable reviewer adapter when one is explicitly configured.
 */
export function createSeriousCredibleThreatRouter(
  dependencies: SeriousCredibleThreatRouterDependencies = {},
): IRouter {
  const router: IRouter = Router();
  const reviewQueue =
    dependencies.reviewQueue ?? unavailableSeriousCredibleThreatReviewQueue;
  const now = dependencies.now ?? (() => new Date());
  const createReportId = dependencies.createReportId ?? randomUUID;

  router.post(
    "/safety/serious-credible-threats/reports",
    async (req: Request, res: Response): Promise<void> => {
      // This route is mounted behind the member wall and repeats the check so a
      // future direct mount cannot accidentally make reporting anonymous.
      if (!req.user?.id) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const reported = parseReporterThreatInput(req.body);
      if (!reported) {
        res.status(400).json({
          error: "REPORT_INPUT_INVALID",
          message:
            "Reports require an approved threat category, both explicit consent choices, and city/region only.",
        });
        return;
      }

      const receivedAt = now();
      if (
        !(receivedAt instanceof Date) ||
        !Number.isFinite(receivedAt.getTime())
      ) {
        // Do not enqueue a record whose review/audit time cannot be trusted.
        res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
        return;
      }

      // The client never controls these fields. In particular, evidence remains
      // empty and moderation remains unreviewed until a privileged reviewer uses
      // the separate policy workflow. This must therefore be unpublishable.
      const candidateSubmission: SeriousCredibleThreatSubmission = {
        kind: SERIOUS_CREDIBLE_THREAT_KIND,
        category: reported.category,
        consent: reported.consent,
        area: reported.area,
        evidence: [],
        moderation: {
          decision: "unreviewed",
          moderatorId: null,
          reviewedAt: null,
          publicSummary: null,
        },
        requestedExpiresAt: null,
      };
      const initialAssessment = assessSeriousCredibleThreat(
        candidateSubmission,
        receivedAt,
      );

      if (initialAssessment.blockers.includes("invalid_category")) {
        res.status(400).json({
          error: "REPORT_INPUT_INVALID",
          message:
            "Reports require an approved threat category, both explicit consent choices, and city/region only.",
        });
        return;
      }

      // Defense in depth: a reporter-created record must never become queueable
      // for notifications or contain a public notice at this boundary.
      if (
        initialAssessment.eligibleToQueue ||
        initialAssessment.notificationState !== "not_eligible" ||
        initialAssessment.safeNotice !== null
      ) {
        res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
        return;
      }

      const reportId = createReportId();
      if (typeof reportId !== "string" || reportId.trim().length === 0) {
        res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
        return;
      }

      try {
        const admission = await reviewQueue.enqueueForPrivateReview({
          reportId,
          reporterUserId: req.user.id,
          receivedAt,
          reviewState: "pending_private_review",
          candidateSubmission,
          initialAssessment,
          irreversibleDeletion: false,
        });

        if (!admission.accepted) {
          res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
          return;
        }

        // Deliberately do not expose review contents, evidence, moderator state,
        // notice state, or a provider/delivery claim to the reporting client.
        res.status(202).json({
          reportId,
          reviewState: "pending_private_review",
        });
      } catch (error) {
        req.log?.error(
          { error },
          "Failed to hand off serious credible-threat report for private review",
        );
        res.status(503).json({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
      }
    },
  );

  return router;
}

const seriousCredibleThreatRouter = createSeriousCredibleThreatRouter();

export default seriousCredibleThreatRouter;
