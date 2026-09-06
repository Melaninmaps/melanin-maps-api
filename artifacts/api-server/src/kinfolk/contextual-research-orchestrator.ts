import type { ExternalResearchProvider, ResearchDocument } from "../library/types";
import { canonicalizeContextualUrl } from "./contextual-url";
import type { SemanticTurnPlan } from "./semantic-turn-planner";

export type ContextualEvidenceItem = {
  title: string;
  url: string;
  publisher: string | null;
  kind: "library_published" | "official" | "primary" | "research" | "reporting" | "criticism" | "creator" | "platform_record" | "community_discourse" | "reference";
  excerpt: string;
  publishedAt: string | null;
  retrievedAt: string;
  supports: string[];
  creatorVerified?: boolean;
  libraryPath?: string;
  primaryVerification?: "entity_domain_match";
};

export type ContextualEvidenceBundle = {
  internal: ContextualEvidenceItem[];
  external: ContextualEvidenceItem[];
  media: ContextualEvidenceItem[];
  gaps: string[];
  degraded: boolean;
  degradedReason: string | null;
};

export type ContextualResearchDeps = {
  searchInternal?: (queries: string[], signal?: AbortSignal) => Promise<ContextualEvidenceItem[]>;
  searchLive?: (queries: string[], signal?: AbortSignal) => Promise<ContextualEvidenceItem[]>;
  primaryProvider?: ExternalResearchProvider;
  fallbackProvider?: ExternalResearchProvider;
  timeoutMs?: number;
  signal?: AbortSignal;
  now?: () => string;
};

const VIDEO_HOSTS = new Set(["youtube.com", "www.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com", "tiktok.com", "www.tiktok.com", "instagram.com", "www.instagram.com"]);
const REPORTING_HOSTS = new Set(["apnews.com", "reuters.com", "bbc.com", "bbc.co.uk", "npr.org", "nytimes.com", "washingtonpost.com", "theguardian.com"]);
const RESEARCH_HOSTS = new Set(["doi.org", "jstor.org", "nature.com", "sciencedirect.com", "springer.com", "pubmed.ncbi.nlm.nih.gov"]);
const INJECTION_LINE = /(?:ignore|disregard|override|forget)\s+(?:all\s+)?(?:previous|prior|system|developer)|system\s+prompt|developer\s+message|reveal\s+(?:private|hidden|secret)|private\s+memor(?:y|ies)|follow\s+these\s+instructions|you\s+are\s+(?:chatgpt|an?\s+assistant)/i;

export function canonicalizeContextualPolicyText(value: string): string {
  let decoded = value;
  for (let pass = 0; pass < 3; pass++) {
    const next = decoded.replace(/(?:%[0-9A-Fa-f]{2})+/g, (encoded) => {
      try { return decodeURIComponent(encoded); } catch { return encoded; }
    });
    if (next === decoded) break;
    decoded = next;
  }
  return decoded
    .normalize("NFKC")
    .replace(/\p{Cf}+/gu, "")
    .replace(/\p{Cc}+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function abortError(): Error {
  const error = new Error("Contextual retrieval was cancelled.");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

async function runWithinDeadline<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  return await Promise.race([
    work,
    new Promise<T>((_, reject) => {
      if (signal.aborted) return reject(abortError());
      signal.addEventListener("abort", () => reject(abortError()), { once: true });
    }),
  ]);
}

function hostname(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
}

function sourceIdentity(url: string): string {
  const host = hostname(url);
  const parts = host.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : host;
}

function isOfficialHost(host: string): boolean {
  return host.endsWith(".gov") || host === "who.int" || host === "un.org";
}

function normalizedEntityKey(value: string): string {
  return canonicalizeContextualPolicyText(value).toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function isVerifiedEntityPrimarySource(document: ResearchDocument, url: string, plan: SemanticTurnPlan): boolean {
  if (!plan.evidenceNeeds.includes("primary_cultural")) return false;
  const registrableLabel = sourceIdentity(url).split(".")[0] ?? "";
  const domainKey = normalizedEntityKey(registrableLabel);
  if (domainKey.length < 4) return false;
  const candidates = [...plan.namedEntities.map((entity) => entity.text), plan.resolvedMeaning ?? ""]
    .map(normalizedEntityKey)
    .filter((key) => key.length >= 4);
  return candidates.includes(domainKey);
}

function classifyDocument(document: ResearchDocument, url: string, plan: SemanticTurnPlan): ContextualEvidenceItem["kind"] {
  const host = hostname(url);
  if (VIDEO_HOSTS.has(host)) return document.creatorVerified === true ? "creator" : "reference";
  if (isVerifiedEntityPrimarySource(document, url, plan)) return "primary";
  if (isOfficialHost(host)) return "official";
  if (host.endsWith(".edu") || RESEARCH_HOSTS.has(host)) return "research";
  const criticalReceptionText = canonicalizeContextualPolicyText(`${document.title ?? ""} ${document.content ?? ""}`);
  if (plan.evidenceNeeds.includes("critical_consensus") && /\b(review|criticism|critical reception|analysis|retrospective|essay|ranking|critic)\b/i.test(criticalReceptionText)) return "criticism";
  if (REPORTING_HOSTS.has(host)) return "reporting";
  return "reference";
}

function controlledExcerpt(content: string): string {
  const reconstructed = content
    .split(/\r?\n/)
    .map((line) => canonicalizeContextualPolicyText(line))
    .filter((line) => line && !INJECTION_LINE.test(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return INJECTION_LINE.test(reconstructed) ? "" : reconstructed.slice(0, 800);
}

function controlledMetadata(content: string | null | undefined, max: number): string {
  const clean = canonicalizeContextualPolicyText(content ?? "").slice(0, max);
  return clean && !INJECTION_LINE.test(clean) ? clean : "";
}

function urlContainsInstructions(url: string): boolean {
  return INJECTION_LINE.test(canonicalizeContextualPolicyText(url));
}

function normalizeItem(item: ContextualEvidenceItem, now: string): ContextualEvidenceItem | null {
  const url = canonicalizeContextualUrl(item.url);
  const title = controlledMetadata(item.title, 240);
  const excerpt = controlledExcerpt(item.excerpt);
  if (!url || !title || urlContainsInstructions(url) || (item.excerpt.trim() && !excerpt) || (item.kind === "creator" && item.creatorVerified !== true)) return null;
  return {
    ...item,
    title,
    url,
    publisher: controlledMetadata(item.publisher, 160) || null,
    excerpt,
    retrievedAt: item.retrievedAt || now,
    supports: item.supports.filter((entry) => typeof entry === "string" && entry.trim()).map((entry) => controlledExcerpt(entry)).filter(Boolean).slice(0, 8),
    creatorVerified: item.kind === "creator" ? true : undefined,
    primaryVerification: item.kind === "primary" && item.primaryVerification === "entity_domain_match"
      ? "entity_domain_match"
      : undefined,
    libraryPath: item.kind === "library_published" && typeof item.libraryPath === "string"
      && /^\/library\/topics\/[A-Za-z0-9._~%-]+$/.test(item.libraryPath)
      ? item.libraryPath
      : undefined,
  };
}

function fromDocument(document: ResearchDocument, queries: string[], now: string, plan: SemanticTurnPlan): ContextualEvidenceItem | null {
  const url = canonicalizeContextualUrl(document.url);
  if (!url || !document.title?.trim()) return null;
  const kind = classifyDocument(document, url, plan);
  if (VIDEO_HOSTS.has(hostname(url)) && kind !== "creator") return null;
  return normalizeItem({
    title: document.title.trim().slice(0, 240),
    url,
    publisher: document.creatorVerified && document.creatorName
      ? document.creatorName.trim().slice(0, 160)
      : document.publisher?.trim().slice(0, 160) || null,
    kind,
    excerpt: document.content ?? "",
    publishedAt: document.publishedAt?.toISOString() ?? null,
    retrievedAt: now,
    supports: queries.slice(0, 3),
    creatorVerified: kind === "creator" ? true : undefined,
    primaryVerification: kind === "primary" ? "entity_domain_match" : undefined,
  }, now);
}

function dedupe(items: ContextualEvidenceItem[], max = 8): ContextualEvidenceItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).slice(0, max);
}

function internalIsSufficient(plan: SemanticTurnPlan, internal: ContextualEvidenceItem[]): boolean {
  if (internal.length === 0 || plan.freshness !== "stable") return false;
  return plan.evidenceNeeds.every((need) => need === "approved_internal");
}

function evidenceIsCorroborated(plan: SemanticTurnPlan, items: ContextualEvidenceItem[]): boolean {
  const isConsensus = plan.evidenceNeeds.includes("critical_consensus");
  if (!isConsensus && items.some((item) => item.kind === "official")) return true;
  if (isConsensus && !items.some((item) => item.kind === "criticism")) return false;
  const independent = new Set(
    items
      .filter((item) => ["official", "primary", "research", "reporting", "platform_record", ...(isConsensus ? ["criticism"] : [])].includes(item.kind))
      .map((item) => sourceIdentity(item.url)),
  );
  return independent.size >= 2;
}

function needsCorroboration(plan: SemanticTurnPlan): boolean {
  return plan.freshness === "current" || plan.evidenceNeeds.some((need) => need === "official_current" || need === "platform_records" || need === "critical_consensus");
}

function allowedForPlan(plan: SemanticTurnPlan, item: ContextualEvidenceItem): boolean {
  if (plan.taskMode !== "high_consequence") return true;
  return item.kind === "official" || item.kind === "research";
}

async function searchProvider(
  provider: ExternalResearchProvider,
  plan: SemanticTurnPlan,
  query: string,
  queries: string[],
  maxResults: number,
  now: string,
  signal: AbortSignal,
): Promise<ContextualEvidenceItem[]> {
  throwIfAborted(signal);
  const result = await provider.search({ query, allowedDomains: [], maxResults, signal });
  throwIfAborted(signal);
  return dedupe(result.documents.flatMap((document) => {
    const normalized = fromDocument(document, queries, now, plan);
    return normalized ? [normalized] : [];
  }), maxResults);
}

async function liveEvidence(plan: SemanticTurnPlan, deps: ContextualResearchDeps, now: string, signal: AbortSignal): Promise<ContextualEvidenceItem[]> {
  const queries = plan.retrievalQueries.filter(Boolean).slice(0, 3);
  if (!queries.length) return [];
  if (deps.searchLive) {
    const items = await deps.searchLive(queries, signal);
    throwIfAborted(signal);
    return dedupe(items.flatMap((item) => {
      const normalized = normalizeItem(item, now);
      return normalized && allowedForPlan(plan, normalized) ? [normalized] : [];
    }));
  }

  const documents: ContextualEvidenceItem[] = [];
  for (const query of queries) {
    throwIfAborted(signal);
    if (!deps.primaryProvider && !deps.fallbackProvider) break;

    let primary: ContextualEvidenceItem[] = [];
    if (deps.primaryProvider) {
      try {
        primary = await searchProvider(deps.primaryProvider, plan, query, queries, 8 - documents.length, now, signal);
      } catch (error) {
        if (signal.aborted) throw error;
      }
    }
    documents.push(...primary);

    const accepted = dedupe(documents);
    const primaryInsufficient = primary.length === 0
      || (needsCorroboration(plan) && !evidenceIsCorroborated(plan, accepted));
    if (primaryInsufficient && deps.fallbackProvider && documents.length < 8) {
      const fallback = await searchProvider(deps.fallbackProvider, plan, query, queries, 8 - documents.length, now, signal);
      documents.push(...fallback);
    }
    if (documents.length > 0) break;
  }
  return dedupe(documents.filter((item) => allowedForPlan(plan, item)));
}

export function contextualEvidenceNeedsFailClosedResponse(plan: SemanticTurnPlan, bundle: ContextualEvidenceBundle): boolean {
  return (needsCorroboration(plan) || plan.taskMode === "entity_explorer") && bundle.gaps.length > 0;
}

export async function orchestrateContextualResearch(
  plan: SemanticTurnPlan,
  deps: ContextualResearchDeps,
): Promise<ContextualEvidenceBundle> {
  if (deps.signal?.aborted) {
    throw deps.signal.reason instanceof Error ? deps.signal.reason : abortError();
  }
  const now = deps.now?.() ?? new Date().toISOString();
  const timeoutMs = Math.min(8_000, Math.max(500, deps.timeoutMs ?? 8_000));
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(deps.signal?.reason);
  deps.signal?.addEventListener("abort", abortFromParent, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();

  let internal: ContextualEvidenceItem[] = [];
  let external: ContextualEvidenceItem[] = [];
  let providerUnavailable = false;

  try {
    if (deps.searchInternal) {
      try {
        const found = await runWithinDeadline(deps.searchInternal(plan.retrievalQueries.slice(0, 3), controller.signal), controller.signal);
        internal = dedupe(found.flatMap((item) => {
          const normalized = normalizeItem(item, now);
          return normalized && allowedForPlan(plan, normalized) ? [normalized] : [];
        }));
      } catch (error) {
        if (controller.signal.aborted) providerUnavailable = true;
      }
    }

    if (!controller.signal.aborted && !internalIsSufficient(plan, internal)) {
      try {
        external = await runWithinDeadline(liveEvidence(plan, deps, now, controller.signal), controller.signal);
      } catch {
        providerUnavailable = true;
      }
    }
  } finally {
    clearTimeout(timer);
    deps.signal?.removeEventListener("abort", abortFromParent);
  }

  const media = external.filter((item) => item.kind === "creator");
  const nonMediaExternal = external.filter((item) => item.kind !== "creator");
  const gaps: string[] = [];
  if (!internal.length && !external.length) gaps.push("No source-backed evidence was available.");
  if (needsCorroboration(plan) && !evidenceIsCorroborated(plan, [...internal, ...external])) {
    gaps.push("The claim or consensus could not be corroborated.");
  }
  if (plan.taskMode === "entity_explorer" && !internal.some((item) => item.kind === "library_published")) {
    gaps.push("No approved Library topic was available for this entity.");
  }
  if (plan.taskMode === "entity_explorer" && !external.some((item) => item.kind === "primary" && item.primaryVerification === "entity_domain_match")) {
    gaps.push("No external primary source was available for this entity.");
  }
  if (plan.evidenceNeeds.includes("creator_media") && media.length === 0) {
    gaps.push("No creator-owned media could be verified.");
  }

  return {
    internal,
    external: nonMediaExternal,
    media,
    gaps,
    degraded: providerUnavailable || gaps.length > 0,
    degradedReason: providerUnavailable
      ? "A retrieval provider was unavailable."
      : gaps.length > 0 ? "Evidence was not sufficiently corroborated." : null,
  };
}
