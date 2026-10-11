import { pool } from "@workspace/db";
import {
  assessSeriousCredibleThreat,
  type SeriousCredibleThreatSubmission,
  type ThreatEvidenceReference,
} from "./seriousCredibleThreat";
import {
  createDurableSeriousCredibleThreatReviewerAdapter,
  type DurablePrivateSeriousThreatReviewStore,
  type DurableSeriousCredibleThreatReviewerAdapter,
  type PrivateSeriousThreatReviewDecision,
  type PrivateSeriousThreatReviewItem,
  type PrivateSeriousThreatReviewRecord,
} from "./seriousCredibleThreatReviewQueue";

interface QueryResult<Row> {
  readonly rows: readonly Row[];
  readonly rowCount?: number | null;
}

export interface PrivateReviewQueryable {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<Row>>;
}

export interface SeriousThreatReviewEnvironment {
  readonly KINFOLK_MEMORY_STAGING_ISOLATION?: string;
  readonly KINFOLK_SERIOUS_THREAT_PRIVATE_REVIEW_STAGING_ENABLED?: string;
}

/**
 * Retention is intentionally opt-in twice and confined to the pre-existing
 * isolated validation environment. This is not a production switch: production
 * cannot activate the adapter without also possessing the isolated-environment
 * guard, and the adapter contains no publishing or notification operation.
 */
export function isIsolatedSeriousThreatPrivateReviewEnabled(
  environment: SeriousThreatReviewEnvironment = process.env,
): boolean {
  return environment.KINFOLK_MEMORY_STAGING_ISOLATION === "true"
    && environment.KINFOLK_SERIOUS_THREAT_PRIVATE_REVIEW_STAGING_ENABLED === "true";
}

type StoredReviewRow = {
  report_id: string;
  reporter_user_id: string;
  received_at: Date | string;
  review_state: string;
  candidate_submission: unknown;
  private_decision: unknown;
};

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEvidence(value: unknown): readonly ThreatEvidenceReference[] | null {
  if (!Array.isArray(value) || value.length > 20) return null;
  const evidence: ThreatEvidenceReference[] = [];
  for (const entry of value) {
    if (!isRecord(entry)
      || typeof entry.referenceId !== "string"
      || typeof entry.kind !== "string"
      || typeof entry.independentlyVerified !== "boolean") {
      return null;
    }
    const verifiedAt = entry.verifiedAt === null ? null : parseDate(entry.verifiedAt);
    if (entry.verifiedAt !== null && !verifiedAt) return null;
    evidence.push({
      referenceId: entry.referenceId,
      kind: entry.kind as ThreatEvidenceReference["kind"],
      independentlyVerified: entry.independentlyVerified,
      verifiedAt,
    });
  }
  return evidence;
}

function parseSubmission(value: unknown): SeriousCredibleThreatSubmission | null {
  if (!isRecord(value)
    || typeof value.kind !== "string"
    || typeof value.category !== "string"
    || !isRecord(value.consent)
    || !isRecord(value.area)
    || !isRecord(value.moderation)
    || typeof value.consent.privateReview !== "boolean"
    || typeof value.consent.anonymousCityLevelNotice !== "boolean"
    || typeof value.area.city !== "string"
    || typeof value.area.region !== "string"
    || typeof value.moderation.decision !== "string") {
    return null;
  }
  const evidence = parseEvidence(value.evidence);
  const reviewedAt = value.moderation.reviewedAt === null
    ? null
    : parseDate(value.moderation.reviewedAt);
  const requestedExpiresAt = value.requestedExpiresAt === null
    ? null
    : parseDate(value.requestedExpiresAt);
  if (!evidence
    || (value.moderation.reviewedAt !== null && !reviewedAt)
    || (value.requestedExpiresAt !== null && !requestedExpiresAt)
    || !(typeof value.moderation.moderatorId === "string" || value.moderation.moderatorId === null)
    || !(typeof value.moderation.publicSummary === "string" || value.moderation.publicSummary === null)) {
    return null;
  }
  return {
    kind: value.kind,
    category: value.category,
    consent: {
      privateReview: value.consent.privateReview,
      anonymousCityLevelNotice: value.consent.anonymousCityLevelNotice,
    },
    area: { city: value.area.city, region: value.area.region },
    evidence,
    moderation: {
      decision: value.moderation.decision as SeriousCredibleThreatSubmission["moderation"]["decision"],
      moderatorId: value.moderation.moderatorId,
      reviewedAt,
      publicSummary: value.moderation.publicSummary,
    },
    requestedExpiresAt,
  };
}

function parsePrivateDecision(value: unknown): PrivateSeriousThreatReviewDecision | null {
  if (value === null) return null;
  if (!isRecord(value)
    || (value.decision !== "approved" && value.decision !== "rejected")
    || typeof value.moderatorId !== "string"
    || value.publicationState !== "not_published"
    || value.notificationState !== "not_eligible") {
    return null;
  }
  const reviewedAt = parseDate(value.reviewedAt);
  if (!reviewedAt) return null;
  return {
    decision: value.decision,
    moderatorId: value.moderatorId,
    reviewedAt,
    publicationState: "not_published",
    notificationState: "not_eligible",
  };
}

function storedRecord(row: StoredReviewRow): PrivateSeriousThreatReviewRecord {
  const receivedAt = parseDate(row.received_at);
  const candidateSubmission = parseSubmission(row.candidate_submission);
  const privateDecision = parsePrivateDecision(row.private_decision);
  if (!receivedAt || !candidateSubmission
    || !["pending_private_review", "approved_private_review", "rejected_private_review"].includes(row.review_state)
    || (row.private_decision !== null && !privateDecision)) {
    throw new Error("Private serious-threat review row is malformed");
  }
  return {
    reportId: row.report_id,
    reporterUserId: row.reporter_user_id,
    receivedAt,
    reviewState: row.review_state as PrivateSeriousThreatReviewRecord["reviewState"],
    candidateSubmission,
    initialAssessment: assessSeriousCredibleThreat(candidateSubmission, receivedAt),
    privateDecision,
    irreversibleDeletion: false,
  };
}

function storageSubmission(submission: SeriousCredibleThreatSubmission): Record<string, unknown> {
  return {
    ...submission,
    evidence: submission.evidence.map((reference) => ({
      ...reference,
      verifiedAt: reference.verifiedAt?.toISOString() ?? null,
    })),
    moderation: {
      ...submission.moderation,
      reviewedAt: submission.moderation.reviewedAt?.toISOString() ?? null,
    },
    requestedExpiresAt: submission.requestedExpiresAt?.toISOString() ?? null,
  };
}

function storageDecision(
  decision: PrivateSeriousThreatReviewDecision | null,
): Record<string, unknown> | null {
  return decision
    ? { ...decision, reviewedAt: decision.reviewedAt.toISOString() }
    : null;
}

const SELECT_REVIEW = `
  SELECT report_id, reporter_user_id, received_at, review_state,
         candidate_submission, private_decision
    FROM safety_serious_credible_threat_private_reviews
`;

/**
 * PostgreSQL store for the explicitly opted-in isolated workflow. It retains no
 * reporter narrative, exact location, delivery receipt, or public notice. The
 * sole compare-and-set update prevents competing private reviewers from writing
 * a second decision over the first one.
 */
export function createPostgresSeriousCredibleThreatReviewStore(
  database: PrivateReviewQueryable = pool,
): DurablePrivateSeriousThreatReviewStore {
  return {
    async appendPending(item) {
      const result = await database.query(
        `INSERT INTO safety_serious_credible_threat_private_reviews (
           report_id, reporter_user_id, received_at, review_state,
           candidate_submission, private_decision
         ) VALUES ($1, $2, $3, $4, $5::jsonb, NULL)
         ON CONFLICT (report_id) DO NOTHING`,
        [
          item.reportId,
          item.reporterUserId,
          item.receivedAt,
          item.reviewState,
          JSON.stringify(storageSubmission(item.candidateSubmission)),
        ],
      );
      return result.rowCount === 1 ? "stored" : "duplicate";
    },

    async listPending(limit) {
      const result = await database.query<StoredReviewRow>(
        `${SELECT_REVIEW}
          WHERE review_state = 'pending_private_review'
          ORDER BY received_at ASC, report_id ASC
          LIMIT $1`,
        [limit],
      );
      return result.rows.map(storedRecord);
    },

    async findByReportId(reportId) {
      const result = await database.query<StoredReviewRow>(
        `${SELECT_REVIEW} WHERE report_id = $1 LIMIT 1`,
        [reportId],
      );
      return result.rows[0] ? storedRecord(result.rows[0]) : null;
    },

    async replacePendingWithDecision(record) {
      const result = await database.query(
        `UPDATE safety_serious_credible_threat_private_reviews
            SET review_state = $2,
                candidate_submission = $3::jsonb,
                private_decision = $4::jsonb,
                updated_at = NOW()
          WHERE report_id = $1
            AND review_state = 'pending_private_review'`,
        [
          record.reportId,
          record.reviewState,
          JSON.stringify(storageSubmission(record.candidateSubmission)),
          JSON.stringify(storageDecision(record.privateDecision)),
        ],
      );
      return result.rowCount === 1;
    },
  };
}

let configuredAdapter: DurableSeriousCredibleThreatReviewerAdapter | null | undefined;

/** Returns an adapter only in the explicitly enabled isolated environment. */
export function configuredIsolatedSeriousThreatReviewerAdapter(): DurableSeriousCredibleThreatReviewerAdapter | null {
  if (configuredAdapter !== undefined) return configuredAdapter;
  configuredAdapter = isIsolatedSeriousThreatPrivateReviewEnabled()
    ? createDurableSeriousCredibleThreatReviewerAdapter(
      createPostgresSeriousCredibleThreatReviewStore(),
    )
    : null;
  return configuredAdapter;
}

/** Test-only reset for environment-contract assertions; never used at runtime. */
export function resetConfiguredIsolatedSeriousThreatReviewerAdapterForTest(): void {
  configuredAdapter = undefined;
}
