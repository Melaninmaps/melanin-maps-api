# Deployment Failure Diagnosis — Evidence and Release Gate

## What the current evidence proves

The active API deployment shown in the Replit deployment screen is **three days old**. The attached runtime log proves that this active process is still running, serving requests, and executing background work today. It does **not** prove that newer changes were promoted.

The runtime log also contains three recurring functional failures:

| Time pattern | Evidence | Meaning |
|---|---|---|
| Repeated around `03:02`, `03:06`, and `03:17 UTC` | `GET /cities failed` followed by `request errored` | A critical location source used by Map, Businesses, Events, and location-aware Kinfolk is failing in the active release. |
| Same request bursts | `GET /knowledge/digest error` | The Library/knowledge retrieval path is failing in the active release. |
| `03:27 UTC` | `Failed to fetch community impact` | A community-impact/dashboard query is failing. |
| Repeated throughout the file | `[err]` and `[wrn]` with no message | The logging configuration discards the original error detail, so neither the failed route nor a deployment failure can be diagnosed from the current output. |

The earlier PostgreSQL log independently showed missing-column errors for `reviews.author_id` and `business_identity.age_restriction_reasons`. Those are concrete API/schema mismatches. They are a strong candidate for the endpoint failures and may also block a newer release if its startup or release verification touches those paths.

## What cannot be concluded yet

The runtime log is **not** a failed deployment log. It cannot identify whether the newer release failed at build, environment loading, migration, startup, health check, or promotion. Only the failed deployment’s **Build Logs** and **Deploy Logs** contain that exact first failure.

Do not accept a generic statement such as “deployment failed.” The failure report must include the first non-repeated error line, the command that was running, the release/commit SHA, and the deployment stage.

## Most likely failure chain

1. A newer GitHub revision is created.
2. Replit tries to build or start it.
3. It either fails during build/startup, or a dependency/schema condition prevents it from satisfying promotion/health requirements.
4. The “last known working build” rule keeps the three-day-old API online.
5. The old API still has broken runtime queries and hides their error details, so the site remains visible but does not reflect newer work correctly.

The fallback rule is doing its outage-prevention job. The missing piece is a **release gate with readable diagnostics**, not removing the fallback.

## Required Replit release configuration

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "build": "<existing framework build command>",
    "predeploy:gate": "tsx scripts/preDeployGate.ts",
    "start": "<existing production start command>"
  }
}
```

The promotion process must be ordered as follows:

| Stage | Required check | Failure outcome |
|---|---|---|
| Build | Dependency install and production build complete. | Do not start/publish the new release. Show compiler/import error. |
| Migration | Explicit locked migration process completes against the production database. | Do not promote. Show the SQL migration failure and target database identity. |
| Pre-deploy gate | `pnpm predeploy:gate` passes required environment and schema checks. | Do not promote. Show missing secret or failing schema/query. |
| Startup | API binds the expected port and logs `release`, `port`, and `database target`. | Do not promote. Show startup exception. |
| Readiness | Readiness check confirms database connectivity **and** critical query shapes. | Do not promote. Keep last working build active. |
| Promotion | `/api/version` returns the candidate `APP_RELEASE_SHA`. | Do not claim success until the public API proves the new revision. |

Do not run migrations automatically on every request or silently at arbitrary startup. Run them as an explicit protected release step, then let `predeploy:gate` verify the result.

## Logging repair

Register `requestCorrelationLogging` before routes and `structuredErrorHandler` after routes. This replaces empty `[err]` lines with production-safe structured fields:

```ts
app.use(requestCorrelationLogging(logger));
// register routes here
app.use(structuredErrorHandler(logger));
```

Each failure will then include: `requestId`, HTTP method, route, status code, error name, error code, error message, and a limited stack trace. Member secrets, authorization headers, passwords, audio, and raw prompts must not be logged.

## Exact next checks in Replit

1. Open **api-server → Deployments → History** and disable/hide neither skipped nor failed entries.
2. Select the most recent failed deployment. Open **Build Logs**, then **Deploy Logs**.
3. Copy the first occurrence of one of the following, including ten lines above and below it: `error`, `failed`, `exit code`, `migration`, `cannot find`, `missing`, `ECONN`, `MODULE_NOT_FOUND`, `TypeScript`, `syntax`, or `health check`.
4. Record the commit/release name and timestamp shown on that failed deployment.
5. Confirm that deployment’s environment includes `DATABASE_URL`, `APP_RELEASE_SHA`, `API_PUBLIC_URL`, `APP_ORIGIN`, and all integration secrets the new code imports.
6. Run `pnpm predeploy:gate` against the intended production database from the protected release environment.
7. Search live logs after the gate passes. There must be no new `GET /cities failed`, `GET /knowledge/digest error`, or blank `[err]` messages.
8. Promote only when `https://api.melaninmaps.com/api/version` returns the candidate release SHA and the web client calls that exact API origin.

## Why this resolves the ambiguity

The new gate stops an incompatible build before it replaces the last healthy build, but it also produces a specific machine-readable reason for the stop. The structured logger then shows whether any remaining production endpoint is failing due to schema, environment, code, or data rather than reducing every failure to an empty log line.
