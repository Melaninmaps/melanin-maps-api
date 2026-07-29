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

import type { Pool, PoolClient } from "pg";

const RING_SIZE = 500;
const SLOW_QUERY_MS = 5_000;

export interface PoolEvent {
  ts: string;          // ISO timestamp
  type: "connect" | "remove" | "query" | "slow" | "error" | "acquire";
  ms?: number;         // query duration, ms
  sql?: string;        // first 120 chars of SQL, if available
  caller?: string;     // stack frame hinting at call site
  pool?: {
    total: number;
    idle: number;
    waiting: number;
  };
  detail?: string;     // error message or other context
}

const _ring: PoolEvent[] = [];

function push(ev: PoolEvent): void {
  _ring.push(ev);
  if (_ring.length > RING_SIZE) _ring.shift();
}

function poolSnapshot(pool: Pool) {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

function callerFrame(): string {
  const raw = new Error().stack ?? "";
  // Skip the first 3 frames (Error, callerFrame, the instrumentation wrapper)
  const frame = raw.split("\n")[3]?.trim() ?? "unknown";
  // Trim the leading "at " and trim to 100 chars
  return frame.replace(/^at\s+/, "").slice(0, 100);
}

function extractSql(args: unknown[]): string | undefined {
  if (!args.length) return undefined;
  const first = args[0];
  if (typeof first === "string") return first.slice(0, 120);
  if (first && typeof first === "object" && "text" in first) {
    return String((first as { text: unknown }).text).slice(0, 120);
  }
  return undefined;
}

let _initialized = false;

/**
 * Call once at server startup, after the pool singleton is created.
 * Safe to call multiple times — only attaches listeners once.
 */
export function initPoolInstrumentation(pool: Pool, getRealPool?: () => Pool): void {
  if (_initialized) return;
  _initialized = true;

  // ── Physical connection lifecycle ──────────────────────────────────────────
  pool.on("connect", (_client: PoolClient) => {
    push({ ts: new Date().toISOString(), type: "connect", pool: poolSnapshot(pool) });
  });

  pool.on("remove", (_client: PoolClient) => {
    push({ ts: new Date().toISOString(), type: "remove", pool: poolSnapshot(pool) });
  });

  pool.on("error", (err: Error) => {
    push({ ts: new Date().toISOString(), type: "error", detail: err.message, pool: poolSnapshot(pool) });
  });

  // ── pool.query() timing wrapper ────────────────────────────────────────────
  // pool.query() is the only other pool-usage pattern in the codebase besides
  // the explicit pool.connect() calls. pg returns the connection to the pool
  // automatically after query() resolves — this wrapper just measures how long
  // each query holds the connection.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const origQuery = (pool.query as any).bind(pool) as (...args: unknown[]) => Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pool as any).query = (...args: unknown[]) => {
    const start = Date.now();
    const sql = extractSql(args);
    const caller = callerFrame();
    const promise = origQuery(...args) as Promise<unknown>;
    promise
      .then(() => {
        const ms = Date.now() - start;
        const ev: PoolEvent = {
          ts: new Date().toISOString(),
          type: ms >= SLOW_QUERY_MS ? "slow" : "query",
          ms,
          sql,
          caller,
          pool: poolSnapshot(pool),
        };
        push(ev);
        if (ms >= SLOW_QUERY_MS) {
          // Also log to console so Railway picks it up immediately
          console.warn(
            JSON.stringify({ level: "warn", event: "SLOW_QUERY", ms, sql, caller, pool: ev.pool }),
          );
        }
      })
      .catch(() => {
        push({
          ts: new Date().toISOString(),
          type: "error",
          ms: Date.now() - start,
          sql,
          caller,
          pool: poolSnapshot(pool),
          detail: "query rejected",
        });
      });
    return promise;
  };

  // ── Periodic stale-connection sweep ───────────────────────────────────────
  // Every 60 s: if total connections have grown without returning to a baseline,
  // emit a warning log entry. This is the canary for a slow leak.
  let _baseline = pool.totalCount;
  let _sweepCount = 0;
  const sweepHandle = setInterval(() => {
    _sweepCount++;
    const snap = poolSnapshot(pool);
    const grew = snap.total > _baseline;
    if (grew || snap.waiting > 0 || snap.idle === 0) {
      push({
        ts: new Date().toISOString(),
        type: "acquire",
        detail: grew
          ? `pool_growth: total grew ${_baseline}→${snap.total} in last 60s`
          : snap.waiting > 0
            ? `pool_pressure: waiting=${snap.waiting}`
            : "pool_full: idle=0 total=" + snap.total,
        pool: snap,
      });
      if (grew || snap.waiting > 0) {
        console.warn(
          JSON.stringify({
            level: "warn",
            event: "POOL_GROWTH_DETECTED",
            baseline: _baseline,
            current: snap,
            sweepCount: _sweepCount,
          }),
        );
      }
    }
    _baseline = snap.total;
  }, 60_000);
  // Unref so the interval doesn't block clean process exit
  sweepHandle.unref();

  // ── Pool Reaper v3 (direct _remove, July 29 2026) ─────────────────────────
  // Every 30 s: force-remove ANY connection older than 60 s from the pool.
  //
  // v2 called client.connection?.stream?.destroy() which is a NO-OP when the
  // TCP socket is already dead (ghost connections). Ghost connections are dead
  // sockets still in _clients because Pool._remove() was never called — this
  // happens when connections die while checked out through the Proxy, and the
  // Proxy's property-assignment gap prevents _remove from running.
  //
  // v3 bypasses this entirely:
  //   1. Uses getPool() (the real Pool, not the Proxy) to read _clients directly
  //   2. Calls stream.destroy() to try to close live connections
  //   3. Also calls realPool._remove(client) directly — this is the private
  //      pg-pool method that splices the client from _clients and decrements
  //      totalCount. Works on both ghost connections AND live ones.
  //
  // Result: pool WILL reach 0 within one 30-second reaper cycle regardless of
  // whether connections are alive, dead, idle, or checked out.
  const REAPER_INTERVAL_MS = 30_000;     // fire every 30 s
  const MAX_CONNECTION_AGE_MS = 60_000;  // reap anything older than 60 s

  const reaperHandle = setInterval(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const realPool = (getRealPool ? getRealPool() : pool) as any;
    const snap = poolSnapshot(pool);
    if (snap.total === 0) return;

    const now = Date.now();
    // Snapshot the clients array — slice to avoid mutation issues while iterating
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clients: any[] = (realPool._clients ?? []).slice();
    const reaped: { ageMs: number }[] = [];

    clients.forEach((client: any) => {
      const createdAt: number = client._createdAt ?? 0;
      const ageMs = now - createdAt;
      if (ageMs <= MAX_CONNECTION_AGE_MS) return;

      // Step 1: try TCP-level close (works on live connections)
      try { client.connection?.stream?.destroy(); } catch (_) { /* already closed */ }

      // Step 2: force-remove from pool directly via the private _remove method.
      //   This works on GHOST connections (already-dead TCP, still in _clients)
      //   where stream.destroy() is a no-op. _remove splices the client from
      //   _clients and decrements totalCount unconditionally.
      try { realPool._remove(client); } catch (_) { /* already removed */ }

      reaped.push({ ageMs });
    });

    if (reaped.length > 0) {
      const maxAge = Math.max(...reaped.map((r) => r.ageMs));
      const snapAfter = poolSnapshot(pool);
      const msg = {
        level: "error",
        event: "POOL_REAPER_FIRED",
        reaped: reaped.length,
        maxAgeMs: maxAge,
        poolBefore: snap,
        poolAfter: snapAfter,
        detail: `reaped ${reaped.length} connections >${MAX_CONNECTION_AGE_MS / 1000}s old (oldest: ${Math.round(maxAge / 1000)}s); total ${snap.total}→${snapAfter.total}`,
      };
      console.error(JSON.stringify(msg));
      push({
        ts: new Date().toISOString(),
        type: "error",
        detail: `pool_reaper: reaped ${reaped.length} connections; total ${snap.total}→${snapAfter.total}`,
        pool: snapAfter,
      });
    }
  }, REAPER_INTERVAL_MS);
  reaperHandle.unref();
}

/**
 * Return recent pool events (newest last). Pass `limit` to cap the result.
 */
export function getPoolAuditLog(limit = 200): PoolEvent[] {
  return _ring.slice(-limit);
}

/**
 * Return a summary: counts by type, most recent slow queries,
 * and current growth trend.
 */
export function getPoolAuditSummary() {
  const counts: Record<string, number> = {};
  const slowQueries: PoolEvent[] = [];
  let peakTotal = 0;
  let peakWaiting = 0;

  for (const ev of _ring) {
    counts[ev.type] = (counts[ev.type] ?? 0) + 1;
    if (ev.type === "slow") slowQueries.push(ev);
    if (ev.pool) {
      if (ev.pool.total > peakTotal) peakTotal = ev.pool.total;
      if (ev.pool.waiting > peakWaiting) peakWaiting = ev.pool.waiting;
    }
  }

  return {
    counts,
    peakTotal,
    peakWaiting,
    slowQueriesInWindow: slowQueries.slice(-10),
    ringSize: _ring.length,
    ringCapacity: RING_SIZE,
  };
}
