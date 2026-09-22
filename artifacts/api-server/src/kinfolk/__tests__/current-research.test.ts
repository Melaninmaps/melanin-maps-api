import { describe, expect, it } from "vitest";
import {
  hasRequestedArticleEvidence,
  requestedArticleSummaryUrl,
  requiresCurrentResearch,
} from "../current-research";

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
    "How many people live in the United States?",
    "What is the population of the United States?",
    "What is up-to-date as of today?",
    "update",
    "availability",
    "date freshness",
    "current",
    "real-time",
    "up-to-date",
    "open-now",
    "open now",
    "today",
    "tonight",
    "tomorrow",
    "weekend",
    "as of",
    "as-of",
    "as of now",
    "live travel",
    "live trip",
    "live recommendation",
    "live recommendations",
    "live update",
    "live updates",
    "live availability",
    "hours",
    "schedule",
    "weather",
    "price",
    "Is Durk coming home?",
    "Will Lil Durk be released?",
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
    "My sister is coming home from school",
  ])("does not mistake stable or entertainment language for freshness in %s", (message) => {
    expect(requiresCurrentResearch(message)).toBe(false);
  });

  it("routes an explicit linked-article summary to current source retrieval", () => {
    const message = "Please summarize this linked article about gas prices: https://example.com/news/gas-prices?ref=kinfolk";
    const requested = requestedArticleSummaryUrl(message);
    expect(requested).toBe("https://example.com/news/gas-prices");
    expect(requiresCurrentResearch(message)).toBe(true);
    expect(hasRequestedArticleEvidence(requested, [{ url: "https://example.com/news/gas-prices" }])).toBe(true);
    expect(hasRequestedArticleEvidence(requested, [{ url: "https://example.com/another-story" }])).toBe(false);
  });

  it("does not accept a non-public or non-summary URL as an article request", () => {
    expect(requestedArticleSummaryUrl("Open https://example.com/news/gas-prices")).toBeNull();
    expect(requestedArticleSummaryUrl("Summarize https://localhost/private")).toBeNull();
  });
});
