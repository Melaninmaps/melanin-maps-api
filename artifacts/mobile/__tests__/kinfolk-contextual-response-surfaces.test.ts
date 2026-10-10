import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const widget = readFileSync(new URL("../components/AIChatWidget.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../hooks/useKinfolk.ts", import.meta.url), "utf8");
const travel = readFileSync(new URL("../app/travel.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../components/KinfolkContextualPresentation.tsx", import.meta.url), "utf8");

describe("Kinfolk contextual response surfaces", () => {
  it("retains evidence-bound structured, media, and related presentation fields in primary chat", () => {
    expect(hook).toContain("structuredContent?: KinfolkStructuredContent | null");
    expect(hook).toContain("mediaLinks?: KinfolkMediaLink[]");
    expect(hook).toContain("relatedConnections?: KinfolkRelatedConnection[]");
    expect(hook).toContain("structuredContent: data.structuredContent ?? null");
    expect(hook).toContain("mediaLinks: Array.isArray(data.mediaLinks)");
    expect(travel).toContain("<KinfolkContextualPresentation");
  });

  it("preserves widget consent and disclosure parity while failing closed for business cards", () => {
    expect(widget).toContain("inlineMemoryConsent,");
    expect(widget).toContain("inlineMemoryConsent,");
    expect(widget).toContain("canRenderKinfolkBusinessCards(responseMeta)");
    expect(widget).toContain("provenanceNote: data.provenanceNote ?? null");
    expect(widget).toContain("sourceContext: data.sourceContext ?? null");
    expect(widget).toContain("clarificationSteps: Array.isArray(data.clarificationSteps)");
    expect(widget).toContain("<KinfolkContextualPresentation");
  });

  it("renders only safe evidence URLs and server-owned Library paths", () => {
    expect(presentation).toContain("parseSafeSourceLink");
    expect(presentation).toContain("safeLibraryHref");
    expect(presentation).toContain('testID="kinfolk-contextual-presentation"');
    expect(presentation).toContain("Evidence-backed details");
  });
});
