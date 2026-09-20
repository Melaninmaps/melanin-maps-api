import { describe, expect, it } from "vitest";
import { buildCulturalConflictClarification } from "../cultural-conflict-clarification";

describe("Kinfolk cultural conflict clarification", () => {
  it("recognizes a generic beef question as music and public-figure context", () => {
    expect(buildCulturalConflictClarification("Who won the beef?", "community"))
      .toContain("Kendrick vs. Drake");
    expect(buildCulturalConflictClarification("Who won the beef?", "community"))
      .toContain("Nicki vs. Cardi");
  });

  it("uses the selected Kinfolk voice without claiming a winner", () => {
    const professor = buildCulturalConflictClarification("who won the beef", "professor");
    expect(professor).toContain("public conflict");
    expect(professor).toContain("current reporting");
    expect(professor).not.toContain("won the beef is");
  });

  it("does not short-circuit a named conflict that needs current evidence", () => {
    expect(buildCulturalConflictClarification("Who won Kendrick versus Drake?", "community"))
      .toBeNull();
  });

  it("does not treat unrelated food language as a music conflict", () => {
    expect(buildCulturalConflictClarification("Where can I buy beef ribs?", "community"))
      .toBeNull();
  });
});
