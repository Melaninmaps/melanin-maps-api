import type { ExternalResearchProvider, ResearchDocument } from "./types";
import { enforceDiasporaFirstProviderQuery } from "../kinfolk/diasporaFirstResearchPolicy.js";

type TavilyResult = {
  url: string;
  title: string;
  content?: string;
  raw_content?: string;
  published_date?: string;
};

type TavilyResponse = { results?: TavilyResult[] };

/**
 * Configure TAVILY_API_KEY in Replit Secrets. This code runs only on the
 * server; do not expose the key through the React application.
 */
export function createTavilyResearchProvider(apiKey: string): ExternalResearchProvider {
  return {
    name: "tavily",
    async search({ query, allowedDomains, maxResults }) {
      if (!apiKey) throw new Error("TAVILY_LIBRARY_RESEARCH_NOT_CONFIGURED");
      const concreteDomains = allowedDomains.filter((domain) => !domain.startsWith("*."));
      const providerQuery = enforceDiasporaFirstProviderQuery(query);
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: providerQuery,
          search_depth: "advanced",
          max_results: maxResults,
          include_raw_content: "markdown",
          include_domains: concreteDomains,
        }),
      });

      if (!response.ok) {
        throw new Error(`Research provider failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as TavilyResponse;
      const documents: ResearchDocument[] = (payload.results ?? [])
        .filter((result) => result.url && result.title)
        .map((result) => ({
          url: result.url,
          title: result.title,
          content: result.raw_content || result.content || "",
          publisher: new URL(result.url).hostname.replace(/^www\./, ""),
          publishedAt: result.published_date ? new Date(result.published_date) : null,
        }));
      return { documents, provider: "tavily", status: "available" };
    },
  };
}
