import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrations = readFileSync(
  new URL("../../lib/startup-migrations.ts", import.meta.url),
  "utf8",
);
const startup = readFileSync(new URL("../../index.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../tour-cultural-sites.ts", import.meta.url), "utf8");

describe("tour cultural-site contribution schema gate", () => {
  it("provisions the detail-route contribution relation before traffic without invoking legacy seeds", () => {
    expect(migrations).toContain("export async function ensureTourCulturalSiteContributionSchema");
    expect(migrations).toContain("CREATE TABLE IF NOT EXISTS site_contributions");
    expect(migrations).toContain("CREATE INDEX IF NOT EXISTS idx_site_contrib_site");
    expect(migrations).toContain("CREATE INDEX IF NOT EXISTS idx_site_contrib_user");
    expect(migrations).toContain("FROM site_contributions LIMIT 0");
    expect(startup).toContain("await ensureTourCulturalSiteContributionSchema(logger);");
  });

  it("keeps the protected detail and contribution reads aligned with the gated relation", () => {
    expect(route).toContain("SELECT COUNT(*) FROM site_contributions");
    expect(route).toContain("GET /tour-cultural-sites/:id");
    expect(route).toContain("GET /tour-cultural-sites/:id/contributions");
  });
});
