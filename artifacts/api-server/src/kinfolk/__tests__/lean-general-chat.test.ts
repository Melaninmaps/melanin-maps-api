import { describe, expect, it } from "vitest";
import {
  buildLeanGeneralChatPrompt,
  buildLeanGeneralHistory,
  canUseLeanGeneralChat,
} from "../lean-general-chat";
import { buildKinfolkFormalResponseContract } from "../conversation-mode";

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
    expect(canUseLeanGeneralChat({ ...ordinaryQuestion, hasImageCreationSafetyGuidance: true })).toBe(false);
  });

  it("preserves Kinfolk's specific product identity without fabricated local results", () => {
    const prompt = buildLeanGeneralChatPrompt();
    expect(prompt).toContain("Mapping With Melanin's conversation companion");
    expect(prompt).toContain("not a generic chatbot");
    expect(prompt).toContain("KIN FOLK'S DISTINCT ROLE");
    expect(prompt).toContain("connected plan");
    expect(prompt).toContain("right fit, not simply any result");
    expect(prompt).toContain("WHEN THE MEMBER ASKS HOW KINFOLK IS DIFFERENT");
    expect(prompt).toContain("find the right fit, not simply any result");
    expect(prompt).toContain("one concrete example, such as planning a move or finding a birthday spot");
    expect(prompt).toContain("community input, ownership designations, and verification are kept distinct");
    expect(prompt).toContain("Do not claim that an unsupplied local result, community report, or current signal exists");
    expect(prompt).toContain("Do not answer with generic claims about being warm, capable, friendly, relatable");
    expect(prompt).toContain("Big Cousin mode");
    expect(prompt).toContain("Do not invent facts, sources, business listings, addresses");
    expect(prompt).toContain("complete answer at the depth the question needs");
    expect(prompt).toContain("must never alter the factual answer or override a direct request");
    expect(prompt).toContain("distinguish consensus, criticism, popularity, and your synthesis from objective fact");
    expect(prompt).toContain('"recommendations": null');
    expect(prompt).toContain('"followUpSuggestions": []');
    expect(prompt).toContain("Do not infer the member's identity");
  });

  it("honors each selected conversation mode without identity imitation", () => {
    expect(buildLeanGeneralChatPrompt("professor")).toContain("Professor mode");
    expect(buildLeanGeneralChatPrompt("business_manager")).toContain("Business Manager mode");
    expect(buildLeanGeneralChatPrompt("best_friend")).toContain("Best Friend mode");
    expect(buildLeanGeneralChatPrompt("professional")).toContain("Big Cousin mode");
  });

  it("keeps the solar-science core factual across all four conversational voices", () => {
    for (const mode of ["community", "best_friend", "professor", "business_manager"]) {
      const prompt = buildLeanGeneralChatPrompt(mode);
      expect(prompt).toContain("hydrogen fusion in the sun's core releases energy");
      expect(prompt).toContain("gravity compresses the core");
      expect(prompt).toContain("light and heat");
      expect(prompt).toContain("roughly five billion years");
    }
    expect(buildLeanGeneralChatPrompt("business_manager")).toContain("never promotional or sales-oriented");
  });

  it("keeps emotional check-ins supportive and free of discovery output", () => {
    for (const mode of ["community", "best_friend", "professor", "business_manager"]) {
      const prompt = buildLeanGeneralChatPrompt(mode);
      expect(prompt).toContain("EMOTIONAL CHECK-INS");
      expect(prompt).toContain("Do not turn a check-in into a business recommendation");
      expect(prompt).toContain("Ask at most one gentle follow-up question");
    }
  });

  it("reserves clean document formatting for formal or official requests", () => {
    const contract = buildKinfolkFormalResponseContract();
    expect(contract).toContain("email, letter, request, complaint, appeal, proposal, policy, plan, report");
    expect(contract).toContain("selected Kinfolk voice");
    expect(contract).toContain("numbered list only for an ordered sequence");
    expect(contract).toContain("single-level hyphen list only when a list is necessary");
    expect(contract).toContain("Do not use decorative stars, asterisks");
    expect(contract).toContain("do not force formal-document formatting");
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
