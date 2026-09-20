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
    expect(prompt).toContain("Do not narrate hidden work");
    expect(prompt).toContain("Return the useful answer in this turn");
  });
});
