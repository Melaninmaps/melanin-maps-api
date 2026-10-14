import { describe, expect, it } from "vitest";
import {
  applyCommunityIntelligenceSignals,
  communityIntelligenceSuggestionsForMessage,
  rankCommunityIntelligenceSuggestions,
  recognizeCommunityJourney,
} from "../services/community-intelligence/policy";

describe("Community Intelligence journey policy", () => {
  it("returns no more than three relevant wedding early-planning suggestions", () => {
    const suggestions = communityIntelligenceSuggestionsForMessage(
      "I am getting wedding inspiration and want to start planning.",
    );
    expect(recognizeCommunityJourney("I am getting wedding inspiration")).toBe("wedding");
    expect(suggestions).toHaveLength(3);
    expect(suggestions.map((item) => item.categoryKey)).toEqual([
      "wedding_venue_planning",
      "wedding_alterations",
      "wedding_getting_ready_timing",
    ]);
    expect(suggestions.every((item) => item.reason.length > 20)).toBe(true);
  });

  it("does not repeat a wedding venue need that the member explicitly says is booked", () => {
    const suggestions = communityIntelligenceSuggestionsForMessage(
      "I am planning my wedding, but the venue is already booked. What should I think about next?",
    );
    expect(suggestions.map((item) => item.categoryKey)).not.toContain("wedding_venue_planning");
    expect(suggestions.map((item) => item.categoryKey)).toEqual([
      "wedding_alterations",
      "wedding_getting_ready_timing",
      "wedding_setup_cleanup",
    ]);
  });

  it("offers birthday decorations only until the member explicitly says they are handled", () => {
    const needsDecorations = communityIntelligenceSuggestionsForMessage(
      "I want to plan my birthday celebration and still need decorations.",
    );
    const decorationsHandled = communityIntelligenceSuggestionsForMessage(
      "I am planning my birthday party, but decorations are already handled.",
    );

    expect(needsDecorations.map((item) => item.categoryKey)).toContain("birthday_decorations");
    expect(decorationsHandled.map((item) => item.categoryKey)).not.toContain("birthday_decorations");
    expect(decorationsHandled.map((item) => item.categoryKey)).toEqual([
      "birthday_venue_logistics",
      "birthday_transport_access",
      "birthday_setup_cleanup",
    ]);
  });

  it("does not turn sensitive or high-consequence questions into Community Intelligence suggestions", () => {
    expect(communityIntelligenceSuggestionsForMessage("I need medical advice for my wedding day")).toEqual([]);
    expect(communityIntelligenceSuggestionsForMessage("How should I invest birthday money?")).toEqual([]);
  });

  it("can reprioritize only an existing, relevant category from already-suppressed aggregate evidence", () => {
    const suggestions = communityIntelligenceSuggestionsForMessage("Wedding inspiration for next spring");
    const ranked = rankCommunityIntelligenceSuggestions(suggestions, ["wedding_getting_ready_timing"]);
    expect(ranked[0]?.categoryKey).toBe("wedding_getting_ready_timing");
    expect(ranked).toHaveLength(3);
    expect(ranked.every((item) => item.journeyType === "wedding")).toBe(true);
  });

  it("removes a category when a sufficiently aggregated reconsider signal is present", () => {
    const suggestions = communityIntelligenceSuggestionsForMessage("Wedding inspiration for next spring");
    const adjusted = applyCommunityIntelligenceSignals(suggestions, [{
      categoryKey: "wedding_venue_planning",
      effect: "reconsider",
    }]);

    expect(adjusted.map((item) => item.categoryKey)).not.toContain("wedding_venue_planning");
    expect(adjusted).toHaveLength(2);
  });
});
