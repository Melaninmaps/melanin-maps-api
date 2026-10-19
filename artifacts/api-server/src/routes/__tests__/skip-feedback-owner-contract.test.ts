import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  businessesTable: { id: "businesses.id", submittedById: "businesses.submittedById" },
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
  businessSkipFeedbackTable: mocks.skipFeedbackTable,
  conversations: {},
  messages: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: mocks.eq,
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

function ownerBusinessQuery(ownerBusiness: { id: string } | undefined) {
  return {
    from: () => ({
      where: () => ({
        limit: async () => ownerBusiness ? [ownerBusiness] : [],
      }),
    }),
  };
}

describe("canonical owner skip-feedback read", () => {
  beforeEach(() => {
    mocks.select.mockReset();
    mocks.eq.mockClear();
    mocks.loggerError.mockClear();
    mocks.loggerInfo.mockClear();
  });

  it("returns 401 before any business or feedback lookup for an unauthenticated request", async () => {
    const response = responseMock();

    await canonicalOwnerReadHandler()({}, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Authentication required." });
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.eq).not.toHaveBeenCalled();
  });

  it("projects only public insight fields for the authenticated owner's business", async () => {
    const storedFeedback = [{
      id: "feedback-1",
      businessId: "owner-business",
      submittedById: "member-1",
      message: "Add accessible parking.",
      wasFiltered: false,
      filteredReason: "internal moderation detail",
      createdAt: "2026-10-19T00:00:00.000Z",
    }];
    const projectedFeedback = storedFeedback.map(({ id, message, createdAt }) => ({ id, message, createdAt }));
    mocks.select
      .mockReturnValueOnce(ownerBusinessQuery({ id: "owner-business" }))
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            orderBy: async () => projectedFeedback,
          }),
        }),
      });
    const response = responseMock();

    await canonicalOwnerReadHandler()({ user: { id: "owner-1" } }, response, vi.fn());

    expect(mocks.eq).toHaveBeenCalledWith(mocks.businessesTable.submittedById, "owner-1");
    expect(mocks.eq).toHaveBeenCalledWith(mocks.skipFeedbackTable.businessId, "owner-business");
    expect(mocks.select).toHaveBeenNthCalledWith(2, {
      id: mocks.skipFeedbackTable.id,
      message: mocks.skipFeedbackTable.message,
      createdAt: mocks.skipFeedbackTable.createdAt,
    });
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ feedback: projectedFeedback });
    expect(Object.keys(projectedFeedback[0] ?? {}).sort()).toEqual(["createdAt", "id", "message"]);
    expect(projectedFeedback[0]).not.toHaveProperty("businessId");
    expect(projectedFeedback[0]).not.toHaveProperty("submittedById");
    expect(projectedFeedback[0]).not.toHaveProperty("wasFiltered");
    expect(projectedFeedback[0]).not.toHaveProperty("filteredReason");
  });

  it("returns 404 without querying feedback when the authenticated account has no owned business", async () => {
    mocks.select.mockReturnValueOnce(ownerBusinessQuery(undefined));
    const response = responseMock();

    await canonicalOwnerReadHandler()({ user: { id: "owner-without-business" } }, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ error: "No business found." });
    expect(mocks.select).toHaveBeenCalledTimes(1);
    expect(mocks.eq).toHaveBeenCalledWith(mocks.businessesTable.submittedById, "owner-without-business");
    expect(mocks.eq).not.toHaveBeenCalledWith(mocks.skipFeedbackTable.businessId, expect.anything());
  });

  it("returns the existing safe 500 response when an owned-business lookup fails", async () => {
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
