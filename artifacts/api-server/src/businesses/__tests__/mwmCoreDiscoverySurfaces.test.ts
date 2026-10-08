import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(
  fileURLToPath(new URL(relative, import.meta.url)),
  "utf8",
);

const discoverySources = {
  businessDirectory: source("../../routes/businesses.ts"),
  smartSearch: source("../../routes/smart-search.ts"),
  universalSearch: source("../../routes/universal-search.ts"),
  vibes: source("../../routes/vibes.ts"),
  localMap: source("../../map/localBusinessSearch.ts"),
  locationFirst: source("../../discovery/postgresLocationFirstRepository.ts"),
  kinfolk: source("../../kinfolk/governedBusinessRepository.ts"),
  locationResolver: source("../../location/locationResolver.ts"),
};

describe("documented Discovery surface coverage", () => {
  it("uses the shared documented eligibility policy on every ordinary discovery and recommendation surface", () => {
    for (const [surface, contents] of Object.entries(discoverySources)) {
      expect(contents, surface).toContain("mwmCoreDiscoveryPolicy");
      expect(contents, surface).toMatch(/mwmCoreDiscoverySqlPredicate|mwmDiasporaPromotionSqlPredicate/);
    }
    expect(discoverySources.businessDirectory).toContain("documentedDiscoveryEligibilitySqlPredicate");
    expect(discoverySources.businessDirectory).toContain('"map"');
  });

  it("keeps source-backed general browse separate from Kinfolk and map promotion", () => {
    expect(discoverySources.businessDirectory).toContain("mwmPublicDirectorySqlPredicate");
    expect(discoverySources.businessDirectory).toContain("hasGeoFilter || designationFilterIds.length > 0");
    expect(discoverySources.businessDirectory).toContain("mwmDiasporaPromotionSqlPredicate");
    expect(discoverySources.kinfolk).not.toContain("mwmPublicDirectorySqlPredicate");
  });

  it("keeps the gate out of detail, claim, moderation, and contribution paths", () => {
    const businesses = discoverySources.businessDirectory;
    expect(businesses).toContain("This applies only to public directory discovery");
    expect(businesses).toContain("Detail, claim, moderation");
    expect(businesses).not.toContain('router.get("/businesses/:id", async (req: Request, res: Response) => {\n  const documented');
  });

  it("allows retained unqualified records only through the exact named safety/context path", () => {
    const kinfolk = discoverySources.kinfolk;
    const businesses = discoverySources.businessDirectory;
    expect(kinfolk).toContain("Exact named lookup is a safety/context read");
    expect(businesses).toContain("isDeliberateNamedBusinessLookup(directSearchText)");
    expect(businesses).toContain("REGEXP_REPLACE(LOWER(COALESCE(${businessesTable.name}, ''))");
    expect(businesses).not.toContain("ilike(businessesTable.name, `${directSearchText}%`)");
  });
});
