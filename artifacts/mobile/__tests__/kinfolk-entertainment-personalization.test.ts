import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (relative: string) => fs.readFileSync(path.resolve(here, relative), "utf8");

describe("native Kinfolk entertainment personalization", () => {
  it("keeps explicit no-extra-cost controls in member settings", () => {
    const source = read("../components/KinfolkEntertainmentSettings.tsx");
    expect(source).toContain("api/kinfolk/entertainment/preferences");
    expect(source).toContain("entertainmentCostPolicy");
    expect(source).toContain("Only show options included with my saved services");
  });

  it("renders an authenticated consent card for natural subscription statements", () => {
    const chat = read("../components/AIChatWidget.tsx");
    const card = read("../components/KinfolkEntertainmentConsent.tsx");
    expect(chat).toContain("entertainmentConsentPlan");
    expect(chat).toContain("KinfolkEntertainmentConsent");
    expect(card).toContain("api/kinfolk/entertainment/consent");
    expect(card).toContain("consent: true");
  });
});
