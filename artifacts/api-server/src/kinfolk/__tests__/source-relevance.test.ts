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

  it("keeps a rate source when its ISO notation differs from the member's currency wording", () => {
    expect(sourceHasMemberQuestionRelevance({
      title: "JPY to USD exchange rate",
      url: "https://www.xe.com/currencyconverter/convert/?Amount=792&From=JPY&To=USD",
      evidenceText: "Current currency conversion and exchange rate.",
    }, "What is 792 yen in U.S. dollars today?")).toBe(true);
  });

  it("rejects generic same-city status evidence that lacks the question's central terms", () => {
    const question = "Can you plan tomorrow around what is open in Philadelphia?";
    expect(sourceHasMemberQuestionRelevance({
      title: "Philadelphia public-safety offices open after alert",
      url: "https://www.phila.gov/safety/update",
      evidenceText: "Public-safety update for Philadelphia residents.",
    }, question)).toBe(false);
    expect(sourceHasMemberQuestionRelevance({
      title: "Philadelphia venues open tomorrow",
      url: "https://www.phila.gov/visiting/open-tomorrow",
      evidenceText: "Tomorrow's Philadelphia venue availability and hours.",
    }, question)).toBe(true);
  });

  it("keeps direct NIH medication discussion guidance when the medicine name is absent from its title", () => {
    const result = filterMemberFacingSources([
      {
        id: "medlineplus-medication-questions",
        label: "NIH MedlinePlus",
        title: "MedlinePlus: Taking medicines — what to ask your provider",
        url: "https://medlineplus.gov/ency/patientinstructions/000535.htm",
      },
      {
        id: "unrelated-local-business",
        label: "library",
        title: "Philadelphia business licensing",
        url: "https://www.phila.gov/services/business-self-employment/",
      },
    ], "My doctor prescribed ferrous sulfate for anemia. What should I ask about side effects and food interactions?");

    expect(result.map((source) => source.id)).toEqual(["medlineplus-medication-questions"]);
  });

  it("keeps direct NIH burn evidence when first-aid wording enters the current-evidence path", () => {
    const result = filterMemberFacingSources([
      {
        id: "medlineplus-burns",
        label: "NIH MedlinePlus",
        title: "Burns",
        url: "https://medlineplus.gov/burns.html",
      },
      {
        id: "unrelated-local-business",
        label: "library",
        title: "Philadelphia business licensing",
        url: "https://www.phila.gov/services/business-self-employment/",
      },
    ], "What are general first-aid steps for a minor kitchen burn?");

    expect(result.map((source) => source.id)).toEqual(["medlineplus-burns"]);
  });

  it("does not render a generic NIH page as evidence for a specific sprain", () => {
    const result = filterMemberFacingSources([
      {
        id: "medlineplus-sprains-and-strains",
        label: "NIH MedlinePlus",
        title: "Sprains and Strains",
        url: "https://medlineplus.gov/sprainsandstrains.html",
      },
      {
        id: "medlineplus-travelers-health",
        label: "NIH MedlinePlus",
        title: "Traveler's Health",
        url: "https://medlineplus.gov/travelershealth.html",
      },
    ], "I sprained my ankle yesterday. What general first-aid steps should I consider?");

    expect(result.map((source) => source.id)).toEqual(["medlineplus-sprains-and-strains"]);
  });
});
