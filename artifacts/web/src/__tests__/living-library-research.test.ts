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
const culturalSiteSource = readFileSync(
  fileURLToPath(new URL("../pages/cultural-site-detail.tsx", import.meta.url)),
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

  it("shows the explanation before citations without exposing internal research-method notes", () => {
    expect(pageSource).toContain("ResearchBody");
    expect(pageSource).toContain("formatLibraryResearchBody(body)");
    expect(pageSource).toContain("<SourceList sources={sources} />");
    expect(pageSource).not.toContain("How the current foundation was researched");
    expect(pageSource).not.toContain("How this was researched");
    expect(pageSource).not.toContain("Source standard:");
    expect(pageSource).not.toContain("Connected Library topics:");
    expect(pageSource).not.toContain("Primary web research was unavailable");
    expect(pageSource).toContain("People also explore these evidence-led next questions.");
  });

  it("keeps sparse coverage provider-free until the member explicitly checks availability", () => {
    expect(pageSource).toContain("No approved entry answers this yet.");
    expect(pageSource).toContain("Check fresh-research availability");
    expect(pageSource).toContain("/api/library/research/preflight");
    expect(pageSource).toContain("researchCurrentQuestion");
    expect(pageSource).not.toContain("researchOnOpen");
    expect(pageSource).not.toContain("void researchCurrentQuestion();");
    expect(pageSource).toContain("Fresh source research uses KinfolkAI allowance");
    expect(pageSource).toContain("durable allowance protections");
    expect(pageSource).toContain("Source-governed Library entry");
    expect(pageSource).toContain('response.webResearch.status !== "not_needed"');
  });

  it("shows a member-confirmed spelling correction before any explicit research preflight", () => {
    expect(pageSource).toContain("Possible spelling correction");
    expect(pageSource).toContain("The Library will not assume a different topic.");
    expect(pageSource).toContain("!response.searchClarification");
    expect(pageSource).not.toContain("researchOnOpen");
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

  it("offers editable community research filters without putting hash tokens into a member question", () => {
    expect(pageSource).toContain("RESEARCH_LENS_OPTIONS");
    expect(pageSource).toContain("#Diaspora");
    expect(pageSource).toContain("#BlackWomen");
    expect(pageSource).toContain("#BlackStudents");
    expect(pageSource).toContain("#HBCUStudents");
    expect(pageSource).toContain('aria-label="Research lens choices"');
    expect(pageSource).toContain("selectedResearchTags");
    expect(pageSource).toContain("Optional focus words");
    expect(pageSource).toContain("buildLibraryResearchQuery");
    expect(pageSource).toContain("withoutResearchLensTags");
    expect(pageSource).toContain("not saved as your identity");
    expect(pageSource).toContain("formatLibraryLensLabels");
    expect(pageSource).toContain("Community research filters:");
    expect(pageSource).toContain("formatLibraryLensLabels(activeResearchLensTags)");
    expect(pageSource).not.toContain("formatLibraryLensLabels(response.researchLenses.map");
  });

  it("renders general research and direct-evidence community context as distinct packets", () => {
    expect(pageSource).toContain("Current foundation · Source-governed Library entry");
    expect(pageSource).toContain("Directly evidenced community packet");
    expect(pageSource).toContain("Community evidence is insufficient for now");
    expect(pageSource).toContain("The current foundation remains complete and separately sourced above.");
    expect(pageSource).toContain("communityContext?.status === \"available\"");
    expect(pageSource).toContain('eyebrow={research.origin === "internal" || research.published');
    expect(pageSource).toContain('eyebrow="Directly evidenced community packet"');
  });

  it("discloses a member-selected default context without replacing the foundation", () => {
    expect(pageSource).toContain("memberContextApplied?: string[]");
    expect(pageSource).toContain("Private default context:");
    expect(pageSource).toContain("The foundation remains general");
    expect(pageSource).toContain("this is for a friend");
  });

  it("gives each website collection subject a free browse/search route and no empty collection dead end", () => {
    expect(collectionSource).toContain("loadLibraryResearchPathManifest");
    expect(collectionSource).toContain("governedLibraryResearchHref");
    expect(collectionSource).toContain("collectionSubtopics.map");
    expect(collectionSource).toContain("href={governedLibraryResearchHref(subtopic.question)}");
    expect(collectionSource).toContain("Browse this collection");
    expect(collectionSource).toContain("governedLibraryResearchHref(researchCollection?.defaultQuestion ?? topic.title)");
    expect(researchPathSource).not.toContain("research=true");
    expect(pageSource).not.toContain("researchOnOpen");
  });

  it("sends cultural and HBCU learning handoffs to the working governed search route", () => {
    expect(culturalSiteSource).toContain("/library/search?q=");
    expect(culturalSiteSource).not.toContain("&research=true");
    expect(culturalSiteSource).not.toContain("href={`/library?q=");
  });

  it("clears member-scoped Library state and ignores late responses when the account changes", () => {
    expect(pageSource).toContain("useGetCurrentAuthUser");
    expect(pageSource).toContain("const activeMemberId = auth?.user?.id ?? null");
    expect(pageSource).toContain("accountGeneration.current += 1");
    expect(pageSource).toContain("setContextConsent(null)");
    expect(pageSource).toContain("generation !== accountGeneration.current");
  });
});
