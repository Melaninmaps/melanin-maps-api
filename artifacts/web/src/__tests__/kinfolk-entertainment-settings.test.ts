import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const settings = readFileSync(
  fileURLToPath(
    new URL(
      "../components/kinfolk/KinfolkEntertainmentSettings.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);
const host = readFileSync(
  fileURLToPath(
    new URL(
      "../components/kinfolk/KinfolkExperienceSettings.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("Kinfolk entertainment settings", () => {
  it("keeps saved services explicit, private, and clearable", () => {
    expect(settings).toContain("kinfolk-entertainment-settings");
    expect(settings).toContain("Ordinary chat never");
    expect(settings).toContain("Clear saved services");
    expect(settings).toContain("api/kinfolk/preferences");
  });
  it("renders the entertainment controls in the Kinfolk settings home", () => {
    expect(host).toContain("KinfolkEntertainmentSettings");
  });
});
