import { describe, expect, it } from "vitest";
import {
  buildLeanGeneralChatPrompt,
  buildLeanGeneralHistory,
  canUseLeanGeneralChat,
} from "../lean-general-chat";

const ordinaryQuestion = {
  intentClass: "general_knowledge",
  requiresCurrentEvidence: false,
  hasLocation: false,
  hasImages: false,
  hasContextualResearch: false,
  hasNamedBusiness: false,
  isTravelPlanning: false,
  hasCircleContext: false,
  hasResolvedEntity: false,
  hasLibraryGrounding: false,
  hasRequestedVibes: false,
};

describe("lean general Kinfolk chat", () => {
  it("uses the low-latency path only for ordinary stable questions", () => {
    expect(canUseLeanGeneralChat(ordinaryQuestion)).toBe(true);
    expect(canUseLeanGeneralChat({ ...ordinaryQuestion, requiresCurrentEvidence: true })).toBe(false);
    expect(canUseLeanGeneralChat({ ...ordinaryQuestion, hasLocation: true })).toBe(false);
    expect(canUseLeanGeneralChat({ ...ordinaryQuestion, hasImages: true })).toBe(false);
    expect(canUseLeanGeneralChat({ ...ordinaryQuestion, hasNamedBusiness: true })).toBe(false);
    expect(canUseLeanGeneralChat({ ...ordinaryQuestion, hasResolvedEntity: true })).toBe(false);
    expect(canUseLeanGeneralChat({ ...ordinaryQuestion, hasLibraryGrounding: true })).toBe(false);
  });

  it("requires a minimal safe JSON envelope without fabricated local results", () => {
    const prompt = buildLeanGeneralChatPrompt();
    expect(prompt).toContain("modern chatbot");
    expect(prompt).toContain("Do not invent facts, sources, business listings, addresses");
    expect(prompt).toContain('"recommendations": null');
    expect(prompt).toContain('"followUpSuggestions": []');
    expect(prompt).toContain("Do not infer the member's identity");
  });

  it("keeps only recent bounded conversation history", () => {
    const history = Array.from({ length: 6 }, (_, index) => ({
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: String(index).repeat(700),
    }));
    const result = buildLeanGeneralHistory(history);
    expect(result).toHaveLength(4);
    expect(result[0]?.content).toHaveLength(500);
    expect(result[0]?.content.startsWith("2")).toBe(true);
  });
});
