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
 */
export declare const POOL_MAX = 20;
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
//# sourceMappingURL=index.d.ts.map