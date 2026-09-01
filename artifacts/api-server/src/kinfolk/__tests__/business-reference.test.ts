import { describe, expect, it, vi } from "vitest";
import type {
  GovernedKinfolkBusiness,
  GovernedKinfolkBusinessRepository,
} from "../governedBusinessRepository";
import {
  namedBusinessPromptBlock,
  resolveNamedBusinessTurn,
} from "../business-reference";

const AMINA: GovernedKinfolkBusiness = {
  id: "91f14ab4-0f8d-4f52-97be-f12617191919",
  name: "AMINA",
  category: "Food",
  subcategory: "Restaurants",
  description: "A canonical Philadelphia restaurant.",
  city: "Philadelphia",
  stateCode: "PA",
  country: "United States",
  latitude: 39.9526,
  longitude: -75.1652,
  distanceMiles: null,
  phone: null,
  website: "https://example.test/amina",
  verified: true,
  blackOwned: true,
  tags: ["restaurant"],
  profileStatus: "community_listed",
  story: null,
  missionStatement: null,
  whyStarted: null,
  whatCustomersShouldKnow: null,
  ownershipBadges: ["black-owned"],
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

function repository(result: GovernedKinfolkBusiness | null) {
  return {
    findExactByNormalizedName: vi.fn().mockResolvedValue(result),
    findDestinationCatalog: vi.fn(),
    findHomeFallback: vi.fn(),
    findWithinRadius: vi.fn(),
  } as unknown as GovernedKinfolkBusinessRepository;
}

describe("named Kinfolk business resolution", () => {
  it("resolves Tell me about Amina to canonical AMINA in a Philadelphia session", async () => {
    const repo = repository(AMINA);
    const result = await resolveNamedBusinessTurn({
      message: "Tell me about Amina",
      scope: { city: "Philadelphia", stateCode: "PA" },
      existingMessages: [],
      repository: repo,
    });

    expect(result).toEqual({ state: "resolved", business: AMINA, source: "explicit" });
    expect(repo.findExactByNormalizedName).toHaveBeenCalledWith({
      name: "Amina",
      city: "Philadelphia",
      stateCode: "PA",
    });
    expect(namedBusinessPromptBlock(AMINA)).toContain(
      `Any recommendation must use businessId "${AMINA.id}" and exact name "AMINA".`,
    );
  });

  it("asks for location for contextless Amina and does not query the repository", async () => {
    const repo = repository(AMINA);
    const result = await resolveNamedBusinessTurn({
      message: "Tell me about Amina",
      scope: null,
      existingMessages: [],
      repository: repo,
    });

    expect(result).toMatchObject({ state: "needs_location" });
    expect(result.state === "needs_location" ? result.reply : "").toMatch(/what city/i);
    expect(repo.findExactByNormalizedName).not.toHaveBeenCalled();
  });

  it("revalidates only the immediately prior single canonical business", async () => {
    const repo = repository(AMINA);
    const result = await resolveNamedBusinessTurn({
      message: "The restaurant in Philadelphia",
      scope: { city: "Philadelphia", stateCode: "PA" },
      existingMessages: [{
        role: "assistant",
        content: "AMINA is a Philadelphia restaurant.",
        recommendations: {
          businesses: [{ businessId: AMINA.id, name: "AMINA", city: "Philadelphia" }],
        },
        timestamp: new Date().toISOString(),
      }],
      repository: repo,
    });

    expect(result).toEqual({ state: "resolved", business: AMINA, source: "immediate_reference" });
    expect(repo.findExactByNormalizedName).toHaveBeenCalledWith({
      name: "AMINA",
      city: "Philadelphia",
      stateCode: "PA",
    });
  });

  it("does not revalidate a multi-business or mismatched-city prior recommendation", async () => {
    const repo = repository(AMINA);
    const result = await resolveNamedBusinessTurn({
      message: "The restaurant in Philadelphia",
      scope: { city: "Philadelphia", stateCode: "PA" },
      existingMessages: [{
        role: "assistant",
        content: "Two options.",
        recommendations: {
          businesses: [
            { businessId: AMINA.id, name: "AMINA", city: "Philadelphia" },
            { businessId: "other", name: "Other", city: "Philadelphia" },
          ],
        },
        timestamp: new Date().toISOString(),
      }],
      repository: repo,
    });

    expect(result).toEqual({ state: "not_named" });
    expect(repo.findExactByNormalizedName).not.toHaveBeenCalled();
  });
});
