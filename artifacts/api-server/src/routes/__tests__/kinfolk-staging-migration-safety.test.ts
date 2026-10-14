import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routesDir = dirname(fileURLToPath(import.meta.url));

/**
 * Ordered for manual, isolated-staging application only. These migrations are
 * intentionally unregistered at startup and this test rejects data operations,
 * replacement operations, and existing-column rewrites before a release review.
 */
const migrationOrder = [
  "20261014_cultural_passport_moments.sql",
  "20261014_cultural_journey_entries.sql",
  "20261014_cultural_journey_reflection_encryption.approval-required.sql",
  "20261014_kinfolk_behavioral_evidence_source_only.sql",
  "20261014_kinfolk_curiosity_lists.approval-required.sql",
  "20261014_kinfolk_private_availability_blocks.approval-required.sql",
  "20261014_kinfolk_trips.approval-required.sql",
  "20261014_kinfolk_trip_itinerary_entries.approval-required.sql",
  "20261014_kinfolk_trip_temporary_stays.approval-required.sql",
  "20261014_kinfolk_trip_flights_encryption.approval-required.sql",
  "20261014_business_cultural_teachings.approval-required.sql",
] as const;

function sql(name: string): string {
  return readFileSync(resolve(routesDir, "../../../migrations", name), "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

describe("isolated Kinfolk staging migration safety", () => {
  it("has one dependency-ordered additive-only migration inventory", () => {
    expect(migrationOrder).toHaveLength(11);
    expect(migrationOrder.indexOf("20261014_cultural_journey_entries.sql"))
      .toBeLessThan(migrationOrder.indexOf("20261014_cultural_journey_reflection_encryption.approval-required.sql"));
    expect(migrationOrder.indexOf("20261014_kinfolk_trips.approval-required.sql"))
      .toBeLessThan(migrationOrder.indexOf("20261014_kinfolk_trip_itinerary_entries.approval-required.sql"));
    expect(migrationOrder.indexOf("20261014_kinfolk_trips.approval-required.sql"))
      .toBeLessThan(migrationOrder.indexOf("20261014_kinfolk_trip_temporary_stays.approval-required.sql"));
    expect(migrationOrder.indexOf("20261014_kinfolk_trips.approval-required.sql"))
      .toBeLessThan(migrationOrder.indexOf("20261014_kinfolk_trip_flights_encryption.approval-required.sql"));
  });

  it("contains no data operation, destructive operation, existing-column rewrite, or replacement operation", () => {
    for (const name of migrationOrder) {
      const source = sql(name);
      // Some pre-existing additive files are intentionally standalone DDL; the
      // deployment runner applies this reviewed inventory one file at a time.
      expect(source.trim(), name).not.toHaveLength(0);
      expect(source, name).not.toMatch(/^\s*(?:DROP|TRUNCATE|DELETE|INSERT|COPY|MERGE)\b/im);
      expect(source, name).not.toMatch(/^\s*UPDATE\s+(?!OF\b)/im);
      expect(source, name).not.toMatch(/\bALTER\s+COLUMN\b/i);
      expect(source, name).not.toMatch(/\bCREATE\s+OR\s+REPLACE\b/i);
    }
  });

  it("preserves an existing trigger rather than replacing it and uses a short marker for unchanged legacy flight columns", () => {
    const cultural = sql("20261014_cultural_journey_reflection_encryption.approval-required.sql");
    const flights = sql("20261014_kinfolk_trip_flights_encryption.approval-required.sql");
    expect(cultural).toContain("existing cultural journey reflection guard is preserved");
    expect(cultural).toContain("CREATE FUNCTION cultural_journey_entries_require_encrypted_reflection_v1");
    expect(cultural).not.toMatch(/DROP\s+TRIGGER/i);
    expect(flights).toContain("existing Trip flight guard is preserved");
    expect(flights).toContain("CREATE FUNCTION travel_flights_no_new_plaintext_guard_v1");
    expect(flights).toContain("NEW.flight_number = '[private]'");
    expect(flights).not.toMatch(/ALTER\s+COLUMN|DROP\s+TRIGGER/i);
  });
});
