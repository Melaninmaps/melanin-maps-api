import type {
  ThreatEvidenceReference,
  SeriousCredibleThreatSubmission,
  SeriousThreatAssessment,
} from "./seriousCredibleThreat";
import {
  SERIOUS_CREDIBLE_THREAT_KIND,
  assessSeriousCredibleThreat,
  isCoarseThreatArea,
} from "./seriousCredibleThreat";

/**
 * Restricted handoff record for the serious credible-threat reviewer workflow.
 * It deliberately has no public notice or provider-delivery capability. An
 * adapter may persist this private record for authorized reviewers, but may not
 * derive a notice from it without separately satisfying seriousCredibleThreat.
 */
export interface PrivateSeriousThreatReviewItem {
  readonly reportId: string;
  readonly reporterUserId: string;
  readonly receivedAt: Date;
  readonly reviewState: "pending_private_review";
  readonly candidateSubmission: SeriousCredibleThreatSubmission;
  readonly initialAssessment: SeriousThreatAssessment;
  /** This handoff is append-only; this interface exposes no destructive action. */
  readonly irreversibleDeletion: false;
}

export type PrivateReviewQueueAdmission =
  | { accepted: true }
  | { accepted: false; reason: "unavailable" | "rejected" };

/**
 * A private-only boundary. There is intentionally no list/read method here:
 * reviewer access belongs to a separately authorized implementation, not this
 * member-facing reporting route.
 */
export interface SeriousCredibleThreatReviewQueue {
  enqueueForPrivateReview(
    item: PrivateSeriousThreatReviewItem,
  ): Promise<PrivateReviewQueueAdmission>;
}

/**
 * Safe default for environments without a configured durable reviewer handoff.
 * Reject rather than retaining sensitive reports in process memory or claiming
 * that anyone received, reviewed, or was notified about the report.
 */
export const unavailableSeriousCredibleThreatReviewQueue: SeriousCredibleThreatReviewQueue =
  {
    async enqueueForPrivateReview(): Promise<PrivateReviewQueueAdmission> {
      return { accepted: false, reason: "unavailable" };
    },
  };

/**
 * Private-review state is deliberately distinct from publication and delivery
 * state. A reviewer decision never creates a public notice, queue entry, or
 * provider request.
 */
export type PrivateSeriousThreatReviewState =
  | "pending_private_review"
  | "approved_private_review"
  | "rejected_private_review";

export interface PrivateSeriousThreatReviewDecision {
  readonly decision: "approved" | "rejected";
  readonly moderatorId: string;
  readonly reviewedAt: Date;
  /** Always not_published: publication has a separate, future workflow. */
  readonly publicationState: "not_published";
  /** Never infer a notification queue from a private-review decision. */
  readonly notificationState: "not_eligible";
}

export interface PrivateSeriousThreatReviewRecord
  extends Omit<PrivateSeriousThreatReviewItem, "reviewState"> {
  readonly reviewState: PrivateSeriousThreatReviewState;
  readonly privateDecision: PrivateSeriousThreatReviewDecision | null;
}

export interface PrivateSeriousThreatReviewDecisionInput {
  readonly reportId: string;
  readonly decision: "approved" | "rejected";
  /** Must come from authenticated moderator identity, never request JSON. */
  readonly moderatorId: string;
  readonly reviewedAt: Date;
  /** Required for approval; omitted for rejection. */
  readonly evidence?: readonly ThreatEvidenceReference[];
  /** Required for approval; moderator-authored and non-identifying. */
  readonly publicSummary?: string;
  /** Required for approval and constrained by the policy's expiry window. */
  readonly requestedExpiresAt?: Date;
}

export type PrivateSeriousThreatReviewDecisionResult =
  | { accepted: true; record: PrivateSeriousThreatReviewRecord }
  | {
      accepted: false;
      reason: "unavailable" | "not_found" | "already_reviewed" | "invalid_decision";
    };

export type PrivateSeriousThreatReviewListResult =
  | { available: true; items: readonly PrivateSeriousThreatReviewRecord[] }
  | { available: false };

/**
 * This is the privileged half of the private-review boundary. It is not used
 * by the member reporting route and must only be handed to a named-admin
 * interface. It has no read/write operation for notices or notifications.
 */
export interface SeriousCredibleThreatPrivateModerator {
  listPendingPrivateReviews(
    limit: number,
  ): Promise<PrivateSeriousThreatReviewListResult>;
  decidePrivateReview(
    input: PrivateSeriousThreatReviewDecisionInput,
  ): Promise<PrivateSeriousThreatReviewDecisionResult>;
}

/**
 * Contract for an explicitly provisioned, durable private store. The source
 * tree intentionally provides no default implementation and no schema/setup
 * path: enabling storage requires separate retention approval and operations
 * wiring. The compare-and-set decision write prevents two reviewers from
 * silently approving/rejecting the same pending report.
 */
export interface DurablePrivateSeriousThreatReviewStore {
  appendPending(
    item: PrivateSeriousThreatReviewItem,
  ): Promise<"stored" | "duplicate">;
  listPending(
    limit: number,
  ): Promise<readonly PrivateSeriousThreatReviewRecord[]>;
  findByReportId(
    reportId: string,
  ): Promise<PrivateSeriousThreatReviewRecord | null>;
  replacePendingWithDecision(
    record: PrivateSeriousThreatReviewRecord,
  ): Promise<boolean>;
}

export type DurableSeriousCredibleThreatReviewerAdapter =
  SeriousCredibleThreatReviewQueue & SeriousCredibleThreatPrivateModerator;

function isNonEmptyText(value: unknown, maximumLength: number): value is string {
  return typeof value === "string"
    && value.trim().length > 0
    && value.trim().length <= maximumLength;
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

/** A reporter-created record must remain unreviewed and unpublishable. */
function isPrivatePendingCandidate(item: PrivateSeriousThreatReviewItem): boolean {
  const submission = item.candidateSubmission;
  const moderation = submission.moderation;
  const assessment = assessSeriousCredibleThreat(submission, item.receivedAt);
  return isNonEmptyText(item.reportId, 160)
    && isNonEmptyText(item.reporterUserId, 160)
    && isValidDate(item.receivedAt)
    && item.reviewState === "pending_private_review"
    && item.irreversibleDeletion === false
    && submission.kind === SERIOUS_CREDIBLE_THREAT_KIND
    && submission.consent.privateReview === true
    && submission.consent.anonymousCityLevelNotice === true
    && isCoarseThreatArea(submission.area)
    && Array.isArray(submission.evidence)
    && submission.evidence.length === 0
    && submission.requestedExpiresAt === null
    && moderation.decision === "unreviewed"
    && moderation.moderatorId === null
    && moderation.reviewedAt === null
    && moderation.publicSummary === null
    && assessment.eligibleToQueue === false
    && assessment.notificationState === "not_eligible"
    && assessment.safeNotice === null;
}

function decisionFor(
  pending: PrivateSeriousThreatReviewRecord,
  input: PrivateSeriousThreatReviewDecisionInput,
): PrivateSeriousThreatReviewRecord | null {
  if (
    pending.reviewState !== "pending_private_review"
    || !isNonEmptyText(input.reportId, 160)
    || input.reportId !== pending.reportId
    || (input.decision !== "approved" && input.decision !== "rejected")
    || !isNonEmptyText(input.moderatorId, 160)
    || !isValidDate(input.reviewedAt)
  ) {
    return null;
  }

  const privateDecision = {
    decision: input.decision,
    moderatorId: input.moderatorId.trim(),
    reviewedAt: input.reviewedAt,
    publicationState: "not_published" as const,
    notificationState: "not_eligible" as const,
  };

  if (input.decision === "rejected") {
    return {
      ...pending,
      reviewState: "rejected_private_review",
      privateDecision,
    };
  }

  if (
    !Array.isArray(input.evidence)
    || !isNonEmptyText(input.publicSummary, 280)
    || !isValidDate(input.requestedExpiresAt)
  ) {
    return null;
  }

  const reviewedSubmission: SeriousCredibleThreatSubmission = {
    ...pending.candidateSubmission,
    evidence: input.evidence,
    moderation: {
      decision: "approved",
      moderatorId: input.moderatorId.trim(),
      reviewedAt: input.reviewedAt,
      publicSummary: input.publicSummary.trim(),
    },
    requestedExpiresAt: input.requestedExpiresAt,
  };
  const assessment = assessSeriousCredibleThreat(reviewedSubmission, input.reviewedAt);
  // This proves that approval is policy-complete, but intentionally does not
  // call a notice store, notification queue, or provider.
  if (!assessment.eligibleToQueue || assessment.safeNotice === null) return null;

  return {
    ...pending,
    reviewState: "approved_private_review",
    candidateSubmission: reviewedSubmission,
    privateDecision,
  };
}

/**
 * Creates a source-only adapter around an explicitly supplied durable store.
 * It neither creates storage nor is instantiated by the production router, so
 * adding this source cannot activate retention. It stores only private-review
 * records and has no publication or delivery capability.
 */
export function createDurableSeriousCredibleThreatReviewerAdapter(
  store: DurablePrivateSeriousThreatReviewStore,
): DurableSeriousCredibleThreatReviewerAdapter {
  return {
    async enqueueForPrivateReview(item): Promise<PrivateReviewQueueAdmission> {
      if (!isPrivatePendingCandidate(item)) {
        return { accepted: false, reason: "rejected" };
      }
      const stored = await store.appendPending(item);
      return stored === "stored"
        ? { accepted: true }
        : { accepted: false, reason: "rejected" };
    },

    async listPendingPrivateReviews(
      limit: number,
    ): Promise<PrivateSeriousThreatReviewListResult> {
      const boundedLimit = Number.isInteger(limit)
        ? Math.max(1, Math.min(limit, 50))
        : 25;
      return { available: true, items: await store.listPending(boundedLimit) };
    },

    async decidePrivateReview(
      input: PrivateSeriousThreatReviewDecisionInput,
    ): Promise<PrivateSeriousThreatReviewDecisionResult> {
      if (!isNonEmptyText(input.reportId, 160)) {
        return { accepted: false, reason: "invalid_decision" };
      }
      const pending = await store.findByReportId(input.reportId.trim());
      if (!pending) return { accepted: false, reason: "not_found" };
      if (pending.reviewState !== "pending_private_review") {
        return { accepted: false, reason: "already_reviewed" };
      }
      const decided = decisionFor(pending, {
        ...input,
        reportId: input.reportId.trim(),
      });
      if (!decided) return { accepted: false, reason: "invalid_decision" };
      const replaced = await store.replacePendingWithDecision(decided);
      return replaced
        ? { accepted: true, record: decided }
        : { accepted: false, reason: "already_reviewed" };
    },
  };
}

/**
 * Default privileged interface for every environment. Like the member-facing
 * queue default, it reveals and retains nothing until an approved durable store
 * is explicitly wired into a private moderator router.
 */
export const unavailableSeriousCredibleThreatPrivateModerator: SeriousCredibleThreatPrivateModerator =
  {
    async listPendingPrivateReviews(): Promise<PrivateSeriousThreatReviewListResult> {
      return { available: false };
    },
    async decidePrivateReview(): Promise<PrivateSeriousThreatReviewDecisionResult> {
      return { accepted: false, reason: "unavailable" };
    },
  };
