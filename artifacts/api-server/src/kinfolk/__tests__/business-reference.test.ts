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
  claimed: false,
  blackOwned: true,
  tags: ["restaurant"],
  specialties: [],
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
  matchReasons: [],
  identityReasons: [],
};

function repository(result: GovernedKinfolkBusiness | null) {
  return {
    findExactByNormalizedName: vi.fn().mockResolvedValue(result),
    findDestinationCatalog: vi.fn(),
    findHomeFallback: vi.fn(),
    findWithinRadius: vi.fn(),
  } as unknown as GovernedKinfolkBusinessRepository;
}

function exactAminaRepository() {
  return {
    findExactByNormalizedName: vi.fn().mockImplementation(async ({ name }: { name: string }) =>
      name.toLowerCase() === "amina" ? AMINA : null),
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
      scopeIsCurrentTurn: true,
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

  it.each([
    "Tell me about AMINA in Philadelphia",
    "Tell me about the AMINA restaurant in Philadelphia",
  ])("extracts canonical AMINA from a route-realistic current-turn request: %s", async (message) => {
    const repo = exactAminaRepository();
    const result = await resolveNamedBusinessTurn({
      message,
      scope: { city: "Philadelphia", stateCode: "PA" },
      scopeIsCurrentTurn: true,
      existingMessages: [],
      repository: repo,
    });

    expect(result).toEqual({ state: "resolved", business: AMINA, source: "explicit" });
    expect(repo.findExactByNormalizedName).toHaveBeenCalledWith({
      name: "AMINA",
      city: "Philadelphia",
      stateCode: "PA",
    });
  });

  it("keeps a contextless proper name in general knowledge when no business cue or location exists", async () => {
    const repo = repository(AMINA);
    const result = await resolveNamedBusinessTurn({
      message: "Tell me about Amina",
      scope: null,
      existingMessages: [],
      repository: repo,
    });

    expect(result).toEqual({ state: "not_named" });
    expect(repo.findExactByNormalizedName).not.toHaveBeenCalled();
  });

  it("asks for location when the member explicitly identifies a business", async () => {
    const repo = repository(AMINA);
    const result = await resolveNamedBusinessTurn({
      message: "Tell me about the AMINA restaurant",
      scope: null,
      existingMessages: [],
      repository: repo,
    });

    expect(result).toMatchObject({ state: "needs_location" });
    expect(result.state === "needs_location" ? result.reply : "").toMatch(/what city/i);
    expect(repo.findExactByNormalizedName).not.toHaveBeenCalled();
  });

  it.each([
    "Tell me about HBCUs",
    "Tell me about HBCU's",
    "What can you tell me about historically Black colleges and universities?",
  ])("keeps general HBCU knowledge out of named-business resolution: %s", async (message) => {
    const repo = repository(AMINA);
    const result = await resolveNamedBusinessTurn({
      message,
      scope: null,
      existingMessages: [],
      repository: repo,
    });

    expect(result).toEqual({ state: "not_named" });
    expect(repo.findExactByNormalizedName).not.toHaveBeenCalled();
  });

  it.each([
    "Tell me about HBCUs",
    "Tell me about The Odyssey",
    "Tell me about credit scores",
    "What do you know about current interest rates?",
    "Tell me about Selena Quintanilla",
  ])("defaults a general question to knowledge/research despite inherited city scope: %s", async (message) => {
    const repo = repository(AMINA);
    const result = await resolveNamedBusinessTurn({
      message,
      scope: { city: "Philadelphia", stateCode: "PA" },
      scopeIsCurrentTurn: false,
      existingMessages: [],
      repository: repo,
    });

    expect(result).toEqual({ state: "not_named" });
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
