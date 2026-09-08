import { answerAndArchiveResearchQuestion } from "../library/livingLibrary";
import {
  parseLibrarySearchQuery,
  searchLivingLibrary,
} from "../library/librarySearch";
import type {
  ExternalResearchProvider,
  LibraryRepository,
  LibrarySynthesisWriter,
} from "../library/types";

export type ApprovedLibraryAnswer = {
  type: "approved_library";
  message: string;
  sources: Array<{ title: string; url: string }>;
  sourceCount: number;
  topicSlug: string;
  topicTitle: string;
  entryId: string;
  refreshedAt: Date;
};

/**
 * Reuse already-published shared Library knowledge before calling an external
 * model. This is semantic search through the same governed Library index used
 * by the Library UI; it never reads pending entries and never publishes data.
 */
export async function findApprovedLibraryAnswer(input: {
  memberQuestion: string;
  repository: LibraryRepository;
}): Promise<ApprovedLibraryAnswer | null> {
  const question = input.memberQuestion.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (question.length < 3 || question.length > 120) return null;

  const parsed = parseLibrarySearchQuery({ q: question, limit: "6" });
  if (!parsed.ok) return null;
  const page = await searchLivingLibrary(input.repository, parsed.value);
  const entry = page.results.find((result) => result.kind === "entry");
  if (!entry || entry.sourceCount < 1 || entry.sources.length < 1) return null;

  return {
    type: "approved_library",
    message: `${entry.summary}\n\n${entry.body}`,
    sources: entry.sources.map((source) => ({ title: source.title, url: source.url })),
    sourceCount: entry.sourceCount,
    topicSlug: entry.topicSlug,
    topicTitle: entry.topicTitle,
    entryId: entry.id,
    refreshedAt: entry.refreshedAt,
  };
}

/**
 * Insert this branch into the existing Kinfolk answer flow after location
 * resolution and before the normal generic-answer fallback.
 */
export async function answerWithLivingLibrary(input: {
  memberQuestion: string;
  locationLabel: string | null;
  repository: LibraryRepository;
  researchProvider: ExternalResearchProvider;
  writer: LibrarySynthesisWriter;
}) {
  const { entry, reused } = await answerAndArchiveResearchQuestion({
    question: input.memberQuestion,
    locationLabel: input.locationLabel,
    repository: input.repository,
    researchProvider: input.researchProvider,
    writer: input.writer,
  });

  return {
    type: "library_research",
    message: entry.summary,
    disclaimer: entry.disclaimer,
    sources: entry.sources.map((source) => ({ title: source.title, url: source.url })),
    sourceCount: entry.sourceCount,
    isReliable: entry.sourceCount > 0 && entry.sources.length > 0,
    reused,
    libraryEntry: entry.publicationStatus === "published" ? {
      id: entry.id,
      topicSlug: entry.domain,
      url: `/library/topics/${encodeURIComponent(entry.domain)}#entry-${entry.id}`,
      readMoreLabel: "Read the full source-cited entry",
    } : null,
  };
}

/*
  Existing Kinfolk UI contract:

  - Render `message` as the concise, in-chat answer.
  - Render up to two `sources` as clickable citations.
  - Render `libraryEntry.readMoreLabel` as a link to `libraryEntry.url`.
  - Do not repeat the full entry body inside chat; the Library holds the
    expandable Read More / Read Less version.
*/
