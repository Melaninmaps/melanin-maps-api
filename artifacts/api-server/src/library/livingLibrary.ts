import {
  buildCommunityResearchQuery,
  DEFAULT_COMMUNITY_LENS,
  getResearchPolicy,
  isTrustedResearchUrl,
  type SourceTier,
} from "./researchPolicy";
import type {
  ExternalResearchProvider,
  KnowledgeSource,
  LibraryEntry,
  LibraryRepository,
  LibrarySynthesisWriter,
  ResearchDocument,
} from "./types";

const MAX_RESEARCH_RESULTS = 6;
const MAX_SOURCE_CHARACTERS = 8_000;

function normalizeQuestion(question: string): string {
  return question
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceTierForUrl(url: string): SourceTier {
  const hostname = new URL(url).hostname.toLocaleLowerCase("en-US");
  if (hostname.endsWith(".gov") || hostname === "medlineplus.gov" || hostname === "law.cornell.edu") {
    return "primary";
  }
  if (hostname === "lawhelp.org" || hostname.endsWith(".edu")) {
    return "public-service";
  }
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

function validDocuments(documents: ResearchDocument[], allowedDomains: string[]): ResearchDocument[] {
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

function fallbackEntry(input: {
  question: string;
  domain: ReturnType<typeof getResearchPolicy>["domain"];
  communityLens: string;
  locationLabel: string | null;
  disclaimer: string | null;
}): Omit<LibraryEntry, "id" | "topicId" | "createdAt" | "refreshedAt"> & { topicSlug: string } {
  return {
    topicSlug: input.domain,
    question: input.question,
    normalizedQuestion: normalizeQuestion(input.question),
    title: "Research sources are still being verified",
    summary:
      "Kinfolk could not find enough approved sources to create a reliable Library entry yet. The question has been retained so it can be researched again as source coverage improves.",
    body:
      "No answer has been synthesized because the source-quality threshold was not met. Try refining the question with a location, jurisdiction, or the specific type of information you need.",
    domain: input.domain,
    communityLens: input.communityLens,
    locationLabel: input.locationLabel,
    disclaimer: input.disclaimer,
    sourceCount: 0,
    sources: [],
  };
}

/**
 * The same service powers a live Kinfolk answer and a Library entry. It first
 * reuses a current, cited answer; otherwise it researches, synthesizes, and
 * stores a new entry. This is what makes prior community knowledge recallable.
 */
export async function answerAndArchiveResearchQuestion(input: {
  question: string;
  locationLabel: string | null;
  repository: LibraryRepository;
  researchProvider: ExternalResearchProvider;
  writer: LibrarySynthesisWriter;
}): Promise<{ entry: LibraryEntry; reused: boolean }> {
  const { question, locationLabel, repository, researchProvider, writer } = input;
  const policy = getResearchPolicy(question);
  const communityLens = policy.searchPrefix ? DEFAULT_COMMUNITY_LENS : "member-specified community lens";
  const normalizedQuestion = normalizeQuestion(question);
  const currentAfter = new Date(Date.now() - policy.archiveTtlHours * 60 * 60 * 1_000);

  const reusable = await repository.findReusableEntry({
    normalizedQuestion,
    domain: policy.domain,
    communityLens,
    locationLabel,
    currentAfter,
  });

  if (reusable) return { entry: reusable, reused: true };

  const searchQuery = buildCommunityResearchQuery(question, policy.domain);
  const documents = validDocuments(
    await researchProvider.search({
      query: searchQuery,
      allowedDomains: policy.allowDomains,
      maxResults: MAX_RESEARCH_RESULTS,
    }),
    policy.allowDomains,
  );

  if (documents.length < 2) {
    return {
      entry: await repository.saveEntry(
        fallbackEntry({
          question,
          domain: policy.domain,
          communityLens,
          locationLabel,
          disclaimer: policy.disclaimer,
        }),
      ),
      reused: false,
    };
  }

  const draft = await writer.writeStructured({
    question,
    domain: policy.domain,
    communityLens,
    locationLabel,
    disclaimer: policy.disclaimer,
    // Website text is untrusted research data. The writer receives explicit
    // source content only; it must never follow instructions inside a source.
    sources: documents,
  });

  const citedIndexes = [...new Set(draft.citedSourceIndexes)]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < documents.length)
    .slice(0, documents.length);
  const citedDocuments = (citedIndexes.length > 0 ? citedIndexes : documents.map((_, index) => index)).map(
    (index) => documents[index],
  );

  return {
    entry: await repository.saveEntry({
      topicSlug: policy.domain,
      question,
      normalizedQuestion,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      body: draft.body.trim(),
      domain: policy.domain,
      communityLens,
      locationLabel,
      disclaimer: policy.disclaimer,
      sourceCount: citedDocuments.length,
      sources: citedDocuments.map(toKnowledgeSource),
    }),
    reused: false,
  };
}
