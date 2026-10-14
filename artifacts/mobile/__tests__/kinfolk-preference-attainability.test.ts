import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const onboarding = readFileSync(new URL("../components/KinfolkOnboarding.tsx", import.meta.url), "utf8");
const tasteProfile = readFileSync(new URL("../app/travel.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../hooks/useUserPreferences.ts", import.meta.url), "utf8");
const supportDropdowns = readFileSync(new URL("../components/SupportLensDropdowns.tsx", import.meta.url), "utf8");
const culturalPreference = readFileSync(new URL("../app/cultural-preference.tsx", import.meta.url), "utf8");
const kinfolkSettings = readFileSync(new URL("../components/KinfolkSettingsControlCenter.tsx", import.meta.url), "utf8");
const identityOnboarding = readFileSync(new URL("../app/onboarding/identity.tsx", import.meta.url), "utf8");

describe("mobile Kinfolk preference attainability", () => {
  it("keeps voluntary life-stage preferences in the hook and independent editor, not initial setup", () => {
    for (const source of [tasteProfile, hook]) {
      expect(source).toContain("recommendationLifeStage");
      expect(source).toContain("unspecified");
    }
    expect(onboarding).not.toContain("recommendationLifeStage");
    expect(tasteProfile).toContain("Prefer not to say");
    expect(hook).toContain('"18_39", "40_64", "65_plus"');
  });

  it("does not collect identity or community context in initial Kinfolk setup", () => {
    for (const field of ["Sex assigned at birth", "Gender identity", "Culture & community", "allowMedicallyRelevantContext", "identity-context", "communities:"]) {
      expect(onboarding).not.toContain(field);
    }
    expect(onboarding).toContain("No sensitive or current-life details are requested here");
    expect(hook).toContain("personalizationContextCompleted");
  });

  it("leaves independent member-context defaults untouched", () => {
    expect(onboarding).not.toContain("useMemberContextByDefault");
    expect(kinfolkSettings).toContain("Edit explicit profile details");
    expect(hook).toContain("useMemberContextByDefault: false");
  });

  it("uses a compact modal stepper instead of the all-at-once form", () => {
    expect(onboarding).toContain('animationType="fade"');
    expect(onboarding).toContain("Optional Kinfolk setup");
    expect(onboarding).not.toContain("showAllSections");
    expect(onboarding).toContain("buildOnboardingSteps(draft)");
    expect(onboarding).toContain("setStepId(");
    expect(onboarding).toContain("totalSteps = steps.length");
  });

  it("keeps specific interests editable later and failed setup saves visible", () => {
    expect(tasteProfile).toMatch(/author events, candle making, board games/);
    expect(onboarding).toContain("Nothing was marked complete; please try again.");
    expect(tasteProfile).toContain("Preferences not saved");
    expect(onboarding).toContain("buildOnboardingPayload(currentDraft), update, markKinfolkOnboardingDone");
    expect(onboarding).toContain("if (saved) onComplete()");
  });

  it("uses API-valid communication and humor values in the editor", () => {
    expect(tasteProfile).toContain('{ id: "detailed", label: "Detailed"');
    expect(tasteProfile).toContain('{ id: "none", label: "Just the facts"');
    expect(tasteProfile).not.toContain('{ id: "community", label: "Community"');
    expect(tasteProfile).not.toContain('{ id: "off", label: "Just the facts"');
  });

  it("uses ordered primary and optional secondary Support Lens dropdowns everywhere members edit them", () => {
    expect(supportDropdowns).toContain("Primary support choice");
    expect(supportDropdowns).toContain("Additional profile badge");
    expect(supportDropdowns).toContain("Black / African American-Owned appears first");
    expect(supportDropdowns).toContain("Foundational Black American-Owned");
    expect(supportDropdowns).toContain("Divine Nine-Affiliated or Veteran-Owned");
    for (const source of [culturalPreference, kinfolkSettings, identityOnboarding]) {
      expect(source).toContain("SupportLensDropdowns");
    }
  });
});
