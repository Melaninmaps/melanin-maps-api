import { createHash } from "node:crypto";
import {
  buildCommunitySupplementResearchQuery,
  buildFoundationResearchQuery,
  getResearchPolicy,
  isTrustedResearchUrl,
  type ResearchDomain,
  type SourceTier,
} from "./researchPolicy";
import {
  defaultCommunityResearchLenses,
  hasDirectEvidenceForExplicitResearchLenses,
  researchLensCommunityLabel,
  researchLensFacetKeys,
  resolveCommunityResearchLenses,
  resolveCommunityResearchSupplementLenses,
  stripCommunityResearchScope,
} from "./communityResearchLens";
import type {
  CommunityResearchContext,
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

/**
 * A reusable Library brief must be a general, non-identifying question. Private
 * member circumstances may receive a one-time research answer, but they are
 * never promoted into shared Library knowledge merely because research succeeded.
 */
function isGeneralReusableQuestion(question: string): boolean {
  const normalized = question.normalize("NFKC").trim();
  if (normalized.length < 3 || normalized.length > 180) return false;
  if (/\b(i|me|my|mine|we|our|ours|myself|ourselves)\b/i.test(normalized)) return false;
  if (/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|@|\b(?:apt|apartment|unit)\s*#?\d+/i.test(normalized)) return false;
  return true;
}

function qualifiesForReusablePublication(input: {
  providerStatus: ResearchProviderStatus;
  citedDocuments: ResearchDocument[];
  sourceNotes: Map<number, string>;
  citedIndexes: number[];
  generalQuestion: boolean;
}): boolean {
  // Publication is deliberately narrower than returning a private answer: it
  // requires a healthy provider, two independently cited trusted documents,
  // a source-specific explanation for each citation, and no member-specific
  // wording in the searchable key.
  return input.generalQuestion
    && input.providerStatus === "available"
    && input.citedDocuments.length >= MINIMUM_SOURCE_COUNT
    && input.citedIndexes.every((index) => Boolean(input.sourceNotes.get(index)));
}

export class LibraryEvidenceInsufficientError extends Error {
  override readonly name = "LibraryEvidenceInsufficientError";
  constructor() {
    super("The Library could not verify enough safe, relevant sources for a reliable answer yet.");
  }
}

export function normalizeResearchQuestion(question: string): string {
  return question
    .normalize("NFKC")
    .replace(/#blackwomen\b/gi, "black women")
    .replace(/#blackmen\b/gi, "black men")
    .replace(/#blackstudents\b/gi, "black students")
    .replace(/#hbcustudents\b/gi, "hbcu students")
    .replace(/#diaspora\b/gi, "")
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
  /** Compatibility field: the general authoritative foundation. */
  entry: LibraryEntry;
  foundation: LibraryEntry;
  communityContext?: CommunityResearchContext;
  reused: boolean;
  origin: "internal" | "researched";
  providerStatus: ResearchProviderStatus;
};

type PacketInput = {
  question: string;
  normalizedQuestion: string;
  communityLens: string;
  researchLenses: string[];
  researchLensFacetKeys: string[];
  directEvidenceLenses: ReturnType<typeof resolveCommunityResearchLenses>;
  query: string;
  domain: ResearchDomain;
  policy: ReturnType<typeof getResearchPolicy>;
  topicSlug: string;
  locationLabel: string | null;
  isReusableQuestion: boolean;
  repository: LibraryRepository;
  researchProvider: ExternalResearchProvider;
  writer: LibrarySynthesisWriter;
  /** Foundation only records aggregate search coverage. */
  recordCoverage?: (outcome: Parameters<LibraryRepository["recordCoverageSignal"]>[0]["outcome"], usedLiveResearch: boolean) => Promise<void>;
};

type PacketResult = {
  entry: LibraryEntry;
  reused: boolean;
  origin: "internal" | "researched";
  providerStatus: ResearchProviderStatus;
};

async function answerResearchPacket(input: PacketInput): Promise<PacketResult> {
  const currentAfter = new Date(Date.now() - input.policy.archiveTtlHours * 60 * 60 * 1_000);
  const reusable = await input.repository.findReusableEntry({
    normalizedQuestion: input.normalizedQuestion,
    domain: input.domain,
    communityLens: input.communityLens,
    researchLensFacetKeys: input.researchLensFacetKeys,
    locationLabel: input.locationLabel,
    currentAfter,
  });
  if (reusable) {
    if (reusable.publicationStatus !== "published") {
      throw new Error("Library repository returned non-published reusable content.");
    }
    await input.recordCoverage?.("internal", false);
    return {
      entry: reusable,
      reused: true,
      origin: "internal",
      providerStatus: "available",
    };
  }

  let providerResult;
  try {
    providerResult = await input.researchProvider.search({
      query: input.query,
      allowedDomains: input.policy.allowDomains,
      maxResults: MAX_RESEARCH_RESULTS,
    });
  } catch (error) {
    await input.recordCoverage?.("provider_unavailable", true);
    throw error;
  }

  const documents = validResearchDocuments(providerResult.documents, input.policy.allowDomains);
  if (documents.length < MINIMUM_SOURCE_COUNT) {
    await input.recordCoverage?.("insufficient", true);
    throw new LibraryEvidenceInsufficientError();
  }
  if (!hasDirectEvidenceForExplicitResearchLenses(documents, input.directEvidenceLenses)) {
    await input.recordCoverage?.("insufficient", true);
    throw new LibraryEvidenceInsufficientError();
  }

  const draft = await input.writer.writeStructured({
    question: input.question,
    domain: input.domain,
    communityLens: input.communityLens,
    locationLabel: input.locationLabel,
    disclaimer: input.policy.disclaimer,
    sources: documents,
  });
  const citedIndexes = [...new Set(draft.citedSourceIndexes)]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < documents.length)
    .slice(0, documents.length);
  const citedDocuments = citedIndexes.map((index) => documents[index]);
  const sourceNotes = new Map(
    draft.sourceNotes
      .filter((note) => citedIndexes.includes(note.sourceIndex))
      .map((note) => [note.sourceIndex, note.whyItMatters.trim().slice(0, 420)] as const)
      .filter(([, note]) => Boolean(note)),
  );
  if (citedDocuments.length < MINIMUM_SOURCE_COUNT) {
    await input.recordCoverage?.("insufficient", true);
    throw new LibraryEvidenceInsufficientError();
  }

  const publicationStatus = qualifiesForReusablePublication({
    providerStatus: providerResult.status,
    citedDocuments,
    sourceNotes,
    citedIndexes,
    generalQuestion: input.isReusableQuestion,
  }) ? "published" : "pending";

  const entry = await input.repository.saveEntry({
    topicSlug: input.topicSlug,
    // A public-safe question may be reused by the next member. Anything with
    // member-specific wording is stored as a one-way pending candidate instead.
    question: publicationStatus === "published" ? input.question.trim() : "Governed live-research candidate",
    normalizedQuestion: publicationStatus === "published"
      ? input.normalizedQuestion
      : `sha256:${createHash("sha256").update(input.normalizedQuestion).digest("hex")}`,
    title: draft.title.trim(),
    summary: draft.summary.trim().slice(0, 800),
    body: draft.body.trim(),
    domain: input.domain,
    communityLens: input.communityLens,
    researchLenses: input.researchLenses,
    locationLabel: input.locationLabel,
    disclaimer: input.policy.disclaimer,
    sourceCount: citedDocuments.length,
    sources: citedIndexes.map((index) => ({
      ...toKnowledgeSource(documents[index]),
      whyItMatters: sourceNotes.get(index) ?? null,
    })),
    relatedQuestions: [...new Set(draft.relatedQuestions.map((value) => value.trim()).filter(Boolean))].slice(0, 5),
    provider: providerResult.provider,
    publicationStatus,
  });
  await input.recordCoverage?.("researched", true);
  return {
    entry,
    reused: false,
    origin: "researched",
    providerStatus: providerResult.status,
  };
}

function insufficientCommunityContext(
  tags: string[],
): CommunityResearchContext {
  return {
    status: "insufficient",
    researchLenses: tags,
    providerStatus: "degraded",
    message: `The current foundation above is still available. The Library could not verify enough direct evidence for a separate ${tags.join(" ")} community-context packet right now, so it has not made a group-specific claim.`,
  };
}

/**
 * Returns a current foundation for every topic, then independently adds an
 * explicitly selected, directly evidenced community packet. A group packet
 * cannot replace, narrow, or relabel the foundation. A missing group packet is
 * nonfatal; only the foundation's normal safety and evidence requirements can
 * fail the request.
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
  const selectedLenses = resolveCommunityResearchLenses(question);
  const supplementLenses = resolveCommunityResearchSupplementLenses(question, selectedLenses);
  const foundationQuestion = stripCommunityResearchScope(question, supplementLenses)
    || question.normalize("NFKC").trim();
  const foundationLenses = defaultCommunityResearchLenses();
  const topicSlug = researchTopicSlug(foundationQuestion, policy.domain);
  const foundationNormalizedQuestion = normalizeResearchQuestion(foundationQuestion);
  const foundationFingerprint = createHash("sha256")
    .update(foundationNormalizedQuestion)
    .digest("hex");
  const recordFoundationCoverage = (outcome: Parameters<LibraryRepository["recordCoverageSignal"]>[0]["outcome"], usedLiveResearch: boolean) =>
    repository.recordCoverageSignal({
      queryFingerprint: foundationFingerprint,
      domain: policy.domain,
      topicSlug,
      internalResultCount: Math.max(0, input.internalResultCount ?? 0),
      usedLiveResearch,
      outcome,
    });

  const foundation = await answerResearchPacket({
    question: foundationQuestion,
    normalizedQuestion: foundationNormalizedQuestion,
    communityLens: researchLensCommunityLabel(foundationLenses),
    researchLenses: foundationLenses.map((lens) => lens.tag),
    researchLensFacetKeys: researchLensFacetKeys(foundationLenses),
    // The foundation deliberately has no group-specific direct-evidence test.
    directEvidenceLenses: foundationLenses,
    query: buildFoundationResearchQuery(foundationQuestion, policy.domain),
    domain: policy.domain,
    policy,
    topicSlug,
    locationLabel: libraryLocationLabel,
    isReusableQuestion: isGeneralReusableQuestion(foundationQuestion),
    repository,
    researchProvider,
    writer,
    recordCoverage: recordFoundationCoverage,
  });

  let communityContext: CommunityResearchContext | undefined;
  if (supplementLenses.length > 0) {
    const tags = supplementLenses.map((lens) => lens.tag);
    try {
      const supplementQuestion = stripCommunityResearchScope(question, supplementLenses)
        || foundationQuestion;
      const supplement = await answerResearchPacket({
        question: question.trim(),
        normalizedQuestion: normalizeResearchQuestion(question),
        communityLens: researchLensCommunityLabel(supplementLenses),
        researchLenses: tags,
        researchLensFacetKeys: researchLensFacetKeys(supplementLenses),
        directEvidenceLenses: supplementLenses,
        query: buildCommunitySupplementResearchQuery(question, policy.domain, supplementLenses),
        domain: policy.domain,
        policy,
        topicSlug: researchTopicSlug(supplementQuestion, policy.domain),
        locationLabel: libraryLocationLabel,
        isReusableQuestion: isGeneralReusableQuestion(question),
        repository,
        researchProvider,
        writer,
      });
      communityContext = {
        status: "available",
        researchLenses: tags,
        answer: supplement.entry,
        providerStatus: supplement.providerStatus,
        message: `Directly sourced community context for ${tags.join(" ")} is shown separately from the current foundation.`,
      };
    } catch {
      // Community evidence has a stricter direct-evidence bar. Its absence must
      // never erase, degrade, or silently relabel the foundation answer.
      communityContext = insufficientCommunityContext(tags);
    }
  }

  return {
    entry: foundation.entry,
    foundation: foundation.entry,
    communityContext,
    reused: foundation.reused,
    origin: foundation.origin,
    providerStatus: foundation.providerStatus,
  };
}
