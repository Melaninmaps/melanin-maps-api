import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

const migrations = source("../../lib/startup-migrations.ts");
const startup = source("../../index.ts");
const repository = source("../postgresLocationFirstRepository.ts");

describe("HBCU Explore publication schema gate", () => {
  it("provisions the canonical publication column before traffic in feature-release mode", () => {
    expect(migrations).toContain("export async function ensureHbcuExplorePublicationSchema");
    expect(migrations).toContain('entry.name === "create_cultural_sites_table"');
    expect(migrations).toContain("ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE");
    expect(migrations).toContain("heritage_category, city, state, latitude, longitude, is_published");
    expect(startup).toContain("ensureHbcuExplorePublicationSchema,");
    expect(startup).toContain("await ensureHbcuExplorePublicationSchema(logger);");
    expect(startup).toContain("Explore HBCU publication schema ready before traffic acceptance");
  });

  it("keeps HBCU results constrained to the published canonical catalogue", () => {
    expect(repository).toContain("FROM cultural_sites");
    expect(repository).toContain("COALESCE(is_published, TRUE) = TRUE");
    expect(repository).toContain("UPPER(COALESCE(heritage_category, '')) = 'HBCU'");
  });
});
