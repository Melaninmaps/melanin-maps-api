import { describe, expect, it } from "vitest";
import { buildKinfolkCurrentTurnCorrectionInstruction } from "../current-turn-correction";

const history = [
  { role: "user" as const, content: "Draft an email to my manager about tomorrow's meeting." },
  { role: "assistant" as const, content: "Hi, I wanted to ask whether we can move tomorrow's meeting." },
];

describe("Kinfolk current-turn correction contract", () => {
  it("treats a formal-email revision as authoritative in the current conversation", () => {
    const instruction = buildKinfolkCurrentTurnCorrectionInstruction({
      message: "Can you make it more formal and direct?",
      history,
    });

    expect(instruction).toContain("CURRENT-CONVERSATION REVISION");
    expect(instruction).toContain("more formal and direct");
    expect(instruction).toContain("Hi, I wanted to ask");
    expect(instruction).toContain("Return the revised answer or draft directly");
  });

  it("handles a plain-language correction without making it a permanent memory", () => {
    const instruction = buildKinfolkCurrentTurnCorrectionInstruction({
      message: "That is not what I meant. Make it lighter.",
      history,
    });

    expect(instruction).toContain("Follow the current instruction before the earlier answer");
    expect(instruction).toContain("Do not store this as a future preference");
  });

  it.each([
    "Rewrite this text message to be lighter and warmer.",
    "Help me say that to my wife more gently.",
    "That missed the point. Make the email shorter and less formal.",
  ])("treats a drafting or conversation-coaching revision as current-turn guidance: %s", (message) => {
    const instruction = buildKinfolkCurrentTurnCorrectionInstruction({
      message,
      history,
    });

    expect(instruction).toContain("CURRENT-CONVERSATION REVISION");
    expect(instruction).toContain("Return the revised answer or draft directly");
  });

  it("does not classify an unrelated new request as a revision", () => {
    expect(buildKinfolkCurrentTurnCorrectionInstruction({
      message: "Where am I going tonight?",
      history,
    })).toBe("");
  });

  it("does not revise without an existing assistant response", () => {
    expect(buildKinfolkCurrentTurnCorrectionInstruction({
      message: "Please make it more formal.",
      history: [{ role: "user", content: "Draft an email." }],
    })).toBe("");
  });
});
