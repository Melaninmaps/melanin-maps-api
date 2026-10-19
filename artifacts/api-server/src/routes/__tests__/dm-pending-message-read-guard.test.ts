import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

type ConversationRow = {
  id: number;
  title: string;
  participantIds: string[];
  type: "dm" | "business";
  requestStatus: "pending" | "accepted" | null;
  requestedBy: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
};

type MessageRow = {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  createdAt: string;
};

type Predicate =
  | { kind: "eq"; column: unknown; value: unknown }
  | { kind: "and"; predicates: Predicate[] }
  | { kind: "sql"; values: unknown[] }
  | { kind: "other" };

const fakes = vi.hoisted(() => ({
  state: {
    conversations: [] as ConversationRow[],
    messages: [] as MessageRow[],
    blockedPairs: new Set<string>(),
    messageReadQueries: 0,
  },
  tables: {
    conversations: {
      table: "conversations",
      id: "conversation.id",
      participantIds: "conversation.participantIds",
      type: "conversation.type",
      requestStatus: "conversation.requestStatus",
      lastMessageAt: "conversation.lastMessageAt",
    },
    messages: {
      table: "messages",
      conversationId: "message.conversationId",
      createdAt: "message.createdAt",
    },
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

const REQUESTER = "member-a";
const RECIPIENT = "member-b";
const OUTSIDER = "member-c";

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
  or: (): Predicate => ({ kind: "other" }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]): Predicate => ({
    kind: "sql",
    values: [strings.join(""), ...values],
  }),
}));

vi.mock("../../lib/familyFilter", () => ({
  scanForFamily: vi.fn(async () => ({ blocked: false })),
}));

vi.mock("../../community/communitySocialNotifications", () => ({
  deliverCommunitySocialNotification: vi.fn(async () => undefined),
}));

vi.mock("../../social/profileRelationshipAccess", () => ({
  filterBlockedRelationships: vi.fn(async (_viewer: string, rows: unknown[]) => rows),
  usersAreBlocked: vi.fn(async (left: string, right: string) =>
    fakes.state.blockedPairs.has(pair(left, right)),
  ),
}));

vi.mock("@workspace/db", () => {
  function equalValue(predicate: unknown, column: unknown): unknown {
    if (!predicate || typeof predicate !== "object") return undefined;
    const candidate = predicate as Predicate;
    if (candidate.kind === "eq") {
      return candidate.column === column ? candidate.value : undefined;
    }
    if (candidate.kind === "and") {
      for (const child of candidate.predicates) {
        const value = equalValue(child, column);
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
        return Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
          ? parsed
          : [];
      } catch {
        return [];
      }
    });
  }

  function conversationRows(predicate: unknown): ConversationRow[] {
    const id = equalValue(predicate, fakes.tables.conversations.id);
    if (typeof id === "number") {
      return fakes.state.conversations.filter((conversation) => conversation.id === id);
    }
    const memberIds = sqlMemberIds(predicate);
    return memberIds.length === 0
      ? fakes.state.conversations
      : fakes.state.conversations.filter((conversation) =>
          memberIds.every((memberId) => conversation.participantIds.includes(memberId)),
        );
  }

  function messageRows(predicate: unknown): MessageRow[] {
    const conversationId = equalValue(predicate, fakes.tables.messages.conversationId);
    return typeof conversationId === "number"
      ? fakes.state.messages.filter((message) => message.conversationId === conversationId)
      : [];
  }

  function pendingConversation(predicate: unknown): ConversationRow | null {
    const id = equalValue(predicate, fakes.tables.conversations.id);
    const requestStatus = equalValue(
      predicate,
      fakes.tables.conversations.requestStatus,
    );
    if (typeof id !== "number") return null;
    const conversation =
      fakes.state.conversations.find((candidate) => candidate.id === id) ?? null;
    if (
      !conversation ||
      (requestStatus !== undefined && conversation.requestStatus !== requestStatus)
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
          limit: async () => {
            if (table === fakes.tables.messages) {
              fakes.state.messageReadQueries += 1;
              return messageRows(predicate);
            }
            if (table === fakes.tables.conversations) {
              return conversationRows(predicate);
            }
            return [];
          },
        };
        return query;
      },
    })),
    insert: vi.fn(() => ({
      values: () => ({ returning: async () => [] }),
    })),
    update: vi.fn((table: unknown) => ({
      set: (values: Partial<ConversationRow>) => ({
        where: (predicate: unknown) => ({
          returning: async () => {
            if (table !== fakes.tables.conversations) return [];
            const conversation = pendingConversation(predicate);
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
          if (table !== fakes.tables.conversations) return [];
          const conversation = pendingConversation(predicate);
          if (!conversation) return [];
          fakes.state.conversations = fakes.state.conversations.filter(
            (candidate) => candidate.id !== conversation.id,
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

function seedPending(id: number): ConversationRow {
  const conversation: ConversationRow = {
    id,
    title: "Direct Message",
    participantIds: [REQUESTER, RECIPIENT],
    type: "dm",
    requestStatus: "pending",
    requestedBy: REQUESTER,
    lastMessageAt: "2026-10-19T12:00:00.000Z",
    lastMessagePreview: "Legacy content must not be visible yet.",
  };
  fakes.state.conversations.push(conversation);
  fakes.state.messages.push({
    id: id * 10,
    conversationId: id,
    senderId: REQUESTER,
    content: "Legacy content must not be readable yet.",
    createdAt: "2026-10-19T12:00:00.000Z",
  });
  return conversation;
}

beforeEach(() => {
  fakes.state.conversations = [];
  fakes.state.messages = [];
  fakes.state.blockedPairs.clear();
  fakes.state.messageReadQueries = 0;
});

describe("pending direct-message read guard", () => {
  it("keeps the pending request visible but redacts list preview metadata and denies either participant history before a message query", async () => {
    const server = app();
    seedPending(101);

    const requesterList = await request(server)
      .get("/conversations")
      .set("x-member-id", REQUESTER);
    const recipientList = await request(server)
      .get("/conversations")
      .set("x-member-id", RECIPIENT);
    const outsiderList = await request(server)
      .get("/conversations")
      .set("x-member-id", OUTSIDER);

    for (const response of [requesterList, recipientList]) {
      expect(response.statusCode).toBe(200);
      expect(response.body.conversations).toEqual([
        expect.objectContaining({
          id: 101,
          type: "dm",
          requestStatus: "pending",
          requestedBy: REQUESTER,
          lastMessageAt: null,
          lastMessagePreview: null,
        }),
      ]);
    }
    expect(outsiderList.body.conversations).toEqual([]);

    const requesterHistory = await request(server)
      .get("/conversations/101/messages")
      .set("x-member-id", REQUESTER);
    const recipientHistory = await request(server)
      .get("/conversations/101/messages")
      .set("x-member-id", RECIPIENT);
    const outsiderHistory = await request(server)
      .get("/conversations/101/messages")
      .set("x-member-id", OUTSIDER);

    for (const response of [requesterHistory, recipientHistory]) {
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({ code: "REQUEST_PENDING" });
    }
    expect(outsiderHistory.statusCode).toBe(403);
    expect(fakes.state.messageReadQueries).toBe(0);
  });

  it("restores preview and history only after fresh recipient acceptance", async () => {
    const server = app();
    const pending = seedPending(202);

    const accepted = await request(server)
      .post("/conversations/202/accept")
      .set("x-member-id", RECIPIENT);
    expect(accepted.statusCode).toBe(200);
    expect(accepted.body.conversation).toMatchObject({
      id: 202,
      requestStatus: "accepted",
    });

    for (const memberId of [REQUESTER, RECIPIENT]) {
      const list = await request(server)
        .get("/conversations")
        .set("x-member-id", memberId);
      expect(list.body.conversations).toEqual([
        expect.objectContaining({
          id: 202,
          requestStatus: "accepted",
          lastMessageAt: pending.lastMessageAt,
          lastMessagePreview: pending.lastMessagePreview,
        }),
      ]);

      const history = await request(server)
        .get("/conversations/202/messages")
        .set("x-member-id", memberId);
      expect(history.statusCode).toBe(200);
      expect(history.body.messages).toEqual([
        expect.objectContaining({
          conversationId: 202,
          content: "Legacy content must not be readable yet.",
        }),
      ]);
    }
    expect(fakes.state.messageReadQueries).toBe(2);
  });

  it("keeps a declined pending request absent from fresh participant lists", async () => {
    const server = app();
    seedPending(303);

    const declined = await request(server)
      .post("/conversations/303/decline")
      .set("x-member-id", RECIPIENT);
    expect(declined.statusCode).toBe(200);

    for (const memberId of [REQUESTER, RECIPIENT]) {
      const list = await request(server)
        .get("/conversations")
        .set("x-member-id", memberId);
      expect(list.body.conversations).toEqual([]);
    }
  });
});
