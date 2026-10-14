import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const presentation = readFileSync(new URL("../components/KinfolkContextualPresentation.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../hooks/useKinfolk.ts", import.meta.url), "utf8");
const primary = readFileSync(new URL("../app/travel.tsx", import.meta.url), "utf8");
const widget = readFileSync(new URL("../components/AIChatWidget.tsx", import.meta.url), "utf8");

describe("Kinfolk native contextual visuals", () => {
  it("fails closed outside the reviewed image host and retains a visible image-load fallback", () => {
    expect(presentation).toContain('url.hostname === "thumb.wikimedia.org"');
    expect(presentation).toContain('url.pathname.startsWith("/wikipedia/commons/thumb/")');
    expect(presentation).toContain('testID="kinfolk-contextual-visuals"');
    expect(presentation).toContain('testID="kinfolk-contextual-visual-image"');
    expect(presentation).toContain('testID="kinfolk-contextual-visual-fallback"');
    expect(presentation).toContain("onError={() => setImageUnavailable(true)}");
    expect(presentation).toContain("visual.attribution");
    expect(presentation).toContain("visual.licenseLabel");
  });

  it("keeps medical visual material as a reviewed external-gallery card", () => {
    expect(presentation).toContain('testID="kinfolk-contextual-visual-gallery"');
    expect(presentation).toContain("visual.safetyNote");
  });

  it("preserves the same bounded response contract in primary and floating Kinfolk", () => {
    expect(hook).toContain("contextualVisuals?: KinfolkContextualVisual[]");
    expect(hook).toContain("contextualVisuals: Array.isArray(data.contextualVisuals)");
    expect(primary).toContain("contextualVisuals={msg.contextualVisuals}");
    expect(widget).toContain("contextualVisuals: Array.isArray(data.contextualVisuals)");
    expect(widget).toContain("contextualVisuals={item.contextualVisuals}");
  });
});
