import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const settings = readFileSync(
  fileURLToPath(
    new URL(
      "../components/kinfolk/KinfolkRegionalLanguageSettings.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);
const experience = readFileSync(
  fileURLToPath(
    new URL(
      "../components/kinfolk/KinfolkExperienceSettings.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("web Kinfolk language and place-name settings", () => {
  it("exposes explicit language, comprehension, style, pronunciation, and future-only controls", () => {
    expect(experience).toContain("KinfolkRegionalLanguageSettings");
    for (const label of [
      "Language & place names",
      "Regional speech comprehension",
      "Optional regional speaking style",
      "Use reviewed place-name pronunciation help",
      "Future language detection and code-switching preferences",
    ]) {
      expect(settings).toContain(label);
    }
    expect(settings).toMatch(
      /does not infer your language,\s*region, identity, or pronunciation/,
    );
    expect(settings).toContain(
      "automatic detection, switching, or translation today",
    );
  });

  it("keeps corrections private, consented, reviewable, pausable, and deletable", () => {
    expect(settings).toContain("api/kinfolk/language/corrections");
    expect(settings).toContain("consent: true");
    expect(settings).toContain(
      "Corrections are private to your Kinfolk experience",
    );
    expect(settings).toContain("Pause");
    expect(settings).toContain("Delete correction for");
  });
});
