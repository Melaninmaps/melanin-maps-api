import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAiLibraryWriter } from "../openAiLibraryWriter";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

const draft = {
  title: "UTC",
  summary: "A time standard.",
  body: "Coordinated Universal Time is an international time standard.",
  citedSourceIndexes: [0],
  relatedQuestions: ["How is UTC maintained?"],
};

async function requestFor(model: string): Promise<Record<string, unknown>> {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(draft) } }],
  }), { status: 200 }));
  globalThis.fetch = fetchMock;
  await createOpenAiLibraryWriter({
    apiKey: "test-key",
    baseUrl: "https://provider.example/v1/",
    model,
  }).writeStructured({
    question: "What is UTC?",
    domain: "general",
    communityLens: "general",
    locationLabel: null,
    disclaimer: null,
    sources: [{
      url: "https://www.nist.gov/utc",
      title: "UTC",
      content: "Coordinated Universal Time is maintained internationally.",
      publisher: "NIST",
      publishedAt: null,
    }],
  });
  expect(fetchMock).toHaveBeenCalledWith("https://provider.example/v1/chat/completions", expect.any(Object));
  return JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
}

describe("OpenAI Library writer request compatibility", () => {
  it("uses the shared GPT-5-family shape for the configurable synthesis model", async () => {
    const body = await requestFor("gpt-5-mini");
    expect(body).toMatchObject({
      model: "gpt-5-mini",
      max_completion_tokens: 1500,
      response_format: { type: "json_schema", json_schema: { name: "library_research_entry", strict: true } },
    });
    expect(body).not.toHaveProperty("max_tokens");
    expect(body).not.toHaveProperty("temperature");
  });

  it("uses the shared legacy shape for an approved legacy synthesis model", async () => {
    const body = await requestFor("gpt-4o-mini");
    expect(body).toMatchObject({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      response_format: { type: "json_schema" },
    });
    expect(body).not.toHaveProperty("max_completion_tokens");
  });
});
