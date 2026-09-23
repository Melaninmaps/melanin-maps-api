import { describe, expect, it, vi } from "vitest";
import type { ExternalResearchProvider, LibraryRepository, LibrarySynthesisWriter } from "../../library/types";
import { answerWithLivingLibrary, findApprovedLibraryAnswer } from "../kinfolkLibraryBridge";

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

describe("answerWithLivingLibrary", () => {
  const generalDocuments = [
    { url: "https://www.cdc.gov/cancer/breast/basic_info/index.htm", title: "CDC breast cancer", content: "CDC provides general breast cancer information for readers. ".repeat(8), publisher: "cdc.gov", publishedAt: null },
    { url: "https://www.cancer.gov/types/breast/patient/breast-screening-pdq", title: "NCI breast cancer", content: "NCI provides current breast cancer screening information. ".repeat(8), publisher: "cancer.gov", publishedAt: null },
  ];
  const blackWomenDocuments = [
    { url: "https://www.cdc.gov/cancer/breast/young_women/index.htm", title: "CDC Black women breast cancer", content: "CDC information directly discusses Black women and breast cancer disparities. ".repeat(8), publisher: "cdc.gov", publishedAt: null },
    { url: "https://pubmed.ncbi.nlm.nih.gov/12345678/", title: "Black women breast cancer study", content: "A peer-reviewed study discusses Black women and breast cancer outcomes. ".repeat(8), publisher: "PubMed", publishedAt: null },
  ];

  function researchRepository(): LibraryRepository {
    return {
      ...repositoryWithSearch(vi.fn().mockResolvedValue({ total: 0, results: [] })),
      findReusableEntry: vi.fn().mockResolvedValue(null),
      saveEntry: vi.fn().mockImplementation(async (input) => ({ ...input, id: `entry-${input.researchLenses?.join("-")}`, topicId: "topic-health", createdAt: new Date(), refreshedAt: new Date() })),
    } as LibraryRepository;
  }

  const writer: LibrarySynthesisWriter = {
    writeStructured: vi.fn().mockResolvedValue({
      title: "Breast cancer information",
      summary: "A source-cited current overview.",
      body: "Educational information only.",
      citedSourceIndexes: [0, 1],
      sourceNotes: [{ sourceIndex: 0, whyItMatters: "It supplies current public-health context." }, { sourceIndex: 1, whyItMatters: "It supplies a second authoritative source." }],
      relatedQuestions: [],
    }),
  };

  it("keeps the general answer first and returns a separately sourced community context", async () => {
    const provider: ExternalResearchProvider = {
      name: "openai",
      search: vi.fn().mockImplementation(async ({ query }) => ({ documents: String(query).includes("Community context requested") ? blackWomenDocuments : generalDocuments, provider: "openai", status: "available" })),
    };

    const result = await answerWithLivingLibrary({
      memberQuestion: "#BlackWomen breast cancer screening",
      locationLabel: null,
      repository: researchRepository(),
      researchProvider: provider,
      writer,
    });

    expect(result.message).toMatch(/^A source-cited current overview\./);
    expect(result.message).toContain("Community context (#BlackWomen)");
    expect(result.sources).toHaveLength(2);
    expect(result.communityContext).toMatchObject({
      status: "available",
      researchLenses: ["#BlackWomen"],
    });
    expect(result.communityContext?.sources).toContainEqual(expect.objectContaining({ title: "CDC Black women breast cancer" }));
  });

  it("preserves the general answer if the supplemental packet lacks direct evidence", async () => {
    const provider: ExternalResearchProvider = {
      name: "openai",
      search: vi.fn().mockResolvedValue({ documents: generalDocuments, provider: "openai", status: "available" }),
    };
    const result = await answerWithLivingLibrary({ memberQuestion: "#BlackWomen breast cancer screening", locationLabel: null, repository: researchRepository(), researchProvider: provider, writer });

    expect(result.isReliable).toBe(true);
    expect(result.message).toContain("The current foundation above is still available");
    expect(result.communityContext).toMatchObject({ status: "insufficient", researchLenses: ["#BlackWomen"] });
  });
});
