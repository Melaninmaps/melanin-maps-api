import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const mobileSettings = readFileSync(fileURLToPath(new URL("../app/kinfolk-settings.tsx", import.meta.url)), "utf8");
const proposalScreen = readFileSync(fileURLToPath(new URL("../app/community-language.tsx", import.meta.url)), "utf8");
const rootLayout = readFileSync(fileURLToPath(new URL("../app/_layout.tsx", import.meta.url)), "utf8");

describe("mobile community-language attainability", () => {
  it("keeps the contribution screen reachable from Kinfolk settings", () => {
    expect(mobileSettings).toContain('router.push("/community-language" as never)');
    expect(rootLayout).toContain('name="community-language"');
  });

  it("sends a review-only proposal instead of changing Kinfolk directly", () => {
    expect(proposalScreen).toContain('/api/community-language/proposals');
    expect(proposalScreen).toContain("Send for review");
    expect(proposalScreen).toContain("Suggestions are reviewed before they can help Kinfolk understand anyone else.");
  });
});
