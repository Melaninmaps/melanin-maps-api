import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
interface DbLogger {
    info(data: object | string, msg?: string): void;
    error(data: object | string, msg?: string): void;
    warn(data: object | string, msg?: string): void;
}
export declare function setDbLogger(logger: DbLogger): void;
/**
 * Maximum connections in the application pg.Pool.
 * Total live DB connections: POOL_MAX (app) + 2 (StripeSync) = POOL_MAX + 2.
 * Exported so readyz and healthMonitor use the same value rather than hardcoding it.
 *
 * Increased 8→20 (July 28 2026) after recurring pool exhaustion P0:
 *   - 11 parallel HTTP checks in build97Monitor each hit DB-backed handlers
 *   - Railway healthcheck polls /api/readyz on ~10s interval
 *   - healthMonitor fires pool.connect() every 5 min
 *   - Combined peak demand exceeded 8 slots → all slots held as zombies
 * 20 provides headroom for: production traffic + Railway healthchecks +
 * healthMonitor probe + any background jobs, without saturation.
 *
 * Increased 35→50 (Aug 12 2026) after 30-user canary showed pool exhaustion:
 *   - 30 simultaneous logins (3–8 s each) + overlapping post-login reads
 *     saturated 35 slots in a 166 ms burst window → 19/30 journeys failed
 *   - PostgreSQL max_connections = 112; StripeSync = 2 → 50 leaves 60 spare
 *   - Auth middleware per-request TTL cache added in same commit to further
 *     reduce pool pressure during coordinated arrival bursts
 */
export declare const POOL_MAX = 50;
declare function getPool(): pg.Pool;
/** Read-only pool health snapshot for logging and /api/readyz. */
export declare function getPoolStats(): {
    total: number;
    idle: number;
    waiting: number;
};
/** Expose the real pg.Pool instance for internal use (pool-instrumentation reaper).
 *  Do NOT use this in route handlers — always use the exported `pool` Proxy
 *  so the lazy-init singleton pattern is preserved. */
export { getPool };
export declare const pool: pg.Pool;
export declare const db: ReturnType<typeof drizzle<typeof schema>>;
export * from "./schema";
export { initPoolInstrumentation, getPoolAuditLog, getPoolAuditSummary } from "./pool-instrumentation";
export type { PoolEvent } from "./pool-instrumentation";
export { BUSINESS_CATEGORY_TAXONOMY, MAIN_CATEGORY_NAMES, SUBCATEGORY_MAP, ALL_SUBCATEGORY_NAMES, LEGACY_CATEGORY_NAMES, ALL_VALID_CATEGORY_NAMES, } from "./constants/business-categories";
export type { BusinessCategory } from "./constants/business-categories";
export { OWNERSHIP_DESIGNATIONS, BLACK_OWNED_DESIGNATIONS, isBlackOwned, } from "./constants/ownership-designations";
export type { OwnershipDesignation } from "./constants/ownership-designations";
export { VIBES_BY_CATEGORY, ALL_VIBE_LABELS, VIBE_ELIGIBLE_CATEGORIES, isVibeEligible, } from "./constants/vibe-labels";
export type { VibeLabel } from "./constants/vibe-labels";
export { ENDORSEMENT_TAGS, ENDORSEMENT_CATEGORY_MAP, ENDORSEMENT_DISPLAY_THRESHOLD, getTagsForCategory, } from "./constants/endorsement-tags";
export type { EndorsementTagDef } from "./constants/endorsement-tags";
export { ENDORSEMENT_TAG_VARIANTS, COMMUNITY_CODES, } from "./constants/endorsement-tag-variants";
export type { EndorsementTagVariantDef, CommunityCode } from "./constants/endorsement-tag-variants";
export { THE_REAL_TAGS, THE_REAL_CATEGORY_MAP, THE_REAL_CATEGORIES, THE_REAL_DISPLAY_THRESHOLD, HEALTH_VIBE_SUBCATEGORIES, usesTheReal, getTheRealTagsForCategory, } from "./constants/the-real-tags";
export type { TheRealTag, TheRealTagType } from "./constants/the-real-tags";
//# sourceMappingURL=index.d.ts.map