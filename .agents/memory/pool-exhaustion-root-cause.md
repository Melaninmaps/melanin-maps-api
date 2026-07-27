---
name: Pool exhaustion root cause and fix
description: Why login returns 500 in exactly ~10s, root cause, permanent fix, and recovery procedure.
---

## The Pattern
- Login (and any Drizzle write) returns HTTP 500 in exactly ~10 seconds
- SELECT queries still work (users can be found)
- Direct psql UPDATE/INSERT against production DB works instantly
- pg_stat_activity shows 0 active queries

## Root Cause
All 5 pg Pool connections were checked out by the application but idle — the Pool thought they were busy but PostgreSQL had already closed them (Railway network reconfiguration / rapid redeployment without graceful shutdown).

Node-postgres `connectionTimeoutMillis: 10_000` waits 10 seconds for a free pool slot before throwing → exactly 10-second failure.

The trigger: 7+ Railway deployments in 46 minutes without a SIGTERM→pool.end() handler. Each SIGKILL left pool connections in an unknown state. The next deployment inherited the exhausted pool.

**Why SELECTs still worked:** SELECTs that ran early in request handling acquired connections before the pool was fully exhausted. By the time the UPDATE/INSERT ran (after bcrypt.compare), all 5 slots were taken.

## Permanent Fix
`artifacts/api-server/src/index.ts` — SIGTERM and SIGINT handlers call `server.close()` then `pool.end()` with a 25s timeout. This ensures Railway's 60s draining window cleanly releases all connections before the process exits.

## Recovery Procedure (if this recurs)
1. Call Railway GraphQL API: `mutation { serviceInstanceRedeploy(...) }` — this clears the leaked pool
2. Test: `curl https://www.mappingwithmelanin.com/api/auth/login-email` — should return 401 in <2s
3. If still 500 after restart, the issue is different — check pg_stat_activity for locks

## Key IDs
- Service: a77b49bb-e448-4be8-9d02-de7a3b43136b
- Project: b98310f8-7bfa-4e43-a574-8819752e9cfe
- Environment: 2292b38f-3d0d-4cad-92a4-ad36cabda629
- DB public URL: tokaido.proxy.rlwy.net:10066 (internal: postgres.railway.internal:5432)

**Why:** No graceful shutdown = connection leak on rapid redeploy. Now permanently fixed.
**How to apply:** If login is 500 in ~10s, restart Railway before touching code.
