import { answerAndArchiveResearchQuestion } from "../library/livingLibrary";
import type {
  ExternalResearchProvider,
  LibraryRepository,
  LibrarySynthesisWriter,
} from "../library/types";

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
    reused,
    libraryEntry: {
      id: entry.id,
      topicSlug: entry.domain,
      url: `/library/topics/${encodeURIComponent(entry.domain)}#entry-${entry.id}`,
      readMoreLabel: "Read the full source-cited entry",
    },
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
