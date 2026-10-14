import { describe, expect, it } from "vitest";
import {
  MAX_FAMILY_IMPACT_LOCATION_AGE_MS,
  classifyFamilyImpact,
  familyImpactDisclosure,
} from "../familyImpactIntelligence";

describe("family impact intelligence", () => {
  const now = new Date("2026-10-12T12:00:00.000Z");
  const boundary = {
    kind: "polygon" as const,
    coordinates: [[-75.18, 39.94], [-75.14, 39.94], [-75.14, 39.97], [-75.18, 39.97]] as const,
  };

  it("uses a fresh explicitly authorized point only inside the service boundary", () => {
    expect(classifyFamilyImpact(boundary, {
      latitude: 39.9526, longitude: -75.1652, capturedAt: now, accuracyMeters: 25,
    }, { now })).toEqual({ status: "potentially_affected", reason: "inside_boundary" });
    expect(classifyFamilyImpact(boundary, {
      latitude: 39.90, longitude: -75.25, capturedAt: now, accuracyMeters: 25,
    }, { now })).toEqual({ status: "outside_reported_area", reason: "outside_boundary" });
  });

  it("treats boundary uncertainty as potentially affected and never calls it safe", () => {
    expect(classifyFamilyImpact(boundary, {
      latitude: 39.94001, longitude: -75.165, capturedAt: now, accuracyMeters: 80,
    }, { now })).toEqual({ status: "potentially_affected", reason: "inside_boundary" });
    const edge = classifyFamilyImpact(boundary, {
      latitude: 39.9397, longitude: -75.165, capturedAt: now, accuracyMeters: 80,
    }, { now });
    expect(edge.status).toBe("potentially_affected");
    expect(edge.reason).toBe("boundary_uncertainty");
  });

  it("fails closed for stale, missing, or future location information", () => {
    for (const location of [
      null,
      { latitude: 39.95, longitude: -75.16, capturedAt: new Date(now.getTime() - MAX_FAMILY_IMPACT_LOCATION_AGE_MS - 1), accuracyMeters: 10 },
      { latitude: 39.95, longitude: -75.16, capturedAt: new Date(now.getTime() + 1), accuracyMeters: 10 },
    ]) {
      expect(classifyFamilyImpact(boundary, location, { now })).toEqual({ status: "location_unknown", reason: "stale_or_missing_location" });
    }
  });

  it("supports county and warning-zone classifications without requiring a coordinate", () => {
    expect(classifyFamilyImpact({ kind: "county", countyCode: "42091" }, {
      latitude: null, longitude: null, countyCode: "42091", capturedAt: now, accuracyMeters: null,
    }, { now }).status).toBe("potentially_affected");
    expect(classifyFamilyImpact({ kind: "warning_zone", warningZone: "PAZ071" }, {
      latitude: null, longitude: null, warningZone: "PAZ072", capturedAt: now, accuracyMeters: null,
    }, { now }).status).toBe("outside_reported_area");
  });

  it("requires an explicit member confirmation before reporting safety", () => {
    const safe = classifyFamilyImpact(boundary, null, { now, memberConfirmedSafe: true });
    expect(safe).toEqual({ status: "member_confirmed_safety", reason: "member_confirmed" });
    expect(familyImpactDisclosure("outside_reported_area")).toMatch(/does not confirm/i);
    expect(familyImpactDisclosure("location_unknown")).toMatch(/unknown/i);
  });
});
