import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { plansFor, sourceRows, validCoordinates } from "../publish-source-backed-international-pins";
import { assertLocalDirectoryStagingFromProcess } from "../lib/local-directory-staging";

const SOURCE = fileURLToPath(new URL("../publish-source-backed-international-pins.ts", import.meta.url));
const sourceText = readFileSync(SOURCE, "utf8");

function databaseRow(id: string, name: string, city: string, country: string, sourceUrl: string) {
  return {
    id, name, city, country, address: null, postal_code: null, latitude: null, longitude: null,
    verified: false, unclaimed: true, owner_claim_status: "unclaimed", ownership_control_status: "unclaimed",
    verification_status: "not_requested", source_url: sourceUrl, data_source: "founder_directory_import",
    listing_status: "live_unclaimed", status: "active", enrichment_source: null, public_location_kind: null,
    is_public: true, candidate_ids: ["00000000-0000-4000-8000-000000000001"], publication_count: "1",
    canonical_count: "1", canonical_primary_count: "1", canonical_coordinate_count: "0",
  };
}

describe("source-backed international pin cohort", () => {
  it("locks exactly two strict source-backed candidates to immutable evidence", async () => {
    const rows = await sourceRows();
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.recordId)).size).toBe(2);
    expect(rows.every((row) => row.verificationStatus === "candidate_unverified")).toBe(true);
    expect(rows.every((row) => row.verifiedBusinessLocation === false)).toBe(true);
    expect(rows.every((row) => validCoordinates(row.latitude, row.longitude))).toBe(true);
    expect(rows.every((row) => row.evidenceKind === "business_specific_jsonld_exact_name_city_country")).toBe(true);
  });

  it("plans only public, unclaimed, unverified, blank-location records", async () => {
    const accepted = await sourceRows();
    const rows = accepted.map((row) => databaseRow(row.recordId, row.name, row.city, row.country, row.sourceUrl));
    expect(plansFor(accepted, rows as never).plans).toHaveLength(2);
    expect(() => plansFor(accepted, [{ ...rows[0], verified: true }, rows[1]] as never)).toThrow("DATABASE_CONTRACT");
    expect(() => plansFor(accepted, [{ ...rows[0], address: "Other address" }, rows[1]] as never)).toThrow("EXISTING_ADDRESS_CONFLICT");
    expect(() => plansFor(accepted, [{ ...rows[0], latitude: "1", longitude: null }, rows[1]] as never)).toThrow("PARTIAL_COORDINATE_CONFLICT");
  });

  it("treats exact prior application as idempotent but rejects changed coordinates", async () => {
    const accepted = await sourceRows();
    const rows = accepted.map((row) => ({
      ...databaseRow(row.recordId, row.name, row.city, row.country, row.sourceUrl),
      address: row.address, postal_code: row.postalCode, latitude: String(row.latitude), longitude: String(row.longitude),
      public_location_kind: "address", canonical_coordinate_count: "1",
    }));
    expect(plansFor(accepted, rows as never)).toMatchObject({ plans: [], alreadyPinned: 2 });
    expect(() => plansFor(accepted, [{ ...rows[0], longitude: "99" }, rows[1]] as never)).toThrow("EXISTING_LOCATION_CONFLICT");
  });

  it("uses a serializable locked transaction with exact non-overwrite and unverified postconditions", () => {
    for (const required of [
      "assertLocalDirectoryStagingFromProcess();", "BEGIN ISOLATION LEVEL SERIALIZABLE", "pg_advisory_xact_lock",
      "FOR UPDATE OF b", "FOR UPDATE OF l", "b.latitude IS NULL AND b.longitude IS NULL",
      "b.address IS NULL AND b.postal_code IS NULL", "b.verified=false", "b.claimed_owner_member_id IS NULL",
      "public.business_record_is_public(b.status,b.listing_status,b.is_duplicate,b.permanently_hidden,b.name,b.description,b.data_source,b.phone)",
      "INTERNATIONAL_PIN_PERSISTED_POSTCONDITION_FAILED",
    ]) expect(sourceText).toContain(required);
    expect(sourceText).not.toContain("verified=true");
    expect(sourceText).not.toContain("verified_at=NOW()");
  });

  it.skipIf(process.env.MWM_RUN_STAGING_DB_TESTS !== "1")("executes the visibility signature against isolated staging", async () => {
    assertLocalDirectoryStagingFromProcess();
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10_000 });
    try {
      const result = await pool.query<{ id: string; is_public: boolean }>(`SELECT b.id,
        public.business_record_is_public(b.status,b.listing_status,b.is_duplicate,b.permanently_hidden,b.name,b.description,b.data_source,b.phone) is_public
        FROM businesses b WHERE b.id=ANY($1::text[]) ORDER BY b.id`, [[
          "cfc3ddd4-7cfa-5786-805b-814e3e6f593d", "4fe3e0ec-a35e-5f64-a558-411bf495dc3c",
        ]]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows.every((row) => row.is_public)).toBe(true);
    } finally {
      await pool.end();
    }
  });
});
