import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  CONFIGURED_TEST_BUSINESS_PHONE_DIGITS,
  PROVEN_DEMO_BUSINESS_SQL_PREDICATE,
  isProvenDemoBusiness,
} from "../../businesses/businessDemoContainment";
import { isPublicBusinessRecord } from "../../businesses/publicBusinessVisibility";
import {
  createGovernedKinfolkBusinessRepository,
  normalizeExactBusinessName,
} from "../governedBusinessRepository";

const AMINA_ROW = {
  id: "91f14ab4-0f8d-4f52-97be-f12617191919",
  name: "AMINA",
  category: "Food",
  subcategory: "Restaurants",
  description: "A Philadelphia restaurant.",
  city: "Philadelphia",
  state_code: "PA",
  country: "United States",
  latitude: "39.9526000",
  longitude: "-75.1652000",
  distance_miles: null,
  phone: null,
  website: "https://example.test/amina",
  verified: true,
  black_owned: true,
  tags: ["restaurant"],
  profile_status: "community_listed",
  business_story: "Made with care.",
  mission_statement: null,
  why_started: null,
  what_customers_should_know: null,
  ownership_badges: ["black-owned"],
  community_values: [],
  audiences_served: [],
  vibes: [],
  accessibility_features: [],
  community_initiatives: [],
  growth_goals: [],
  audience_type: null,
  environment_tags: [],
  amenity_tags: [],
};

describe("proven demo/test business containment", () => {
  it.each([
    [{ name: "[DEMO] Cafe" }, "name"],
    [{ name: "[demo] Cafe" }, "case-insensitive name"],
    [{ description: "Seed copy [DEMO] only" }, "description"],
    [{ dataSource: "DEMO" }, "demo data source"],
    [{ dataSource: "DEMO_SEED" }, "demo seed data source"],
    [{ status: "demo" }, "demo status"],
    [{ status: "test" }, "test status"],
    [{ listingStatus: "demo" }, "listing status"],
    [{ phone: "+1 (555) 555-0100" }, "configured test phone with country code"],
    [{ phone: "555-555-0100" }, "configured test phone without country code"],
  ])("contains a proven fixture by %s", (record, _signal) => {
    expect(isProvenDemoBusiness(record)).toBe(true);
  });

  it("documents the exact phone predicate and does not hide other legitimate 555 numbers", () => {
    expect(CONFIGURED_TEST_BUSINESS_PHONE_DIGITS).toEqual([
      "15555550100",
      "5555550100",
    ]);
    expect(PROVEN_DEMO_BUSINESS_SQL_PREDICATE).toContain(
      "IN ('15555550100', '5555550100')",
    );
    expect(PROVEN_DEMO_BUSINESS_SQL_PREDICATE).not.toMatch(/LIKE\s+'%555/i);
    expect(isProvenDemoBusiness({ phone: "+1 202-555-1234" })).toBe(false);
    expect(isProvenDemoBusiness({ phone: "+1 804-555-0100" })).toBe(false);
    expect(
      isProvenDemoBusiness({
        name: "Demo & Sons",
        description: "A legitimate test kitchen",
      }),
    ).toBe(false);
  });
});

describe("governed Kinfolk business repository", () => {
  it("finds exact normalized AMINA only within validated Philadelphia, PA", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [AMINA_ROW] }) };
    const repository = createGovernedKinfolkBusinessRepository(pool);

    const result = await repository.findExactByNormalizedName({
      name: " A.M.I.N.A. ",
      city: " Philadelphia ",
      stateCode: "pa",
    });

    expect(normalizeExactBusinessName(" A.M.I.N.A. ")).toBe("amina");
    expect(result).toEqual(
      expect.objectContaining({
        id: AMINA_ROW.id,
        name: "AMINA",
        city: "Philadelphia",
        stateCode: "PA",
        latitude: 39.9526,
        longitude: -75.1652,
        verified: true,
        blackOwned: true,
        tags: ["restaurant"],
        ownershipBadges: ["black-owned"],
        distanceMiles: null,
      }),
    );

    const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("FROM public.public_businesses AS b");
    expect(sql).not.toMatch(/FROM\s+(?:public\.)?businesses\b/i);
    expect(sql).toContain(
      "REGEXP_REPLACE(LOWER(COALESCE(b.name, '')), '[^a-z0-9]+', '', 'g') = $1",
    );
    expect(sql).toContain("LOWER(BTRIM(b.city)) = LOWER($2)");
    expect(sql).toContain("UPPER(BTRIM(COALESCE(b.state, ''))) = $3");
    expect(params).toEqual(["amina", "Philadelphia", "PA"]);
  });

  it.each([
    [
      "destination",
      (
        repository: ReturnType<typeof createGovernedKinfolkBusinessRepository>,
      ) =>
        repository.findDestinationCatalog({
          city: "Philadelphia",
          stateCode: "PA",
        }),
    ],
    [
      "home fallback",
      (
        repository: ReturnType<typeof createGovernedKinfolkBusinessRepository>,
      ) =>
        repository.findHomeFallback({ city: "Philadelphia", stateCode: "PA" }),
    ],
    [
      "radius",
      (
        repository: ReturnType<typeof createGovernedKinfolkBusinessRepository>,
      ) =>
        repository.findWithinRadius({
          latitude: 39.9526,
          longitude: -75.1652,
          radiusMiles: 50,
        }),
    ],
  ])(
    "uses public.public_businesses exclusively for the %s catalog",
    async (_label, query) => {
      const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
      await query(createGovernedKinfolkBusinessRepository(pool));
      const sql = pool.query.mock.calls[0]?.[0] as string;
      expect(sql).toContain("public.public_businesses");
      expect(sql).not.toMatch(/(?:FROM|JOIN)\s+(?:public\.)?businesses\b/i);
      expect(sql).toContain("COALESCE(b.name, '') ILIKE '%[DEMO]%'");
      expect(sql).toContain("COALESCE(b.description, '') ILIKE '%[DEMO]%'");
      expect(sql).toContain("b.data_source");
      expect(sql).toContain("b.listing_status");
      expect(sql).toContain("b.phone");
    },
  );

  it("rejects unvalidated city/state scopes before querying", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const repository = createGovernedKinfolkBusinessRepository(pool);
    await expect(
      repository.findDestinationCatalog({
        city: "Philadelphia",
        stateCode: "Pennsylvania",
      }),
    ).rejects.toThrow("KINFOLK_BUSINESS_STATE_INVALID");
    await expect(
      repository.findExactByNormalizedName({
        name: "AMINA",
        city: " ",
        stateCode: "PA",
      }),
    ).rejects.toThrow("KINFOLK_BUSINESS_CITY_INVALID");
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("fixture integration returns only canonical AMINA, excluding demo and visibility failures", () => {
    const fixtures = [
      {
        name: "AMINA",
        city: "Philadelphia",
        state: "PA",
        status: "active",
        listingStatus: "live_unclaimed",
        isDuplicate: false,
      },
      {
        name: "[DEMO] AMINA",
        city: "Philadelphia",
        state: "PA",
        status: "active",
        listingStatus: "live_unclaimed",
        isDuplicate: false,
      },
      {
        name: "AMINA",
        description: "[demo] fixture",
        city: "Philadelphia",
        state: "PA",
        status: "active",
        listingStatus: "live_unclaimed",
        isDuplicate: false,
      },
      {
        name: "AMINA",
        dataSource: "demo_seed",
        city: "Philadelphia",
        state: "PA",
        status: "active",
        listingStatus: "live_unclaimed",
        isDuplicate: false,
      },
      {
        name: "AMINA",
        city: "Philadelphia",
        state: "PA",
        status: "test",
        listingStatus: "live_unclaimed",
        isDuplicate: false,
      },
      {
        name: "AMINA",
        phone: "+1 (555) 555-0100",
        city: "Philadelphia",
        state: "PA",
        status: "active",
        listingStatus: "live_unclaimed",
        isDuplicate: false,
      },
      {
        name: "AMINA",
        city: "Philadelphia",
        state: "PA",
        status: "active",
        listingStatus: "live_claimed",
        permanentlyHidden: true,
        isDuplicate: false,
      },
      {
        name: "AMINA",
        city: "Philadelphia",
        state: "PA",
        status: "active",
        listingStatus: "live_claimed",
        isDuplicate: true,
      },
      {
        name: "AMINA",
        city: "Philadelphia",
        state: "PA",
        status: "active",
        listingStatus: "staged",
        isDuplicate: false,
      },
    ];

    expect(
      fixtures
        .filter(
          (record) =>
            isPublicBusinessRecord(record) &&
            !isProvenDemoBusiness(record) &&
            normalizeExactBusinessName(record.name) === "amina" &&
            record.city.toLowerCase() === "philadelphia" &&
            record.state === "PA",
        )
        .map((record) => record.name),
    ).toEqual(["AMINA"]);
  });
});

describe("startup demo containment static safety", () => {
  const startupSource = readFileSync(
    fileURLToPath(new URL("../../lib/startup-migrations.ts", import.meta.url)),
    "utf8",
  );

  it("hides and de-promotes fixtures idempotently without deleting businesses or member links", () => {
    expect(startupSource).not.toMatch(
      /DELETE\s+FROM\s+(?:public\.)?businesses\b/i,
    );
    expect(startupSource).toContain("SET permanently_hidden = true");
    expect(startupSource).toContain("promotion_eligible = false");
    expect(startupSource).toContain("featured = false");
    expect(startupSource).toContain("promoted_until = NULL");
    expect(startupSource).toContain("linked data retained");
    expect(startupSource).not.toContain("NOT EXISTS (SELECT 1 FROM reviews");
  });

  it("contains demos before discoverability and excludes them from promotion/tag/badge work", () => {
    const containment = startupSource.search(/\["demo containment"/);
    const discoverability = startupSource.search(
      /\[\s*"business discoverability"/,
    );
    const finalContainment = startupSource.search(/\["demo containment final"/);
    expect(containment).toBeGreaterThan(-1);
    expect(discoverability).toBeGreaterThan(containment);
    expect(finalContainment).toBeGreaterThan(discoverability);

    const discoverabilityBody = startupSource.slice(
      startupSource.indexOf("async function ensureBusinessDiscoverability"),
      startupSource.indexOf("async function ensureDemoContainment"),
    );
    expect(discoverabilityBody).not.toContain(
      "listing_status IN ('demo', 'live', 'active')",
    );
    expect(
      discoverabilityBody.match(
        /NOT \$\{PROVEN_DEMO_BUSINESS_SQL_PREDICATE\}/g,
      ),
    ).toHaveLength(4);
    expect(
      startupSource.match(
        /CREATE OR REPLACE VIEW (?:public\.)?public_businesses/g,
      ),
    ).toHaveLength(2);
    expect(
      startupSource.match(/AND NOT \$\{PROVEN_DEMO_BUSINESS_SQL_PREDICATE\}/g)
        ?.length,
    ).toBeGreaterThanOrEqual(6);
  });
});
