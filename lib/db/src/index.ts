import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

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
      // 1 Railway instance confirmed (numReplicas: null → default 1).
      // total live DB connections = max × instance count = 5 × 1 = 5.
      // Conservative for Neon free tier (≤5 direct connections); revisit
      // after 9C confirms the Neon plan and whether a pooler URL is in use.
      max: 5,
      // ─── Query / statement timeouts ───────────────────────────────────────
      // statement_timeout: PostgreSQL cancels any statement running longer
      // than this and releases the connection. Prevents a slow or hung
      // Neon cold-start from holding a pool slot indefinitely.
      // query_timeout: pg client-level guard — throws before the server
      // even replies if the round-trip exceeds this limit.
      // Both set to 10 s — well above normal query time (<200 ms) and above
      // Neon cold-start range (1–5 s), but bounded so nothing hangs forever.
      statement_timeout: 10_000,
      query_timeout: 10_000,
      // ─── Keep-alive (retain from prior config) ────────────────────────────
      idleTimeoutMillis: 300_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });

    // ─── Pool event logging ────────────────────────────────────────────────
    // Errors on idle clients (e.g. Neon dropped the connection) are surfaced
    // here instead of crashing the process. The pool automatically removes
    // and replaces the faulty client.
    _pool.on("error", (err: Error) => {
      console.error("[db-pool] idle client error", {
        errorName: err.name,
        errorMessage: err.message,
        totalCount: _pool?.totalCount ?? "?",
        idleCount: _pool?.idleCount ?? "?",
        waitingCount: _pool?.waitingCount ?? "?",
      });
    });

    _pool.on("connect", () => {
      console.info("[db-pool] new client connected", {
        totalCount: _pool?.totalCount ?? "?",
        idleCount: _pool?.idleCount ?? "?",
        waitingCount: _pool?.waitingCount ?? "?",
      });
    });

    _pool.on("remove", () => {
      console.info("[db-pool] client removed", {
        totalCount: _pool?.totalCount ?? "?",
        idleCount: _pool?.idleCount ?? "?",
        waitingCount: _pool?.waitingCount ?? "?",
      });
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
