import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const webSource = readFileSync(
  fileURLToPath(new URL("../../../web/src/pages/travel.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk Community perspective client contract", () => {
  it("sends an explicit opt-in and renders only generic, separately labeled metadata", () => {
    expect(webSource).toContain("includeCommunityPerspective");
    expect(webSource).toContain("kinfolk-community-perspective-opt-in");
    expect(webSource).toContain("Include public Community perspective");
    expect(webSource).toContain("includeCommunityPerspective }),");
    expect(webSource).toContain("kinfolk-community-perspective");
    expect(webSource).toContain("Community perspective");
    expect(webSource).toContain("unverified perspective, not as evidence or a recommendation");
    expect(webSource).toContain("post content, authors, and URLs are intentionally absent");
  });
});
