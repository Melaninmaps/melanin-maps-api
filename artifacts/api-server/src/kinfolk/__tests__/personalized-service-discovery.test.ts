import { describe, expect, it } from "vitest";
import { parseMemberServicePreference, relevantMemberServicePreferences } from "../service-preferences";
import { rankGovernedBusinessesForMember } from "../business-personalization";
import { isExplicitProfileMemoryRelevant } from "../explicit-member-memory";
import type { GovernedKinfolkBusiness } from "../governedBusinessRepository";

const base = (id: string): GovernedKinfolkBusiness => ({
  id, name: id, category: "Beauty", subcategory: "Salon", description: "", city: "Philadelphia", stateCode: "PA", country: "USA",
  latitude: null, longitude: null, distanceMiles: null, phone: null, website: null, verified: false, claimed: false, blackOwned: false,
  tags: [], specialties: [], profileStatus: null, story: null, missionStatement: null, whyStarted: null, whatCustomersShouldKnow: null,
  ownershipBadges: [], communityValues: [], audiencesServed: [], vibes: [], accessibilityFeatures: [], communityInitiatives: [], growthGoals: [], audienceType: null, environmentTags: [], amenityTags: [], matchReasons: [], identityReasons: [],
});

describe("personalized service discovery", () => {
  it("derives explicit saved hair needs without treating them as a generic identity filter", () => {
    const saved = "I have locs and require shampoo and detangling. I will not book a stylist who requires pre-washed hair.";
    expect(parseMemberServicePreference(saved)).toMatchObject({ preferredServiceKeys: ["loc_maintenance"], requiredInclusions: ["shampoo", "detangling"], excludesPrewashedRequirement: true });
    expect(isExplicitProfileMemoryRelevant({ content: saved, purpose: "profile_context" }, "Find a stylist in Philadelphia")).toBe(true);
    expect(isExplicitProfileMemoryRelevant({ content: saved, purpose: "profile_context" }, "Explain photosynthesis")).toBe(false);
  });

  it("keeps preferences account-scoped at the caller boundary", () => {
    const mine = relevantMemberServicePreferences([{ content: "I prefer wigs and installs", purpose: "profile_context" }], "Find a stylist");
    const newMember = relevantMemberServicePreferences([], "Find a stylist");
    expect(mine.preferredServiceKeys).toContain("wig_install");
    expect(newMember.preferredServiceKeys).toEqual([]);
  });

  it("requires documented appointment facts and excludes explicit pre-wash conflicts", () => {
    const confirmed = { ...base("confirmed"), serviceOfferings: [{ serviceKey: "loc_maintenance" as const, serviceLabel: "Loc maintenance", policy: { shampoo: "included" as const, conditioning: "unknown" as const, detangling: "included" as const, drying: "unknown" as const, arrivalPreparation: "not_required" as const }, priceText: null, durationMinutes: null, bookingUrl: null, evidenceState: "owner_confirmed" as const, status: "active" as const, sourceUrl: "https://example.com/services", sourceLabel: "Owner service menu", observedAt: "2026-10-08", confidence: "high" as const, lastConfirmedAt: "2026-10-08", note: null }] };
    const prewashed = { ...confirmed, id: "prewashed", serviceOfferings: [{ ...confirmed.serviceOfferings![0], policy: { ...confirmed.serviceOfferings![0].policy, arrivalPreparation: "required" as const } }] };
    const unknown = base("unknown");
    const preference = parseMemberServicePreference("Remember I have locs and require shampoo and detangling. I will not book a stylist who requires pre-washed hair.")!;
    expect(rankGovernedBusinessesForMember([unknown, prewashed, confirmed], { servicePreference: preference }).map((entry) => entry.id)).toEqual(["confirmed"]);
    expect(rankGovernedBusinessesForMember([confirmed], { servicePreference: preference })[0]?.matchReasons).toEqual(expect.arrayContaining(["Documented appointment requirements match"]));
  });

  it("does not treat a broad About description as verified service evidence", () => {
    const broadAbout = { ...base("about-only"), description: "Natural hair care, locs, shampoo and detangling available." };
    const preference = parseMemberServicePreference("Remember I require shampoo and detangling.")!;
    expect(rankGovernedBusinessesForMember([broadAbout], { servicePreference: preference })).toEqual([]);
  });
});
