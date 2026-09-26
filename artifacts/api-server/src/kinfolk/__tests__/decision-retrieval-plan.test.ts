import { describe, expect, it } from "vitest";
import { buildKinfolkDecisionRetrievalPlan } from "../decision-retrieval-plan";
import { routeEvidence } from "../evidence-route";
import { getLifeIntentGuidance } from "../life-intent-guidance";
import { classifyKinfolkRequest } from "../request-classifier";

function plan(message: string, city: string | null = null) {
  return buildKinfolkDecisionRetrievalPlan({
    message,
    request: classifyKinfolkRequest(message, city),
    evidence: routeEvidence(message),
    lifeGuidance: getLifeIntentGuidance(message),
  });
}

describe("Kinfolk decision and retrieval plan", () => {
  it("routes the reported promotion-policy question to a conversational plan without cards", () => {
    const result = plan(
      "I need your help. You are built to promote minority-owned businesses based on preferences. How would a user find places other people frequent when there is little Black or minority-owned nightlife in Philadelphia? What would be your suggested method?",
      "Philadelphia",
    );

    expect(result).toMatchObject({
      kind: "platform_policy",
      answerMode: "policy_plus_action_plan",
      retrieval: "none",
      allowBusinessCards: false,
      requireEvidence: false,
    });
  });

  it("keeps a direct named service request eligible for governed discovery", () => {
    const result = plan("Find Black-owned vegan restaurants in Philadelphia", "Philadelphia");
    expect(result).toMatchObject({
      kind: "direct_discovery",
      answerMode: "governed_discovery",
      retrieval: "governed_business_catalog",
      allowBusinessCards: true,
    });
  });

  it("routes current finance and high-consequence health questions to existing evidence paths", () => {
    expect(plan("What is today's USD to EUR exchange rate?")).toMatchObject({
      kind: "current_or_high_consequence",
      retrieval: "existing_current_research",
      allowBusinessCards: false,
      requireEvidence: true,
    });
    expect(plan("I found a breast lump. What should I do in Philadelphia?", "Philadelphia")).toMatchObject({
      kind: "current_or_high_consequence",
      allowBusinessCards: false,
      requireEvidence: true,
    });
  });

  it("routes drafting and revision requests as general assistant work", () => {
    expect(plan("Help me draft an email to my boss")).toMatchObject({
      kind: "general_assistant",
      answerMode: "draft_or_revision",
      retrieval: "none",
      allowBusinessCards: false,
    });
    expect(plan("Can you make that email more formal?")).toMatchObject({
      kind: "general_assistant",
      answerMode: "draft_or_revision",
      retrieval: "none",
      allowBusinessCards: false,
    });
  });
});
