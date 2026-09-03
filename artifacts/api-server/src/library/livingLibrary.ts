import { createHash } from "node:crypto";
import {
  buildCommunityResearchQuery,
  DEFAULT_COMMUNITY_LENS,
  getResearchPolicy,
  isTrustedResearchUrl,
  type ResearchDomain,
  type SourceTier,
} from "./researchPolicy";
import type {
  ExternalResearchProvider,
  KnowledgeSource,
  LibraryEntry,
  LibraryRepository,
  LibrarySynthesisWriter,
  ResearchDocument,
  ResearchProviderStatus,
} from "./types";

const MAX_RESEARCH_RESULTS = 6;
const MAX_SOURCE_CHARACTERS = 8_000;
const MINIMUM_SOURCE_COUNT = 2;

export class LibraryEvidenceInsufficientError extends Error {
  override readonly name = "LibraryEvidenceInsufficientError";
  constructor() {
    super("The Library could not verify enough safe, relevant sources for a reliable answer yet.");
  }
}

export function normalizeResearchQuestion(question: string): string {
  return question
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function researchTopicSlug(question: string, domain: ResearchDomain): string {
  if (/\b(hvac|hvacr|heating|ventilation|air conditioning|refrigeration|trade|certification)\b/i.test(question)) {
    return "trades-skills-certifications";
  }
  if (/\b(afterlife|after death|life after death|spirit|spiritual|religion|soul|heaven|reincarnation|ancestor)\b/i.test(question)) {
    return "faith-spirituality-community-institutions";
  }
  return {
    medical: "health-wellness",
    legal: "legal-information-resources",
    financial: "money-economic-mobility",
    education: "education-learning",
    stem: "education-learning",
    history: "culture-heritage",
    general: "current-issues-community-conversations",
  }[domain];
}

function sourceTierForUrl(url: string): SourceTier {
  const hostname = new URL(url).hostname.toLocaleLowerCase("en-US");
  if (hostname.endsWith(".gov") || hostname === "medlineplus.gov" || hostname === "law.cornell.edu") {
    return "primary";
  }
  if (hostname === "lawhelp.org" || hostname.endsWith(".edu")) return "public-service";
  return "community-expert";
}

function toKnowledgeSource(document: ResearchDocument): KnowledgeSource {
  return {
    id: document.url,
    url: document.url,
    title: document.title,
    publisher: document.publisher,
    excerpt: document.content.slice(0, 420).trim(),
    sourceTier: sourceTierForUrl(document.url),
    publishedAt: document.publishedAt,
    retrievedAt: new Date(),
  };
}

export function validResearchDocuments(
  documents: ResearchDocument[],
  allowedDomains: string[],
): ResearchDocument[] {
  const policy = { allowDomains: allowedDomains } as ReturnType<typeof getResearchPolicy>;
  const seenUrls = new Set<string>();
  return documents
    .filter((document) => document.content.trim().length >= 180)
    .filter((document) => isTrustedResearchUrl(document.url, policy))
    .filter((document) => {
      const key = document.url.replace(/[#?].*$/, "");
      if (seenUrls.has(key)) return false;
      seenUrls.add(key);
      return true;
    })
    .slice(0, MAX_RESEARCH_RESULTS)
    .map((document) => ({ ...document, content: document.content.slice(0, MAX_SOURCE_CHARACTERS) }));
}

export type LivingLibraryAnswer = {
  entry: LibraryEntry;
  reused: boolean;
  origin: "internal" | "researched";
  providerStatus: ResearchProviderStatus;
};

/**
 * Reuses approved Library knowledge first and otherwise performs live,
 * source-cited research. Pending candidates are never reused or exposed across
 * members. No profile or inferred identity context is accepted by this boundary.
 */
export async function answerAndArchiveResearchQuestion(input: {
  question: string;
  locationLabel: string | null;
  repository: LibraryRepository;
  researchProvider: ExternalResearchProvider;
  writer: LibrarySynthesisWriter;
  internalResultCount?: number;
}): Promise<LivingLibraryAnswer> {
  const { question, repository, researchProvider, writer } = input;
  // Library research is community knowledge, not a personal query log. Location
  // may shape a future explicit public topic, but raw member location is not a
  // reusable-key or pending-candidate attribute at this boundary.
  const libraryLocationLabel = null;
  const policy = getResearchPolicy(question);
  const communityLens = DEFAULT_COMMUNITY_LENS;
  const normalizedQuestion = normalizeResearchQuestion(question);
  const currentAfter = new Date(Date.now() - policy.archiveTtlHours * 60 * 60 * 1_000);
  const topicSlug = researchTopicSlug(question, policy.domain);
  const queryFingerprint = createHash("sha256").update(normalizedQuestion).digest("hex");
  const recordSignal = (outcome: Parameters<LibraryRepository["recordCoverageSignal"]>[0]["outcome"], usedLiveResearch: boolean) =>
    repository.recordCoverageSignal({
      queryFingerprint,
      domain: policy.domain,
      topicSlug,
      internalResultCount: Math.max(0, input.internalResultCount ?? 0),
      usedLiveResearch,
      outcome,
    });

  const reusable = await repository.findReusableEntry({
    normalizedQuestion,
    domain: policy.domain,
    communityLens,
    locationLabel: libraryLocationLabel,
    currentAfter,
  });
  if (reusable) {
    if (reusable.publicationStatus !== "published") {
      throw new Error("Library repository returned non-published reusable content.");
    }
    await recordSignal("internal", false);
    return { entry: reusable, reused: true, origin: "internal", providerStatus: "available" };
  }

  let providerResult;
  try {
    providerResult = await researchProvider.search({
      query: buildCommunityResearchQuery(question, policy.domain),
      allowedDomains: policy.allowDomains,
      maxResults: MAX_RESEARCH_RESULTS,
    });
  } catch (error) {
    await recordSignal("provider_unavailable", true);
    throw error;
  }
  const documents = validResearchDocuments(providerResult.documents, policy.allowDomains);
  if (documents.length < MINIMUM_SOURCE_COUNT) {
    await recordSignal("insufficient", true);
    throw new LibraryEvidenceInsufficientError();
  }

  const draft = await writer.writeStructured({
    question,
    domain: policy.domain,
    communityLens,
    locationLabel: libraryLocationLabel,
    disclaimer: policy.disclaimer,
    sources: documents,
  });
  const citedIndexes = [...new Set(draft.citedSourceIndexes)]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < documents.length)
    .slice(0, documents.length);
  const citedDocuments = citedIndexes.map((index) => documents[index]);
  if (citedDocuments.length < MINIMUM_SOURCE_COUNT) {
    await recordSignal("insufficient", true);
    throw new LibraryEvidenceInsufficientError();
  }

  const entry = await repository.saveEntry({
    topicSlug,
    // Pending candidates are review artifacts, not query logs. Store a one-way
    // fingerprint instead of the raw member question and do not attach location.
    question: "Governed live-research candidate",
    normalizedQuestion: `sha256:${queryFingerprint}`,
    title: draft.title.trim(),
    summary: draft.summary.trim().slice(0, 800),
    body: draft.body.trim(),
    domain: policy.domain,
    communityLens,
    locationLabel: libraryLocationLabel,
    disclaimer: policy.disclaimer,
    sourceCount: citedDocuments.length,
    sources: citedDocuments.map(toKnowledgeSource),
    relatedQuestions: [...new Set(draft.relatedQuestions.map((value) => value.trim()).filter(Boolean))].slice(0, 5),
    provider: providerResult.provider,
  });
  await recordSignal("researched", true);
  return {
    entry,
    reused: false,
    origin: "researched",
    providerStatus: providerResult.status,
  };
}
