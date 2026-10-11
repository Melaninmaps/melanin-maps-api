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
const notificationCenter = readFileSync(
  fileURLToPath(new URL("../app/notification-center.tsx", import.meta.url)),
  "utf8",
);
const receivedCheckin = readFileSync(
  fileURLToPath(new URL("../app/safety-checkin-alert.tsx", import.meta.url)),
  "utf8",
);
const seriousThreat = readFileSync(
  fileURLToPath(new URL("../app/serious-credible-threat.tsx", import.meta.url)),
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
    expect(safetyHub).toContain("Trusted Live Location");
    expect(safetyHub).toContain('route: "/location-share"');
    expect(safetyHub).not.toContain("api/safety/location-shares");
    expect(safetyHub).toContain("Submit Safety Tip");
    expect(safetyHub).toContain("Serious Threat Report");
    expect(safetyHub).toContain('route: "/serious-credible-threat"');
  });

  it("routes a private Check-In recipient alert to a recipient-authorized view", () => {
    expect(notificationCenter).toContain('entityType === "safety_checkin"');
    expect(notificationCenter).toContain('data?.type === "safety_checkin_overdue"');
    expect(notificationCenter).toContain('pathname: "/safety-checkin-alert"');
    expect(notificationCenter).toContain("setNotifs(rows.map(mapApiRow))");
    expect(notificationCenter).not.toContain("const NOTIFS");
    expect(receivedCheckin).toContain("/api/safety/checkins/received/");
    expect(receivedCheckin).toContain("alert.privacy");
    expect(receivedCheckin).toContain("does not contact emergency services");
    expect(receivedCheckin).not.toContain("expo-location");
    expect(receivedCheckin).not.toContain("createdAt");
    expect(receivedCheckin).not.toContain("new Date(");
    expect(notificationCenter).toContain('group: isPrivateCheckinAlert ? "Private alerts"');
    expect(notificationCenter).toContain("time: isPrivateCheckinAlert ? null");
  });

  it("keeps serious threat reporting city-level, consented, and private-review-only", () => {
    const reportPayload = seriousThreat.slice(
      seriousThreat.indexOf("body: JSON.stringify({"),
      seriousThreat.indexOf("if (response.status === 202)"),
    );
    expect(seriousThreat).toContain("/api/safety/serious-credible-threats/reports");
    expect(seriousThreat).toContain("privateReview: true");
    expect(seriousThreat).toContain("anonymousCityLevelNotice: true");
    expect(seriousThreat).toContain("No street, venue, neighborhood, landmark, or coordinates.");
    expect(seriousThreat).toContain("Private review is unavailable right now. Your report was not saved.");
    expect(seriousThreat).toContain("does not contact emergency services");
    expect(reportPayload).not.toContain("latitude");
    expect(reportPayload).not.toContain("longitude");
  });
});
