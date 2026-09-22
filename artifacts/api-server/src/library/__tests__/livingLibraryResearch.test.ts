import { describe, expect, it, vi } from "vitest";
import { answerAndArchiveResearchQuestion, LibraryEvidenceInsufficientError, validResearchDocuments } from "../livingLibrary";
import { buildCommunityResearchQuery, getResearchPolicy, isSafeSourceUrl } from "../researchPolicy";
import type { ExternalResearchProvider, LibraryRepository, LibrarySynthesisWriter } from "../types";

function repository(): LibraryRepository {
  return { findReusableEntry: vi.fn().mockResolvedValue(null), saveEntry: vi.fn(async (input) => ({ ...input, id: "candidate", topicId: "topic", publicationStatus: input.publicationStatus ?? "pending", createdAt: new Date(), refreshedAt: new Date() })), recordCoverageSignal: vi.fn(), listTopics: vi.fn(), searchPublishedContent: vi.fn(), findTopicBySlug: vi.fn(), listTopicEntries: vi.fn(), setTopicFollow: vi.fn() };
}

const spiritualDocuments = [
  { url: "https://www.pewresearch.org/religion/afterlife", title: "Pew", content: "Beliefs across religious traditions and people with no religious affiliation vary. ".repeat(6), publisher: "pewresearch.org", publishedAt: null },
  { url: "https://pluralism.org/religious-traditions", title: "Pluralism Project", content: "Traditions hold different teachings about ancestors, rebirth, resurrection, and mortality. ".repeat(6), publisher: "pluralism.org", publishedAt: null },
];

const blackWomenCancerDocuments = [
  {
    url: "https://www.cdc.gov/cancer/health-equity/african-american.html",
    title: "Cancer and African American People",
    content: "CDC explains that Black women are more likely to die from breast cancer and may be diagnosed at later stages. Screening and discussions with a qualified clinician remain important. ".repeat(4),
    publisher: "cdc.gov",
    publishedAt: null,
  },
  {
    url: "https://www.cancer.gov/news-events/cancer-currents-blog/2021/breast-cancer-risk-calculator-us-black-women",
    title: "New Risk Model Aims to Reduce Breast Cancer Disparities in Black Women",
    content: "The National Cancer Institute describes evidence and research tools for breast cancer risk and screening discussions in Black women. Individual screening decisions should be made with a qualified clinician. ".repeat(4),
    publisher: "cancer.gov",
    publishedAt: null,
  },
];

describe("Living Library evidence and identity policy", () => {
  it("rejects unsafe links while accepting governed wildcard and conventional www hosts", () => {
    expect(isSafeSourceUrl("https://www.loc.gov/item/1")).toBe(true);
    expect(isSafeSourceUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeSourceUrl("http://www.loc.gov/item/1")).toBe(false);
    expect(validResearchDocuments(spiritualDocuments, ["pewresearch.org", "pluralism.org"])).toHaveLength(2);
    expect(validResearchDocuments([{ ...spiritualDocuments[0], url: "https://history.si.edu/a" }], ["*.edu"])).toHaveLength(1);
    expect(validResearchDocuments([{ ...spiritualDocuments[0], url: "http://pewresearch.org/a" }], ["pewresearch.org"])).toEqual([]);
  });

  it("uses the diaspora-first product lens without inferring reader identity", () => {
    const historyQuery = buildCommunityResearchQuery("oldest bookstore in the US", "history");
    const faithQuery = buildCommunityResearchQuery("life after death", "history");
    expect(historyQuery).toContain("oldest bookstore in the US");
    expect(faithQuery).toContain("life after death");
    expect(historyQuery).toContain("Research lens: African diaspora and Black communities.");
    expect(faithQuery).toContain("Research lens: African diaspora and Black communities.");
  });

  it("completes a Black-women breast-cancer brief only with direct authoritative evidence", async () => {
    const repo = repository();
    const researchProvider: ExternalResearchProvider = {
      name: "openai",
      search: vi.fn().mockResolvedValue({
        documents: blackWomenCancerDocuments,
        provider: "openai",
        status: "available",
      }),
    };
    const writer: LibrarySynthesisWriter = {
      writeStructured: vi.fn().mockResolvedValue({
        title: "Breast cancer screening evidence for Black women",
        summary: "A source-cited education brief.",
        body: "This is educational information, not individual screening advice.",
        citedSourceIndexes: [0, 1],
        sourceNotes: [
          { sourceIndex: 0, whyItMatters: "CDC describes cancer disparities and breast-cancer context." },
          { sourceIndex: 1, whyItMatters: "NCI describes Black-women-specific breast-cancer research." },
        ],
        relatedQuestions: ["What questions can I ask a clinician about my screening plan?"],
      }),
    };

    const result = await answerAndArchiveResearchQuestion({
      question: "#BlackWomen breast cancer screening",
      locationLabel: null,
      repository: repo,
      researchProvider,
      writer,
    });

    expect(researchProvider.search).toHaveBeenCalledWith(expect.objectContaining({
      query: expect.stringContaining("National Cancer Institute (cancer.gov)"),
    }));
    expect(result.entry).toMatchObject({
      publicationStatus: "published",
      researchLenses: ["#BlackWomen"],
      sourceCount: 2,
    });
  });

  it("requires multi-perspective spiritual framing and publishes a general, fully cited brief", async () => {
    const repo = repository();
    const researchProvider: ExternalResearchProvider = { name: "openai", search: vi.fn().mockResolvedValue({ documents: spiritualDocuments, provider: "openai", status: "available" }) };
    const writer: LibrarySynthesisWriter = { writeStructured: vi.fn().mockResolvedValue({ title: "Perspectives on life after death", summary: "Traditions differ, and no unknowable answer is established as fact.", body: "Christian, Islamic, African and diasporic, philosophical, and secular perspectives differ.", citedSourceIndexes: [0, 1], sourceNotes: [{ sourceIndex: 0, whyItMatters: "It documents variation in beliefs." }, { sourceIndex: 1, whyItMatters: "It explains multiple religious traditions." }], relatedQuestions: ["How do ancestor traditions vary?", "What does secular scholarship study?"] }) };
    const result = await answerAndArchiveResearchQuestion({ question: "life after death", locationLabel: null, repository: repo, researchProvider, writer, internalResultCount: 0 });
    expect(writer.writeStructured).toHaveBeenCalledWith(expect.objectContaining({ communityLens: expect.stringMatching(/requested evidence scope, not a claim about the reader/i) }));
    expect(result.entry).toMatchObject({ publicationStatus: "published", relatedQuestions: expect.arrayContaining(["How do ancestor traditions vary?"]) });
    expect(repo.saveEntry).toHaveBeenCalledWith(expect.objectContaining({
      topicSlug: "faith-spirituality-community-institutions",
      question: "life after death",
      normalizedQuestion: "life after death",
      publicationStatus: "published",
      locationLabel: null,
      sources: expect.arrayContaining([expect.objectContaining({ whyItMatters: "It documents variation in beliefs." })]),
    }));
  });

  it("keeps member-specific research private even when the evidence is otherwise reusable", async () => {
    const repo = repository();
    const researchProvider: ExternalResearchProvider = { name: "openai", search: vi.fn().mockResolvedValue({ documents: spiritualDocuments, provider: "openai", status: "available" }) };
    const writer: LibrarySynthesisWriter = { writeStructured: vi.fn().mockResolvedValue({ title: "A private question", summary: "A scoped answer.", body: "A source-cited explanation.", citedSourceIndexes: [0, 1], sourceNotes: [{ sourceIndex: 0, whyItMatters: "Documents variation." }, { sourceIndex: 1, whyItMatters: "Explains traditions." }], relatedQuestions: ["A related question"] }) };

    await answerAndArchiveResearchQuestion({ question: "What should I ask about life after death?", locationLabel: null, repository: repo, researchProvider, writer });

    expect(repo.saveEntry).toHaveBeenCalledWith(expect.objectContaining({
      question: "Governed live-research candidate",
      normalizedQuestion: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      publicationStatus: "pending",
    }));
  });

  it("never reuses a pending candidate returned by a broken repository boundary", async () => {
    const repo = repository();
    vi.mocked(repo.findReusableEntry).mockResolvedValue({
      ...(await vi.mocked(repo.saveEntry)({
        topicSlug: "culture-heritage",
        question: "oldest bookstore in the US",
        normalizedQuestion: "oldest bookstore in the us",
        title: "Unreviewed candidate",
        summary: "Not approved.",
        body: "Not approved.",
        domain: "history",
        communityLens: "community",
        locationLabel: null,
        disclaimer: null,
        sourceCount: 2,
        sources: [],
        relatedQuestions: [],
        provider: "openai",
      })),
      publicationStatus: "pending",
    });
    vi.mocked(repo.saveEntry).mockClear();
    const researchProvider: ExternalResearchProvider = { name: "openai", search: vi.fn() };
    const writer: LibrarySynthesisWriter = { writeStructured: vi.fn() };
    await expect(answerAndArchiveResearchQuestion({ question: "oldest bookstore in the US", locationLabel: null, repository: repo, researchProvider, writer })).rejects.toThrow(/non-published/i);
    expect(researchProvider.search).not.toHaveBeenCalled();
    expect(repo.saveEntry).not.toHaveBeenCalled();
  });

  it("uses high-stakes authoritative policies and rejects insufficient evidence without a fake entry", async () => {
    const policy = getResearchPolicy("Should I invest my retirement in crypto?");
    expect(policy.domain).toBe("financial");
    expect(policy.disclaimer).toMatch(/not investment.*advice/i);
    expect(policy.allowDomains).toEqual(expect.arrayContaining(["investor.gov", "sec.gov"]));
    const repo = repository();
    const researchProvider: ExternalResearchProvider = { name: "openai", search: vi.fn().mockResolvedValue({ documents: [spiritualDocuments[0]], provider: "openai", status: "available" }) };
    const writer: LibrarySynthesisWriter = { writeStructured: vi.fn() };
    await expect(answerAndArchiveResearchQuestion({ question: "life after death", locationLabel: null, repository: repo, researchProvider, writer })).rejects.toBeInstanceOf(LibraryEvidenceInsufficientError);
    expect(repo.saveEntry).not.toHaveBeenCalled();
    expect(repo.recordCoverageSignal).toHaveBeenCalledWith(expect.objectContaining({ outcome: "insufficient" }));
  });

  it("treats fertility and IVF questions as high-stakes health research", () => {
    const policy = getResearchPolicy("What should I understand about infertility and IVF?");
    expect(policy.domain).toBe("medical");
    expect(policy.disclaimer).toMatch(/not a medical diagnosis/i);
    expect(policy.allowDomains).toEqual(expect.arrayContaining(["nih.gov", "womenshealth.gov"]));
  });
});
