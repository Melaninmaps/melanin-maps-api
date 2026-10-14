import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync(new URL("../app/community-language.tsx", import.meta.url), "utf8");

describe("Community language memory boundary", () => {
  it("discloses before submit that a proposal is review-only and never changes member memory", () => {
    expect(screen).toContain('testID="community-language-memory-boundary"');
    expect(screen).toContain("Review only: this suggestion is not saved as your Kinfolk memory or profile.");
    expect(screen).toContain("It will not personalize Kinfolk or change Kinfolk automatically.");
  });

  it("repeats the review-only, no-memory boundary in the submission success state", () => {
    expect(screen).toContain('testID="community-language-review-success"');
    expect(screen).toContain("Sent for review. Review only: this suggestion is not saved as your Kinfolk memory or profile, will not personalize Kinfolk, and will not change Kinfolk automatically.");
  });
});
