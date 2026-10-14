import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { GovernedKinfolkBusiness } from "../governedBusinessRepository";
import {
  buildGovernedTravelPlannerResponse,
  parseGovernedTravelPlannerRequest,
  parseTravelPlannerCityScope,
} from "../travel-planner-governance";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/travel-planner.ts", import.meta.url)),
  "utf8",
);

const GOVERNED_BUSINESS: GovernedKinfolkBusiness = {
  id: "governed-venue",
  name: "Governed Table",
  category: "Food & Drink",
  subcategory: "Restaurant",
  description: "A documented member-facing restaurant listing.",
  city: "Atlanta",
  stateCode: "GA",
  country: "United States",
  latitude: null,
  longitude: null,
  distanceMiles: null,
  phone: null,
  website: null,
  verified: true,
  claimed: false,
  blackOwned: true,
  ownershipClaim: "Black-owned",
  ownershipDesignations: ["black-african-american"],
  tags: ["restaurant"],
  specialties: [],
  profileStatus: "live",
  story: null,
  missionStatement: null,
  whyStarted: null,
  whatCustomersShouldKnow: null,
  ownershipBadges: ["black-owned"],
  communityValues: [],
  audiencesServed: [],
  communityVibes: [],
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

describe("governed Travel Planner", () => {
  it("uses exact City, ST scope only and does not guess foreign or malformed scopes", () => {
    expect(parseTravelPlannerCityScope(" Atlanta, ga ")).toEqual({
      city: "Atlanta",
      stateCode: "GA",
    });
    expect(parseTravelPlannerCityScope("Accra, Ghana")).toBeNull();
    expect(parseTravelPlannerCityScope("Atlanta")).toBeNull();
  });

  it("bounds untrusted request fields before catalog selection", () => {
    expect(parseGovernedTravelPlannerRequest({
      destination: "Atlanta, GA",
      days: 99,
      style: "not-a-style",
      interests: ["food", "<script>", "food", "wellness"],
    })).toMatchObject({
      destination: "Atlanta, GA",
      days: 14,
      style: "mid-range",
      interests: ["food", "wellness"],
      cityScope: { city: "Atlanta", stateCode: "GA" },
    });
    expect(parseGovernedTravelPlannerRequest({ destination: "\u0000" })).toBeNull();
  });

  it("projects named activities exclusively from supplied governed catalog records", () => {
    const request = parseGovernedTravelPlannerRequest({
      destination: "Atlanta, GA",
      days: 3,
      style: "mid-range",
      interests: ["food"],
    });
    expect(request).not.toBeNull();

    const response = buildGovernedTravelPlannerResponse({
      request: request!,
      catalog: [GOVERNED_BUSINESS],
    });

    expect(response.totalDays).toBe(3);
    expect(response.highlights).toEqual(["Governed Table"]);
    expect(response.days.flatMap((day) => day.activities)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          businessName: "Governed Table",
          businessType: "Food & Drink",
          isBlackOwned: true,
          type: "dinner",
        }),
      ]),
    );
    expect(response.overview).toContain("Governed Table");
    expect(response.safetyNote).toContain("does not provide a current safety assessment");
  });

  it("returns a truthful generic plan with no named venue when the exact governed catalog is empty", () => {
    const request = parseGovernedTravelPlannerRequest({
      destination: "Accra, Ghana",
      days: 3,
    });
    expect(request).not.toBeNull();

    const response = buildGovernedTravelPlannerResponse({
      request: request!,
      catalog: [],
    });

    expect(response.days.flatMap((day) => day.activities)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ businessName: null, businessType: null }),
      ]),
    );
    expect(response.overview).toContain("could not validate a specific venue");
  });

  it("requires a member and routes catalog reads through the shared governed engine", () => {
    expect(routeSource).toContain("requireMemberId(req, res)");
    expect(routeSource).toContain("getMemberAgeBand(memberId)");
    expect(routeSource).toContain("governedBusinessRepository.findDestinationCatalog");
    expect(routeSource).toContain("rankTravelCatalogForMember");
    expect(routeSource).toContain("buildGovernedTravelPlannerResponse");
    expect(routeSource).toContain('directoryCoverage: request.cityScope && rankedCatalog.length > 0');
    expect(routeSource).not.toContain("openai.chat.completions.create");
    expect(routeSource).not.toContain("businessesTable");
    expect(routeSource).not.toContain("ilike(");
  });
});
