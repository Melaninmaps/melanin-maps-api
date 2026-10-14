import { describe, expect, it } from "vitest";
import {
  communityIntelligenceSuggestionsForMessage,
  rankCommunityIntelligenceSuggestions,
  recognizeCommunityJourney,
} from "../services/community-intelligence/policy";

describe("Community Intelligence journey policy", () => {
  it("returns no more than three relevant wedding inspiration suggestions", () => {
    const suggestions = communityIntelligenceSuggestionsForMessage(
      "I am getting wedding inspiration and want to start planning.",
    );
    expect(recognizeCommunityJourney("I am getting wedding inspiration")).toBe("wedding");
    expect(suggestions).toHaveLength(3);
    expect(suggestions.map((item) => item.categoryKey)).toEqual([
      "wedding_alterations",
      "wedding_getting_ready_timing",
      "wedding_setup_cleanup",
    ]);
    expect(suggestions.every((item) => item.reason.length > 20)).toBe(true);
  });

  it("returns a different birthday path and does not reuse wedding-only categories", () => {
    const suggestions = communityIntelligenceSuggestionsForMessage(
      "I want to plan my birthday celebration.",
    );
    expect(recognizeCommunityJourney("I want to plan my birthday celebration.")).toBe("birthday");
    expect(suggestions.map((item) => item.categoryKey)).toEqual([
      "birthday_venue_logistics",
      "birthday_transport_access",
      "birthday_setup_cleanup",
    ]);
    expect(suggestions.some((item) => item.categoryKey.startsWith("wedding_"))).toBe(false);
  });

  it("does not turn sensitive or high-consequence questions into Community Intelligence suggestions", () => {
    expect(communityIntelligenceSuggestionsForMessage("I need medical advice for my wedding day")).toEqual([]);
    expect(communityIntelligenceSuggestionsForMessage("How should I invest birthday money?")).toEqual([]);
  });

  it("can reprioritize only an existing, relevant category from already-suppressed aggregate evidence", () => {
    const suggestions = communityIntelligenceSuggestionsForMessage("Wedding inspiration for next spring");
    const ranked = rankCommunityIntelligenceSuggestions(suggestions, ["wedding_setup_cleanup"]);
    expect(ranked[0]?.categoryKey).toBe("wedding_setup_cleanup");
    expect(ranked).toHaveLength(3);
    expect(ranked.every((item) => item.journeyType === "wedding")).toBe(true);
  });
});
