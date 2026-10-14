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
const safetyHubTab = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/safety-hub.tsx", import.meta.url)),
  "utf8",
);
const officerWatch = readFileSync(
  fileURLToPath(new URL("../app/officer-watch.tsx", import.meta.url)),
  "utf8",
);
const mentalHealth = readFileSync(
  fileURLToPath(new URL("../app/mental-health.tsx", import.meta.url)),
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
    expect(safetyHub).toContain('export { default } from "./(tabs)/safety-hub"');
    expect(safetyHubTab).toContain("Safety Hub");
    expect(safetyHubTab).toContain("Trusted Live Location");
    expect(safetyHubTab).toContain('route: "/location-share"');
    expect(safetyHubTab).not.toContain("api/safety/location-shares");
    expect(safetyHubTab).toContain("Submit Safety Tip");
    expect(safetyHubTab).toContain("Serious Threat Report");
    expect(safetyHubTab).toContain('route: "/serious-credible-threat"');
    expect(safetyHubTab).toContain("Community Intelligence");
    expect(safetyHubTab).toContain("Small samples are suppressed");
    expect(safetyHubTab).toContain("Police / ICE Awareness");
    expect(safetyHubTab).toContain("Police / ICE Alert Preferences");
    expect(safetyHubTab).toContain('route: "/(tabs)/profile"');
    expect(safetyHubTab).toContain("Member and device locations are never used to select recipients.");
    expect(safetyHubTab).toContain('route: "/report-safety"');
    expect(safetyHubTab).not.toContain('route: "/safety-tip"');
    expect(safetyHubTab).not.toContain("Nearby verified members are alerted to confirm.");
    expect(safetyHubTab).not.toContain("Share and read community safety reports for any neighborhood.");
    expect(safetyHubTab).not.toContain("Track law enforcement officers flagged");
    expect(safetyHubTab).not.toContain('route: "/officer-watch"');
  });

  it("retires individual officer tracking while preserving the city-level Police and ICE route", () => {
    expect(officerWatch).toContain("Officer tracking is not available");
    expect(officerWatch).toContain("does not identify, track, list, or send alerts about individual officers");
    expect(officerWatch).toContain('router.replace("/report-police"');
    expect(officerWatch).not.toContain("api/safety/officer-watch");
    expect(officerWatch).not.toContain("Officer Name");
    expect(officerWatch).not.toContain("transfers:");
  });

  it("uses the verified NAMI HelpLine text contact instead of the Crisis Text Line number", () => {
    expect(mentalHealth).toContain("Text NAMI to 62640");
    expect(mentalHealth).toContain('value: "sms:62640&body=NAMI"');
    expect(mentalHealth).not.toContain("Text NAMI to 741741");
    expect(mentalHealth).not.toContain('value: "sms:741741&body=NAMI"');
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
    expect(seriousThreat).toContain("/api/safety/serious-credible-threats/reports/${encodeURIComponent(reportId)}/status");
    expect(seriousThreat).toContain("private_review_complete");
    expect(seriousThreat).toContain("This does not mean a public alert was created");
    expect(seriousThreat).toContain("Check private review status");
    expect(reportPayload).not.toContain("latitude");
    expect(reportPayload).not.toContain("longitude");

    const statusLookup = seriousThreat.slice(
      seriousThreat.indexOf("const checkReviewStatus"),
      seriousThreat.indexOf("const topPadding"),
    );
    expect(statusLookup).not.toContain("category");
    expect(statusLookup).not.toContain("city");
    expect(statusLookup).not.toContain("region");
    expect(statusLookup).not.toContain("moderator");
    expect(statusLookup).not.toContain("delivery");
  });
});
