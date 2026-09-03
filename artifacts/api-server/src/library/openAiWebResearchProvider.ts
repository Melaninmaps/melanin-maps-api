import { enforceDiasporaFirstProviderQuery } from "../kinfolk/diasporaFirstResearchPolicy";
import type {
  ExternalResearchProvider,
  ResearchDocument,
  ResearchProviderResult,
} from "./types";

const ALLOWED_MODELS = new Set(["gpt-5-mini", "gpt-4o-mini"]);

export function boundedLibraryResearchModel(configuredModel?: string): string {
  return configuredModel && ALLOWED_MODELS.has(configuredModel)
    ? configuredModel
    : "gpt-5-mini";
}

type UrlCitation = {
  type?: string;
  url?: string;
  title?: string;
};

type ResponsePayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    action?: { sources?: Array<{ url?: string; title?: string }> };
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: UrlCitation[];
    }>;
  }>;
};

function extractResponse(payload: ResponsePayload): { text: string; documents: ResearchDocument[] } {
  const outputText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n") || payload.output_text?.trim() || "";

  const citations = payload.output
    ?.flatMap((item) => item.content ?? [])
    .flatMap((content) => content.annotations ?? [])
    .filter((annotation) => annotation.type === "url_citation" && annotation.url) ?? [];
  const consultedSources = payload.output
    ?.filter((item) => item.type === "web_search_call")
    .flatMap((item) => item.action?.sources ?? []) ?? [];

  const seen = new Set<string>();
  const documents: ResearchDocument[] = [];
  // Only URL annotations are citations. Consulted sources are intentionally not
  // returned as evidence unless the model explicitly cited them in its answer.
  // Some compatible gateways omit annotations; in that case the empty document
  // set is treated as insufficient evidence and may activate the provider fallback.
  void consultedSources;
  for (const source of citations) {
    if (!source.url) continue;
    const canonicalUrl = source.url.replace(/[#?].*$/, "");
    if (seen.has(canonicalUrl)) continue;
    seen.add(canonicalUrl);
    let publisher: string | null = null;
    try {
      publisher = new URL(source.url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    documents.push({
      url: source.url,
      title: source.title?.trim() || publisher,
      content: outputText,
      publisher,
      publishedAt: null,
    });
  }
  return { text: outputText, documents };
}

/**
 * Primary Living Library provider. It uses the Responses API's native web_search
 * tool, never sends profile context, and returns only source-cited material.
 */
export function createOpenAiWebResearchProvider(input: {
  apiKey: string;
  baseUrl: string;
  model?: string;
}): ExternalResearchProvider {
  return {
    name: "openai",
    async search({ query, allowedDomains, maxResults }): Promise<ResearchProviderResult> {
      if (!input.apiKey || !input.baseUrl) throw new Error("OPENAI_LIBRARY_RESEARCH_NOT_CONFIGURED");
      const providerQuery = enforceDiasporaFirstProviderQuery(query);
      const concreteDomains = [...new Set(allowedDomains.filter((domain) => !domain.startsWith("*.")))].slice(0, 100);
      const response = await fetch(`${input.baseUrl.replace(/\/$/, "")}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: boundedLibraryResearchModel(input.model),
          reasoning: { effort: "low" },
          max_output_tokens: 2_400,
          tools: [{
            type: "web_search",
            ...(concreteDomains.length > 0
              ? { filters: { allowed_domains: concreteDomains } }
              : {}),
          }],
          tool_choice: "auto",
          include: ["web_search_call.action.sources"],
          input: [
            {
              role: "system",
              content: [
                "Research for a governed, diaspora-centered community knowledge Library.",
                "The community lens is an editorial product perspective, never a claim about the questioner's identity.",
                "Do not infer race, sex, religion, nationality, or any other identity attribute.",
                "For spiritual, religious, or existential questions, describe multiple relevant traditions and secular perspectives and do not present an unknowable answer as settled fact.",
                "For medical, legal, or financial questions, provide general education only, rely on authoritative sources, state uncertainty, and do not personalize advice.",
                "Use current sources, include inline citations, and distinguish disputed or changing claims.",
              ].join(" "),
            },
            { role: "user", content: providerQuery },
          ],
        }),
      });
      if (!response.ok) throw new Error(`OpenAI web research failed with status ${response.status}.`);
      const payload = (await response.json()) as ResponsePayload;
      const extracted = extractResponse(payload);
      if (!extracted.text) throw new Error("OpenAI web research returned no cited answer.");
      return {
        documents: extracted.documents.slice(0, Math.max(1, maxResults)),
        provider: "openai",
        status: "available",
      };
    },
  };
}
