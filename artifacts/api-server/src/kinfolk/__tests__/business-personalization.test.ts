import { describe, expect, it } from "vitest";
import { audienceAllowsBusinessText, rankGovernedBusinessesForMember } from "../business-personalization";
import { deriveBusinessSubject } from "../business-subject";
import {
  businessDiscoveryClarification,
  effectiveBusinessAudienceBand,
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
    claimed: false,
    blackOwned: false,
    tags,
    specialties: [],
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
    matchReasons: [],
    identityReasons: [],
  };
}

const PHILADELPHIA_ACTIVITIES = [
  business("loomen", "Loomen Labs", "Arts, Culture & Entertainment", "Attractions", [
    "Guided custom perfume experiences", "Custom eco-friendly candle-making experiences",
  ]),
  business("amina", "Amina", "Food & Drink", "Restaurants", [
    "American Southern cuisine", "African-inspired culinary creations", "Fun dining experience",
  ]),
  business("bobbies", "Uncle Bobbie's Coffee & Books", "Food & Drink", "Cafés & Coffee", [
    "Independent bookstore", "Coffee and espresso bar", "Author events and workshops",
  ]),
  {
    ...business("queen", "Queen & Rook Game Cafe", "Arts, Culture & Entertainment", "Gaming & Recreation", [
      "Board-game play", "Retro video-game arcade", "Food and full bar",
    ]),
    // Official Queen & Rook youth-program evidence: programs serve ages 6–16,
    // including a Teen Camp for ages 13–16. The adult bar signal is therefore
    // allowed only because structured youth evidence exists alongside it.
    audiencesServed: ["youth ages 6-16", "teen programs ages 13-16"],
    website: "https://www.queenandrookcafe.com/youth-programs/",
  },
  business("night", "Adults Only Night Club", "Arts, Culture & Entertainment", "Nightlife", [
    "Adult nightlife", "Cocktails", "21+",
  ]),
];

describe("Kinfolk business personalization", () => {
  it.each([
    { profile: "P21", statedAge: 21, ageBand: "18_plus" as const, preferenceTerms: ["hands-on candle-making experiences"], expected: "Loomen Labs" },
    { profile: "P45", statedAge: 45, ageBand: "18_plus" as const, preferenceTerms: ["American Southern cuisine and African-inspired dining"], expected: "Amina" },
    { profile: "P65", statedAge: 65, ageBand: "18_plus" as const, preferenceTerms: ["independent bookstores and author events"], expected: "Uncle Bobbie's Coffee & Books" },
    { profile: "P14", statedAge: 14, ageBand: "13_15" as const, preferenceTerms: ["video games and board games"], expected: "Queen & Rook Game Cafe" },
  ])("ranks a different explainable top result for $profile (age $statedAge)", ({ ageBand, preferenceTerms, expected }) => {
    const ranked = rankGovernedBusinessesForMember(PHILADELPHIA_ACTIVITIES, {
      ageBand,
      preferenceTerms,
      currentRequest: "Find things to do in Philadelphia",
    });
    expect(ranked[0]?.name).toBe(expected);
    expect(ranked[0]?.matchReasons.length).toBeGreaterThan(0);
    expect(ranked[0]?.website).toMatch(/^https:\/\//);
    expect(ranked[0]?.claimed).toBe(false);
    expect(ranked[0]?.verified).toBe(false);
    expect(ranked[0]?.profileStatus).toBe("community_listed");
  });

  it("blocks adult-only nightlife for a real persisted 13_15 member but retains a venue with published teen evidence", () => {
    const ranked = rankGovernedBusinessesForMember(PHILADELPHIA_ACTIVITIES, {
      ageBand: "13_15",
      preferenceTerms: ["video games"],
    });
    expect(ranked.some((entry) => entry.name === "Adults Only Night Club")).toBe(false);
    expect(ranked.some((entry) => entry.name === "Queen & Rook Game Cafe")).toBe(true);
  });

  it("never lets a positive family word override an explicit adult-only or 21+ restriction", () => {
    const misleading = business("blocked", "Family-Owned Adults Only Club", "Entertainment", "Nightclub", [
      "family-owned", "adults only", "21+",
    ]);
    expect(rankGovernedBusinessesForMember([misleading], { ageBand: "13_15" })).toEqual([]);
  });

  it.each(["13_15", "16_17", "unknown", "mixed_all_ages"] as const)(
    "hard-blocks adult-entertainment classifications for protective band %s even with false youth text",
    (ageBand) => {
      const adultEntertainment = {
        ...business("adult", "Late Show Cabaret", "Adult Entertainment", "Gentlemen's Club", [
          "strip club", "mature audiences only",
        ]),
        audiencesServed: ["all ages", "family friendly"],
      };
      expect(rankGovernedBusinessesForMember([adultEntertainment], { ageBand })).toEqual([]);
    },
  );

  it.each(["13_15", "16_17", "unknown", "mixed_all_ages"] as const)(
    "blocks standalone 21+ and restrictions stored outside tags for protective band %s",
    (ageBand) => {
      const onlyTwentyOnePlus = {
        ...business("twenty-one", "Late Show", "Entertainment", "Shows", []),
        audiencesServed: ["family friendly"],
        specialties: ["Venue 21+"],
      };
      const adultAudienceType = {
        ...business("audience", "After Dark", "Entertainment", "Shows", []),
        audiencesServed: ["all ages"],
        audienceType: "adult entertainment",
      };
      const adultNarrative = {
        ...business("narrative", "Evening Stage", "Entertainment", "Shows", []),
        audiencesServed: ["all ages"],
        whatCustomersShouldKnow: "This is a gentlemen's club.",
      };
      expect(rankGovernedBusinessesForMember(
        [onlyTwentyOnePlus, adultAudienceType, adultNarrative],
        { ageBand },
      )).toEqual([]);
      expect(audienceAllowsBusinessText({ ageBand, text: "Venue 21+" })).toBe(false);
    },
  );

  it("does not turn substring collisions into preference reasons", () => {
    const party = business("party", "Party Place", "Events", "Celebrations", []);
    const barber = business("barber", "Neighborhood Barber", "Personal Care", "Barber", []);
    const rankedForArt = rankGovernedBusinessesForMember([party], { ageBand: "18_plus", preferenceTerms: ["art"] });
    const rankedForBar = rankGovernedBusinessesForMember([barber], { ageBand: "18_plus", preferenceTerms: ["bar"] });
    expect(rankedForArt[0]?.matchReasons).toEqual([]);
    expect(rankedForBar[0]?.matchReasons).toEqual([]);
  });

  it.each(["13_15", "16_17", "unknown", "mixed_all_ages"] as const)(
    "holds adult-leaning venues from %s results without explicit youth evidence",
    (ageBand) => {
    const adultLeaning = [
      business("bar", "L&I Bar", "Food & Drink", "Bar", []),
      business("tavern", "Point Breeze Tavern", "Food & Drink", "Restaurant", []),
      business("lounge", "Night Lounge", "Entertainment", "Live Music", []),
      business("club", "Broad Street Social Club", "Entertainment", "Events", []),
    ];
    expect(rankGovernedBusinessesForMember(adultLeaning, { ageBand })).toEqual([]);
  });

  it("accepts only structured audience evidence—not family-owned or student-night wording—as a minor exception", () => {
    const incidental = business("incidental", "Family-Owned Student Night Bar", "Food & Drink", "Bar", [
      "family-owned", "student night",
    ]);
    const structured = {
      ...business("structured", "Community Lounge", "Entertainment", "Lounge", []),
      audiencesServed: ["all ages"],
    };
    expect(rankGovernedBusinessesForMember([incidental], { ageBand: "16_17" })).toEqual([]);
    expect(rankGovernedBusinessesForMember([structured], { ageBand: "16_17" }).map((entry) => entry.name)).toEqual([
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
      ageBand: "18_plus",
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
      expect(businessDiscoveryClarification({ message, subjectKey: subject!.key, ageBand: "18_plus", city: "Philadelphia" })).toEqual([]);
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

  it("maps temporary audience language to canonical, attainable, protective bands", () => {
    expect(temporaryBusinessAudienceBand("things to do for teens")).toBe("13_15");
    expect(temporaryBusinessAudienceBand("things to do for adults")).toBe("18_plus");
    expect(temporaryBusinessAudienceBand("things to do for mixed ages")).toBe("mixed_all_ages");
  });

  it.each(["13_15", "16_17", "unknown", "mixed_all_ages"] as const)(
    "never upgrades persisted protective band %s when the prompt says adults",
    (persistedBand) => {
      expect(effectiveBusinessAudienceBand(persistedBand, "18_plus")).toBe(persistedBand);
    },
  );

  it("allows an assured adult to temporarily request a safer audience", () => {
    expect(effectiveBusinessAudienceBand("18_plus", "13_15")).toBe("13_15");
    expect(effectiveBusinessAudienceBand("18_plus", "mixed_all_ages")).toBe("mixed_all_ages");
    expect(effectiveBusinessAudienceBand("18_plus", "18_plus")).toBe("18_plus");
  });
});
