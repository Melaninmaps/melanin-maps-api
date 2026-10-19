import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

type ConversationRow = {
  id: number;
  title: string;
  participantIds: string[];
  businessId: string | null;
  type: "dm" | "business";
  requestStatus: "pending" | "accepted" | null;
  requestedBy: string | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
};

type UserRow = {
  id: string;
  isPrivate: boolean;
  allowDm: boolean;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
};

type Predicate =
  | { kind: "eq"; column: unknown; value: unknown }
  | { kind: "and"; predicates: Predicate[] }
  | { kind: "sql"; values: unknown[] }
  | { kind: "other" };

const fakes = vi.hoisted(() => ({
  state: {
    conversations: [] as ConversationRow[],
    users: [] as UserRow[],
    blockedPairs: new Set<string>(),
    nextConversationId: 100,
    emptyAcceptMutation: false,
    emptyDeclineMutation: false,
  },
  tables: {
    conversations: {
      table: "conversations",
      id: "conversation.id",
      participantIds: "conversation.participantIds",
      type: "conversation.type",
      requestStatus: "conversation.requestStatus",
      lastMessageAt: "conversation.lastMessageAt",
      lastMessagePreview: "conversation.lastMessagePreview",
    },
    messages: { table: "messages" },
    users: {
      table: "users",
      id: "user.id",
      isPrivate: "user.isPrivate",
      allowDm: "user.allowDm",
      firstName: "user.firstName",
      lastName: "user.lastName",
      username: "user.username",
      profileImageUrl: "user.profileImageUrl",
    },
  },
}));

function pair(left: string, right: string): string {
  return [left, right].sort().join("|");
}

vi.mock("drizzle-orm", () => ({
  eq: (column: unknown, value: unknown): Predicate => ({
    kind: "eq",
    column,
    value,
  }),
  and: (...predicates: Predicate[]): Predicate => ({ kind: "and", predicates }),
  asc: (): Predicate => ({ kind: "other" }),
  desc: (): Predicate => ({ kind: "other" }),
  ilike: (): Predicate => ({ kind: "other" }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]): Predicate => ({
    kind: "sql",
    values: [strings.join(""), ...values],
  }),
}));

vi.mock("../../lib/familyFilter", () => ({
  scanForFamily: vi.fn(async () => ({ blocked: false })),
}));

vi.mock("../../social/profileRelationshipAccess", () => ({
  filterBlockedRelationships: vi.fn(
    async (_viewerId: string, users: UserRow[]) => users,
  ),
  usersAreBlocked: vi.fn(async (left: string, right: string) =>
    fakes.state.blockedPairs.has(pair(left, right)),
  ),
}));

vi.mock("@workspace/db", () => {
  function equalValue(predicate: unknown, column: unknown): unknown {
    if (!predicate || typeof predicate !== "object") return undefined;
    const candidate = predicate as Predicate;
    if (candidate.kind === "eq")
      return candidate.column === column ? candidate.value : undefined;
    if (candidate.kind === "and") {
      for (const item of candidate.predicates) {
        const value = equalValue(item, column);
        if (value !== undefined) return value;
      }
    }
    return undefined;
  }

  function sqlMemberIds(predicate: unknown): string[] {
    if (!predicate || typeof predicate !== "object") return [];
    const candidate = predicate as Predicate;
    if (candidate.kind !== "sql") return [];
    return candidate.values.flatMap((value) => {
      if (typeof value !== "string" || !value.startsWith("[")) return [];
      try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) &&
          parsed.every((id) => typeof id === "string")
          ? parsed
          : [];
      } catch {
        return [];
      }
    });
  }

  function rowsFor(
    table: unknown,
    predicate: unknown,
  ): ConversationRow[] | UserRow[] {
    if (table === fakes.tables.users) {
      const userId = equalValue(predicate, fakes.tables.users.id);
      return typeof userId === "string"
        ? fakes.state.users.filter((user) => user.id === userId)
        : fakes.state.users;
    }
    if (table !== fakes.tables.conversations) return [];

    const conversationId = equalValue(predicate, fakes.tables.conversations.id);
    if (typeof conversationId === "number") {
      return fakes.state.conversations.filter(
        (conversation) => conversation.id === conversationId,
      );
    }

    const memberIds = sqlMemberIds(predicate);
    if (memberIds.length === 0) return fakes.state.conversations;
    return fakes.state.conversations.filter((conversation) =>
      memberIds.every((memberId) =>
        conversation.participantIds.includes(memberId),
      ),
    );
  }

  function pendingMutation(predicate: unknown): ConversationRow | null {
    const conversationId = equalValue(predicate, fakes.tables.conversations.id);
    const requiredStatus = equalValue(
      predicate,
      fakes.tables.conversations.requestStatus,
    );
    if (typeof conversationId !== "number") return null;
    const conversation =
      fakes.state.conversations.find((row) => row.id === conversationId) ??
      null;
    if (
      !conversation ||
      (requiredStatus !== undefined &&
        conversation.requestStatus !== requiredStatus)
    ) {
      return null;
    }
    return conversation;
  }

  const db = {
    select: vi.fn(() => ({
      from: (table: unknown) => {
        let predicate: unknown;
        const query = {
          where: (nextPredicate: unknown) => {
            predicate = nextPredicate;
            return query;
          },
          orderBy: () => query,
          limit: async () => rowsFor(table, predicate),
        };
        return query;
      },
    })),
    insert: vi.fn((table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        returning: async () => {
          if (table !== fakes.tables.conversations) return [];
          const conversation: ConversationRow = {
            id: fakes.state.nextConversationId++,
            title:
              typeof values.title === "string"
                ? values.title
                : "Direct Message",
            participantIds: Array.isArray(values.participantIds)
              ? values.participantIds.filter(
                  (id): id is string => typeof id === "string",
                )
              : [],
            businessId:
              typeof values.businessId === "string" ? values.businessId : null,
            type: values.type === "business" ? "business" : "dm",
            requestStatus:
              values.requestStatus === "accepted" ||
              values.requestStatus === "pending"
                ? values.requestStatus
                : null,
            requestedBy:
              typeof values.requestedBy === "string"
                ? values.requestedBy
                : null,
            lastMessageAt: null,
            lastMessagePreview: null,
          };
          fakes.state.conversations.push(conversation);
          return [conversation];
        },
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: (values: Partial<ConversationRow>) => ({
        where: (predicate: unknown) => ({
          returning: async () => {
            if (
              table !== fakes.tables.conversations ||
              fakes.state.emptyAcceptMutation
            )
              return [];
            const conversation = pendingMutation(predicate);
            if (!conversation) return [];
            Object.assign(conversation, values);
            return [conversation];
          },
        }),
      }),
    })),
    delete: vi.fn((table: unknown) => ({
      where: (predicate: unknown) => ({
        returning: async () => {
          if (
            table !== fakes.tables.conversations ||
            fakes.state.emptyDeclineMutation
          )
            return [];
          const conversation = pendingMutation(predicate);
          if (!conversation) return [];
          fakes.state.conversations = fakes.state.conversations.filter(
            (row) => row.id !== conversation.id,
          );
          return [{ id: conversation.id }];
        },
      }),
    })),
  };

  return {
    db,
    conversations: fakes.tables.conversations,
    messages: fakes.tables.messages,
    usersTable: fakes.tables.users,
  };
});

import conversationsRouter from "../conversations";

const REQUESTER = "member-a";
const RECIPIENT = "member-b";
const OUTSIDER = "member-c";

function app(): express.Express {
  const server = express();
  server.use(express.json());
  server.use((req, _res, next) => {
    const memberId = req.header("x-member-id");
    if (memberId) (req as { user?: { id: string } }).user = { id: memberId };
    (req as any).log = { error: () => undefined };
    next();
  });
  server.use(conversationsRouter);
  return server;
}

function seedPending(id = 1): ConversationRow {
  const conversation: ConversationRow = {
    id,
    title: "Private community introduction",
    participantIds: [REQUESTER, RECIPIENT],
    businessId: null,
    type: "dm",
    requestStatus: "pending",
    requestedBy: REQUESTER,
    lastMessageAt: null,
    lastMessagePreview: null,
  };
  fakes.state.conversations.push(conversation);
  return conversation;
}

function resetFakes(): void {
  fakes.state.conversations = [];
  fakes.state.users = [
    { id: REQUESTER, isPrivate: false, allowDm: true },
    { id: RECIPIENT, isPrivate: true, allowDm: true },
    { id: OUTSIDER, isPrivate: false, allowDm: true },
  ];
  fakes.state.blockedPairs.clear();
  fakes.state.nextConversationId = 100;
  fakes.state.emptyAcceptMutation = false;
  fakes.state.emptyDeclineMutation = false;
}

beforeEach(() => resetFakes());

describe("server-authoritative direct-message request lifecycle", () => {
  it("creates a private pending request, lists it only to participants, accepts it, and returns accepted state on a fresh list", async () => {
    const server = app();
    const created = await request(server)
      .post("/conversations")
      .set("x-member-id", REQUESTER)
      .send({
        type: "dm",
        participantId: RECIPIENT,
        title: "Private community introduction",
      });

    expect(created.statusCode).toBe(201);
    expect(created.body.conversation).toMatchObject({
      id: 100,
      type: "dm",
      requestStatus: "pending",
      requestedBy: REQUESTER,
      participantIds: [REQUESTER, RECIPIENT],
    });

    const recipientPending = await request(server)
      .get("/conversations")
      .set("x-member-id", RECIPIENT);
    const requesterPending = await request(server)
      .get("/conversations")
      .set("x-member-id", REQUESTER);
    const outsiderPending = await request(server)
      .get("/conversations")
      .set("x-member-id", OUTSIDER);
    expect(recipientPending.body.conversations).toEqual([
      expect.objectContaining({ id: 100, requestStatus: "pending" }),
    ]);
    expect(requesterPending.body.conversations).toEqual([
      expect.objectContaining({ id: 100, requestStatus: "pending" }),
    ]);
    expect(outsiderPending.body.conversations).toEqual([]);

    const accepted = await request(server)
      .post("/conversations/100/accept")
      .set("x-member-id", RECIPIENT);
    expect(accepted.statusCode).toBe(200);
    expect(accepted.body.conversation).toMatchObject({
      id: 100,
      requestStatus: "accepted",
    });

    const recipientAccepted = await request(server)
      .get("/conversations")
      .set("x-member-id", RECIPIENT);
    const requesterAccepted = await request(server)
      .get("/conversations")
      .set("x-member-id", REQUESTER);
    expect(recipientAccepted.body.conversations).toEqual([
      expect.objectContaining({ id: 100, requestStatus: "accepted" }),
    ]);
    expect(requesterAccepted.body.conversations).toEqual([
      expect.objectContaining({ id: 100, requestStatus: "accepted" }),
    ]);
  });

  it("declines a pending request and a fresh participant list confirms the server-authoritative deletion", async () => {
    const server = app();
    seedPending(200);

    const declined = await request(server)
      .post("/conversations/200/decline")
      .set("x-member-id", RECIPIENT);
    expect(declined.statusCode).toBe(200);
    expect(declined.body).toEqual({ ok: true });

    const recipientAfterDecline = await request(server)
      .get("/conversations")
      .set("x-member-id", RECIPIENT);
    const requesterAfterDecline = await request(server)
      .get("/conversations")
      .set("x-member-id", REQUESTER);
    expect(recipientAfterDecline.body.conversations).toEqual([]);
    expect(requesterAfterDecline.body.conversations).toEqual([]);
  });

  it("rejects stale, replayed, and zero-row race actions with the neutral conflict response", async () => {
    const server = app();
    seedPending(300);
    const firstAccept = await request(server)
      .post("/conversations/300/accept")
      .set("x-member-id", RECIPIENT);
    expect(firstAccept.statusCode).toBe(200);

    const replayAccept = await request(server)
      .post("/conversations/300/accept")
      .set("x-member-id", RECIPIENT);
    const staleDecline = await request(server)
      .post("/conversations/300/decline")
      .set("x-member-id", RECIPIENT);
    expect(replayAccept.statusCode).toBe(409);
    expect(staleDecline.statusCode).toBe(409);
    expect(replayAccept.body).toMatchObject({
      code: "REQUEST_ACTION_CONFLICT",
    });
    expect(staleDecline.body).toMatchObject({
      code: "REQUEST_ACTION_CONFLICT",
    });

    seedPending(301);
    fakes.state.emptyAcceptMutation = true;
    const acceptRace = await request(server)
      .post("/conversations/301/accept")
      .set("x-member-id", RECIPIENT);
    expect(acceptRace.statusCode).toBe(409);
    expect(acceptRace.body).toMatchObject({ code: "REQUEST_ACTION_CONFLICT" });

    fakes.state.emptyAcceptMutation = false;
    seedPending(302);
    fakes.state.emptyDeclineMutation = true;
    const declineRace = await request(server)
      .post("/conversations/302/decline")
      .set("x-member-id", RECIPIENT);
    expect(declineRace.statusCode).toBe(409);
    expect(declineRace.body).toMatchObject({ code: "REQUEST_ACTION_CONFLICT" });
  });

  it("rejects unauthenticated, requester, nonparticipant, and blocked recipient actions without changing the pending request", async () => {
    const server = app();
    seedPending(400);

    const unauthenticated = await request(server).post(
      "/conversations/400/accept",
    );
    const requesterAccept = await request(server)
      .post("/conversations/400/accept")
      .set("x-member-id", REQUESTER);
    const requesterDecline = await request(server)
      .post("/conversations/400/decline")
      .set("x-member-id", REQUESTER);
    const outsider = await request(server)
      .post("/conversations/400/accept")
      .set("x-member-id", OUTSIDER);
    expect(unauthenticated.statusCode).toBe(401);
    expect(requesterAccept.statusCode).toBe(400);
    expect(requesterDecline.statusCode).toBe(400);
    expect(outsider.statusCode).toBe(403);
    expect(fakes.state.conversations).toEqual([
      expect.objectContaining({ id: 400, requestStatus: "pending" }),
    ]);

    fakes.state.blockedPairs.add(pair(REQUESTER, RECIPIENT));
    const blockedAccept = await request(server)
      .post("/conversations/400/accept")
      .set("x-member-id", RECIPIENT);
    const blockedDecline = await request(server)
      .post("/conversations/400/decline")
      .set("x-member-id", RECIPIENT);
    expect(blockedAccept.statusCode).toBe(403);
    expect(blockedDecline.statusCode).toBe(403);
    expect(fakes.state.conversations).toEqual([
      expect.objectContaining({ id: 400, requestStatus: "pending" }),
    ]);
  });
});
