import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const onboarding = readFileSync(new URL("../components/KinfolkOnboarding.tsx", import.meta.url), "utf8");
const kinfolkPage = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");

describe("web Kinfolk preference attainability", () => {
  it("uses API-valid budget, companion, communication, and personality values", () => {
    expect(onboarding).toContain('{ value: "mid", label: "Moderate"');
    expect(onboarding).toContain('{ value: "luxury", label: "Upscale"');
    expect(onboarding).toContain('{ value: "any", label: "Mix it up"');
    expect(onboarding).not.toContain('{ value: "moderate"');
    expect(onboarding).toContain('communicationStyle: personalizationLevel');
    expect(onboarding).toMatch(/personalityMode = atmosphereMode === "cultural"[\s\S]+"cultural_curator"/);
  });

  it("lets new and returning members edit specific interests and voluntary life stage", () => {
    for (const source of [onboarding, kinfolkPage]) {
      expect(source).toContain("recommendationLifeStage");
      expect(source).toContain("Prefer not to say");
      expect(source).toContain("18–39");
      expect(source).toContain("40–64");
      expect(source).toContain("65+");
      expect(source).toMatch(/author events, candle making, board games/);
      expect(source).toMatch(/does not collect your birth date|does not collect your birth date here/);
    }
  });

  it("does not mark onboarding complete after a failed preference save", () => {
    expect(onboarding).toContain('if (!preferencesResponse.ok) throw new Error("PREFERENCE_SAVE_FAILED")');
    expect(onboarding).toContain('if (!profileResponse.ok) throw new Error("PROFILE_SAVE_FAILED")');
    expect(onboarding).toContain("Nothing was marked complete; please try again.");
    expect(onboarding).not.toContain("Non-blocking — mark complete even if pref save fails");
  });
});
