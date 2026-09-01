import { describe, expect, it } from "vitest";
import type { GovernedKinfolkBusiness } from "../governedBusinessRepository";
import {
  SAFE_MODEL_RESPONSE_FALLBACK,
  extractItineraryDayCount,
  itineraryPromptInstruction,
  normalizeKinfolkItinerary,
  parseKinfolkModelPayload,
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
  website: null,
  verified: true,
  blackOwned: true,
  tags: ["restaurant"],
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
    expect(itinerary.days[1].activities[0]).not.toHaveProperty("canonicalVenue");
    expect(itinerary.days[2].activities[0]).toMatchObject({
      time: "Flexible",
      title: "Explore at your own pace",
    });
    expect(itinerary.safetyNote).toBe("Check official transit notices.");
    expect(itinerary.packingTips).toEqual(["Walking shoes"]);
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

  it("requires recommendations null and canonical-or-generic activities in the model instruction", () => {
    const instruction = itineraryPromptInstruction(3, "Philadelphia");
    expect(instruction).toContain("exactly 3 days");
    expect(instruction).toContain("Set recommendations:null");
    expect(instruction).toMatch(/omit canonicalVenue/i);
    expect(instruction).toMatch(/never invent or rename a venue/i);
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
