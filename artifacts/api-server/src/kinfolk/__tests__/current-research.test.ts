import { describe, expect, it } from "vitest";
import {
  hasRequestedArticleEvidence,
  inspectArticleSummaryRequest,
  isPublicNetWorthEstimateRequest,
  isPreferredNameRecallRequest,
  requestedArticleSummaryUrl,
  requiresCurrentResearch,
  requiresTimeSpecificResearch,
  temporalEvidencePolicy,
} from "../current-research";

describe("current research routing", () => {
  it.each([
    "Plan my Atlanta trip for tonight",
    "What is open now in Philadelphia?",
    "Find open-now restaurants in Miami",
    "Give me live travel recommendations in Chicago",
    "Show current trip availability",
    "Give me real-time weather and prices",
    "How many people live in the United States?",
    "What is the population of the United States?",
    "open-now",
    "open now",
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
    "today",
    "tonight",
    "this week",
    "current",
    "latest",
    "What are the hours?",
    "Help me plan a calmer tomorrow morning",
    "Today I feel stressed about money.",
    "Should I make a budget today?",
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
    "What time does the dry cleaner near me close today?",
    "Help me find a restaurant for tonight.",
    "Will the Iran war affect gas prices this week?",
    "What is the current interest rate today?",
    "What are the opening hours for the library today?",
    "What are people saying about #veganbrunch open today?",
    "What is the current price of a Philadelphia day pass?",
    "What is the latest news on this transit outage?",
    "What is the latest streaming milestone for this artist?",
    "What law takes effect this month?",
    "Help me plan my day tomorrow around what is open in Philadelphia.",
    "Help me keep calm today while I plan around live train delays.",
  ])("keeps materially current external facts on cited research: %s", (message) => {
    expect(requiresCurrentResearch(message)).toBe(true);
  });

  it("keeps a member's own work schedule out of current operating-status research", () => {
    expect(requiresCurrentResearch("What are my work hours today?")).toBe(false);
    expect(temporalEvidencePolicy("What are my work hours today?")).toMatchObject({
      requestedFact: "stable",
      freshness: "stable",
    });
  });

  it.each([
    "What are the official requirements to renew a U.S. passport?",
    "What is the current Roth IRA contribution limit?",
    "What are the eligibility rules for a government-issued identity document replacement?",
  ])("treats regulated public rules as changing external facts: %s", (message) => {
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

  it("separates a conversion fact's freshness, evidence threshold, and calculation eligibility", () => {
    const currentConversion = temporalEvidencePolicy("What is 792 yen in U.S. dollars today?");
    const historicalConversion = temporalEvidencePolicy("How much was 792 yen in dollars in 2020?");
    const merchantPayment = temporalEvidencePolicy("Do nearby restaurants accept yen?");
    const stableMath = temporalEvidencePolicy("What does compound interest mean?");

    expect(currentConversion).toMatchObject({
      requestedFact: "currency_conversion",
      freshness: "current",
      evidenceStandard: "single_authoritative_or_reliable",
      calculationEligible: true,
    });
    expect(historicalConversion).toMatchObject({
      requestedFact: "currency_conversion",
      freshness: "historical",
      evidenceStandard: "single_authoritative_or_reliable",
      calculationEligible: true,
    });
    expect(merchantPayment).toMatchObject({
      requestedFact: "merchant_payment_policy",
      freshness: "current",
      evidenceStandard: "single_authoritative",
      calculationEligible: false,
    });
    expect(stableMath).toMatchObject({
      requestedFact: "stable",
      freshness: "stable",
      evidenceStandard: "none",
      calculationEligible: false,
    });
    expect(requiresCurrentResearch("How much was 792 yen in dollars in 2020?")).toBe(false);
    expect(requiresTimeSpecificResearch("How much was 792 yen in dollars in 2020?")).toBe(true);
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

  it("classifies only unsupported linked summaries before provider or memory work", () => {
    expect(inspectArticleSummaryRequest(
      "Summarize https://news.example.org/accessible-article",
    )).toEqual({
      state: "ready",
      url: "https://news.example.org/accessible-article",
    });
    expect(inspectArticleSummaryRequest(
      "Summarize http://news.example.org/old-article",
    )).toEqual({ state: "unsupported_link", url: null });
    expect(inspectArticleSummaryRequest(
      "Please summarize www.example.org/article",
    )).toEqual({ state: "unsupported_link", url: null });
    expect(inspectArticleSummaryRequest(
      "Open https://news.example.org/article",
    )).toEqual({ state: "not_requested", url: null });
  });
});
