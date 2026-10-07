import { describe, expect, it } from "vitest";
import {
  hasRequestedArticleEvidence,
  isPublicNetWorthEstimateRequest,
  isPreferredNameRecallRequest,
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
    "How much is 10K Turkish lira?",
    "How many US dollars make 10K in Turkish lira?",
    "Convert $100 USD to Turkish lira",
    "What is 10,000 Turkish lira in dollars today?",
    "How much is Beyoncé worth?",
    "What are Beyoncé's current earnings?",
    "Who is the CEO of Apple?",
    "Is Beyoncé touring?",
    "Is Durk coming home?",
    "Will Lil Durk be released?",
  ])("requires current research for %s", (message) => {
    expect(requiresCurrentResearch(message)).toBe(true);
  });

  it.each([
    "Plan a one-day trip in Philadelphia",
    "Help me organize the first three steps of a project this week",
    "Help me plan a calmer tomorrow morning",
    "Help me schedule my work hours tomorrow",
    "Draft a clear email to send tomorrow morning",
    "Create me a simple routine for tonight",
    "It's going to be a busy day today at work—any tips for not getting overwhelmed?",
    "I feel overwhelmed by my workload today. Help me reset and choose one next step.",
    "Help me organize my budget for this week without getting stressed.",
    "I need to reflect on a disagreement with my partner tonight. How can I start the conversation?",
    "Explain this study concept in a way I can remember tomorrow.",
    "Find live music in Atlanta",
    "Add a live comedy show to my ideas",
    "Show me living history museums",
    "Plan a trip in Philadelphia",
    "Give me travel recommendations in Atlanta",
    "live music recommendations",
    "My sister is coming home from school",
    "I collect Turkish lira from 2015",
    "Explain leadership structure at a company",
    "Tell me about Beyoncé's early career",
  ])("does not mistake stable or entertainment language for freshness in %s", (message) => {
    expect(requiresCurrentResearch(message)).toBe(false);
  });

  it("preserves current research when a self-directed plan asks about changing outside conditions", () => {
    expect(requiresCurrentResearch("Help me plan a trip to Atlanta tonight")).toBe(true);
    expect(requiresCurrentResearch("Can you plan my day tomorrow around what is open in Philadelphia?")).toBe(true);
    expect(requiresCurrentResearch("Help me plan tomorrow's flight options")).toBe(true);
    expect(requiresCurrentResearch("Plan my museum visit tomorrow around the current opening hours.")).toBe(true);
    expect(requiresCurrentResearch("Plan a visit tomorrow around the venue opening hours.")).toBe(true);
  });

  it.each([
    "What are the opening hours for the library today?",
    "What is the current price of a Philadelphia day pass?",
    "What is the latest news on this transit outage?",
    "What law takes effect this month?",
    "Help me plan my day tomorrow around what is open in Philadelphia.",
    "Help me keep calm today while I plan around live train delays.",
  ])("keeps materially current external facts on cited research: %s", (message) => {
    expect(requiresCurrentResearch(message)).toBe(true);
  });

  it("keeps explicit preferred-name recall out of the current-research path", () => {
    const personalPrompt =
      "What name should you call me? In one sentence, welcome me and give me one practical next step for today.";
    expect(requiresCurrentResearch(personalPrompt)).toBe(false);
    expect(requiresCurrentResearch(
      "Please greet me using my saved preferred name, with a warm one-sentence pep talk for today.",
    )).toBe(false);
    expect(isPreferredNameRecallRequest("What name should you call me?")).toBe(true);
    expect(isPreferredNameRecallRequest("How much is Beyoncé worth?")).toBe(false);
    expect(requiresCurrentResearch("What is open today in Philadelphia?")).toBe(true);
  });

  it("identifies public net-worth estimates without weakening stock or market-cap routes", () => {
    expect(isPublicNetWorthEstimateRequest("How much is Beyoncé worth?")).toBe(true);
    expect(isPublicNetWorthEstimateRequest("What is Beyoncé's net worth?")).toBe(true);
    expect(isPublicNetWorthEstimateRequest("What is Apple's stock price?")).toBe(false);
    expect(isPublicNetWorthEstimateRequest("What is Apple's market cap?")).toBe(false);
  });

  it("routes an explicit linked-article summary to current source retrieval", () => {
    const message = "Please summarize this linked article about gas prices: https://example.com/news/gas-prices?ref=kinfolk";
    const requested = requestedArticleSummaryUrl(message);
    expect(requested).toBe("https://example.com/news/gas-prices");
    expect(requiresCurrentResearch(message)).toBe(true);
    expect(hasRequestedArticleEvidence(requested, [{ url: "https://example.com/news/gas-prices" }])).toBe(true);
    expect(hasRequestedArticleEvidence(requested, [{ url: "https://example.com/another-story" }])).toBe(false);
  });

  it("treats a provider's terminal-slash URL canonicalization as the same exact article", () => {
    const requested = requestedArticleSummaryUrl(
      "Summarize this article: https://www.nasa.gov/news-release/example-story/",
    );

    expect(requested).toBe("https://www.nasa.gov/news-release/example-story");
    expect(hasRequestedArticleEvidence(requested, [{
      url: "https://www.nasa.gov/news-release/example-story",
    }])).toBe(true);
    expect(hasRequestedArticleEvidence(requested, [{
      url: "https://www.nasa.gov/news-release/a-different-story",
    }])).toBe(false);
  });

  it("does not accept a non-public or non-summary URL as an article request", () => {
    expect(requestedArticleSummaryUrl("Open https://example.com/news/gas-prices")).toBeNull();
    expect(requestedArticleSummaryUrl("Summarize https://localhost/private")).toBeNull();
  });
});
