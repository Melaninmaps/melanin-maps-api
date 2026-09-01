import { afterEach, describe, expect, it, vi } from "vitest";
import { enforceDiasporaFirstProviderQuery } from "../kinfolk/diasporaFirstResearchPolicy";
import { searchAllQueries } from "../kinfolk/web-search";
import { createTavilyResearchProvider } from "../library/tavilyResearchProvider";

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.unstubAllEnvs();
  globalThis.fetch = originalFetch;
});

describe("enforceDiasporaFirstProviderQuery", () => {
  it("keeps a raw health query condition-first without a demographic default", () => {
    expect(enforceDiasporaFirstProviderQuery("heart disease")).toBe("heart disease");
  });

  it("keeps a STEM query neutral and normalizes whitespace", () => {
    expect(enforceDiasporaFirstProviderQuery("  STEM  opportunities in Charlotte  ")).toBe(
      "STEM opportunities in Charlotte",
    );
    expect(enforceDiasporaFirstProviderQuery("general research on STEM opportunities")).toBe(
      "general research on STEM opportunities",
    );
  });

  it("preserves a member's explicit current-turn population wording", () => {
    expect(enforceDiasporaFirstProviderQuery("Latina maternal health resources")).toBe(
      "Latina maternal health resources",
    );
  });
});

describe("Tavily provider boundaries", () => {
  it("normalizes direct Kinfolk web-search request bodies", async () => {
    vi.stubEnv("TAVILY_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    globalThis.fetch = fetchMock;

    await searchAllQueries(
      [{ text: "Michelle Williams Destiny's Child singer", role: "entity", reason: "entity" }],
      false,
    );

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.query).toBe("Michelle Williams Destiny's Child singer");
  });

  it("normalizes Living Library provider request bodies without double-prefixing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    globalThis.fetch = fetchMock;
    const provider = createTavilyResearchProvider("test-key");

    await provider.search({
      query: "Black women heart disease",
      allowedDomains: [],
      maxResults: 2,
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.query).toBe("Black women heart disease");
  });
});