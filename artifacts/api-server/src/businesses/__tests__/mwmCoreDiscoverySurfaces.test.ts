import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isDeliberateBusinessNameLookup } from "@workspace/constants";
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
  it("shares a Unicode-safe direct-name classifier while rejecting generic browse phrases", () => {
    expect(isDeliberateBusinessNameLookup("Café Mūse")).toBe(true);
    expect(isDeliberateBusinessNameLookup("AMINA")).toBe(true);
    expect(isDeliberateBusinessNameLookup("Amina Restaurant")).toBe(true);
    expect(isDeliberateBusinessNameLookup("restaurants")).toBe(false);
    expect(isDeliberateBusinessNameLookup("vegan restaurants")).toBe(false);
    expect(isDeliberateBusinessNameLookup("Black-owned restaurants")).toBe(false);
    expect(isDeliberateBusinessNameLookup("Black / African American-Owned businesses")).toBe(false);
    expect(isDeliberateBusinessNameLookup("girls clothes")).toBe(false);
    expect(isDeliberateBusinessNameLookup("Atlanta")).toBe(false);
  });

  it("uses the shared documented eligibility policy on every ordinary discovery and recommendation surface", () => {
    for (const [surface, contents] of Object.entries(discoverySources)) {
      expect(contents, surface).toContain("mwmCoreDiscoveryPolicy");
      expect(contents, surface).toMatch(/mwmCoreDiscoverySqlPredicate|mwmDiasporaPromotionSqlPredicate/);
    }
    expect(discoverySources.businessDirectory).toContain("documentedDiscoveryEligibilitySqlPredicate");
    expect(discoverySources.businessDirectory).toContain('"map"');
  });

  it("keeps ordinary browse, Map, and Kinfolk discovery in the documented promotion catalog", () => {
    expect(discoverySources.businessDirectory).toContain("mwmPublicDirectorySqlPredicate");
    expect(discoverySources.businessDirectory).toContain("conditions.push(promotionCondition);");
    expect(discoverySources.businessDirectory).not.toContain("generalDirectoryCondition");
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
    expect(businesses).toContain('req.query.lookup !== "direct_name" || !isEligibleDirectNameLookupRequest(req, search)');
    expect(businesses).toContain("const strictDirectNameLookup = directNameLookupRequested");
    expect(businesses).toContain("DIRECT_NAME_LOOKUP_REQUIRES_UNFILTERED_EXACT_NAME");
    expect(businesses).toContain("&& !isEligibleDirectNameLookupRequest(req, directSearchText)");
    expect(businesses).not.toContain("if (businesses.length === 0 && directNamedSafetyLookup");
    expect(businesses).toContain("LOWER(BTRIM(COALESCE(${businessesTable.name}, ''))) = LOWER(BTRIM(${directSearchText}))");
    expect(businesses).toContain('mwmPublicDirectorySqlPredicate("public.public_businesses.id")');
    expect(businesses).toContain("!strictDirectNameLookup &&");
    expect(businesses).not.toContain("normalizedDirectBusinessName");
    expect(businesses).not.toContain("ilike(businessesTable.name, `${directSearchText}%`)");
  });
});
