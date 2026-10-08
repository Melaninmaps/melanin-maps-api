import { describe, expect, it } from "vitest";
import {
  buildConversationResumePreview,
  isExplicitConversationHandoffRequest,
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
