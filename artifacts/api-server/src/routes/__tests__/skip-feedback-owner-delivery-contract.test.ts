import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  and: vi.fn((...conditions: unknown[]) => ({ conditions })),
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  isNull: vi.fn((column: unknown) => ({ column, isNull: true })),
  checkContent: vi.fn(() => ({ ok: true })),
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
  selectQueue: [] as unknown[],
  insertReturningQueue: [] as unknown[][],
  operations: [] as Array<{ kind: "insert" | "update"; table: unknown; values: unknown }>,
  businessesTable: {
    id: "businesses.id",
    name: "businesses.name",
    feedbackOptIn: "businesses.feedbackOptIn",
    submittedById: "businesses.submittedById",
  },
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
  },
  conversationsTable: {
    id: "conversations.id",
    title: "conversations.title",
    participantIds: "conversations.participantIds",
    businessId: "conversations.businessId",
    lastMessageAt: "conversations.lastMessageAt",
    lastMessagePreview: "conversations.lastMessagePreview",
  },
  messagesTable: {
    id: "messages.id",
    conversationId: "messages.conversationId",
  },
}));

vi.mock("@workspace/db", () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
    update: mocks.update,
  },
  businessesTable: mocks.businessesTable,
  businessOwnerLinksTable: mocks.ownerLinksTable,
  businessSkipFeedbackTable: mocks.skipFeedbackTable,
  conversations: mocks.conversationsTable,
  messages: mocks.messagesTable,
}));

vi.mock("drizzle-orm", () => ({
  and: mocks.and,
  eq: mocks.eq,
  isNull: mocks.isNull,
}));

vi.mock("../../lib/contentFilter", () => ({ checkContent: mocks.checkContent }));
vi.mock("../../lib/logger", () => ({ logger: { error: mocks.loggerError, info: mocks.loggerInfo } }));

import skipFeedbackRouter from "../skip-feedback";

type QueryRow = Record<string, unknown>;
type Operation = (typeof mocks.operations)[number];
type RouteRequest = {
  params: { id: string };
  body: { message?: string };
  user?: { id: string };
  log: { error: ReturnType<typeof vi.fn> };
};
type RouteHandler = (request: RouteRequest, response: unknown, next: () => void) => Promise<void>;

function postHandler(): RouteHandler {
  const layer = (skipFeedbackRouter as unknown as {
    stack: Array<{ route?: { path?: string; methods?: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> } }>;
  }).stack.find((candidate) => candidate.route?.path === "/businesses/:id/skip-feedback" && candidate.route.methods?.post);
  const handler = layer?.route?.stack[0]?.handle;
  if (!handler) throw new Error("Skip-feedback POST handler is not registered.");
  return handler;
}

function responseMock() {
  const response: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

function rowsQuery(rows: QueryRow[]) {
  return {
    from: () => ({
      where: () => ({
        limit: async () => rows,
      }),
    }),
  };
}

function configureQueries(...queries: unknown[]) {
  mocks.selectQueue = [...queries];
  mocks.select.mockImplementation(() => {
    const query = mocks.selectQueue.shift();
    if (!query) throw new Error("Unexpected select query");
    return query;
  });
}

function configureMutationMakers() {
  mocks.insert.mockImplementation((table: unknown) => ({
    values: vi.fn((values: unknown) => {
      mocks.operations.push({ kind: "insert", table, values });
      const rows = mocks.insertReturningQueue.shift() ?? [];
      return { returning: async () => rows };
    }),
  }));
  mocks.update.mockImplementation((table: unknown) => ({
    set: vi.fn((values: unknown) => {
      mocks.operations.push({ kind: "update", table, values });
      return { where: vi.fn().mockResolvedValue(undefined) };
    }),
  }));
}

function submittedBusiness(submittedById: string | null) {
  return {
    id: "business-1",
    name: "Example Business",
    feedbackOptIn: true,
    submittedById,
  };
}

function request() {
  return {
    params: { id: "business-1" },
    body: { message: "Please add more accessible seating." },
    user: { id: "feedback-member" },
    log: { error: vi.fn() },
  };
}

function operation(table: unknown, kind: Operation["kind"]): Operation {
  const found = mocks.operations.find((entry) => entry.table === table && entry.kind === kind);
  if (!found) throw new Error(`Missing ${kind} operation`);
  return found;
}

function expectActiveOwnerRecipientLookup() {
  expect(mocks.select).toHaveBeenNthCalledWith(2, { userId: mocks.ownerLinksTable.userId });
  expect(mocks.eq).toHaveBeenCalledWith(mocks.ownerLinksTable.businessId, "business-1");
  expect(mocks.eq).toHaveBeenCalledWith(mocks.ownerLinksTable.role, "owner");
  expect(mocks.eq).toHaveBeenCalledWith(mocks.ownerLinksTable.status, "approved");
  expect(mocks.isNull).toHaveBeenCalledWith(mocks.ownerLinksTable.revokedAt);
}

function expectNoPrivateInboxMutation() {
  expect(mocks.operations.some((entry) =>
    entry.table === mocks.conversationsTable || entry.table === mocks.messagesTable,
  )).toBe(false);
}

describe("POST skip-feedback exactly-one active-owner inbox delivery", () => {
  beforeEach(() => {
    mocks.select.mockReset();
    mocks.insert.mockReset();
    mocks.update.mockReset();
    mocks.and.mockClear();
    mocks.eq.mockClear();
    mocks.isNull.mockClear();
    mocks.checkContent.mockReset();
    mocks.checkContent.mockReturnValue({ ok: true });
    mocks.loggerError.mockClear();
    mocks.loggerInfo.mockClear();
    mocks.selectQueue = [];
    mocks.insertReturningQueue = [];
    mocks.operations = [];
    configureMutationMakers();
  });

  it("delivers to exactly one active approved owner when the legacy submitter is null", async () => {
    configureQueries(
      rowsQuery([submittedBusiness(null)]),
      rowsQuery([{ userId: "approved-owner" }]),
      rowsQuery([]),
    );
    mocks.insertReturningQueue = [[], [{ id: 41 }], []];
    const response = responseMock();

    await postHandler()(request(), response, vi.fn());

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ success: true });
    expectActiveOwnerRecipientLookup();
    expect(operation(mocks.conversationsTable, "insert").values).toMatchObject({
      businessId: "business-1",
      participantIds: ["approved-owner"],
    });
    expect(operation(mocks.messagesTable, "insert").values).toMatchObject({
      conversationId: 41,
      role: "feedback",
      content: "Please add more accessible seating.",
    });
  });

  it("excludes a former legacy submitter when exactly one active approved owner exists", async () => {
    configureQueries(
      rowsQuery([submittedBusiness("former-submitter")]),
      rowsQuery([{ userId: "approved-owner" }]),
      rowsQuery([]),
    );
    mocks.insertReturningQueue = [[], [{ id: 42 }], []];
    const response = responseMock();

    await postHandler()(request(), response, vi.fn());

    expect(response.json).toHaveBeenCalledWith({ success: true });
    expectActiveOwnerRecipientLookup();
    expect(mocks.eq).not.toHaveBeenCalledWith(mocks.businessesTable.submittedById, "former-submitter");
    const conversation = operation(mocks.conversationsTable, "insert").values as { participantIds: string[] };
    expect(conversation.participantIds).toEqual(["approved-owner"]);
    expect(conversation.participantIds).not.toContain("former-submitter");
  });

  it("realigns a transferred business's existing private conversation before appending", async () => {
    configureQueries(
      rowsQuery([submittedBusiness("former-submitter")]),
      rowsQuery([{ userId: "current-approved-owner" }]),
      rowsQuery([{ id: 77 }]),
    );
    mocks.insertReturningQueue = [[], []];
    const response = responseMock();

    await postHandler()(request(), response, vi.fn());

    expect(response.json).toHaveBeenCalledWith({ success: true });
    const participantUpdateIndex = mocks.operations.findIndex((entry) =>
      entry.kind === "update"
      && entry.table === mocks.conversationsTable
      && (entry.values as { participantIds?: string[] }).participantIds?.[0] === "current-approved-owner",
    );
    const feedbackMessageInsertIndex = mocks.operations.findIndex((entry) =>
      entry.kind === "insert" && entry.table === mocks.messagesTable,
    );
    expect(participantUpdateIndex).toBeGreaterThanOrEqual(0);
    expect(participantUpdateIndex).toBeLessThan(feedbackMessageInsertIndex);
    expect(mocks.operations[participantUpdateIndex]?.values).toEqual({ participantIds: ["current-approved-owner"] });
    expect(mocks.operations.find((entry) => entry.table === mocks.conversationsTable && entry.kind === "insert")).toBeUndefined();
  });

  it.each(["a revoked link filtered from the active result", "no active owner link"])(
    "persists feedback but creates no private inbox delivery when there is %s",
    async () => {
      configureQueries(
        rowsQuery([submittedBusiness("former-submitter")]),
        rowsQuery([]),
      );
      mocks.insertReturningQueue = [[]];
      const response = responseMock();

      await postHandler()(request(), response, vi.fn());

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith({ success: true });
      expectActiveOwnerRecipientLookup();
      expectNoPrivateInboxMutation();
      expect(operation(mocks.skipFeedbackTable, "insert").values).toMatchObject({
        businessId: "business-1",
        submittedById: "feedback-member",
      });
    },
  );

  it("fails closed without private inbox delivery when multiple active approved owners exist", async () => {
    configureQueries(
      rowsQuery([submittedBusiness("former-submitter")]),
      rowsQuery([{ userId: "owner-a" }, { userId: "owner-b" }]),
    );
    mocks.insertReturningQueue = [[]];
    const response = responseMock();

    await postHandler()(request(), response, vi.fn());

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ success: true });
    expectActiveOwnerRecipientLookup();
    expectNoPrivateInboxMutation();
  });

  it("contains null-owner-link delivery while preserving feedback provenance and normal success", async () => {
    configureQueries(
      rowsQuery([submittedBusiness(null)]),
      rowsQuery([]),
    );
    mocks.insertReturningQueue = [[]];
    const response = responseMock();

    await postHandler()(request(), response, vi.fn());

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ success: true });
    expectActiveOwnerRecipientLookup();
    expect(operation(mocks.skipFeedbackTable, "insert").values).toMatchObject({
      businessId: "business-1",
      submittedById: "feedback-member",
      message: "Please add more accessible seating.",
      wasFiltered: false,
    });
    expectNoPrivateInboxMutation();
  });
});
