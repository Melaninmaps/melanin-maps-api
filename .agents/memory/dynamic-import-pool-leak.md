---
name: Dynamic import pool leak
description: await import() inside hot route handlers creates orphan pg.Pool instances per request in esbuild bundles, causing permanent pool growth.
---

## The Rule

Never use `await import('@workspace/db')` (or any workspace package that exports a pg.Pool) inside a request handler or any function called per-request. Always use a static top-level import.

## Why

In esbuild bundles, workspace packages resolved via dynamic import can create a **separate module instance** rather than returning the top-level singleton. Each call to `await import('@workspace/db')` inside a request handler was creating an entirely new `pg.Pool` object. That pool was never `.end()`-ed. Each created pool opened 1+ PostgreSQL connections that were permanently held — never returned to any pool, never closed.

With real user traffic making kinfolk chat requests, pool grew at +2/min from three dynamic imports in kinfolk.ts:
```ts
// WRONG — inside route handler:
const { pool } = await import('@workspace/db');           // line 1499
const { pool: vibePool } = await import('@workspace/db'); // line 1622
const { neighborhoodSurveysTable } = await import('@workspace/db'); // line 2038
```

## The Fix

Add all needed exports to the static import block at the top of the file:
```ts
import {
  db,
  pool,                    // ← add here
  neighborhoodSurveysTable, // ← add here
  ...
} from '@workspace/db';
```

Remove all dynamic imports of workspace packages from route handlers.

## How to Apply

- Before writing any route handler that needs `pool`, `db`, or table schemas: check the static imports at the top of the file first.
- `grep -rn "await import" artifacts/api-server/src/` before every deploy to catch new dynamic imports.
- This rule applies to ANY workspace package exported singleton (pool, db, storage, etc.).

## Evidence

Confirmed July 29 2026: pool grew at +2/min with dynamic imports, dropped to +1/3min (noise-level) after removing them. No-poll 180s test confirmed the fix.
