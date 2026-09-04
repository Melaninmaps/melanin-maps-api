import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locationResolutionErrorMessage } from "../features/location/locationResolutionMessages";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("location resolver UI messages", () => {
  it("gives a canonical Philadelphia example for an unsupported area", () => {
    expect(locationResolutionErrorMessage(404)).toContain("Philadelphia, PA");
  });

  it("asks for state disambiguation when duplicate city names are returned", () => {
    expect(locationResolutionErrorMessage(409)).toContain("Add the state");
  });

  it("registers a working detail destination for indexed Explore cultural records", () => {
    const app = source("../App.tsx");
    const detail = source("../pages/tour-cultural-site-detail.tsx");
    expect(app).toContain('<Route path="/tour-cultural-sites/:id">');
    expect(app).toContain("<TourCulturalSiteDetail />");
    expect(detail).toContain("/api/tour-cultural-sites/${encodeURIComponent(id)}");
    expect(detail).toContain("Community cultural record");
    expect(detail).not.toContain("Verified");
  });
});
