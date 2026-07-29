---
name: Pool exhaustion permanent fix
description: Cumulative fixes. Reaper v3 (direct _remove on real Pool) is the confirmed working fix. Pool reaches 0 between cycles.
updated: 2026-07-29
---

# Pool Exhaustion Permanent Fix

## History of fixes (cumulative)

### A–D: Earlier session fixes
- statement_timeout on session
- allowExitOnIdle: true + idleTimeoutMillis: 10_000
- safeRelease 60s timer in healthMonitor
- safeRelease 60s timer in readyz

### E: Railway healthcheck path (commit a6600069)
`railway.toml` healthcheckPath → `/api/healthz` (no DB). `/api/readyz` was probed every 15s creating +1 connection per probe.

### F–G: maxLifetimeSeconds + Reaper v1/v2 (commits 67a7bf6d, 9722ae1d, 1f273663)
Both failed. v1 never fired (idle never reached 0). v2's stream.destroy() was a NO-OP on ghost connections.

### H: healthMonitor Proxy bypass (commit fd9902b0)
`pool.query()` through the Proxy has `this=Proxy` when pg-pool runs internally. pg-pool's `_remove()` goes through the Proxy's set behavior. The root `+1 per 5-min` leak was confirmed to come from `pool.query("SELECT 1")` in healthMonitor.

Fixed: `healthMonitor` now uses explicit `pool.connect()` + `client.release()` in finally block. `client.release()` calls directly on the PoolClient which holds its own back-reference to the real Pool — no Proxy in the release path.

### I: Pool Reaper v3 — direct `_remove()` (commit 31d8a7dd) — CONFIRMED WORKING

**Root cause of ghost connections**: connections die (TCP close) but pg-pool's `_remove()` is never called, because the error handler was set up with `this=Proxy`, and any property write in that path went to the Proxy's empty target `{}` instead of the real Pool. Connections stayed in `_clients` as ghosts forever.

**Why v2's `stream.destroy()` failed**: ghost connections have already-dead TCP sockets. `stream.destroy()` on a dead socket is a no-op. No error events fire. `_remove()` never runs.

**v3 fix**:
1. `getPool()` exported from `lib/db/src/index.ts`
2. `initPoolInstrumentation(pool, getRealPool?)` now accepts a callback
3. Called as `initPoolInstrumentation(pool, getPool)` from `api-server/src/index.ts`
4. Reaper uses `realPool._clients` (real Pool, not Proxy) to read connection list
5. Calls `stream.destroy()` for live connections
6. Also calls `realPool._remove(client)` directly — works on both live AND ghost connections, unconditionally splices client from `_clients`

**Confirmed working** (22:07 UTC July 29 2026):
- 2 ghost connections → reaper fires → `remove` events appear → total 2→0
- Pool reached total=0 for first time in the entire session
- readyz returned `total=1, idle=1` (just the readyz connection itself)

## Deployment pattern (PERMANENT)
nixpacks cache-bust token approach is UNRELIABLE — Railway serves cached Docker layers silently.
**Only reliable deploy**: `git add -f dist/index.mjs` (force-add the gitignored binary).
Always verify reaper is in binary: `grep -c "_remove\|POOL_REAPER_FIRED\|_createdAt" dist/index.mjs` must return > 0.

## Pool exhaustion signature (for diagnosis)
- `total` growing, never shrinks; `idle=0` throughout
- Ghost pattern: `remove` events absent despite reaper firing repeatedly
- reaper events show "killed N" but pool total unchanged → stream.destroy() is no-op on ghosts

## Permanent rules
1. `railway.toml healthcheckPath` MUST be `/api/healthz` — never `/api/readyz`
2. `maxLifetimeSeconds` MUST stay ≤ 120
3. Reaper v3 fires every 30s, reaps connections > 60s via `_remove()` — never disable
4. healthMonitor MUST use `pool.connect()` + explicit `client.release()` in finally — never `pool.query()`
5. Never `await import('@workspace/db')` in hot route handlers — static import only
6. Any new code using the pool that runs on a background timer MUST use explicit `pool.connect()` + `client.release()` in finally — not `pool.query()`
7. To deploy: force-add binary (`git add -f dist/index.mjs`)
