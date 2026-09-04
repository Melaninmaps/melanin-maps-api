import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { ensureRequiredSafetyReportSchema } from "../safety/ensureSafetyReportSchema";
import { projectApprovedIncident } from "../safety/approvedIncidentAlerts";
import { updateBusinessSafetyRating } from "../safety/businessSafetyRating";
import {
  getCachedProximityWarnings,
  invalidateProximityWarningCache,
  setCachedProximityWarnings,
} from "../safety/proximityWarningCache";
import {
  normalizeIncidentLocation,
  normalizePoliceEncounterType,
  normalizeReportTarget,
  reportMustBeAnonymous,
} from "../safety/reportContract";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("safety report location and privacy contract", () => {
  it("normalizes both modern mobile and legacy website Police/ICE subtype values", () => {
    expect(normalizePoliceEncounterType("ice_activity")).toBe("ice_activity");
    expect(normalizePoliceEncounterType("ICE Activity")).toBe("ice_activity");
    expect(normalizePoliceEncounterType("Police Stop/Questioning")).toBe("police_stop");
    expect(normalizePoliceEncounterType("Excessive Force/Misconduct")).toBe("excessive_force");
    expect(normalizePoliceEncounterType("unknown type")).toBeNull();
  });

  it("stores a coarse selected incident area without accepting coordinates", () => {
    expect(normalizeIncidentLocation({
      incidentLocation: {
        city: "Philadelphia, PA",
        area: "Germantown",
        source: "selected_place",
        precision: "exact",
        latitude: 40.01,
        longitude: -75.17,
      },
    }, { sensitive: true })).toEqual({
      city: "Philadelphia",
      region: "PA",
      area: null,
      source: "selected_place",
      precision: "city",
      label: "Philadelphia, PA",
    });
    expect(normalizeIncidentLocation({
      incidentLocation: {
        city: "123 Germantown Ave, Philadelphia, PA",
        area: "Exact storefront",
        source: "selected_place",
      },
    }, { sensitive: true })).toMatchObject({
      city: "Philadelphia",
      region: "PA",
      area: null,
      label: "Philadelphia, PA",
    });
  });

  it("adapts legacy area, city, state text without mistaking the state for the city", () => {
    expect(normalizeIncidentLocation(
      { targetName: "123 Germantown Ave, Philadelphia, PA" },
      { sensitive: true },
    )).toEqual({
      city: "Philadelphia",
      region: "PA",
      area: null,
      source: "legacy_text",
      precision: "unknown",
      label: "Philadelphia, PA",
    });
    expect(normalizeIncidentLocation({ targetName: "Richmond" }, { sensitive: false })).toMatchObject({
      city: "Richmond",
      region: null,
      area: null,
      precision: "unknown",
    });
    expect(normalizeIncidentLocation({ targetName: "Philadelphia, Pennsylvania" }, { sensitive: false })).toMatchObject({
      city: "Philadelphia",
      region: "PA",
    });
  });

  it("forces Police/ICE and discrimination reports anonymous", () => {
    expect(reportMustBeAnonymous("police")).toBe(true);
    expect(reportMustBeAnonymous("discrimination")).toBe(true);
    expect(reportMustBeAnonymous("resource")).toBe(false);
  });

  it("strips a crafted business target from every sensitive report", () => {
    expect(normalizeReportTarget("business", "business-with-public-address", true)).toEqual({
      targetType: "neighborhood",
      targetId: null,
    });
    expect(normalizeReportTarget("business", "ordinary-business", false)).toEqual({
      targetType: "business",
      targetId: "ordinary-business",
    });
  });

  it("fails readiness when the required safety columns cannot be verified", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ column_name: "encounter_type" }] });
    await expect(ensureRequiredSafetyReportSchema({ query } as never)).rejects.toThrow(
      "Required safety report schema is incomplete",
    );
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("requires the region-scoped incident schema before accepting traffic", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          "encounter_type",
          "incident_city",
          "incident_region",
          "incident_area",
          "incident_location_source",
          "incident_location_precision",
        ].map((column_name) => ({ column_name })),
      })
      .mockResolvedValueOnce({ rows: [] });
    await expect(ensureRequiredSafetyReportSchema({ query } as never)).rejects.toThrow(
      "Required safety incident schema is incomplete: region",
    );
    expect(query).toHaveBeenCalledTimes(3);
  });

  it.each([2, 0])("resolves an active incident when approved evidence falls to %s", async (count) => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: String(count), severity: count ? "high" : null }] })
      .mockResolvedValueOnce({ rows: [{ id: "incident-1", notifications_sent: true }] })
      .mockResolvedValueOnce({ rows: [] });
    const projection = await projectApprovedIncident({ query } as never, {
      city: "Richmond",
      region: "VA",
      category: "safety",
      area: null,
    });
    expect(projection).toBeNull();
    expect(query.mock.calls[3]?.[0]).toContain("status = 'resolved'");
    expect(query.mock.calls[3]?.[1]).toEqual([count, count ? "high" : null, "incident-1"]);
  });

  it("refreshes an existing incident with the ranked severity of approved evidence", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "3", severity: "critical" }] })
      .mockResolvedValueOnce({ rows: [{ id: "incident-1", notifications_sent: true }] })
      .mockResolvedValueOnce({ rows: [] });
    const projection = await projectApprovedIncident({ query } as never, {
      city: "Philadelphia",
      region: "PA",
      category: "safety",
      area: null,
    });
    expect(projection).toMatchObject({
      incidentId: "incident-1",
      reportCount: 3,
      severity: "critical",
      created: false,
      needsNotification: false,
    });
    expect(query.mock.calls[3]?.[1]).toEqual([3, "critical", "incident-1"]);
  });

  it("clears a cached public warning immediately when safety evidence changes", () => {
    const key = "39.953:-75.165:500";
    const payload = { warnings: [{ id: "warning-1" }], areaIncidents: [] };
    setCachedProximityWarnings(key, payload);
    expect(getCachedProximityWarnings(key)).toEqual(payload);
    invalidateProximityWarningCache();
    expect(getCachedProximityWarnings(key)).toBeNull();
  });

  it("restores independent experience evidence after approved report evidence falls below threshold", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ rating: "4.25" }] })
      .mockResolvedValueOnce({ rows: [] });
    await updateBusinessSafetyRating("business-1", { query } as never);
    expect(query.mock.calls[0]?.[0]).toContain("pg_advisory_xact_lock");
    expect(query.mock.calls[2]?.[0]).toContain("SET safety_rating = NULL");
    expect(query.mock.calls[4]?.[1]).toEqual(["4.25", "business-1"]);
  });

  it("keeps the route and mobile clients on the governed contract", () => {
    const route = source("../routes/reports.ts");
    const moderation = source("../routes/moderation.ts");
    const directions = source("../routes/directions.ts");
    const pushNotifications = source("../lib/pushNotifications.ts");
    const approvedAlerts = source("../safety/approvedIncidentAlerts.ts");
    const businessRating = source("../safety/businessSafetyRating.ts");
    const moderationService = source("../safety/moderateSafetyReport.ts");
    const proximityCache = source("../safety/proximityWarningCache.ts");
    const requiredSchema = source("../safety/ensureSafetyReportSchema.ts");
    const entrypoint = source("../index.ts");
    const police = source("../../../mobile/app/report-police.tsx");
    const general = source("../../../mobile/app/report-safety.tsx");

    expect(route).toContain("legacyEncounterType ? \"police\" : category");
    expect(route).toContain("reportMustBeAnonymous(resolvedCategory as string)");
    expect(route).toContain("targetId: sensitive ? null : report.targetId");
    expect(route).toContain("normalizeReportTarget(targetType, targetId, sensitiveReport)");
    expect(route).toContain("incidentLocationSource: incidentLocation.source");
    expect(route).toContain("encounterType: resolvedEncounterType");
    expect(requiredSchema).toContain("ADD COLUMN IF NOT EXISTS incident_location_source");
    expect(requiredSchema).toContain("ADD COLUMN IF NOT EXISTS region");
    expect(requiredSchema).toContain("safety_incidents_region_identity_idx");
    expect(requiredSchema).toContain("Required safety report schema is incomplete");
    expect(requiredSchema).not.toMatch(/DELETE FROM safety_reports|TRUNCATE safety_reports/i);
    expect(entrypoint.indexOf("await ensureRequiredSafetyReportSchema(pool)")).toBeLessThan(entrypoint.indexOf("app.listen(port"));
    expect(route).toContain('eq(safetyReportsTable.status, "approved")');
    expect(route).not.toContain("await checkAndTriggerIncident(");
    expect(route).toContain("sr.status = 'approved'");
    expect(route).toContain('const allowed = ["pending", "approved", "rejected"]');
    expect(route).not.toContain('status === "reviewed" || status === "actioned"');
    expect(moderation).toContain("await moderateSafetyReport({");
    expect(approvedAlerts).toContain("AND status = 'approved'");
    expect(approvedAlerts).toContain("LOWER(incident_region) = LOWER($2)");
    expect(approvedAlerts).toContain("CASE MAX(CASE severity");
    expect(approvedAlerts).toContain("pg_advisory_xact_lock");
    expect(approvedAlerts).toContain("status = 'resolved'");
    expect(approvedAlerts).toContain("sendPushToBusinessOwnersByCity(input.city, input.region");
    expect(businessRating).toContain("AND status = 'approved'");
    expect(businessRating).toContain("business-safety-rating|");
    expect(businessRating).toContain("pg_advisory_xact_lock");
    expect(businessRating).toContain("SET safety_rating = NULL");
    expect(businessRating).toContain("FROM business_safety_submissions");
    expect(businessRating).not.toContain("status != 'dismissed'");
    expect(route).toContain("LOWER(sr.incident_region) = LOWER(si.region)");
    expect(route).toContain("CASE MAX(CASE sr.severity");
    expect(route).toContain("await moderateSafetyReport({");
    expect(route).toContain("invalidateProximityWarningCache()");
    expect(moderationService).toContain('await client.query("BEGIN")');
    expect(moderationService).toContain("await updateBusinessSafetyRating(report.targetId, client)");
    expect(moderationService).toContain("await projectApprovedIncident(client");
    expect(moderationService).toContain('await client.query("COMMIT")');
    expect(moderationService).toContain("invalidateProximityWarningCache()");
    expect(moderationService).toContain('await client.query("ROLLBACK")');
    expect(proximityCache).toContain("proximityCache.clear()");
    expect(directions).toContain("AND sr.status = 'approved'");
    expect(directions).not.toContain("AND sr.status != 'rejected'");
    expect(pushNotifications).toContain("recipientCount: deliveredCount");
    expect(pushNotifications).toContain("delivered: deliveredCount > 0");
    expect(pushNotifications).toContain("normalizeHomeState(business.state) === canonicalRegion");

    expect(police).toContain('category: "police"');
    expect(police).toContain("encounterType: form.encounterType");
    expect(police).toContain("isAnonymous: true");
    expect(police).not.toContain("category: form.encounterType");
    expect(police).not.toMatch(/JSON\.stringify\([\s\S]{0,600}(latitude|longitude)/);

    expect(general).toContain("Use current location for this incident");
    expect(general).toContain('locationSource: "manual_area"');
    expect(general).not.toContain("Auto-detect city from GPS on mount");
    expect(general).not.toMatch(/JSON\.stringify\([\s\S]{0,600}(latitude|longitude)/);
  });
});
