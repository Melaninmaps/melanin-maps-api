---
name: Pool reaper _createdAt bug — root cause and fix
description: The pool reaper used client._createdAt which is not a real pg property; all connections appeared ~56 years old and were reaped within 30s.
---

## The Bug

`lib/db/src/pool-instrumentation.ts` pool reaper v3 read:
```ts
const createdAt: number = client._createdAt ?? 0;
```

`_createdAt` is not a property on pg PoolClient. It is always `undefined`, so
`createdAt` defaults to `0`. This makes `ageMs = Date.now() - 0 ≈ 1.786 trillion ms`
— every connection appears ~56 years old — and the reaper kills all of them within
one 30-second cycle.

**Signature in logs:**
```
POOL_REAPER_FIRED  maxAgeMs: 1786108320519  detail: "reaped N connections >60s old (oldest: 1786108321s)"
```
The `oldest` value in SECONDS equals the current Unix timestamp in seconds — dead giveaway.

## Impact

Any route that takes >~8s (e.g. Apple Sign-In: fetches Apple JWKS before DB
query) would hit a dead pool connection → 500. Email login is fast enough to
usually succeed between reaper cycles, but can still fail if reaper fires mid-request.

This was the direct cause of the Build 102 Apple App Review rejection
(Guideline 2.1a — "Sign in with Apple and Sign in with email lead to error on iPad").

## Fix (Aug 7, 2026)

1. **WeakMap tracking** — added `connectionCreatedAt = new WeakMap<PoolClient, number>()`
   populated in the `pool.on("connect", ...)` handler with `Date.now()`.
   Reaper reads `connectionCreatedAt.get(client) ?? now` — defaulting to `now`
   (age 0) for any connection not yet observed, so it is never prematurely reaped.

2. **db-retry.ts** — widened `isTransientDbError` to match `"Connection terminated"`
   without requiring the `"unexpectedly"` suffix, so even a reaped connection
   during a request gets one automatic retry.

**Why:** `_createdAt` was presumably a copy-paste from an older pg version or a
different pg library. The real pg Pool does not expose creation time on PoolClient
objects — it must be tracked externally.

**How to apply:** If the pool reaper ever logs absurdly large `maxAgeMs` or
`oldest` values equal to the current Unix timestamp, this bug has recurred.
Check that `connectionCreatedAt` WeakMap is populated before the reaper reads it.
