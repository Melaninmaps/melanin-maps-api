import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const startup = readFileSync(fileURLToPath(new URL("../index.ts", import.meta.url)), "utf8");
const migrations = readFileSync(fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)), "utf8");
const mediaValidation = readFileSync(fileURLToPath(new URL("../community/communityMediaValidation.ts", import.meta.url)), "utf8");

describe("Community media schema bootstrap", () => {
  it("creates only the additive ownership-lookup relation before traffic", () => {
    const start = migrations.indexOf("export async function ensureCommunityMediaSchemaOnly");
    const end = migrations.indexOf("/**\n * Kinfolk question images", start);
    const helper = migrations.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(helper).toContain("CREATE TABLE IF NOT EXISTS media_assets");
    expect(helper).toContain("ALTER TABLE media_assets ALTER COLUMN public_url DROP NOT NULL");
    expect(helper).toContain("information_schema.columns");
    expect(helper).toContain("media_assets_owned_ready_lookup_idx");
    expect(helper).not.toMatch(/\b(INSERT|UPDATE|DELETE)\b/);
  });

  it("gates Community media before the listener and keeps a failed lookup fail-closed", () => {
    const bootstrap = startup.indexOf("await ensureCommunityMediaSchemaOnly()");
    const listener = startup.indexOf("const server = host");

    expect(startup).toContain("ensureCommunityMediaSchemaOnly,");
    expect(bootstrap).toBeGreaterThan(-1);
    expect(bootstrap).toBeLessThan(listener);
    expect(mediaValidation).toContain("A failed ownership lookup must never make an arbitrary media URL valid");
    expect(mediaValidation).toContain("return new Set();");
  });
});
