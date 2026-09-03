/**
 * Kinfolk live web search adapter.
 *
 * OpenAI Responses web search is the primary provider because Kinfolk already
 * has a server-side OpenAI integration. Tavily remains a compatible fallback
 * when configured. Provider failures never become false "no results" claims.
 */

import { openai } from "@workspace/integrations-openai-ai-server";
import type { SearchQuery } from "./lens-planner.js";
import { enforceDiasporaFirstProviderQuery } from "./diasporaFirstResearchPolicy.js";

export type WebResult = {
  title: string;
  url: string;
  content: string;
  providerScore: number;
  favicon?: string;
  sourceQuery: SearchQuery;
};

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  favicon?: string;
};

type TavilySearchResponse = {
  results?: TavilyResult[];
};

export class SearchProviderError extends Error {}

export type WebSearchState = "completed" | "unavailable" | "degraded";
export type WebSearchProvider = "openai" | "tavily";

export type WebSearchOutcome = Readonly<{
  state: WebSearchState;
  attempted: boolean;
  provider: WebSearchProvider | null;
  results: WebResult[];
}>;

type WebSearchBatch = Readonly<{
  state: Exclude<WebSearchState, "unavailable">;
  results: WebResult[];
}>;

type SearchLocation = Readonly<{
  city: string;
  stateCode: string;
  countryCode?: string;
}>;

function normalizedQueries(queries: SearchQuery[]): SearchQuery[] {
  return queries.map((query) => ({
    ...query,
    text: enforceDiasporaFirstProviderQuery(query.text),
  }));
}

function cleanCitationUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.searchParams.delete("utm_source");
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function openAiConfigured(): boolean {
  return Boolean(
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim() &&
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim(),
  );
}

function openAiWebSearchModel(): string {
  return process.env.KINFOLK_WEB_SEARCH_MODEL?.trim()
    || process.env.KINFOLK_STAFF_DEMO_MODEL?.trim()
    || "gpt-5";
}

function responseCitations(response: unknown, queries: SearchQuery[]): WebResult[] {
  const record = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const output = Array.isArray(record.output) ? record.output : [];
  const outputText = typeof record.output_text === "string" ? record.output_text : "";
  const sourceQuery = queries[0] ?? {
    text: "local business research",
    role: "general" as const,
    reason: "Live web research",
  };
  const seen = new Set<string>();
  const results: WebResult[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const itemRecord = item as Record<string, unknown>;
    if (itemRecord.type !== "message" || !Array.isArray(itemRecord.content)) continue;
    for (const content of itemRecord.content) {
      if (!content || typeof content !== "object") continue;
      const annotations = (content as Record<string, unknown>).annotations;
      if (!Array.isArray(annotations)) continue;
      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const citation = annotation as Record<string, unknown>;
        const rawUrl = typeof citation.url === "string" ? citation.url : "";
        const title = typeof citation.title === "string" ? citation.title.trim() : "";
        const url = cleanCitationUrl(rawUrl);
        if (!url || !title || seen.has(url)) continue;
        seen.add(url);
        results.push({
          title,
          url,
          content: outputText,
          providerScore: 0.8,
          sourceQuery,
        });
      }
    }
  }
  return results;
}

async function searchWithOpenAi(
  queries: SearchQuery[],
  location?: SearchLocation,
): Promise<WebSearchOutcome> {
  if (!openAiConfigured()) {
    return { state: "unavailable", attempted: false, provider: null, results: [] };
  }
  const safeQueries = normalizedQueries(queries);
  const queryList = safeQueries.map((query) => `- ${query.text}`).join("\n");
  const userLocation = location ? {
    type: "approximate",
    city: location.city,
    region: location.stateCode,
    country: location.countryCode ?? "US",
  } : undefined;

  try {
    const response = await openai.responses.create({
      model: openAiWebSearchModel(),
      tools: [{
        type: "web_search",
        search_context_size: "medium",
        ...(userLocation ? { user_location: userLocation } : {}),
      }],
      input: [
        "Research current local-business options for the following queries:",
        queryList,
        "Prefer official business websites, official tourism/chamber sources, and reputable local reporting.",
        "Do not infer the searcher's identity. A community or minority-owned query is a business-discovery criterion, not a claim about the member.",
        "Return concise factual findings with web citations. Do not invent ownership, verification, hours, or addresses.",
      ].join("\n"),
      reasoning: { effort: "low" },
      max_output_tokens: 1600,
    } as never, { signal: AbortSignal.timeout(12_000) });
    return {
      state: "completed",
      attempted: true,
      provider: "openai",
      results: responseCitations(response, safeQueries),
    };
  } catch {
    return { state: "degraded", attempted: true, provider: "openai", results: [] };
  }
}

/** Calls Tavily for one query when the fallback provider is configured. */
async function searchTavilyQuery(query: SearchQuery, imageRequested: boolean): Promise<WebSearchBatch> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { state: "degraded", results: [] };
  const providerQuery = enforceDiasporaFirstProviderQuery(query.text);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: providerQuery,
        search_depth: query.role === "evidence" ? "advanced" : "basic",
        max_results: 5,
        include_raw_content: false,
        include_images: imageRequested || query.role === "image",
        include_image_descriptions: imageRequested || query.role === "image",
        safe_search: true,
        topic: "general",
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return { state: "degraded", results: [] };
    const payload = (await response.json()) as TavilySearchResponse;
    if (!payload || (payload.results !== undefined && !Array.isArray(payload.results))) {
      return { state: "degraded", results: [] };
    }
    return {
      state: "completed",
      results: (payload.results ?? [])
        .filter((result): result is TavilyResult & { title: string; url: string } =>
          typeof result?.title === "string" && result.title.trim().length > 0 &&
          typeof result?.url === "string" && result.url.trim().length > 0)
        .flatMap((result) => {
          const url = cleanCitationUrl(result.url);
          if (!url) return [];
          return [{
            title: result.title,
            url,
            content: typeof result.content === "string" ? result.content : "",
            providerScore: typeof result.score === "number" && Number.isFinite(result.score) ? result.score : 0,
            favicon: typeof result.favicon === "string" ? result.favicon : undefined,
            sourceQuery: { ...query, text: providerQuery },
          }];
        }),
    };
  } catch {
    return { state: "degraded", results: [] };
  }
}

async function searchWithTavily(
  queries: SearchQuery[],
  imageRequested: boolean,
): Promise<WebSearchOutcome> {
  if (!process.env.TAVILY_API_KEY) {
    return { state: "unavailable", attempted: false, provider: null, results: [] };
  }
  const batches = await Promise.all(queries.map((query) => searchTavilyQuery(query, imageRequested)));
  const seen = new Set<string>();
  const results = batches.flatMap((batch) => batch.results).filter((result) => {
    if (seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });
  return {
    state: batches.some((batch) => batch.state === "degraded") ? "degraded" : "completed",
    attempted: true,
    provider: "tavily",
    results,
  };
}

/**
 * Local-business research uses the already-provisioned OpenAI integration first.
 * If its web tool is unavailable, Tavily is an optional compatibility fallback.
 */
export async function searchLocalBusinessQueriesWithState(
  queries: SearchQuery[],
  imageRequested: boolean,
  location?: SearchLocation,
): Promise<WebSearchOutcome> {
  if (queries.length === 0) {
    return { state: "completed", attempted: false, provider: null, results: [] };
  }

  const openAiOutcome = await searchWithOpenAi(queries, location);
  if (openAiOutcome.state === "completed") return openAiOutcome;

  const tavilyOutcome = await searchWithTavily(queries, imageRequested);
  if (tavilyOutcome.state !== "unavailable") return tavilyOutcome;

  return openAiOutcome.state === "unavailable"
    ? { state: "unavailable", attempted: false, provider: null, results: [] }
    : openAiOutcome;
}

/**
 * Existing general/current-information research retains the established Tavily
 * adapter. This avoids silently changing evidence semantics for high-stakes
 * routes while local-business discovery is repaired.
 */
export async function searchAllQueriesWithState(
  queries: SearchQuery[],
  imageRequested: boolean,
): Promise<WebSearchOutcome> {
  if (queries.length === 0) {
    return { state: "completed", attempted: false, provider: null, results: [] };
  }
  return searchWithTavily(queries, imageRequested);
}

/** Compatibility API for callers that only consume result rows. */
export async function searchAllQueries(
  queries: SearchQuery[],
  imageRequested: boolean,
): Promise<WebResult[]> {
  return (await searchAllQueriesWithState(queries, imageRequested)).results;
}
