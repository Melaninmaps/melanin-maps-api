import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Kinfolk emotional support route contract", () => {
  const route = source("../../routes/kinfolk.ts");
  const generalRouting = source("../general-answer-routing.ts");

  it("adds current-turn emotional framing after semantic routing without a memory write", () => {
    expect(route).toContain('import { resolveEmotionalSupportGuidance } from "../kinfolk/emotional-support";');
    expect(route).toContain("const emotionalSupportGuidance = resolveEmotionalSupportGuidance({");
    expect(route).toContain("message,");
    expect(route).toContain("semanticIntent: genericAnswerDecision?.conversationIntent");
    expect(route).toContain("buildKinfolkConversationalIntentPrompt(");
    expect(route).toContain("emotionalSupportGuidance,");
    expect(route).toContain("It neither reads nor writes memory");
  });

  it("places the bounded support contract after deterministic emergency controls and mode isolation", () => {
    const emergencyMedical = route.indexOf("immediateMedicalEmergencyReply(message)");
    const emergencySafety = route.indexOf("immediateSafetyEmergencyReply(message)");
    const emotionalGuidance = route.indexOf("const emotionalSupportGuidance = resolveEmotionalSupportGuidance({");

    expect(emergencyMedical).toBeGreaterThan(-1);
    expect(emergencySafety).toBeGreaterThan(emergencyMedical);
    expect(emotionalGuidance).toBeGreaterThan(emergencySafety);
    expect(generalRouting).toContain("buildEmotionalSupportResponseContract");
    expect(generalRouting).toContain("emotionalSupportGuidance: EmotionalSupportGuidance | null = null");
    expect(generalRouting).toContain("if (emotionalSupportContract) return emotionalSupportContract;");
    expect(generalRouting).toContain("Do not diagnose");
    expect(generalRouting).toContain("indirect, and transcript-like descriptions of emotion");
  });
});
