import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const onboarding = readFileSync(new URL("../components/KinfolkOnboarding.tsx", import.meta.url), "utf8");
const tasteProfile = readFileSync(new URL("../app/travel.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../hooks/useUserPreferences.ts", import.meta.url), "utf8");

describe("mobile Kinfolk preference attainability", () => {
  it("carries a closed voluntary life-stage field through hook, onboarding, and editor", () => {
    for (const source of [onboarding, tasteProfile, hook]) {
      expect(source).toContain("recommendationLifeStage");
      expect(source).toContain("unspecified");
    }
    expect(onboarding).toContain("Prefer not to say");
    expect(tasteProfile).toContain("Prefer not to say");
    expect(hook).toContain('"18_39", "40_64", "65_plus"');
  });

  it("supports bounded specific interests and keeps failed saves visible", () => {
    expect(onboarding).toMatch(/author events, candle making, board games/);
    expect(tasteProfile).toMatch(/author events, candle making, board games/);
    expect(onboarding).toContain("Nothing was marked complete; please try again.");
    expect(tasteProfile).toContain("Preferences not saved");
    expect(onboarding).toContain("if (saved) await markKinfolkOnboardingDone()");
  });

  it("uses API-valid communication and humor values in the editor", () => {
    expect(tasteProfile).toContain('{ id: "detailed", label: "Detailed"');
    expect(tasteProfile).toContain('{ id: "none", label: "Just the facts"');
    expect(tasteProfile).not.toContain('{ id: "community", label: "Community"');
    expect(tasteProfile).not.toContain('{ id: "off", label: "Just the facts"');
  });
});
