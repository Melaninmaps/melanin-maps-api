import { afterEach, describe, expect, it, vi } from "vitest";
import { boundedLibraryResearchModel, createOpenAiWebResearchProvider } from "../openAiWebResearchProvider";
import { createResearchProviderChain, LibraryResearchProviderUnavailableError } from "../researchProviderChain";
import type { ExternalResearchProvider } from "../types";

afterEach(() => vi.unstubAllGlobals());

describe("OpenAI Responses native Library research", () => {
  it("uses a bounded model, low reasoning, web_search filters, and no inferred identity prefix", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output: [
      { type: "web_search_call", action: { sources: [{ url: "https://www.loc.gov/item/a", title: "Library of Congress" }, { url: "https://www.si.edu/item/b", title: "Smithsonian" }] } },
      { type: "message", content: [{ type: "output_text", text: "A cited historical overview. ".repeat(10), annotations: [{ type: "url_citation", url: "https://www.loc.gov/item/a", title: "Library of Congress" }, { type: "url_citation", url: "https://www.si.edu/item/b", title: "Smithsonian" }] }] },
    ] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = createOpenAiWebResearchProvider({ apiKey: "secret", baseUrl: "https://api.openai.example/v1", model: "unbounded-model" });
    const result = await provider.search({ query: "oldest bookstore in the US", allowedDomains: ["loc.gov", "si.edu", "*.gov"], maxResults: 6 });
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(boundedLibraryResearchModel("unbounded-model")).toBe("gpt-5-mini");
    expect(body).toMatchObject({ model: "gpt-5-mini", reasoning: { effort: "low" }, tools: [{ type: "web_search", filters: { allowed_domains: ["loc.gov", "si.edu"] } }], include: ["web_search_call.action.sources"] });
    expect(body.input[1].content).toBe("oldest bookstore in the US");
    expect(JSON.stringify(body.input)).not.toMatch(/the member is|black women and minority women/i);
    expect(result.documents).toHaveLength(2);
  });

  it("does not promote merely consulted URLs to cited evidence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ output: [
      { type: "web_search_call", action: { sources: [{ url: "https://www.loc.gov/item/a", title: "Library of Congress" }] } },
      { type: "message", content: [{ type: "output_text", text: "An uncited answer.", annotations: [] }] },
    ] }), { status: 200 })));
    const provider = createOpenAiWebResearchProvider({ apiKey: "secret", baseUrl: "https://api.openai.example/v1" });
    await expect(provider.search({ query: "oldest bookstore in the US", allowedDomains: ["loc.gov"], maxResults: 6 }))
      .rejects.toThrow(/no safe cited sources/i);
  });

  it("forwards the caller AbortSignal to the native web request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output: [
      { type: "message", content: [{ type: "output_text", text: "Cited.", annotations: [{ type: "url_citation", url: "https://loc.gov/a", title: "LOC" }] }] },
    ] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    const provider = createOpenAiWebResearchProvider({ apiKey: "secret", baseUrl: "https://api.openai.example/v1" });
    await provider.search({ query: "history", allowedDomains: ["loc.gov"], maxResults: 2, signal: controller.signal });
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });
});

describe("Library research provider chain", () => {
  const document = (url: string) => ({ url, title: url, content: "Evidence ".repeat(30), publisher: new URL(url).hostname, publishedAt: null });

  it("marks a successful configured fallback as degraded", async () => {
    const primary: ExternalResearchProvider = { name: "openai", search: vi.fn().mockRejectedValue(new Error("primary down")) };
    const fallback: ExternalResearchProvider = { name: "tavily", search: vi.fn().mockResolvedValue({ documents: [document("https://loc.gov/a"), document("https://si.edu/b")], provider: "tavily", status: "available" }) };
    const result = await createResearchProviderChain([primary, fallback]).search({ query: "history", allowedDomains: ["loc.gov", "si.edu"], maxResults: 6 });
    expect(result).toMatchObject({ provider: "tavily", status: "degraded" });
  });

  it("throws a retryable unavailable error rather than returning zero results", async () => {
    const primary: ExternalResearchProvider = { name: "openai", search: vi.fn().mockResolvedValue({ documents: [], provider: "openai", status: "available" }) };
    await expect(createResearchProviderChain([primary]).search({ query: "history", allowedDomains: ["loc.gov"], maxResults: 6 })).rejects.toBeInstanceOf(LibraryResearchProviderUnavailableError);
  });

  it("does not start a fallback provider after cancellation", async () => {
    const controller = new AbortController();
    const primary: ExternalResearchProvider = { name: "openai", search: vi.fn().mockImplementation(async () => { controller.abort(); throw new Error("cancelled"); }) };
    const fallback: ExternalResearchProvider = { name: "tavily", search: vi.fn() };
    await expect(createResearchProviderChain([primary, fallback]).search({ query: "history", allowedDomains: ["loc.gov"], maxResults: 6, signal: controller.signal }))
      .rejects.toThrow(/cancelled/i);
    expect(fallback.search).not.toHaveBeenCalled();
  });
});
