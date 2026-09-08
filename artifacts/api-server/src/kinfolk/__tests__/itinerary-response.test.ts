import { describe, expect, it } from "vitest";
import type { GovernedKinfolkBusiness } from "../governedBusinessRepository";
import {
  SAFE_MODEL_RESPONSE_FALLBACK,
  buildValidatedItineraryReply,
  extractItineraryDayCount,
  itineraryPromptInstruction,
  normalizeKinfolkItinerary,
  parseKinfolkModelPayload,
  rankTravelCatalogForMember,
} from "../itinerary-response";

const AMINA: GovernedKinfolkBusiness = {
  id: "amina-id",
  name: "AMINA",
  category: "Food",
  subcategory: "Restaurants",
  description: "A canonical restaurant.",
  city: "Philadelphia",
  stateCode: "PA",
  country: "United States",
  latitude: null,
  longitude: null,
  distanceMiles: null,
  phone: null,
  website: "https://www.aminaphilly.com",
  verified: false,
  claimed: false,
  blackOwned: false,
  tags: ["restaurant", "American Southern cuisine", "African-inspired culinary creations", "Fun dining experience"],
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

const LOOMEN: GovernedKinfolkBusiness = {
  ...AMINA,
  id: "loomen-id",
  name: "Loomen Labs",
  category: "Arts, Culture & Entertainment",
  subcategory: "Attractions",
  website: "https://www.loomenlabs.com/",
  tags: ["Guided custom perfume experiences", "Custom eco-friendly candle-making experiences"],
};

const UNCLE_BOBBIES: GovernedKinfolkBusiness = {
  ...AMINA,
  id: "uncle-bobbies-id",
  name: "Uncle Bobbie's Coffee & Books",
  category: "Food",
  subcategory: "Cafés & Coffee",
  website: "https://www.unclebobbies.com/",
  tags: ["Independent bookstore", "Coffee and espresso bar", "Author events and workshops"],
};

const QUEEN_AND_ROOK: GovernedKinfolkBusiness = {
  ...AMINA,
  id: "queen-and-rook-id",
  name: "Queen & Rook Game Cafe",
  category: "Arts, Culture & Entertainment",
  subcategory: "Gaming & Recreation",
  website: "https://www.queenandrookcafe.com/youth-programs/",
  tags: ["Board-game play", "Retro video-game arcade", "Food and full bar"],
  audiencesServed: ["youth ages 6-16", "teen programs ages 13-16"],
};

const ADULT_NIGHTCLUB: GovernedKinfolkBusiness = {
  ...AMINA,
  id: "adults-only-id",
  name: "Evening Venue",
  category: "Arts, Culture & Entertainment",
  subcategory: "Shows",
  tags: ["18+"],
};

const PHILADELPHIA_CATALOG = [AMINA, LOOMEN, UNCLE_BOBBIES, QUEEN_AND_ROOK, ADULT_NIGHTCLUB];

describe("Kinfolk itinerary normalization", () => {
  it("extracts and normalizes exactly three day-by-day entries", () => {
    const message = "Plan a three-day itinerary in Philadelphia";
    const itinerary = normalizeKinfolkItinerary({
      message,
      catalog: [AMINA],
      modelValue: {
        itinerary: {
          days: [
            {
              day: 9,
              theme: "Arrival",
              activities: [{
                time: "6:00 PM",
                title: "Dinner",
                description: "Settle in over dinner.",
                canonicalVenue: { businessId: "amina-id", name: "Renamed Amina" },
              }],
            },
            {
              day: 9,
              theme: "History",
              activities: [{
                time: "Morning",
                title: "Museum time",
                description: "Choose a public museum after checking current hours.",
              }],
            },
          ],
          safetyNote: "Check official transit notices.",
          packingTips: ["Walking shoes"],
        },
      },
    });

    expect(extractItineraryDayCount(message)).toBe(3);
    expect(itinerary.days).toHaveLength(3);
    expect(itinerary.days.map((day) => day.day)).toEqual([1, 2, 3]);
    expect(itinerary.days[0].activities[0].canonicalVenue).toBe("AMINA");
    expect(itinerary.days[0].activities[0].title).toBe("AMINA");
    expect(itinerary.days[0].activities[0].description).toBe(AMINA.description);
    expect(itinerary.days[1].activities[0]).not.toHaveProperty("canonicalVenue");
    expect(itinerary.days[2].activities[0]).toMatchObject({
      time: "Flexible",
      title: "Explore at your own pace",
    });
    expect(itinerary.days[0].theme).toBe("Arrival and local highlights");
    expect(itinerary).not.toHaveProperty("safetyNote");
    expect(itinerary).not.toHaveProperty("packingTips");
  });

  it("replaces a non-catalog venue proposal with a server-authored generic activity", () => {
    const itinerary = normalizeKinfolkItinerary({
      message: "Plan a 1-day trip in Philadelphia",
      catalog: [AMINA],
      modelValue: {
        itinerary: {
          days: [{
            theme: "A day out",
            activities: [{
              time: "Noon",
              title: "Lunch",
              description: "Pause for lunch wherever is currently open.",
              canonicalVenue: { id: "invented-id", name: "Invented Cafe" },
            }],
          }],
        },
      },
    });

    expect(itinerary.days[0].activities[0]).toMatchObject({
      time: "Flexible",
      title: "Get oriented",
    });
    expect(JSON.stringify(itinerary)).not.toContain("Invented Cafe");
    expect(JSON.stringify(itinerary)).not.toContain("invented-id");
  });

  it("removes invented venue names hidden in activity text and replaces the model reply", () => {
    const itinerary = normalizeKinfolkItinerary({
      message: "Plan a 1-day trip in Philadelphia",
      catalog: [],
      modelValue: {
        reply: "Dinner at Invented Moon Cafe will be perfect.",
        itinerary: {
          safetyNote: "Meet at Invented Moon Cafe.",
          packingTips: ["Coupon for Invented Moon Cafe"],
          days: [{
            theme: "Invented Moon Cafe night",
            safetyNote: "Wait outside Invented Moon Cafe.",
            activities: [{
              time: "Invented Moon Cafe o'clock",
              title: "Dinner at Invented Moon Cafe",
              description: "Book a table at Invented Moon Cafe.",
            }],
          }],
        },
      },
    });
    const reply = buildValidatedItineraryReply("Philadelphia", itinerary);

    expect(JSON.stringify(itinerary)).not.toContain("Invented Moon Cafe");
    expect(reply).not.toContain("Invented Moon Cafe");
    expect(reply).toMatch(/could not validate a specific venue/i);
  });

  it("requires recommendations null and canonical-or-generic activities in the model instruction", () => {
    const instruction = itineraryPromptInstruction(3, "Philadelphia");
    expect(instruction).toContain("exactly 3 days");
    expect(instruction).toContain("Set recommendations:null");
    expect(instruction).toMatch(/omit canonicalVenue/i);
    expect(instruction).toMatch(/never invent or rename a venue/i);
    expect(instruction).toMatch(/explicit preferences and audience policy/i);
    expect(instruction).toMatch(/without stating or guessing the member's age/i);
  });

  it("ranks distinct, explainable Philadelphia trip options for the four attainable family profiles", () => {
    const profiles = [
      {
        profile: "P21",
        statedAge: 21,
        expected: "Loomen Labs",
        settings: { ageBand: "18_plus" as const, favoriteCategories: ["candle-making experiences"], tripStyle: ["group"], travelCompanion: "friends" },
      },
      {
        profile: "P45",
        statedAge: 45,
        expected: "AMINA",
        settings: { ageBand: "18_plus" as const, favoriteCategories: ["American Southern cuisine and African-inspired dining"], tripStyle: ["couple"], travelCompanion: "partner" },
      },
      {
        profile: "P65",
        statedAge: 65,
        expected: "Uncle Bobbie's Coffee & Books",
        settings: { ageBand: "18_plus" as const, favoriteCategories: ["author events and workshops"], tripStyle: ["solo"], travelCompanion: "solo" },
      },
      {
        profile: "P14",
        statedAge: 14,
        expected: "Queen & Rook Game Cafe",
        settings: { ageBand: "13_15" as const, favoriteCategories: ["video games and board games"], tripStyle: ["family"], travelCompanion: "family" },
      },
    ];

    const winners = profiles.map(({ profile, statedAge, expected, settings }) => {
      const ranked = rankTravelCatalogForMember({
        catalog: PHILADELPHIA_CATALOG,
        message: "Plan a weekend trip in Philadelphia",
        profile: settings,
      });
      expect(ranked[0]?.name, `${profile} age ${statedAge}`).toBe(expected);
      expect(ranked[0]?.matchReasons.length, `${profile} why-this-fits`).toBeGreaterThan(0);
      expect(ranked[0]?.website, `${profile} action link`).toMatch(/^https:\/\//);
      expect(ranked[0]?.claimed, `${profile} claim truth`).toBe(false);
      expect(ranked[0]?.verified, `${profile} verification truth`).toBe(false);
      if (profile === "P14") {
        expect(ranked.some((entry) => entry.name === "Evening Venue")).toBe(false);
      }
      return ranked[0]!.name;
    });

    expect(new Set(winners).size).toBe(4);
  });
});

describe("strict Kinfolk model envelopes", () => {
  it.each([
    ["malformed JSON", '{"reply":'],
    ["fenced JSON", '```json\n{"reply":"Do not show me"}\n```'],
    ["missing reply", '{"itinerary":{"days":[]}}'],
    ["blank reply", '{"reply":"   ","recommendations":null}'],
  ])("never exposes raw provider content for %s", (_label, raw) => {
    const result = parseKinfolkModelPayload(raw);
    expect(result).toEqual({
      valid: false,
      reply: SAFE_MODEL_RESPONSE_FALLBACK,
      value: null,
    });
    expect(result.reply).not.toContain(raw);
  });

  it("accepts a pure JSON object only when it has a nonempty conversational reply", () => {
    expect(parseKinfolkModelPayload('{"reply":"Here is a safe plan.","recommendations":null}')).toEqual({
      valid: true,
      reply: "Here is a safe plan.",
      value: { reply: "Here is a safe plan.", recommendations: null },
    });
  });
});
