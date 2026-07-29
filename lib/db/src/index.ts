import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// ─── Injectable logger ─────────────────────────────────────────────────────
// Defaults to console so the library works standalone.
// Call setDbLogger(pinoInstance) from the API server at startup to route
// pool events through the structured pino logger instead.
interface DbLogger {
  info(data: object | string, msg?: string): void;
  error(data: object | string, msg?: string): void;
  warn(data: object | string, msg?: string): void;
}

let _logger: DbLogger = {
  info: (data, msg) => console.info(
    JSON.stringify({ msg: msg ?? "[db-pool]", ...(typeof data === "object" ? data : { detail: data }) })
  ),
  error: (data, msg) => console.error(
    JSON.stringify({ msg: msg ?? "[db-pool]", ...(typeof data === "object" ? data : { detail: data }) })
  ),
  warn: (data, msg) => console.warn(
    JSON.stringify({ msg: msg ?? "[db-pool]", ...(typeof data === "object" ? data : { detail: data }) })
  ),
};

export function setDbLogger(logger: DbLogger): void {
  _logger = logger;
}

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
export const POOL_MAX = 20;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    const url = process.env.DATABASE_URL;
    const noSsl = !url || url.includes("localhost") || url.includes("127.0.0.1") || url.includes(".internal");
    const ssl = noSsl ? false : { rejectUnauthorized: false };

    _pool = new Pool({
      connectionString: url,
      ssl,
      // ─── Connection lifecycle ──────────────────────────────────────────────
      // How long to wait for a free slot in the pool before throwing.
      // A clear timeout here means callers get an error quickly instead of
      // queuing indefinitely when the pool is saturated.
      connectionTimeoutMillis: 10_000,
      // ─── Pool size ────────────────────────────────────────────────────────
      // 1 Railway replica confirmed (numReplicas: null → default 1).
      // Total live DB connections: app pool (8) + StripeSync pool (2) = 10.
      // Load-tested at 30 concurrent requests: 100% success, p95 489ms.
      // Increased from 5→8 after measuring peak waiting=12 at 141 req/sec
      // abuse load; realistic 30-user traffic (10–15 req/sec) never saturates.
      // Revisit if probe reports sustained waitingCount > 2.
      max: POOL_MAX,
      // ─── Query / statement timeouts ───────────────────────────────────────
      // statement_timeout: PostgreSQL cancels any query running longer
      // than this and releases the connection.
      // query_timeout: node-postgres client-level guard.
      // Both at 10 s — well above normal query time (<200 ms).
      statement_timeout: 10_000,
      query_timeout: 10_000,
      // ─── Connection recycling (resilience hardening) ───────────────────────
      // idleTimeoutMillis: close idle connections after 10 s (was 30 s).
      //   Aggressive recycling means stale/dead sockets are evicted quickly.
      //   At the 5-minute health-monitor interval the pool will be fully idle
      //   between cycles; short idle timeout keeps totalCount near 0 between
      //   bursts, making a slow leak visible immediately as steady growth.
      // allowExitOnIdle: pool sheds all connections when idle. Combined with
      //   the short idleTimeoutMillis this means if a connection IS leaked it
      //   shows up as total growing while the rest return to zero — a clean
      //   signal for the POOL_GROWTH_DETECTED warning in pool-instrumentation.
      // keepAliveInitialDelayMillis: start TCP keepalive probes after 1 s
      //   (was 10 s). Dead sockets detected in seconds, not up to 685 s.
      // maxLifetimeSeconds: recycle every connection after 30 minutes
      //   regardless of idle state. Second-layer defense against long-lived
      //   connections that survive a Railway network reconfiguration.
      idleTimeoutMillis: 10_000,
      allowExitOnIdle: true,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1_000,
      maxLifetimeSeconds: 1800,
    });

    // ─── Pool event logging (structured JSON via injected logger) ─────────
    _pool.on("error", (err: Error) => {
      _logger.error(
        {
          errorName: err.name,
          errorMessage: err.message,
          totalCount: _pool?.totalCount ?? "?",
          idleCount: _pool?.idleCount ?? "?",
          waitingCount: _pool?.waitingCount ?? "?",
        },
        "[db-pool] idle client error",
      );
    });

    _pool.on("connect", () => {
      _logger.info(
        {
          totalCount: _pool?.totalCount ?? "?",
          idleCount: _pool?.idleCount ?? "?",
          waitingCount: _pool?.waitingCount ?? "?",
        },
        "[db-pool] new client connected",
      );
    });

    _pool.on("remove", () => {
      _logger.info(
        {
          totalCount: _pool?.totalCount ?? "?",
          idleCount: _pool?.idleCount ?? "?",
          waitingCount: _pool?.waitingCount ?? "?",
        },
        "[db-pool] client removed",
      );
    });
  }
  return _pool;
}

/** Read-only pool health snapshot for logging and /api/readyz. */
export function getPoolStats(): {
  total: number;
  idle: number;
  waiting: number;
} {
  const p = _pool;
  if (!p) return { total: 0, idle: 0, waiting: 0 };
  return {
    total: p.totalCount,
    idle: p.idleCount,
    waiting: p.waitingCount,
  };
}

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop) {
      if (!_db) {
        _db = drizzle(getPool(), { schema });
      }
      return (_db as any)[prop];
    },
  },
);

export * from "./schema";
export { initPoolInstrumentation, getPoolAuditLog, getPoolAuditSummary } from "./pool-instrumentation";
export type { PoolEvent } from "./pool-instrumentation";
