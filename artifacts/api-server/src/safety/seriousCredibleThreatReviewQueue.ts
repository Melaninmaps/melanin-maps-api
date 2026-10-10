import type {
  SeriousCredibleThreatSubmission,
  SeriousThreatAssessment,
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
