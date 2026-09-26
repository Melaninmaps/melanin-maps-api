import { describe, expect, it } from "vitest";
import {
  isExplicitMemberMemoryCapabilityQuestion,
  isExplicitProfileMemoryRelevant,
  parseExplicitMemberMemory,
  profileDiscoveryContextTerms,
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

  it("recognizes the full typed or transcribed memory phrasing", () => {
    expect(parseExplicitMemberMemory("This is what I want you to remember about me: I am a Hispanic woman.")).toMatchObject({
      content: "I am a Hispanic woman.",
      purpose: "profile_context",
      isSensitive: true,
    });
    expect(parseExplicitMemberMemory("I want you to remember about me: I have children and my budget is tight.")).toMatchObject({
      purpose: "planning_context",
      isSensitive: true,
    });
  });

  it("answers memory capability questions without sending them to the model", () => {
    expect(isExplicitMemberMemoryCapabilityQuestion("Can Kinfolk remember my personal preferences?")).toBe(true);
    expect(isExplicitMemberMemoryCapabilityQuestion("Can you store personal information?")).toBe(true);
    expect(isExplicitMemberMemoryCapabilityQuestion("What restaurants are open?")).toBe(false);
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

  it("marks approved sensitive categories as requiring a separate save choice", () => {
    expect(parseExplicitMemberMemory("Remember I live at 123 Main Street.")).toMatchObject({ isSensitive: true });
    expect(parseExplicitMemberMemory("Remember I am Muslim.")).toMatchObject({ isSensitive: true });
    expect(parseExplicitMemberMemory("Remember I am bisexual.")).toMatchObject({ isSensitive: true });
    expect(parseExplicitMemberMemory("Remember my son needs daycare.")).toMatchObject({ isSensitive: true });
  });

  it("uses a chosen name broadly but limits other profile context to a matching turn", () => {
    const nickname = parseExplicitMemberMemory("Remember I prefer to be called T-Money.");
    expect(nickname).not.toBeNull();
    expect(isExplicitProfileMemoryRelevant(nickname!, "Find a spa in New York.")).toBe(true);

    const workTravel = parseExplicitMemberMemory("Remember I am a Black woman who travels often for work.");
    expect(workTravel).not.toBeNull();
    expect(isExplicitProfileMemoryRelevant(workTravel!, "What do I need to know in Minneapolis?")).toBe(true);
    expect(isExplicitProfileMemoryRelevant(workTravel!, "Explain photosynthesis.")).toBe(false);

    const healthProfile = parseExplicitMemberMemory("This is what I want you to remember about me: I am a Hispanic woman.");
    expect(healthProfile).not.toBeNull();
    expect(isExplicitProfileMemoryRelevant(healthProfile!, "Find a doctor in Philadelphia.")).toBe(true);
    expect(profileDiscoveryContextTerms(healthProfile!)).toEqual(expect.arrayContaining(["Hispanic", "Latina", "Woman"]));
    expect(isExplicitProfileMemoryRelevant(healthProfile!, "Explain photosynthesis.")).toBe(false);

    const militaryInterest = parseExplicitMemberMemory("Kinfolk, this is what I want you to remember about me: I follow military activity and deployments.");
    expect(militaryInterest).not.toBeNull();
    expect(isExplicitProfileMemoryRelevant(militaryInterest!, "What is happening with the war in Iran?")).toBe(true);
    expect(isExplicitProfileMemoryRelevant(militaryInterest!, "Explain photosynthesis.")).toBe(false);
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
