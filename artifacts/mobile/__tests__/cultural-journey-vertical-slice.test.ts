import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(__dirname, path), "utf8");
}

describe("Cultural Journey vertical slice", () => {
  it("allows an explicit Cultural Explorer save before opening the Library handoff", () => {
    const explorer = source("../app/cultural-heritage.tsx");
    expect(explorer).toContain("/api/cultural-journeys/cultural-sites/");
    expect(explorer).toContain("memberConfirmed: true");
    expect(explorer).toContain("I choose to save this site to My Cultural Journey.");
    expect(explorer).toContain("Continue with Kinfolk in the Library");
    expect(explorer).toContain('culturalJourneyId: journeyEntry.id');
    expect(explorer).toContain('research: "false"');
  });

  it("keeps the Library reflection member-confirmed and distinct from memory or research context", () => {
    const library = source("../app/library-research.tsx");
    expect(library).toContain("culturalJourneyId");
    expect(library).toContain("/api/cultural-journeys/entries/");
    expect(library).toContain("memberConfirmed: true, reflection: journeyReflection");
    expect(library).toContain("This private reflection is not added to Kinfolk memory or used to change Library research.");
    expect(library).toContain("I choose to save this private reflection in My Cultural Journey.");
  });
});
