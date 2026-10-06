import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(new URL("../app/travel.tsx", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../hooks/useKinfolk.ts", import.meta.url), "utf8");
const consentSource = readFileSync(new URL("../components/KinfolkInlineMemoryConsent.tsx", import.meta.url), "utf8");

describe("mobile Kinfolk Community perspective", () => {
  it("requires an explicit, per-message opt-in before sending a Community perspective request", () => {
    expect(travelSource).toContain("includeCommunityPerspective");
    expect(travelSource).toContain("Use approved public Community posts");
    expect(travelSource).toContain("This does not share your chat. Community content is perspective, never evidence or a recommendation.");
    expect(travelSource).toContain('accessibilityLabel="Use approved public Community posts"');
    expect(hookSource).toContain("includeCommunityPerspective: opts?.includeCommunityPerspective === true");
  });

  it("uses item-level private-memory consent and keeps every save opt-in", () => {
    expect(travelSource).toContain("KinfolkInlineMemoryConsent");
    expect(consentSource).toContain("Nothing has been saved yet.");
    expect(consentSource).toContain("Save only preferences and interests");
    expect(consentSource).toContain("Choose individually");
    expect(consentSource).toContain("Don’t save");
    expect(consentSource).toContain("selectedIds: ids");
    expect(consentSource).toContain("selected.length === 0");
    expect(consentSource).toContain("consent: true");
  });

  it("renders only a generic unverified-perspective disclosure, never raw Community post content", () => {
    expect(hookSource).toContain('label: "Community perspective"');
    expect(hookSource).toContain("communityPerspective: data.communityPerspective ?? null");
    expect(travelSource).toContain("msg.communityPerspective");
    expect(travelSource).toContain("was considered as unverified perspective, not as evidence or a recommendation.");
    expect(travelSource).not.toContain("communityPerspective.content");
    expect(travelSource).not.toContain("communityPerspective.author");
    expect(travelSource).not.toContain("communityPerspective.url");
  });
});
