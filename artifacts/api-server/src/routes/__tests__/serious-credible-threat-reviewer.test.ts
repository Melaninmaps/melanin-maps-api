import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { readFileSync } from "node:fs";
import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  assessSeriousCredibleThreat,
  type SeriousCredibleThreatSubmission,
} from "../../safety/seriousCredibleThreat";
import {
  createDurableSeriousCredibleThreatReviewerAdapter,
  type DurablePrivateSeriousThreatReviewStore,
  type PrivateSeriousThreatReviewItem,
  type PrivateSeriousThreatReviewRecord,
  type SeriousCredibleThreatPrivateModerator,
} from "../../safety/seriousCredibleThreatReviewQueue";
import {
  createSeriousCredibleThreatPrivateModeratorRouter,
  type SeriousCredibleThreatPrivateModeratorRouterDependencies,
} from "../serious-credible-threat-reviewer";

const NOW = new Date("2026-10-10T15:00:00.000Z");

type Actor = "anonymous" | "member" | "admin";

class FixtureDurableStore implements DurablePrivateSeriousThreatReviewStore {
  readonly records = new Map<string, PrivateSeriousThreatReviewRecord>();

  async appendPending(item: PrivateSeriousThreatReviewItem): Promise<"stored" | "duplicate"> {
    if (this.records.has(item.reportId)) return "duplicate";
    this.records.set(item.reportId, { ...item, privateDecision: null });
    return "stored";
  }

  async listPending(limit: number): Promise<readonly PrivateSeriousThreatReviewRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.reviewState === "pending_private_review")
      .slice(0, limit);
  }

  async findByReportId(reportId: string): Promise<PrivateSeriousThreatReviewRecord | null> {
    return this.records.get(reportId) ?? null;
  }

  async replacePendingWithDecision(record: PrivateSeriousThreatReviewRecord): Promise<boolean> {
    const current = this.records.get(record.reportId);
    if (!current || current.reviewState !== "pending_private_review") return false;
    this.records.set(record.reportId, record);
    return true;
  }
}

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

function createApp(
  actor: Actor,
  dependencies: SeriousCredibleThreatPrivateModeratorRouterDependencies = {},
) {
  const app = express();
  app.use(express.json());
  if (actor !== "anonymous") {
    app.use((request: Request, _response: Response, next: NextFunction) => {
      request.user = actor === "admin"
        ? ({ id: "named-admin-7", role: "admin" } as Request["user"])
        : ({ id: "member-42", role: "member" } as unknown as Request["user"]);
      next();
    });
  }
  app.use(createSeriousCredibleThreatPrivateModeratorRouter({
    now: () => NOW,
    ...dependencies,
  }));
  return app;
}

function approvalBody() {
  return {
    decision: "approved",
    evidence: [
      {
        referenceId: "official-1",
        kind: "official_public_safety_source",
        independentlyVerified: true,
        verifiedAt: "2026-10-10T14:30:00.000Z",
      },
      {
        referenceId: "organization-2",
        kind: "trusted_organization",
        independentlyVerified: true,
        verifiedAt: "2026-10-10T14:35:00.000Z",
      },
    ],
    publicSummary: "Follow official public-safety guidance for this city-level threat.",
    requestedExpiresAt: "2026-10-10T17:00:00.000Z",
  };
}

describe("private serious credible-threat moderator interface", () => {
  it("requires a signed-in named admin before it reads a private review queue", async () => {
    const listPendingPrivateReviews = vi.fn();
    const moderator: SeriousCredibleThreatPrivateModerator = {
      listPendingPrivateReviews,
      decidePrivateReview: vi.fn(),
    };

    const anonymous = await supertest(createApp("anonymous", { moderator }))
      .get("/moderation/serious-credible-threats/reviews");
    const member = await supertest(createApp("member", { moderator }))
      .get("/moderation/serious-credible-threats/reviews");

    expect(anonymous).toMatchObject({ status: 401, body: { error: "Authentication required" } });
    expect(member).toMatchObject({ status: 403, body: { error: "Private moderator access required" } });
    expect(listPendingPrivateReviews).not.toHaveBeenCalled();
  });

  it("fails closed by default rather than enabling private-report retention", async () => {
    const response = await supertest(createApp("admin"))
      .get("/moderation/serious-credible-threats/reviews");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
  });

  it("returns a minimal private projection to a named admin and never exposes reporter identity", async () => {
    const store = new FixtureDurableStore();
    const adapter = createDurableSeriousCredibleThreatReviewerAdapter(store);
    await adapter.enqueueForPrivateReview(pendingItem());

    const response = await supertest(createApp("admin", { moderator: adapter }))
      .get("/moderation/serious-credible-threats/reviews");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [{
        reportId: "private-report-1",
        receivedAt: NOW.toJSON(),
        reviewState: "pending_private_review",
        category: "imminent_violence",
        consent: { privateReview: true, anonymousCityLevelNotice: true },
        area: { city: "Philadelphia", region: "PA" },
        evidence: [],
      }],
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /reporterUserId|member-42|initialAssessment|safeNotice|notification|delivery/i,
    );
  });

  it("derives the named moderator identity, enforces policy-complete approval, and does not self-publish", async () => {
    const store = new FixtureDurableStore();
    const adapter = createDurableSeriousCredibleThreatReviewerAdapter(store);
    await adapter.enqueueForPrivateReview(pendingItem());
    const app = createApp("admin", { moderator: adapter });

    const forgedFields = await supertest(app)
      .patch("/moderation/serious-credible-threats/reviews/private-report-1")
      .send({ ...approvalBody(), moderatorId: "forged", noticeState: "active" });
    const insufficientEvidence = await supertest(app)
      .patch("/moderation/serious-credible-threats/reviews/private-report-1")
      .send({ ...approvalBody(), evidence: [approvalBody().evidence[0]] });
    const approved = await supertest(app)
      .patch("/moderation/serious-credible-threats/reviews/private-report-1")
      .send(approvalBody());

    expect(forgedFields).toMatchObject({ status: 400, body: { error: "REVIEW_DECISION_INVALID" } });
    expect(insufficientEvidence).toMatchObject({ status: 400, body: { error: "REVIEW_DECISION_INVALID" } });
    expect(approved.status).toBe(200);
    expect(approved.body).toEqual({
      reportId: "private-report-1",
      reviewState: "approved_private_review",
      privateDecision: {
        decision: "approved",
        reviewedAt: NOW.toJSON(),
        publicationState: "not_published",
      },
    });
    expect(JSON.stringify(approved.body)).not.toMatch(
      /safeNotice|notification|delivery|evidence|city|region|reporter/i,
    );
    expect(store.records.get("private-report-1")).toMatchObject({
      privateDecision: {
        moderatorId: "named-admin-7",
        publicationState: "not_published",
        notificationState: "not_eligible",
      },
    });
  });

  it("is mounted behind the member wall and remains separate from ordinary moderation", () => {
    const routeIndex = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
    const memberWall = routeIndex.indexOf("router.use(requireAuth)");
    const privateModeratorMount = routeIndex.indexOf(
      "router.use(seriousCredibleThreatPrivateModeratorRouter)",
    );

    expect(memberWall).toBeGreaterThan(-1);
    expect(privateModeratorMount).toBeGreaterThan(memberWall);
    expect(routeIndex).toContain(
      'import seriousCredibleThreatPrivateModeratorRouter from "./serious-credible-threat-reviewer"',
    );
  });
});
