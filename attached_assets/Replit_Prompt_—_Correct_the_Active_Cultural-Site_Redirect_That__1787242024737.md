# Replit Prompt — Correct the Active Cultural-Site Redirect That Causes MLK House 404s

## Corrected root cause

Do **not** apply the earlier inactive `cultural-site-details-page.tsx` endpoint patch. Replit correctly established that it is not part of the active route flow.

The active production flow is instead:

```text
/cultural-sites/:id
/cultural-sites/:id/:slug
    -> LegacyPlaceRedirect in artifacts/web/src/pages/universal-place-detail.tsx
    -> /places/:id
    -> /api/places/:id
    -> HTTP 404 for cultural-site IDs
```

This is a category-routing error. Cultural-site IDs are valid at `/api/cultural-sites/:id` but do not exist in the separate places catalog.

Read-only API reproduction confirms the issue for multiple cultural entities:

| Cultural site | `/api/places/:id` | `/api/cultural-sites/:id` |
|---|---:|---:|
| Martin Luther King Jr. National Historic Site | 404 | 200 |
| Morehouse College | 404 | 200 |
| Bud Billiken Parade and Picnic | 404 | 200 |

The public canonical MLK route that must work is:

```text
/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87/martin-luther-king-jr-national-historic-site-162c3111
```

## Owner authorization and strict scope

I authorize only the **active client-route correction** that stops cultural-site URLs from being redirected to `/places/:id` and instead renders the already-active cultural-site detail component that fetches `/api/cultural-sites/:id`.

Do not change data, slugs, server/API routes, database/schema, map behavior, business routing, universal place behavior outside cultural-site URLs, mobile, Kinfolk, preview, QR/waitlist, configuration, dependencies, build settings, or deployment settings.

Do not edit the inactive `artifacts/web/src/pages/cultural-site-details-page.tsx` in this task. Do not delete it. Do not repair the legacy `/api/directory/cultural-sites/:slug` endpoint in this task.

## Exact implementation requirement

The existing route `/sites/:id` already renders an active cultural-site detail component that calls `/api/cultural-sites/:id`. Reuse that **same existing component** for both canonical cultural routes.

In `artifacts/web/src/App.tsx`, replace only the routed component for these existing paths:

```text
/cultural-sites/:id
/cultural-sites/:id/:slug
```

Change them from `LegacyPlaceRedirect` to the exact existing component already used by:

```text
/sites/:id
```

Use the component’s existing import. If it is not already imported by `App.tsx`, add only that one import. Do not duplicate the component, create a new detail component, or modify `universal-place-detail.tsx`.

The intended route behavior after the change is:

```text
/cultural-sites/:id
/cultural-sites/:id/:slug
    -> existing CulturalSiteDetail component
    -> GET /api/cultural-sites/:id
    -> renders cultural-site detail
```

The canonical `:slug` segment is URL decoration; the component may continue to resolve by `:id`. If the existing cultural-site detail component already canonicalizes to `detailUrl`, retain that behavior. Do not generate a new slug from display text.

## Stop before editing unless all checks pass

Before editing, return:

```bash
# Prove the active cultural-site component currently used for /sites/:id
grep -nE 'path="/sites/:id"|path="/cultural-sites/:id' artifacts/web/src/App.tsx

# Prove which exact component /sites/:id uses
grep -nE 'LegacyPlaceRedirect|CulturalSite' artifacts/web/src/App.tsx

# Prove the existing /sites/:id component uses the correct API
grep -RIn --exclude-dir=node_modules --exclude-dir=dist \
  '/api/cultural-sites/' artifacts/web/src/pages artifacts/web/src/features

# Prove LegacyPlaceRedirect is the current incorrect destination
grep -RIn --exclude-dir=node_modules --exclude-dir=dist \
  'LegacyPlaceRedirect|/places/' artifacts/web/src/pages/universal-place-detail.tsx artifacts/web/src/App.tsx
```

Stop and ask for instruction if:

1. `/sites/:id` does not use a component that calls `/api/cultural-sites/:id`;
2. more than `App.tsx` and, only if necessary, its existing component import would need to change;
3. the active route structure differs from the description above;
4. a router/configuration/API/server/data/schema change appears necessary.

## Required pre-deployment proof

After the edit but before build/deployment, return:

```bash
git diff --name-only
git diff -- artifacts/web/src/App.tsx
grep -nE 'path="/cultural-sites/:id' artifacts/web/src/App.tsx
```

Accepted scope:

```text
artifacts/web/src/App.tsx
```

An added import in `App.tsx` is allowed only if the existing cultural-site component is not already imported. No other source file may change. Directly generated ordinary web build output may be produced later by the normal web build, but no unrelated checked-in output may be committed or promoted.

## Required regression verification

Run the existing web type check/build and focused route test if an existing route-test location already exists. Do not add a new test framework or alter dependency/configuration files.

With an authenticated audit session, verify all of the following before requesting deployment approval:

| Test | Required result |
|---|---|
| MLK canonical API | `GET /api/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87` returns 200. |
| MLK canonical URL | The canonical `/cultural-sites/:id/:slug` route renders the MLK cultural-site detail; it never redirects to `/places/:id` and never shows 404/load-error UI. |
| MLK ID-only URL | `/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87` also renders correctly. |
| Refresh safety | A direct refresh on the canonical MLK URL renders correctly. |
| Morehouse | `/cultural-sites/3dcf7e76-ab4e-4a53-ba28-38875421340a/morehouse-college-3dcf7e76` renders correctly and does not redirect to `/places/:id`. |
| Bud Billiken | `/cultural-sites/bd0d4816-874e-4e62-ac50-e64f9c3fe09f/bud-billiken-parade-and-picnic-bd0d4816` renders correctly and does not redirect to `/places/:id`. |
| Place routes | Existing `/places/:id` behavior remains unchanged. |

## Deployment boundary

Return pre-deployment proof first. No deployment is authorized merely by this instruction. After separate owner approval, deploy only the isolated web revision that contains this route correction and directly generated standard web build output.

## Required completion statement

> “Only the two active cultural-site route mappings were changed to use the existing cultural-site detail component. Canonical cultural-site URLs no longer redirect to the incompatible `/places/:id` flow. No cultural-site records, slugs, server/API routes, database/schema, map behavior, business/place behavior, mobile, Kinfolk, preview, QR/waitlist, configuration, or unrelated source files were changed.”
