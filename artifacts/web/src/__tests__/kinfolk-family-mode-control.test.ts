import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const controlSource = readFileSync(
  new URL(
    "../components/kinfolk/KinfolkFamilyModeControl.tsx",
    import.meta.url,
  ),
  "utf8",
);
const settingsSource = readFileSync(
  new URL(
    "../components/kinfolk/KinfolkExperienceSettings.tsx",
    import.meta.url,
  ),
  "utf8",
);

describe("web Family Mode Kinfolk control", () => {
  it("loads and persists the existing explicit Family Mode setting", () => {
    expect(controlSource).toContain("api/family/guidance-settings");
    expect(controlSource).toContain('method: "PATCH"');
    expect(controlSource).toContain("familyModeEnabled: next");
    expect(controlSource).toContain("authenticatedFetch");
  });

  it("describes the chat override without claiming an age or preference mutation", () => {
    expect(controlSource).toContain("every chat");
    expect(controlSource).toContain("does not change your account age");
    expect(controlSource).toContain("saved Kinfolk voice");
    expect(settingsSource).toContain("KinfolkFamilyModeControl");
  });
});
