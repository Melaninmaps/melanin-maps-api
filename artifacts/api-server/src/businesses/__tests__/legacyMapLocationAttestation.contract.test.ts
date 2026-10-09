import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync(new URL("../registerDocumentedDiscoveryReviewRoutes.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../lib/startup-migrations.ts", import.meta.url), "utf8");

describe("legacy map location restoration contract", () => {
  it("uses an additive immutable attestation and append-only state events", () => {
    const start = migration.indexOf('name: "business_legacy_map_location_attestations_v1"');
    const end = migration.indexOf('name: "founder_source_presence_publication_v1"', start);
    const section = migration.slice(start, end);
    expect(section).toContain("CREATE TABLE IF NOT EXISTS business_legacy_map_location_attestations");
    expect(section).toContain("CREATE TABLE IF NOT EXISTS business_legacy_map_location_attestation_events");
    expect(section).toContain("historical_baseline_sha = '3258408f397dc6bb795c6f7da78570d587f25c58'");
    expect(section).toContain("receipt_gate_sha = '0ca51e2cc47997a523efb850bd56b850bb050568'");
    expect(section).toContain("business_legacy_map_location_attestations_immutable");
    expect(section).toContain("business_legacy_map_location_attestation_events_immutable");
    expect(section).not.toMatch(/\bUPDATE\s+businesses\b/i);
    expect(section).not.toMatch(/\bDELETE\s+FROM\s+businesses\b/i);
  });

  it("requires current canonical eligibility and makes restoration snapshot-guarded", () => {
    const start = route.indexOf('"/api/admin/businesses/:id/legacy-map-location-attestation"');
    const end = route.indexOf('\n  });\n}', start);
    const section = route.slice(start, end);
    expect(section).toContain("public.public_businesses");
    expect(section).toContain("DOCUMENTED_DISCOVERY_POLICY_VERSION");
    expect(section).toContain("legacyMapLocationSnapshotMatchesCurrent");
    expect(section).toContain("manifest_row_checksum");
    expect(section).not.toMatch(/\bUPDATE\s+businesses\b/i);
    expect(section).not.toMatch(/\bUPDATE\s+business_discovery_eligibility\b/i);
  });

  it("supports append-only revocation and guarded restoration without a record overwrite", () => {
    const start = route.indexOf('"/api/admin/businesses/:id/legacy-map-location-attestation/state"');
    const end = route.indexOf('\n  });\n}', start);
    const section = route.slice(start, end);
    expect(section).toContain('action === "revoke"');
    expect(section).toContain('action === "restore"');
    expect(section).toContain("business_legacy_map_location_attestation_events");
    expect(section).toContain("The original legacy location snapshot no longer matches");
    expect(section).not.toMatch(/\bUPDATE\s+businesses\b/i);
  });
});
