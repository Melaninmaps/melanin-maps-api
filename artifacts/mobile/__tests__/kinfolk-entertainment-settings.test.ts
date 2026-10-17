import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const settings = readFileSync(
  fileURLToPath(
    new URL("../components/KinfolkEntertainmentSettings.tsx", import.meta.url),
  ),
  "utf8",
);
const route = readFileSync(
  fileURLToPath(new URL("../app/kinfolk-entertainment.tsx", import.meta.url)),
  "utf8",
);
const home = readFileSync(
  fileURLToPath(
    new URL("../components/KinfolkSettingsControlCenter.tsx", import.meta.url),
  ),
  "utf8",
);

describe("native Kinfolk entertainment settings", () => {
  it("uses authenticated saved preference controls with an evidence-only availability boundary", () => {
    expect(settings).toContain("auth_session_token");
    expect(settings).toContain("api/kinfolk/entertainment/preferences");
    expect(settings).toContain("entertainmentCostPolicy");
    expect(settings).toContain("cited page establishes the title");
    expect(settings).toContain("without guessing a service, price, theater");
  });
  it("exposes an accessible navigation route", () => {
    expect(route).toContain("KinfolkEntertainmentSettings");
    expect(home).toContain('router.push("/kinfolk-entertainment"');
  });
});
