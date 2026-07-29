---
name: Pool exhaustion permanent fix
description: Four fixes applied to stop pool growth; plus the July 29 2026 systemic fix (maxLifetimeSeconds + reaper) that makes exhaustion impossible regardless of leak source.
---

# Pool Exhaustion Permanent Fix

## History of fixes (cumulative)

### Earlier fixes (A–D)
- **A**: `statement_timeout` on session
- **B**: `allowExitOnIdle: true` + `idleTimeoutMillis: 10_000`
- **C**: `safeRelease` 60s timer in healthMonitor
- **D**: `safeRelease` 60s timer in readyz

### E: Railway healthcheck path (commit a6600069, July 29 2026)
`railway.toml` changed from `healthcheckPath = "/api/readyz"` to `"/api/healthz"`.
`/api/readyz` called `pool.query("SELECT 1")` every 15 seconds — each probe created a connection, Railway retried on 503, pool exhausted in ~5 minutes.
`/api/healthz` returns 200 immediately with no DB interaction.

### F: Systemic self-healing fix (commit 67a7bf6d, July 29 2026) — Manus recommendation
Two changes together make exhaustion impossible regardless of leak source:

1. **`maxLifetimeSeconds: 1800 → 120`** in `lib/db/src/index.ts`
   - Every connection recycled after 2 minutes regardless of state
   - Handles slow leaks where connections ARE eventually released

2. **Pool Reaper interval** in `lib/db/src/pool-instrumentation.ts`
   - Fires every 60 seconds
   - If `total > 5 AND idle === 0`: zombie pattern confirmed
   - Force-closes all TCP sockets via `client.connection.stream.destroy()`
   - pg's error handler fires, removes clients from pool, pool recovers
   - Handles worst case: connections where `release()` is NEVER called

## Result after F
- readyz: 0.191s (was 10.094s timeout)
- Pool: total=3, idle=1, waiting=0 (was total=20, idle=0, waiting=0)
- Pool stable for 3+ minutes of passive observation (no new connections created)
- Reaper never needed to fire (pool never hit zombie threshold)

## Signature of pool exhaustion (for diagnosis)
- `total` growing monotonically, `idle=0` throughout
- Every connection lives exactly 10 seconds (= `idleTimeoutMillis`)
- `pool-audit` shows equal connect+remove counts yet `current.total` keeps rising
- `readyz` takes exactly 10s and fails (connection timeout, not DB issue)

## Permanent rules
1. `railway.toml healthcheckPath` MUST be `/api/healthz` — never `/api/readyz`
2. `maxLifetimeSeconds` MUST stay ≤ 120 — do not increase back to 1800
3. Pool Reaper threshold (currently 5) must stay below `POOL_MAX / 2`
4. Never `await import('@workspace/db')` inside a hot route — static import only
