import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(new URL("../app/travel.tsx", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../hooks/useKinfolk.ts", import.meta.url), "utf8");

describe("mobile Kinfolk Community perspective", () => {
  it("requires an explicit, per-message opt-in before sending a Community perspective request", () => {
    expect(travelSource).toContain("includeCommunityPerspective");
    expect(travelSource).toContain("Use approved public Community posts");
    expect(travelSource).toContain("This does not share your chat. Community content is perspective, never evidence or a recommendation.");
    expect(travelSource).toContain('accessibilityLabel="Use approved public Community posts"');
    expect(hookSource).toContain("includeCommunityPerspective: opts?.includeCommunityPerspective === true");
  });

  it("uses explicit private-memory consent language and keeps the toggle opt-in", () => {
    expect(travelSource).toContain("Save this to my private Kinfolk memory");
    expect(travelSource).toContain('accessibilityLabel="Save this to my private Kinfolk memory"');
    expect(travelSource).toContain("const [rememberThis, setRememberThis] = useState(false)");
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
