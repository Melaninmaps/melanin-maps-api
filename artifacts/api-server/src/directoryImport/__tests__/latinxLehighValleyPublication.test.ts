import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  publishLatinxLehighValleyDirectory,
  resolveLatinxLehighValleyPins,
} from "../latinxLehighValleyPublication";
import {
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
  assertLatinxLehighValleyDirectoryDataset,
} from "../latinxLehighValleyDirectory";

describe("founder-authorized Latinx Lehigh Valley publication", () => {
  it("starts independently after the listener instead of waiting for optional migrations", () => {
    const indexSource = readFileSync(
      fileURLToPath(new URL("../../index.ts", import.meta.url)),
      "utf8",
    );
    const publicationStart = indexSource.indexOf("startLatinxLehighValleyPublication(pool");
    const optionalMigrationStart = indexSource.indexOf("runStartupMigrations(logger)");
    expect(publicationStart).toBeGreaterThan(-1);
    expect(optionalMigrationStart).toBeGreaterThan(-1);
    expect(publicationStart).toBeLessThan(optionalMigrationStart);
  });

  it("limits the public publication evidence to a non-identifying status object", () => {
    const appSource = readFileSync(
      fileURLToPath(new URL("../../app.ts", import.meta.url)),
      "utf8",
    );
    const publicationSource = readFileSync(
      fileURLToPath(new URL("../latinxLehighValleyPublication.ts", import.meta.url)),
      "utf8",
    );
    expect(appSource).toContain("latinx_lehigh_valley_publication");
    expect(appSource).toContain("getLatinxLehighValleyPublicationRuntimeStatus()");
    expect(publicationSource).toContain('failure_class: publicationFailureClass(error)');
    expect(publicationSource).not.toContain('failure_class: error instanceof Error ? error.message');
  });

  it("creates exactly the immutable 77 source profiles with receipts and no fabricated map pins", async () => {
    const profiles = assertLatinxLehighValleyDirectoryDataset();
    const clientQuery = vi.fn(async (statement: string, values?: readonly unknown[]) => {
      if (statement === "BEGIN" || statement === "COMMIT") return { rows: [] };
      if (statement.includes("INSERT INTO businesses")) {
        return {
          rows: Array.from({ length: (values?.length ?? 0) / 22 }, (_, index) => ({
            id: String(values?.[index * 22]),
          })),
        };
      }
      if (statement.includes("INSERT INTO user_supplied_directory_import_receipts")) return { rows: [] };
      throw new Error(`Unexpected client query: ${statement}`);
    });
    const client = { query: clientQuery, release: vi.fn() };
    const poolQuery = vi.fn(async (statement: string) => {
      if (statement.includes("SELECT profile_id")) return { rows: [] };
      if (
        statement.includes("ALTER TABLE businesses")
        || statement.includes("CREATE TABLE IF NOT EXISTS user_supplied_directory_import_receipts")
        || statement.includes("CREATE INDEX IF NOT EXISTS user_supplied_directory_import_business_idx")
      ) return { rows: [] };
      throw new Error(`Unexpected pool query: ${statement}`);
    });
    const pool = { query: poolQuery, connect: vi.fn().mockResolvedValue(client) };

    const summary = await publishLatinxLehighValleyDirectory(pool as never);

    expect(summary).toEqual({
      sourceProfiles: 77,
      addressedProfiles: 58,
      alreadyActivated: 0,
      pending: 77,
      created: 77,
      existingSameSourceId: 0,
      mapPinsCreated: 0,
    });
    expect(clientQuery).toHaveBeenCalledWith("BEGIN");
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalledOnce();
    const insert = clientQuery.mock.calls.find(([statement]) => String(statement).includes("INSERT INTO businesses"));
    expect(insert?.[0]).toContain("'live_unclaimed'");
    expect(insert?.[0]).toContain("'unclaimed'");
    expect(insert?.[1]).toContain("source_reported_ownership_unverified");
    expect(insert?.[0]).toContain("'user_supplied_latinx_lehigh_valley_directory_20260924'");
    expect(insert?.[1]?.[16]).toBe(
      `user_supplied_latinx_lehigh_valley_directory_20260924:${profiles[0]!.id}`,
    );
    expect(new Set(profiles.map((profile) =>
      `user_supplied_latinx_lehigh_valley_directory_20260924:${profile.id}`,
    )).size).toBe(77);
    const insertedSubcategories = (insert?.[1] ?? []).filter(
      (_value, index) => index % 22 === 3,
    ).map(String);
    expect(insertedSubcategories.every((subcategory) => subcategory.length <= 100)).toBe(true);
    expect(insertedSubcategories[0]).toBe("AudioVisual, IT & Telecommunications Services");
    const firstTags = JSON.parse(String(insert?.[1]?.[21]));
    expect(firstTags).toContain(profiles[0]!.subcategory);
    expect(profiles[0]!.description).toContain(profiles[0]!.subcategory);
    expect(insert?.[0]).not.toMatch(/latitude[^,]*,longitude[^,]*\)\s*VALUES[^;]*[0-9]/i);
  });

  it("leaves unresolved profiles searchable and writes pins only after an exact-address resolver returns valid coordinates", async () => {
    const rows = [
      {
        id: "pinnable-1", name: "Pinnable Business", category: "Restaurant", subcategory: "Restaurant",
        description: "Source-reported listing", address: "100 Main Street", city: "Allentown",
        state: "PA", country: "United States", website: "https://example.test",
      },
      {
        id: "unresolved-2", name: "Unresolved Business", category: "Services", subcategory: "Services",
        description: "Source-reported listing", address: "200 Market Street", city: "Allentown",
        state: "PA", country: "United States", website: null,
      },
    ];
    const query = vi.fn(async (statement: string, values?: readonly unknown[]) => {
      if (statement.includes("SELECT id,name,category")) return { rows };
      if (statement.includes("UPDATE businesses")) {
        return { rows: values?.[0] === "pinnable-1" ? [{ id: "pinnable-1" }] : [] };
      }
      throw new Error(`Unexpected query: ${statement}`);
    });
    const resolver = vi.fn(async (candidate: { id?: string; name: string }) => (
      candidate.name === "Pinnable Business"
        ? { lat: "40.601", lng: "-75.490", source: "google_geocoder" as const, formattedAddress: "100 Main Street, Allentown, PA" }
        : null
    ));

    const summary = await resolveLatinxLehighValleyPins(
      { query } as never,
      vi.fn(),
      resolver,
    );

    expect(summary).toEqual({ eligibleStreetAddresses: 2, attempted: 2, pinned: 1, unresolved: 1, errors: 0 });
    expect(resolver).toHaveBeenCalledTimes(2);
    const update = query.mock.calls.find(([statement]) => String(statement).includes("UPDATE businesses"));
    expect(update?.[0]).toContain("latitude IS NULL");
    expect(update?.[0]).toContain("address IS NOT DISTINCT FROM $8");
    expect(update?.[1]).toContain(LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE);
  });
});
