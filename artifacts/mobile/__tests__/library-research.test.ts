import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const researchScreen = readFileSync(new URL("../app/library-research.tsx", import.meta.url), "utf8");
const libraryTab = readFileSync(new URL("../app/(tabs)/library.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/_layout.tsx", import.meta.url), "utf8");

describe("mobile Library research experience", () => {
  it("adds a separate research entry point without replacing the current Library tab", () => {
    expect(libraryTab).toContain('router.push("/library-research" as never)');
    expect(libraryTab).toContain("Research the Library");
    expect(layout).toContain('name="library-research"');
    expect(researchScreen).toContain("Library Research");
  });

  it("searches approved Library content before requesting a researched brief", () => {
    expect(researchScreen).toContain("/api/library/search?");
    expect(researchScreen).toContain("/api/library/research");
    expect(researchScreen).toContain("No approved Library entry answers this yet.");
    expect(researchScreen).toContain("Research vetted sources");
  });

  it("requires a member to choose a close spelling correction before research", () => {
    expect(researchScreen).toContain('searchClarification?.kind === "possible_spelling"');
    expect(researchScreen).toContain("Possible spelling correction");
    expect(researchScreen).toContain("The Library will not assume a different topic.");
    expect(researchScreen).toContain("void searchLibrary(search.searchClarification!.suggestedQuery)");
    expect(researchScreen).toContain("!search?.searchClarification");
  });

  it("shows answer sections, source links, scope, and connected topic tags", () => {
    expect(researchScreen).toContain("const heading = part.match");
    expect(researchScreen).toContain("How this was researched");
    expect(researchScreen).toContain("Research lens:");
    expect(researchScreen).toContain("#BlackWomen");
    expect(researchScreen).toContain("Connected Library topics");
    expect(researchScreen).toContain("safeUrl(source.url)");
    expect(researchScreen).toContain('Linking.openURL(source.href)');
  });

  it("offers the same explicit research-lens filters as the website", () => {
    expect(researchScreen).toContain("RESEARCH_LENS_OPTIONS");
    expect(researchScreen).toContain("#Diaspora");
    expect(researchScreen).toContain("#BlackWomen");
    expect(researchScreen).toContain("#BlackStudents");
    expect(researchScreen).toContain("#HBCUStudents");
    expect(researchScreen).toContain('accessibilityRole="checkbox"');
    expect(researchScreen).toContain("toggleResearchLens");
    expect(researchScreen).toContain("It is not saved as your identity.");
  });

  it("does not misrepresent related questions as other members private search data", () => {
    expect(researchScreen).toContain("not claims about the reader or a report of other members");
    expect(researchScreen).toContain("Sign in to request a new source-governed Library brief");
  });
});
