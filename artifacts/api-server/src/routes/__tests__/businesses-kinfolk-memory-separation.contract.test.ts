import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const businessesRoute = readFileSync(
  fileURLToPath(new URL("../businesses.ts", import.meta.url)),
  "utf8",
);

function routeSegment(start: string, end: string): string {
  const from = businessesRoute.indexOf(start);
  const to = businessesRoute.indexOf(end, from);
  if (from < 0 || to < 0) {
    throw new Error(`Expected businesses route segment: ${start} → ${end}`);
  }
  return businessesRoute.slice(from, to);
}

describe("standalone Map and Directory Kinfolk-memory separation", () => {
  it("uses only explicit Map designation filters and never reads saved Kinfolk preferences", () => {
    const mapPinsRoute = routeSegment(
      'router.get("/businesses/map-pins"',
      'router.get("/businesses",',
    );

    expect(mapPinsRoute).toContain(
      "Standalone Map is deliberately preference-neutral.",
    );
    expect(mapPinsRoute).toContain("req.query.designations");
    expect(mapPinsRoute).not.toContain("userPreferencesTable");
  });

  it("keeps standalone Directory designation filtering explicit and preference-neutral", () => {
    const designationResolution = routeSegment(
      "const explicitDesignationFilterIds",
      "for (const designationId of designationFilterIds)",
    );

    expect(designationResolution).toContain("saved: [],");
    expect(designationResolution).toContain("savedMode: null,");
    expect(designationResolution).not.toContain("userPreferencesTable");
  });
});
