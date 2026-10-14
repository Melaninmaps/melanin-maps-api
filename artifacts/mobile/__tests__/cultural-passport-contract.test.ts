import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const passport = readFileSync(
  fileURLToPath(new URL("../app/passport.tsx", import.meta.url)),
  "utf8",
);
const profile = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/profile.tsx", import.meta.url)),
  "utf8",
);
const journey = readFileSync(
  fileURLToPath(new URL("../app/life-journey.tsx", import.meta.url)),
  "utf8",
);

describe("Cultural Passport and Journey no-gamification contracts", () => {
  it("makes My Passport reachable and requires member confirmation before saving a private moment", () => {
    expect(profile).toContain('label: "My Passport"');
    expect(profile).toContain('route: "/passport"');
    expect(profile).not.toContain("MilestoneSection");
    expect(passport).toContain('memberConfirmed: true');
    expect(passport).toContain("I choose to keep this private moment in My Passport.");
    expect(passport).toContain("/api/users/passport/moments");
    expect(passport).toContain('method: "DELETE"');
  });

  it("does not show Passport as levels, points, achievements, streaks, or a completion target", () => {
    expect(passport).toContain("There is nothing to unlock or finish.");
    expect(passport).not.toMatch(/\bpoints\b|\blevel\b|achievement|streak|progress/iu);
  });

  it("keeps every Life Journey phase available without a percentage scorecard or phase lock", () => {
    expect(journey).toContain("Your story is still unfolding.");
    expect(journey).toContain("Available whenever you&apos;re ready");
    expect(journey).toContain("Keep the invitations that matter to you — nothing expires");
    expect(journey).toContain("toggleReflection");
    expect(journey).not.toContain("Overall Progress");
    expect(journey).not.toContain("% complete");
    expect(journey).not.toContain("phase.status !== \"upcoming\"");
    expect(journey).not.toContain("toggleStep");
  });
});
