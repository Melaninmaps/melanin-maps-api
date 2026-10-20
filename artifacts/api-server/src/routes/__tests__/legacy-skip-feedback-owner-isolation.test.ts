import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  getUserTier: vi.fn(),
  and: vi.fn((...conditions: unknown[]) => ({ kind: "and", conditions })),
  eq: vi.fn((column: unknown, value: unknown) => ({ kind: "eq", column, value })),
  isNull: vi.fn((column: unknown) => ({ kind: "isNull", column })),
  desc: vi.fn((column: unknown) => ({ kind: "desc", column })),
}));

vi.mock("@workspace/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/db")>();
  return {
    ...actual,
    db: { select: mocks.select },
    getPoolStats: vi.fn(),
    pool: {},
  };
});

vi.mock("../../middleware/requireMembership", () => ({
  getUserTier: mocks.getUserTier,
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    and: mocks.and,
    eq: mocks.eq,
    isNull: mocks.isNull,
    desc: mocks.desc,
  };
});

import {
  businessOwnerLinksTable,
  businessesTable,
  businessSkipFeedbackTable,
} from "@workspace/db";
import kinfolkRouter from "../kinfolk";

type RouteRequest = {
  user?: { id: string };
  log?: { error: ReturnType<typeof vi.fn> };
};
type RouteResponse = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};
type RouteHandler = (req: RouteRequest, res: RouteResponse, next: () => void) => Promise<void>;

function legacySkipFeedbackHandler(): RouteHandler {
  const layer = (kinfolkRouter as unknown as {
    stack: Array<{
      route?: {
        path?: string;
        methods?: Record<string, boolean>;
        stack: Array<{ handle: RouteHandler }>;
      };
    }>;
  }).stack.find((candidate) => (
    candidate.route?.path === "/kinfolk/skip-feedback" &&
    candidate.route.methods?.get
  ));
  const handler = layer?.route?.stack[0]?.handle;
  if (!handler) throw new Error("Legacy Kinfolk skip-feedback GET handler is not registered.");
  return handler;
}

function responseMock(): RouteResponse {
  const response: RouteResponse = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

function ownerLinkQuery(rows: Array<{ id?: string; businessId?: string }>) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  return { from, where, limit };
}

function businessQuery(rows: Array<{ id: string }>) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  return { from, where, limit };
}

function feedbackQuery(rows: Array<{ message: unknown }>) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => ({ orderBy }));
  const from = vi.fn(() => ({ where }));
  return { from, where, orderBy, limit };
}

function activeOwnerLinkPredicateForUser(userId: string) {
  return {
    kind: "and",
    conditions: [
      { kind: "eq", column: businessOwnerLinksTable.userId, value: userId },
      { kind: "eq", column: businessOwnerLinksTable.role, value: "owner" },
      { kind: "eq", column: businessOwnerLinksTable.status, value: "approved" },
      { kind: "isNull", column: businessOwnerLinksTable.revokedAt },
    ],
  };
}

function activeOwnerLinkPredicateForBusiness(businessId: string) {
  return {
    kind: "and",
    conditions: [
      { kind: "eq", column: businessOwnerLinksTable.businessId, value: businessId },
      { kind: "eq", column: businessOwnerLinksTable.role, value: "owner" },
      { kind: "eq", column: businessOwnerLinksTable.status, value: "approved" },
      { kind: "isNull", column: businessOwnerLinksTable.revokedAt },
    ],
  };
}

describe("legacy Kinfolk skip-feedback owner isolation", () => {
  beforeEach(() => {
    mocks.select.mockReset();
    mocks.getUserTier.mockReset().mockResolvedValue("trailblazer");
    mocks.and.mockClear();
    mocks.eq.mockClear();
    mocks.isNull.mockClear();
    mocks.desc.mockClear();
  });

  it("returns 401 before membership, owner-link, business, or feedback lookup when unauthenticated", async () => {
    const response = responseMock();

    await legacySkipFeedbackHandler()({}, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(mocks.getUserTier).not.toHaveBeenCalled();
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it.each(["free", "navigator"])("preserves the existing %s tier denial before owner or feedback lookup", async (tier) => {
    mocks.getUserTier.mockResolvedValueOnce(tier);
    const response = responseMock();

    await legacySkipFeedbackHandler()({ user: { id: "restricted-owner" } }, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "Trailblazer membership required" });
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("uses the caller's active approved unrevoke owner link before legacy submittedById and returns the preserved message-only shape", async () => {
    const approvedLink = ownerLinkQuery([{ businessId: "approved-business" }]);
    const feedback = feedbackQuery([
      { message: "Newest feedback first" },
      { message: "   " },
      { message: null },
      { message: "Older feedback second" },
    ]);
    mocks.select
      .mockReturnValueOnce(approvedLink)
      .mockReturnValueOnce(feedback);
    const response = responseMock();

    await legacySkipFeedbackHandler()({ user: { id: "approved-owner" } }, response, vi.fn());

    expect(mocks.select).toHaveBeenNthCalledWith(1, {
      businessId: businessOwnerLinksTable.businessId,
    });
    expect(approvedLink.where).toHaveBeenCalledWith(
      activeOwnerLinkPredicateForUser("approved-owner"),
    );
    expect(approvedLink.limit).toHaveBeenCalledWith(1);
    expect(mocks.select).toHaveBeenCalledTimes(2);
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      messages: ["Newest feedback first", "Older feedback second"],
      total: 2,
    });
    expect(feedback.orderBy).toHaveBeenCalledWith({
      kind: "desc",
      column: businessSkipFeedbackTable.createdAt,
    });
    expect(feedback.limit).toHaveBeenCalledWith(25);
  });

  it("uses submittedById only after no caller active link and only when that legacy business has no active approved unrevoke link", async () => {
    const callerLink = ownerLinkQuery([]);
    const legacyBusiness = businessQuery([{ id: "unclaimed-legacy-business" }]);
    const existingOwner = ownerLinkQuery([]);
    const feedback = feedbackQuery([{ message: "Legacy feedback" }]);
    mocks.select
      .mockReturnValueOnce(callerLink)
      .mockReturnValueOnce(legacyBusiness)
      .mockReturnValueOnce(existingOwner)
      .mockReturnValueOnce(feedback);
    const response = responseMock();

    await legacySkipFeedbackHandler()({ user: { id: "legacy-owner" } }, response, vi.fn());

    expect(callerLink.limit).toHaveBeenCalledWith(1);
    expect(callerLink.where).toHaveBeenCalledWith(
      activeOwnerLinkPredicateForUser("legacy-owner"),
    );
    expect(legacyBusiness.limit).toHaveBeenCalledWith(1);
    expect(legacyBusiness.where).toHaveBeenCalledWith({
      kind: "eq",
      column: businessesTable.submittedById,
      value: "legacy-owner",
    });
    expect(existingOwner.limit).toHaveBeenCalledWith(1);
    expect(existingOwner.where).toHaveBeenCalledWith(
      activeOwnerLinkPredicateForBusiness("unclaimed-legacy-business"),
    );
    expect(mocks.select).toHaveBeenCalledTimes(4);
    expect(response.json).toHaveBeenCalledWith({ messages: ["Legacy feedback"], total: 1 });
    expect(feedback.orderBy).toHaveBeenCalledWith({
      kind: "desc",
      column: businessSkipFeedbackTable.createdAt,
    });
    expect(feedback.limit).toHaveBeenCalledWith(25);
  });

  it("returns a neutral no-disclosure empty result for a former submitter before any feedback query when an active owner link exists", async () => {
    const callerLink = ownerLinkQuery([]);
    const legacyBusiness = businessQuery([{ id: "now-claimed-business" }]);
    const currentOwnerLink = ownerLinkQuery([{ id: "current-owner-link" }]);
    mocks.select
      .mockReturnValueOnce(callerLink)
      .mockReturnValueOnce(legacyBusiness)
      .mockReturnValueOnce(currentOwnerLink);
    const response = responseMock();

    await legacySkipFeedbackHandler()({ user: { id: "former-submitter" } }, response, vi.fn());

    expect(mocks.select).toHaveBeenCalledTimes(3);
    expect(callerLink.where).toHaveBeenCalledWith(
      activeOwnerLinkPredicateForUser("former-submitter"),
    );
    expect(currentOwnerLink.where).toHaveBeenCalledWith(
      activeOwnerLinkPredicateForBusiness("now-claimed-business"),
    );
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ messages: [], total: 0 });
    expect(mocks.select).not.toHaveBeenCalledWith({
      message: businessSkipFeedbackTable.message,
    });
  });

  it("returns the preserved safe 500 recovery when active-owner lookup fails", async () => {
    const failure = new Error("database unavailable");
    mocks.select.mockImplementationOnce(() => {
      throw failure;
    });
    const response = responseMock();
    const log = { error: vi.fn() };

    await legacySkipFeedbackHandler()({ user: { id: "owner-1" }, log }, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ error: "Failed to fetch skip feedback" });
    expect(log.error).toHaveBeenCalledWith(expect.anything(), "Failed to fetch skip feedback");
  });
});
