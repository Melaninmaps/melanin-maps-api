import type { Pool } from "pg";
import { PROVEN_DEMO_BUSINESS_SQL_PREDICATE } from "../businesses/businessDemoContainment";
import {
  businessSubjectSearchPatterns,
  deriveBusinessSubject,
} from "../kinfolk/business-subject";

export type LocalSearchRequest = {
  query: string;
  latitude: number;
  longitude: number;
  radiusMi?: 5 | 10 | 25;
  limit?: number;
  expansionAccepted?: boolean;
  city?: string;
  stateCode?: string;
};

export type LocalBusinessResult = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  stateCode: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMi: number | null;
  detailUrl: string;
};

export type LocalSearchResponse = {
  scope: "local" | "expanded";
  radiusMi: number;
  limit: number;
  totalRelevantListings: number;
  pinnableCount: number;
  results: LocalBusinessResult[];
  pins: LocalBusinessResult[];
  expansion: {
    available: boolean;
    nextRadiusMi: 10 | 25 | null;
    message: string | null;
  };
};

type LocalBusinessRow = LocalBusinessResult & {
  totalRelevantListings?: number | string;
  pinnableCount?: number | string;
};

const DEFAULT_RADIUS_MI = 5;
const DEFAULT_PIN_LIMIT = 2;

function genericSearchPattern(query: string): string {
  return `\\m${query
    .trim()
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/[\s-]+/g, "[[:space:]-]+")}\\M`;
}

export function localBusinessSearchPatterns(query: string): string[] {
  const governedSubject = deriveBusinessSubject(query);
  return governedSubject
    ? businessSubjectSearchPatterns(governedSubject)
    : [genericSearchPattern(query)];
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidMapCoordinatePair(
  latitude: unknown,
  longitude: unknown,
): boolean {
  const lat = numberOrNull(latitude);
  const lng = numberOrNull(longitude);
  return lat !== null && lng !== null
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180
    && !(lat === 0 && lng === 0);
}

export class LocalBusinessSearch {
  constructor(private readonly pool: Pool) {}

  async search(input: LocalSearchRequest): Promise<LocalSearchResponse> {
    const requestedRadius = input.radiusMi ?? DEFAULT_RADIUS_MI;
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_PIN_LIMIT, 1), DEFAULT_PIN_LIMIT);
    const radiusMi = input.expansionAccepted ? requestedRadius : DEFAULT_RADIUS_MI;
    const q = input.query.trim();
    if (!q) throw new Error("SEARCH_QUERY_REQUIRED");
    const patterns = localBusinessSearchPatterns(q);

    // Classification, governed specialty, tags, and explicit offering evidence
    // are the only service-match sources. Descriptions and other prose are not a
    // taxonomy, so AMINA's incidental “books fast” copy cannot match bookstore.
    // Unpinned rows are retained only for an explicitly resolved city/ZIP. They
    // never consume the two nearest-pins allowance or suppress expansion.
    const { rows } = await this.pool.query<LocalBusinessRow>(
      `WITH specialty_evidence AS (
        SELECT specialty.business_id::text AS business_id,
               array_agg(specialty.specialty_slug ORDER BY specialty.specialty_slug) AS specialties
        FROM public.business_specialties AS specialty
        GROUP BY specialty.business_id::text
      ), relevant AS (
        SELECT
          b.id::text AS id,
          b.name,
          b.category,
          b.subcategory,
          b.city,
          b.state AS "stateCode",
          b.postal_code,
          COALESCE(specialty_evidence.specialties, ARRAY[]::text[]) AS specialties,
          COALESCE(b.tags, '[]'::jsonb) AS tags,
          CASE WHEN
            b.latitude IS NOT NULL AND b.longitude IS NOT NULL
            AND b.latitude::numeric BETWEEN -90 AND 90
            AND b.longitude::numeric BETWEEN -180 AND 180
            AND (b.latitude::numeric <> 0 OR b.longitude::numeric <> 0)
          THEN b.latitude::double precision END AS latitude,
          CASE WHEN
            b.latitude IS NOT NULL AND b.longitude IS NOT NULL
            AND b.latitude::numeric BETWEEN -90 AND 90
            AND b.longitude::numeric BETWEEN -180 AND 180
            AND (b.latitude::numeric <> 0 OR b.longitude::numeric <> 0)
          THEN b.longitude::double precision END AS longitude,
          CASE WHEN
            b.latitude IS NOT NULL AND b.longitude IS NOT NULL
            AND b.latitude::numeric BETWEEN -90 AND 90
            AND b.longitude::numeric BETWEEN -180 AND 180
            AND (b.latitude::numeric <> 0 OR b.longitude::numeric <> 0)
          THEN (3958.7613 * acos(least(1, greatest(-1,
            cos(radians($1)) * cos(radians(b.latitude::double precision))
              * cos(radians(b.longitude::double precision) - radians($2))
              + sin(radians($1)) * sin(radians(b.latitude::double precision))
          )))) END AS "distanceMi"
        FROM public.public_businesses AS b
        LEFT JOIN specialty_evidence ON specialty_evidence.business_id = b.id::text
        WHERE NOT ${PROVEN_DEMO_BUSINESS_SQL_PREDICATE}
          AND COALESCE(b.promotion_eligible, true) = true
          AND (
            LOWER(COALESCE(b.name, '')) ~ ANY($3::text[])
            OR LOWER(COALESCE(b.category, '')) ~ ANY($3::text[])
            OR LOWER(COALESCE(b.subcategory, '')) ~ ANY($3::text[])
            OR EXISTS (
              SELECT 1
              FROM unnest(COALESCE(specialty_evidence.specialties, ARRAY[]::text[])) AS governed_specialty(value)
              WHERE LOWER(BTRIM(governed_specialty.value)) ~ ANY($3::text[])
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(COALESCE(b.tags, '[]'::jsonb)) AS explicit_offering(value)
              WHERE LOWER(BTRIM(explicit_offering.value)) ~ ANY($3::text[])
            )
          )
      ), scoped AS (
        SELECT *,
          COUNT(*) OVER () AS "totalRelevantListings",
          COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) OVER () AS "pinnableCount",
          CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
            THEN ROW_NUMBER() OVER (
              PARTITION BY (latitude IS NOT NULL AND longitude IS NOT NULL)
              ORDER BY "distanceMi" ASC NULLS LAST, name ASC
            )
          END AS pin_rank
        FROM relevant
        WHERE "distanceMi" <= $4
          OR (
            latitude IS NULL AND longitude IS NULL
            AND NULLIF($6, '') IS NOT NULL
            AND (
              LOWER(BTRIM(COALESCE(city, ''))) = LOWER(BTRIM($6))
              OR BTRIM(COALESCE(postal_code, '')) = BTRIM($6)
            )
            AND (NULLIF($7, '') IS NULL OR UPPER(BTRIM(COALESCE("stateCode", ''))) = UPPER(BTRIM($7)))
          )
      )
      SELECT
        id,
        name,
        category,
        city,
        "stateCode",
        latitude,
        longitude,
        "distanceMi",
        '/businesses/' || id AS "detailUrl",
        "totalRelevantListings",
        "pinnableCount"
      FROM scoped
      WHERE latitude IS NULL OR longitude IS NULL OR pin_rank <= $5
      ORDER BY "distanceMi" ASC NULLS LAST, name ASC`,
      [
        input.latitude,
        input.longitude,
        patterns,
        radiusMi,
        limit,
        input.city ?? "",
        input.stateCode ?? "",
      ],
    );

    const results = rows.map((row): LocalBusinessResult => ({
      id: String(row.id),
      name: row.name,
      category: row.category,
      city: row.city,
      stateCode: row.stateCode,
      latitude: numberOrNull(row.latitude),
      longitude: numberOrNull(row.longitude),
      distanceMi: numberOrNull(row.distanceMi),
      detailUrl: `/businesses/${encodeURIComponent(String(row.id))}`,
    }));
    const pins = results.filter((row) =>
      isValidMapCoordinatePair(row.latitude, row.longitude),
    );
    const totalRelevantListings = Number(rows[0]?.totalRelevantListings ?? results.length);
    const pinnableCount = Number(rows[0]?.pinnableCount ?? pins.length);
    const expansion = this.nextExpansion(radiusMi, pinnableCount);

    return {
      scope: radiusMi === DEFAULT_RADIUS_MI ? "local" : "expanded",
      radiusMi,
      limit,
      totalRelevantListings,
      pinnableCount,
      results,
      pins,
      expansion,
    };
  }

  private nextExpansion(
    radiusMi: number,
    pinnableCount: number,
  ): LocalSearchResponse["expansion"] {
    if (pinnableCount >= DEFAULT_PIN_LIMIT || radiusMi >= 25) {
      return { available: false, nextRadiusMi: null, message: null };
    }
    const nextRadiusMi = radiusMi === 5 ? 10 : radiusMi === 10 ? 25 : null;
    return nextRadiusMi
      ? {
          available: true,
          nextRadiusMi,
          message: `${pinnableCount || "No"} mapped result${pinnableCount === 1 ? "" : "s"} nearby. Search within ${nextRadiusMi} miles?`,
        }
      : { available: false, nextRadiusMi: null, message: null };
  }
}
