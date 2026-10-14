import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const presentation = readFileSync(new URL("../components/kinfolk/KinfolkChatPresentation.tsx", import.meta.url), "utf8");
const travel = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");

describe("Kinfolk web contextual visuals", () => {
  it("renders only allowlisted reviewed image URLs with visible provenance and a load fallback", () => {
    expect(presentation).toContain('url.hostname === "thumb.wikimedia.org"');
    expect(presentation).toContain('url.pathname.startsWith("/wikipedia/commons/thumb/")');
    expect(presentation).toContain('data-testid="kinfolk-contextual-visuals"');
    expect(presentation).toContain('data-testid="kinfolk-contextual-visual-image"');
    expect(presentation).toContain('data-testid="kinfolk-contextual-visual-fallback"');
    expect(presentation).toContain("setImageUnavailable(true)");
    expect(presentation).toContain("visual.attribution");
    expect(presentation).toContain("visual.licenseLabel");
  });

  it("keeps rights-pending medical material as an external reviewed-gallery card", () => {
    expect(presentation).toContain('data-testid="kinfolk-contextual-visual-gallery"');
    expect(presentation).toContain("visual.safetyNote");
  });

  it("preserves the server-returned visual contract from response parsing to the message surface", () => {
    expect(travel).toContain("contextualVisuals?: KinfolkContextualVisual[]");
    expect(travel).toContain("contextualVisuals: Array.isArray(data.contextualVisuals)");
    expect(travel).toContain("contextualVisuals={msg.contextualVisuals}");
  });
});
