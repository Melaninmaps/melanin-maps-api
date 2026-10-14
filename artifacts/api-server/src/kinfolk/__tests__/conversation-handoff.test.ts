import { describe, expect, it } from "vitest";
import {
  buildConversationResumePreview,
  isExplicitConversationHandoffRequest,
  resolveExplicitCrossSessionHandoff,
  resolveConversationContextScope,
} from "../conversation-handoff";

const message = (role: "user" | "assistant", content: string, extra: Record<string, unknown> = {}) => ({
  id: `${role}-${content.slice(0, 12)}`,
  role,
  content,
  timestamp: new Date().toISOString(),
  ...extra,
});

describe("Kinfolk conversation handoffs", () => {
  it("marks a clear return-later request without creating a private-memory payload", () => {
    const scoped = resolveConversationContextScope({
      messages: [message("user", "Help me outline a community workshop.")],
      currentMessage: "Let's pick this up tomorrow.",
    });

    expect(isExplicitConversationHandoffRequest("Let's pick this up tomorrow.")).toBe(true);
    expect(isExplicitConversationHandoffRequest("I will return later to keep planning the outreach.")).toBe(true);
    expect(isExplicitConversationHandoffRequest("I'll come back later to finish this discussion.")).toBe(true);
    expect(isExplicitConversationHandoffRequest("I will return a library book later.")).toBe(false);
    expect(scoped.handoffRequested).toBe(true);
    expect(scoped.handoff).toMatchObject({ state: "saved" });
    expect(scoped.handoff?.summary).toContain("No separate memory was created");
    expect(scoped.messages).toEqual([]);
  });

  it("restores only the recent marked thread after an explicit resume", () => {
    const messages = [
      message("user", "I want to plan a simple neighborhood workshop."),
      message("assistant", "Start by choosing one outcome and a short agenda."),
      message("user", "Let's pick this up tomorrow."),
      message("assistant", "Absolutely.", {
        conversationHandoff: { kind: "return_later", requestedAt: "2026-10-08T00:00:00.000Z" },
      }),
    ];

    const preview = buildConversationResumePreview(messages as never);
    const scoped = resolveConversationContextScope({
      messages: messages as never,
      currentMessage: "Let's pick this up.",
    });

    expect(preview).toMatchObject({ state: "resumed" });
    expect(preview?.summary).toContain("neighborhood workshop");
    expect(scoped.handoff).toEqual(preview);
    expect(scoped.messages).toHaveLength(4);
  });

  it("allows an explicit new-session resume to use only the latest marked owner thread", () => {
    const olderMarkedMessages = [
      message("user", "Help me prepare a workshop agenda."),
      message("assistant", "Start with a clear outcome."),
      message("user", "I'll come back later to finish this discussion."),
      message("assistant", "Absolutely.", {
        conversationHandoff: { kind: "return_later", requestedAt: "2026-10-08T00:00:00.000Z" },
      }),
    ];
    const latestMarkedMessages = [
      message("user", "Help me plan a neighborhood clean-up."),
      message("assistant", "Choose a date and a small volunteer team."),
      message("user", "I'll come back later to finish this discussion."),
      message("assistant", "Absolutely.", {
        conversationHandoff: { kind: "return_later", requestedAt: "2026-10-08T01:00:00.000Z" },
      }),
    ];

    const crossSession = resolveExplicitCrossSessionHandoff({
      sessions: [
        { id: "latest-owner-session", messages: latestMarkedMessages as never },
        { id: "older-owner-session", messages: olderMarkedMessages as never },
      ],
      currentMessage: "Let's continue.",
    });

    expect(crossSession?.sourceSessionId).toBe("latest-owner-session");
    expect(crossSession?.scope.handoff?.summary).toContain("neighborhood clean-up");
    expect(crossSession?.scope.messages).toHaveLength(4);
  });

  it("does not select a cross-session thread without an explicit resume", () => {
    const markedMessages = [
      message("user", "Help me plan a workshop."),
      message("user", "Let's pick this up tomorrow."),
      message("assistant", "Absolutely.", {
        conversationHandoff: { kind: "return_later", requestedAt: "2026-10-08T00:00:00.000Z" },
      }),
    ];

    expect(resolveExplicitCrossSessionHandoff({
      sessions: [{ id: "owner-session", messages: markedMessages as never }],
      currentMessage: "How do I make lentil soup?",
    })).toBeNull();
  });

  it("does not reuse an old thread for an unrelated new question", () => {
    const messages = [
      message("user", "I need help planning a workshop."),
      message("assistant", "Let's make a three-step plan."),
      message("user", "Let's pick this up tomorrow."),
      message("assistant", "Absolutely.", {
        conversationHandoff: { kind: "return_later", requestedAt: "2026-10-08T00:00:00.000Z" },
      }),
    ];

    const scoped = resolveConversationContextScope({
      messages: messages as never,
      currentMessage: "How do I make lentil soup?",
    });

    expect(scoped.messages).toEqual([]);
    expect(scoped.handoff).toBeNull();
  });

  it("keeps a bounded same-session comparison thread for a semantic follow-up", () => {
    const messages = [
      message("user", "Help me evaluate two job offers."),
      message("assistant", "Let us compare the risk, compensation, and growth trade-offs."),
    ];

    const scoped = resolveConversationContextScope({
      messages: messages as never,
      currentMessage: "Which option is less risky if hiring freezes?",
    });

    expect(scoped.messages).toEqual(messages);
    expect(scoped.handoff).toBeNull();
  });

  it("does not treat a new same-session topic as a continuation without a reference", () => {
    const messages = [
      message("user", "Help me evaluate two job offers."),
      message("assistant", "Let us compare the risk and growth trade-offs."),
    ];

    const scoped = resolveConversationContextScope({
      messages: messages as never,
      currentMessage: "How do I make lentil soup?",
    });

    expect(scoped.messages).toEqual([]);
  });

  it("returns only the original writing pair when a later turn explicitly goes back to a draft", () => {
    const draft = message("user", "Draft an email to my boss about a schedule change.");
    const draftReply = message("assistant", "Subject: Schedule change\n\nFirst paragraph.\n\nSecond paragraph.\n\nThird paragraph.");
    const lunch = message("user", "Where should I get lunch?");
    const lunchReply = message("assistant", "Try a nearby lunch spot.");
    const health = message("user", "What is a general health question I should ask my doctor?");
    const healthReply = message("assistant", "A general health answer.");
    const scoped = resolveConversationContextScope({
      messages: [draft, draftReply, lunch, lunchReply, health, healthReply] as never,
      currentMessage: "Go back to that email and make the third paragraph shorter.",
    });
    expect(scoped.messages).toEqual([draft, draftReply]);
    expect(scoped.messages.map((item) => item.content).join(" ")).not.toContain("lunch");
    expect(scoped.messages.map((item) => item.content).join(" ")).not.toContain("health");
  });

  it("returns one explicitly named non-sensitive subject without importing intervening topics", () => {
    const recipe = message("user", "Share a lentil soup recipe for tonight.");
    const recipeReply = message("assistant", "Start with lentils, onion, and stock.");
    const city = message("user", "What should I see in Atlanta?");
    const cityReply = message("assistant", "A city answer.");
    const scoped = resolveConversationContextScope({
      messages: [recipe, recipeReply, city, cityReply] as never,
      currentMessage: "Go back to that recipe and make it vegetarian.",
    });

    expect(scoped.messages).toEqual([recipe, recipeReply]);
    expect(scoped.messages.map((item) => item.content).join(" ")).not.toContain("Atlanta");
    expect(scoped.requiresReferenceClarification).toBe(false);
  });

  it("keeps an immediate non-sensitive revision attached to its preceding answer", () => {
    const draft = message("user", "Draft an email to my manager.");
    const draftReply = message("assistant", "Here is a concise email draft.");
    const scoped = resolveConversationContextScope({
      messages: [draft, draftReply] as never,
      currentMessage: "Make it more formal.",
    });

    expect(scoped.messages).toEqual([draft, draftReply]);
  });

  it("asks for one clarification instead of guessing when a return reference has no unique safe subject", () => {
    const scoped = resolveConversationContextScope({
      messages: [
        message("user", "Share a vegetarian recipe."),
        message("assistant", "Recipe one."),
        message("user", "Share another recipe."),
        message("assistant", "Recipe two."),
      ] as never,
      currentMessage: "Go back to that recipe and make it vegetarian.",
    });

    expect(scoped.messages).toEqual([]);
    expect(scoped.requiresReferenceClarification).toBe(true);
  });

  it("does not echo sensitive address or health content in a handoff preview", () => {
    const messages = [
      message("user", "My home address is 10 Example Street and I need help after my diagnosis."),
      message("user", "Let's pick this up tomorrow."),
      message("assistant", "Absolutely.", {
        conversationHandoff: { kind: "return_later", requestedAt: "2026-10-08T00:00:00.000Z" },
      }),
    ];

    const preview = buildConversationResumePreview(messages as never);
    expect(preview?.summary).toContain("a private topic you asked to continue");
    expect(preview?.summary).not.toContain("Example Street");
    expect(preview?.summary).not.toContain("diagnosis");
  });
});
