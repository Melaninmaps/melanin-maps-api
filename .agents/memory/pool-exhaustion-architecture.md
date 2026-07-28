---
name: Pool exhaustion — architectural root causes and fixes
description: Complete record of July 28 2026 P0 pool exhaustion, all dangerous patterns found, and the architectural constraints that must be maintained permanently.
---

# Pool Exhaustion — Architecture Rules

## P0 Incident Summary (July 28 2026)
- Duration: ~03:30–13:00 UTC (~9.5 hours)
- Root cause: `Promise.race(pool.query("SELECT 1"), timeout(3000ms))` in build97Monitor.ts and healthMonitor.ts. When the 3s timeout fired first, the pg PoolClient was abandoned — it remained checked out from pg.Pool's perspective until pg's `maxLifetimeSeconds: 1800` recycled it. Over ~12 cycles (1 hour), all 8 pool slots were consumed by zombie clients. PgBouncer had already closed them server-side, but pg.Pool didn't know.

## All Dangerous Patterns Found and Fixed (July 28 2026)

| File | Pattern | Status |
|---|---|---|
| `artifacts/api-server/src/app.ts` | `Promise.race([pool.query("SELECT 1"), timeout])` in /api/readyz | FIXED: pool.connect()+finally |
| `artifacts/api-server/src/routes/readyz.ts` | `Promise.race([pool.query(...), timeout])` (x2) | FIXED: pool.connect()+finally |
| `artifacts/api-server/src/routes/db-probe.ts` | `Promise.race([pool.query(...), timeout])` (x2) | FIXED: pool.connect()+finally |
| `artifacts/api-server/src/lib/build97Monitor.ts` | `pool.connect()` (x2) inside monitor cycle | FIXED: removed entirely — monitor uses HTTP /api/readyz |
| `artifacts/api-server/src/lib/healthMonitor.ts` | `pool.connect()` in health check | FIXED: already uses finally; safe |

## Permanent Architectural Rules

**Rule 1: Never use Promise.race with pool.query or client.query**
The abandoned promise holds a PoolClient indefinitely. Use `pool.connect()` + `try/finally { client.release() }` always.

**Rule 2: API-internal monitors must not probe the DB directly**
The internal build97Monitor uses HTTP /api/readyz only for DB health. /api/readyz itself uses pool.connect()+finally.

**Why:** A monitor inside the API process that also uses the API's pool competes with request handling. With POOL_MAX=8 and 11 parallel HTTP endpoint checks per monitor cycle, peak demand is already near max. Adding internal pool.connect() calls creates >8 simultaneous demand during cycles.

**Rule 3: Separate monitoring service for comprehensive checks**
`monitoring-service/index.mjs` is a standalone Railway service with its own pg.Pool(max:2) for evidence writes only. HTTP-only for health checks.

**Rule 4: Pool stats in responses**
`/api/readyz` returns `{ pool: { total, idle, waiting } }` in its body. The monitor parses this instead of calling getPoolStats() internally.

## Secondary P0 Cause: Both monitors syncing up
healthMonitor runs every 5 min, build97Monitor runs every 5 min. They occasionally fire simultaneously plus concurrent HTTP checks → momentary demand >8. The fix (removing direct probes from build97Monitor) eliminates this.

## Recovery
Railway restart clears all zombie pool slots. There is no API route to force a clean — only a process restart works.
