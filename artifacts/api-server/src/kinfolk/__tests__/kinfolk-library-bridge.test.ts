import { describe, expect, it, vi } from "vitest";
import type { LibraryRepository } from "../../library/types";
import { findApprovedLibraryAnswer } from "../kinfolkLibraryBridge";

function repositoryWithSearch(
  searchPublishedContent: LibraryRepository["searchPublishedContent"],
): LibraryRepository {
  return {
    searchPublishedContent,
    findReusableEntry: vi.fn(),
    saveEntry: vi.fn(),
    recordCoverageSignal: vi.fn(),
    listTopics: vi.fn(),
    findTopicBySlug: vi.fn(),
    listTopicEntries: vi.fn(),
    setTopicFollow: vi.fn(),
  } as LibraryRepository;
}

describe("findApprovedLibraryAnswer", () => {
  it("answers HBCU wording from one published, source-backed Library entry", async () => {
    const searchPublishedContent = vi.fn<LibraryRepository["searchPublishedContent"]>()
      .mockResolvedValue({
        total: 2,
        results: [
          {
            kind: "topic",
            id: "topic-education",
            slug: "education-learning",
            title: "Education & Learning",
            summary: "Education foundation",
            iconKey: "education",
            entryCount: 1,
          },
          {
            kind: "entry",
            id: "entry-hbcu",
            title: "Historically Black Colleges and Universities (HBCUs)",
            summary: "HBCUs are accredited colleges with a historic mission.",
            body: "They expanded access to higher education and remain diverse institutions today.",
            topicSlug: "education-learning",
            topicTitle: "Education & Learning",
            sourceCount: 2,
            sources: [
              { url: "https://www.ed.gov/hbcus", title: "U.S. Department of Education", publisher: "ED" },
              { url: "https://www.pewresearch.org/hbcus", title: "Pew Research Center", publisher: "Pew" },
            ],
            refreshedAt: new Date("2026-09-08T00:00:00Z"),
          },
        ],
      });

    const result = await findApprovedLibraryAnswer({
      memberQuestion: "Tell me about HBCUs",
      repository: repositoryWithSearch(searchPublishedContent),
    });

    expect(result).toMatchObject({
      type: "approved_library",
      entryId: "entry-hbcu",
      topicSlug: "education-learning",
      sourceCount: 2,
    });
    expect(result?.message).toContain("HBCUs are accredited colleges");
    expect(result?.message).toContain("expanded access to higher education");
    expect(result?.sources).toHaveLength(2);
    expect(searchPublishedContent).toHaveBeenCalledWith(expect.objectContaining({
      searchTerms: expect.arrayContaining(["hbcu", "hbcus"]),
      preferredTopicSlugs: expect.arrayContaining(["education-learning", "places-our-history"]),
      limit: 6,
      offset: 0,
    }));
  });

  it("does not return source-less or topic-only coverage as an answer", async () => {
    const repository = repositoryWithSearch(vi.fn().mockResolvedValue({
      total: 1,
      results: [{
        kind: "topic",
        id: "topic-education",
        slug: "education-learning",
        title: "Education & Learning",
        summary: "Education foundation",
        iconKey: "education",
        entryCount: 0,
      }],
    }));

    await expect(findApprovedLibraryAnswer({
      memberQuestion: "Tell me about HBCUs",
      repository,
    })).resolves.toBeNull();
  });

  it("leaves long or unsuitable turns to the existing Kinfolk policies", async () => {
    const searchPublishedContent = vi.fn();
    const repository = repositoryWithSearch(searchPublishedContent as LibraryRepository["searchPublishedContent"]);

    await expect(findApprovedLibraryAnswer({
      memberQuestion: "x".repeat(121),
      repository,
    })).resolves.toBeNull();
    expect(searchPublishedContent).not.toHaveBeenCalled();
  });
});
