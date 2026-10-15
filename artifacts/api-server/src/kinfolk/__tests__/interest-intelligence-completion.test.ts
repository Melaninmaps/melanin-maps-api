import { describe, expect, it } from "vitest";
import { sourceBackedOpportunityFromCitation } from "../external-opportunity-discovery";
import {
  businessMeetsInterestDiscoveryConstraints,
  eventMeetsInterestDiscoveryConstraints,
  type InterestDiscoveryConstraints,
} from "../interest-recommendation-constraints";

const requirements: InterestDiscoveryConstraints = {
  crowdPreference: "quiet_or_low_sensory",
  accessibilityRequirements: ["wheelchair_accessible"],
  maximumPrice: "$$",
  agePreference: "all_ages",
  excludedCategories: ["nightlife"],
};

describe("Kinfolk interest intelligence completion safeguards", () => {
  it("admits only future-dated citations from an approved opportunity source", () => {
    const opportunity = sourceBackedOpportunityFromCitation({
      result: {
        title: "Street photography workshop — June 20, 2027",
        url: "https://www.eventbrite.com/e/street-photography-workshop-tickets-123",
        content: "A public workshop and experience on June 20, 2027.",
        providerScore: 0.9,
        sourceQuery: { text: "upcoming street photography events", role: "general", reason: "test" },
      },
      interestLabel: "street photography",
      category: "arts_and_culture",
      city: "Atlanta",
      state: "GA",
      now: new Date("2027-05-01T00:00:00Z"),
    });
    expect(opportunity).toMatchObject({ sourceHost: "eventbrite.com", city: "Atlanta", state: "GA" });
    expect(opportunity?.startsOn.toISOString()).toContain("2027-06-20");
  });

  it("rejects uncited-source substitutes and date-free results", () => {
    expect(sourceBackedOpportunityFromCitation({
      result: { title: "A workshop", url: "https://example.com/event", content: "An event", providerScore: 1, sourceQuery: { text: "q", role: "general", reason: "test" } },
      interestLabel: "photography", category: "arts_and_culture", city: "Atlanta", state: "GA", now: new Date("2027-05-01T00:00:00Z"),
    })).toBeNull();
  });

  it("fails closed when a business lacks evidence for active hard requirements", () => {
    expect(businessMeetsInterestDiscoveryConstraints({
      category: "Arts", price_range: "$$", audience_type: "all_ages",
      environment_tags: ["quiet"], amenity_tags: ["wheelchair_accessible"], accessibility_features: [],
    }, requirements)).toBe(true);
    expect(businessMeetsInterestDiscoveryConstraints({
      category: "Arts", price_range: null, audience_type: "unknown",
      environment_tags: [], amenity_tags: [], accessibility_features: [],
    }, requirements)).toBe(false);
    expect(businessMeetsInterestDiscoveryConstraints({
      category: "Nightlife", price_range: "$$", audience_type: "all_ages",
      environment_tags: ["quiet"], amenity_tags: ["wheelchair_accessible"], accessibility_features: [],
    }, requirements)).toBe(false);
  });

  it("does not guess unknown event price, access, crowd, or age data", () => {
    expect(eventMeetsInterestDiscoveryConstraints({ category: "Arts", price: null, audience_rating: "everyone" }, requirements)).toBe(false);
    expect(eventMeetsInterestDiscoveryConstraints({ category: "Arts", price: "Free", audience_rating: "everyone" }, { ...requirements, crowdPreference: "any", accessibilityRequirements: [], maximumPrice: "any" })).toBe(true);
  });
});
