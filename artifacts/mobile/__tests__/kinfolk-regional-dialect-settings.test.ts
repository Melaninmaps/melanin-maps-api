import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const controlCenter = readFileSync(
  new URL("../components/KinfolkSettingsControlCenter.tsx", import.meta.url),
  "utf8",
);
const language = readFileSync(
  new URL("../components/KinfolkRegionalLanguageSettings.tsx", import.meta.url),
  "utf8",
);
const route = readFileSync(
  new URL("../app/kinfolk-language.tsx", import.meta.url),
  "utf8",
);

describe("native Kinfolk regional language settings", () => {
  it("links the explicit language controls from the settings hub", () => {
    expect(controlCenter).toContain(
      'router.push("/kinfolk-language" as never)',
    );
    expect(controlCenter).toContain("Language & place names");
    expect(route).toContain("KinfolkRegionalLanguageSettings");
  });

  it("keeps language and corrections member-controlled", () => {
    for (const value of [
      "Conversation language",
      "Understand a selected regional language setting",
      "Optional regional speaking style",
      "Use reviewed place-name pronunciation help",
      "Private pronunciation corrections",
    ]) {
      expect(language).toContain(value);
    }
    expect(language).toContain("api/kinfolk/language/corrections");
    expect(language).toMatch(
      /never made\s+into community language rules automatically/,
    );
    expect(language).toContain(
      "Future automatic language detection and code switching remain disabled",
    );
  });
});
