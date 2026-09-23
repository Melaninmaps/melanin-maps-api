import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(__dirname, "../components/OnboardingPreferenceSurvey.tsx"),
  "utf8",
);

describe("onboarding preference survey", () => {
  it("offers balanced interests before optional culture and community context", () => {
    expect(source).toContain('"Food & Restaurants"');
    expect(source).toContain('"Career & Networking"');
    expect(source).toContain('"Pet-Friendly Places"');
    expect(source).toContain("Culture & community");
    expect(source).toContain('"Black History & Culture"');
    expect(source).toContain('"Minority-Owned Businesses"');
    expect(source).toContain("It never replaces your general preferences.");
  });

  it("separates comfort preferences from member interests", () => {
    expect(source).toContain("What helps you feel comfortable?");
    expect(source).toContain("COMFORT_OPTIONS");
    expect(source).not.toContain("Accessibility needs");
  });

  it("keeps interests and travel style explicitly multi-select", () => {
    expect(source).toContain('toggle("interests", interest)');
    expect(source).toContain('toggle("travelStyle", s.id)');
    expect(source).toContain("Select all that apply");
  });
});
