import { describe, expect, it } from "vitest";
import {
  filterMemberFacingSources,
  sourceHasMemberQuestionRelevance,
} from "../source-relevance";

describe("Kinfolk member-facing source relevance", () => {
  const populationQuestion = "How many people live in the United States?";

  it("keeps a current Census population source for a population question", () => {
    expect(sourceHasMemberQuestionRelevance({
      title: "U.S. Census Bureau population estimates",
      url: "https://www.census.gov/programs-surveys/popest.html",
      evidenceText: "United States population estimate",
    }, populationQuestion)).toBe(true);
  });

  it("rejects unrelated local-business links for a public statistic", () => {
    expect(filterMemberFacingSources([
      {
        id: "city-business-services",
        label: "library",
        title: "City of Philadelphia — Business Services",
        url: "https://www.phila.gov/services/business-self-employment/",
        evidenceText: "Permits and local business support.",
      },
      {
        id: "chamber",
        label: "library",
        title: "Greater Philadelphia Chamber of Commerce",
        url: "https://chamberphl.com/",
        evidenceText: "Business membership and local programs.",
      },
    ], populationQuestion)).toEqual([]);
  });

  it("renders only relevant live-web evidence for a changing fact", () => {
    expect(filterMemberFacingSources([
      {
        id: "census-population",
        label: "web_search",
        title: "U.S. Census Bureau population estimates",
        url: "https://www.census.gov/programs-surveys/popest.html",
        evidenceText: "United States population estimate",
      },
      {
        id: "unrelated",
        label: "web_search",
        title: "Philadelphia business licensing",
        url: "https://www.phila.gov/services/business-self-employment/",
        evidenceText: "Business license steps.",
      },
    ], populationQuestion).map((source) => source.id)).toEqual(["census-population"]);
  });
});
