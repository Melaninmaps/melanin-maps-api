/**
 * pool-instrumentation.ts
 *
 * Lightweight per-connection lifecycle tracking that runs in production
 * without meaningful overhead.
 *
 * Attaches to the pg.Pool event system plus wraps pool.query() to time
 * individual queries. Results are held in a fixed-size ring buffer and
 * exposed to the /api/internal/pool-audit route.
 *
 * ─── What it tracks ─────────────────────────────────────────────────────────
 *   connect   — a NEW physical TCP connection was opened to Postgres
 *   remove    — a physical connection was closed and removed from the pool
 *   query     — pool.query() started and finished (with duration)
 *   slow      — a query that took longer than SLOW_QUERY_MS
 *   error     — an idle client emitted an error
 *
 * ─── What it does NOT track ─────────────────────────────────────────────────
 *   pool.connect() checkouts — those 5 locations already log explicitly
 *   and all have finally { client.release() } guards.
 *
 * ─── How to read the output ─────────────────────────────────────────────────
 *   If pool.totalCount keeps growing over time and never falls, you have a
 *   leak from an unreleased pool.connect() client.
 *
 *   If pool.waitingCount is non-zero and slow queries appear in the log,
 *   you have a hot-path query that holds connections too long.
 *
 *   If "connect" events fire on every request, you have a per-request pool
 *   creation somewhere — that is the StripeSync bug pattern.
 */
import type { Pool } from "pg";
export interface PoolEvent {
    ts: string;
    type: "connect" | "remove" | "query" | "slow" | "error" | "acquire";
    ms?: number;
    sql?: string;
    caller?: string;
    pool?: {
        total: number;
        idle: number;
        waiting: number;
    };
    detail?: string;
}
/**
 * Call once at server startup, after the pool singleton is created.
 * Safe to call multiple times — only attaches listeners once.
 */
export declare function initPoolInstrumentation(pool: Pool, getRealPool?: () => Pool): void;
/**
 * Return recent pool events (newest last). Pass `limit` to cap the result.
 */
export declare function getPoolAuditLog(limit?: number): PoolEvent[];
/**
 * Return a summary: counts by type, most recent slow queries,
 * and current growth trend.
 */
export declare function getPoolAuditSummary(): {
    counts: Record<string, number>;
    peakTotal: number;
    peakWaiting: number;
    slowQueriesInWindow: PoolEvent[];
    ringSize: number;
    ringCapacity: number;
};
//# sourceMappingURL=pool-instrumentation.d.ts.map