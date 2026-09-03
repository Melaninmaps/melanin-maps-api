import { describe, expect, it, vi } from "vitest";
import { answerAndArchiveResearchQuestion, LibraryEvidenceInsufficientError, validResearchDocuments } from "../livingLibrary";
import { buildCommunityResearchQuery, getResearchPolicy, isSafeSourceUrl } from "../researchPolicy";
import type { ExternalResearchProvider, LibraryRepository, LibrarySynthesisWriter } from "../types";

function repository(): LibraryRepository {
  return { findReusableEntry: vi.fn().mockResolvedValue(null), saveEntry: vi.fn(async (input) => ({ ...input, id: "candidate", topicId: "topic", publicationStatus: "pending", createdAt: new Date(), refreshedAt: new Date() })), recordCoverageSignal: vi.fn(), listTopics: vi.fn(), searchPublishedContent: vi.fn(), findTopicBySlug: vi.fn(), listTopicEntries: vi.fn(), setTopicFollow: vi.fn() };
}

const spiritualDocuments = [
  { url: "https://www.pewresearch.org/religion/afterlife", title: "Pew", content: "Beliefs across religious traditions and people with no religious affiliation vary. ".repeat(6), publisher: "pewresearch.org", publishedAt: null },
  { url: "https://pluralism.org/religious-traditions", title: "Pluralism Project", content: "Traditions hold different teachings about ancestors, rebirth, resurrection, and mortality. ".repeat(6), publisher: "pluralism.org", publishedAt: null },
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

  it("does not infer identity or prepend demographics to a broad question", () => {
    expect(buildCommunityResearchQuery("oldest bookstore in the US", "history")).toBe("oldest bookstore in the US");
    expect(buildCommunityResearchQuery("life after death", "history")).toBe("life after death");
  });

  it("requires multi-perspective spiritual framing and stores only a pending candidate", async () => {
    const repo = repository();
    const researchProvider: ExternalResearchProvider = { name: "openai", search: vi.fn().mockResolvedValue({ documents: spiritualDocuments, provider: "openai", status: "available" }) };
    const writer: LibrarySynthesisWriter = { writeStructured: vi.fn().mockResolvedValue({ title: "Perspectives on life after death", summary: "Traditions differ, and no unknowable answer is established as fact.", body: "Christian, Islamic, African and diasporic, philosophical, and secular perspectives differ.", citedSourceIndexes: [0, 1], relatedQuestions: ["How do ancestor traditions vary?", "What does secular scholarship study?"] }) };
    const result = await answerAndArchiveResearchQuestion({ question: "life after death", locationLabel: null, repository: repo, researchProvider, writer, internalResultCount: 0 });
    expect(writer.writeStructured).toHaveBeenCalledWith(expect.objectContaining({ communityLens: expect.stringMatching(/editorial perspective; no member identity inferred/i) }));
    expect(result.entry).toMatchObject({ publicationStatus: "pending", relatedQuestions: expect.arrayContaining(["How do ancestor traditions vary?"]) });
    expect(repo.saveEntry).toHaveBeenCalledWith(expect.objectContaining({
      topicSlug: "faith-spirituality-community-institutions",
      question: "Governed live-research candidate",
      normalizedQuestion: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      locationLabel: null,
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
});
