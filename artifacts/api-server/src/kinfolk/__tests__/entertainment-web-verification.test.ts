import { describe, expect, it } from "vitest";
import { verifyEntertainmentWebEvidence } from "../entertainment-web-verification";
import type { WebResult } from "../web-search";

const request = {
  mode: "streaming" as const,
  title: "Jessica Jones",
  countryCode: "US",
  city: null,
  requestedDate: null,
};

function officialNetflix(
  citationText: string,
  overrides: Partial<WebResult> = {},
): WebResult {
  return {
    title: "Watch Jessica Jones | Netflix Official Site",
    url: "https://www.netflix.com/title/80002311",
    content: "",
    citationText,
    providerScore: 0.9,
    publisher: "Netflix",
    sourceQuery: {
      text: "Jessica Jones current streaming availability US",
      role: "general",
      reason: "test",
    },
    ...overrides,
  };
}

describe("Kinfolk entertainment cited-web verification", () => {
  it("accepts only a current official, title-matched, country-matched streaming claim", () => {
    const result = verifyEntertainmentWebEvidence({
      request,
      results: [
        officialNetflix(
          "Jessica Jones is currently available to watch on Netflix in the United States with a subscription.",
        ),
      ],
      entertainmentCostPolicy: "included_only",
      now: Date.UTC(2026, 9, 16),
    });

    expect(result).toMatchObject({
      state: "verified",
      claims: [
        {
          kind: "streaming",
          providerName: "Netflix",
          monetization: "included_with_subscription",
        },
      ],
    });
  });

  it("rejects geographic mismatches, stale source dates, and ambiguous citation context", () => {
    const countryMismatch = verifyEntertainmentWebEvidence({
      request,
      results: [
        officialNetflix(
          "Jessica Jones is currently available to watch on Netflix in Canada with a subscription.",
        ),
      ],
      entertainmentCostPolicy: "any",
      now: Date.UTC(2026, 9, 16),
    });
    const stale = verifyEntertainmentWebEvidence({
      request,
      results: [
        officialNetflix(
          "Jessica Jones is currently available to watch on Netflix in the United States.",
          { sourceDate: "2020-01-01" },
        ),
      ],
      entertainmentCostPolicy: "any",
      now: Date.UTC(2026, 9, 16),
    });
    const ambiguous = verifyEntertainmentWebEvidence({
      request,
      results: [
        officialNetflix("Entertainment news and title listings are available."),
      ],
      entertainmentCostPolicy: "any",
      now: Date.UTC(2026, 9, 16),
    });

    expect(countryMismatch).toMatchObject({
      state: "insufficient",
      claims: [],
    });
    expect(stale).toMatchObject({ state: "insufficient", claims: [] });
    expect(ambiguous).toMatchObject({ state: "insufficient", claims: [] });
  });

  it("fails closed when an official source conflicts about the same provider", () => {
    const result = verifyEntertainmentWebEvidence({
      request,
      results: [
        officialNetflix(
          "Jessica Jones is currently available to watch on Netflix in the United States.",
        ),
        officialNetflix(
          "Jessica Jones is currently not available on Netflix in the United States.",
          { url: "https://www.netflix.com/title/80002311?locale=en-US" },
        ),
      ],
      entertainmentCostPolicy: "any",
      now: Date.UTC(2026, 9, 16),
    });

    expect(result).toEqual({ state: "conflicting", claims: [] });
  });

  it("accepts an exact current showtime only from an official cinema source", () => {
    const result = verifyEntertainmentWebEvidence({
      request: {
        mode: "showtimes",
        title: "Moonlight",
        countryCode: "US",
        city: "Chicago",
        requestedDate: "2026-10-16",
      },
      results: [
        {
          title: "Moonlight showtimes at AMC River East",
          url: "https://www.amctheatres.com/movie-theatres/chicago/amc-river-east-21/showtimes",
          content: "",
          citationText:
            "Moonlight is currently playing at AMC River East in Chicago, United States on 2026-10-16 at 7:30 PM.",
          providerScore: 0.9,
          publisher: "AMC Theatres",
          sourceQuery: {
            text: "Moonlight movie showtimes Chicago, US",
            role: "general",
            reason: "test",
          },
        },
      ],
      entertainmentCostPolicy: "any",
      now: Date.UTC(2026, 9, 16),
    });

    expect(result).toMatchObject({
      state: "verified",
      claims: [
        {
          kind: "showtime",
          startsAtLabel: "2026-10-16 7:30 PM",
        },
      ],
    });
  });
});
