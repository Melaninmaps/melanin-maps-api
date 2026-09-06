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

  it.each([
    { kind: "recipe_options", options: [null, 7, [], { title: "Braise", description: "Cook slowly", keyIngredients: ["beef"] }] },
    { kind: "ranked_perspectives", criteria: [], entries: [null, "bad", { name: "Supported", reason: "Evidence", evidenceSummary: "Source" }] },
    { kind: "entity_explorer", canonicalName: "Artist", overview: "Overview", pathways: [null, 3, { label: "Works", description: "Published work", libraryHref: "/library/topics/music" }] },
  ])("drops malformed structured collection members without throwing", (input) => {
    expect(() => parseKinfolkStructuredContent(input)).not.toThrow();
    expect(parseKinfolkStructuredContent(input)).not.toBeNull();
  });

  it("drops malformed media and connection members without throwing", () => {
    expect(() => parseKinfolkMediaLinks([null, 3, [], { title: "Interview", platform: "YouTube", url: "https://video.example/interview", reason: "Primary" }])).not.toThrow();
    expect(parseKinfolkMediaLinks([null, { title: "Interview", platform: "YouTube", url: "https://video.example/interview", reason: "Primary" }])).toHaveLength(1);
    expect(() => parseKinfolkRelatedConnections([null, 3, [], { title: "Topic", relationship: "Library", reason: "Related", href: "/library/topics/music", evidenceUrl: "https://source.example/profile" }])).not.toThrow();
  });

  it("binds every rendered destination to exact evidence or a server-owned Library path", () => {
    const mediaLinks = parseKinfolkMediaLinks([
      { title: "Model-proposed title", creator: "Model-proposed creator", platform: "YouTube", url: "https://video.example/interview?utm_source=x", reason: "Model-proposed reason" },
      { title: "Invented recommendation", creator: "Unknown", platform: "Video", url: "https://invented.example/watch", reason: "Unsupported" },
    ]);
    const relatedConnections = parseKinfolkRelatedConnections([
      { title: "Published topic", relationship: "Library", reason: "Source-backed", href: "/library/topics/music", evidenceUrl: "https://source.example/profile" },
      { title: "External masquerading as Library", relationship: "Library", reason: "Mismatched", href: "https://untrusted.example/topic", evidenceUrl: "https://source.example/profile" },
      { title: "Genre-only claim", relationship: "Influence", reason: "Unsupported", href: null, evidenceUrl: "https://invented.example/influence" },
    ]);
    const structuredContent = parseKinfolkStructuredContent({
      kind: "entity_explorer",
      canonicalName: "Artist",
      overview: "Overview",
      pathways: [
        { label: "Works", description: "Published", libraryHref: "/library/topics/music" },
        { label: "Invented", description: "Not allowed", libraryHref: "/library/topics/invented" },
      ],
    });
    expect(bindContextualLinksToEvidence({
      structuredContent,
      mediaLinks,
      relatedConnections,
      evidenceUrls: ["https://video.example/interview", "https://source.example/profile", "javascript:alert(1)"],
      mediaEvidence: [{
        title: "Verified interview",
        url: "https://video.example/interview",
        publisher: "Verified creator account",
        supports: ["The verified account demonstrates the method."],
      }],
      libraryPaths: ["/library/topics/music"],
    })).toEqual({
      structuredContent: expect.objectContaining({
        kind: "entity_explorer",
        pathways: [
          expect.objectContaining({ libraryHref: "/library/topics/music" }),
          expect.objectContaining({ libraryHref: null }),
        ],
      }),
      mediaLinks: [expect.objectContaining({
        title: "Verified interview",
        creator: "Verified creator account",
        platform: "video.example",
        reason: "The verified account demonstrates the method.",
        url: "https://video.example/interview",
      })],
      relatedConnections: [
        expect.objectContaining({ title: "Published topic", href: "/library/topics/music" }),
        expect.objectContaining({ title: "External masquerading as Library", href: null }),
      ],
    });
  });
});
