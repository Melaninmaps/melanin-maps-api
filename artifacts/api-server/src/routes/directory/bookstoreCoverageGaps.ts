type Queryable = {
  query<T>(sql: string, parameters?: unknown[]): Promise<{ rows: T[] }>;
};

export type BookstoreCoverageGap = {
  locationCell: string;
  fallbackSearches: number;
  mostRecentSearchAt: Date;
  medianNearestDistanceMiles: number | null;
};

/**
 * A product/operations aggregate, not a member profile. A cell is returned
 * only after enough independent fallback searches to avoid exposing a single
 * person's behavior. This can be run nightly or requested by an internal
 * dashboard; it is not required for a member's live directory search.
 */
export async function getBookstoreCoverageGaps(
  db: Queryable,
  options: { lookbackDays?: number; minimumSignals?: number } = {},
): Promise<BookstoreCoverageGap[]> {
  const lookbackDays = Math.min(Math.max(options.lookbackDays ?? 30, 7), 365);
  const minimumSignals = Math.min(Math.max(options.minimumSignals ?? 5, 3), 100);

  const { rows } = await db.query<{
    location_cell: string;
    fallback_searches: string;
    most_recent_search_at: Date;
    median_nearest_distance_miles: string | null;
  }>(
    `SELECT
      location_cell,
      COUNT(*)::text AS fallback_searches,
      MAX(occurred_at) AS most_recent_search_at,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY nearest_distance_miles)
        ::text AS median_nearest_distance_miles
    FROM directory_search_signals
    WHERE intent = 'bookstore'
      AND outcome = 'online_fallback'
      AND location_cell IS NOT NULL
      AND occurred_at >= NOW() - ($1::integer * INTERVAL '1 day')
    GROUP BY location_cell
    HAVING COUNT(*) >= $2
    ORDER BY COUNT(*) DESC, MAX(occurred_at) DESC`,
    [lookbackDays, minimumSignals],
  );

  return rows.map((row) => ({
    locationCell: row.location_cell,
    fallbackSearches: Number(row.fallback_searches),
    mostRecentSearchAt: new Date(row.most_recent_search_at),
    medianNearestDistanceMiles: row.median_nearest_distance_miles
      ? Number(row.median_nearest_distance_miles)
      : null,
  }));
}

/**
 * A short, neutral context string for Kinfolk's server-side retrieval layer.
 * Use it only after the live directory result has been determined. The text
 * must never claim that an area has no bookstore; it only describes verified
 * directory coverage within the search radius at that time.
 */
export function buildKinfolkBookstoreContext(input: {
  radiusMiles: number;
  closestBookstoreName: string | null;
  nearestDistanceMiles: number | null;
}): string {
  if (input.closestBookstoreName) {
    return `Directory retrieval found ${input.closestBookstoreName} as the closest verified bookstore within ${input.radiusMiles} miles.`;
  }

  if (input.nearestDistanceMiles !== null) {
    return `Directory retrieval found no verified bookstore within ${input.radiusMiles} miles. The nearest currently geocoded matching listing is ${input.nearestDistanceMiles.toFixed(1)} miles away.`;
  }

  return `Directory retrieval found no geocoded verified bookstore listing within ${input.radiusMiles} miles. State this as a directory coverage gap, not proof that no bookstore exists.`;
}
