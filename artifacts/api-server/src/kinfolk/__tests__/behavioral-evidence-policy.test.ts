import { describe, expect, it } from "vitest";
import {
  BEHAVIORAL_EVIDENCE_DISCLOSURE,
  buildBehavioralEvidencePrompt,
  isDirectlyRelevantBehavioralEvidence,
  parseBehavioralFeedbackSignal,
  resolveBehavioralEvidenceMode,
  statusForRecordedSignal,
} from "../behavioral-evidence-policy";

describe("Kinfolk reviewable behavioral evidence policy", () => {
  it("accepts only fixed broad non-sensitive feedback categories", () => {
    for (const intentClass of [
      "business_discovery",
      "culture_entertainment",
      "travel_planning",
      "education_discovery",
      "hobby_lifestyle",
    ]) {
      expect(
        parseBehavioralFeedbackSignal({ reaction: "helpful", intentClass }),
      ).toEqual({
        signalKey: intentClass,
        stance: "helpful",
        provenance: "response_feedback_v1",
      });
    }

    for (const intentClass of [
      "medical_health",
      "legal_regulated",
      "financial_regulated",
      "safety_emergency",
      "current_information",
      "general_knowledge",
      "identity",
      "",
      null,
      { intent: "business_discovery" },
    ]) {
      expect(
        parseBehavioralFeedbackSignal({ reaction: "helpful", intentClass }),
      ).toBeNull();
    }
  });

  it("reads no free text or personal facts from a feedback request", () => {
    const untrusted = {
      reaction: "not_helpful",
      intentClass: "business_discovery",
      note: "private content must never be retained",
      message: "private question",
      sessionId: "private-session",
      messageId: "private-message",
      location: "private-location",
      businessName: "private-business",
      evidenceKey: "medical_health",
    };
    expect(parseBehavioralFeedbackSignal(untrusted)).toEqual({
      signalKey: "business_discovery",
      stance: "not_helpful",
      provenance: "response_feedback_v1",
    });
  });

  it("defaults to off and makes review candidates inactive until explicit approval", () => {
    expect(resolveBehavioralEvidenceMode(undefined)).toBe("off");
    expect(resolveBehavioralEvidenceMode("unexpected")).toBe("off");
    expect(resolveBehavioralEvidenceMode("review")).toBe("review");
    expect(statusForRecordedSignal("off")).toBeNull();
    expect(statusForRecordedSignal("review")).toBe("pending");
    expect(statusForRecordedSignal("review", "active")).toBe("active");
    expect(statusForRecordedSignal("on")).toBe("active");
  });

  it("uses active evidence only for exactly matching broad current intent", () => {
    const evidence = {
      signalKey: "travel_planning" as const,
      stance: "helpful" as const,
      count: 2,
      status: "active" as const,
    };
    expect(isDirectlyRelevantBehavioralEvidence("travel_planning", evidence)).toBe(true);
    expect(isDirectlyRelevantBehavioralEvidence("business_discovery", evidence)).toBe(false);
    expect(isDirectlyRelevantBehavioralEvidence("medical_health", evidence)).toBe(false);
    expect(
      buildBehavioralEvidencePrompt("business_discovery", [evidence]),
    ).toBe("");
  });

  it("builds a bounded server-only prompt that forbids fact inference and downstream use", () => {
    const prompt = buildBehavioralEvidencePrompt("travel_planning", [
      {
        signalKey: "travel_planning",
        stance: "not_helpful",
        count: 1,
        status: "active",
      },
    ]);
    expect(prompt).toContain("reviewable Kinfolk interaction pattern");
    expect(prompt).toContain("not a fact about the member");
    expect(prompt).toContain("Do not mention this pattern");
    expect(prompt).toContain("Directory, Map, Community, Library, ranking, eligibility");
    expect(prompt).not.toContain("private content must never be retained");
    expect(BEHAVIORAL_EVIDENCE_DISCLOSURE).toContain("not a saved memory, preference, or Current Chapter");
  });
});
