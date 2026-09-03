import { describe, expect, it, vi } from "vitest";
import {
  encodeLibrarySearchCursor,
  parseLibrarySearchQuery,
  resolveLibrarySearchVocabulary,
  searchLivingLibrary,
} from "../librarySearch";
import type { LibraryRepository } from "../types";

function repositoryStub(
  searchPublishedContent: LibraryRepository["searchPublishedContent"],
): LibraryRepository {
  return {
    findReusableEntry: vi.fn(),
    saveEntry: vi.fn(),
    recordCoverageSignal: vi.fn(),
    listTopics: vi.fn(),
    searchPublishedContent,
    findTopicBySlug: vi.fn(),
    listTopicEntries: vi.fn(),
    setTopicFollow: vi.fn(),
  };
}

describe("Library search query parsing", () => {
  it("normalizes a valid query and decodes an opaque cursor", () => {
    expect(
      parseLibrarySearchQuery({
        q: "  HVAC   Training  ",
        limit: "12",
        cursor: encodeLibrarySearchCursor(24),
      }),
    ).toEqual({
      ok: true,
      value: {
        query: "HVAC Training",
        normalizedQuery: "hvac training",
        limit: 12,
        offset: 24,
      },
    });
  });

  it.each([
    [{}, 'Library search requires one text query in "q".'],
    [{ q: ["hvac", "plumbing"] }, 'Library search requires one text query in "q".'],
    [{ q: "   " }, "Enter a Library search term."],
    [{ q: "x".repeat(121) }, "Library search terms must be 120 characters or fewer."],
    [{ q: "hvac", limit: "0" }, "Search limit must be a whole number from 1 through 20."],
    [{ q: "hvac", limit: "2.5" }, "Search limit must be a whole number from 1 through 20."],
    [{ q: "hvac", cursor: "not/a/cursor" }, "Search cursor is invalid or expired."],
  ])("rejects malformed query input %#", (query, error) => {
    expect(parseLibrarySearchQuery(query)).toEqual({ ok: false, error });
  });
});

describe("Library internal-first vocabulary", () => {
  it("maps an HVAC query to durable topic aliases and escaped internal patterns", () => {
    const vocabulary = resolveLibrarySearchVocabulary("hvac");

    expect(vocabulary.preferredTopicSlugs).toEqual([
      "trades-skills-certifications",
    ]);
    expect(vocabulary.patterns).toEqual(
      expect.arrayContaining([
        "%hvac%",
        "%hvacr%",
        "%heating%",
        "%ventilation%",
        "%air conditioning%",
        "%refrigeration%",
      ]),
    );
  });

  it("escapes LIKE wildcards from member input", () => {
    expect(resolveLibrarySearchVocabulary("100%_ready").patterns).toEqual([
      "%100\\%\\_ready%",
    ]);
  });

  it("returns internal results immediately with nonblocking HVAC intent choices", async () => {
    const searchPublishedContent = vi.fn().mockResolvedValue({
      results: [
        {
          kind: "topic",
          id: "topic-1",
          slug: "trades-skills-certifications",
          title: "Trades, Skills & Certifications",
          summary: "Apprenticeships, skilled trades, certifications, and career pathways.",
          iconKey: "home-services",
          entryCount: 2,
        },
      ],
      total: 2,
    });

    const response = await searchLivingLibrary(
      repositoryStub(searchPublishedContent),
      {
        query: "HVAC",
        normalizedQuery: "hvac",
        limit: 1,
        offset: 0,
      },
    );

    expect(searchPublishedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        normalizedQuery: "hvac",
        preferredTopicSlugs: ["trades-skills-certifications"],
        limit: 1,
        offset: 0,
      }),
    );
    expect(response.results).toHaveLength(1);
    expect(response.nextCursor).toBe(encodeLibrarySearchCursor(1));
    expect(response.clarification?.choices).toHaveLength(5);
    expect(response.clarification?.prompt).toMatch(/HVAC information/i);
    expect(response.webResearch.status).toBe("not_needed");
  });

  it("treats a matching foundation shell with zero approved entries as sparse", async () => {
    const response = await searchLivingLibrary(
      repositoryStub(vi.fn().mockResolvedValue({
        results: [{
          kind: "topic",
          id: "topic-1",
          slug: "trades-skills-certifications",
          title: "Trades, Skills & Certifications",
          summary: "Apprenticeships and career pathways.",
          iconKey: "home-services",
          entryCount: 0,
        }],
        total: 1,
      })),
      { query: "HVAC", normalizedQuery: "hvac", limit: 6, offset: 0 },
    );
    expect(response.webResearch).toMatchObject({ status: "available" });
  });
});
