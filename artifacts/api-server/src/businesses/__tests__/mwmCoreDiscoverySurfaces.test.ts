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

describe("MWM Core discovery surface coverage", () => {
  it("uses the one evidence predicate on every public discovery and recommendation surface", () => {
    for (const [surface, contents] of Object.entries(discoverySources)) {
      expect(contents, surface).toContain("mwmCoreDiscoverySqlPredicate");
    }
  });

  it("keeps the filter out of public business detail, claim, moderation, and contribution paths", () => {
    const businesses = discoverySources.businessDirectory;
    expect(businesses).toContain("This applies only to public directory discovery");
    expect(businesses).toContain("Detail, claim, moderation");
    expect(businesses).not.toContain('router.get("/businesses/:id", async (req: Request, res: Response) => {\n  const mwm');
  });

  it("makes Kinfolk exact-name and recommendation lookups require an approved receipt once enabled", () => {
    const kinfolk = discoverySources.kinfolk;
    expect(kinfolk).toContain("findExactByNormalizedName");
    expect(kinfolk.match(/mwmCoreDiscoverySqlPredicate\("b\.id"\)/g)?.length).toBeGreaterThanOrEqual(5);
  });
});
