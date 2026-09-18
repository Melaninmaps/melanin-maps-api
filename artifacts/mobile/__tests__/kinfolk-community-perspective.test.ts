import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(new URL("../app/travel.tsx", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../hooks/useKinfolk.ts", import.meta.url), "utf8");

describe("mobile Kinfolk Community perspective", () => {
  it("requires an explicit, per-message opt-in before sending a Community perspective request", () => {
    expect(travelSource).toContain("includeCommunityPerspective");
    expect(travelSource).toContain("Include public Community perspective");
    expect(travelSource).toContain("Matching public hashtags only; never used as evidence or a recommendation.");
    expect(hookSource).toContain("includeCommunityPerspective: opts?.includeCommunityPerspective === true");
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
