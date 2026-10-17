import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const familySettingsSource = readFileSync(
  new URL("../app/family-settings.tsx", import.meta.url),
  "utf8",
);

describe("native Family Mode Kinfolk disclosure", () => {
  it("explains that Family Mode applies to Kinfolk chat without changing account age or voice", () => {
    expect(familySettingsSource).toContain("every Kinfolk chat");
    expect(familySettingsSource).toContain("does not change the account age");
    expect(familySettingsSource).toContain("saved Kinfolk voice settings");
  });

  it("identifies the protected adult-oriented recommendation categories", () => {
    expect(familySettingsSource).toContain("adult venues, nightlife, gambling");
    expect(familySettingsSource).toContain("alcohol-focused suggestions");
    expect(familySettingsSource).toContain("explicit content");
  });
});
