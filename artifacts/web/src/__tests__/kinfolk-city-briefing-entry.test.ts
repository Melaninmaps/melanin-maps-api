import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const webTravel = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");
const mobileTravel = readFileSync(new URL("../../../mobile/app/travel.tsx", import.meta.url), "utf8");

describe("Kinfolk city briefing entry points", () => {
  it("offers the same current-city briefing prompt on web and mobile", () => {
    const prompt = "What should I know about Minneapolis?";
    expect(webTravel).toContain(prompt);
    expect(mobileTravel).toContain(prompt);
  });
});
