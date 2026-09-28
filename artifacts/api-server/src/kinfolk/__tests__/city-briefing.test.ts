import { describe, expect, it } from "vitest";
import {
  buildCityBriefingPlan,
  buildCityBriefingPromptBlock,
  deriveCityBriefingPurpose,
  isCityBriefingRequest,
  isStableCityBriefingBackgroundRequest,
} from "../city-briefing";
import {
  DOCUMENTED_PROXIMITY_CAVEAT,
  requiresDocumentedProximityCaveat,
} from "../business-proximity";

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

  it("recognizes a work-travel briefing as a researched city question, not a restaurant itinerary", () => {
    expect(
      isCityBriefingRequest(
        "I am heading to Minneapolis for work. What should I know as a Black woman?",
        "Minneapolis",
      ),
    ).toBe(true);
  });

  it("recognizes a future resident's city-life question in any resolved city", () => {
    expect(
      isCityBriefingRequest(
        "What will I see in Milwaukee before I move there?",
        "Milwaukee",
      ),
    ).toBe(true);
  });

  it("keeps visiting and moving briefings distinct", () => {
    expect(deriveCityBriefingPurpose("I am visiting Minneapolis for a week.")).toBe("visiting");
    expect(deriveCityBriefingPurpose("I am planning to move to Minneapolis.")).toBe("moving");

    const visitPlan = buildCityBriefingPlan({
      message: "What should I know before I visit Minneapolis?",
      city: "Minneapolis",
      stateCode: "MN",
    });
    const movePlan = buildCityBriefingPlan({
      message: "What will I see in Milwaukee before I move there?",
      city: "Milwaukee",
      stateCode: "WI",
    });
    expect(visitPlan.retrievalQueries.join(" ")).toMatch(/visitor travel arrival/i);
    expect(movePlan.retrievalQueries.join(" ")).toMatch(/resident services housing tenant/i);

    expect(buildCityBriefingPromptBlock({
      city: "Minneapolis",
      stateCode: "MN",
      preferences: null,
      purpose: "visiting",
    })).toContain("immediate arrival needs");
    expect(buildCityBriefingPromptBlock({
      city: "Milwaukee",
      stateCode: "WI",
      preferences: null,
      purpose: "moving",
    })).toContain("longer-term city-life questions");
  });

  it("keeps a whole-arrival question source-backed even when weather and transit are included", () => {
    expect(
      isCityBriefingRequest(
        "What current safety, transit, weather, and practical information should I verify before I travel to Minneapolis?",
        "Minneapolis",
      ),
    ).toBe(true);
    const plan = buildCityBriefingPlan({
      message: "What current safety, transit, weather, and practical information should I verify before I travel to Minneapolis?",
      city: "Minneapolis",
      stateCode: "MN",
    });
    expect(plan.retrievalQueries.join(" ")).toMatch(/federal immigration enforcement/i);
  });

  it("turns the fail-closed stable-background action into a stable city briefing, not a literal search", () => {
    expect(isStableCityBriefingBackgroundRequest("Show me the stable background")).toBe(true);
    expect(isCityBriefingRequest("Show me the stable background", "Minneapolis")).toBe(true);

    const plan = buildCityBriefingPlan({
      message: "Show me the stable background",
      city: "Minneapolis",
      stateCode: "MN",
    });
    expect(plan).toMatchObject({
      taskMode: "city_briefing",
      freshness: "stable",
      evidenceNeeds: ["reputable_reporting"],
    });
    expect(plan.retrievalQueries.join(" ")).toMatch(/official city overview/i);

    const prompt = buildCityBriefingPromptBlock({
      city: "Minneapolis",
      stateCode: "MN",
      preferences: null,
      mode: "stable",
    });
    expect(prompt).toContain("stable factual background, not a current-status update");
    expect(prompt).toContain("current alerts, hours, transit conditions, and events need a fresh check");
  });

  it("does not present city-only business matches as an exact hotel or route search", () => {
    expect(
      requiresDocumentedProximityCaveat(
        "Find a Black-owned lunch spot near the Royal Sonesta Minneapolis Downtown",
      ),
    ).toBe(true);
    expect(requiresDocumentedProximityCaveat("Find Black-owned lunch in Minneapolis")).toBe(false);
    expect(DOCUMENTED_PROXIMITY_CAVEAT).toContain("verified distance");
    expect(DOCUMENTED_PROXIMITY_CAVEAT).toContain("map pin");
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
    expect(prompt).toContain("supplied current sources support that specific claim");
    expect(prompt).toContain("member’s actual current plan support it");
    expect(prompt).toContain("hotel, itinerary, route, planned stop, or travel date is known");
    expect(prompt).toContain("Black, African, Afro-Latin, or broader diaspora context");
    expect(prompt).toContain("federal immigration-enforcement or public-service response");
    expect(prompt).toContain("Do not infer a contributor's nationality");
  });

  it("does not claim a preference lens when no interests were explicitly saved", () => {
    const prompt = buildCityBriefingPromptBlock({ city: "Minneapolis", stateCode: "MN", preferences: null });
    expect(prompt).toContain("No optional interest lens is available");
    expect(prompt).not.toContain("explicitly saved these optional interests:");
  });

  it("does not permit unsupported reassurance, itinerary impact, or event claims", () => {
    const prompt = buildCityBriefingPromptBlock({
      city: "Minneapolis",
      stateCode: "MN",
      preferences: null,
    });
    expect(prompt).toContain("Never say a member is clear, safe, unaffected");
    expect(prompt).toContain("When a plan or date is needed to assess an alert or an event");
    expect(prompt).toContain("use only source-supported cultural events, businesses, and community information");
  });
});
