import type { CoverageGap, LocationFirstQuery, DiscoveryRecord } from "../shared/discoveryContracts";
import type { LocationFirstDiscoveryRepository } from "./locationFirstDiscovery";

type Queryable = {
  query<T = Record<string, unknown>>(sql: string, parameters?: unknown[]): Promise<{ rows: T[] }>;
};

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
