import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HBCU_COMPLETE_SEED } from "../data/hbcu-complete-seed";
import { findHbcuMapDetails } from "../map/hbcuDetails";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("HBCU canonical map details", () => {
  it("keeps the curated national seed institution-specific", () => {
    expect(HBCU_COMPLETE_SEED).toHaveLength(103);
    expect(new Set(HBCU_COMPLETE_SEED.map((item) => item.name.toLowerCase())).size).toBe(103);
    expect(HBCU_COMPLETE_SEED.every((item) => item.description.length >= 180)).toBe(true);
    expect(HBCU_COMPLETE_SEED.every((item) => item.significance.length >= 80)).toBe(true);
    expect(HBCU_COMPLETE_SEED.every((item) => Number.isInteger(item.founded))).toBe(true);
  });

  it("restores Cheyney as the oldest HBCU with its actual founding year", () => {
    const cheyney = findHbcuMapDetails("Cheyney University of Pennsylvania", "PA");
    expect(cheyney).toMatchObject({ foundedYear: 1837, institutionControl: "public" });
    expect(cheyney?.summary).toContain("oldest HBCU in the United States");
    expect(cheyney?.significance).toContain("oldest HBCU in America");
    expect(cheyney?.sourceLabel).toBe("U.S. Department of Education HBCU list");
  });

  it("restores Bethune-Cookman with Mary McLeod Bethune's institution-specific history", () => {
    const bethune = findHbcuMapDetails("Bethune-Cookman University", "FL");
    expect(bethune).toMatchObject({ foundedYear: 1904, institutionControl: "private" });
    expect(bethune?.summary).toContain("Mary McLeod Bethune");
    expect(bethune?.significance).toContain("$1.50");
  });

  it("supports legacy display titles without adding replacement map pins", () => {
    expect(findHbcuMapDetails("Lincoln University", "PA")?.foundedYear).toBe(1854);
    expect(findHbcuMapDetails("Bennett College — Greensboro's HBCU for Women", "NC")?.institutionControl).toBe("private");
    expect(findHbcuMapDetails("Southern University — Only HBCU System in the US", "LA")?.institutionControl).toBe("public");
    expect(findHbcuMapDetails("Lincoln University", "MO")).toBeNull();
  });

  it("persists and publishes the rich fields instead of replacing them with one standard tag", () => {
    const schema = source("../map/ensureUniversalMapEntities.ts");
    const route = source("../map/registerUniversalMapEntityRoutes.ts");
    const web = source("../../../web/src/pages/universal-place-detail.tsx");

    expect(schema).toContain("significance, founded_year, institution_control");
    expect(schema).toContain("findHbcuMapDetails(row.name, row.state)");
    expect(schema).toContain("findHbcuMapDetails(institution.title, institution.stateRegion)");
    expect(schema).toContain('addAlias(pool, entityId, "education_institution", slugify(row.id), row.id)');
    expect(route).toContain("to_jsonb(entity)->>'significance' AS significance");
    expect(route).toContain("to_jsonb(entity)->>'founded_year'");
    expect(route).toContain("to_jsonb(entity)->>'institution_control' AS institution_control");
    expect(route).toContain('request.query["format"] === "json"');
    expect(route).toContain("return response.json({ detailUrl })");
    expect(web).toContain("Why this HBCU matters");
    expect(web).toContain("Historically Black College or University");
    expect(web).toContain("api/legacy-place/education_institution/");
    expect(web).toContain("HBCU list reference");
    expect(web).toContain("Curated institutional history");
    expect(web).toContain("place.founded_year");
  });
});
