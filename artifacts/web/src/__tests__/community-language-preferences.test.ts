import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelPage = readFileSync(fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)), "utf8");

describe("web community-language preference contribution", () => {
  it("offers a review-only contribution path from Kinfolk preferences", () => {
    expect(travelPage).toContain("function CommunityLanguageSuggestion()");
    expect(travelPage).toContain("api/community-language/proposals");
    expect(travelPage).toContain("<CommunityLanguageSuggestion />");
    expect(travelPage).toContain("Send for review");
    expect(travelPage).toContain("will not be used to imitate a dialect or infer identity");
  });
});
