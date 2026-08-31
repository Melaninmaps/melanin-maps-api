export type ResolvedArea = {
  id: string;
  label: string;
  cityName: string;
  stateCode: string | null;
  neighborhoodName: string | null;
  latitude: number;
  longitude: number;
};

type Queryable = {
  query<T = Record<string, unknown>>(
    sql: string,
    parameters?: unknown[],
  ): Promise<{ rows: T[] }>;
};

type ParsedLocationQuery = {
  normalized: string;
  cityOrNeighborhood: string;
  stateCode: string | null;
  approvedArea: ResolvedArea | null;
};

export type LocationResolution =
  | { kind: "resolved"; area: ResolvedArea; source: "community" | "approved_canonical" }
  | { kind: "ambiguous"; candidates: ResolvedArea[] }
  | { kind: "not_found" };

const PHILADELPHIA_AREA: ResolvedArea = Object.freeze({
  id: "89f14ab4-0f8d-4f52-97be-f12617191919",
  label: "Philadelphia, PA",
  cityName: "Philadelphia",
  stateCode: "PA",
  neighborhoodName: null,
  latitude: 39.9526,
  longitude: -75.1652,
});

const STATE_NAME_TO_CODE: Readonly<Record<string, string>> = Object.freeze({
  pennsylvania: "PA",
});

const PHILADELPHIA_APPROVED_KEYS = new Set([
  "philadelphia",
  "philadelphia pa",
  "philadelphia pennsylvania",
  "philly",
  "philly pa",
  "philly pennsylvania",
]);

/** Normalize case and punctuation without broad fuzzy or national matching. */
export function normalizeLocationQuery(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function parseLocationQuery(value: string): ParsedLocationQuery {
  const normalized = normalizeLocationQuery(value);
  if (PHILADELPHIA_APPROVED_KEYS.has(normalized)) {
    return {
      normalized,
      cityOrNeighborhood: "philadelphia",
      stateCode: "PA",
      approvedArea: PHILADELPHIA_AREA,
    };
  }

  const tokens = normalized.split(" ").filter(Boolean);
  let stateCode: string | null = null;
  const finalToken = tokens[tokens.length - 1] ?? "";
  if (/^[a-z]{2}$/.test(finalToken)) {
    stateCode = finalToken.toUpperCase();
    tokens.pop();
  } else if (STATE_NAME_TO_CODE[finalToken]) {
    stateCode = STATE_NAME_TO_CODE[finalToken];
    tokens.pop();
  }

  return {
    normalized,
    cityOrNeighborhood: tokens.join(" "),
    stateCode,
    approvedArea: null,
  };
}

function uniqueAreas(rows: ResolvedArea[]): ResolvedArea[] {
  const unique = new Map<string, ResolvedArea>();
  for (const row of rows) {
    unique.set(row.id, row);
  }
  return [...unique.values()];
}

/**
 * Resolve only canonical community rows or explicitly approved canonical areas.
 * Multiple same-name cities remain ambiguous unless a state disambiguates them.
 */
export async function resolveLocationText(
  pool: Queryable,
  rawQuery: string,
): Promise<LocationResolution> {
  const parsed = parseLocationQuery(rawQuery);
  if (!parsed.cityOrNeighborhood) return { kind: "not_found" };

  const { rows } = await pool.query<ResolvedArea>(
    `SELECT DISTINCT ON (cl.id)
       cl.id::text AS id,
       cl.city_name AS "cityName",
       cl.state_code AS "stateCode",
       cl.neighborhood_name AS "neighborhoodName",
       cl.latitude::float AS latitude,
       cl.longitude::float AS longitude,
       CASE
         WHEN cl.neighborhood_name IS NOT NULL
         THEN cl.neighborhood_name || ', ' || cl.city_name
              || COALESCE(', ' || cl.state_code, '')
         ELSE cl.city_name || COALESCE(', ' || cl.state_code, '')
       END AS label
     FROM community_locations cl
     LEFT JOIN community_location_aliases cla
       ON cla.location_id = cl.id
      AND cla.moderation_status = 'approved'
     WHERE (
       (LOWER(BTRIM(cl.city_name)) = $1 AND cl.neighborhood_name IS NULL)
       OR (cl.neighborhood_name IS NOT NULL AND LOWER(BTRIM(cl.neighborhood_name)) = $1)
       OR LOWER(BTRIM(cla.alias)) = $1
     )
       AND ($2::text IS NULL OR UPPER(cl.state_code) = $2)
     ORDER BY cl.id,
       CASE
         WHEN LOWER(BTRIM(cl.city_name)) = $1 AND cl.neighborhood_name IS NULL THEN 0
         WHEN LOWER(BTRIM(cla.alias)) = $1 THEN 1
         ELSE 2
       END
     LIMIT 25`,
    [parsed.cityOrNeighborhood, parsed.stateCode],
  );

  const candidates = uniqueAreas(rows);
  if (candidates.length === 1) {
    return { kind: "resolved", area: candidates[0], source: "community" };
  }
  if (candidates.length > 1) {
    return { kind: "ambiguous", candidates };
  }

  // This narrow, reviewed fallback prevents an unseeded community_locations
  // table from breaking a launched city. It never expands to national results.
  if (parsed.approvedArea) {
    return { kind: "resolved", area: parsed.approvedArea, source: "approved_canonical" };
  }

  return { kind: "not_found" };
}
