import type { LibraryRepository } from "../library/types";
import type { ContextualEvidenceItem } from "./contextual-research-orchestrator";

/**
 * Read-only published-Library retrieval. Pending entries, private memories, and
 * raw member queries never leave this boundary. Entity records are resolved by
 * the existing release-gated context resolver before this function is called.
 */
export async function retrieveApprovedInternalLibrary(input: {
  repository: LibraryRepository;
  queries: string[];
  signal?: AbortSignal;
  now?: () => string;
}): Promise<ContextualEvidenceItem[]> {
  if (input.signal?.aborted) return [];
  const now = input.now?.() ?? new Date().toISOString();
  const query = input.queries[0]?.trim();
  if (!query) return [];
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 2).slice(0, 8);
  if (!terms.length) return [];
  try {
    const page = await input.repository.searchPublishedContent({
      normalizedQuery: query.toLowerCase().slice(0, 240),
      searchTerms: terms,
      patterns: [],
      preferredTopicSlugs: [],
      limit: 8,
      offset: 0,
    });
    if (input.signal?.aborted) return [];
    return page.results.flatMap((result) => result.kind === "entry"
      ? result.sources.map((source) => ({
          title: source.title,
          url: source.url,
          publisher: source.publisher,
          kind: "library_published" as const,
          excerpt: result.summary.slice(0, 800),
          publishedAt: result.refreshedAt.toISOString(),
          retrievedAt: now,
          supports: [result.title],
          libraryPath: `/library/topics/${encodeURIComponent(result.topicSlug)}`,
        }))
      : []).slice(0, 8);
  } catch {
    // Schema/repository availability is represented by the orchestrator's gap,
    // never by fabricated Library material.
    return [];
  }
}
