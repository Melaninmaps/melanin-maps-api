import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  and: vi.fn((...conditions: unknown[]) => ({ conditions })),
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  isNull: vi.fn((column: unknown) => ({ column, isNull: true })),
  businessesTable: { id: "businesses.id", submittedById: "businesses.submittedById" },
  ownerLinksTable: {
    id: "business_owner_links.id",
    businessId: "business_owner_links.businessId",
    userId: "business_owner_links.userId",
    role: "business_owner_links.role",
    status: "business_owner_links.status",
    revokedAt: "business_owner_links.revokedAt",
  },
  skipFeedbackTable: {
    id: "business_skip_feedback.id",
    businessId: "business_skip_feedback.businessId",
    submittedById: "business_skip_feedback.submittedById",
    message: "business_skip_feedback.message",
    wasFiltered: "business_skip_feedback.wasFiltered",
    filteredReason: "business_skip_feedback.filteredReason",
    createdAt: "business_skip_feedback.createdAt",
  },
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  db: { select: mocks.select },
  businessesTable: mocks.businessesTable,
  businessOwnerLinksTable: mocks.ownerLinksTable,
  businessSkipFeedbackTable: mocks.skipFeedbackTable,
  conversations: {},
  messages: {},
}));

vi.mock("drizzle-orm", () => ({
  and: mocks.and,
  eq: mocks.eq,
  isNull: mocks.isNull,
}));

vi.mock("../../lib/contentFilter", () => ({
  checkContent: vi.fn(() => ({ ok: true })),
}));

vi.mock("../../lib/logger", () => ({
  logger: { error: mocks.loggerError, info: mocks.loggerInfo },
}));

import skipFeedbackRouter from "../skip-feedback";

type RouteRequest = {
  user?: { id: string };
  log?: { error: ReturnType<typeof vi.fn> };
};
type RouteHandler = (req: RouteRequest, res: unknown, next: () => void) => Promise<void>;
type OwnerLink = { id?: string; businessId?: string } | undefined;

function canonicalOwnerReadHandler(): RouteHandler {
  const layer = (skipFeedbackRouter as unknown as { stack: Array<{ route?: { path?: string; methods?: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> } }> }).stack
    .find((candidate) => candidate.route?.path === "/businesses/mine/skip-feedback" && candidate.route.methods?.get);
  const handler = layer?.route?.stack[0]?.handle;
  if (!handler) throw new Error("Canonical owner skip-feedback GET handler is not registered.");
  return handler;
}

function responseMock() {
  const response: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  } = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

function ownerLinkQuery(link: OwnerLink) {
  return {
    from: () => ({
      where: () => ({
        limit: async () => link ? [link] : [],
      }),
    }),
  };
}

function legacyBusinessQuery(ownerBusiness: { id: string } | undefined) {
  return {
    from: () => ({
      where: () => ({
        limit: async () => ownerBusiness ? [ownerBusiness] : [],
      }),
    }),
  };
}

function feedbackQuery(feedback: Array<{ id: string; message: string; createdAt: string }>) {
  return {
    from: () => ({
      where: () => ({
        orderBy: async () => feedback,
      }),
    }),
  };
}

const storedFeedback = [{
  id: "feedback-1",
  businessId: "approved-business",
  submittedById: "member-1",
  message: "Add accessible parking.",
  wasFiltered: false,
  filteredReason: "internal moderation detail",
  createdAt: "2026-10-19T00:00:00.000Z",
}];
const projectedFeedback = storedFeedback.map(({ id, message, createdAt }) => ({ id, message, createdAt }));

function expectSafeProjectionForBusiness(businessId: string) {
  expect(mocks.eq).toHaveBeenCalledWith(mocks.skipFeedbackTable.businessId, businessId);
  expect(mocks.select).toHaveBeenLastCalledWith({
    id: mocks.skipFeedbackTable.id,
    message: mocks.skipFeedbackTable.message,
    createdAt: mocks.skipFeedbackTable.createdAt,
  });
  expect(Object.keys(projectedFeedback[0] ?? {}).sort()).toEqual(["createdAt", "id", "message"]);
  expect(projectedFeedback[0]).not.toHaveProperty("businessId");
  expect(projectedFeedback[0]).not.toHaveProperty("submittedById");
  expect(projectedFeedback[0]).not.toHaveProperty("wasFiltered");
  expect(projectedFeedback[0]).not.toHaveProperty("filteredReason");
}

describe("canonical owner skip-feedback read", () => {
  beforeEach(() => {
    mocks.select.mockReset();
    mocks.and.mockClear();
    mocks.eq.mockClear();
    mocks.isNull.mockClear();
    mocks.loggerError.mockClear();
    mocks.loggerInfo.mockClear();
  });

  it("returns 401 before any owner-link, business, or feedback lookup for an unauthenticated request", async () => {
    const response = responseMock();

    await canonicalOwnerReadHandler()({}, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Authentication required." });
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.eq).not.toHaveBeenCalled();
  });

  it.each(["a null legacy submitter", "a different legacy submitter"])("uses an active approved owner link before %s", async () => {
    mocks.select
      .mockReturnValueOnce(ownerLinkQuery({ businessId: "approved-business" }))
      .mockReturnValueOnce(feedbackQuery(projectedFeedback));
    const response = responseMock();

    await canonicalOwnerReadHandler()({ user: { id: "approved-owner" } }, response, vi.fn());

    expect(mocks.select).toHaveBeenNthCalledWith(1, { businessId: mocks.ownerLinksTable.businessId });
    expect(mocks.eq).toHaveBeenCalledWith(mocks.ownerLinksTable.userId, "approved-owner");
    expect(mocks.eq).toHaveBeenCalledWith(mocks.ownerLinksTable.role, "owner");
    expect(mocks.eq).toHaveBeenCalledWith(mocks.ownerLinksTable.status, "approved");
    expect(mocks.isNull).toHaveBeenCalledWith(mocks.ownerLinksTable.revokedAt);
    expect(mocks.eq).not.toHaveBeenCalledWith(mocks.businessesTable.submittedById, "approved-owner");
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ feedback: projectedFeedback });
    expectSafeProjectionForBusiness("approved-business");
  });

  it("uses legacy submittedById only when no active approved owner link exists", async () => {
    mocks.select
      .mockReturnValueOnce(ownerLinkQuery(undefined))
      .mockReturnValueOnce(legacyBusinessQuery({ id: "legacy-business" }))
      .mockReturnValueOnce(ownerLinkQuery(undefined))
      .mockReturnValueOnce(feedbackQuery(projectedFeedback));
    const response = responseMock();

    await canonicalOwnerReadHandler()({ user: { id: "legacy-owner" } }, response, vi.fn());

    expect(mocks.eq).toHaveBeenCalledWith(mocks.businessesTable.submittedById, "legacy-owner");
    expect(mocks.select).toHaveBeenNthCalledWith(3, { id: mocks.ownerLinksTable.id });
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ feedback: projectedFeedback });
    expectSafeProjectionForBusiness("legacy-business");
  });

  it("denies a former submitter before a feedback query when a different active approved owner link exists", async () => {
    mocks.select
      .mockReturnValueOnce(ownerLinkQuery(undefined))
      .mockReturnValueOnce(legacyBusinessQuery({ id: "claimed-business" }))
      .mockReturnValueOnce(ownerLinkQuery({ id: "current-owner-link" }));
    const response = responseMock();

    await canonicalOwnerReadHandler()({ user: { id: "former-submitter" } }, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ error: "No business found." });
    expect(mocks.select).toHaveBeenCalledTimes(3);
    expect(mocks.eq).toHaveBeenCalledWith(mocks.ownerLinksTable.businessId, "claimed-business");
    expect(mocks.eq).not.toHaveBeenCalledWith(mocks.skipFeedbackTable.businessId, expect.anything());
  });

  it("returns 404 without a feedback query when no approved link or legacy business exists", async () => {
    mocks.select
      .mockReturnValueOnce(ownerLinkQuery(undefined))
      .mockReturnValueOnce(legacyBusinessQuery(undefined));
    const response = responseMock();

    await canonicalOwnerReadHandler()({ user: { id: "owner-without-business" } }, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ error: "No business found." });
    expect(mocks.select).toHaveBeenCalledTimes(2);
    expect(mocks.eq).toHaveBeenCalledWith(mocks.businessesTable.submittedById, "owner-without-business");
    expect(mocks.eq).not.toHaveBeenCalledWith(mocks.skipFeedbackTable.businessId, expect.anything());
  });

  it("returns the existing safe 500 response when the approved-owner lookup fails", async () => {
    const failure = new Error("database unavailable");
    mocks.select.mockImplementationOnce(() => { throw failure; });
    const response = responseMock();
    const log = { error: vi.fn() };

    await canonicalOwnerReadHandler()({ user: { id: "owner-1" }, log }, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ error: "Failed to fetch feedback." });
    expect(log.error).toHaveBeenCalledWith({ err: failure }, "GET /businesses/mine/skip-feedback error");
  });
});
