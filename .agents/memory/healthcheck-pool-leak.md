---
name: Railway healthcheck pool leak
description: Railway health check hitting /api/readyz caused the entire pool exhaustion cascade. Root cause, evidence, and permanent fix documented here.
---

# Railway Healthcheck → Pool Exhaustion Root Cause

## The Rule
**Never point Railway's `healthcheckPath` at any endpoint that makes a DB query.**

## Why
Railway's health check fires every ~15 seconds. `/api/readyz` calls `pool.query("SELECT 1")`. Each probe creates a new connection, the query completes in ~26ms, the connection sits idle, and after `idleTimeoutMillis: 10_000` it's removed. Net should be 0 per cycle — but Railway retries immediately on 503 (unhealthy response), causing overlapping probes that stack connections faster than they're removed. Pool exhausts to max=20 in under 5 minutes.

**Signature:** every connection lives exactly 10.0 seconds (idleTimeoutMillis); pool-audit shows equal connects+removes yet total grows monotonically; readyz endpoint takes exactly 10s and fails (connection timeout, not DB issue).

## How to Apply
`railway.toml` must have:
```toml
healthcheckPath = "/api/healthz"   # ← no DB
healthcheckTimeout = 30
```

`/api/healthz` returns `{status:"ok"}` immediately with no pool interaction.
DB health is monitored separately by the internal healthMonitor (every 5 min, rate-limited, no Railway retry cascade).

## Evidence (commit a6600069, July 29 2026)
- Pool-audit: 20 connects + 20 removes; each connect-to-remove gap = exactly 10.005s = idleTimeoutMillis
- `curl --max-time 15 /api/readyz` took exactly 10.094s and returned HTTP 503
- Local dev server: same +1/5min pattern from healthMonitor firing every 5 min
- Railway production: +1/15s from health check interval (faster, hence catastrophic)
- Fix: changed `healthcheckPath = "/api/readyz"` → `"/api/healthz"` in railway.toml
