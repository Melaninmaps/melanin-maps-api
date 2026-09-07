import type { CoverageGap, LocationFirstQuery, DiscoveryRecord } from "../shared/discoveryContracts";
import type { LocationFirstDiscoveryRepository } from "./locationFirstDiscovery";

type Queryable = {
  query<T = Record<string, unknown>>(sql: string, parameters?: unknown[]): Promise<{ rows: T[] }>;
};

export type PrivacySafeDiscoveryAggregate = {
  day: string;
  surface: string;
  action: string;
  recordType: string;
  count: number;
};

/**
 * Returns only k-anonymous coarse aggregate cells. Member identity, request
 * IDs, result IDs, query text, filters, and coordinates never leave SQL.
 */
export async function readPrivacySafeDiscoveryAggregates(
  db: Queryable,
  fromDay: string,
  toDay: string,
  minimumCellSize = 5,
): Promise<PrivacySafeDiscoveryAggregate[]> {
  const result = await db.query<{
    day: string; surface: string; action: string; record_type: string; count: number;
  }>(`
    SELECT created_at::date::text AS day, surface, event_name AS action,
           COALESCE(record_type, 'none') AS record_type, COUNT(*)::integer AS count
    FROM discovery_events_v1
    WHERE deleted_at IS NULL AND created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
    GROUP BY created_at::date, surface, event_name, COALESCE(record_type, 'none')
    HAVING COUNT(*) >= $3
    ORDER BY created_at::date DESC, surface, event_name, record_type
  `, [fromDay, toDay, Math.max(5, Math.min(100, Math.floor(minimumCellSize)))]);
  return result.rows.map((row) => ({
    day: row.day, surface: row.surface, action: row.action,
    recordType: row.record_type, count: Number(row.count),
  }));
}

export function createPostgresDiscoverySignalRepository(
  db: Queryable,
): Pick<LocationFirstDiscoveryRepository, "recordCoverageGap" | "recordFlywheelSignal"> {
  return {
    async recordCoverageGap(gap: CoverageGap) {
      // Normalize values to match the simple UNIQUE index on the table.
      await db.query(
        `INSERT INTO discovery_coverage_gaps
           (city_name, state_code, record_type, category, specialty_slug)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (city_name, state_code, record_type, category, specialty_slug)
         DO UPDATE SET
           last_observed_at = NOW(),
           observation_count = discovery_coverage_gaps.observation_count + 1`,
        [
          (gap.city ?? "").toLowerCase(),
          (gap.stateCode ?? "").toUpperCase(),
          gap.recordType,
          (gap.category ?? "").toLowerCase(),
          gap.specialty ?? "",
        ],
      );
    },

    async recordFlywheelSignal(input) {
      await db.query(
        `INSERT INTO discovery_flywheel_daily_signals
           (day, surface, action, city_name, state_code, record_type, category, specialty_slug, count)
         VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, 1)
         ON CONFLICT (day, surface, action, city_name, state_code, record_type, category, specialty_slug)
         DO UPDATE SET count = discovery_flywheel_daily_signals.count + 1`,
        [
          input.surface,
          input.action,
          input.city ?? "",
          input.stateCode ?? "",
          input.recordType ?? "none",
          input.category ?? "",
          input.specialty ?? "",
        ],
      );
    },
  };
}

export function createPostgresFlywheelRepository(
  db: Queryable,
  dependencies: {
    findExact(query: LocationFirstQuery): Promise<DiscoveryRecord[]>;
    findNearestAvailableLocation(query: LocationFirstQuery): Promise<{ city: string; stateCode: string | null; distanceMiles: number | null } | null>;
  },
): LocationFirstDiscoveryRepository {
  return {
    findExact: dependencies.findExact,
    findNearestAvailableLocation: dependencies.findNearestAvailableLocation,
    ...createPostgresDiscoverySignalRepository(db),
  };
}
