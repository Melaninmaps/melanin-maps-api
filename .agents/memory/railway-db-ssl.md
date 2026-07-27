---
name: Railway DB + SSL lessons
description: Pitfalls when deploying to Railway with PostgreSQL — DB host reachability, SSL config, Express 5 route syntax, data migration.
---

## Replit DATABASE_URL is not usable from Railway

Replit's managed Postgres uses the hostname `helium` (e.g. `postgresql://user:pass@helium/heliumdb`). This host only resolves inside Replit's network. **Railway cannot connect to it.** Always provision a Railway PostgreSQL service for production.

**Why:** Railway runs in its own isolated cloud; Replit's internal hostname is not routable there.

## Railway PostgreSQL — two URL types

Railway Postgres exposes two connection strings:
- `DATABASE_URL` — internal (`postgresql://...@postgres.railway.internal:5432/railway`) — no SSL needed, only reachable within Railway's private network.
- `DATABASE_PUBLIC_URL` — public proxy (`postgresql://...@tokaido.proxy.rlwy.net:PORT/railway`) — requires SSL, reachable from anywhere including Replit for schema push.

**SSL logic in pool config:**
```javascript
const noSsl = !url || url.includes("localhost") || url.includes("127.0.0.1") || url.includes(".internal");
const ssl = noSsl ? false : { rejectUnauthorized: false };
_pool = new Pool({ connectionString: url, ssl });
```

Use the internal URL for the api-server (faster, no SSL overhead). Use the public URL for schema pushes from Replit.

## Express 5 wildcard route syntax

Express 5 (with path-to-regexp v8+) no longer accepts bare `*` as a catch-all:
- **Broken:** `app.get("*", handler)`
- **Fixed:** `app.get("/{*path}", handler)`

This causes a `PathError: Missing parameter name at index 1: *` crash on startup. Rebuild with the fixed syntax or the binary won't start.

## Data migration pattern (Replit → Railway Postgres)

When copying business data, JSON/JSONB columns must be serialized to strings before insert:
```javascript
const jsonCols = new Set(/* query information_schema */);
const vals = cols.map(c => {
  const v = row[c];
  if (jsonCols.has(c) && v !== null) return JSON.stringify(v);
  return v;
});
```

## Railway service IDs (melanin-maps-api project)
- Project: `b98310f8-7bfa-4e43-a574-8819752e9cfe`
- Environment: `2292b38f-3d0d-4cad-92a4-ad36cabda629`
- api-server: `a77b49bb-e448-4be8-9d02-de7a3b43136b`
- Postgres: `7bb11d12-0e5d-404b-ae77-17450f56d3a4`
