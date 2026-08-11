---
name: Railway production verification — correct method
description: executeSql environment="production" does NOT query Railway's Postgres. Always use Railway GraphQL API for verification.
---

# Railway Production Verification — Correct Method

## The Critical Mistake to Avoid

`executeSql({ environment: "production" })` queries **Replit's own production Postgres database**, NOT Railway's Postgres. These are completely different databases. Replit's production DB is a development artifact; Railway's Postgres is what the mobile app and web users actually hit.

## What to Use Instead

**Railway GraphQL API via ShellExec:**

```bash
RAILWAY_TOKEN=$(printenv RAILWAY_ACCOUNT_TOKEN)

# Check deployment status
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"{ deployments(first: 5, input: { projectId: \"b98310f8-7bfa-4e43-a574-8819752e9cfe\", serviceId: \"a77b49bb-e448-4be8-9d02-de7a3b43136b\" }) { edges { node { id status createdAt } } } }"}' \
  | python3 -m json.tool

# Get deployment logs (replace DEPLOY_ID)
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"{ deploymentLogs(deploymentId: \"DEPLOY_ID\", limit: 500) { message timestamp } }"}' \
  | python3 -c "import json,sys; [print(l['timestamp'][:19], l['message'][:280]) for l in json.load(sys.stdin)['data']['deploymentLogs']]"

# Trigger manual deploy (Railway webhook is NOT reliable on every push)
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"mutation { environmentTriggersDeploy(input: { projectId: \"b98310f8-7bfa-4e43-a574-8819752e9cfe\", environmentId: \"2292b38f-3d0d-4cad-92a4-ad36cabda629\", serviceId: \"a77b49bb-e448-4be8-9d02-de7a3b43136b\" }) }"}'
```

## What Does Not Work from Replit
- `curl https://api.mappingwithmelanin.com/...` — DNS fails inside Replit's network (false DOWN)
- `executeSql environment="production"` — queries wrong DB
- The `melanin-maps-api-production.up.railway.app` subdomain does not resolve to the right service

## RAILWAY_ACCOUNT_TOKEN Scope
The token has access to:
- `backboard.railway.app/graphql/v2` mutations and queries ✓
- `projects` query returns empty (token scope doesn't list all projects by default)
- Direct project/deployment queries by ID work fine ✓

## Source of Truth for Railway Startup Migrations
The deployment logs from `deploymentLogs` show every `✓`/`✗` migration run and every guard result. This is the only reliable way to verify Railway's DB state from Replit.

**Why:** Confirmed Aug 11 2026 — curl checks showed API as "DOWN" all session, but Railway dashboard + deploymentLogs confirmed it was ACTIVE and serving traffic the entire time.
