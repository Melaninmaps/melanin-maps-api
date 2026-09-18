# Railway full-API cutover for Mapping with Melanin

**Purpose:** Make the existing Railway `melanin-maps-api` application service run the complete Mapping with Melanin API and website bundle, rather than the current static frontend proxy. This is the required infrastructure change for live KinfolkAI, shared business search, map pins, and the directory database.

**Release branch:** `fix/railway-full-api-cutover-20260917`

> This release does not add, modify, or delete users. It does not alter authentication, login, password reset, session handling, waitlist entries, or directory records. Its only source change is the Railway build/start configuration in `nixpacks.toml`.

## What the source change does

The revised Railway configuration builds the current website, places that built website inside the API server's static-public directory, builds the API, and starts the API server. The API server already serves the website and the `/api/*` routes from one public domain.

```toml
[phases.build]
cmds = [
  "corepack enable",
  "pnpm install --frozen-lockfile",
  "pnpm --filter @workspace/web run build",
  "rm -rf artifacts/api-server/web-static",
  "mkdir -p artifacts/api-server/web-static",
  "cp -R artifacts/web/dist/public/. artifacts/api-server/web-static/",
  "pnpm --filter @workspace/api-server run build",
]

[start]
cmd = "pnpm --filter @workspace/api-server run start"
```

The command sequence was run successfully from a clean worktree. It produced a non-empty `artifacts/api-server/dist/index.mjs` API bundle and `artifacts/api-server/dist/public/index.html` website bundle.

## One required Railway setting before merging

Railway currently has an `OPENAI_API_KEY`, but the app service must also receive the existing Railway PostgreSQL connection as a variable named **`DATABASE_URL`**. The complete API will intentionally refuse traffic without it rather than quietly run against an unknown or empty database.

In Railway, perform exactly the following in the **application service** (not the PostgreSQL service):

1. Open **Projects** → **melanin-maps-api**.
2. Open the service that has the GitHub/source-code icon. Do **not** open the PostgreSQL database service.
3. Open **Variables**.
4. Click **Add Variable** and choose the existing PostgreSQL database/service as the value source/reference.
5. Create a variable named `DATABASE_URL` that references that service's Railway-generated connection URL. Do not paste it into chat or GitHub and do not create a new database.
6. Confirm that only the **name** `DATABASE_URL` is present in the application service's variable list. The value should remain masked.
7. Confirm the existing `OPENAI_API_KEY` remains present. Do not replace or reveal it.

The existing `OPENAI_API_KEY` is sufficient for Kinfolk under the merged production configuration. No new OpenAI key is needed unless its provider account has independently revoked or exhausted that key.

## Merge and deploy

After `DATABASE_URL` is linked, merge this branch into `main`. Railway's existing GitHub integration will create the deployment. Do not add a Railway dashboard build command or start command override; allow the checked-in `nixpacks.toml` to control the release.

Railway must leave the deployment health check at:

```text
/api/healthz
```

## Required live checks

Run the following after Railway reports the deployment healthy. Replace nothing in the commands.

```bash
curl -fsS https://api.melaninmaps.com/api/healthz
curl -fsS https://api.melaninmaps.com/api/readyz
curl -fsS https://api.melaninmaps.com/api/kinfolk/health
curl -fsS https://api.melaninmaps.com/api/version
```

Expected results:

| Endpoint | Required result |
|---|---|
| `/api/healthz` | JSON with `"status":"ok"` |
| `/api/readyz` | JSON with `"status":"ok"` and `"db":"ok"` |
| `/api/kinfolk/health` | HTTP 200 and `{"ok":true}` |
| `/api/version` | `built_from_sha` begins with the merge commit SHA and `stale_bundle` is `false` |

Then confirm live behavior in the web app and both native apps:

1. Open **Find a business**, search by a complete or slightly misspelled business/service name, and confirm results load.
2. Use the map, tap a business pin, and confirm it opens that business's listing.
3. Ask Kinfolk, “Help me find a braider near me,” and confirm it gives a normal response with listing cards when directory matches exist.
4. Ask Kinfolk one ordinary question such as, “What are some ideas for a quiet weekend?” and confirm it answers as a general chatbot.

## Do not do during this cutover

- Do not replace, reset, or reveal `OPENAI_API_KEY`.
- Do not create, delete, or import users.
- Do not edit the waitlist or access-entitlement data.
- Do not bulk-publish the review-only directory package as part of this service cutover.
- Do not point `DATABASE_URL` to a local, test, new, or empty database.

Once these checks pass, future approved directory additions go through the protected review-and-publish workflow and do **not** require a new iOS or Android build.
