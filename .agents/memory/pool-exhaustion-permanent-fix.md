---
name: Pool exhaustion permanent fix
description: Four fixes applied July 29 2026 to prevent recurring pool exhaustion (one leak per 5-min health monitor cycle → total 2→20 in 90 min → 38% uptime).
---

## Root cause
`client.query("SELECT 1")` in healthMonitor hangs on a silently-dead TCP socket.
`query_timeout: 10_000` fires but in rare cases the pg Promise never settles →
`finally` never runs → one connection leaked per 5-minute health cycle.
Visible signature: pool total grows steadily (one per cycle), idle=0, waiting=0.

## Fixes applied (commit e97c8a07)

**Fix A — explicit session statement_timeout on every pool.connect() health probe:**
Applied to: `healthMonitor.ts`, public `/api/readyz` in `app.ts`, internal `readyz.ts`.
```ts
await client.query("SET statement_timeout = '5000'");
await client.query("SELECT 1");
```
PostgreSQL cancels server-side within 5 s regardless of pool-level config.

**Fix B — aggressive idle recycling in `lib/db/src/index.ts`:**
- `allowExitOnIdle: true` — pool sheds all connections when idle; leaked connections stand out immediately as total > 0 while others return to 0.
- `idleTimeoutMillis: 10_000` (was 30_000) — dead sockets evicted within 10 s.

**Fix C+D — 60s forced-release safety net on every pool.connect() call site:**
```ts
let _released = false;
const safeRelease = () => { if (_released) return; _released = true; client?.release(); };
const forceTimer = setTimeout(() => { safeRelease(); }, 60_000);
forceTimer.unref?.();
// in finally:
clearTimeout(forceTimer);
safeRelease();
```
`safeRelease()` is idempotent — guards against double-release if timer + finally both fire.

## Call sites covered
- `artifacts/api-server/src/lib/healthMonitor.ts` — prime suspect (A + C/D)
- `artifacts/api-server/src/app.ts` public `/api/readyz` (A + C/D)
- `artifacts/api-server/src/routes/readyz.ts` internal (A + C/D)
- `artifacts/api-server/src/routes/users.ts` transaction — already safe, not modified

## Verification signal
After fixes: pool total should stay near 0 between health cycles (allowExitOnIdle).
If total still grows steadily at 1/cycle → a different call site is leaking.
Check `/api/readyz/history` for consecutive "ok" entries; 48 entries = 4 hours clean.

**Why:**
The `query_timeout` pool config catches most hangs, but kernel-level TCP socket
hangs (where the OS never delivers the RST packet) can hold a pg Promise open
indefinitely — `query_timeout`'s setTimeout fires but the underlying socket stays
allocated. The 60s forced release is the last-resort safety net.
