import { describe, expect, it } from "vitest";
import {
  createDurableSeriousCredibleThreatReviewerAdapter,
  type PrivateSeriousThreatReviewItem,
} from "../seriousCredibleThreatReviewQueue";
import {
  createPostgresSeriousCredibleThreatReviewStore,
  isIsolatedSeriousThreatPrivateReviewEnabled,
  type PrivateReviewQueryable,
} from "../postgresSeriousCredibleThreatReviewStore";
import { assessSeriousCredibleThreat, type SeriousCredibleThreatSubmission } from "../seriousCredibleThreat";

const NOW = new Date("2026-10-11T13:20:00.000Z");

type Stored = {
  report_id: string;
  reporter_user_id: string;
  received_at: Date;
  review_state: string;
  candidate_submission: unknown;
  private_decision: unknown;
};

class FixtureDatabase implements PrivateReviewQueryable {
  readonly rows = new Map<string, Stored>();
  readonly calls: Array<{ text: string; values: readonly unknown[] }> = [];

  async query<Row = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ rows: readonly Row[]; rowCount?: number }> {
    this.calls.push({ text, values });
    if (text.includes("INSERT INTO safety_serious_credible_threat_private_reviews")) {
      const [reportId, reporterUserId, receivedAt, reviewState, rawSubmission] = values;
      if (this.rows.has(String(reportId))) return { rows: [], rowCount: 0 };
      this.rows.set(String(reportId), {
        report_id: String(reportId),
        reporter_user_id: String(reporterUserId),
        received_at: receivedAt as Date,
        review_state: String(reviewState),
        candidate_submission: JSON.parse(String(rawSubmission)),
        private_decision: null,
      });
      return { rows: [], rowCount: 1 };
    }
    if (text.includes("WHERE review_state = 'pending_private_review'")) {
      return {
        rows: [...this.rows.values()]
          .filter((row) => row.review_state === "pending_private_review") as Row[],
      };
    }
    if (text.includes("WHERE report_id = $1 LIMIT 1")) {
      const row = this.rows.get(String(values[0]));
      return { rows: row ? [row as Row] : [] };
    }
    if (text.includes("UPDATE safety_serious_credible_threat_private_reviews")) {
      const [reportId, reviewState, rawSubmission, rawDecision] = values;
      const current = this.rows.get(String(reportId));
      if (!current || current.review_state !== "pending_private_review") {
        return { rows: [], rowCount: 0 };
      }
      this.rows.set(String(reportId), {
        ...current,
        review_state: String(reviewState),
        candidate_submission: JSON.parse(String(rawSubmission)),
        private_decision: JSON.parse(String(rawDecision)),
      });
      return { rows: [], rowCount: 1 };
    }
    throw new Error(`Unexpected query: ${text}`);
  }
}

function pendingItem(): PrivateSeriousThreatReviewItem {
  const candidateSubmission: SeriousCredibleThreatSubmission = {
    kind: "serious_credible_threat",
    category: "imminent_violence",
    consent: { privateReview: true, anonymousCityLevelNotice: true },
    area: { city: "Fixtureville", region: "PA" },
    evidence: [],
    moderation: {
      decision: "unreviewed",
      moderatorId: null,
      reviewedAt: null,
      publicSummary: null,
    },
    requestedExpiresAt: null,
  };
  return {
    reportId: "fixture-private-report-1",
    reporterUserId: "fixture-member-1",
    receivedAt: NOW,
    reviewState: "pending_private_review",
    candidateSubmission,
    initialAssessment: assessSeriousCredibleThreat(candidateSubmission, NOW),
    irreversibleDeletion: false,
  };
}

describe("Postgres serious credible-threat private review store", () => {
  it("requires both isolated staging gates", () => {
    expect(isIsolatedSeriousThreatPrivateReviewEnabled({})).toBe(false);
    expect(isIsolatedSeriousThreatPrivateReviewEnabled({
      KINFOLK_MEMORY_STAGING_ISOLATION: "true",
    })).toBe(false);
    expect(isIsolatedSeriousThreatPrivateReviewEnabled({
      KINFOLK_SERIOUS_THREAT_PRIVATE_REVIEW_STAGING_ENABLED: "true",
    })).toBe(false);
    expect(isIsolatedSeriousThreatPrivateReviewEnabled({
      KINFOLK_MEMORY_STAGING_ISOLATION: "true",
      KINFOLK_SERIOUS_THREAT_PRIVATE_REVIEW_STAGING_ENABLED: "true",
    })).toBe(true);
  });

  it("persists only the private candidate, performs a compare-and-set decision, and never creates notice or delivery state", async () => {
    const database = new FixtureDatabase();
    const adapter = createDurableSeriousCredibleThreatReviewerAdapter(
      createPostgresSeriousCredibleThreatReviewStore(database),
    );
    const item = pendingItem();

    await expect(adapter.enqueueForPrivateReview(item)).resolves.toEqual({ accepted: true });
    await expect(adapter.enqueueForPrivateReview(item)).resolves.toEqual({
      accepted: false,
      reason: "rejected",
    });
    await expect(adapter.listPendingPrivateReviews(25)).resolves.toMatchObject({
      available: true,
      items: [{ reportId: item.reportId, reporterUserId: item.reporterUserId }],
    });

    const insert = database.calls.find((call) => call.text.includes("INSERT INTO safety_serious_credible_threat_private_reviews"));
    expect(insert).toBeDefined();
    expect(JSON.stringify(insert?.values)).not.toMatch(/initialAssessment|safeNotice|notificationState|delivery/i);

    const decision = await adapter.decidePrivateReview({
      reportId: item.reportId,
      decision: "approved",
      moderatorId: "fixture-named-admin",
      reviewedAt: NOW,
      evidence: [
        {
          referenceId: "fixture-official-source",
          kind: "official_public_safety_source",
          independentlyVerified: true,
          verifiedAt: new Date("2026-10-11T13:00:00.000Z"),
        },
        {
          referenceId: "fixture-community-source",
          kind: "trusted_organization",
          independentlyVerified: true,
          verifiedAt: new Date("2026-10-11T13:05:00.000Z"),
        },
      ],
      publicSummary: "Follow official public-safety guidance for this city-level threat.",
      requestedExpiresAt: new Date("2026-10-11T15:00:00.000Z"),
    });
    expect(decision).toMatchObject({
      accepted: true,
      record: {
        reviewState: "approved_private_review",
        privateDecision: {
          publicationState: "not_published",
          notificationState: "not_eligible",
        },
      },
    });
    await expect(adapter.decidePrivateReview({
      reportId: item.reportId,
      decision: "rejected",
      moderatorId: "second-fixture-admin",
      reviewedAt: NOW,
    })).resolves.toEqual({ accepted: false, reason: "already_reviewed" });

    const stored = database.rows.get(item.reportId);
    expect(stored?.private_decision).toMatchObject({
      publicationState: "not_published",
      notificationState: "not_eligible",
    });
  });
});
