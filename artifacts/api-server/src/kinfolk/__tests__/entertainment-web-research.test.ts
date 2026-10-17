import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEntertainmentWebSearchQuery,
  clearEntertainmentWebSearchCacheForTests,
  resolveEntertainmentAvailabilityWithWebSources,
} from "../entertainment-web-research";
import type { WebSearchOutcome } from "../web-search";

const request = {
  mode: "streaming" as const,
  title: "The Woman King",
  countryCode: "US",
  city: null,
  requestedDate: null,
};
const preferences = {
  streamingServices: ["Netflix", "Max"],
  entertainmentCostPolicy: "included_only" as const,
};

function citedOutcome(): WebSearchOutcome {
  return {
    state: "completed",
    attempted: true,
    providerAttempted: true,
    providerUsed: true,
    provider: "openai",
    fallbackUsed: false,
    partial: false,
    results: [
      {
        title: "Where to watch The Woman King",
        url: "https://example.com/the-woman-king",
        content: "The Woman King current availability information.",
        providerScore: 0.9,
        publisher: "Example Entertainment",
        sourceQuery: {
          text: "The Woman King current streaming availability US",
          role: "general",
          reason: "test",
        },
      },
    ],
  };
}

describe("Kinfolk cited entertainment web research", () => {
  beforeEach(() => clearEntertainmentWebSearchCacheForTests());

  it("uses one bounded, subscription-focused query without claiming an offer", () => {
    const query = buildEntertainmentWebSearchQuery(request, preferences);
    expect(query.text).toContain("The Woman King");
    expect(query.text).toContain("Netflix or Max");
    expect(query.text).toContain("no rental or purchase");
    expect(query.reason).toContain("member-requested");
  });

  it("forms a city-scoped cited-source query for an explicitly named event", () => {
    const query = buildEntertainmentWebSearchQuery(
      {
        mode: "event",
        title: "The Roots Picnic",
        countryCode: "US",
        city: "Philadelphia",
        requestedDate: null,
      },
      { streamingServices: [], entertainmentCostPolicy: "any" },
    );

    expect(query.text).toContain("The Roots Picnic");
    expect(query.text).toContain("Philadelphia, US");
    expect(query.text).toContain("ticket information");
  });

  it("returns title-matched cited sources rather than provider-shaped offers", async () => {
    const search = vi.fn().mockResolvedValue(citedOutcome());
    const result = await resolveEntertainmentAvailabilityWithWebSources({
      request,
      preferences,
      search,
      now: () => 1_000,
    });

    expect(search).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("web_results_available");
    expect(result.offers).toEqual([]);
    expect(result.showtimes).toEqual([]);
    expect(result.sources).toEqual([
      expect.objectContaining({
        title: "Where to watch The Woman King",
        url: "https://example.com/the-woman-king",
        titleMatch: true,
      }),
    ]);
    expect(result.sourceStatus).toMatchObject({
      attempted: true,
      provider: "openai",
      evidenceBoundary: "cited_web_sources_only",
    });
    expect(result.message).toContain(
      "does not treat web-search results as a verified offer",
    );
  });

  it("caches a repeated identical lookup briefly without a second source request", async () => {
    const search = vi.fn().mockResolvedValue(citedOutcome());
    const first = await resolveEntertainmentAvailabilityWithWebSources({
      request,
      preferences,
      search,
      now: () => 10_000,
    });
    const second = await resolveEntertainmentAvailabilityWithWebSources({
      request,
      preferences,
      search,
      now: () => 10_001,
    });

    expect(search).toHaveBeenCalledTimes(1);
    expect(first.sourceStatus.cacheHit).toBe(false);
    expect(second.sourceStatus.cacheHit).toBe(true);
  });

  it("does not search before country, city, and title prerequisites are met", async () => {
    const search = vi.fn();
    const result = await resolveEntertainmentAvailabilityWithWebSources({
      request: { ...request, mode: "showtimes", title: null, city: null },
      preferences: { streamingServices: [], entertainmentCostPolicy: "any" },
      search,
    });

    expect(search).not.toHaveBeenCalled();
    expect(result.status).toBe("location_required");
    expect(result.sources).toEqual([]);
  });

  it("fails closed when a cited search yields no matching title source", async () => {
    const base = citedOutcome();
    const outcome: WebSearchOutcome = {
      ...base,
      results: [
        {
          ...base.results[0],
          title: "Unrelated entertainment article",
          url: "https://example.com/unrelated",
          content: "No requested title appears here.",
        },
      ],
    };
    const result = await resolveEntertainmentAvailabilityWithWebSources({
      request,
      preferences,
      search: vi.fn().mockResolvedValue(outcome),
    });

    expect(result.status).toBe("web_search_unavailable");
    expect(result.sources).toEqual([]);
    expect(result.message).toContain("will not guess");
  });
});
