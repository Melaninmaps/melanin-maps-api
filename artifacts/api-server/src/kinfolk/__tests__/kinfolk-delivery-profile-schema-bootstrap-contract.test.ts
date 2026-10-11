import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

const migrations = source("../../lib/startup-migrations.ts");
const startup = source("../../index.ts");

describe("Kinfolk delivery-profile pre-traffic schema", () => {
  it("applies only the additive delivery-profile relation and adaptive columns", () => {
    const start = migrations.indexOf("export async function ensureKinfolkDeliveryProfileSchema");
    const end = migrations.indexOf("export async function ensureKinfolkPreferredNameSchema", start);
    const helper = migrations.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(migrations).toContain('"kinfolk_delivery_profiles_v1"');
    expect(migrations).toContain('"kinfolk_delivery_profiles_adaptive_depth_cols"');
    expect(helper).toContain("KINFOLK_DELIVERY_PROFILE_SCHEMA_MIGRATIONS");
    expect(helper).toContain("SELECT user_id, detail_level, tone_preference");
    expect(helper).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
  });

  it("runs before the listener when feature-release mode skips broad migrations", () => {
    const bootstrap = startup.indexOf("await ensureKinfolkDeliveryProfileSchema(logger);");
    const listener = startup.indexOf("const server = host");

    expect(startup).toContain("ensureKinfolkDeliveryProfileSchema,");
    expect(bootstrap).toBeGreaterThan(-1);
    expect(bootstrap).toBeLessThan(listener);
    expect(startup).toContain("Kinfolk delivery-profile schema ready before traffic acceptance");
  });
});
