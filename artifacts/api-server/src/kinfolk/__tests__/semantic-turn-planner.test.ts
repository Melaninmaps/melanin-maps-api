import { describe, expect, it, vi } from "vitest";
import { routeEvidence } from "../evidence-route";
import { planSemanticTurn } from "../semantic-turn-planner";

describe("semantic turn planner", () => {
  it.each([
    ["How do I cook beef?", "recipe_options"],
    ["How do I make pot roast?", "recipe_instructions"],
    ["Give me a pot roast recipe", "recipe_instructions"],
    ["Jay-Z", "entity_explorer"],
  ] as const)("deterministically plans %s without a model call", async (message, taskMode) => {
    const classify = vi.fn();
    await expect(planSemanticTurn({ message, evidenceRoute: routeEvidence(message), classify }))
      .resolves.toMatchObject({ taskMode, needsClarification: false, identityContextUsed: [] });
    expect(classify).not.toHaveBeenCalled();
  });

  it("does not permit ambiguous classifier output to claim certainty", async () => {
    const classify = vi.fn().mockResolvedValue({
      confidence: .4,
      candidateMeanings: [
        { label: "1990s music conflict", domain: "culture", confidence: .4 },
        { label: "2010s music conflict", domain: "culture", confidence: .35 },
        { label: "recent music conflict", domain: "culture", confidence: .3 },
      ],
      clarificationQuestion: "Which conflict or era do you mean?",
    });
    const plan = await planSemanticTurn({
      message: "Who won the beef?",
      evidenceRoute: routeEvidence("Who won the beef?"),
      history: Array.from({ length: 20 }, (_, index) => ({ role: "user" as const, content: `turn ${index}` })),
      classify,
    });
    expect(plan.needsClarification).toBe(true);
    expect(plan.candidateMeanings).toHaveLength(3);
    expect(plan.clarificationQuestion).toMatch(/which/i);
    expect(plan.identityContextUsed).toEqual([]);
    expect(classify).toHaveBeenCalledTimes(1);
    expect(classify.mock.calls[0][0].history).toHaveLength(12);
  });

  it("keeps deterministic medical routing dominant and does not infer age", async () => {
    const classify = vi.fn();
    const plan = await planSemanticTurn({
      message: "What should normal blood pressure be for my age?",
      evidenceRoute: routeEvidence("What should normal blood pressure be for my age?"),
      classify,
    });
    expect(plan).toMatchObject({
      taskMode: "high_consequence",
      primaryDomain: "medical_health",
      evidenceNeeds: ["official_current"],
      identityContextUsed: [],
    });
    expect(classify).not.toHaveBeenCalled();
  });

  it("lets the current cooking turn override an unrelated prior cultural turn", async () => {
    const plan = await planSemanticTurn({
      message: "Give me a pot roast recipe",
      evidenceRoute: routeEvidence("Give me a pot roast recipe"),
      history: [
        { role: "user", content: "Who won the beef?" },
        { role: "assistant", content: "Which conflict do you mean?" },
      ],
      classify: vi.fn(),
    });
    expect(plan).toMatchObject({ taskMode: "recipe_instructions", primaryDomain: "hobby_lifestyle" });
  });

  it.each([
    "How do I make friends?",
    "How do I make a complaint?",
    "How do I make an appointment?",
  ])("does not misroute ordinary uses of make as cooking: %s", async (message) => {
    const plan = await planSemanticTurn({ message, evidenceRoute: routeEvidence(message) });
    expect(plan.taskMode).not.toMatch(/^recipe_/);
  });

  it("selects cultural consensus for a named cultural conflict", async () => {
    const message = "Who won the Kendrick and Drake beef?";
    await expect(planSemanticTurn({ message, evidenceRoute: routeEvidence(message) })).resolves.toMatchObject({
      taskMode: "cultural_consensus",
      evidenceNeeds: ["primary_cultural", "critical_consensus"],
    });
  });

  it("keeps a beef stew versus pot roast comparison in recipe mode", async () => {
    const message = "How do I cook beef stew vs. pot roast?";
    await expect(planSemanticTurn({ message, evidenceRoute: routeEvidence(message) })).resolves.toMatchObject({
      taskMode: "recipe_options",
    });
  });

  it("routes a named Kendrick versus Drake beef to cultural consensus", async () => {
    const message = "Kendrick vs Drake beef";
    await expect(planSemanticTurn({ message, evidenceRoute: routeEvidence(message) })).resolves.toMatchObject({
      taskMode: "cultural_consensus",
    });
  });

  it("selects travel planning and current platform evidence for an itinerary request", async () => {
    const message = "Plan a three day trip to Philadelphia";
    await expect(planSemanticTurn({ message, evidenceRoute: routeEvidence(message) })).resolves.toMatchObject({
      taskMode: "travel_plan",
      evidenceNeeds: ["official_current", "platform_records"],
    });
  });

  it("requires both approved Library and primary evidence for a named public entity", async () => {
    await expect(planSemanticTurn({ message: "Jay-Z", evidenceRoute: routeEvidence("Jay-Z") })).resolves.toMatchObject({
      taskMode: "entity_explorer",
      evidenceNeeds: ["approved_internal", "primary_cultural"],
    });
  });
});
