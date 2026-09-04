import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { ensureRequiredSafetyReportSchema } from "../safety/ensureSafetyReportSchema";
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

  it("keeps the route and mobile clients on the governed contract", () => {
    const route = source("../routes/reports.ts");
    const moderation = source("../routes/moderation.ts");
    const directions = source("../routes/directions.ts");
    const pushNotifications = source("../lib/pushNotifications.ts");
    const approvedAlerts = source("../safety/approvedIncidentAlerts.ts");
    const businessRating = source("../safety/businessSafetyRating.ts");
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
    expect(requiredSchema).toContain("Required safety report schema is incomplete");
    expect(requiredSchema).not.toMatch(/DELETE FROM safety_reports|TRUNCATE safety_reports/i);
    expect(entrypoint.indexOf("await ensureRequiredSafetyReportSchema(pool)")).toBeLessThan(entrypoint.indexOf("app.listen(port"));
    expect(route).toContain('eq(safetyReportsTable.status, "approved")');
    expect(route).not.toContain("await checkAndTriggerIncident(");
    expect(route).toContain("sr.status = 'approved'");
    expect(route).toContain('const allowed = ["pending", "approved", "rejected"]');
    expect(route).not.toContain('status === "reviewed" || status === "actioned"');
    expect(moderation).toContain('if (status === "approved")');
    expect(moderation).toContain("await checkApprovedIncidentThreshold({");
    expect(approvedAlerts).toContain("AND status = 'approved'");
    expect(businessRating).toContain("AND status = 'approved'");
    expect(businessRating).not.toContain("status != 'dismissed'");
    expect(directions).toContain("AND sr.status = 'approved'");
    expect(directions).not.toContain("AND sr.status != 'rejected'");
    expect(pushNotifications).toContain("recipientCount: deliveredCount");
    expect(pushNotifications).toContain("delivered: deliveredCount > 0");

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
