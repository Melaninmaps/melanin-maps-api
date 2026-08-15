/**
 * Kinfolk live web search adapter — Tavily.
 *
 * Adapted from the Manus profile-first web search starter.
 * The rest of Kinfolk depends only on this module's output shape, so a
 * different provider can replace it without changing the planner or ranker.
 *
 * Degrades gracefully when TAVILY_API_KEY is not configured: returns an
 * empty array so Kinfolk continues with DB knowledge + reviewed library.
 */

import type { SearchQuery } from "./lens-planner.js";

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

/**
 * Calls Tavily live web search for one query.
 * Returns [] (not throws) when the API key is absent so the call site can
 * degrade gracefully instead of bubbling an error through the Kinfolk response.
 */
async function searchWeb(query: SearchQuery, imageRequested: boolean): Promise<WebResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return []; // degrade gracefully — feature activates once key is added

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
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
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as TavilySearchResponse;
    return (payload.results ?? [])
      .filter((r): r is TavilyResult & { title: string; url: string } => Boolean(r.title && r.url))
      .map((r) => ({
        title: r.title!,
        url: r.url!,
        content: r.content ?? "",
        providerScore: r.score ?? 0,
        favicon: r.favicon,
        sourceQuery: query,
      }));
  } catch {
    return []; // network error — degrade gracefully
  }
}

/** Searches all queries in parallel and deduplicates by URL. */
export async function searchAllQueries(queries: SearchQuery[], imageRequested: boolean): Promise<WebResult[]> {
  const batches = await Promise.all(queries.map((q) => searchWeb(q, imageRequested)));
  const seen = new Set<string>();
  return batches.flat().filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}
