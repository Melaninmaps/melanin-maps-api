import { describe, expect, it } from "vitest";
import { requiresCurrentResearch } from "../current-research";

describe("current research routing", () => {
  it.each([
    "Plan my Atlanta trip for tonight",
    "What is open now in Philadelphia?",
    "Find open-now restaurants in Miami",
    "Give me live travel recommendations in Chicago",
    "Show current trip availability",
    "Plan this weekend in Baltimore",
    "What are the hours?",
    "Give me real-time weather and prices",
    "What is up-to-date as of today?",
    "update",
    "availability",
    "date freshness",
    "current",
    "real-time",
    "up-to-date",
    "open-now",
    "open now",
    "hours",
    "schedule",
    "weather",
    "price",
  ])("requires current research for %s", (message) => {
    expect(requiresCurrentResearch(message)).toBe(true);
  });

  it.each([
    "Plan a one-day trip in Philadelphia",
    "Find live music in Atlanta",
    "Add a live comedy show to my ideas",
    "Show me living history museums",
    "Plan a trip in Philadelphia",
    "Give me travel recommendations in Atlanta",
    "live music recommendations",
  ])("does not mistake stable or entertainment language for freshness in %s", (message) => {
    expect(requiresCurrentResearch(message)).toBe(false);
  });
});
