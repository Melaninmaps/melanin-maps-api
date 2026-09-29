import { describe, expect, it } from "vitest";
import { formatLibraryLensLabels, formatLibraryResearchBody } from "./library-research-format";

describe("Library research presentation formatting", () => {
  it("renders legacy markdown headings and emphasis without visible markdown tokens", () => {
    const blocks = formatLibraryResearchBody([
      "## At a glance Identity and **culture** change over time.",
      "## What to consider next\n\n1. Compare sources\n2. Ask a focused follow-up",
    ].join("\n\n"));

    expect(blocks).toEqual([
      { kind: "heading", text: "At a glance" },
      { kind: "paragraph", text: "Identity and culture change over time." },
      { kind: "heading", text: "What to consider next" },
      { kind: "bullets", items: ["Compare sources", "Ask a focused follow-up"] },
    ]);
    expect(JSON.stringify(blocks)).not.toMatch(/##|\*\*/);
  });

  it("recognizes new plain section labels and preserves ordinary prose", () => {
    expect(formatLibraryResearchBody("Why this matters\n\nThe explanation comes before the cited websites.")).toEqual([
      { kind: "heading", text: "Why this matters" },
      { kind: "paragraph", text: "The explanation comes before the cited websites." },
    ]);
  });

  it("keeps internal lens tags out of member-facing labels", () => {
    expect(formatLibraryLensLabels(["#Diaspora", "#BlackWomen"])).toBe("Diaspora · Black women");
    expect(formatLibraryLensLabels(["#HBCUStudents"])).toBe("HBCU students & alumni");
  });
});
