import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const startup = readFileSync(fileURLToPath(new URL("../index.ts", import.meta.url)), "utf8");
const migrations = readFileSync(fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)), "utf8");

describe("legacy map location schema bootstrap", () => {
  it("requires the public map predicate's schema to be pre-provisioned in explicit release mode", () => {
    const start = migrations.indexOf("export async function ensureLegacyMapLocationAttestationSchema");
    const end = migrations.indexOf("export async function runStartupMigrations", start);
    const helper = migrations.slice(start, end);
    const strictGate = startup.indexOf("await assertExplicitFeatureReleaseSchema(process.env, logger)");
    const listen = startup.indexOf("const server = host");

    expect(start).toBeGreaterThan(-1);
    expect(helper).toContain('"business_legacy_map_location_attestations_v1"');
    expect(helper).toContain("await pool.query(migration.sql)");
    expect(helper).toContain("business_legacy_map_location_attestations");
    expect(helper).toContain("business_legacy_map_location_attestation_events");
    expect(helper).not.toContain("INSERT INTO business_legacy_map_location_attestations");
    expect(strictGate).toBeGreaterThan(-1);
    expect(strictGate).toBeLessThan(listen);
    expect(startup).toContain("catalog-only startup gate passed");
  });
});
