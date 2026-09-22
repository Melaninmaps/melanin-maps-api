import { describe, expect, it } from "vitest";
import {
  buildConsentedPlanningContextPrompt,
  isConsentedPlanningMemoryRelevant,
} from "../consented-planning-context";

describe("Kinfolk consented planning context", () => {
  const reducedHours = {
    content: "My work hours were reduced and I need to watch my spending.",
    purpose: "planning_context",
    isSensitive: true,
  };

  it("uses an explicitly saved financial planning note for a directly related family outing", () => {
    expect(isConsentedPlanningMemoryRelevant(reducedHours, "What can I do with my kids this weekend?")).toBe(true);
    expect(isConsentedPlanningMemoryRelevant(reducedHours, "How could higher gas prices affect me?")).toBe(true);
  });

  it("does not use planning context without direct relevance or explicit planning consent", () => {
    expect(isConsentedPlanningMemoryRelevant(reducedHours, "Who won the rap battle?")).toBe(false);
    expect(isConsentedPlanningMemoryRelevant({ ...reducedHours, purpose: "ongoing_context" }, "What can I do with my kids this weekend?")).toBe(false);
  });

  it("keeps planning guidance bounded, evidence-aware, and non-judgmental", () => {
    const block = buildConsentedPlanningContextPrompt([reducedHours]);
    expect(block).toContain("MEMBER-APPROVED PLANNING CONTEXT");
    expect(block).toContain("do not decide what the member can afford");
    expect(block).toContain("supplied current source evidence");
    expect(block).not.toContain(reducedHours.content);
  });
});
