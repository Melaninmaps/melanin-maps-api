import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { safeLibrarySourceHref } from "../features/library/librarySourceUrl";

const pageSource = readFileSync(
  fileURLToPath(new URL("../features/library/LibrarySearchPage.tsx", import.meta.url)),
  "utf8",
);
const collectionSource = readFileSync(
  fileURLToPath(new URL("../pages/library.tsx", import.meta.url)),
  "utf8",
);
const researchPathSource = readFileSync(
  fileURLToPath(new URL("../features/library/libraryResearchPaths.ts", import.meta.url)),
  "utf8",
);

describe("Living Library research presentation", () => {
  it("allows visible HTTPS citations and rejects unsafe source schemes or credentials", () => {
    expect(safeLibrarySourceHref("https://www.loc.gov/item/123")).toBe("https://www.loc.gov/item/123");
    expect(safeLibrarySourceHref("javascript:alert(1)")).toBeNull();
    expect(safeLibrarySourceHref("http://example.org/source")).toBeNull();
    expect(safeLibrarySourceHref("https://name:secret@example.org/source")).toBeNull();
    expect(safeLibrarySourceHref("https://localhost/source")).toBeNull();
    expect(safeLibrarySourceHref("https://service.internal/source")).toBeNull();
    expect(safeLibrarySourceHref("https://127.0.0.1/source")).toBeNull();
  });

  it("presents a concise overview with accessible See More and See Less controls", () => {
    expect(pageSource).toContain('aria-expanded={expanded}');
    expect(pageSource).toContain('aria-controls={detailsId}');
    expect(pageSource).toContain('expanded ? "See Less" : "See More"');
    expect(pageSource).toContain('className="library-research-overview"');
  });

  it("shows source count, freshness, related branches, and safe new-tab link attributes", () => {
    expect(pageSource).toContain("formattedFreshness(refreshedAt)");
    expect(pageSource).toContain("Related questions and branches");
    expect(pageSource).toContain('rel="noopener noreferrer"');
    expect(pageSource).toContain('target="_blank"');
  });

  it("formats a governed research brief with source standards and connected Library topics", () => {
    expect(pageSource).toContain("ResearchBody");
    expect(pageSource).toContain("How this was researched");
    expect(pageSource).toContain("Source standard:");
    expect(pageSource).toContain("Connected Library topics:");
    expect(pageSource).toContain("People also explore these evidence-led next questions.");
  });

  it("automatically researches sparse coverage and explains the reusable-publication gate", () => {
    expect(pageSource).toContain("No approved entry answers this yet.");
    expect(pageSource).toContain("Research vetted sources");
    expect(pageSource).toContain("researchCurrentQuestion();");
    expect(pageSource).toContain("The first search takes a little longer");
    expect(pageSource).toContain("source, citation, and provider-health gate");
    expect(pageSource).toContain("Source-governed Library entry");
    expect(pageSource).toContain('response.webResearch.status !== "not_needed"');
  });

  it("shows a member-confirmed spelling correction before starting source-governed research", () => {
    expect(pageSource).toContain("Possible spelling correction");
    expect(pageSource).toContain("The Library will not assume a different topic.");
    expect(pageSource).toContain("if (response.searchClarification) return;");
    expect(pageSource).toContain("!response.searchClarification");
  });

  it("renders an honest retryable provider failure rather than a fake zero-result answer", () => {
    expect(pageSource).toContain("Live research is temporarily unavailable");
    expect(pageSource).toContain("Retry research");
    expect(pageSource).toContain("This is not a zero-result Library answer.");
  });

  it("uses broad bookstore and spiritual examples without assigning identity to a member", () => {
    expect(pageSource).toContain("oldest bookstore in the US");
    expect(pageSource).toContain("life after death");
    expect(pageSource).toContain("Diaspora-centered knowledge");
    expect(pageSource).not.toMatch(/you are (?:black|african|christian|muslim|a woman)/i);
  });

  it("offers explicit, non-persistent community research lens filters", () => {
    expect(pageSource).toContain("RESEARCH_LENS_OPTIONS");
    expect(pageSource).toContain("#Diaspora");
    expect(pageSource).toContain("#BlackWomen");
    expect(pageSource).toContain("#BlackStudents");
    expect(pageSource).toContain("#HBCUStudents");
    expect(pageSource).toContain('aria-label="Research lens choices"');
    expect(pageSource).toContain("toggleResearchLens");
    expect(pageSource).toContain("not saved as your identity");
  });

  it("renders general research and direct-evidence community context as distinct packets", () => {
    expect(pageSource).toContain("Current foundation · Source-governed Library entry");
    expect(pageSource).toContain("Directly evidenced community packet");
    expect(pageSource).toContain("Community evidence is insufficient for now");
    expect(pageSource).toContain("The current foundation remains complete and separately sourced above.");
    expect(pageSource).toContain("communityContext?.status === \"available\"");
    expect(pageSource).toContain("researchTrack=\"foundation\"");
    expect(pageSource).toContain('researchTrack="community"');
  });

  it("discloses a member-selected default context without replacing the foundation", () => {
    expect(pageSource).toContain("memberContextApplied?: string[]");
    expect(pageSource).toContain("Private default context:");
    expect(pageSource).toContain("The foundation remains general");
    expect(pageSource).toContain("this is for a friend");
  });

  it("gives each website collection subject a prefilled governed search and no empty collection dead end", () => {
    expect(collectionSource).toContain("loadLibraryResearchPathManifest");
    expect(collectionSource).toContain("governedLibraryResearchHref");
    expect(collectionSource).toContain("collectionSubtopics.map");
    expect(collectionSource).toContain("href={governedLibraryResearchHref(subtopic.question)}");
    expect(collectionSource).toContain("Research this collection");
    expect(collectionSource).toContain("governedLibraryResearchHref(researchCollection?.defaultQuestion ?? topic.title)");
    expect(researchPathSource).toContain("&research=true");
    expect(pageSource).toContain("void researchCurrentQuestion();");
  });
});
