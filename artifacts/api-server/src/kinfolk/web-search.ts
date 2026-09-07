/**
 * Kinfolk live web research adapter.
 *
 * Only URL-citation annotations returned by OpenAI's Responses web_search tool
 * become result rows. Model prose and consulted-source lists are not evidence.
 */

import { openai } from "@workspace/integrations-openai-ai-server";
import type { SearchQuery } from "./lens-planner.js";
import { enforceDiasporaFirstProviderQuery } from "./diasporaFirstResearchPolicy.js";
import { kinfolkModel } from "./model-config.js";
import { kinfolkTavilyApiKey } from "./provider-config.js";
import { canonicalizeContextualUrl } from "./contextual-url.js";

export type WebResult = {
  title: string;
  url: string;
  content: string;
  providerScore: number;
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

type TavilySearchResponse = { results?: TavilyResult[] };

export class SearchProviderError extends Error {}

export type WebSearchState = "completed" | "unavailable" | "degraded";
// Legacy values remain in the type because the route also reports a separate
// contextual-research trace. This adapter itself only returns "openai".
export type WebSearchProvider = "openai" | "tavily" | "mixed";
export type WebSearchFailure = "not_configured" | "provider_error" | "no_citations";

export type WebSearchOutcome = Readonly<{
  state: WebSearchState;
  /** @deprecated Use providerAttempted. Retained for existing route callers. */
  attempted: boolean;
  providerAttempted?: boolean;
  /** The provider returned a response, even when it had no citations. */
  providerUsed?: boolean;
  provider: WebSearchProvider | null;
  /** No uncited-source fallback is permitted. */
  fallbackUsed: boolean;
  /** Some, but not all, requested queries returned safe citations. */
  partial: boolean;
  /** Keeps an outage distinct from a valid response with no information. */
  failure?: WebSearchFailure;
  /** Sanitized provider state only; never response bodies, URLs, or errors. */
  attempts?: ReadonlyArray<Readonly<{
    provider: Exclude<WebSearchProvider, "mixed">;
    used: boolean;
    outcome: WebSearchBatch["kind"];
  }>>;
  results: WebResult[];
}>;

type WebSearchBatch = Readonly<{
  kind: "cited" | "no_citations" | "provider_error";
  results: WebResult[];
}>;

type SearchLocation = Readonly<{
  city: string;
  stateCode: string;
  countryCode?: string;
}>;

type WebResearchPurpose = "local_business" | "general_current";

// Real Responses web-search calls can legitimately exceed 12 seconds while the
// provider gathers and cites sources. Keep this bounded, but align it with the
// independently exercised provider-readiness timeout to avoid false outages.
export const KINFOLK_OPENAI_WEB_SEARCH_TIMEOUT_MS = 30_000;
// GPT-5-family web research consumes reasoning tokens from this same budget.
// The former 900-token ceiling completed tool calls but ended before emitting a
// message or citations. This matches the real provider-readiness probe.
export const KINFOLK_OPENAI_WEB_SEARCH_MAX_OUTPUT_TOKENS = 4_000;

function openAiConfigured(): boolean {
  return Boolean(
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim()
    && process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim(),
  );
}

function citationPublisher(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

/**
 * Extract only OpenAI's explicit `url_citation` annotations. URL validation
 * retains the contextual URL guard against credentials, IP/private hosts, and
 * non-HTTPS schemes before any link is exposed to callers.
 */
export function parseOpenAiResponseCitations(response: unknown, queries: SearchQuery[]): WebResult[] {
  const record = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const output = Array.isArray(record.output) ? record.output : [];
  const sourceQuery = queries[0] ?? {
    text: "current web research",
    role: "general" as const,
    reason: "Live web research",
  };
  const seen = new Set<string>();
  const results: WebResult[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const partRecord = part as Record<string, unknown>;
      const text = typeof partRecord.text === "string" ? partRecord.text : "";
      if (!Array.isArray(partRecord.annotations)) continue;
      for (const annotation of partRecord.annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const citation = annotation as Record<string, unknown>;
        // Responses SDK payloads identify these as url_citation. Older gateway
        // serializations omit `type` but retain them in `annotations`; a known
        // non-citation annotation is never promoted to a source.
        if ((citation.type !== undefined && citation.type !== "url_citation") || typeof citation.url !== "string") continue;
        const url = canonicalizeContextualUrl(citation.url);
        if (!url || seen.has(url)) continue;
        const start = typeof citation.start_index === "number" ? citation.start_index : -1;
        const end = typeof citation.end_index === "number" ? citation.end_index : -1;
        const supportText = start >= 0 && end > start && end <= text.length
          ? text.slice(start, end).trim()
          : "";
        seen.add(url);
        results.push({
          title: typeof citation.title === "string" && citation.title.trim()
            ? citation.title.trim()
            : citationPublisher(url),
          url,
          content: supportText,
          providerScore: 0.8,
          publisher: typeof citation.publisher === "string" && citation.publisher.trim()
            ? citation.publisher.trim()
            : citationPublisher(url),
          sourceDate: typeof citation.published_at === "string" && citation.published_at.trim()
            ? citation.published_at.trim()
            : undefined,
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
    const response = await openai.responses.create({
      model: kinfolkModel("webSearch"),
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
        "Return concise factual findings with web citations. Do not invent facts or sources.",
      ].join("\n"),
      reasoning: { effort: "low" },
      max_output_tokens: KINFOLK_OPENAI_WEB_SEARCH_MAX_OUTPUT_TOKENS,
    } as never, { signal: AbortSignal.timeout(KINFOLK_OPENAI_WEB_SEARCH_TIMEOUT_MS) });
    const results = parseOpenAiResponseCitations(response, [query]);
    return { kind: results.length ? "cited" : "no_citations", results };
  } catch {
    return { kind: "provider_error", results: [] };
  }
}

/** Tavily is an explicit fallback; its rows are never represented as OpenAI citations. */
async function searchTavilyQuery(query: SearchQuery, imageRequested: boolean): Promise<WebSearchBatch> {
  const apiKey = kinfolkTavilyApiKey();
  if (!apiKey) return { kind: "provider_error", results: [] };
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.text,
        search_depth: query.role === "evidence" ? "advanced" : "basic",
        max_results: 5,
        include_raw_content: false,
        include_images: imageRequested || query.role === "image",
        include_image_descriptions: imageRequested || query.role === "image",
        safe_search: true,
        topic: "general",
      }),
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) return { kind: "provider_error", results: [] };
    const payload = await response.json() as TavilySearchResponse;
    if (!payload || (payload.results !== undefined && !Array.isArray(payload.results))) {
      return { kind: "provider_error", results: [] };
    }
    const results = (payload.results ?? []).flatMap((result): WebResult[] => {
      if (typeof result?.title !== "string" || !result.title.trim() || typeof result.url !== "string") return [];
      const url = canonicalizeContextualUrl(result.url);
      if (!url) return [];
      return [{
        title: result.title.trim(),
        url,
        content: typeof result.content === "string" ? result.content : "",
        providerScore: typeof result.score === "number" && Number.isFinite(result.score) ? result.score : 0,
        favicon: typeof result.favicon === "string" ? result.favicon : undefined,
        sourceQuery: query,
      }];
    });
    return { kind: results.length ? "cited" : "no_citations", results };
  } catch {
    return { kind: "provider_error", results: [] };
  }
}

type QuerySearchOutcome = WebSearchBatch & Readonly<{
  provider: Exclude<WebSearchProvider, "mixed">;
  fallbackUsed: boolean;
  attempts: NonNullable<WebSearchOutcome["attempts"]>;
}>;

async function searchQueryWithFallback(
  query: SearchQuery,
  purpose: WebResearchPurpose,
  imageRequested: boolean,
  location?: SearchLocation,
): Promise<QuerySearchOutcome> {
  const safeQuery = { ...query, text: enforceDiasporaFirstProviderQuery(query.text) };
  if (openAiConfigured()) {
    const primary = await searchOpenAiQuery(safeQuery, purpose, location);
    const primaryAttempt = { provider: "openai" as const, used: primary.kind !== "provider_error", outcome: primary.kind };
    if (primary.kind === "cited") {
      return { ...primary, provider: "openai", fallbackUsed: false, attempts: [primaryAttempt] };
    }
    if (kinfolkTavilyApiKey()) {
      const fallback = await searchTavilyQuery(safeQuery, imageRequested);
      return {
        ...fallback,
        provider: "tavily",
        fallbackUsed: true,
        attempts: [primaryAttempt, { provider: "tavily", used: fallback.kind !== "provider_error", outcome: fallback.kind }],
      };
    }
    return { ...primary, provider: "openai", fallbackUsed: false, attempts: [primaryAttempt] };
  }
  const fallback = await searchTavilyQuery(safeQuery, imageRequested);
  return {
    ...fallback,
    provider: "tavily",
    fallbackUsed: false,
    attempts: [{ provider: "tavily", used: fallback.kind !== "provider_error", outcome: fallback.kind }],
  };
}

async function searchQueriesWithState(
  queries: SearchQuery[],
  purpose: WebResearchPurpose,
  _imageRequested: boolean,
  location?: SearchLocation,
): Promise<WebSearchOutcome> {
  const hasOpenAi = openAiConfigured();
  const hasTavily = Boolean(kinfolkTavilyApiKey());
  if (!queries.length || (!hasOpenAi && !hasTavily)) {
    return {
      state: "unavailable", attempted: false, providerAttempted: false, providerUsed: false,
      provider: null, fallbackUsed: false, partial: false, failure: "not_configured", attempts: [], results: [],
    };
  }
  const outcomes = await Promise.all(
    queries.map((query) => searchQueryWithFallback(query, purpose, _imageRequested, location)),
  );
  const cited = outcomes.filter((outcome) => outcome.kind === "cited");
  const attempts = outcomes.flatMap((outcome) => outcome.attempts);
  const providerUsed = attempts.some((attempt) => attempt.used);
  const complete = cited.length === outcomes.length;
  const fallbackUsed = outcomes.some((outcome) => outcome.fallbackUsed);
  const partial = cited.length > 0 && cited.length < outcomes.length;
  const evidenceProviders = new Set(cited.map((outcome) => outcome.provider));
  const usedProviders = new Set(attempts.filter((attempt) => attempt.used).map((attempt) => attempt.provider));
  const attemptedProviders = new Set(attempts.map((attempt) => attempt.provider));
  const reportedProviders = evidenceProviders.size > 0
    ? evidenceProviders
    : usedProviders.size > 0 ? usedProviders : attemptedProviders;
  const failure: WebSearchFailure | undefined = complete
    ? undefined
    : providerUsed ? "no_citations" : "provider_error";
  return {
    state: complete && !fallbackUsed ? "completed" : providerUsed ? "degraded" : "unavailable",
    attempted: true,
    providerAttempted: true,
    providerUsed,
    provider: reportedProviders.size > 1 ? "mixed" : [...reportedProviders][0] ?? null,
    fallbackUsed,
    partial,
    ...(failure ? { failure } : {}),
    attempts,
    results: outcomes.flatMap((outcome) => outcome.results),
  };
}

export async function searchLocalBusinessQueriesWithState(
  queries: SearchQuery[],
  imageRequested: boolean,
  location?: SearchLocation,
): Promise<WebSearchOutcome> {
  return searchQueriesWithState(queries, "local_business", imageRequested, location);
}

export async function searchAllQueriesWithState(
  queries: SearchQuery[],
  imageRequested: boolean,
): Promise<WebSearchOutcome> {
  return searchQueriesWithState(queries, "general_current", imageRequested);
}

/** Compatibility API for callers that consume rows only. */
export async function searchAllQueries(
  queries: SearchQuery[],
  imageRequested: boolean,
): Promise<WebResult[]> {
  return (await searchAllQueriesWithState(queries, imageRequested)).results;
}
