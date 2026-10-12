import { describe, expect, it } from "vitest";
import {
  contextualEvidenceSearchPatterns,
  deriveContextualBusinessEvidenceTerms,
  matchesDocumentedContextualEvidence,
} from "../business-subject";

describe("governed accessibility evidence", () => {
  it("treats accessibility wording as a documented listing constraint", () => {
    expect(deriveContextualBusinessEvidenceTerms("Find a wheelchair-accessible bookstore in Philadelphia."))
      .toContain("wheelchair accessible");
  });

  it("accepts only documented accessibility aliases and includes the structured field", () => {
    const terms = ["wheelchair accessible"];
    expect(matchesDocumentedContextualEvidence({
      name: "Neighborhood Books",
      accessibilityFeatures: ["ADA-compliant entrance"],
    }, terms)).toBe(true);
    expect(matchesDocumentedContextualEvidence({
      name: "Neighborhood Books",
      description: "Independent bookstore",
    }, terms)).toBe(false);
  });

  it("produces a bounded SQL predicate that covers documented accessibility aliases", () => {
    const patterns = contextualEvidenceSearchPatterns(["wheelchair accessible"]);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toContain("ada");
    expect(patterns[0]).toContain("wheelchair");
  });
});
