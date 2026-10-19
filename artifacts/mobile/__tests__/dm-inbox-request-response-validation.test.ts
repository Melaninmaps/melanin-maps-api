import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Conversation = {
  id: number;
  requestStatus: "pending" | "accepted" | null;
};

type StateUpdater =
  | Conversation[]
  | ((previous: Conversation[]) => Conversation[]);

const fakes = vi.hoisted(() => {
  const state = {
    conversations: [] as Conversation[],
    useStateCalls: 0,
  };
  const setConversations = vi.fn((updater: StateUpdater) => {
    state.conversations =
      typeof updater === "function" ? updater(state.conversations) : updater;
  });
  return {
    state,
    setConversations,
    fetch: vi.fn(),
    getToken: vi.fn(),
  };
});

vi.mock("expo-secure-store", () => ({
  getItemAsync: fakes.getToken,
}));

vi.mock("react", () => ({
  useCallback: <T>(callback: T): T => callback,
  useEffect: () => undefined,
  useState: (initial: unknown) => {
    const call = fakes.state.useStateCalls++;
    return call === 0
      ? [fakes.state.conversations, fakes.setConversations]
      : [initial, vi.fn()];
  },
}));

import { useConversations } from "../hooks/useConversations";

const CONVERSATION_ID = 71;
const originalDomain = process.env.EXPO_PUBLIC_DOMAIN;

function pendingConversation(): Conversation {
  return { id: CONVERSATION_ID, requestStatus: "pending" };
}

function okJson(payload: unknown): { ok: true; json: () => Promise<unknown> } {
  return { ok: true, json: async () => payload };
}

function unreadableJson(): { ok: true; json: () => Promise<never> } {
  return { ok: true, json: async () => Promise.reject(new Error("unreadable")) };
}

function bindInboxActions() {
  fakes.state.useStateCalls = 0;
  return useConversations();
}

beforeEach(() => {
  fakes.state.conversations = [pendingConversation()];
  fakes.state.useStateCalls = 0;
  fakes.setConversations.mockClear();
  fakes.fetch.mockReset();
  fakes.getToken.mockReset();
  fakes.getToken.mockResolvedValue("test-token");
  vi.stubGlobal("fetch", fakes.fetch);
  process.env.EXPO_PUBLIC_DOMAIN = "offline.example.test";
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalDomain === undefined) delete process.env.EXPO_PUBLIC_DOMAIN;
  else process.env.EXPO_PUBLIC_DOMAIN = originalDomain;
});

describe("mobile inbox pending-request response validation", () => {
  it("keeps the inbox pending for unreadable, missing, mismatched, and wrong-status accept 2xx bodies", async () => {
    const { acceptRequest } = bindInboxActions();
    const invalidBodies = [
      null,
      {},
      { conversation: {} },
      { conversation: { id: CONVERSATION_ID + 1, requestStatus: "accepted" } },
      { conversation: { id: CONVERSATION_ID, requestStatus: "pending" } },
    ];

    for (const body of invalidBodies) {
      fakes.fetch.mockResolvedValueOnce(okJson(body));
      await expect(acceptRequest(CONVERSATION_ID)).resolves.toBe(false);
    }
    fakes.fetch.mockResolvedValueOnce(unreadableJson());
    await expect(acceptRequest(CONVERSATION_ID)).resolves.toBe(false);

    expect(fakes.setConversations).not.toHaveBeenCalled();
    expect(fakes.state.conversations).toEqual([pendingConversation()]);
  });

  it("accepts only the matching accepted conversation body and then performs the existing local transition", async () => {
    const { acceptRequest } = bindInboxActions();
    fakes.fetch.mockResolvedValueOnce(
      okJson({
        conversation: { id: CONVERSATION_ID, requestStatus: "accepted" },
      }),
    );

    await expect(acceptRequest(CONVERSATION_ID)).resolves.toBe(true);
    expect(fakes.setConversations).toHaveBeenCalledTimes(1);
    expect(fakes.state.conversations).toEqual([
      { id: CONVERSATION_ID, requestStatus: "accepted" },
    ]);
  });

  it("keeps the inbox pending for unreadable, missing, false, and non-boolean decline 2xx bodies", async () => {
    const { declineRequest } = bindInboxActions();

    for (const body of [null, {}, { ok: false }, { ok: "true" }]) {
      fakes.fetch.mockResolvedValueOnce(okJson(body));
      await expect(declineRequest(CONVERSATION_ID)).resolves.toBe(false);
    }
    fakes.fetch.mockResolvedValueOnce(unreadableJson());
    await expect(declineRequest(CONVERSATION_ID)).resolves.toBe(false);

    expect(fakes.setConversations).not.toHaveBeenCalled();
    expect(fakes.state.conversations).toEqual([pendingConversation()]);
  });

  it("declines only an explicit ok true body and then performs the existing removal", async () => {
    const { declineRequest } = bindInboxActions();
    fakes.fetch.mockResolvedValueOnce(okJson({ ok: true }));

    await expect(declineRequest(CONVERSATION_ID)).resolves.toBe(true);
    expect(fakes.setConversations).toHaveBeenCalledTimes(1);
    expect(fakes.state.conversations).toEqual([]);
  });
});
