import { describe, expect, it, vi } from "vitest";
import {
  buildCommunityLensResearchQuery,
  buildCommunitySupplementResearchQuery,
  buildFoundationResearchQuery,
  hasDirectEvidenceForExplicitResearchLenses,
  researchLensFacetKeys,
  resolveCommunityResearchLenses,
  resolveCommunityResearchSupplementLenses,
  stripCommunityResearchScope,
  stripCommunityResearchLensTags,
} from "../communityResearchLens";
import {
  parseLibrarySearchQuery,
  searchLivingLibrary,
} from "../librarySearch";
import type { LibraryRepository } from "../types";

describe("Library community research lenses", () => {
  it("uses the diaspora lens by default without turning it into a member identity", () => {
    const lenses = resolveCommunityResearchLenses("breast cancer screening");
    expect(lenses.map((lens) => lens.tag)).toEqual(["#Diaspora"]);
    expect(buildCommunityLensResearchQuery("breast cancer screening", lenses)).toContain(
      "Research lens: African diaspora and Black communities.",
    );
  });

  it("treats a supported hashtag as an explicit evidence scope and removes it from the topic query", () => {
    const lenses = resolveCommunityResearchLenses("#BlackWomen breast cancer screening");
    expect(lenses.map((lens) => lens.tag)).toEqual(["#BlackWomen"]);
    expect(stripCommunityResearchLensTags("#BlackWomen breast cancer screening")).toBe(
      "breast cancer screening",
    );
    expect(researchLensFacetKeys(lenses)).toEqual(["research-lens:black-women"]);
  });

  it("builds a general foundation independently from an explicit community packet", () => {
    const question = "#BlackWomen breast cancer screening";
    const lenses = resolveCommunityResearchLenses(question);
    const supplementLenses = resolveCommunityResearchSupplementLenses(question, lenses);
    expect(stripCommunityResearchScope(question, supplementLenses)).toBe("breast cancer screening");
    expect(buildFoundationResearchQuery(question)).toContain("current, authoritative foundation");
    expect(buildFoundationResearchQuery(question)).not.toContain("Community context requested");
    expect(buildCommunitySupplementResearchQuery(question, supplementLenses)).toContain("Community context requested: Black women");
    expect(buildCommunitySupplementResearchQuery(question, supplementLenses)).toContain("Do not replace the general foundation");
  });

  it("does not create a supplemental packet for the editorial default unless #Diaspora is typed", () => {
    expect(resolveCommunityResearchSupplementLenses("breast cancer screening")).toEqual([]);
    expect(resolveCommunityResearchSupplementLenses("#Diaspora breast cancer screening").map((lens) => lens.tag)).toEqual(["#Diaspora"]);
  });

  it("requires a subject after a lens tag", () => {
    expect(parseLibrarySearchQuery({ q: "#BlackWomen" })).toEqual({
      ok: false,
      error: "Add a topic after the research lens tag, such as #BlackWomen breast cancer.",
    });
  });

  it("rejects generic evidence when a narrower research lens has no direct source", () => {
    const lenses = resolveCommunityResearchLenses("#BlackWomen breast cancer");
    expect(hasDirectEvidenceForExplicitResearchLenses([
      { title: "Breast cancer overview", url: "https://www.cdc.gov/example", content: "General screening information." },
    ], lenses)).toBe(false);
    expect(hasDirectEvidenceForExplicitResearchLenses([
      { title: "Black women and breast cancer", url: "https://www.cdc.gov/example", content: "Group-level evidence." },
      { title: "Breast cancer overview", url: "https://www.cdc.gov/overview", content: "General screening information." },
    ], lenses)).toBe(true);
  });

  it("passes all requested lenses to the approved-entry repository before falling back to research", async () => {
    const parsed = parseLibrarySearchQuery({ q: "#BlackWomen breast cancer" });
    if (!parsed.ok) throw new Error("expected parsed query");
    const repository = {
      searchPublishedContent: vi.fn().mockResolvedValue({ results: [], total: 0 }),
    } as unknown as LibraryRepository;

    await searchLivingLibrary(repository, parsed.value);

    expect(repository.searchPublishedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        normalizedQuery: "breast cancer",
        requiredResearchLensFacetKeys: ["research-lens:black-women"],
      }),
    );
  });
});
