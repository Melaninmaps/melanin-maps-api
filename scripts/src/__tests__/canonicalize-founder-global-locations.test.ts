import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  chooseWinner,
  dedupeKey,
  isUuid,
  normalizeCountry,
  parseCityRegion,
} from "../canonicalize-founder-global-locations";

const base = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Example Books",
  address: null,
  city: "Atlanta",
  state: "GA",
  country: "United States",
  status: "active",
  listing_status: "live_unclaimed",
  is_duplicate: false,
  permanently_hidden: false,
  website: null,
  source_url: null,
  created_at: "2026-09-05T00:00:00.000Z",
};

describe("founder global location canonicalization", () => {
  it("splits workbook city-area values into exact city and region fields", () => {
    expect(parseCityRegion("Los Angeles, CA")).toEqual({ city: "Los Angeles", state: "CA" });
    expect(parseCityRegion("Toronto, ON")).toEqual({ city: "Toronto", state: "ON" });
    expect(parseCityRegion("Washington, D.C.")).toBeNull();
  });

  it("builds the same canonical no-location identity regardless of punctuation", () => {
    expect(dedupeKey({ ...base, name: "44th & 3rd Bookseller", city: "Atlanta", state: "GA" }))
      .toBe("44th 3rd bookseller|atlanta|ga|no-location");
  });

  it("chooses the best-evidenced public collision and then the oldest stable row", () => {
    const older = { ...base, id: "00000000-0000-4000-8000-000000000002" };
    const linked = { ...base, id: "00000000-0000-4000-8000-000000000003", source_url: "https://example.com", created_at: "2026-09-06T00:00:00.000Z" };
    expect(chooseWinner([older, linked])?.id).toBe(linked.id);
    expect(chooseWinner([{ ...older }, { ...older, id: "00000000-0000-4000-8000-000000000004" }])?.id).toBe(older.id);
  });

  it("matches explicit country aliases but rejects unsafe canonical target IDs", () => {
    expect(normalizeCountry("USA")).toBe("US");
    expect(normalizeCountry("United States")).toBe("US");
    expect(normalizeCountry("UK")).toBe("GB");
    expect(normalizeCountry("Canada")).toBe("CA");
    expect(normalizeCountry("Unknown")).toBe("");
    expect(normalizeCountry("Zimbabwe / Zambia / Botswana")).toBe("");
    expect(isUuid("00000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isUuid("legacy-business-id")).toBe(false);
  });

  it("locks and verifies the exact cohort before planning and rewires every operational record pointer", () => {
    const source = readFileSync(resolve(import.meta.dirname, "../canonicalize-founder-global-locations.ts"), "utf8");
    const begin = source.indexOf('BEGIN ISOLATION LEVEL SERIALIZABLE');
    const advisory = source.indexOf("pg_advisory_xact_lock", begin);
    const plan = source.indexOf("buildLockedPlan(client)", advisory);
    expect(begin).toBeGreaterThan(-1);
    expect(advisory).toBeGreaterThan(begin);
    expect(plan).toBeGreaterThan(advisory);
    expect(source).toContain("SOURCE_ROW_COUNT = 7_315");
    expect(source).toContain("EXPECTED_REPAIR_ROWS = 903");
    expect(source).toContain("EXPECTED_COLLISIONS = 273");
    expect(source).toContain("EXPECTED_CANONICAL_UPDATES = 630");
    expect(source).toContain("p.batch_id=c.batch_id");
    expect(source).toContain("p.record_type='business'");
    expect(source).toContain("c.target_kind='business'");
    expect(source).toContain("UPDATE directory_import_publications");
    expect(source).toContain("UPDATE directory_import_decision_events");
    expect(source).toContain("UPDATE business_publication_identities");
    expect(source).toContain("LOCATION_REPAIR_DANGLING_CANONICAL_REFERENCE");
  });

  it("snapshots exact original pointers before rewiring and updates candidates directly from that snapshot", () => {
    const source = readFileSync(resolve(import.meta.dirname, "../canonicalize-founder-global-locations.ts"), "utf8");
    const snapshot = source.indexOf("CREATE TEMP TABLE mwm_global_location_pointer_snapshot");
    const candidateUpdate = source.indexOf("UPDATE directory_import_candidates c", snapshot);
    const publicationUpdate = source.indexOf("UPDATE directory_import_publications p", candidateUpdate);
    expect(snapshot).toBeGreaterThan(-1);
    expect(candidateUpdate).toBeGreaterThan(snapshot);
    expect(publicationUpdate).toBeGreaterThan(candidateUpdate);
    expect(source).toContain("c.id=s.candidate_id");
    expect(source).toContain("p.id=s.publication_id");
    expect(source).not.toContain("r.new_id=p.record_id OR r.target_id=p.record_id");
    expect(source).toContain("LOCATION_REPAIR_UNEXPECTED_POINTERS");
  });

  it("aggregates many-to-one target evidence deterministically and validates both unique indexes", () => {
    const source = readFileSync(resolve(import.meta.dirname, "../canonicalize-founder-global-locations.ts"), "utf8");
    expect(source).toContain("mwm_global_location_merge_aggregate");
    expect(source).toContain("SELECT DISTINCT item FROM evidence_items");
    expect(source).toContain("ORDER BY item::text");
    expect(source).toContain("businesses_active_dedupe_key_unique");
    expect(source).toContain("businesses_canonical_dedupe_key_unique");
    expect(source).toContain("i.indisunique,i.indisvalid,i.indisready");
    expect(source).toContain("predicate_md5");
    expect(source).toContain("b6c7b82a358f47453d8dd3b8eb783dbf");
    expect(source).toContain("a35be5564d3fd29ddd97c96989ec00fb");
    expect(source).toContain("LOCATION_REPAIR_DUAL_INDEX_CONFLICT");
  });

  it("requires exact persisted 903/273/630 states and every intended pointer table", () => {
    const source = readFileSync(resolve(import.meta.dirname, "../canonicalize-founder-global-locations.ts"), "utf8");
    expect(source).toContain("LOCATION_REPAIR_CANDIDATE_UPDATE_MISMATCH");
    expect(source).toContain("LOCATION_REPAIR_CANONICAL_UPDATE_MISMATCH");
    expect(source).toContain("LOCATION_REPAIR_DUPLICATE_UPDATE_MISMATCH");
    expect(source).toContain("LOCATION_REPAIR_PUBLICATION_UPDATE_MISMATCH");
    expect(source).toContain("LOCATION_REPAIR_EVENT_UPDATE_MISMATCH");
    expect(source).toContain("LOCATION_REPAIR_IDENTITY_UPDATE_MISMATCH");
    expect(source).toContain("LOCATION_REPAIR_PERSISTED_POSTCONDITION_FAILED");
    expect(source).toContain("Number(result.collisions) !== EXPECTED_COLLISIONS");
    expect(source).toContain("Number(result.canonical_updates) !== EXPECTED_CANONICAL_UPDATES");
    expect(source).toContain("public.business_record_is_public");
  });
});
