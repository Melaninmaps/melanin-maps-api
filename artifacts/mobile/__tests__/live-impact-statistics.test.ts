import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const discover = source("../app/(tabs)/index.tsx");
const waitlist = source("../app/waitlist.tsx");
const onboarding = source("../app/onboarding/join.tsx");

describe("mobile live impact statistics", () => {
  it("loads Discover counts from the public impact endpoint and refreshes them", () => {
    expect(discover).toContain("api/impact");
    expect(discover).toContain("loadImpactStats");
    expect(discover).toContain("Promise.all([refetchBusinesses(), loadImpactStats()])");
    expect(discover).toContain('label: "Public Listings"');
    expect(discover).toContain('label: "Member Accounts"');
    expect(discover).not.toContain('value: "2,400+"');
    expect(discover).not.toContain('value: "94/100"');
  });

  it("does not fabricate waitlist positions or nationwide directory counts", () => {
    expect(waitlist).toContain("useState<number | null>(null)");
    expect(waitlist).toContain("position != null");
    expect(waitlist).not.toContain("Math.floor(Math.random() * 800)");
    expect(waitlist).not.toContain("2,400+ verified");
    expect(waitlist).not.toContain("48 States");
    expect(onboarding).not.toContain("10K+");
    expect(onboarding).not.toContain("500+");
    expect(onboarding).not.toContain("2K+");
  });
});
