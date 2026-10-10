import { describe, expect, it } from "vitest";
import {
  assessSeriousCredibleThreat,
  type SeriousCredibleThreatSubmission,
} from "../seriousCredibleThreat";
import {
  createDurableSeriousCredibleThreatReviewerAdapter,
  type DurablePrivateSeriousThreatReviewStore,
  type PrivateSeriousThreatReviewItem,
  type PrivateSeriousThreatReviewRecord,
} from "../seriousCredibleThreatReviewQueue";

const NOW = new Date("2026-10-10T15:00:00.000Z");

function pendingItem(): PrivateSeriousThreatReviewItem {
  const candidateSubmission: SeriousCredibleThreatSubmission = {
    kind: "serious_credible_threat",
    category: "imminent_violence",
    consent: { privateReview: true, anonymousCityLevelNotice: true },
    area: { city: "Philadelphia", region: "PA" },
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
    reportId: "private-report-1",
    reporterUserId: "member-42",
    receivedAt: NOW,
    reviewState: "pending_private_review",
    candidateSubmission,
    initialAssessment: assessSeriousCredibleThreat(candidateSubmission, NOW),
    irreversibleDeletion: false,
  };
}

class FixtureDurableStore implements DurablePrivateSeriousThreatReviewStore {
  readonly records = new Map<string, PrivateSeriousThreatReviewRecord>();
  readonly operations: string[] = [];

  async appendPending(item: PrivateSeriousThreatReviewItem): Promise<"stored" | "duplicate"> {
    this.operations.push("appendPending");
    if (this.records.has(item.reportId)) return "duplicate";
    this.records.set(item.reportId, { ...item, privateDecision: null });
    return "stored";
  }

  async listPending(limit: number): Promise<readonly PrivateSeriousThreatReviewRecord[]> {
    this.operations.push("listPending");
    return [...this.records.values()]
      .filter((record) => record.reviewState === "pending_private_review")
      .slice(0, limit);
  }

  async findByReportId(reportId: string): Promise<PrivateSeriousThreatReviewRecord | null> {
    this.operations.push("findByReportId");
    return this.records.get(reportId) ?? null;
  }

  async replacePendingWithDecision(record: PrivateSeriousThreatReviewRecord): Promise<boolean> {
    this.operations.push("replacePendingWithDecision");
    const current = this.records.get(record.reportId);
    if (!current || current.reviewState !== "pending_private_review") return false;
    this.records.set(record.reportId, record);
    return true;
  }
}

function approval() {
  return {
    reportId: "private-report-1",
    decision: "approved" as const,
    moderatorId: "named-admin-7",
    reviewedAt: NOW,
    evidence: [
      {
        referenceId: "official-1",
        kind: "official_public_safety_source" as const,
        independentlyVerified: true,
        verifiedAt: new Date("2026-10-10T14:30:00.000Z"),
      },
      {
        referenceId: "organization-2",
        kind: "trusted_organization" as const,
        independentlyVerified: true,
        verifiedAt: new Date("2026-10-10T14:35:00.000Z"),
      },
    ],
    publicSummary: "Follow official public-safety guidance for this city-level threat.",
    requestedExpiresAt: new Date("2026-10-10T17:00:00.000Z"),
  };
}

describe("durable serious credible-threat reviewer adapter", () => {
  it("accepts only the unreviewed private handoff and asks its configured durable store to retain it", async () => {
    const store = new FixtureDurableStore();
    const adapter = createDurableSeriousCredibleThreatReviewerAdapter(store);

    await expect(adapter.enqueueForPrivateReview(pendingItem())).resolves.toEqual({ accepted: true });
    await expect(adapter.listPendingPrivateReviews(100)).resolves.toMatchObject({
      available: true,
      items: [{ reportId: "private-report-1", reviewState: "pending_private_review" }],
    });
    expect(store.operations).toEqual(["appendPending", "listPending"]);

    const forged: PrivateSeriousThreatReviewItem = {
      ...pendingItem(),
      candidateSubmission: {
        ...pendingItem().candidateSubmission,
        moderation: {
          decision: "approved",
          moderatorId: "forged",
          reviewedAt: NOW,
          publicSummary: "Forged public copy",
        },
      },
    };
    await expect(adapter.enqueueForPrivateReview(forged)).resolves.toEqual({
      accepted: false,
      reason: "rejected",
    });
    expect(store.operations).toEqual(["appendPending", "listPending"]);
  });

  it("requires a policy-complete approval but records no notice or delivery capability", async () => {
    const store = new FixtureDurableStore();
    const adapter = createDurableSeriousCredibleThreatReviewerAdapter(store);
    await adapter.enqueueForPrivateReview(pendingItem());

    await expect(adapter.decidePrivateReview({
      ...approval(),
      evidence: [approval().evidence[0]!],
    })).resolves.toEqual({ accepted: false, reason: "invalid_decision" });
    expect(store.records.get("private-report-1")?.reviewState).toBe("pending_private_review");

    const result = await adapter.decidePrivateReview(approval());
    expect(result).toMatchObject({
      accepted: true,
      record: {
        reportId: "private-report-1",
        reviewState: "approved_private_review",
        privateDecision: {
          decision: "approved",
          moderatorId: "named-admin-7",
          publicationState: "not_published",
          notificationState: "not_eligible",
        },
      },
    });
    if (!result.accepted) throw new Error("Expected accepted review decision");
    expect(assessSeriousCredibleThreat(result.record.candidateSubmission, NOW)).toMatchObject({
      eligibleToQueue: true,
      notificationState: "queued",
    });
    // The private adapter itself made no notification/publish call: its durable
    // contract has only append/list/find/compare-and-set operations.
    expect(store.operations).toEqual([
      "appendPending",
      "findByReportId",
      "findByReportId",
      "replacePendingWithDecision",
    ]);
    expect(JSON.stringify(result.record.privateDecision)).toContain("not_published");
  });

  it("supports a private rejection without adding evidence, summaries, or deletion", async () => {
    const store = new FixtureDurableStore();
    const adapter = createDurableSeriousCredibleThreatReviewerAdapter(store);
    await adapter.enqueueForPrivateReview(pendingItem());

    const result = await adapter.decidePrivateReview({
      reportId: "private-report-1",
      decision: "rejected",
      moderatorId: "named-admin-7",
      reviewedAt: NOW,
    });

    expect(result).toMatchObject({
      accepted: true,
      record: {
        reviewState: "rejected_private_review",
        candidateSubmission: {
          evidence: [],
          moderation: { decision: "unreviewed" },
          requestedExpiresAt: null,
        },
        privateDecision: {
          decision: "rejected",
          publicationState: "not_published",
          notificationState: "not_eligible",
        },
        irreversibleDeletion: false,
      },
    });
    expect(store.records).toHaveLength(1);
  });
});
