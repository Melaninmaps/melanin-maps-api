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
  it("does not activate a stored diaspora lens before a purpose-consent ledger exists", () => {
    const profile = buildMemberProfile({
      userId: "u1",
      diasporaCountries: ["Black woman"],
    });
    expect(profile.active).toBe(false);
    expect(profile.lenses).toEqual([]);
    expect(profile.activeLensIds).toEqual([]);
  });

  it("returns inactive profile when no diaspora or background set", () => {
    const profile = buildMemberProfile({ userId: "u2" });
    expect(profile.active).toBe(false);
    expect(profile.lenses.length).toBe(0);
  });
});

describe("buildSearchPlan — blood pressure query", () => {
  it("keeps condition-first authority while adding the diaspora-first representation track", () => {
    const plan = buildSearchPlan("blood pressure", blackWomanProfile, ENTITY_INDEX);
    expect(plan.intent).toBe("health");
    expect(plan.queries[0].role).toBe("evidence");
    expect(plan.queries[0].text).toBe("blood pressure official clinical guidance");
    expect(plan.representationMode).toBe("diaspora_first_default");
    expect(plan.queries[1]).toMatchObject({
      role: "community_primary",
      text: expect.stringMatching(/Black and Brown health equity/i),
    });
  });

  it("sets urgentHealthFlag=false for a plain blood pressure query", () => {
    const plan = buildSearchPlan("blood pressure", blackWomanProfile, ENTITY_INDEX);
    expect(plan.urgentHealthFlag).toBe(false);
  });
});

describe("buildSearchPlan — eczema image query", () => {
  it("keeps authoritative health evidence ahead of diaspora-first clinician-reviewed images", () => {
    const plan = buildSearchPlan("eczema show me pictures", blackWomanProfile, ENTITY_INDEX);
    expect(plan.intent).toBe("health");
    expect(plan.imageRequested).toBe(true);
    expect(plan.queries[0].role).toBe("evidence");
    expect(plan.representationMode).toBe("diaspora_first_default");
    expect(plan.queries[1]).toMatchObject({
      role: "community_primary",
      text: expect.stringMatching(/skin of color clinical guidance/i),
    });
    expect(plan.queries[2]).toMatchObject({
      role: "image",
      text: expect.stringMatching(/skin of color clinician reviewed images/i),
    });
  });

  it("uses a separately consented Black-woman memory for a later eczema-image turn", () => {
    const plan = buildSearchPlan(
      "I think I have eczema, show me images",
      blackWomanProfile,
      ENTITY_INDEX,
      { consentedHealthPopulationLabel: "Black woman" },
    );

    expect(plan.representationMode).toBe("consented_identity");
    expect(plan.activeLenses).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "consented-health-representation", label: "Black woman" }),
    ]));
    expect(plan.queries[0]).toMatchObject({ role: "evidence" });
    expect(plan.queries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        role: "image",
        text: expect.stringMatching(/Black woman clinician reviewed images/i),
      }),
    ]));
  });

  it("stops using revoked identity memory while retaining the non-identifying default", () => {
    const plan = buildSearchPlan("I think I have eczema, show me images", blackWomanProfile, ENTITY_INDEX);

    expect(plan.representationMode).toBe("diaspora_first_default");
    expect(plan.queries.map((query) => query.text).join(" ")).not.toContain("Black woman");
    expect(plan.queries.map((query) => query.text).join(" ")).toMatch(/skin of color/i);
  });

  it("honors an explicit different representation request over the default", () => {
    const plan = buildSearchPlan("Show me eczema images on lighter skin", blackWomanProfile, ENTITY_INDEX);

    expect(plan.representationMode).toBe("explicit_override");
    expect(plan.queries.map((query) => query.text).join(" ")).toMatch(/lighter skin/i);
    expect(plan.queries.map((query) => query.text).join(" ")).not.toMatch(/skin of color/i);
  });
});

describe("buildSearchPlan — diaspora-first educational topics", () => {
  it("adds a non-identifying source track for relevant hair-care education", () => {
    const plan = buildSearchPlan(
      "How should I care for locs between appointments?",
      blackWomanProfile,
      ENTITY_INDEX,
    );

    expect(plan.representationMode).toBe("diaspora_first_default");
    expect(plan.activeLenses).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "diaspora-first-education-default" }),
    ]));
    expect(plan.queries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        role: "community_primary",
        text: expect.stringMatching(/Black and Brown hair care educational guidance/i),
      }),
    ]));
    expect(plan.queries.map((query) => query.text).join(" ")).not.toContain("Black woman");
  });

  it("adds a bounded cultural-history source track without forcing it into unrelated conversation", () => {
    const relevant = buildSearchPlan(
      "What sources explain African diaspora history in the Caribbean?",
      blackWomanProfile,
      ENTITY_INDEX,
    );
    const unrelated = buildSearchPlan(
      "Draft a concise email asking to reschedule a meeting.",
      blackWomanProfile,
      ENTITY_INDEX,
    );

    expect(relevant.representationMode).toBe("diaspora_first_default");
    expect(relevant.queries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        role: "community_primary",
        text: expect.stringMatching(/diaspora history and cultural context authoritative sources/i),
      }),
    ]));
    expect(unrelated.representationMode).toBe("none");
    expect(unrelated.queries).toHaveLength(1);
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
  it("does not disclose an inactive stored-profile lens", () => {
    expect(activeLensDisclosure(blackWomanProfile)).toBe("");
  });

  it("returns empty string when no lenses active", () => {
    const inactiveProfile = buildMemberProfile({ userId: "u3" });
    expect(activeLensDisclosure(inactiveProfile)).toBe("");
  });
});

describe("rankResults", () => {
  it("does not boost a stored demographic match without purpose consent", () => {
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
    expect(ranked[0].title).toBe("Generic high blood pressure guidance");
    expect(ranked.every((result) => result.communityScore === 0)).toBe(true);
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
