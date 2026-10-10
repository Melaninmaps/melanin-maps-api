import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { projectApprovedIncident } from "../safety/approvedIncidentAlerts";
import {
  coarsePoliceIceGeneralArea,
  hasPoliceIceReportingConsent,
  policeIceAlertExpiresAt,
  policeIceAlertState,
  POLICE_ICE_REPORTING_CONSENT_VERSION,
} from "../safety/policeIceAlertPolicy";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Police/ICE P0 reporting and alert governance", () => {
  it("rejects absent, false, or stale reporting consent", () => {
    expect(hasPoliceIceReportingConsent({})).toBe(false);
    expect(hasPoliceIceReportingConsent({ reportingConsent: false, reportingConsentVersion: POLICE_ICE_REPORTING_CONSENT_VERSION })).toBe(false);
    expect(hasPoliceIceReportingConsent({ reportingConsent: true, reportingConsentVersion: "old-copy" })).toBe(false);
    expect(hasPoliceIceReportingConsent({
      reportingConsent: true,
      reportingConsentVersion: POLICE_ICE_REPORTING_CONSENT_VERSION,
    })).toBe(true);
  });

  it("uses a city/region only and never labels intake or expired evidence a verified threat", () => {
    expect(coarsePoliceIceGeneralArea({ city: "Philadelphia", region: "PA" })).toBe("Philadelphia, PA");
    const triggeredAt = new Date("2026-10-10T12:00:00.000Z");
    expect(policeIceAlertExpiresAt(triggeredAt).toISOString()).toBe("2026-10-10T14:00:00.000Z");
    expect(policeIceAlertState({ approvedReportCount: 1 })).toBe("under_review");
    expect(policeIceAlertState({ approvedReportCount: 3, triggeredAt, now: new Date("2026-10-10T13:00:00.000Z") })).toBe("corroborated");
    expect(policeIceAlertState({ approvedReportCount: 3, triggeredAt, now: new Date("2026-10-10T14:00:00.000Z") })).toBe("expired");
    expect(policeIceAlertState({ approvedReportCount: 3, triggeredAt, resolvedAt: new Date() })).toBe("resolved");
  });

  it("does not let a Police report corroborate an ICE alert", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "3", severity: "high" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: "ice-incident" }] });

    const projection = await projectApprovedIncident({ query } as never, {
      city: "Philadelphia",
      region: "PA",
      category: "police",
      encounterType: "ice_activity",
      area: "Never persisted",
    });

    expect(projection).toMatchObject({ incidentId: "ice-incident", reportCount: 3, needsNotification: true });
    expect(query.mock.calls[1]?.[0]).toContain("AND encounter_type = $5");
    expect(query.mock.calls[1]?.[1]).toMatchObject(["Philadelphia", "PA", "police", expect.any(Date), "ice_activity"]);
    expect(query.mock.calls[2]?.[1]).toEqual(["Philadelphia", "PA", "police:ice_activity", expect.any(Date)]);
    expect(query.mock.calls[3]?.[1]).toEqual(["Philadelphia", "PA", null, "police:ice_activity", "high", 3]);
  });

  it("requires consent, blocks direct coordinate alerts, and limits delivery to coarse opt-in disclosure", () => {
    const reports = source("../routes/reports.ts");
    const communityAlerts = source("../routes/community-alerts.ts");
    const push = source("../lib/pushNotifications.ts");
    const moderation = source("../safety/moderateSafetyReport.ts");

    expect(reports).toContain("hasPoliceIceReportingConsent");
    expect(reports).toContain("Explicit consent is required before submitting a Police/ICE observation");
    expect(reports).toContain('resolvedCategory === "police"\n      ? incidentLocation');
    expect(reports).toContain("'corroborated' ELSE 'active'");
    expect(reports).toContain("POLICE_ICE_ALERT_TTL_MS");
    expect(communityAlerts).toContain('const DIRECT_POLICE_ICE_TYPES = new Set(["police", "ice", "checkpoint"])');
    expect(communityAlerts).toContain("type NOT IN ('police', 'ice', 'checkpoint')");
    expect(communityAlerts).toContain("require anonymous intake, moderation, and corroboration");
    expect(moderation).toContain("encounterType: report.encounterType");
    expect(push).toContain("JOIN user_settings us ON us.user_id = ul.user_id");
    expect(push).toContain("us.safety_alert_radius_miles BETWEEN 1 AND 10");
    expect(push).toContain('status: "corroborated"');
    expect(push).toContain("never delivered to a member or contact");
    const governedDelivery = push.slice(push.indexOf("export async function sendCorroboratedPoliceIceAlert"), push.indexOf("export async function sendAlertPushToNearbyUsers"));
    expect(governedDelivery).not.toContain("saved_places");
    expect(governedDelivery).not.toContain("location_shares");
    expect(governedDelivery).not.toMatch(/data:\s*\{[\s\S]*?(latitude|longitude)/);
  });
});
