import { describe, expect, it } from "vitest";
import {
  isExplicitProfileMemoryRelevant,
  parseExplicitMemberMemory,
} from "../explicit-member-memory";
import { buildPlanningDiscoveryFollowUp } from "../consented-planning-context";

describe("explicit member memory", () => {
  it("saves only an unambiguous direct remember statement", () => {
    expect(parseExplicitMemberMemory("Remember my name is Tiana, but call me T-Money.")).toMatchObject({
      content: "my name is Tiana, but call me T-Money.",
      purpose: "profile_context",
      isSensitive: false,
    });
    expect(parseExplicitMemberMemory("Remember where we ate last Tuesday?")).toBeNull();
    expect(parseExplicitMemberMemory("What do you remember about me?")).toBeNull();
  });

  it("classifies funds, hours, and family needs as planning context", () => {
    expect(parseExplicitMemberMemory("Please remember funds are tight this month.")).toMatchObject({
      purpose: "planning_context",
      isSensitive: true,
    });
    expect(parseExplicitMemberMemory("Kinfolk, remember my hours are 12 PM to 8 PM Eastern and I have children.")).toMatchObject({
      purpose: "planning_context",
      isSensitive: true,
    });
  });

  it("uses a chosen name broadly but limits other profile context to a matching turn", () => {
    const nickname = parseExplicitMemberMemory("Remember I prefer to be called T-Money.");
    expect(nickname).not.toBeNull();
    expect(isExplicitProfileMemoryRelevant(nickname!, "Find a spa in New York.")).toBe(true);

    const workTravel = parseExplicitMemberMemory("Remember I am a Black woman who travels often for work.");
    expect(workTravel).not.toBeNull();
    expect(isExplicitProfileMemoryRelevant(workTravel!, "What do I need to know in Minneapolis?")).toBe(true);
    expect(isExplicitProfileMemoryRelevant(workTravel!, "Explain photosynthesis.")).toBe(false);
  });

  it("adds only a bounded decision-aware prompt to deterministic directory results", () => {
    expect(buildPlanningDiscoveryFollowUp([
      { content: "My work hours are 12 PM to 8 PM and I have children.", purpose: "planning_context", isSensitive: true },
    ], "Find daycare in Philadelphia.")).toContain("later pickup");

    expect(buildPlanningDiscoveryFollowUp([
      { content: "Funds are tight this month.", purpose: "planning_context", isSensitive: true },
    ], "Find a restaurant in Minneapolis.")).toContain("lower-cost or closer");
  });
});
