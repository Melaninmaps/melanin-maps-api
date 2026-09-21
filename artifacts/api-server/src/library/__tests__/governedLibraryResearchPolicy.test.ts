import { describe, expect, it } from "vitest";
import {
  getLibraryResearchScope,
  getResearchPolicy,
  isTrustedResearchUrl,
} from "../researchPolicy";

describe("governed Library research policy", () => {
  it("uses journals and public-health sources for medical research", () => {
    const policy = getResearchPolicy("What should Black women ages 45-50 know about planning for pregnancy?");
    expect(policy.domain).toBe("medical");
    expect(isTrustedResearchUrl("https://pubmed.ncbi.nlm.nih.gov/123456/", policy)).toBe(true);
    expect(isTrustedResearchUrl("https://www.cochranelibrary.com/cdsr/reviews", policy)).toBe(true);
    expect(isTrustedResearchUrl("https://random-health-blog.example/article", policy)).toBe(false);
  });

  it("allows an explicitly requested population and age range without treating it as reader identity", () => {
    const scope = getLibraryResearchScope("What should Black women ages 45–50 know about planning for pregnancy?");
    expect(scope.domain).toBe("medical");
    expect(scope.requestedGroup).toBe("Black women ages 45–50");
    expect(scope.researchLenses.map((lens) => lens.tag)).toEqual(["#BlackWomen"]);
    expect(scope.groupGuidance).toMatch(/research scope, not the reader/i);
    expect(scope.connectedTopics.map((topic) => topic.label)).toContain("Health & Wellness");
  });

  it("uses the product-default diaspora research lens without assigning it as member identity", () => {
    const scope = getLibraryResearchScope("How do federal student grants work?");
    expect(scope.requestedGroup).toBeNull();
    expect(scope.researchLenses.map((lens) => lens.tag)).toEqual(["#Diaspora"]);
    expect(scope.groupGuidance).toMatch(/research scope, not the reader/i);
  });

  it("uses regulator and established economic-research sources for financial research", () => {
    const policy = getResearchPolicy("What financial planning resources are available to Black women?");
    expect(policy.domain).toBe("financial");
    expect(isTrustedResearchUrl("https://www.consumerfinance.gov/consumer-tools/", policy)).toBe(true);
    expect(isTrustedResearchUrl("https://www.urban.org/research", policy)).toBe(true);
    expect(isTrustedResearchUrl("https://quick-riches.example/guide", policy)).toBe(false);
  });
});
