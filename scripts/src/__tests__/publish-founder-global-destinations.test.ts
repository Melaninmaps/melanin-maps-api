import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  destinationFromCandidate,
  exactCoordinate,
  isoCountryCode,
  safeExternalUrl,
  stableUuid,
} from "../publish-founder-global-destinations";

const MANIFEST = resolve(
  import.meta.dirname,
  "../../../data/founder-imports/2026-09-05-cumulative-content-global/cumulative-content-global-candidates.jsonl",
);
const MANIFEST_SHA256 = "6f1e686856eb79e45add03f2208ac836167cde7d5ca69ea99f4464eeae9169a8";

type ManifestRow = {
  sourceRow: number;
  name: string;
  city: string;
  state: string | null;
  category: string | null;
  targetKind: string;
  status: string;
  sourceUrl: string | null;
  rawRecord: Record<string, unknown>;
};

function manifestRows(): ManifestRow[] {
  const content = readFileSync(MANIFEST, "utf8");
  expect(createHash("sha256").update(content).digest("hex")).toBe(MANIFEST_SHA256);
  return content.trim().split("\n").map((line) => JSON.parse(line) as ManifestRow);
}

function asCandidate(row: ManifestRow): any {
  return {
    id: stableUuid(`candidate:${row.sourceRow}`),
    batch_id: stableUuid("batch"),
    source_row: row.sourceRow,
    name: row.name,
    city: row.city,
    state: row.state,
    category: row.category,
    status: row.status,
    raw_record: row.rawRecord,
    source_url: row.sourceUrl,
  };
}

describe("global travel destination publication policy", () => {
  it("selects exactly the 545 coordinate-backed travel destinations from the immutable manifest", () => {
    const selected = manifestRows().filter((row) =>
      row.targetKind === "manual_review"
      && row.category === "Travel Destination"
      && row.rawRecord.latitude != null
      && row.rawRecord.longitude != null,
    );
    expect(selected).toHaveLength(545);
    const countryErrors = new Set<string>();
    const mapped = selected.flatMap((row) => {
      try {
        return [destinationFromCandidate(asCandidate(row))];
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("UNKNOWN_DESTINATION_COUNTRY:")) {
          countryErrors.add(error.message.replace("UNKNOWN_DESTINATION_COUNTRY:", ""));
          return [];
        }
        throw error;
      }
    });
    expect([...countryErrors]).toEqual([]);
    expect(mapped).toHaveLength(545);
    expect(new Set(mapped.map((row) => row.id)).size).toBe(545);
    expect(new Set(mapped.map((row) => row.slug)).size).toBe(545);
    // Twenty-seven related district/heritage/reference records intentionally
    // share a supplied city or regional planning node. Never jitter them into
    // fabricated precision merely to make the points appear unique.
    expect(new Set(mapped.map((row) => `${row.latitude}|${row.longitude}`)).size).toBe(518);
    expect(mapped.every((row) => row.latitude !== 0 || row.longitude !== 0)).toBe(true);
    expect(mapped.every((row) => /^[A-Z]{2}$/.test(row.countryCode))).toBe(true);
    expect(mapped.every((row) => row.summary.includes("Planning reference only"))).toBe(true);
  });

  it("maps nonstandard workbook country labels to stable ISO region codes", () => {
    expect(isoCountryCode("The Gambia")).toBe("GM");
    expect(isoCountryCode("Côte d'Ivoire")).toBe("CI");
    expect(isoCountryCode("Türkiye")).toBe("TR");
    expect(isoCountryCode("Federated States of Micronesia")).toBe("FM");
    expect(isoCountryCode("Bonaire")).toBe("BQ");
    expect(isoCountryCode("Saba")).toBe("BQ");
    expect(isoCountryCode("Sint Eustatius")).toBe("BQ");
    expect(isoCountryCode("Saint Barthélemy")).toBe("BL");
    expect(isoCountryCode("Réunion")).toBe("RE");
    expect(isoCountryCode("Sao Tome and Principe")).toBe("ST");
  });

  it("accepts valid Equator or prime-meridian points but rejects Null Island and out-of-range coordinates", () => {
    expect(exactCoordinate(0, -78.4)).toEqual({ latitude: 0, longitude: -78.4 });
    expect(exactCoordinate(51.4, 0)).toEqual({ latitude: 51.4, longitude: 0 });
    expect(() => exactCoordinate(0, 0)).toThrow("INVALID_DESTINATION_COORDINATES");
    expect(() => exactCoordinate(91, 12)).toThrow("INVALID_DESTINATION_COORDINATES");
    expect(() => exactCoordinate(12, -181)).toThrow("INVALID_DESTINATION_COORDINATES");
  });

  it("accepts ordinary public evidence links and rejects local, credentialed, and unsafe URLs", () => {
    expect(safeExternalUrl("https://travel.example.org/place")).toBe("https://travel.example.org/place");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("https://user:secret@example.org/place")).toBeNull();
    expect(safeExternalUrl("http://localhost/internal")).toBeNull();
    expect(safeExternalUrl("http://127.0.0.1/internal")).toBeNull();
    expect(safeExternalUrl("http://10.2.3.4/internal")).toBeNull();
    expect(safeExternalUrl("http://169.254.169.254/latest/meta-data")).toBeNull();
    expect(safeExternalUrl("http://192.168.1.10/internal")).toBeNull();
    expect(safeExternalUrl("http://[::1]/internal")).toBeNull();
    expect(safeExternalUrl("http://[::ffff:127.0.0.1]/internal")).toBeNull();
    expect(safeExternalUrl("http://[::ffff:10.2.3.4]/internal")).toBeNull();
    expect(safeExternalUrl("http://[fc00::1]/internal")).toBeNull();
    expect(safeExternalUrl("http://[fe80::1]/internal")).toBeNull();
    expect(safeExternalUrl("http://[ff02::1]/internal")).toBeNull();
    expect(safeExternalUrl("http://[2001:db8::1]/internal")).toBeNull();
    expect(safeExternalUrl("http://[100::1]/internal")).toBeNull();
    expect(safeExternalUrl("http://[100:0:0:1::1]/internal")).toBeNull();
    expect(safeExternalUrl("https://[2606:4700:4700::1111]/dns-query")).toBeNull();
  });

  it("produces deterministic destination IDs and source-row-scoped slugs", () => {
    const row = manifestRows().find((candidate) => candidate.sourceRow === 3393);
    expect(row).toBeDefined();
    const first = destinationFromCandidate(asCandidate(row!));
    const second = destinationFromCandidate(asCandidate(row!));
    expect(first.id).toBe(second.id);
    expect(first.slug).toBe(second.slug);
    expect(first.slug).toContain("3393");
    expect(first.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("destination publisher database boundary", () => {
  const source = readFileSync(resolve(import.meta.dirname, "../publish-founder-global-destinations.ts"), "utf8");

  it("writes only travel_destination map entities and declares zero business creation", () => {
    expect(source).toContain("'travel_destination'");
    expect(source).toContain("businessListingsCreated:0");
    expect(source).not.toMatch(/INSERT INTO\s+businesses/i);
  });

  it("is staging-only, checksum-locked, transactional, and fail-closed on exact postconditions", () => {
    expect(source).toContain("assertLocalDirectoryStagingFromProcess()");
    expect(source).toContain(MANIFEST_SHA256);
    expect(source).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(source).toContain("pg_advisory_xact_lock");
    expect(source).toContain("GLOBAL_DESTINATION_COUNT_MISMATCH");
    expect(source).toContain("GLOBAL_DESTINATION_POSTCONDITION_FAILED");
    expect(source).toContain("updated.rowCount !== EXPECTED_DESTINATIONS");
  });

  it("uses audited map_entity publication records rather than business publication records", () => {
    expect(source).toContain("'map_entity'");
    expect(source).toContain("published_record_type='map_entity'");
    expect(source).toContain("published_record_id=d.id::text");
    expect(source).toContain("verifiedBusinessLocation',false");
    expect(source.match(/p\.batch_id=d\.batch_id/g)).toHaveLength(2);
    expect(source).toContain("idempotency_key=EXCLUDED.idempotency_key");
    expect(source).toContain("v.payload_hash=d.payload_hash");
  });
});
