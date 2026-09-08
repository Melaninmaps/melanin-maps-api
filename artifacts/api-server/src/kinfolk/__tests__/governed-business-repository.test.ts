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
  suppressProbableDuplicateBusinesses,
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
    expect(sql).not.toContain("promotion_eligible");
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
      expect(sql).not.toContain("promotion_eligible");
    },
  );

  it("searches explicit preference evidence only inside the governed Philadelphia catalog", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [AMINA_ROW] }) };
    const repository = createGovernedKinfolkBusinessRepository(pool);

    const result = await repository.findByPreferenceTerms(
      { city: " Philadelphia ", stateCode: "pa" },
      ["Southern and West African inspired dining", "trip", "and"],
      50,
    );

    expect(result[0]).toMatchObject({ name: "AMINA", city: "Philadelphia", stateCode: "PA" });
    const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("FROM public.public_businesses AS b");
    expect(sql).toContain("LEFT JOIN public.business_identity AS bi");
    expect(sql).toContain("LOWER(BTRIM(b.city)) = LOWER($1)");
    expect(sql).toContain("UPPER(BTRIM(COALESCE(b.state, ''))) = $2");
    expect(sql).toContain("FROM unnest($3::text[])");
    expect(sql).toContain("COALESCE(bi.audiences_served, '[]'::jsonb)::text");
    expect(sql).toContain("LIMIT $4");
    expect(sql).not.toContain("promotion_eligible");
    expect(params).toEqual([
      "Philadelphia",
      "PA",
      ["southern", "west", "african", "dining"],
      50,
    ]);
  });

  it("does not query when explicit preferences normalize to no safe search tokens", async () => {
    const pool = { query: vi.fn() };
    const repository = createGovernedKinfolkBusinessRepository(pool);

    await expect(repository.findByPreferenceTerms(
      { city: "Philadelphia", stateCode: "PA" },
      ["and", "the", "trip"],
    )).resolves.toEqual([]);
    expect(pool.query).not.toHaveBeenCalled();
  });


  it("searches exact Atlanta geography by bookstore relevance before limiting rows", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const repository = createGovernedKinfolkBusinessRepository(pool);

    await repository.findBySubject(
      { city: " Atlanta ", stateCode: "ga" },
      {
        key: "bookstore",
        label: "bookstores",
        searchTerms: ["bookstore", "book store", "bookshop"],
      },
      12,
    );

    const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("FROM public.public_businesses AS b");
    expect(sql).toContain("LEFT JOIN public.business_identity AS bi");
    expect(sql).toContain("LOWER(BTRIM(b.city)) = LOWER($1)");
    expect(sql).toContain("UPPER(BTRIM(COALESCE(b.state, ''))) = $2");
    expect(sql).toContain("LOWER(COALESCE(b.name, '')) ~ ANY($3::text[])");
    expect(sql).toContain("LOWER(COALESCE(b.category, '')) ~ ANY($3::text[])");
    expect(sql).toContain("LOWER(COALESCE(b.subcategory, '')) ~ ANY($3::text[])");
    expect(sql).not.toContain("jsonb_array_elements_text");
    // Identity/story fields remain selected for a governed card, but are never
    // service-match predicates (so incidental prose cannot qualify a result).
    expect(sql).toContain("bi.business_story");
    expect(sql).not.toContain("LOWER(COALESCE(b.description, '')) ~ ANY");
    expect(sql).not.toContain("LOWER(COALESCE(bi.business_story, '')) ~ ANY");
    // Promotion is a paid/featured state, not a public-directory visibility
    // state. Canonical public founder and community listings remain searchable
    // even when promotion_eligible is false.
    expect(sql).not.toContain("promotion_eligible");
    expect(sql).toContain("AND NOT (");
    expect(sql).toContain("CASE");
    expect(sql).toContain("LIMIT $4");
    expect(sql).toContain("COALESCE(b.name, '') ILIKE '%[DEMO]%'");
    expect(params).toEqual([
      "Atlanta",
      "GA",
      ["\\mbookstore\\M", "\\mbook[[:space:]-]+store\\M", "\\mbookshop\\M"],
      12,
      "bookstore",
    ]);
  });

  it("rejects incidental description and generic tags but retains a governed specialty", async () => {
    const pool = { query: vi.fn().mockResolvedValue({
      rows: [
        { ...AMINA_ROW, description: "AMINA serves books fast after dinner.", tags: ["restaurant"] },
        {
          ...AMINA_ROW,
          id: "context-tag-only",
          name: "Community Context Center",
          category: "Community Services",
          subcategory: "Resource Hub",
          tags: ["bookstore-cafe"],
          specialties: [],
        },
        {
          ...AMINA_ROW,
          id: "bookstore-cafe",
          name: "Chapter One Cafe",
          category: "Food",
          subcategory: "Cafe",
          tags: ["community gathering"],
          specialties: ["bookstore-cafe"],
        },
      ],
    }) };
    const result = await createGovernedKinfolkBusinessRepository(pool).findBySubject(
      { city: "Philadelphia", stateCode: "PA" },
      { key: "bookstore", label: "bookstores", searchTerms: ["bookstore", "book store", "bookshop"] },
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: "bookstore-cafe",
        matchReasons: ["specialty"],
      }),
    ]);
  });

  it("excludes automotive-only air conditioning from building HVAC results", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [
      {
        ...AMINA_ROW,
        id: "auto-ac",
        name: "Autocare Air Conditioning & Auto Repair",
        category: "Automotive & Transportation",
        subcategory: "Auto Repair / A/C",
        specialties: [],
        tags: [],
      },
      {
        ...AMINA_ROW,
        id: "building-hvac",
        name: "Integrity Air Conditioning & Heating",
        category: "Home & Property Services",
        subcategory: "HVAC",
        specialties: ["heating"],
        tags: [],
      },
    ] }) };
    const result = await createGovernedKinfolkBusinessRepository(pool).findBySubject(
      { city: "Phoenix", stateCode: "AZ" },
      { key: "hvac", label: "HVAC services", searchTerms: ["hvac", "heating", "air conditioning", "cooling"] },
    );
    expect(result.map(({ id }) => id)).toEqual(["building-hvac"]);
    const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("$5::text = 'hvac'");
    expect(params[4]).toBe("hvac");
  });

  it("suppresses probable duplicates non-destructively with identity evidence", () => {
    const base = {
      ...AMINA_ROW,
      city: "Philadelphia",
      state_code: "PA",
      phone: "+1 215 555 0200",
      website: "https://example.test/amina",
      tags: [],
    };
    const toBusiness = (row: typeof base, id: string, verified: boolean) => ({
      id, name: row.name, category: row.category, subcategory: row.subcategory,
      description: row.description, city: row.city, stateCode: row.state_code,
      country: null, latitude: null, longitude: null, distanceMiles: null,
      phone: row.phone, website: row.website, verified, claimed: false,
      blackOwned: false, ownershipClaim: null, tags: [], specialties: [], profileStatus: null,
      story: null, missionStatement: null, whyStarted: null, whatCustomersShouldKnow: null,
      ownershipBadges: [], communityValues: [], audiencesServed: [], vibes: [],
      accessibilityFeatures: [], communityInitiatives: [], growthGoals: [],
      audienceType: null, environmentTags: [], amenityTags: [], matchReasons: [], identityReasons: [],
    });
    const outcome = suppressProbableDuplicateBusinesses([
      toBusiness(base, "canonical", true),
      toBusiness(base, "probable-duplicate", false),
    ]);
    expect(outcome.businesses).toHaveLength(1);
    expect(outcome.businesses[0]).toMatchObject({ id: "canonical" });
    expect(outcome.suppressed).toEqual([expect.objectContaining({
      suppressedId: "probable-duplicate", canonicalId: "canonical",
      reasons: expect.arrayContaining(["same normalized name and city/state", "same phone"]),
    })]);
  });

  it("searches matching published map records in the same exact city and state", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [{
      id: "7a361f84-68e2-4f41-8928-863311d0cae2",
      entity_kind: "cultural_site",
      title: "For Keeps Books and Auburn Avenue Bookstores",
      summary: "A cultural bookstore record.",
      city: "Atlanta",
      state_region: "GA",
      detail_url: "/places/7a361f84-68e2-4f41-8928-863311d0cae2/for-keeps-books-and-auburn-avenue-bookstores-atlanta",
      website_url: null,
      source_url: null,
    }] }) };
    const repository = createGovernedKinfolkBusinessRepository(pool);

    const results = await repository.findPublishedMapEntities(
      { city: "Atlanta", stateCode: "GA" },
      {
        key: "bookstore",
        label: "bookstores",
        searchTerms: ["bookstore", "book store", "bookshop"],
      },
    );

    expect(results[0]).toMatchObject({
      id: "7a361f84-68e2-4f41-8928-863311d0cae2",
      title: "For Keeps Books and Auburn Avenue Bookstores",
      detailUrl: "/places/7a361f84-68e2-4f41-8928-863311d0cae2/for-keeps-books-and-auburn-avenue-bookstores-atlanta",
    });
    const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("FROM public.published_map_entities");
    expect(sql).toContain("LOWER(BTRIM(city)) = LOWER($1)");
    expect(sql).toContain("UPPER(BTRIM(COALESCE(state_region, ''))) = $2");
    expect(sql).toContain("LOWER(COALESCE(title, '')) ~ ANY($3::text[])");
    expect(sql).toContain("LOWER(COALESCE(summary, '')) ~ ANY($3::text[])");
    expect(params).toEqual([
      "Atlanta",
      "GA",
      ["\\mbookstore\\M", "\\mbook[[:space:]-]+store\\M", "\\mbookshop\\M"],
      8,
    ]);
  });

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
    // Four discoverability writes and the legacy compatibility view use the
    // raw predicate. The canonical public view delegates to the separately
    // fail-closed business_record_is_public function instead of duplicating it.
    expect(
      startupSource.match(/AND NOT \$\{PROVEN_DEMO_BUSINESS_SQL_PREDICATE\}/g)
        ?.length,
    ).toBe(5);
    expect(startupSource).not.toContain('["dir. businesses",   () => ensureDirectoryBusinesses');
    expect(startupSource).not.toContain('["tour businesses",   () => ensureTourBusinesses');
    expect(startupSource).not.toContain('["curated businesses", () => ensureFounderCuratedBusinesses');
  });
});
