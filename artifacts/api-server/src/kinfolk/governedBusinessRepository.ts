import { PROVEN_DEMO_BUSINESS_SQL_PREDICATE } from "../businesses/businessDemoContainment";
import {
  businessSubjectSearchPatterns,
  type NormalizedBusinessSubject,
} from "./business-subject";

export type QueryPool = {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: T[]; rowCount?: number | null }>;
};

export type ValidatedKinfolkCityScope = Readonly<{
  city: string;
  stateCode: string;
}>;

export type KinfolkRadiusScope = Readonly<{
  latitude: number;
  longitude: number;
  radiusMiles: number;
}>;

export type GovernedKinfolkBusiness = Readonly<{
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  city: string;
  stateCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMiles: number | null;
  phone: string | null;
  website: string | null;
  verified: boolean;
  blackOwned: boolean;
  tags: string[];
  profileStatus: string | null;
  story: string | null;
  missionStatement: string | null;
  whyStarted: string | null;
  whatCustomersShouldKnow: string | null;
  ownershipBadges: string[];
  communityValues: string[];
  audiencesServed: string[];
  vibes: string[];
  accessibilityFeatures: string[];
  communityInitiatives: string[];
  growthGoals: string[];
  audienceType: string | null;
  environmentTags: string[];
  amenityTags: string[];
}>;


export type GovernedKinfolkMapPlace = Readonly<{
  id: string;
  entityKind: string;
  title: string;
  summary: string;
  city: string;
  stateCode: string | null;
  detailUrl: string;
  websiteUrl: string | null;
  sourceUrl: string | null;
}>;

type BusinessRow = {
  id: unknown;
  name: unknown;
  category: unknown;
  subcategory: unknown;
  description: unknown;
  city: unknown;
  state_code: unknown;
  country: unknown;
  latitude: unknown;
  longitude: unknown;
  distance_miles?: unknown;
  phone: unknown;
  website: unknown;
  verified: unknown;
  black_owned: unknown;
  tags: unknown;
  profile_status: unknown;
  business_story: unknown;
  mission_statement: unknown;
  why_started: unknown;
  what_customers_should_know: unknown;
  ownership_badges: unknown;
  community_values: unknown;
  audiences_served: unknown;
  vibes: unknown;
  accessibility_features: unknown;
  community_initiatives: unknown;
  growth_goals: unknown;
  audience_type: unknown;
  environment_tags: unknown;
  amenity_tags: unknown;
};

type MapPlaceRow = {
  id: unknown;
  entity_kind: unknown;
  title: unknown;
  summary: unknown;
  city: unknown;
  state_region: unknown;
  detail_url: unknown;
  website_url: unknown;
  source_url: unknown;
};

const DEFAULT_CATALOG_LIMIT = 25;
const MAX_CATALOG_LIMIT = 50;
const MAX_RADIUS_MILES = 100;

const CANONICAL_SELECT = `
  b.id,
  b.name,
  b.category,
  b.subcategory,
  b.description,
  b.city,
  b.state AS state_code,
  b.country,
  b.latitude,
  b.longitude,
  b.phone,
  b.website,
  COALESCE(b.verified, false) AS verified,
  COALESCE(b.black_owned, false) AS black_owned,
  COALESCE(b.tags, '[]'::jsonb) AS tags,
  b.profile_status,
  bi.business_story,
  bi.mission_statement,
  bi.why_started,
  bi.what_customers_should_know,
  COALESCE(bi.ownership_badges, '[]'::jsonb) AS ownership_badges,
  COALESCE(bi.community_values, '[]'::jsonb) AS community_values,
  COALESCE(bi.audiences_served, '[]'::jsonb) AS audiences_served,
  COALESCE(bi.vibes, '[]'::jsonb) AS vibes,
  COALESCE(bi.accessibility_features, '[]'::jsonb) AS accessibility_features,
  COALESCE(bi.community_initiatives, '[]'::jsonb) AS community_initiatives,
  COALESCE(bi.growth_goals, '[]'::jsonb) AS growth_goals,
  bi.audience_type,
  COALESCE(bi.environment_tags, '[]'::jsonb) AS environment_tags,
  COALESCE(bi.amenity_tags, '[]'::jsonb) AS amenity_tags`;

function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function nullableText(value: unknown): string | null {
  const result = text(value).trim();
  return result ? result : null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function mapBusiness(row: BusinessRow): GovernedKinfolkBusiness {
  return {
    id: text(row.id),
    name: text(row.name),
    category: text(row.category),
    subcategory: nullableText(row.subcategory),
    description: text(row.description),
    city: text(row.city),
    stateCode: nullableText(row.state_code),
    country: nullableText(row.country),
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    distanceMiles: numberOrNull(row.distance_miles),
    phone: nullableText(row.phone),
    website: nullableText(row.website),
    verified: row.verified === true,
    blackOwned: row.black_owned === true,
    tags: stringArray(row.tags),
    profileStatus: nullableText(row.profile_status),
    story: nullableText(row.business_story),
    missionStatement: nullableText(row.mission_statement),
    whyStarted: nullableText(row.why_started),
    whatCustomersShouldKnow: nullableText(row.what_customers_should_know),
    ownershipBadges: stringArray(row.ownership_badges),
    communityValues: stringArray(row.community_values),
    audiencesServed: stringArray(row.audiences_served),
    vibes: stringArray(row.vibes),
    accessibilityFeatures: stringArray(row.accessibility_features),
    communityInitiatives: stringArray(row.community_initiatives),
    growthGoals: stringArray(row.growth_goals),
    audienceType: nullableText(row.audience_type),
    environmentTags: stringArray(row.environment_tags),
    amenityTags: stringArray(row.amenity_tags),
  };
}

function mapPlace(row: MapPlaceRow): GovernedKinfolkMapPlace {
  return {
    id: text(row.id),
    entityKind: text(row.entity_kind),
    title: text(row.title),
    summary: text(row.summary),
    city: text(row.city),
    stateCode: nullableText(row.state_region),
    detailUrl: text(row.detail_url),
    websiteUrl: nullableText(row.website_url),
    sourceUrl: nullableText(row.source_url),
  };
}

function boundedLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_CATALOG_LIMIT;
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("KINFOLK_BUSINESS_LIMIT_INVALID");
  return Math.min(limit, MAX_CATALOG_LIMIT);
}

export function normalizeExactBusinessName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function validateKinfolkCityScope(
  scope: ValidatedKinfolkCityScope,
): ValidatedKinfolkCityScope {
  const city = scope.city.trim().replace(/\s+/g, " ");
  const stateCode = scope.stateCode.trim().toUpperCase();
  if (city.length < 2 || city.length > 100 || !/[\p{L}\p{N}]/u.test(city)) {
    throw new Error("KINFOLK_BUSINESS_CITY_INVALID");
  }
  if (!/^[A-Z]{2}$/.test(stateCode)) {
    throw new Error("KINFOLK_BUSINESS_STATE_INVALID");
  }
  return { city, stateCode };
}

function validateRadiusScope(scope: KinfolkRadiusScope): KinfolkRadiusScope {
  if (
    !Number.isFinite(scope.latitude) ||
    scope.latitude < -90 ||
    scope.latitude > 90
  ) {
    throw new Error("KINFOLK_BUSINESS_LATITUDE_INVALID");
  }
  if (
    !Number.isFinite(scope.longitude) ||
    scope.longitude < -180 ||
    scope.longitude > 180
  ) {
    throw new Error("KINFOLK_BUSINESS_LONGITUDE_INVALID");
  }
  if (
    !Number.isFinite(scope.radiusMiles) ||
    scope.radiusMiles <= 0 ||
    scope.radiusMiles > MAX_RADIUS_MILES
  ) {
    throw new Error("KINFOLK_BUSINESS_RADIUS_INVALID");
  }
  return scope;
}

async function queryCityCatalog(
  pool: QueryPool,
  scope: ValidatedKinfolkCityScope,
  limit: number | undefined,
): Promise<GovernedKinfolkBusiness[]> {
  const location = validateKinfolkCityScope(scope);
  const resultLimit = boundedLimit(limit);
  const { rows } = await pool.query<BusinessRow>(
    `
    SELECT ${CANONICAL_SELECT}, NULL::double precision AS distance_miles
    FROM public.public_businesses AS b
    LEFT JOIN public.business_identity AS bi ON bi.business_id = b.id
    WHERE LOWER(BTRIM(b.city)) = LOWER($1)
      AND UPPER(BTRIM(COALESCE(b.state, ''))) = $2
      AND NOT ${PROVEN_DEMO_BUSINESS_SQL_PREDICATE}
    ORDER BY b.verified DESC, b.confidence_score DESC NULLS LAST, b.name ASC
    LIMIT $3
  `,
    [location.city, location.stateCode, resultLimit],
  );
  return rows.map(mapBusiness);
}

export function createGovernedKinfolkBusinessRepository(pool: QueryPool) {
  return {
    findDestinationCatalog(
      scope: ValidatedKinfolkCityScope,
      limit?: number,
    ): Promise<GovernedKinfolkBusiness[]> {
      return queryCityCatalog(pool, scope, limit);
    },

    findHomeFallback(
      scope: ValidatedKinfolkCityScope,
      limit = 20,
    ): Promise<GovernedKinfolkBusiness[]> {
      return queryCityCatalog(pool, scope, limit);
    },

    async findBySubject(
      scope: ValidatedKinfolkCityScope,
      subject: NormalizedBusinessSubject,
      limit = 12,
    ): Promise<GovernedKinfolkBusiness[]> {
      const location = validateKinfolkCityScope(scope);
      const resultLimit = boundedLimit(limit);
      const patterns = businessSubjectSearchPatterns(subject);
      if (!patterns.length) return [];
      const { rows } = await pool.query<BusinessRow>(
        `
        SELECT ${CANONICAL_SELECT}, NULL::double precision AS distance_miles
        FROM public.public_businesses AS b
        LEFT JOIN public.business_identity AS bi ON bi.business_id = b.id
        WHERE LOWER(BTRIM(b.city)) = LOWER($1)
          AND UPPER(BTRIM(COALESCE(b.state, ''))) = $2
          AND NOT ${PROVEN_DEMO_BUSINESS_SQL_PREDICATE}
          AND (
            LOWER(COALESCE(b.name, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(b.category, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(b.subcategory, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(b.description, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(b.tags::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.business_story, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.mission_statement, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.why_started, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.what_customers_should_know, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.ownership_badges::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.community_values::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.audiences_served::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.vibes::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.current_highlights::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.accessibility_features::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.community_initiatives::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.growth_goals::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.age_restriction_reasons::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.environment_tags::text, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(bi.amenity_tags::text, '')) LIKE ANY($3::text[])
          )
        ORDER BY
          CASE
            WHEN LOWER(COALESCE(b.category, '')) LIKE ANY($3::text[]) THEN 0
            WHEN LOWER(COALESCE(b.subcategory, '')) LIKE ANY($3::text[]) THEN 1
            WHEN LOWER(COALESCE(b.name, '')) LIKE ANY($3::text[]) THEN 2
            ELSE 3
          END,
          b.verified DESC, b.confidence_score DESC NULLS LAST, b.name ASC
        LIMIT $4
      `,
        [location.city, location.stateCode, patterns, resultLimit],
      );
      return rows.map(mapBusiness);
    },

    async findPublishedMapEntities(
      scope: ValidatedKinfolkCityScope,
      subject: NormalizedBusinessSubject,
      limit = 8,
    ): Promise<GovernedKinfolkMapPlace[]> {
      const location = validateKinfolkCityScope(scope);
      const resultLimit = boundedLimit(limit);
      const patterns = businessSubjectSearchPatterns(subject);
      if (!patterns.length) return [];
      const { rows } = await pool.query<MapPlaceRow>(
        `
        SELECT id::text, entity_kind, title, COALESCE(summary, '') AS summary,
               city, state_region, detail_url, website_url, source_url
        FROM public.published_map_entities
        WHERE LOWER(BTRIM(city)) = LOWER($1)
          AND UPPER(BTRIM(COALESCE(state_region, ''))) = $2
          AND (
            LOWER(COALESCE(title, '')) LIKE ANY($3::text[])
            OR LOWER(COALESCE(summary, '')) LIKE ANY($3::text[])
          )
        ORDER BY
          CASE WHEN LOWER(COALESCE(title, '')) LIKE ANY($3::text[]) THEN 0 ELSE 1 END,
          title ASC
        LIMIT $4
      `,
        [location.city, location.stateCode, patterns, resultLimit],
      );
      return rows.map(mapPlace);
    },

    async findWithinRadius(
      scope: KinfolkRadiusScope,
      limit?: number,
    ): Promise<GovernedKinfolkBusiness[]> {
      const radius = validateRadiusScope(scope);
      const resultLimit = boundedLimit(limit);
      const { rows } = await pool.query<BusinessRow>(
        `
        WITH governed_nearby AS (
          SELECT ${CANONICAL_SELECT},
            (3958.7613 * acos(LEAST(1, GREATEST(-1,
              cos(radians($1)) * cos(radians(b.latitude::double precision))
                * cos(radians(b.longitude::double precision) - radians($2))
              + sin(radians($1)) * sin(radians(b.latitude::double precision))
            )))) AS distance_miles
          FROM public.public_businesses AS b
          LEFT JOIN public.business_identity AS bi ON bi.business_id = b.id
          WHERE b.latitude IS NOT NULL
            AND b.longitude IS NOT NULL
            AND NOT ${PROVEN_DEMO_BUSINESS_SQL_PREDICATE}
        )
        SELECT *
        FROM governed_nearby
        WHERE distance_miles <= $3
        ORDER BY distance_miles ASC, verified DESC, name ASC
        LIMIT $4
      `,
        [radius.latitude, radius.longitude, radius.radiusMiles, resultLimit],
      );
      return rows.map(mapBusiness);
    },

    async findExactByNormalizedName(input: {
      name: string;
      city: string;
      stateCode: string;
    }): Promise<GovernedKinfolkBusiness | null> {
      const normalizedName = normalizeExactBusinessName(input.name);
      if (!normalizedName) throw new Error("KINFOLK_BUSINESS_NAME_INVALID");
      const location = validateKinfolkCityScope(input);
      const { rows } = await pool.query<BusinessRow>(
        `
        SELECT ${CANONICAL_SELECT}, NULL::double precision AS distance_miles
        FROM public.public_businesses AS b
        LEFT JOIN public.business_identity AS bi ON bi.business_id = b.id
        WHERE REGEXP_REPLACE(LOWER(COALESCE(b.name, '')), '[^a-z0-9]+', '', 'g') = $1
          AND LOWER(BTRIM(b.city)) = LOWER($2)
          AND UPPER(BTRIM(COALESCE(b.state, ''))) = $3
          AND NOT ${PROVEN_DEMO_BUSINESS_SQL_PREDICATE}
        ORDER BY b.verified DESC, b.confidence_score DESC NULLS LAST, b.name ASC
        LIMIT 1
      `,
        [normalizedName, location.city, location.stateCode],
      );
      return rows[0] ? mapBusiness(rows[0]) : null;
    },
  };
}

export type GovernedKinfolkBusinessRepository = ReturnType<
  typeof createGovernedKinfolkBusinessRepository
>;
