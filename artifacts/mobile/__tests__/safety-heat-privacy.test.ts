import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const businessMapSource = source("../components/BusinessMapView.tsx");
const fullMapSource = source("../components/FullMapView.tsx");
const mapTabSource = source("../components/MapTabView.tsx");
const nativeMapTabSource = source("../components/MapTabView.native.tsx");
const geoAlertSource = source("../hooks/useGeoSafeAlert.ts");
const proximitySource = source("../hooks/useSafetyProximity.ts");
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

  it("retires automatic device-location safety signals in favor of member-selected city aggregates", () => {
    expect(geoAlertSource).toContain("member-selected,\n * city-level, consented, and aggregate-only");
    expect(geoAlertSource).toContain("alert: null as GeoAlert | null");
    expect(geoAlertSource).not.toContain("expo-location");
    expect(geoAlertSource).not.toContain("getCurrentPositionAsync");
    expect(geoAlertSource).not.toContain("latlng=");
    expect(geoAlertSource).not.toContain("/api/safety/heatmap?city=");
  });

  it("retires proximity tracking and does not watch, send, or display member coordinates", () => {
    expect(proximitySource).toContain("Legacy proximity warnings are retained as types only");
    expect(proximitySource).toContain("warnings: [] as ProximityWarning[]");
    expect(proximitySource).not.toContain("expo-location");
    expect(proximitySource).not.toContain("watchPositionAsync");
    expect(proximitySource).not.toContain("navigator.geolocation");
    expect(proximitySource).not.toContain("/api/reports/proximity-warnings");
  });

  it("routes MapTab safety actions to manual Community Intelligence instead of nearby-business scanning", () => {
    expect(mapTabSource).toContain('router.push("/report-intelligence")');
    expect(mapTabSource).toContain('router.push("/report-police")');
    expect(mapTabSource).not.toContain("community-alerts/flagged-businesses");
    expect(mapTabSource).not.toContain("getCurrentPositionAsync");
    expect(mapTabSource).not.toContain("Flagged Nearby");
    expect(mapTabSource).not.toContain("Scanning your area");
  });

  it("keeps native navigation free of destination safety claims and map-local safety queries", () => {
    expect(nativeMapTabSource).toContain("It never queries or presents a map-local safety assessment.");
    expect(nativeMapTabSource).toContain("Route details do not include a safety assessment.");
    expect(nativeMapTabSource).not.toContain("community-alerts/nearby?lat=${biz.latitude}");
    expect(nativeMapTabSource).not.toContain("Safety alerts near destination");
    expect(nativeMapTabSource).not.toContain("Route looks clear");
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
