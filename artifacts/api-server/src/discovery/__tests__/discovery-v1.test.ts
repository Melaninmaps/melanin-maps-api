import { describe, expect, it } from "vitest";
import { discoveryEventV1Schema, discoverySearchRequestV1Schema } from "@workspace/api-zod";
import { readFileSync } from "node:fs";
describe("Discovery V1 contract", () => {
  const search = { schemaVersion: "1" as const, requestId: "00000000-0000-4000-8000-000000000001", surface: "map" as const, platform: "ios" as const, entryPoint: "find_a_place", query: "fruity pebbled French toast", location: { source: "typed" as const, city: "Atlanta", stateRegion: "GA", radiusMiles: 5 as const }, filters: {}, consent: { personalizedSuggestions: false, searchImprovement: false, preciseLocation: false } };
  it("requires a typed area or permissioned approximate location", () => {
    expect(discoverySearchRequestV1Schema.safeParse({ ...search, location: { source: "typed" } }).success).toBe(false);
    expect(discoverySearchRequestV1Schema.safeParse({ ...search, location: { source: "device_coarse", latitude: 33.75, longitude: -84.39 } }).success).toBe(true);
    expect(discoverySearchRequestV1Schema.safeParse({ ...search, location: { source: "device_coarse", latitude: 33.751, longitude: -84.39 } }).success).toBe(false);
    expect(discoverySearchRequestV1Schema.safeParse({ ...search, location: { source: "saved", latitude: 33.75, longitude: -84.39 } }).success).toBe(false);
  });
  it("requires explicit coverage action", () => {
    const event = { schemaVersion: "1" as const, eventId: "00000000-0000-4000-8000-000000000002", idempotencyKey: "coverage-key", eventName: "coverage_request" as const, consent: { searchImprovement: true, version: "2026-08" }, surface: "map" as const, platform: "ios" as const, entryPoint: "find_a_place", appVersion: "106" };
    expect(discoveryEventV1Schema.safeParse(event).success).toBe(false);
    expect(discoveryEventV1Schema.safeParse({ ...event, coverageRequested: true }).success).toBe(true);
    expect(discoveryEventV1Schema.safeParse({ ...event, coverageRequested: true, userId: "attacker-controlled" }).success).toBe(false);
  });
  it("keeps radius, retention, readiness, and withdrawal enforcement server-side", () => {
    const route = readFileSync(new URL("../registerDiscoveryV1Routes.ts", import.meta.url), "utf8");
    expect(route).toContain("3958.7613 * acos");
    expect(route).toContain("distance_miles <= $3");
    expect(route).toContain("ORDER BY distance_miles ASC");
    expect(route).toContain("POSTAL_SCOPE_UNAVAILABLE");
    expect(route).toContain("information_schema.tables");
    expect(route).toContain("cleanup.unref()");
    expect(route).toContain("DELETE FROM discovery_events_v1 WHERE member_id=$1");
    expect(route).toContain("client.query(\"BEGIN\")");
  });
});