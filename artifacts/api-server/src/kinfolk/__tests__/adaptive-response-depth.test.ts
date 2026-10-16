import { describe, expect, it } from "vitest";
import {
  buildAdaptiveAnswerDepthPrompt,
  resolveKinfolkOutputTokenBudget,
  resolveKinfolkResponseDepth,
} from "../adaptive-response-depth";

const ordinaryTurn = {
  intentClass: "general_knowledge",
  requiresCurrentEvidence: false,
  isTravelPlanning: false,
  hasLocation: false,
  hasContextualResearch: false,
};

describe("adaptive Kinfolk answer depth", () => {
  it("keeps simple fact questions concise", () => {
    expect(resolveKinfolkResponseDepth({ ...ordinaryTurn, message: "What is 2 + 2?" })).toBe("concise");
  });

  it("allocates detailed answers to complex planning and explanation turns", () => {
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "Explain the best NYC hotel areas for a family weekend and compare the tradeoffs.",
    })).toBe("detailed");
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "What does this policy change mean for gas prices?",
      requiresCurrentEvidence: true,
    })).toBe("detailed");
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "Find a dinner plan near Harlem.",
      hasLocation: true,
    })).toBe("detailed");
  });

  it("keeps an explicit Brief preference compact before generation without weakening consequential depth", () => {
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "Briefly explain why the sun is hot and how it stays hot.",
      responseLength: "brief",
    })).toBe("standard");
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "Briefly explain the legal tradeoffs in this contract.",
      intentClass: "legal",
      responseLength: "brief",
    })).toBe("detailed");
  });

  it("makes Balanced and Detailed preferences meaningful without weakening direct or consequential answers", () => {
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "What is photosynthesis?",
      responseLength: "adaptive",
    })).toBe("concise");
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "What is photosynthesis?",
      responseLength: "balanced",
    })).toBe("standard");
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "What is photosynthesis?",
      responseLength: "detailed",
    })).toBe("standard");
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "Explain photosynthesis in detail, including its two stages.",
      responseLength: "detailed",
    })).toBe("detailed");
    expect(resolveKinfolkResponseDepth({
      ...ordinaryTurn,
      message: "What is photosynthesis?",
      intentClass: "health",
      responseLength: "brief",
    })).toBe("detailed");
  });

  it("uses a larger bounded token budget only when a detailed answer is warranted", () => {
    const standard = { mode: "standard" as const, maxOutputTokens: 600 };
    const staff = { mode: "staff_demo" as const, maxOutputTokens: 900 };
    expect(resolveKinfolkOutputTokenBudget(standard, "concise")).toBe(600);
    expect(resolveKinfolkOutputTokenBudget(standard, "standard")).toBe(750);
    expect(resolveKinfolkOutputTokenBudget(standard, "detailed")).toBe(1200);
    expect(resolveKinfolkOutputTokenBudget(staff, "detailed")).toBe(1800);
  });

  it("requires the model to return the complete answer without narrating hidden work", () => {
    const prompt = buildAdaptiveAnswerDepthPrompt("detailed");
    expect(prompt).toContain("self-contained, complete answer");
    expect(prompt).toContain("selected Kinfolk persona remains the authority on conversational form");
    expect(prompt).toContain("not a mandatory checklist, framework, or long advice article");
    expect(prompt).toContain("Do not narrate hidden work");
    expect(prompt).toContain("Return the useful answer in this turn");
  });
});
