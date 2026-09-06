import { describe, expect, it } from "vitest";
import { rankGovernedBusinessesForMember } from "../business-personalization";
import { deriveBusinessSubject } from "../business-subject";
import {
  businessDiscoveryClarification,
  temporaryBusinessAudienceBand,
} from "../business-discovery-clarification";
import type { GovernedKinfolkBusiness } from "../governedBusinessRepository";

function business(
  id: string,
  name: string,
  category: string,
  subcategory: string,
  tags: string[],
): GovernedKinfolkBusiness {
  return {
    id,
    name,
    category,
    subcategory,
    description: "Founder-curated unclaimed public listing.",
    city: "Philadelphia",
    stateCode: "PA",
    country: "USA",
    latitude: 39.95,
    longitude: -75.16,
    distanceMiles: null,
    phone: null,
    website: `https://example.test/${id}`,
    verified: false,
    blackOwned: false,
    tags,
    profileStatus: "community_listed",
    story: null,
    missionStatement: null,
    whyStarted: null,
    whatCustomersShouldKnow: null,
    ownershipBadges: [],
    communityValues: [],
    audiencesServed: [],
    vibes: [],
    accessibilityFeatures: [],
    communityInitiatives: [],
    growthGoals: [],
    audienceType: null,
    environmentTags: [],
    amenityTags: [],
  };
}

const PHILADELPHIA_ACTIVITIES = [
  business("loomen", "Loomen Labs", "Arts, Culture & Entertainment", "Attractions", [
    "Guided custom perfume experiences", "Custom eco-friendly candle-making experiences",
  ]),
  business("amina", "Amina", "Food & Drink", "Restaurants", [
    "Southern-inspired dishes", "West African-inspired dishes", "Brunch and dinner",
  ]),
  business("bobbies", "Uncle Bobbie's Coffee & Books", "Food & Drink", "Cafés & Coffee", [
    "Independent bookstore", "Coffee and espresso bar", "Author events and workshops",
  ]),
  {
    ...business("queen", "Queen & Rook Game Cafe", "Arts, Culture & Entertainment", "Gaming & Recreation", [
      "Board-game play", "Retro video-game arcade", "Food and full bar",
    ]),
    audiencesServed: ["all ages"],
  },
  business("night", "Adults Only Night Club", "Arts, Culture & Entertainment", "Nightlife", [
    "Adult nightlife", "Cocktails", "21+",
  ]),
];

describe("Kinfolk business personalization", () => {
  it.each([
    ["P21", "18_39", ["hands-on candle-making experiences"], "Loomen Labs"],
    ["P44", "40_64", ["Southern and West African inspired dining"], "Amina"],
    ["P65", "65_plus", ["independent bookstores and author events"], "Uncle Bobbie's Coffee & Books"],
    ["P14", "13_17", ["video games and board games"], "Queen & Rook Game Cafe"],
  ])("ranks a different explainable top result for %s", (_profile, ageBand, preferenceTerms, expected) => {
    const ranked = rankGovernedBusinessesForMember(PHILADELPHIA_ACTIVITIES, {
      ageBand,
      preferenceTerms,
      currentRequest: "Find things to do in Philadelphia",
    });
    expect(ranked[0]?.name).toBe(expected);
    expect(ranked[0]?.matchReasons.length).toBeGreaterThan(0);
  });

  it("blocks adult-only nightlife for minors but retains a mixed-age venue with explicit child evidence", () => {
    const ranked = rankGovernedBusinessesForMember(PHILADELPHIA_ACTIVITIES, {
      ageBand: "13_17",
      preferenceTerms: ["video games"],
    });
    expect(ranked.some((entry) => entry.name === "Adults Only Night Club")).toBe(false);
    expect(ranked.some((entry) => entry.name === "Queen & Rook Game Cafe")).toBe(true);
  });

  it("never lets a positive family word override an explicit adult-only or 21+ restriction", () => {
    const misleading = business("blocked", "Family-Owned Adults Only Club", "Entertainment", "Nightclub", [
      "family-owned", "adults only", "21+",
    ]);
    expect(rankGovernedBusinessesForMember([misleading], { ageBand: "13_17" })).toEqual([]);
  });

  it("holds bars, taverns, lounges, and social clubs from minor results without explicit youth evidence", () => {
    const adultLeaning = [
      business("bar", "L&I Bar", "Food & Drink", "Bar", []),
      business("tavern", "Point Breeze Tavern", "Food & Drink", "Restaurant", []),
      business("lounge", "Night Lounge", "Entertainment", "Live Music", []),
      business("club", "Broad Street Social Club", "Entertainment", "Events", []),
    ];
    expect(rankGovernedBusinessesForMember(adultLeaning, { ageBand: "13_17" })).toEqual([]);
  });

  it("accepts only structured audience evidence—not family-owned or student-night wording—as a minor exception", () => {
    const incidental = business("incidental", "Family-Owned Student Night Bar", "Food & Drink", "Bar", [
      "family-owned", "student night",
    ]);
    const structured = {
      ...business("structured", "Community Lounge", "Entertainment", "Lounge", []),
      audiencesServed: ["all ages"],
    };
    expect(rankGovernedBusinessesForMember([incidental], { ageBand: "13_17" })).toEqual([]);
    expect(rankGovernedBusinessesForMember([structured], { ageBand: "13_17" }).map((entry) => entry.name)).toEqual([
      "Community Lounge",
    ]);
  });

  it.each([
    ["HVAC in Phoenix", "hvac"],
    ["Find natural hair in Philadelphia", "locs"],
    ["auto repair in Philadelphia", "auto_repair"],
    ["Find a therapist in DC", "therapist"],
    ["things to do in Philadelphia", "activity"],
    ["game cafe in Philadelphia", "gaming"],
    ["fragrance experience in Philadelphia", "fragrance"],
    ["Southern and West African inspired food in Philadelphia", "restaurant"],
    ["art gallery near me", "gallery"],
    ["bakery in Atlanta", "dessert"],
  ])("classifies %s as %s", (query, expected) => {
    expect(deriveBusinessSubject(query)?.key).toBe(expected);
  });

  it("does not turn a general therapy definition into a provider search", () => {
    expect(deriveBusinessSubject("What is therapy?")).toBeNull();
    expect(deriveBusinessSubject("What can help hair loss in Philadelphia?")).toBeNull();
  });

  it("asks a skippable service-type question for a broad hair search", () => {
    const steps = businessDiscoveryClarification({
      message: "Find hair in Philadelphia",
      subjectKey: "salon",
      ageBand: "40_64",
      city: "Philadelphia",
    });
    expect(steps).toHaveLength(1);
    expect(steps[0]?.question).toContain("What kind of hair service");
    expect(steps[0]?.options.map((option) => option.label)).toContain("Loc and natural-hair care in Philadelphia");
    expect(deriveBusinessSubject("For my last question — Loc and natural-hair care in Philadelphia")?.key).toBe("locs");
    expect(steps[0]?.skippable).toBe(true);
    expect(steps[0]?.persistence).toBe("temporary");
  });

  it("asks for an age group only when an activity audience is unknown", () => {
    expect(businessDiscoveryClarification({
      message: "Find things to do in Philadelphia",
      subjectKey: "activity",
      ageBand: "unknown",
    })[0]?.options.map((option) => option.label)).toContain("Things to do for teens");
    expect(businessDiscoveryClarification({
      message: "Find things to do for teens in Philadelphia",
      subjectKey: "activity",
      ageBand: temporaryBusinessAudienceBand("for teens") ?? "unknown",
    })).toEqual([]);
  });

  it("resolves every broad hair option and Skip without repeating the same probe", () => {
    const continuations = [
      "Find hair in Philadelphia — Loc and natural-hair care in Philadelphia",
      "Find hair in Philadelphia — Braids or protective styles in Philadelphia",
      "Find hair in Philadelphia — Hair color or wash and style in Philadelphia",
      "Find hair in Philadelphia — General hair salon in Philadelphia",
      "Find hair in Philadelphia — keep this search broad",
    ];
    for (const message of continuations) {
      const subject = deriveBusinessSubject(message);
      expect(subject).not.toBeNull();
      expect(businessDiscoveryClarification({ message, subjectKey: subject!.key, ageBand: "40_64", city: "Philadelphia" })).toEqual([]);
    }
  });

  it("resolves every activity audience option and Skip without repeating the same probe", () => {
    for (const phrase of ["adults", "teens", "kids", "mixed ages", "keep this search broad"]) {
      const message = `Find things to do in Philadelphia — Things to do for ${phrase} in Philadelphia`;
      const temporaryAgeBand = temporaryBusinessAudienceBand(message) ?? "unknown";
      expect(temporaryAgeBand).not.toBe("unknown");
      expect(businessDiscoveryClarification({ message, subjectKey: "activity", ageBand: temporaryAgeBand, city: "Philadelphia" })).toEqual([]);
    }
  });
});
