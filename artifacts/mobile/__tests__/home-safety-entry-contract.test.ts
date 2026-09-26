import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const home = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/index.tsx", import.meta.url)),
  "utf8",
);
const settings = readFileSync(
  fileURLToPath(new URL("../app/settings.tsx", import.meta.url)),
  "utf8",
);
const safetyHub = readFileSync(
  fileURLToPath(new URL("../app/safety-hub.tsx", import.meta.url)),
  "utf8",
);

describe("mobile Home safety entry boundaries", () => {
  it("removes only the Discover Home safety promotion and neighborhood-rating action", () => {
    expect(home).not.toContain("Community Safety");
    expect(home).not.toContain("Rate Neighborhood");
    expect(home).not.toContain("NeighborhoodSafetySurvey");
    expect(home).not.toContain("useAlerts");
  });

  it("keeps the existing Safety Hub and safety settings reachable", () => {
    expect(settings).toContain('route: "/safety-hub"');
    expect(settings).toContain('route: "/privacy"');
    expect(safetyHub).toContain("Safety Hub");
    expect(safetyHub).toContain("Location Sharing");
    expect(safetyHub).toContain("Submit Safety Tip");
  });
});
