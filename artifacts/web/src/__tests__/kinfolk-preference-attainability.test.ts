import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const onboarding = readFileSync(new URL("../components/KinfolkOnboarding.tsx", import.meta.url), "utf8");
const kinfolkPage = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");
const ageAssuranceHook = readFileSync(new URL("../hooks/useAgeAssurance.ts", import.meta.url), "utf8");
const supportPreferences = readFileSync(new URL("../features/profile/BusinessSupportPreferences.tsx", import.meta.url), "utf8");
const flow = readFileSync(new URL("../lib/kinfolk-onboarding.ts", import.meta.url), "utf8");

describe("web Kinfolk preference attainability", () => {
  it("uses API-valid explicit ordinary preferences without assigning a default personality", () => {
    expect(flow).toContain('{ value: "mid", label: "Moderate"');
    expect(flow).toContain('{ value: "luxury", label: "Upscale"');
    expect(flow).toContain('{ value: "any", label: "Mix it up"');
    expect(flow).not.toContain('{ value: "moderate"');
    expect(flow).toContain("payload.communicationStyle = draft.responseStyle");
    expect(flow).not.toContain("personalityMode");
  });

  it("keeps specific interests and voluntary life stage attainable in the independent editor", () => {
    expect(onboarding).not.toContain("recommendationLifeStage");
    for (const field of ["recommendationLifeStage", "Prefer not to say", "18–39", "40–64", "65+"]) expect(kinfolkPage).toContain(field);
    expect(kinfolkPage).toMatch(/author events, candle making, board games/);
    expect(kinfolkPage).toMatch(/does not collect your\s+birth date/);
    expect(onboarding).toContain("editable later in Kinfolk Settings and Taste Profile");
  });

  it("preserves no-DOB self-attestation in settings, not the initial Kinfolk path", () => {
    expect(ageAssuranceHook).toContain("api/age-assurance");
    expect(ageAssuranceHook).toContain("JSON.stringify({ ageBand: band, attested: true })");
    expect(ageAssuranceHook).not.toMatch(/dateOfBirth|date_of_birth|birthDate/);
    expect(onboarding).not.toContain("ageAssurance");
    expect(kinfolkPage).toContain('ageAssurance.attest("18_plus")');
    expect(kinfolkPage).toContain('ageAssurance.ageBand !== "18_plus"');
    expect(kinfolkPage).toContain("I confirm I am 18 or older");
    expect(kinfolkPage).toContain("youth-protected");
  });

  it("does not mark onboarding complete after a failed preference save", () => {
    expect(onboarding).toContain('if (!preferencesResponse.ok) throw new Error("PREFERENCE_SAVE_FAILED")');
    expect(onboarding).toContain('if (!profileResponse.ok) throw new Error("PROFILE_SAVE_FAILED")');
    expect(onboarding).toContain("Nothing was marked complete; please try again.");
    expect(onboarding).not.toContain("Non-blocking — mark complete even if pref save fails");
  });

  it("preserves ordered Support Lens editing in profile settings without collecting it initially", () => {
    for (const field of ["Primary support choice", "Additional profile badge", "SUPPORT_LENS_PRIMARY_OPTIONS", "SUPPORT_LENS_SECONDARY_OPTIONS", "Black / African American-Owned is first"]) expect(supportPreferences).toContain(field);
    expect(onboarding).not.toContain("Support Lens");
    expect(onboarding).not.toContain("SUPPORT_LENS");
  });
});
