import { describe, expect, it } from "vitest";
import { isExplicitCurrentItineraryRequest } from "../itinerary-eligibility";

describe("isExplicitCurrentItineraryRequest", () => {
  it("allows only an active current request to build a governed itinerary", () => {
    expect(isExplicitCurrentItineraryRequest("Please build a two-day itinerary for Atlanta now.")).toBe(true);
    expect(isExplicitCurrentItineraryRequest("Can you help me plan a weekend trip in Detroit this weekend?")).toBe(true);
    expect(isExplicitCurrentItineraryRequest("Show me a trip plan for Philadelphia today.")).toBe(true);
  });

  it("keeps future, hypothetical, and contextual place mentions out of itinerary mode", () => {
    for (const message of [
      "I plan to go to Atlanta next month.",
      "When I visit Detroit, what should I know?",
      "My cousin moved to Philadelphia and I am excited for her.",
      "I might travel to Chicago someday.",
      "What is Atlanta like in the fall?",
      "Build me an itinerary someday.",
      "Plan dinner in Atlanta.",
      "Plan dinner tonight.",
    ]) {
      expect(isExplicitCurrentItineraryRequest(message)).toBe(false);
    }
  });
});
