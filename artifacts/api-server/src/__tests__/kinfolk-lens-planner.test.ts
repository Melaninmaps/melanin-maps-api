import { describe, it, expect } from "vitest";
import {
  buildSearchPlan,
  buildMemberProfile,
  activeLensDisclosure,
  isUrgentHealthQuery,
  detectLensIntent,
} from "../kinfolk/lens-planner";
import { rankResults } from "../kinfolk/web-ranker";
import { findReviewedResources, findEntityCandidates, ENTITY_INDEX } from "../kinfolk/resource-library";
import type { WebResult } from "../kinfolk/web-search";

const blackWomanProfile = buildMemberProfile({
  userId: "test-user-1",
  diasporaCountries: ["Black woman", "African American women", "African diaspora"],
});

describe("buildMemberProfile", () => {
  it("maps diasporaCountries to an active lens", () => {
    const profile = buildMemberProfile({
      userId: "u1",
      diasporaCountries: ["Black woman"],
    });
    expect(profile.active).toBe(true);
    expect(profile.lenses[0].label).toBe("Black woman");
    expect(profile.activeLensIds).toContain(profile.lenses[0].id);
  });

  it("returns inactive profile when no diaspora or background set", () => {
    const profile = buildMemberProfile({ userId: "u2" });
    expect(profile.active).toBe(false);
    expect(profile.lenses.length).toBe(0);
  });
});

describe("buildSearchPlan — blood pressure query", () => {
  it("builds community-primary tracks before the evidence track", () => {
    const plan = buildSearchPlan("blood pressure", blackWomanProfile, ENTITY_INDEX);
    expect(plan.intent).toBe("health");
    expect(plan.queries[0].role).toBe("community_primary");
    expect(plan.queries[0].text).toMatch(/Black woman|Black women|African American women/i);
    expect(plan.queries.at(-1)?.role).toBe("evidence");
  });

  it("sets urgentHealthFlag=false for a plain blood pressure query", () => {
    const plan = buildSearchPlan("blood pressure", blackWomanProfile, ENTITY_INDEX);
    expect(plan.urgentHealthFlag).toBe(false);
  });
});

describe("buildSearchPlan — eczema image query", () => {
  it("creates a profile-first image route for eczema pictures", () => {
    const plan = buildSearchPlan("eczema show me pictures", blackWomanProfile, ENTITY_INDEX);
    expect(plan.intent).toBe("health");
    expect(plan.imageRequested).toBe(true);
    expect(plan.queries[0].role).toBe("image");
    expect(plan.queries[0].text).toMatch(/skin of color/i);
  });
});

describe("buildSearchPlan — Michelle Williams", () => {
  it("defaults to Destiny's Child candidate and preserves Dawson's Creek", () => {
    const plan = buildSearchPlan("Michelle Williams", blackWomanProfile, ENTITY_INDEX);
    expect(plan.intent).toBe("entity");
    expect(plan.queries[0].text).toMatch(/Destiny's Child/i);
    expect(plan.queries.some((q) => /Dawson's Creek/i.test(q.text))).toBe(true);
  });

  it("never merges the two candidates (each has its own query)", () => {
    const plan = buildSearchPlan("Michelle Williams", blackWomanProfile, ENTITY_INDEX);
    const destinyQ = plan.queries.find((q) => /Destiny's Child/i.test(q.text));
    const dawsonQ = plan.queries.find((q) => /Dawson's Creek/i.test(q.text));
    expect(destinyQ).toBeDefined();
    expect(dawsonQ).toBeDefined();
    expect(destinyQ!.text).not.toEqual(dawsonQ!.text);
  });
});

describe("isUrgentHealthQuery", () => {
  it("flags pregnancy + danger language", () => {
    expect(isUrgentHealthQuery("I'm pregnant and have severe headache")).toBe(true);
    expect(isUrgentHealthQuery("postpartum vision changes")).toBe(true);
  });

  it("does not flag plain health queries", () => {
    expect(isUrgentHealthQuery("blood pressure management")).toBe(false);
    expect(isUrgentHealthQuery("eczema in dark skin")).toBe(false);
  });
});

describe("activeLensDisclosure", () => {
  it("returns a disclosure string when lenses are active", () => {
    const disclosure = activeLensDisclosure(blackWomanProfile);
    expect(disclosure).toMatch(/Kinfolk lens/i);
    expect(disclosure.length).toBeGreaterThan(0);
  });

  it("returns empty string when no lenses active", () => {
    const inactiveProfile = buildMemberProfile({ userId: "u3" });
    expect(activeLensDisclosure(inactiveProfile)).toBe("");
  });
});

describe("rankResults", () => {
  it("puts a community-primary CDC result above an equally-scored generic source", () => {
    const results: WebResult[] = [
      {
        title: "Generic high blood pressure guidance",
        url: "https://www.cdc.gov/high-blood-pressure/general",
        content: "Official health guidance",
        providerScore: 0.9,
        sourceQuery: { text: "blood pressure official health guidance", role: "evidence", reason: "evidence" },
      },
      {
        title: "High blood pressure resources for Black women",
        url: "https://www.cdc.gov/high-blood-pressure/black-women",
        content: "Community context for Black women",
        providerScore: 0.9,
        sourceQuery: {
          text: "high blood pressure Black women trusted resources",
          role: "community_primary",
          reason: "lens",
        },
      },
    ];

    const ranked = rankResults(results, blackWomanProfile, blackWomanProfile.lenses);
    expect(ranked[0].title).toBe("High blood pressure resources for Black women");
    expect(ranked[0].communityScore).toBeGreaterThan(ranked[1].communityScore);
  });

  it("blocks results from blocked domains", () => {
    const profileWithBlock = { ...blackWomanProfile, blockedDomains: ["blocked.example.com"] };
    const results: WebResult[] = [
      {
        title: "Blocked result",
        url: "https://blocked.example.com/article",
        content: "blocked content",
        providerScore: 0.9,
        sourceQuery: { text: "test", role: "general", reason: "test" },
      },
    ];
    expect(rankResults(results, profileWithBlock, [])).toHaveLength(0);
  });
});

describe("findReviewedResources", () => {
  it("returns eczema gallery for an eczema image query", () => {
    const cards = findReviewedResources("eczema show me pictures", "image", ["Black woman"]);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].type).toBe("image_gallery");
    expect(cards[0].id).toBe("eczema-skin-of-color-gallery");
  });

  it("returns CDC pregnancy resource for preeclampsia query", () => {
    const cards = findReviewedResources("preeclampsia blood pressure", "health", ["Black woman"]);
    const hasCdc = cards.some((c) => c.id === "cdc-pregnancy-hypertension");
    expect(hasCdc).toBe(true);
  });

  it("prioritizes representation-matched cards", () => {
    const cardsWithLens = findReviewedResources("blood pressure", "health", ["Black adults"]);
    const cardsNoLens = findReviewedResources("blood pressure", "health", []);
    // Both should return results; the lens-matched version may reorder
    expect(cardsWithLens.length).toBeGreaterThanOrEqual(cardsNoLens.length);
  });
});

describe("findEntityCandidates", () => {
  it("ranks Destiny's Child first for a Black-woman lens", () => {
    const candidates = findEntityCandidates("michelle williams", ["Black woman"]);
    expect(candidates).toBeDefined();
    expect(candidates![0].disambiguator).toMatch(/Destiny's Child/i);
  });

  it("returns undefined for an unknown entity", () => {
    expect(findEntityCandidates("john doe unknown person 12345", [])).toBeUndefined();
  });
});

describe("detectLensIntent", () => {
  it("classifies health queries correctly", () => {
    expect(detectLensIntent("my blood pressure is high", ENTITY_INDEX)).toBe("health");
    expect(detectLensIntent("eczema on dark skin", ENTITY_INDEX)).toBe("health");
  });

  it("classifies entity queries correctly", () => {
    expect(detectLensIntent("michelle williams", ENTITY_INDEX)).toBe("entity");
  });

  it("classifies image queries correctly when no health terms present", () => {
    expect(detectLensIntent("show me pictures of natural hair styles", ENTITY_INDEX)).toBe("image");
  });

  it("defaults to general for unclassified queries", () => {
    expect(detectLensIntent("what time is it in Lagos", ENTITY_INDEX)).toBe("general");
  });
});
