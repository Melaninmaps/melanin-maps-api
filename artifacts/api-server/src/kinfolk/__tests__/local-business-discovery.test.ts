import { afterEach, describe, expect, it, vi } from "vitest";

const responsesCreate = vi.hoisted(() => vi.fn());
vi.mock("@workspace/integrations-openai-ai-server", () => ({
  openai: { responses: { create: responsesCreate } },
}));

import { resolveNamedBusinessTurn } from "../business-reference";
import { deriveBusinessSubject } from "../business-subject";
import {
  buildBusinessDiscoveryWebQueries,
  discoverLocalBusinesses,
} from "../local-business-discovery";
import { classifyKinfolkRequest } from "../request-classifier";
import { searchAllQueriesWithState, searchLocalBusinessQueriesWithState } from "../web-search";

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  globalThis.fetch = originalFetch;
});

const bookstore = deriveBusinessSubject("Can you tell me about bookstores in Atlanta GA")!;

const governedBusiness = {
  id: "business-1",
  name: "Atlanta Reading Room",
  category: "Shopping",
  subcategory: "Bookstore",
  description: "An independent bookstore in Atlanta.",
  city: "Atlanta",
  stateCode: "GA",
  country: "US",
  latitude: 33.75,
  longitude: -84.39,
  distanceMiles: null,
  phone: null,
  website: "https://reading-room.example.com/",
  verified: false,
  claimed: false,
  blackOwned: false,
  tags: ["books"],
  specialties: [],
  profileStatus: "community_listed",
  story: null,
  missionStatement: null,
  whyStarted: null,
  whatCustomersShouldKnow: null,
  ownershipBadges: [],
  communityValues: [],
  audiencesServed: [],
  vibes: [],
  accessibilityFeatures: [],
  communityInitiatives: [],
  growthGoals: [],
  audienceType: null,
  environmentTags: [],
  amenityTags: [],
  matchReasons: ["subcategory"],
  identityReasons: [],
};

const forKeepsPlace = {
  id: "7a361f84-68e2-4f41-8928-863311d0cae2",
  entityKind: "cultural_site",
  title: "For Keeps Books and Auburn Avenue Bookstores",
  summary: "A cultural record about Atlanta's independent Black bookstore history.",
  city: "Atlanta",
  stateCode: "GA",
  detailUrl: "/places/7a361f84-68e2-4f41-8928-863311d0cae2/for-keeps-books-and-auburn-avenue-bookstores-atlanta",
  websiteUrl: null,
  sourceUrl: null,
};

function repository(input?: { businesses?: typeof governedBusiness[]; places?: typeof forKeepsPlace[] }) {
  return {
    findBySubject: vi.fn().mockResolvedValue(input?.businesses ?? []),
    findPublishedMapEntities: vi.fn().mockResolvedValue(input?.places ?? []),
  };
}

describe("local business subject classification", () => {
  it.each(["bookstore", "bookstores", "book store", "bookshop", "bookseller", "books"])(
    "normalizes %s to the bookstore subject",
    (variant) => {
      const subject = deriveBusinessSubject(`Find ${variant} in Atlanta GA`);
      expect(subject).toMatchObject({ key: "bookstore", label: "bookstores" });
      expect(subject?.searchTerms).toEqual(expect.arrayContaining(["bookstore", "book store", "bookshop", "bookseller"]));
      expect(subject?.searchTerms).not.toContain("books");
    },
  );

  it("routes the production bookstore question to business discovery", () => {
    expect(classifyKinfolkRequest("Can you tell me about bookstores in Atlanta GA", "Atlanta")).toMatchObject({
      route: "business_discovery",
      discoveryKind: "business",
      location: "Atlanta",
    });
  });

  it("does not interpret a generic bookstore category as an exact business name", async () => {
    const findExactByNormalizedName = vi.fn();
    const result = await resolveNamedBusinessTurn({
      message: "Can you tell me about bookstores in Atlanta GA",
      scope: { city: "Atlanta", stateCode: "GA" },
      existingMessages: [],
      repository: { findExactByNormalizedName } as never,
    });
    expect(result).toEqual({ state: "not_named" });
    expect(findExactByNormalizedName).not.toHaveBeenCalled();
  });

  it("does not turn a general question about books into a store search", () => {
    expect(deriveBusinessSubject("Tell me about books written in Atlanta GA")).toBeNull();
  });
});

describe("deterministic local business discovery", () => {
  it.each([
    ["Philadelphia", "PA", "restaurant", "restaurant"],
    ["Philadelphia", "PA", "bookstore", "bookstore"],
    ["Phoenix", "AZ", "HVAC contractors", "hvac"],
    ["Brooklyn", "NY", "bookstores", "bookstore"],
    ["Houston", "TX", "restaurants", "restaurant"],
    ["Toronto", "ON", "bookstores", "bookstore"],
  ])("uses canonical fixture data first for %s %s", async (city, stateCode, request, expectedSubject) => {
    const subject = deriveBusinessSubject(`Find ${request} in ${city} ${stateCode}`)!;
    expect(subject.key).toBe(expectedSubject);
    const record = { ...governedBusiness, id: `${city}-fixture`, city, stateCode, description: "" };
    const result = await discoverLocalBusinesses({
      scope: { city, stateCode },
      subject,
      repository: repository({ businesses: [record] }),
      webSearch: vi.fn().mockResolvedValue({ state: "unavailable", attempted: false, provider: null, results: [] }),
    });
    const listing = result.discovery.platformBusinesses[0]!;
    expect(listing).toMatchObject({ id: `${city}-fixture`, city, detailUrl: `/businesses/${city}-fixture` });
    expect(listing).not.toHaveProperty("hours");
    expect(listing).not.toHaveProperty("address");
    expect(result.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: `/businesses/${city}-fixture` }),
    ]));
    expect(result.reply).toContain("MWM public business listing");
  });

  it("returns the Toronto CA canonical shopping/Bookstore fixture for the MWM-only canary prompt", async () => {
    const prompt = "Find an MWM-listed bookstore in Toronto. Use MWM inventory only.";
    const subject = deriveBusinessSubject(prompt)!;
    const torontoFixture = {
      ...governedBusiness,
      id: "toronto-live-unclaimed",
      name: "Toronto Fixture Books",
      city: "Toronto",
      stateCode: "ON",
      country: "CA",
      category: "shopping",
      subcategory: "Bookstore",
      profileStatus: "live_unclaimed",
    };
    const result = await discoverLocalBusinesses({
      scope: { city: "Toronto", stateCode: "ON" },
      subject,
      repository: repository({ businesses: [torontoFixture] }),
      // “inventory only” must not need a web provider to return the canonical row.
      webSearch: vi.fn().mockResolvedValue({ state: "unavailable", attempted: false, provider: null, results: [] }),
    });
    expect(subject.key).toBe("bookstore");
    expect(result.discovery.platformBusinesses).toEqual([
      expect.objectContaining({
        id: "toronto-live-unclaimed", city: "Toronto", stateCode: "ON",
        category: "shopping", subcategory: "Bookstore", provenance: "mwm_public_business",
      }),
    ]);
    expect(result.recommendations?.businesses[0]).toMatchObject({
      id: "toronto-live-unclaimed", detailUrl: "/businesses/toronto-live-unclaimed",
    });
  });

  it("merges focused platform businesses, MWM map records, and supplemental web findings", async () => {
    const db = repository({ businesses: [governedBusiness], places: [forKeepsPlace] });
    const webSearch = vi.fn().mockResolvedValue({
      state: "completed",
      attempted: true,
      provider: "openai",
      results: [{
        title: "Official Atlanta bookstore guide",
        url: "https://discoveratlanta.com/bookstores",
        content: "Independent bookstores in Atlanta.",
        providerScore: 0.85,
        sourceQuery: { text: "bookstores Atlanta, GA", role: "general", reason: "neutral" },
      }],
    });

    const result = await discoverLocalBusinesses({
      scope: { city: "Atlanta", stateCode: "GA" },
      subject: bookstore,
      repository: db,
      webSearch,
    });

    expect(db.findBySubject).toHaveBeenCalledBefore(webSearch);
    expect(db.findPublishedMapEntities).toHaveBeenCalledBefore(webSearch);
    expect(webSearch).toHaveBeenCalledWith(
      [
        expect.objectContaining({ text: "community and minority-owned bookstores Atlanta, GA" }),
        expect.objectContaining({ text: "bookstores Atlanta, GA" }),
      ],
      false,
      { city: "Atlanta", stateCode: "GA", countryCode: "US" },
    );
    expect(result.recommendations).toMatchObject({
      destination: "Atlanta, GA",
      businesses: [{
        name: "Atlanta Reading Room",
        category: "Shopping",
        neighborhood: "Atlanta, GA",
      }],
      neighborhoods: [],
      events: [],
      safetyTips: [],
      localInsights: [],
    });
    expect(result.discovery.platformBusinesses[0]).toMatchObject({
      name: "Atlanta Reading Room",
      provenance: "mwm_public_business",
      verified: false,
    });
    expect(result.discovery.mapPlaces[0]).toMatchObject({
      title: "For Keeps Books and Auburn Avenue Bookstores",
      recordType: "mwm_cultural_place",
      isBusiness: false,
    });
    expect(result.discovery.webFindings[0]).toMatchObject({
      provenance: "external_web_finding",
      isMwmVerified: false,
      url: "https://discoveratlanta.com/bookstores",
    });
    expect(result.discovery.webSearch.provider).toBe("openai");
    expect(result.discovery.webSearch).toMatchObject({ fallbackUsed: false, partial: false });
    expect(result.reply).toContain("For Keeps Books and Auburn Avenue Bookstores");
    expect(result.reply).toContain("external; not MWM-verified business listings");
    expect(result.reply).not.toMatch(/\[[^\]]+\]\([^)]+\)/);
    expect(result.reply).not.toMatch(/you(?:'re| are) (?:Black|a woman|minority)/i);
    expect(result.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "For Keeps Books and Auburn Avenue Bookstores", url: forKeepsPlace.detailUrl }),
      expect.objectContaining({ title: "Official Atlanta bookstore guide", url: "https://discoveratlanta.com/bookstores" }),
    ]));
  });

  it("only makes a definitive no-results statement after platform and web both complete empty", async () => {
    const completed = await discoverLocalBusinesses({
      scope: { city: "Atlanta", stateCode: "GA" },
      subject: bookstore,
      repository: repository(),
      webSearch: vi.fn().mockResolvedValue({ state: "completed", attempted: true, provider: "openai", results: [] }),
    });
    expect(completed.reply).toContain("couldn’t find matching MWM records or current web results");

    const unavailable = await discoverLocalBusinesses({
      scope: { city: "Atlanta", stateCode: "GA" },
      subject: bookstore,
      repository: repository(),
      webSearch: vi.fn().mockResolvedValue({ state: "unavailable", attempted: false, provider: null, results: [] }),
    });
    expect(unavailable.reply).toContain("no web-search provider is configured");
    expect(unavailable.reply).not.toContain("or current web results");
  });

  it("returns a useful deterministic result when the web provider throws", async () => {
    const result = await discoverLocalBusinesses({
      scope: { city: "Atlanta", stateCode: "GA" },
      subject: bookstore,
      repository: repository({ places: [forKeepsPlace] }),
      webSearch: vi.fn().mockRejectedValue(Object.assign(new Error("rate limited"), { status: 429 })),
    });
    expect(result.discovery.webSearch.state).toBe("degraded");
    expect(result.discovery.webSearch).toMatchObject({ fallbackUsed: false, partial: false });
    expect(result.reply).toContain("For Keeps Books");
    expect(result.reply).toContain("provider error");
    expect(result.recommendations).toBeNull();
  });

  it("records only coarse search, gap, and confirmed zero-result aggregates", async () => {
    const signalRepository = {
      recordCoverageGap: vi.fn().mockResolvedValue(undefined),
      recordFlywheelSignal: vi.fn().mockResolvedValue(undefined),
    };
    await discoverLocalBusinesses({
      scope: { city: "Atlanta", stateCode: "GA" },
      subject: bookstore,
      repository: repository(),
      signalRepository,
      webSearch: vi.fn().mockResolvedValue({ state: "completed", attempted: true, provider: "openai", results: [] }),
    });

    expect(signalRepository.recordCoverageGap).toHaveBeenCalledWith(expect.objectContaining({
      city: "atlanta",
      stateCode: "GA",
      category: "bookstore",
      specialty: "bookstore",
    }));
    expect(signalRepository.recordFlywheelSignal.mock.calls.map(([signal]) => signal.action)).toEqual([
      "search",
      "zero_result",
    ]);
    const serialized = JSON.stringify([
      ...signalRepository.recordCoverageGap.mock.calls,
      ...signalRepository.recordFlywheelSignal.mock.calls,
    ]);
    expect(serialized).not.toContain("Can you tell me");
    expect(serialized).not.toMatch(/latitude|longitude|coordinates/i);
  });
});

describe("local web provider-state contract", () => {
  const queries = buildBusinessDiscoveryWebQueries(bookstore, { city: "Atlanta", stateCode: "GA" });

  it("returns unavailable without making a request when neither provider is configured", async () => {
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "");
    vi.stubEnv("TAVILY_API_KEY", "");
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    await expect(searchLocalBusinessQueriesWithState(queries, false)).resolves.toEqual({
      state: "unavailable",
      attempted: false,
      attempts: [],
      providerAttempted: false,
      providerUsed: false,
      provider: null,
      fallbackUsed: false,
      partial: false,
      failure: "not_configured",
      results: [],
    });
    expect(responsesCreate).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the provisioned OpenAI web tool first and returns sanitized visible citations", async () => {
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "test-key");
    vi.stubEnv("TAVILY_API_KEY", "fallback-key");
    responsesCreate.mockResolvedValue({
      output_text: "A current independent bookstore result.",
      output: [{
        type: "message",
        content: [{
          annotations: [{
            title: "Official bookstore",
            url: "https://bookstore.example.com/?utm_source=openai#hours",
          }],
        }],
      }],
    });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const result = await searchLocalBusinessQueriesWithState(
      queries,
      false,
      { city: "Atlanta", stateCode: "GA", countryCode: "US" },
    );

    expect(result).toMatchObject({ state: "completed", attempted: true, provider: "openai" });
    expect(result.results[0]).toMatchObject({
      title: "Official bookstore",
      url: "https://bookstore.example.com/",
    });
    expect(responsesCreate).toHaveBeenCalledWith(expect.objectContaining({
      tools: [expect.objectContaining({
        type: "web_search",
        user_location: { type: "approximate", city: "Atlanta", region: "GA", country: "US" },
      })],
      reasoning: { effort: "low" },
    }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps each local-business citation attached to the exact query that produced it", async () => {
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "test-key");
    vi.stubEnv("TAVILY_API_KEY", "");
    responsesCreate.mockImplementation(async (request: { input?: string }) => {
      const isCommunity = String(request.input).includes("community and minority-owned");
      const text = isCommunity ? "Community evidence." : "Neutral evidence.";
      return {
        output: [{ type: "message", content: [{ text, annotations: [{
          title: isCommunity ? "Community source" : "Neutral source",
          url: isCommunity ? "https://community.example.com/source" : "https://neutral.example.com/source",
          start_index: 0,
          end_index: text.length,
        }] }] }],
      };
    });

    const result = await searchLocalBusinessQueriesWithState(queries, false);
    expect(responsesCreate).toHaveBeenCalledTimes(2);
    expect(result.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "Community source", content: "Community evidence.", sourceQuery: expect.objectContaining({ role: "community_primary" }) }),
      expect.objectContaining({ title: "Neutral source", content: "Neutral evidence.", sourceQuery: expect.objectContaining({ role: "general" }) }),
    ]));
  });

  it("uses a general-current prompt for ordinary news and falls back when OpenAI returns no citations", async () => {
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "test-key");
    vi.stubEnv("TAVILY_API_KEY", "fallback-key");
    responsesCreate.mockResolvedValue({ output_text: "Uncited provider text.", output: [] });
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{
      title: "Official update",
      url: "https://maryland.gov/news",
      content: "Current official update.",
      score: 0.9,
    }] }), { status: 200 }));

    const result = await searchAllQueriesWithState([{ text: "current Maryland news", role: "general", reason: "current" }], false);
    const request = responsesCreate.mock.calls[0]?.[0] as { input?: string };
    expect(String(request.input)).toContain("current-information question");
    expect(String(request.input)).not.toContain("current local-business options");
    expect(String(request.input)).not.toContain("minority-owned query");
    expect(result).toMatchObject({ state: "degraded", attempted: true, provider: "tavily", fallbackUsed: true, partial: false });
    expect(result.results[0]).toMatchObject({ title: "Official update", url: "https://maryland.gov/news" });
  });

  it("falls back only for an OpenAI query with zero citations and reports mixed degraded coverage", async () => {
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "test-key");
    vi.stubEnv("TAVILY_API_KEY", "fallback-key");
    responsesCreate.mockImplementation(async (request: { input?: string }) => {
      if (String(request.input).includes("community and minority-owned")) {
        return { output: [{ type: "message", content: [{ text: "Primary result.", annotations: [{
          title: "Primary source", url: "https://primary.example.com/a", start_index: 0, end_index: 15,
        }] }] }] };
      }
      return { output_text: "Uncited", output: [] };
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{
      title: "Fallback source", url: "https://fallback.example.com/b", content: "Fallback evidence.", score: 0.8,
    }] }), { status: 200 }));
    globalThis.fetch = fetchMock;

    const result = await searchLocalBusinessQueriesWithState(queries, false);
    expect(responsesCreate).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ state: "degraded", attempted: true, provider: "mixed", fallbackUsed: true, partial: false });
    expect(result.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "Primary source", sourceQuery: expect.objectContaining({ role: "community_primary" }) }),
      expect.objectContaining({ title: "Fallback source", sourceQuery: expect.objectContaining({ role: "general" }) }),
    ]));
  });

  it("falls back to Tavily and distinguishes zero results from provider failure", async () => {
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "");
    vi.stubEnv("TAVILY_API_KEY", "test-key");
    globalThis.fetch = vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    const noCitations = await searchLocalBusinessQueriesWithState(queries, false);
    expect(noCitations).toMatchObject({
      state: "degraded", attempted: true, providerAttempted: true, providerUsed: true,
      provider: "tavily", failure: "no_citations", results: [],
    });

    globalThis.fetch = vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502 }));
    const degraded = await searchLocalBusinessQueriesWithState(queries, false);
    expect(degraded).toMatchObject({
      state: "unavailable", attempted: true, providerAttempted: true, providerUsed: false,
      provider: "tavily", failure: "provider_error", results: [],
    });
  });

  it("treats malformed Tavily JSON as degraded and skips malformed result rows", async () => {
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "");
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "");
    vi.stubEnv("TAVILY_API_KEY", "test-key");
    globalThis.fetch = vi.fn().mockImplementation(async () =>
      new Response("not-json", { status: 200 }),
    );
    await expect(searchLocalBusinessQueriesWithState(queries, false)).resolves.toMatchObject({
      state: "unavailable",
      attempted: true,
      providerAttempted: true,
      providerUsed: false,
      provider: "tavily",
      failure: "provider_error",
      results: [],
    });

    globalThis.fetch = vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify({ results: [{ title: 42, url: true }] }), { status: 200 }),
    );
    await expect(searchLocalBusinessQueriesWithState(queries, false)).resolves.toMatchObject({
      state: "degraded",
      attempted: true,
      providerAttempted: true,
      providerUsed: true,
      provider: "tavily",
      failure: "no_citations",
      results: [],
    });
  });
});
