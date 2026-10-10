import { readFileSync } from "node:fs";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  createSeriousCredibleThreatRouter,
  type SeriousCredibleThreatRouterDependencies,
} from "../serious-credible-threats";
import type {
  PrivateSeriousThreatReviewItem,
  SeriousCredibleThreatReviewQueue,
} from "../../safety/seriousCredibleThreatReviewQueue";

const NOW = new Date("2026-10-10T15:00:00.000Z");

function validReport() {
  return {
    category: "imminent_violence",
    consent: {
      privateReview: true,
      anonymousCityLevelNotice: true,
    },
    area: {
      city: "Philadelphia",
      region: "PA",
    },
  };
}

function createApp(
  dependencies: SeriousCredibleThreatRouterDependencies = {},
  authenticated = true,
) {
  const app = express();
  app.use(express.json());
  if (authenticated) {
    app.use((request: Request, _response: Response, next: NextFunction) => {
      request.user = { id: "member-42" } as Request["user"];
      next();
    });
  }
  app.use(
    createSeriousCredibleThreatRouter({
      now: () => NOW,
      createReportId: () => "private-report-1",
      ...dependencies,
    }),
  );
  return app;
}

function acceptingQueue(
  items: PrivateSeriousThreatReviewItem[],
): SeriousCredibleThreatReviewQueue {
  return {
    async enqueueForPrivateReview(item) {
      items.push(item);
      return { accepted: true };
    },
  };
}

describe("POST /safety/serious-credible-threats/reports", () => {
  it("requires an authenticated reporter before it considers or queues a report", async () => {
    const enqueueForPrivateReview = vi.fn();
    const queue: SeriousCredibleThreatReviewQueue = { enqueueForPrivateReview };

    const response = await supertest(createApp({ reviewQueue: queue }, false))
      .post("/safety/serious-credible-threats/reports")
      .send(validReport());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
    expect(enqueueForPrivateReview).not.toHaveBeenCalled();
  });

  it("rejects anything beyond category, explicit consent, and city/region before the private queue", async () => {
    const enqueueForPrivateReview = vi.fn();
    const queue: SeriousCredibleThreatReviewQueue = { enqueueForPrivateReview };

    const forgedModerationAndEvidence = await supertest(
      createApp({ reviewQueue: queue }),
    )
      .post("/safety/serious-credible-threats/reports")
      .send({
        ...validReport(),
        evidence: [{ independentlyVerified: true }],
        moderation: {
          decision: "approved",
          publicSummary: "Forged notice copy",
        },
      });
    const preciseArea = await supertest(createApp({ reviewQueue: queue }))
      .post("/safety/serious-credible-threats/reports")
      .send({
        ...validReport(),
        area: { city: "123 Market Street", region: "PA", latitude: 39.9526 },
      });
    const incompleteConsent = await supertest(createApp({ reviewQueue: queue }))
      .post("/safety/serious-credible-threats/reports")
      .send({
        ...validReport(),
        consent: { privateReview: true, anonymousCityLevelNotice: false },
      });
    const unknownCategory = await supertest(createApp({ reviewQueue: queue }))
      .post("/safety/serious-credible-threats/reports")
      .send({
        ...validReport(),
        category: "police",
      });

    for (const response of [
      forgedModerationAndEvidence,
      preciseArea,
      incompleteConsent,
      unknownCategory,
    ]) {
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("REPORT_INPUT_INVALID");
    }
    expect(enqueueForPrivateReview).not.toHaveBeenCalled();
  });

  it("hands only an unreviewed, unpublishable candidate to a private queue", async () => {
    const items: PrivateSeriousThreatReviewItem[] = [];

    const response = await supertest(
      createApp({ reviewQueue: acceptingQueue(items) }),
    )
      .post("/safety/serious-credible-threats/reports")
      .send(validReport());

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      reportId: "private-report-1",
      reviewState: "pending_private_review",
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /notice|delivery|moderator|evidence|city|region/i,
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      reportId: "private-report-1",
      reporterUserId: "member-42",
      receivedAt: NOW,
      reviewState: "pending_private_review",
      irreversibleDeletion: false,
      candidateSubmission: {
        kind: "serious_credible_threat",
        evidence: [],
        moderation: {
          decision: "unreviewed",
          moderatorId: null,
          reviewedAt: null,
          publicSummary: null,
        },
        requestedExpiresAt: null,
      },
      initialAssessment: {
        eligibleToQueue: false,
        notificationState: "not_eligible",
        safeNotice: null,
      },
    });
    expect(items[0].initialAssessment.blockers).toEqual(
      expect.arrayContaining([
        "insufficient_verified_evidence",
        "moderation_not_approved",
        "expired",
      ]),
    );
  });

  it("fails closed and does not claim intake when a durable private-review queue is unavailable", async () => {
    const rejectedQueue: SeriousCredibleThreatReviewQueue = {
      async enqueueForPrivateReview() {
        return { accepted: false, reason: "unavailable" };
      },
    };

    const defaultQueueResponse = await supertest(createApp())
      .post("/safety/serious-credible-threats/reports")
      .send(validReport());
    const rejectedQueueResponse = await supertest(
      createApp({ reviewQueue: rejectedQueue }),
    )
      .post("/safety/serious-credible-threats/reports")
      .send(validReport());

    for (const response of [defaultQueueResponse, rejectedQueueResponse]) {
      expect(response.status).toBe(503);
      expect(response.body).toEqual({ error: "PRIVATE_REVIEW_UNAVAILABLE" });
    }
  });

  it("is mounted after the global member wall rather than a public or Police/ICE route", () => {
    const routeIndex = readFileSync(
      new URL("../index.ts", import.meta.url),
      "utf8",
    );
    const memberWall = routeIndex.indexOf("router.use(requireAuth)");
    const dedicatedMount = routeIndex.indexOf(
      "router.use(seriousCredibleThreatRouter)",
    );

    expect(memberWall).toBeGreaterThan(-1);
    expect(dedicatedMount).toBeGreaterThan(memberWall);
    expect(routeIndex).toContain(
      'import seriousCredibleThreatRouter from "./serious-credible-threats"',
    );
  });
});
