import { describe, expect, it } from "vitest";
import {
  buildCityBriefingPlan,
  buildCityBriefingPromptBlock,
  isCityBriefingRequest,
} from "../city-briefing";

describe("city briefing policy", () => {
  it("recognizes a current briefing about a resolved city without treating it as a business search", () => {
    expect(isCityBriefingRequest("What should I know about Minneapolis?", "Minneapolis")).toBe(true);
    const plan = buildCityBriefingPlan({
      message: "What should I know about Minneapolis?",
      city: "Minneapolis",
      stateCode: "MN",
    });
    expect(plan).toMatchObject({
      taskMode: "city_briefing",
      primaryDomain: "city_briefing",
      freshness: "current",
      answerPerspective: "mixed",
      evidenceNeeds: ["official_current", "reputable_reporting", "platform_records"],
    });
    expect(plan.retrievalQueries.join(" ")).toMatch(/Minneapolis, MN/i);
    expect(plan.retrievalQueries.join(" ")).toMatch(/local news/i);
    expect(plan.retrievalQueries.join(" ")).toMatch(/public notices/i);
    expect(plan.retrievalQueries.join(" ")).toMatch(/Black community/i);
  });

  it("does not turn an unrelated health question into a city briefing merely because a session has a destination", () => {
    expect(isCityBriefingRequest("What should I know about infertility?", "Minneapolis")).toBe(false);
    expect(isCityBriefingRequest("What should I know about this city?", "Minneapolis")).toBe(true);
  });

  it("uses only saved interests as an optional lens and preserves a factual core", () => {
    const prompt = buildCityBriefingPromptBlock({
      city: "Minneapolis",
      stateCode: "MN",
      preferences: {
        favoriteCategories: ["Museums", "Restaurants"],
        culturalInterests: ["Local history"],
        lifestyleServices: ["Family activities"],
        knowBeforeYouGo: true,
      },
    });
    expect(prompt).toContain("Start with material verified facts");
    expect(prompt).toContain("museums");
    expect(prompt).toContain("family activities");
    expect(prompt).toContain("not assumptions about identity");
    expect(prompt).toContain("Community perspective is not currently source evidence");
    expect(prompt).toContain("current news and reporting");
  });

  it("does not claim a preference lens when no interests were explicitly saved", () => {
    const prompt = buildCityBriefingPromptBlock({ city: "Minneapolis", stateCode: "MN", preferences: null });
    expect(prompt).toContain("No optional interest lens is available");
    expect(prompt).not.toContain("explicitly saved these optional interests:");
  });
});
