import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const businessMapSource = source("../components/BusinessMapView.tsx");
const fullMapSource = source("../components/FullMapView.tsx");
const mapTabSource = source("../components/MapTabView.tsx");
const geoAlertSource = source("../hooks/useGeoSafeAlert.ts");
const communityIntelligenceSource = source("../app/report-intelligence.tsx");
const safetyPulseSource = source("../components/SafetyPulseWidget.tsx");
const neighborhoodSurveySource = source("../app/neighborhood-survey.tsx");
const safetyHubSource = source("../app/(tabs)/safety-hub.tsx");

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

  it("lets a member choose a city for a reduced Community Intelligence aggregate without requesting device location", () => {
    expect(communityIntelligenceSource).toContain("/api/safety/heatmap/city?city=");
    expect(communityIntelligenceSource).toContain("City for Community Intelligence survey signal");
    expect(communityIntelligenceSource).toContain("city-level community survey signal");
    expect(communityIntelligenceSource).toContain("No individual reports or member locations are shown.");
    expect(communityIntelligenceSource).toContain("No city signal is shown");
    expect(communityIntelligenceSource).not.toContain("expo-location");
    expect(communityIntelligenceSource).not.toContain("getCurrentPositionAsync");
  });

  it("keeps the Safety Hub on the manual city-aggregate path and removes its dormant proximity-alert surface", () => {
    expect(safetyHubSource).toContain("Community Intelligence never requests or uses your location.");
    expect(safetyHubSource).toContain("No member activity maps, individual reports, locations, timestamps, or route histories are displayed.");
    expect(safetyHubSource).toContain('router.push("/report-intelligence"');
    expect(safetyHubSource).toContain('router.push("/neighborhood-survey"');
    expect(safetyHubSource).toContain("Small samples are suppressed");
    expect(safetyHubSource).toContain("one accepted Kinfolk contact for a chosen time");
    expect(safetyHubSource).not.toContain("distanceMeters");
    expect(safetyHubSource).not.toContain("community-alerts/");
    expect(safetyHubSource).not.toContain("Nearby verified members are alerted");
  });

  it("does not fetch or reveal individual surveys in the Safety Pulse card", () => {
    expect(safetyPulseSource).toContain("City-level, delayed aggregates only");
    expect(safetyPulseSource).toContain("No individual reports, neighborhoods, member locations, or timestamps are shown.");
    expect(safetyPulseSource).not.toContain("/api/surveys");
    expect(safetyPulseSource).not.toContain("getCurrentPositionAsync");
  });

  it("requires an explicit city-level aggregate choice before a survey is submitted", () => {
    expect(neighborhoodSurveySource).toContain("communityIntelligenceConsent: true");
    expect(neighborhoodSurveySource).toContain("Consent to delayed city aggregate participation");
    expect(neighborhoodSurveySource).toContain("Choose a city yourself.");
    expect(neighborhoodSurveySource).not.toContain("useAutoContext");
    expect(neighborhoodSurveySource).not.toContain("expo-location");
  });
});
