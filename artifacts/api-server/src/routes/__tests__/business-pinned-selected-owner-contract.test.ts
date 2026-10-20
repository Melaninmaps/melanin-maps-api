import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const selectResults: unknown[][] = [];
  const insertResults: unknown[][] = [];
  const selectWhereCalls: unknown[] = [];
  const selectFromCalls: unknown[] = [];
  const updateWhereCalls: unknown[] = [];
  const insertValues: unknown[] = [];

  function nextSelectResult() {
    return selectResults.shift() ?? [];
  }

  const db = {
    select: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.from = (table: unknown) => {
        selectFromCalls.push(table);
        return builder;
      };
      builder.where = (predicate: unknown) => {
        selectWhereCalls.push(predicate);
        return builder;
      };
      builder.orderBy = () => builder;
      builder.limit = () => Promise.resolve(nextSelectResult());
      builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(nextSelectResult()).then(resolve, reject);
      return builder;
    }),
    update: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.set = () => builder;
      builder.where = (predicate: unknown) => {
        updateWhereCalls.push(predicate);
        return Promise.resolve();
      };
      return builder;
    }),
    insert: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.values = (values: unknown) => {
        insertValues.push(values);
        return builder;
      };
      builder.returning = () => Promise.resolve(insertResults.shift() ?? []);
      return builder;
    }),
  };

  return {
    db,
    selectResults,
    insertResults,
    selectWhereCalls,
    selectFromCalls,
    updateWhereCalls,
    insertValues,
    pinnedBusinessItemsTable: { id: "pin.id", businessId: "pin.businessId", itemType: "pin.itemType", status: "pin.status", pinnedAt: "pin.pinnedAt" },
    businessesTable: { id: "business.id", submittedById: "business.submittedById" },
    usersTable: { id: "user.id" },
    businessOwnerLinksTable: { userId: "ownerLink.userId", businessId: "ownerLink.businessId", role: "ownerLink.role", status: "ownerLink.status", revokedAt: "ownerLink.revokedAt" },
    reviewsTable: { id: "review.id", businessId: "review.businessId", authorName: "review.authorName", rating: "review.rating", text: "review.text", createdAt: "review.createdAt" },
  };
});

vi.mock("@workspace/db", () => ({
  db: mocks.db,
  pinnedBusinessItemsTable: mocks.pinnedBusinessItemsTable,
  businessesTable: mocks.businessesTable,
  usersTable: mocks.usersTable,
  businessOwnerLinksTable: mocks.businessOwnerLinksTable,
  reviewsTable: mocks.reviewsTable,
}));

vi.mock("drizzle-orm", () => ({
  and: (...terms: unknown[]) => ({ kind: "and", terms }),
  eq: (column: unknown, value: unknown) => ({ kind: "eq", column, value }),
  desc: (column: unknown) => ({ kind: "desc", column }),
  isNull: (column: unknown) => ({ kind: "isNull", column }),
}));

import pinnedRouter from "../pinned";

function appFor(userId?: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) (req as any).user = { id: userId };
    (req as any).log = { error: vi.fn() };
    next();
  });
  app.use(pinnedRouter);
  return app;
}

function queueSelects(...results: unknown[][]) {
  mocks.selectResults.push(...results);
}

function ownerLink(businessId = "business-a") {
  return [{ businessId }];
}

function flattenedTerms(predicate: unknown): Array<{ kind: string; column?: unknown; value?: unknown }> {
  if (!predicate || typeof predicate !== "object") return [];
  const value = predicate as { kind?: string; terms?: unknown[] };
  return value.kind === "and" && Array.isArray(value.terms)
    ? value.terms as Array<{ kind: string; column?: unknown; value?: unknown }>
    : [];
}

beforeEach(() => {
  mocks.selectResults.length = 0;
  mocks.insertResults.length = 0;
  mocks.selectWhereCalls.length = 0;
  mocks.selectFromCalls.length = 0;
  mocks.updateWhereCalls.length = 0;
  mocks.insertValues.length = 0;
  mocks.db.select.mockClear();
  mocks.db.update.mockClear();
  mocks.db.insert.mockClear();
});

describe("selected-owner Pinned Highlights route isolation", () => {
  it("preserves the legacy /business/pinned owner route bodies byte-for-byte", () => {
    const source = readFileSync(new URL("../pinned.ts", import.meta.url), "utf8");
    const start = source.indexOf("/* GET /business/pinned");
    const end = source.indexOf("/* Selected owner routes", start);
    const legacyOwnerRoutes = source.slice(start, end).trimEnd();

    expect(createHash("sha256").update(legacyOwnerRoutes).digest("hex"))
      .toBe("dd4198b72546a537a379ebaef9e0b6cc05b68952c75c9875d0c2dd26ad143e88");
  });

  it("rejects an anonymous selected-business read before any data access", async () => {
    const response = await request(appFor())
      .get("/businesses/mine/managed/business-a/pinned");

    expect(response.status).toBe(401);
    expect(mocks.db.select).not.toHaveBeenCalled();
    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it("reads pins only after an exact active approved owner link for the selected ID", async () => {
    queueSelects(ownerLink("business-a"), []);

    const response = await request(appFor("owner-a"))
      .get("/businesses/mine/managed/business-a/pinned");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ pinned: [], businessId: "business-a" });
    expect(mocks.selectFromCalls[0]).toBe(mocks.businessOwnerLinksTable);
    expect(flattenedTerms(mocks.selectWhereCalls[0])).toEqual([
      { kind: "eq", column: "ownerLink.userId", value: "owner-a" },
      { kind: "eq", column: "ownerLink.businessId", value: "business-a" },
      { kind: "eq", column: "ownerLink.role", value: "owner" },
      { kind: "eq", column: "ownerLink.status", value: "approved" },
      { kind: "isNull", column: "ownerLink.revokedAt" },
    ]);
    expect(mocks.selectFromCalls[1]).toBe(mocks.pinnedBusinessItemsTable);
  });

  it.each([
    ["cross-owner", "other-business"],
    ["revoked or former owner", "business-a"],
  ])("fails neutral for a %s selected-business request without reading pins", async (_caseName, businessId) => {
    queueSelects([]);

    const response = await request(appFor("owner-a"))
      .get(`/businesses/mine/managed/${businessId}/pinned`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Selected business unavailable" });
    expect(mocks.db.select).toHaveBeenCalledTimes(1);
    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it("does not mutate a selected business when the requested pin belongs to another business", async () => {
    queueSelects(ownerLink("business-a"), []);

    const response = await request(appFor("owner-a"))
      .delete("/businesses/mine/managed/business-a/pinned/42");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Pin unavailable for selected business" });
    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it("requires an authoritative review on the selected business before pinning it", async () => {
    queueSelects(ownerLink("business-a"), []);

    const response = await request(appFor("owner-a"))
      .post("/businesses/mine/managed/business-a/pinned")
      .send({ itemType: "review", reviewId: "review-from-business-b", reviewText: "Spoofed review" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Review unavailable for selected business" });
    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it("pins only the selected business review and ignores client-spoofed review material", async () => {
    queueSelects(
      ownerLink("business-a"),
      [{
        id: "review-a",
        businessId: "business-a",
        authorName: "Avery Example",
        rating: 5,
        text: "The authoritative review text",
        createdAt: new Date("2026-10-20T00:00:00.000Z"),
      }],
      [],
    );
    mocks.insertResults.push([{ id: 9, businessId: "business-a", itemType: "review" }]);

    const response = await request(appFor("owner-a"))
      .post("/businesses/mine/managed/business-a/pinned")
      .send({
        itemType: "review",
        reviewId: "review-a",
        reviewText: "Spoofed review text",
        reviewAuthor: "Wrong Author",
        reviewRating: 1,
      });

    expect(response.status).toBe(200);
    expect(response.body.businessId).toBe("business-a");
    expect(mocks.insertValues).toHaveLength(1);
    expect(mocks.insertValues[0]).toMatchObject({
      businessId: "business-a",
      itemType: "review",
      reviewId: "review-a",
      reviewText: "The authoritative review text",
      reviewAuthor: "Avery Example",
      reviewRating: 5,
    });
  });

  it("rejects malformed selected IDs before owner-link or item mutation queries", async () => {
    const response = await request(appFor("owner-a"))
      .post("/businesses/mine/managed/%20/pinned")
      .send({ itemType: "video", videoUrl: "https://example.test/video" });

    expect(response.status).toBe(400);
    expect(mocks.db.select).not.toHaveBeenCalled();
    expect(mocks.db.update).not.toHaveBeenCalled();
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });
});
