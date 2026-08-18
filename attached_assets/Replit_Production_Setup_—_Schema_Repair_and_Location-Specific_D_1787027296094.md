# Replit Production Setup — Schema Repair and Location-Specific Dynamic Community Tags

## Direct answer: why updates may not be visible

**Yes, the production logs show a real reason that parts of the updates may not be visible.** The API is active, but it is issuing queries against columns that PostgreSQL reports are missing. The errors shown in the supplied logs are not cosmetic warnings; they stop the affected database query from completing.

| Evidence in the production logs | Meaning | Likely visible effect |
|---|---|---|
| `column "author_id" does not exist` while querying `reviews` | API code expects a review-author field that the production schema lacks. | Review-backed community evidence, counts, and dynamic-tag work can fail. |
| `column "age_restriction_reasons" does not exist` while reading `business_identity` | API code expects a newer business-identity schema than the production database has. | Business detail, map, search, or listing enrichment can fail or render incomplete. |
| `304` on dynamic map/listing endpoints | Browser/CDN is revalidating a prior response instead of receiving a new JSON body. | An updated schema or dataset can remain visually stale even after API deployment. |

The errors are **a likely cause**, but not the only possible cause. A fully correct diagnosis requires confirming that the public web client is built from the intended revision and calls the intended API origin. This package adds release/version checks so that is no longer ambiguous.

> An API service can be active while its database schema is incompatible with the API code. “Active” only confirms that a process is running; it does not prove the migration was applied.

## What this package changes

| File | Purpose |
|---|---|
| `db/migrations/20260818_01_schema_compatibility_and_dynamic_tags.sql` | Repairs `reviews.author_id` and `business_identity` compatibility, then adds location-specific dynamic community tagging. |
| `scripts/runMigrations.ts` | Applies migrations once, with an advisory lock and immutable migration ledger. |
| `scripts/verifySchema.ts` | Executes the formerly failing lookup shapes and verifies the required schema objects. |
| `.env.production.example` | Exact Replit Secret names and production defaults. |
| `server/communityTags/postgresLocationTagRepository.ts` | Reads only approved, sufficiently evidenced location-specific tags for Kinfolk, search, and maps. |
| `server/http/dynamicResponseCache.ts` | Sends `no-store` responses for dynamic listings and map pins so stale 304 responses cannot mask fresh data. |
| `server/ops/registerReleaseStatusRoutes.ts` | Adds API release and protected schema-status endpoints for deployment verification. |

## Dynamic community tagging model

A community tag is **not global**. It is attached to a specific business at a specific location and is surfaced only after moderation and minimum independent evidence.

For example, “growing hands” can be approved for a Charlotte hair-care professional at their Charlotte location. It does not automatically apply to every provider, every location of the same business, or every city. A member saying “Uptown” can be resolved only through an approved location alias tied to an explicit city/state context.

| Layer | Table | Responsibility |
|---|---|---|
| Location | `community_locations` | Canonical city, state, neighborhood, and optional coordinates. |
| Local language | `community_location_aliases` | Approved local meanings, such as `uptown` → `Uptown Charlotte` only in Charlotte, NC. |
| Tag definition | `community_tag_definitions` | Moderated vocabulary, such as `growing-hands`. It expressly prevents medical claims. |
| Business place | `business_location_contexts` | Connects a business to the actual location where the community experience applies. |
| Public aggregate | `business_location_community_tags` | Approved, aggregated member confirmations, confidence, recency, and moderation status. |
| Private workflow | `community_tag_submissions` | Individual submissions for moderator review; never exposed in public map/search output. |
| API view | `approved_location_community_tags` | The only dynamic-tag source Kinfolk, search, and maps should read. It requires approved tags and at least three confirmations. |

## Replit environment configuration

Create the keys from `.env.production.example` in the **production** Replit environment as Secrets. Do not put real values in a tracked `.env` file.

| Secret | Required value or rule |
|---|---|
| `DATABASE_URL` | The production PostgreSQL connection string. Use the database attached to the **production** environment, not a preview/development database. |
| `DATABASE_SSL` | Set `true` if the provider requires TLS. |
| `DATABASE_MIGRATIONS_DIR` | `./db/migrations` |
| `DATABASE_MIGRATION_LOCK_ID` | `82420260818` |
| `RUN_MIGRATIONS_ON_APP_BOOT` | `false`; migrations are an explicit release step. |
| `API_PUBLIC_URL` | `https://api.melaninmaps.com` |
| `APP_ORIGIN` | The canonical public web origin, for example `https://www.mappingwithmelanin.com`. |
| `CORS_ALLOWED_ORIGINS` | Every trusted browser origin, comma-separated. |
| `COMMUNITY_TAG_MIN_CONFIRMATIONS` | `3` |
| `COMMUNITY_TAG_REQUIRE_MODERATION` | `true` |
| `COMMUNITY_TAG_EXPOSE_RAW_SUBMISSIONS` | `false` |
| `SCHEMA_STATUS_TOKEN` | A long random secret used only for protected release verification. |
| `APP_RELEASE_SHA` | The Git commit SHA or release ID being deployed. |
| `APP_DEPLOYED_AT` | Deployment timestamp, for example `2026-08-18T16:00:00Z`. |

Add the following scripts to `package.json`:

```json
{
  "scripts": {
    "db:migrate": "tsx scripts/runMigrations.ts",
    "db:verify": "tsx scripts/verifySchema.ts",
    "build": "<existing-build-command>",
    "start": "<existing-production-start-command>"
  }
}
```

The build command and start command must remain the project’s existing commands. Do not substitute a generic command if the project has a framework-specific build step.

## Required server registration

Register the release-status routes in the API bootstrap:

```ts
import { registerReleaseStatusRoutes } from "./server/ops/registerReleaseStatusRoutes";

registerReleaseStatusRoutes(app, dbPool);
```

For any mutable result endpoint—especially `/api/businesses/map-pins`, `/api/maps/discoverability-pins`, search results, verified listings, and location-specific community tags—replace ordinary JSON output with `sendDynamicJson`:

```ts
import { sendDynamicJson } from "./server/http/dynamicResponseCache";

app.get("/api/businesses/map-pins", async (request, response) => {
  const pins = await loadCurrentMapPins(request);
  return sendDynamicJson(response, { pins });
});
```

This is intentionally conservative. It prevents stale 304 responses from masking changed listings or tags while the platform is being repaired. Later, replace `no-store` only with deliberate versioned caching that includes a data revision in the cache key.

Use `createPostgresLocationTagRepository(dbPool)` for the Kinfolk, map, and directory code that needs community tags. Do not query raw submissions or unapproved tag definitions from a public/member-facing route.

## Production migration sequence

1. **Create a production backup.** From the Replit production shell, run the project’s approved database backup procedure. A standard PostgreSQL example is:

   ```bash
   pg_dump "$DATABASE_URL" --format=custom --file="backup-before-community-tags.dump"
   ```

2. **Commit the migration and support files** in the same API revision. Never modify an already applied migration; create a later corrective migration instead.

3. **Build the API without deploying it yet.** This catches TypeScript and import errors before production migration.

   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   ```

4. **Run the migration against the production database deliberately.** Do not run migrations on every request or automatic restart.

   ```bash
   pnpm db:migrate
   ```

5. **Run the schema preflight.** This must pass before deploying the API.

   ```bash
   pnpm db:verify
   ```

6. **Deploy the API revision**, setting `APP_RELEASE_SHA` to that revision. Confirm the new process logs show no schema-column errors.

7. **Deploy the web client revision** configured with the same public API origin. The web client must not point to an old preview API, local mock server, or a previous deployment URL.

8. **Verify live alignment** using the checks below, then do a hard reload in the browser after the `no-store` endpoint change.

## Verification checklist

| Check | Expected outcome | What failure means |
|---|---|---|
| `pnpm db:verify` | Prints `Schema preflight passed.` | The migration was not applied, failed part-way, or targeted the wrong database. |
| Production log search for `does not exist` | No new `author_id` or `age_restriction_reasons` errors. | API/database mismatch remains. Stop and correct the schema before relying on dynamic features. |
| `GET https://api.melaninmaps.com/api/version` | Returns the expected `APP_RELEASE_SHA` and deploy time with `Cache-Control: no-store`. | The browser/API is reaching an older deployment or the environment variables were not set. |
| Protected `/api/system/schema-status` with correct header | Includes `20260818_01_schema_compatibility_and_dynamic_tags.sql`. | The migration ledger does not reflect the intended production release. |
| Network request to map pins | `200`, not a stale `304`; response has `Cache-Control: private, no-store, max-age=0`. | Dynamic response caching is still masking updated data. |
| `SELECT * FROM approved_location_community_tags LIMIT 10` | Returns only moderated/approved aggregates with at least three confirmations. | The moderation pipeline or location/business mapping has not been populated yet. |
| Public web client check | The API base is `https://api.melaninmaps.com`; the response release matches the API version endpoint. | The web client is deployed from a different release or configured to a different API origin. |

## Essential operational rule

Do **not** interpret a dynamic community tag as an unqualified endorsement. Kinfolk should explain the context: “Community members in this location repeatedly described this verified provider using this approved tag.” It should never reveal member identities, private reviews, health information, or raw submissions. Medical-related community experiences remain distinct from clinical diagnosis and treatment.
