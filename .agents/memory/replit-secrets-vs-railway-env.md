---
name: Replit secrets vs Railway environment variables
description: Replit secrets are NOT available in Railway — startup migrations that read process.env for secrets silently skip in production
---

## Rule
Replit Secrets (set via `requestSecrets`) are available as environment variables in the **Replit shell and dev workflows** but are NOT injected into Railway deployments. A startup migration that reads `process.env.MWM_MONITOR_EMAIL` will always get `undefined` in Railway and silently skip.

## Why
Railway has its own separate environment variable system. Variables must be explicitly set in Railway (via the Railway dashboard or the `variableCollectionUpsert` GraphQL mutation) to be available to the deployed service.

## How to apply
When a startup migration needs secrets (e.g. creating a monitoring account):
1. **Preferred**: Use a CRON_SECRET-protected endpoint (`POST /api/cron/create-...`) that accepts the secret values in the request body — then call it from Replit where the secrets ARE available.
2. **Alternative**: Add the values as Railway environment variables via the Railway dashboard.
3. **Do not**: Rely on startup migrations reading Replit secrets — they will silently no-op in Railway.

The `variableCollectionUpsert` Railway GraphQL mutation returned 403 with RAILWAY_ACCOUNT_TOKEN — it may require different scopes. Use the cron endpoint approach instead.

## Pattern implemented
`POST /api/cron/create-monitor-account` in `artifacts/api-server/src/routes/cron.ts` — creates the monitoring account from request body, protected by `x-cron-secret` header, idempotent.
