import type { SemanticTurnPlan } from "./semantic-turn-planner";
import type { ExternalResearchProvider, ResearchDocument } from "../library/types";
import { canonicalizeContextualUrl } from "./contextual-url";
export type ContextualSourceKind = "mwm_platform" | "library_published" | "official" | "primary" | "research" | "reference" | "reporting" | "criticism" | "creator" | "community_discourse";
export type ContextualEvidenceItem = { title: string; url: string; publisher: string | null; kind: ContextualSourceKind; excerpt: string; publishedAt: string | null; retrievedAt: string; supports: string[] };
export type ContextualEvidenceBundle = { internal: ContextualEvidenceItem[]; external: ContextualEvidenceItem[]; media: ContextualEvidenceItem[]; gaps: string[]; degraded: boolean; degradedReason: string | null };
export type ContextualResearchDependencies = {
  searchInternal?: (queries: string[]) => Promise<ContextualEvidenceItem[]>;
  /** Existing OpenAI-native-web primary and Tavily fallback providers. */
  primaryProvider?: ExternalResearchProvider;
  fallbackProvider?: ExternalResearchProvider;
  searchLive?: (queries: string[]) => Promise<ContextualEvidenceItem[]>;
  now?: () => string;
  timeoutMs?: number;
};
const safe = (x: ContextualEvidenceItem): ContextualEvidenceItem | null => {
  const canonicalUrl = canonicalizeContextualUrl(x.url.trim());
  if (!canonicalUrl || !x.title.trim()) return null;
  return {...x,title:x.title.trim().slice(0,240),url:canonicalUrl,excerpt:x.excerpt.trim().slice(0,800),supports:x.supports.map(s=>s.trim().slice(0,160)).filter(Boolean).slice(0,8)};
};
const timed = <T>(work: Promise<T>, ms: number) => Promise.race<T>([work, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("CONTEXTUAL_RETRIEVAL_TIMEOUT")), ms))]);
function sourceKind(document: ResearchDocument): ContextualSourceKind {
  let host = "";
  try { host = new URL(document.url).hostname.toLowerCase(); } catch { return "reference"; }
  const text = `${document.title} ${document.publisher ?? ""} ${document.content ?? ""}`.toLowerCase();
  if (/(?:\.gov|\.edu)$/.test(host) || /\b(official|department|ministry|university|museum|archive)\b/.test(text)) return "official";
  if (/(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com)$/.test(host)) return "creator";
  if (/\b(interview|transcript|speech|memoir|artist statement|press release)\b/.test(text)) return "primary";
  if (/\b(peer[- ]reviewed|journal|study|research|systematic review|clinical guideline)\b/.test(text)) return "research";
  if (/\b(review|criticism|critic|retrospective|analysis)\b/.test(text)) return "criticism";
  if (/\b(news|report|reported|investigation|correspondent)\b/.test(text)) return "reporting";
  if (/\b(commentary|forum|discussion|audience|fans|community response)\b/.test(text)) return "community_discourse";
  return "reference";
}
function documentsToEvidence(documents: ResearchDocument[], now: string, plan: SemanticTurnPlan): ContextualEvidenceItem[] {
  const rank: Record<ContextualSourceKind, number> = {
    official: 0, primary: 1, research: 2, library_published: 3, mwm_platform: 4,
    reporting: 5, criticism: 6, creator: 7, reference: 8, community_discourse: 9,
  };
  return documents.map((document) => ({
    title: document.title, url: document.url, publisher: document.publisher,
    kind: sourceKind(document), excerpt: document.content ?? "",
    publishedAt: document.publishedAt?.toISOString() ?? null, retrievedAt: now,
    supports: plan.retrievalQueries.slice(0, 3),
  })).filter((item) => {
    if (item.kind === "creator") return Boolean(item.publisher?.trim() && item.title.trim());
    if (plan.freshness === "current" && !["official", "primary"].includes(item.kind)) return Boolean(item.publishedAt);
    if (plan.taskMode === "high_consequence") return ["official", "research"].includes(item.kind);
    return true;
  }).sort((a, b) => rank[a.kind] - rank[b.kind]);
}
/** Retrieves independent approved/live paths concurrently; failures are explicit evidence gaps, never facts. */
export async function orchestrateContextualResearch(plan: SemanticTurnPlan, deps: ContextualResearchDependencies): Promise<ContextualEvidenceBundle> {
  const queries: string[] = [...new Set(plan.retrievalQueries.map((q: string) => q.trim()).filter(Boolean))].slice(0,3);
  const now = deps.now?.() ?? new Date().toISOString();
  const timeoutMs = Math.min(Math.max(deps.timeoutMs ?? 8_000, 100), 8_000);
  const liveSearch = async (): Promise<ContextualEvidenceItem[]> => {
    if (deps.searchLive) return deps.searchLive(queries);
    if (!deps.primaryProvider) return [];
    const documents: ResearchDocument[] = [];
    for (const query of queries) {
      try {
        const result = await deps.primaryProvider.search({ query, allowedDomains: [], maxResults: 8 - documents.length });
        documents.push(...result.documents);
      } catch {
        if (!deps.fallbackProvider) throw new Error("CONTEXTUAL_PRIMARY_RETRIEVAL_FAILED");
        const result = await deps.fallbackProvider.search({ query, allowedDomains: [], maxResults: 8 - documents.length });
        documents.push(...result.documents);
      }
      if (documents.length >= 8) break;
    }
    return documentsToEvidence(documents.slice(0, 8), now, plan);
  };
  const [internal, external] = await Promise.allSettled([
    timed(deps.searchInternal?.(queries) ?? Promise.resolve([]), timeoutMs),
    timed(liveSearch(), timeoutMs),
  ]);
  const degraded = internal.status === "rejected" || external.status === "rejected";
  const dedupe = (items: ContextualEvidenceItem[]) => [...new Map(items.map(safe).filter((x): x is ContextualEvidenceItem=>!!x).map(x=>[x.url,x])).values()];
  const allInternal = dedupe(internal.status === "fulfilled" ? internal.value : []).slice(0,8);
  const allExternal = dedupe(external.status === "fulfilled" ? external.value : []).filter(x=>!allInternal.some(i=>i.url===x.url)).slice(0, Math.max(0, 8 - allInternal.length));
  const currentNeedsCorroboration = plan.freshness === "current"
    && !allExternal.some((item) => item.kind === "official")
    && allExternal.filter((item) => ["primary", "reporting", "research"].includes(item.kind)).length < 2;
  const gaps = allInternal.length || allExternal.length ? [] : ["No supported evidence was retrieved."];
  if (currentNeedsCorroboration) gaps.push("The current claim could not be corroborated.");
  return {
    internal: allInternal,
    external: currentNeedsCorroboration ? allExternal.filter((item) => item.kind === "reference") : allExternal.filter(x=>x.kind!=="creator"),
    media: allExternal.filter(x=>x.kind==="creator"),
    gaps,
    degraded: degraded || currentNeedsCorroboration,
    degradedReason: degraded
      ? "A retrieval provider was unavailable."
      : currentNeedsCorroboration ? "Current evidence was not sufficiently corroborated." : null,
  };
}