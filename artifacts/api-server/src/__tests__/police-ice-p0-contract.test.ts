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
    expect(communityAlerts).toContain("Coordinate-based community alerts have been retired");
    expect(communityAlerts).toContain("type NOT IN ('police', 'ice', 'checkpoint')");
    expect(moderation).toContain("encounterType: report.encounterType");
    expect(push).toContain("FROM user_settings us");
    expect(push).toContain("JOIN LATERAL");
    expect(push).toContain("safety_alert_area_city");
    expect(push).toContain("safety_alert_area_state");
    expect(push).toContain("us.safety_alert_radius_miles BETWEEN 1 AND 10");
    expect(push).toContain('status: "corroborated"');
    expect(push).toContain("never delivered to a member or contact");
    const governedDelivery = push.slice(push.indexOf("export async function sendCorroboratedPoliceIceAlert"), push.indexOf("export async function sendPushToAllMembers"));
    expect(governedDelivery).not.toContain("saved_places");
    expect(governedDelivery).not.toContain("location_shares");
    expect(governedDelivery).not.toContain("user_locations");
    expect(governedDelivery).not.toMatch(/data:\s*\{[\s\S]*?(latitude|longitude)/);
    const settings = source("../routes/user-settings.ts");
    expect(settings).toContain("Choose and save a Safety Alert city and state before turning on Police or ICE alerts.");
    expect(settings).toContain("community_locations");
    expect(settings).toContain("neighborhood_name IS NULL");
  });

  it("defaults sensitive alert delivery off across schema and independent settings creation paths", () => {
    const settings = source("../routes/user-settings.ts");
    const users = source("../routes/users.ts");
    const kinfolk = source("../routes/kinfolk.ts");
    const schema = source("../../../../lib/db/src/schema/user-settings.ts");
    const fullSchema = source("../../railway-migration-full.sql");

    expect(settings).toContain("safetyAlertPolice: false");
    expect(settings).toContain("safetyAlertIce: false");
    expect(schema).toContain('boolean("safety_alert_police").notNull().default(false)');
    expect(schema).toContain('boolean("safety_alert_ice").notNull().default(false)');
    expect(fullSchema).toContain("safety_alert_police boolean DEFAULT false NOT NULL");
    expect(fullSchema).toContain("safety_alert_ice boolean DEFAULT false NOT NULL");
    expect(schema).toContain('varchar("safety_alert_area_city", { length: 100 })');
    expect(schema).toContain('varchar("safety_alert_area_state", { length: 2 })');
    expect(users).toContain("An unrelated official-alert preference must never create an");
    expect(kinfolk.match(/safetyAlertPolice: false/g)?.length).toBeGreaterThanOrEqual(3);
    expect(kinfolk.match(/safetyAlertIce: false/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
