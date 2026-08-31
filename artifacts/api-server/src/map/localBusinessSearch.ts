import { getBusinessCategorySearchAliases } from "@workspace/constants";
import type { Pool } from "pg";

function foldedSql(column: string): string {
  return `BTRIM(REGEXP_REPLACE(LOWER(COALESCE(${column}, '')), '[^a-z0-9]+', ' ', 'g'))`;
}

export type LocalSearchRequest = {
  query: string;
  latitude: number;
  longitude: number;
  radiusMi?: 5 | 10 | 25;
  limit?: number;
  expansionAccepted?: boolean;
};

export type LocalBusinessResult = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  stateCode: string | null;
  latitude: number;
  longitude: number;
  distanceMi: number;
  detailUrl: string;
};

export type LocalSearchResponse = {
  scope: "local" | "expanded";
  radiusMi: number;
  limit: number;
  results: LocalBusinessResult[];
  pins: LocalBusinessResult[];
  expansion: {
    available: boolean;
    nextRadiusMi: 10 | 25 | null;
    message: string | null;
  };
};

const DEFAULT_RADIUS_MI = 5;
const DEFAULT_LIMIT = 2;

export class LocalBusinessSearch {
  constructor(private readonly pool: Pool) {}

  async search(input: LocalSearchRequest): Promise<LocalSearchResponse> {
    const requestedRadius = input.radiusMi ?? DEFAULT_RADIUS_MI;
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), DEFAULT_LIMIT);
    const radiusMi = input.expansionAccepted ? requestedRadius : DEFAULT_RADIUS_MI;
    const q = input.query.trim();
    if (!q) throw new Error("SEARCH_QUERY_REQUIRED");
    const categoryAliases = getBusinessCategorySearchAliases(q);

    // Haversine distance is calculated inside PostgreSQL and constrained by HAVING.
    // No client-side post-filter or generic national fallback may add records outside
    // this radius. `pins` intentionally mirrors `results` so the map cannot display
    // any record absent from the left result list, and vice versa.
    const { rows } = await this.pool.query<LocalBusinessResult>(
      `WITH nearby AS (
        SELECT
          b.id,
          b.slug,
          b.name,
          b.category,
          b.city,
          b.state AS "stateCode",
          b.latitude,
          b.longitude,
          (3958.7613 * acos(least(1, greatest(-1,
            cos(radians($2)) * cos(radians(b.latitude)) * cos(radians(b.longitude) - radians($3)) +
            sin(radians($2)) * sin(radians(b.latitude))
          )))) AS "distanceMi"
        FROM public.public_businesses b
        WHERE b.latitude IS NOT NULL
          AND b.longitude IS NOT NULL
          AND (
            to_tsvector('simple',
              coalesce(b.name, '') || ' ' ||
              coalesce(b.category, '') || ' ' ||
              coalesce(b.subcategory, '') || ' ' ||
              coalesce(b.description, ''))
              @@ websearch_to_tsquery('simple', $1)
            OR ${foldedSql("b.category")} = ANY($6::text[])
            OR ${foldedSql("b.subcategory")} = ANY($6::text[])
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
        '/businesses/' || id || '/' || coalesce(slug, id) AS "detailUrl"
      FROM nearby
      WHERE "distanceMi" <= $4
      ORDER BY "distanceMi" ASC, name ASC
      LIMIT $5`,
      [q, input.latitude, input.longitude, radiusMi, limit, categoryAliases],
    );

    const expansion = this.nextExpansion(radiusMi, rows.length);
    return {
      scope: input.expansionAccepted ? "expanded" : "local",
      radiusMi,
      limit,
      results: rows,
      pins: rows, // intentional alias — map and list are always the same set
      expansion,
    };
  }

  private nextExpansion(
    radiusMi: number,
    resultCount: number,
  ): LocalSearchResponse["expansion"] {
    if (resultCount >= DEFAULT_LIMIT || radiusMi >= 25) {
      return { available: false, nextRadiusMi: null, message: null } as const;
    }
    const nextRadiusMi = radiusMi === 5 ? 10 : radiusMi === 10 ? 25 : null;
    return nextRadiusMi
      ? {
          available: true,
          nextRadiusMi,
          message: `Only ${resultCount || "no"} nearby result${resultCount === 1 ? "" : "s"} found. Search within ${nextRadiusMi} miles?`,
        }
      : { available: false, nextRadiusMi: null, message: "No additional nearby search area is available." };
  }
}
