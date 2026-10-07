import { describe, expect, it } from "vitest";
import { classifyIntent } from "../intent-router";
import {
  immediateMedicalEmergencyReply,
  immediateSafetyEmergencyReply,
  isImmediateMedicalEmergency,
  isImmediateSafetyEmergency,
} from "../emergency-medical-response";

describe("deterministic emergency medical escalation", () => {
  it("identifies chest pain with breathing distress as an immediate emergency", () => {
    const message =
      "I have chest pain and shortness of breath. What should I do?";

    expect(isImmediateMedicalEmergency(message)).toBe(true);
    expect(classifyIntent(message, false)).toBe("safety_emergency");
    expect(immediateMedicalEmergencyReply(message)).toContain(
      "Call your local emergency number now",
    );
  });

  it("does not treat an ordinary chest-pain reference as an immediate emergency", () => {
    const message =
      "What are common questions to ask a clinician about chest pain?";

    expect(isImmediateMedicalEmergency(message)).toBe(false);
    expect(immediateMedicalEmergencyReply(message)).toBeNull();
  });

  it("does not require research, sources, memory, or model output for escalation", () => {
    const reply = immediateMedicalEmergencyReply(
      "My chest feels tight and I am having trouble breathing.",
    );

    expect(reply).toContain("I can’t safely assess or treat this in chat.");
    expect(reply).not.toContain("source");
  });

  it.each([
    "Someone is trying to break into my house. What should I do right now?",
    "I am in danger and someone is following me.",
    "There is a fire and I need to evacuate.",
  ])("returns immediate safety action without provider evidence: %s", (message) => {
    const reply = immediateSafetyEmergencyReply(message);
    expect(isImmediateSafetyEmergency(message)).toBe(true);
    expect(classifyIntent(message, false)).toBe("safety_emergency");
    expect(reply).toMatch(/call your local emergency number now/i);
    expect(reply).toContain("Do not confront anyone");
    expect(reply).not.toMatch(/try again|source|research/i);
  });

  it("does not turn ordinary safety planning into an immediate emergency", () => {
    const message = "How can I make a safety plan before moving to a new apartment?";
    expect(isImmediateSafetyEmergency(message)).toBe(false);
    expect(immediateSafetyEmergencyReply(message)).toBeNull();
  });
});
