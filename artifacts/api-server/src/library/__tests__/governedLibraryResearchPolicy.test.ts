import { describe, expect, it } from "vitest";
import {
  buildCommunityResearchQuery,
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
    expect(isTrustedResearchUrl("https://www.cancer.gov/types/breast/screening", policy)).toBe(true);
    expect(isTrustedResearchUrl("https://random-health-blog.example/article", policy)).toBe(false);
  });

  it("targets CDC and NCI evidence for the explicit Black-women breast-cancer scope", () => {
    const query = buildCommunityResearchQuery("#BlackWomen breast cancer screening", "medical");
    expect(query).toContain("Research lens: Black women.");
    expect(query).toContain("CDC (cdc.gov)");
    expect(query).toContain("National Cancer Institute (cancer.gov)");
    expect(query).toContain("at least two distinct allowed citations");
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

  it("routes redlining to governed housing and economic sources instead of the narrow general catalog", () => {
    const policy = getResearchPolicy("redlining");
    expect(policy.domain).toBe("financial");
    expect(policy.allowDomains).toEqual(expect.arrayContaining([
      "*.gov",
      "hud.gov",
      "consumerfinance.gov",
      "ncrc.org",
      "urban.org",
    ]));
    expect(isTrustedResearchUrl("https://www.hud.gov/example", policy)).toBe(true);
    expect(isTrustedResearchUrl("https://ncrc.org/example", policy)).toBe(true);
  });
});
