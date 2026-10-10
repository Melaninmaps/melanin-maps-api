import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const businessMapSource = source("../components/BusinessMapView.tsx");
const fullMapSource = source("../components/FullMapView.tsx");
const mapTabSource = source("../components/MapTabView.tsx");
const geoAlertSource = source("../hooks/useGeoSafeAlert.ts");

describe("mobile Safety Heat privacy and evidence presentation", () => {
  it("shows no city circle when the API marks evidence insufficient or unavailable", () => {
    expect(businessMapSource).toContain('data.dataStatus === "sufficient_evidence"');
    expect(businessMapSource).toContain('setHeatmapPoints(hasSufficientEvidence ? data.points : [])');
    expect(businessMapSource).toContain('heatmapStatus === "sufficient" && heatmapPoints.map');
    expect(businessMapSource).toContain("Not enough recent approved community surveys to show a map signal.");
    expect(businessMapSource).toContain("This does not mean an area is safe or unsafe.");
    expect(fullMapSource).toContain('data.dataStatus === "sufficient_evidence"');
    expect(fullMapSource).toContain("? data.points");
  });

  it("labels the display as a limited aggregate survey signal rather than a safety claim", () => {
    expect(businessMapSource).toContain("Community survey signal");
    expect(businessMapSource).toContain("City-centroid survey signal only");
    expect(businessMapSource).toContain("approved surveys from the last");
    expect(businessMapSource).toContain("Not a safety guarantee.");
    expect(fullMapSource).toContain("Not a safety guarantee.");
    expect(mapTabSource).toContain("This is not a safety guarantee.");
    expect(businessMapSource).toContain("approvedSurveyCount");
    expect(fullMapSource).toContain("approvedSurveyCount");
    expect(mapTabSource).toContain("approvedSurveyCount");
  });

  it("uses the protected aggregate endpoint instead of fetching raw survey records or sending coordinates to it", () => {
    expect(geoAlertSource).toContain("/api/safety/heatmap?city=");
    expect(geoAlertSource).not.toContain("/api/surveys?city=");
    expect(geoAlertSource).toContain("The Safety Heat API receives only a city");
    expect(geoAlertSource).toContain("reporter identity, reporter location, or device coordinates.");
    expect(geoAlertSource).not.toContain("neighborhood:");
    expect(geoAlertSource).not.toContain("surveyCount:");
  });
});
