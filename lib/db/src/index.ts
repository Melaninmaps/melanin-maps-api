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
      // Total live DB connections = max × replicas = 5 × 1 = 5.
      // Load-tested at 30 concurrent requests: zero failures, max 0.98s.
      // Revisit if probe reports sustained waitingCount > 2.
      max: 5,
      // ─── Query / statement timeouts ───────────────────────────────────────
      // statement_timeout: PostgreSQL cancels any query running longer
      // than this and releases the connection.
      // query_timeout: node-postgres client-level guard.
      // Both at 10 s — well above normal query time (<200 ms).
      statement_timeout: 10_000,
      query_timeout: 10_000,
      // ─── Connection recycling (resilience hardening) ───────────────────────
      // idleTimeoutMillis: close idle connections after 30 s (was 300 s).
      //   Dead sockets from Railway network events are replaced within one
      //   idle cycle rather than persisting for up to 5 minutes.
      // keepAliveInitialDelayMillis: start TCP keepalive probes after 1 s
      //   (was 10 s). Dead sockets detected in seconds, not up to 685 s.
      // maxLifetimeSeconds: recycle every connection after 30 minutes
      //   regardless of idle state. Second-layer defense against long-lived
      //   connections that survive a Railway network reconfiguration.
      idleTimeoutMillis: 30_000,
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
