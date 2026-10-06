import { describe, expect, it } from "vitest";
import { classifyIntent } from "../intent-router";
import {
  immediateMedicalEmergencyReply,
  isImmediateMedicalEmergency,
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
});
