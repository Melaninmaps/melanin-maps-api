import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (relative: string) => fs.readFileSync(path.resolve(here, relative), "utf8");

describe("Kinfolk entertainment personalization interfaces", () => {
  it("keeps Web preference controls on the dedicated member preference route", () => {
    const source = read("../components/kinfolk/KinfolkEntertainmentSettings.tsx");
    expect(source).toContain("api/kinfolk/entertainment/preferences");
    expect(source).toContain("entertainmentCostPolicy");
    expect(source).toContain("Only show options included with my saved services");
  });

  it("renders a confirm-or-dismiss consent card rather than saving from chat text", () => {
    const page = read("../pages/travel.tsx");
    const card = read("../components/kinfolk/KinfolkEntertainmentConsent.tsx");
    expect(page).toContain("entertainmentConsentPlan");
    expect(page).toContain("KinfolkEntertainmentConsent");
    expect(card).toContain("consent: true");
    expect(card).toContain("Don’t save");
  });
});
