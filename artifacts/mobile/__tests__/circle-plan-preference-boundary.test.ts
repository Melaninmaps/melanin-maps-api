import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const circleScreen = readFileSync(new URL("../app/circles/[id].tsx", import.meta.url), "utf8");

describe("Circle plan preference boundary", () => {
  it("does not offer another member's account preferences as a plan input", () => {
    expect(circleScreen).not.toContain('{ id: "by_member"');
    expect(circleScreen).not.toContain("curatorMemberId");
  });

  it("explains that account-level member preferences are not used", () => {
    expect(circleScreen).toContain("It does not use any Circle member&apos;s account-level preferences.");
  });
});
