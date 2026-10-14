import { describe, expect, it } from "vitest";
import { extractEntityCandidateTerms } from "../entity-resolver";

describe("Kinfolk entity candidate phrases", () => {
  it("keeps a qualified conversational entity phrase intact", () => {
    const terms = extractEntityCandidateTerms(
      "Tell me about Michelle Williams from Destiny's Child",
    );

    expect(terms).toContain("michelle williams from destiny's child");
  });

  it("does not alter a direct short factual entity query", () => {
    const terms = extractEntityCandidateTerms("Who directed the movie Sinners?");

    expect(terms).toContain("who directed the movie sinners");
    expect(terms).toContain("sinners");
  });
});
