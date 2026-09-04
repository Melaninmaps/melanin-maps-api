import { describe, expect, it } from "vitest";
import {
  bindContextualLinksToEvidence,
  parseKinfolkMediaLinks,
  parseKinfolkRelatedConnections,
  parseKinfolkStructuredContent,
} from "../contextual-answer-contract";

describe("contextual answer contract", () => {
  it("keeps valid bounded recipe content", () => {
    expect(parseKinfolkStructuredContent({ kind: "recipe_instructions", title: "Pot roast", ingredients: ["beef"], steps: ["Brown"], foodSafety: [] })).toMatchObject({ kind: "recipe_instructions", title: "Pot roast" });
  });
  it("drops unsafe media URLs", () => {
    expect(parseKinfolkMediaLinks([{ title: "x", platform: "video", url: "javascript:alert(1)", reason: "x" }])).toEqual([]);
  });

  it("caps and trims additive content without changing the conversational reply contract", () => {
    const parsed = parseKinfolkStructuredContent({
      kind: "ranked_perspectives",
      criteria: Array.from({ length: 20 }, (_, index) => ` criterion ${index} `),
      entries: Array.from({ length: 20 }, (_, index) => ({
        name: ` Person ${index} `,
        reason: " supported reason ",
        evidenceSummary: " sourced evidence ",
      })),
    });
    expect(parsed).toMatchObject({ kind: "ranked_perspectives" });
    if (parsed?.kind !== "ranked_perspectives") throw new Error("unexpected contract");
    expect(parsed.criteria).toHaveLength(8);
    expect(parsed.criteria[0]).toBe("criterion 0");
    expect(parsed.entries).toHaveLength(10);
  });

  it("binds media and relationships to exact safe retrieved URLs", () => {
    const mediaLinks = parseKinfolkMediaLinks([
      { title: "Verified interview", creator: "Artist", platform: "YouTube", url: "https://video.example/interview", reason: "Primary account" },
      { title: "Invented recommendation", creator: "Unknown", platform: "Video", url: "https://invented.example/watch", reason: "Unsupported" },
    ]);
    const relatedConnections = parseKinfolkRelatedConnections([
      { title: "Published topic", relationship: "Library", reason: "Source-backed", href: "https://library.example/topic", evidenceUrl: "https://source.example/profile" },
      { title: "Genre-only claim", relationship: "Influence", reason: "Unsupported", href: null, evidenceUrl: "https://invented.example/influence" },
    ]);
    expect(bindContextualLinksToEvidence({
      mediaLinks,
      relatedConnections,
      evidenceUrls: ["https://video.example/interview", "https://source.example/profile", "javascript:alert(1)"],
    })).toEqual({
      mediaLinks: [expect.objectContaining({ title: "Verified interview" })],
      relatedConnections: [expect.objectContaining({ title: "Published topic" })],
    });
  });
});