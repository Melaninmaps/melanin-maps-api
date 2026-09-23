import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  libraryCollectionResearchParams,
} from "../lib/libraryCollections";

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

  it("uses an optional expandable community-context section instead of a horizontal carousel", () => {
    expect(researchScreen).toContain("lensPickerOpen");
    expect(researchScreen).toContain("Community research context");
    expect(researchScreen).toContain("Current foundation only. Add a community packet if you want one.");
    expect(researchScreen).toContain('accessibilityState={{ expanded: lensPickerOpen }}');
    expect(researchScreen).not.toContain("<ScrollView horizontal");
  });

  it("applies a routed starter topic only once so members can erase or replace it", () => {
    expect(researchScreen).toContain("const appliedSuggestedQuestion = useRef(false)");
    expect(researchScreen).toContain("!appliedSuggestedQuestion.current");
    expect(researchScreen).toContain("appliedSuggestedQuestion.current = true");
  });

  it("makes every server-provided Library collection path an immediate governed research handoff", () => {
    expect(libraryCollectionResearchParams("  Redlining  ")).toEqual({ question: "Redlining", research: "true" });
    expect(libraryTab).toContain("loadLibraryResearchPathManifest");
    expect(libraryTab).toContain("collection.paths.map");
    expect(libraryTab).toContain("libraryCollectionResearchParams(path.question)");
    expect(libraryTab).toContain('pathname: "/library-research"');
    expect(libraryTab).toContain("params: libraryCollectionResearchParams(path.question)");
    expect(researchScreen).toContain('researchOnOpen === "true"');
    expect(researchScreen).toContain("void searchLibrary(routedQuestion, true)");
    expect(researchScreen).toContain("if (forceResearch || !hasPublishedEntry)");
  });

  it("runs connected and related questions through the same approved-first path", () => {
    expect(researchScreen).toContain("function startPrefilledResearch(nextQuestion: string)");
    expect(researchScreen).toContain("onConnectedTopic={startPrefilledResearch}");
    expect(researchScreen).toContain("startPrefilledResearch(`${research.researchScope.researchLenses");
  });

  it("keeps an approved-topic recovery path visible when current research is unavailable", () => {
    expect(researchScreen).toContain("APPROVED_TOPIC_STARTERS");
    expect(researchScreen).toContain("browse a verified Library topic instead of seeing a dead end");
    expect(researchScreen).toContain("Breast cancer screening");
    expect(researchScreen).toContain("HBCU college admissions");
  });

  it("keeps matching approved Library topics visible alongside current research", () => {
    expect(researchScreen).toContain("Available Library paths");
    expect(researchScreen).toContain('pathname: "/library-topic"');
    expect(researchScreen).toContain("matchingTopics");
  });

  it("does not misrepresent related questions as other members private search data", () => {
    expect(researchScreen).toContain("not claims about the reader or a report of other members");
    expect(researchScreen).toContain("Sign in to request a new source-governed Library brief");
  });

  it("renders current foundation and community context in separate cards", () => {
    expect(researchScreen).toContain("CURRENT FOUNDATION · SOURCE-GOVERNED");
    expect(researchScreen).toContain("DIRECTLY EVIDENCED COMMUNITY PACKET");
    expect(researchScreen).toContain("Community evidence is insufficient for now");
    expect(researchScreen).toContain('researchTrack="foundation"');
    expect(researchScreen).toContain('researchTrack="community"');
  });
});
