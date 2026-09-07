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
import { kinfolkModel } from "./model-config.js";
import { canonicalizeContextualUrl } from "./contextual-url.js";

export type WebResult = {
  title: string;
  url: string;
  content: string;
  providerScore: number;
  /** Citation metadata returned by the provider; never guessed. */
  publisher?: string;
  sourceDate?: string;
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
export type WebSearchProvider = "openai" | "tavily" | "mixed";

export type WebSearchOutcome = Readonly<{
  state: WebSearchState;
  attempted: boolean;
  provider: WebSearchProvider | null;
  fallbackUsed?: boolean;
  partial?: boolean;
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

type WebResearchPurpose = "local_business" | "general_current";

function normalizedQueries(queries: SearchQuery[]): SearchQuery[] {
  return queries.map((query) => ({
    ...query,
    text: enforceDiasporaFirstProviderQuery(query.text),
  }));
}

function cleanCitationUrl(value: string): string | null {
  return canonicalizeContextualUrl(value);
}

function openAiConfigured(): boolean {
  return Boolean(
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim() &&
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim(),
  );
}

function openAiWebSearchModel(): string {
  return kinfolkModel("webSearch");
}

function citationPublisher(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

/** Parse only provider-returned citation fields into clickable HTTPS objects. */
export function parseOpenAiResponseCitations(response: unknown, queries: SearchQuery[]): WebResult[] {
  const record = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const output = Array.isArray(record.output) ? record.output : [];
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
      const contentRecord = content as Record<string, unknown>;
      const contentText = typeof contentRecord.text === "string" ? contentRecord.text : "";
      const annotations = contentRecord.annotations;
      if (!Array.isArray(annotations)) continue;
      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const citation = annotation as Record<string, unknown>;
        const rawUrl = typeof citation.url === "string" ? citation.url : "";
        const title = typeof citation.title === "string" ? citation.title.trim() : "";
        const startIndex = typeof citation.start_index === "number" ? citation.start_index : null;
        const endIndex = typeof citation.end_index === "number" ? citation.end_index : null;
        const supportText = startIndex !== null && endIndex !== null
          && startIndex >= 0 && endIndex > startIndex && endIndex <= contentText.length
          ? contentText.slice(startIndex, endIndex).trim()
          : "";
        const url = cleanCitationUrl(rawUrl);
        if (!url || !title || seen.has(url)) continue;
        seen.add(url);
        results.push({
          title,
          url,
          content: supportText,
          providerScore: 0.8,
          publisher: typeof citation.publisher === "string" && citation.publisher.trim()
            ? citation.publisher.trim() : citationPublisher(url),
          sourceDate: typeof citation.published_at === "string" && citation.published_at.trim()
            ? citation.published_at.trim() : undefined,
          sourceQuery,
        });
      }
    }
  }
  return results;
}

async function searchOpenAiQuery(
  query: SearchQuery,
  purpose: WebResearchPurpose,
  location?: SearchLocation,
): Promise<WebSearchBatch> {
  const userLocation = location ? {
    type: "approximate",
    city: location.city,
    region: location.stateCode,
    country: location.countryCode ?? "US",
  } : undefined;

  try {
    const model = openAiWebSearchModel();
    const response = await openai.responses.create({
      model,
      tools: [{
        type: "web_search",
        search_context_size: "medium",
        ...(userLocation ? { user_location: userLocation } : {}),
      }],
      input: [
        purpose === "local_business"
          ? "Research current local-business options for this query:"
          : "Research this current-information question:",
        query.text,
        purpose === "local_business"
          ? "Prefer official business websites, official tourism/chamber sources, and reputable local reporting."
          : "Prefer current authoritative primary sources and reputable reporting appropriate to the question.",
        purpose === "local_business"
          ? "Do not infer the searcher's identity. A community or minority-owned query is a business-discovery criterion, not a claim about the member."
          : "Do not infer the searcher's identity or add a cultural lens unless the question or supplied preference explicitly calls for it.",
        purpose === "local_business"
          ? "Return concise factual findings with web citations. Do not invent ownership, verification, hours, or addresses."
          : "Return a concise current answer with web citations. Distinguish confirmed facts from disputed or changing claims.",
      ].join("\n"),
      reasoning: { effort: "low" },
      max_output_tokens: 900,
    } as never, { signal: AbortSignal.timeout(12_000) });
    const results = parseOpenAiResponseCitations(response, [query]);
    return { state: results.length > 0 ? "completed" : "degraded", results };
  } catch {
    return { state: "degraded", results: [] };
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

type QuerySearchOutcome = Readonly<{
  state: WebSearchState;
  attempted: boolean;
  provider: Exclude<WebSearchProvider, "mixed"> | null;
  fallbackUsed: boolean;
  results: WebResult[];
}>;

async function searchQueryWithFallback(
  query: SearchQuery,
  purpose: WebResearchPurpose,
  imageRequested: boolean,
  location?: SearchLocation,
): Promise<QuerySearchOutcome> {
  const safeQuery = normalizedQueries([query])[0] ?? query;
  const hasOpenAi = openAiConfigured();
  const hasTavily = Boolean(process.env.TAVILY_API_KEY);

  if (hasOpenAi) {
    const primary = await searchOpenAiQuery(safeQuery, purpose, location);
    if (primary.state === "completed" && primary.results.length > 0) {
      return { state: "completed", attempted: true, provider: "openai", fallbackUsed: false, results: primary.results };
    }
    if (hasTavily) {
      const fallback = await searchTavilyQuery(safeQuery, imageRequested);
      return {
        state: "degraded",
        attempted: true,
        provider: "tavily",
        fallbackUsed: true,
        results: fallback.results,
      };
    }
    return { state: "degraded", attempted: true, provider: "openai", fallbackUsed: false, results: [] };
  }

  if (hasTavily) {
    const fallback = await searchTavilyQuery(safeQuery, imageRequested);
    return {
      state: fallback.state,
      attempted: true,
      provider: "tavily",
      fallbackUsed: false,
      results: fallback.results,
    };
  }
  return { state: "unavailable", attempted: false, provider: null, fallbackUsed: false, results: [] };
}

async function searchQueriesWithState(
  queries: SearchQuery[],
  purpose: WebResearchPurpose,
  imageRequested: boolean,
  location?: SearchLocation,
): Promise<WebSearchOutcome> {
  if (queries.length === 0) {
    return { state: "completed", attempted: false, provider: null, fallbackUsed: false, partial: false, results: [] };
  }
  const outcomes = await Promise.all(
    queries.map((query) => searchQueryWithFallback(query, purpose, imageRequested, location)),
  );
  const providers = new Set(outcomes.flatMap((outcome) => outcome.provider ? [outcome.provider] : []));
  const resultful = outcomes.filter((outcome) => outcome.results.length > 0).length;
  const partial = resultful > 0 && resultful < outcomes.length;
  const attempted = outcomes.some((outcome) => outcome.attempted);
  const fallbackUsed = outcomes.some((outcome) => outcome.fallbackUsed);
  const degraded = partial || fallbackUsed || outcomes.some((outcome) => outcome.state === "degraded");
  const results = outcomes.flatMap((outcome) => outcome.results);
  return {
    state: !attempted ? "unavailable" : degraded ? "degraded" : "completed",
    attempted,
    provider: providers.size > 1 ? "mixed" : providers.values().next().value ?? null,
    fallbackUsed,
    partial,
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
  return searchQueriesWithState(queries, "local_business", imageRequested, location);
}

/**
 * Current-information research uses the OpenAI Responses web_search tool first.
 * Tavily remains an optional fallback only when that research attempt fails.
 */
export async function searchAllQueriesWithState(
  queries: SearchQuery[],
  imageRequested: boolean,
): Promise<WebSearchOutcome> {
  return searchQueriesWithState(queries, "general_current", imageRequested);
}

/** Compatibility API for callers that only consume result rows. */
export async function searchAllQueries(
  queries: SearchQuery[],
  imageRequested: boolean,
): Promise<WebResult[]> {
  return (await searchAllQueriesWithState(queries, imageRequested)).results;
}
