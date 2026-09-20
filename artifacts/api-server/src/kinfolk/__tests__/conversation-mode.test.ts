import { describe, expect, it } from "vitest";
import {
  buildKinfolkConversationModeInstruction,
  buildKinfolkConversationModePrompt,
  normalizeKinfolkConversationMode,
} from "../conversation-mode";

describe("Kinfolk conversation modes", () => {
  it.each([
    ["community", "Big Cousin"],
    ["professor", "Professor"],
    ["business_manager", "Business Manager"],
    ["best_friend", "Best Friend"],
  ] as const)("normalizes and instructs %s", (value, label) => {
    expect(normalizeKinfolkConversationMode(value)).toBe(value);
    expect(buildKinfolkConversationModePrompt(value)).toContain(label);
    expect(buildKinfolkConversationModeInstruction(value)).not.toMatch(/imitate an identity|accent|dialect/i);
  });

  it("safely maps legacy or invalid values to Big Cousin", () => {
    expect(normalizeKinfolkConversationMode("neighborhood_guide")).toBe("community");
    expect(normalizeKinfolkConversationMode("professional")).toBe("community");
    expect(normalizeKinfolkConversationMode(undefined)).toBe("community");
  });
});
