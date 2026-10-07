import { describe, expect, it } from "vitest";
import {
  buildKinfolkEvidenceRecoveryReply,
  buildKinfolkPartialEvidenceInstruction,
  resolveKinfolkAlwaysHelpPlan,
} from "../always-help-fallback";

const stable = {
  requestedFact: "stable" as const,
  freshness: "stable" as const,
  evidenceStandard: "none" as const,
  calculationEligible: false,
};
const currentConversion = {
  requestedFact: "currency_conversion" as const,
  freshness: "current" as const,
  evidenceStandard: "single_authoritative_or_reliable" as const,
  calculationEligible: true,
};
const historicalConversion = {
  ...currentConversion,
  freshness: "historical" as const,
};

describe("Kinfolk always-help fallback", () => {
  it("uses the least restrictive truthful path instead of treating every uncertainty as a refusal", () => {
    expect(resolveKinfolkAlwaysHelpPlan({
      temporalPolicy: stable,
      requiresEvidence: false,
      hasSupportingEvidence: false,
      hasRelevantPartialEvidence: false,
      requiresClarification: false,
      protectedBoundary: null,
    }).action).toBe("answer_directly");

    expect(resolveKinfolkAlwaysHelpPlan({
      temporalPolicy: currentConversion,
      requiresEvidence: true,
      hasSupportingEvidence: false,
      hasRelevantPartialEvidence: false,
      requiresClarification: false,
      protectedBoundary: null,
    }).action).toBe("retrieve_time_specific_evidence");

    expect(resolveKinfolkAlwaysHelpPlan({
      temporalPolicy: currentConversion,
      requiresEvidence: true,
      hasSupportingEvidence: false,
      hasRelevantPartialEvidence: true,
      requiresClarification: false,
      protectedBoundary: null,
    }).action).toBe("provide_qualified_partial");
  });

  it("keeps safety, privacy, law, capability, and business-promotion boundaries dominant", () => {
    for (const protectedBoundary of [
      "safety",
      "privacy",
      "legal",
      "capability",
      "business_promotion",
    ] as const) {
      expect(resolveKinfolkAlwaysHelpPlan({
        temporalPolicy: currentConversion,
        requiresEvidence: true,
        hasSupportingEvidence: true,
        hasRelevantPartialEvidence: true,
        requiresClarification: false,
        protectedBoundary,
      }).action).toBe("explain_boundary_and_help_adjacent");
    }
  });

  it("uses one focused clarification only when it is the member's best remaining help path", () => {
    expect(resolveKinfolkAlwaysHelpPlan({
      temporalPolicy: stable,
      requiresEvidence: false,
      hasSupportingEvidence: false,
      hasRelevantPartialEvidence: false,
      requiresClarification: true,
      protectedBoundary: null,
    }).action).toBe("ask_focused_clarification");
  });

  it("uses fact-specific failure language and reserves consensus language for an actual consensus gap", () => {
    expect(buildKinfolkEvidenceRecoveryReply({
      temporalPolicy: currentConversion,
      requestedConsensus: false,
    })).toMatch(/reliable current exchange rate/i);
    expect(buildKinfolkEvidenceRecoveryReply({
      temporalPolicy: historicalConversion,
      requestedConsensus: false,
    })).toMatch(/historical exchange-rate source/i);
    expect(buildKinfolkEvidenceRecoveryReply({
      temporalPolicy: stable,
      requestedConsensus: false,
    })).not.toMatch(/consensus/i);
    expect(buildKinfolkEvidenceRecoveryReply({
      temporalPolicy: stable,
      requestedConsensus: true,
    })).toMatch(/consensus/i);
  });

  it("constrains partial answers to the directly supported portion without inventing a complete claim", () => {
    const instruction = buildKinfolkPartialEvidenceInstruction(currentConversion);
    expect(instruction).toContain("DIRECTLY RELEVANT PARTIAL EVIDENCE");
    expect(instruction).toContain("State only what the linked source directly supports");
    expect(instruction).toContain("Do not calculate, extrapolate, or fill a gap");
  });
});
