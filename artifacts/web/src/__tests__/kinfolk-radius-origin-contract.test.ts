import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelPage = readFileSync(
  fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk website verified-radius contract", () => {
  it("uses an explicit public origin only for the current exact-radius turn", () => {
    expect(travelPage).toContain("Exact-radius origin (public place only)");
    expect(travelPage).toContain("setExactRadiusOrigin(\"\")");
    expect(travelPage).toContain("publicOrigin: publicOrigin || undefined");
    expect(travelPage).toContain("not saved to Kinfolk memory or your profile");
    expect(travelPage).not.toContain("rememberThis: publicOrigin");
  });
});
