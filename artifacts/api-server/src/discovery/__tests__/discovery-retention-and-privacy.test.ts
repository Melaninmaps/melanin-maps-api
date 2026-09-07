import { describe, expect, it, vi } from "vitest";
import { discoveryEventV1Schema } from "@workspace/api-zod";
import { runDiscoveryRetentionSweep } from "../discoveryRetention";
import { readPrivacySafeDiscoveryAggregates } from "../postgresFlywheelRepository";

describe("Discovery V1 privacy operations", () => {
  const event = {
    schemaVersion: "1" as const, eventId: "00000000-0000-4000-8000-000000000003",
    idempotencyKey: "privacy-key", eventName: "result_opened" as const,
    consent: { searchImprovement: true, version: "v1" }, surface: "map" as const,
    platform: "ios" as const, entryPoint: "result_card" as const, appVersion: "106",
  };

  it("rejects raw analytics dimensions, nested filters, coordinate-like filters, and unknown keys", () => {
    expect(discoveryEventV1Schema.safeParse({ ...event, normalizedIntent: "where is a safe place near 1 Main St?" }).success).toBe(false);
    expect(discoveryEventV1Schema.safeParse({ ...event, entryPoint: "1 Main Street" }).success).toBe(false);
    expect(discoveryEventV1Schema.safeParse({ ...event, filters: { categoryIds: [{ latitude: 1 }] } }).success).toBe(false);
    expect(discoveryEventV1Schema.safeParse({ ...event, filters: { coordinates: ["33.75,-84.39"] } }).success).toBe(false);
    expect(discoveryEventV1Schema.safeParse({ ...event, filters: { categoryIds: ["private-safety-question"] } }).success).toBe(false);
    expect(discoveryEventV1Schema.safeParse({ ...event, filters: { ownershipClaims: ["attacker-owned"] } }).success).toBe(false);
  });

  it("persists cleanup success state so restart and idle cleanup are observable", async () => {
    const db = { query: vi.fn()
      .mockResolvedValueOnce({ rows: [] }) // job start
      .mockResolvedValueOnce({ rows: [], rowCount: 3 }) // delete
      .mockResolvedValueOnce({ rows: [] }) }; // job success
    await expect(runDiscoveryRetentionSweep(db)).resolves.toBe(3);
    expect(db.query.mock.calls.map(([sql]) => String(sql))).toEqual(
      expect.arrayContaining([expect.stringContaining("discovery_retention_jobs"), expect.stringContaining("DELETE FROM discovery_events_v1")]),
    );
  });

  it("records a durable failure state when cleanup fails", async () => {
    const db = { query: vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce({ rows: [] }) };
    await expect(runDiscoveryRetentionSweep(db)).rejects.toThrow("database unavailable");
    expect(String(db.query.mock.calls[2]?.[0])).toContain("last_failed_at");
  });

  it("reads only k-anonymous aggregate cells", async () => {
    const db = { query: vi.fn().mockResolvedValue({ rows: [{ day: "2026-08-01", surface: "map", action: "result_opened", record_type: "business", count: 5 }] }) };
    await expect(readPrivacySafeDiscoveryAggregates(db, "2026-08-01", "2026-08-31", 1)).resolves.toEqual([
      { day: "2026-08-01", surface: "map", action: "result_opened", recordType: "business", count: 5 },
    ]);
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain("HAVING COUNT(*) >= $3");
    expect(sql).not.toMatch(/member_id|request_id|result_id|normalized_intent|structured_filters|latitude|longitude/i);
    expect(params[2]).toBe(5);
  });
});