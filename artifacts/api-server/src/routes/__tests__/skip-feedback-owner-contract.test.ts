import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  businessesTable: { id: "businesses.id", submittedById: "businesses.submittedById" },
  skipFeedbackTable: { businessId: "business_skip_feedback.businessId", createdAt: "business_skip_feedback.createdAt" },
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

type RouteHandler = (req: { user?: { id: string } }, res: unknown, next: () => void) => Promise<void>;

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

  it("reads and returns feedback only for the authenticated owner business", async () => {
    const feedback = [{ id: "feedback-1", message: "Add accessible parking.", createdAt: "2026-10-19T00:00:00.000Z" }];
    mocks.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [{ id: "owner-business" }],
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            orderBy: async () => feedback,
          }),
        }),
      });
    const response = responseMock();

    await canonicalOwnerReadHandler()({ user: { id: "owner-1" } }, response, vi.fn());

    expect(mocks.eq).toHaveBeenCalledWith(mocks.businessesTable.submittedById, "owner-1");
    expect(mocks.eq).toHaveBeenCalledWith(mocks.skipFeedbackTable.businessId, "owner-business");
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ feedback });
  });
});
