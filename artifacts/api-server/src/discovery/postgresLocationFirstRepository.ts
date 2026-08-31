/**
 * Postgres implementation of findExact + findNearestAvailableLocation.
 * All queries go through canonical_record_locations so Map, Businesses,
 * Explore, and Events always see the same location-scoped inventory.
 */
import { getBusinessCategorySearchAliases } from "@workspace/constants";
import type { DiscoveryRecord, LocationFirstQuery } from "../shared/discoveryContracts";

type Pool = { query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> };
type SearchableLocationFirstQuery = LocationFirstQuery & {
  filters: LocationFirstQuery["filters"] & { searchText?: string };
  searchText?: string;
};

function foldedSql(column: string): string {
  return `BTRIM(REGEXP_REPLACE(LOWER(COALESCE(${column}, '')), '[^a-z0-9]+', ' ', 'g'))`;
}

function aliasMatchSql(categoryColumn: string, subcategoryColumn: string, parameter: number): string {
  return `(${foldedSql(categoryColumn)} = ANY($${parameter}::text[]) OR ${foldedSql(subcategoryColumn)} = ANY($${parameter}::text[]))`;
}

// ── Haversine distance (miles) helper injected as SQL expression ──────────────
function haversineMiles(latCol: string, lngCol: string, lat: number, lng: number): string {
  return `(
    3958.8 * acos(
      LEAST(1.0, cos(radians(${lat})) * cos(radians(${latCol}::numeric))
      * cos(radians(${lngCol}::numeric) - radians(${lng}))
      + sin(radians(${lat})) * sin(radians(${latCol}::numeric)))
    )
  )`;
}

export async function findExactRecords(
  pool: Pool,
  query: LocationFirstQuery,
): Promise<DiscoveryRecord[]> {
  const city = (query.location.city ?? "").toLowerCase();
  const state = query.location.stateCode ? query.location.stateCode.toUpperCase() : null;
  const specialty = query.filters.specialty ?? null;
  const category = query.filters.category ?? null;
  const searchableQuery = query as SearchableLocationFirstQuery;
  const searchText = searchableQuery.filters.searchText ?? searchableQuery.searchText ?? null;
  const recordTypes = query.filters.recordTypes;

  const results: DiscoveryRecord[] = [];

  // ── Business records ────────────────────────────────────────────────────────
  if (recordTypes.includes("business")) {
    const params: unknown[] = [city];
    let stateClause = "";
    if (state) { params.push(state); stateClause = `AND UPPER(l.state_code) = $${params.length}`; }
    let specialtyClause = "";
    if (specialty) { params.push(specialty); specialtyClause = `AND bs.specialty_slug = $${params.length}`; }
    let categoryClause = "";
    if (category) {
      params.push(getBusinessCategorySearchAliases(category));
      categoryClause = `AND ${aliasMatchSql("b.category", "b.subcategory", params.length)}`;
    }
    let searchClause = "";
    if (searchText) {
      params.push(`%${searchText}%`);
      const textParameter = params.length;
      params.push(getBusinessCategorySearchAliases(searchText));
      const aliasesParameter = params.length;
      searchClause = `AND (
        b.name ILIKE $${textParameter}
        OR b.category ILIKE $${textParameter}
        OR b.subcategory ILIKE $${textParameter}
        OR b.description ILIKE $${textParameter}
        OR ${aliasMatchSql("b.category", "b.subcategory", aliasesParameter)}
      )`;
    }

    const { rows } = await pool.query<{
      id: string; name: string; category: string | null; specialty: string | null;
      city: string; state_code: string | null; neighborhood: string | null;
      lat: string | null; lng: string | null; is_verified: boolean;
    }>(`
      SELECT DISTINCT ON (b.id)
        b.id, b.name, b.category, bs.specialty_slug AS specialty,
        l.city_name AS city, l.state_code, l.neighborhood_name AS neighborhood,
        l.latitude::text AS lat, l.longitude::text AS lng,
        COALESCE(b.verified, FALSE) AS is_verified
      FROM public.public_businesses b
      JOIN canonical_record_locations l
        ON l.record_type = 'business' AND l.record_id = b.id::uuid
      LEFT JOIN business_specialties bs ON bs.business_id = b.id
      WHERE LOWER(l.city_name) = $1
        ${stateClause}
        ${specialtyClause}
        ${categoryClause}
        ${searchClause}
      ORDER BY b.id, b.confidence_score DESC NULLS LAST
      LIMIT 100
    `, params);

    results.push(...rows.map(r => ({
      id: r.id,
      recordType: "business" as const,
      name: r.name,
      category: r.category,
      specialty: r.specialty,
      city: r.city,
      stateCode: r.state_code,
      neighborhood: r.neighborhood,
      latitude: r.lat ? parseFloat(r.lat) : null,
      longitude: r.lng ? parseFloat(r.lng) : null,
      distanceMiles: null,
      detailUrl: `/businesses/${r.id}`,
      isVerified: Boolean(r.is_verified),
      contextTags: [],
    })));
  }

  // ── Cultural site records ───────────────────────────────────────────────────
  if (recordTypes.includes("cultural_site")) {
    const params: unknown[] = [city];
    let stateClause = "";
    if (state) { params.push(state); stateClause = `AND UPPER(l.state_code) = $${params.length}`; }
    let searchClause = "";
    if (searchText) { params.push(`%${searchText}%`); searchClause = `AND tc.name ILIKE $${params.length}`; }

    const { rows } = await pool.query<{
      id: string; name: string; site_type: string | null;
      city: string; state_code: string | null; neighborhood: string | null;
      lat: string | null; lng: string | null;
    }>(`
      SELECT tc.id, tc.name, tc.site_type, l.city_name AS city, l.state_code,
             l.neighborhood_name AS neighborhood, l.latitude::text AS lat, l.longitude::text AS lng
      FROM tour_cultural_sites tc
      JOIN canonical_record_locations l
        ON l.record_type = 'cultural_site' AND l.record_id = tc.id::uuid
      WHERE tc.is_active = TRUE AND LOWER(l.city_name) = $1
        ${stateClause} ${searchClause}
      LIMIT 50
    `, params);

    results.push(...rows.map(r => ({
      id: r.id, recordType: "cultural_site" as const,
      name: r.name, category: r.site_type, specialty: null,
      city: r.city, stateCode: r.state_code, neighborhood: r.neighborhood,
      latitude: r.lat ? parseFloat(r.lat) : null,
      longitude: r.lng ? parseFloat(r.lng) : null,
      distanceMiles: null, detailUrl: `/tour-cultural-sites/${r.id}`,
      isVerified: true, contextTags: [],
    })));
  }

  // ── Event records ───────────────────────────────────────────────────────────
  if (recordTypes.includes("event")) {
    const params: unknown[] = [city];
    let stateClause = "";
    if (state) { params.push(state); stateClause = `AND UPPER(l.state_code) = $${params.length}`; }
    let dateClause = "";
    const dateRange = query.filters.dateRange;
    if (dateRange === "today") dateClause = "AND re.active_until >= CURRENT_DATE AND re.active_until < CURRENT_DATE + INTERVAL '1 day'";
    else if (dateRange === "weekend") dateClause = "AND re.active_until >= date_trunc('week', CURRENT_DATE) + INTERVAL '5 days' AND re.active_until < date_trunc('week', CURRENT_DATE) + INTERVAL '8 days'";
    else if (dateRange === "month") dateClause = "AND re.active_until >= CURRENT_DATE AND re.active_until < CURRENT_DATE + INTERVAL '30 days'";
    else dateClause = "AND (re.active_until IS NULL OR re.active_until >= CURRENT_DATE)";

    const { rows } = await pool.query<{
      id: string; name: string; category: string | null;
      city: string; state_code: string | null; neighborhood: string | null;
      lat: string | null; lng: string | null;
    }>(`
      SELECT re.id, re.name, re.category, l.city_name AS city, l.state_code,
             l.neighborhood_name AS neighborhood, l.latitude::text AS lat, l.longitude::text AS lng
      FROM recurring_events re
      JOIN canonical_record_locations l
        ON l.record_type = 'event' AND l.record_id = re.id::uuid
      WHERE re.is_active = TRUE AND LOWER(l.city_name) = $1
        ${stateClause} ${dateClause}
      LIMIT 50
    `, params);

    results.push(...rows.map(r => ({
      id: r.id, recordType: "event" as const,
      name: r.name, category: r.category, specialty: null,
      city: r.city, stateCode: r.state_code, neighborhood: r.neighborhood,
      latitude: r.lat ? parseFloat(r.lat) : null,
      longitude: r.lng ? parseFloat(r.lng) : null,
      distanceMiles: null, detailUrl: `/recurring-events/${r.id}`,
      isVerified: true, contextTags: [],
    })));
  }

  // ── Community place records ─────────────────────────────────────────────────
  if (recordTypes.includes("community_place")) {
    const params: unknown[] = [city];
    let stateClause = "";
    if (state) { params.push(state); stateClause = `AND UPPER(l.state_code) = $${params.length}`; }

    const { rows } = await pool.query<{
      id: string; name: string; mission: string | null;
      city: string; state_code: string | null; neighborhood: string | null;
      lat: string | null; lng: string | null;
    }>(`
      SELECT co.id, co.name, co.mission, l.city_name AS city, l.state_code,
             l.neighborhood_name AS neighborhood, l.latitude::text AS lat, l.longitude::text AS lng
      FROM community_organizations co
      JOIN canonical_record_locations l
        ON l.record_type = 'community_place' AND l.record_id = co.id::uuid
      WHERE LOWER(l.city_name) = $1 ${stateClause}
      LIMIT 30
    `, params);

    results.push(...rows.map(r => ({
      id: r.id, recordType: "community_place" as const,
      name: r.name, category: r.mission?.slice(0, 50) ?? null, specialty: null,
      city: r.city, stateCode: r.state_code, neighborhood: r.neighborhood,
      latitude: r.lat ? parseFloat(r.lat) : null,
      longitude: r.lng ? parseFloat(r.lng) : null,
      distanceMiles: null, detailUrl: `/community-orgs/${r.id}`,
      isVerified: true, contextTags: [],
    })));
  }

  return results;
}

export async function findNearestAvailableLocation(
  pool: Pool,
  query: LocationFirstQuery,
): Promise<{ city: string; stateCode: string | null; distanceMiles: number | null } | null> {
  const city = (query.location.city ?? "").toLowerCase();
  const recordType = query.filters.recordTypes[0] ?? "business";

  // Fast path: find other cities that have records of the same type.
  const { rows } = await pool.query<{ city_name: string; state_code: string | null }>(`
    SELECT DISTINCT l.city_name, l.state_code
    FROM canonical_record_locations l
    WHERE l.record_type = $1
      AND LOWER(l.city_name) != $2
    ORDER BY l.city_name
    LIMIT 5
  `, [recordType, city]);

  if (!rows.length) return null;

  // If we have the query lat/lng, compute distance to the nearest city.
  const queryLat = query.location.latitude;
  const queryLng = query.location.longitude;

  if (queryLat && queryLng) {
    const { rows: distRows } = await pool.query<{ city_name: string; state_code: string | null; dist: string }>(`
      SELECT DISTINCT l.city_name, l.state_code,
        ${haversineMiles("l.latitude", "l.longitude", queryLat, queryLng)} AS dist
      FROM canonical_record_locations l
      WHERE l.record_type = $1
        AND LOWER(l.city_name) != $2
        AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
      ORDER BY dist ASC
      LIMIT 1
    `, [recordType, city]);
    if (distRows[0]) {
      return { city: distRows[0].city_name, stateCode: distRows[0].state_code, distanceMiles: parseFloat(distRows[0].dist) };
    }
  }

  return { city: rows[0].city_name, stateCode: rows[0].state_code, distanceMiles: null };
}
