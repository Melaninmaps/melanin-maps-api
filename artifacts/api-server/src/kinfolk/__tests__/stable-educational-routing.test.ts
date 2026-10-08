import { describe, expect, it } from "vitest";
import { routeEvidence } from "../evidence-route";
import {
  resolveKinfolkGeneralAnswerRoute,
  type GenericAnswerRouteDecision,
} from "../general-answer-routing";
import { requiresCurrentResearch } from "../current-research";

const authoritativeSemanticDecision: GenericAnswerRouteDecision = {
  evidenceNeed: "authoritative",
  purpose: "answer",
  conversationIntent: "informational",
  clarificationQuestion: null,
};

describe("stable educational routing", () => {
  it("answers the reported inflation explanation directly with a labeled hypothetical example", () => {
    const message =
      "Explain how inflation affects my grocery budget in plain language and give me an example.";
    const evidence = routeEvidence(message);
    const route = resolveKinfolkGeneralAnswerRoute({
      message,
      evidence,
      semantic: authoritativeSemanticDecision,
    });

    expect(requiresCurrentResearch(message)).toBe(false);
    expect(evidence).toMatchObject({
      domain: "general_knowledge",
      risk: "low",
      retrievalRequirement: "none",
      stableEducationalScope: "full",
    });
    expect(route).toMatchObject({
      strategy: "stable_knowledge",
      requiresCurrentEvidence: false,
    });
  });

  it.each([
    "In plain language, what do a health-insurance deductible, copay, and premium mean? Give a made-up example.",
    "Explain how compound interest works without using today's rates.",
    "Help me understand how a percentage change can affect a household budget, using hypothetical numbers.",
  ])("keeps general conceptual education out of live retrieval: %s", (message) => {
    const evidence = routeEvidence(message);
    const route = resolveKinfolkGeneralAnswerRoute({
      message,
      evidence,
      semantic: authoritativeSemanticDecision,
    });

    expect(requiresCurrentResearch(message)).toBe(false);
    expect(evidence.stableEducationalScope).toBe("full");
    expect(route.strategy).toBe("stable_knowledge");
    expect(route.requiresCurrentEvidence).toBe(false);
  });

  it("retains evidence retrieval for a mixed stable explanation and current metric", () => {
    const message =
      "Explain how inflation affects a grocery budget, then tell me the current U.S. inflation rate.";
    const evidence = routeEvidence(message);
    const route = resolveKinfolkGeneralAnswerRoute({
      message,
      evidence,
      semantic: authoritativeSemanticDecision,
    });

    expect(requiresCurrentResearch(message)).toBe(true);
    expect(evidence).toMatchObject({
      retrievalRequirement: "web_required",
      stableEducationalScope: "partial",
    });
    expect(route).toMatchObject({
      strategy: "current_evidence",
      requiresCurrentEvidence: true,
    });
  });

  it.each([
    "Should I refinance my mortgage now?",
    "Can I afford to change my retirement investments?",
    "What should I know about blood pressure?",
  ])("does not downgrade individualized or high-consequence requests: %s", (message) => {
    const evidence = routeEvidence(message);
    const route = resolveKinfolkGeneralAnswerRoute({
      message,
      evidence,
      semantic: { ...authoritativeSemanticDecision, evidenceNeed: "stable" },
    });

    expect(evidence.stableEducationalScope).toBe("none");
    expect(route.strategy).toBe("current_evidence");
    expect(route.requiresCurrentEvidence).toBe(true);
  });
});
