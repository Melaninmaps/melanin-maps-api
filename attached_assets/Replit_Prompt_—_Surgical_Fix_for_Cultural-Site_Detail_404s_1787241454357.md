# Replit Prompt — Surgical Fix for Cultural-Site Detail 404s

## Incident confirmed

The MLK House / Martin Luther King Jr. National Historic Site record exists and its canonical record endpoint succeeds:

```text
Canonical record ID:
162c3111-b895-43f8-9e46-dca341f12b87

Canonical path:
/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87/martin-luther-king-jr-national-historic-site-162c3111

GET /api/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87 -> HTTP 200
```

The live Cultural Site Detail client component parses the canonical route’s **ID**, but then calls the wrong endpoint:

```ts
fetch(`${apiBase}/api/directory/cultural-sites/${encodeURIComponent(id)}`, ...)
```

That endpoint returns HTTP 500 for MLK, Morehouse, and Bud Billiken. The working ID endpoint is `/api/cultural-sites/:id`. This client/API mismatch causes the live cultural-site detail failure.

## Owner authorization and scope

I authorize **only** the one-line active-client request correction described below, its directly generated web build output, focused regression coverage, and an isolated web deployment after proof passes.

Do not change API routes, server code, schema, migrations, cultural-site data, slugs, map data, public-art records, mobile, Kinfolk, preview, QR/waitlist behavior, configuration, build settings, or unrelated client files. Do not update dependencies. Do not fix the legacy `/api/directory/cultural-sites/:slug` endpoint in this task; that is a separate hardening item after the live detail path is restored.

## Exact source change

1. Locate the **single active web source file** containing this exact request path:

```text
/api/directory/cultural-sites/
```

It is the source for the existing cultural-site detail page handling both:

```text
/cultural-sites/:id
/cultural-sites/:id/:slug
```

2. Confirm that the same component extracts the first route parameter as the cultural-site `id` and redirects to `result.detailUrl` after a successful response.

3. Replace only the endpoint portion of the fetch call:

```diff
- fetch(`${apiBase}/api/directory/cultural-sites/${encodeURIComponent(id)}`, {
+ fetch(`${apiBase}/api/cultural-sites/${encodeURIComponent(id)}`, {
```

Preserve the existing request method, credentials mode, abort handling, loading/not-found/error states, response parsing, canonical `detailUrl` redirect, UI markup, styles, routes, and all other code exactly as they are.

4. There must be exactly one matching active fetch call and exactly one source-file change. If there are multiple active matches, generated artifacts, an alternate routing mechanism, or a reason that this change cannot be made exactly as shown, stop and return the file paths and explanation. Do not broaden scope.

## Required pre-deployment proof

Before building or deploying, return:

```bash
git diff --name-only
git diff -- <ACTIVE_CULTURAL_SITE_DETAIL_SOURCE_FILE>
grep -RIn --exclude-dir=node_modules --exclude-dir=dist \
  '/api/directory/cultural-sites/' artifacts/web client server

grep -RIn --exclude-dir=node_modules --exclude-dir=dist \
  '/api/cultural-sites/' <ACTIVE_CULTURAL_SITE_DETAIL_SOURCE_FILE>
```

The accepted source diff must be the one endpoint substitution above and no other behavioral/UI change.

Add or update only focused regression coverage proving that the detail component requests `/api/cultural-sites/<id>` for a canonical cultural-site URL. If the existing test location is outside the active detail feature, stop and ask before adding a test file.

## Required verification

Run the existing web type check/build and return results. Then verify with the authenticated audit account or an approved authenticated browser session:

| Test | Required result |
|---|---|
| MLK canonical detail record API | `GET /api/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87` returns 200. |
| MLK canonical page | `/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87/martin-luther-king-jr-national-historic-site-162c3111` renders the MLK site; it does not render a 404 or generic load-error page. |
| Refresh safety | Direct refresh on the same canonical URL succeeds. |
| Morehouse regression | `/cultural-sites/3dcf7e76-ab4e-4a53-ba28-38875421340a/morehouse-college-3dcf7e76` renders successfully. |
| Non-business behavior | MLK and Morehouse remain cultural-site entities, not business detail pages. |
| Canonicalization | A stale/mismatched slug is replaced with server-provided `detailUrl`; no display name is used to construct a URL. |

## Deployment boundary

Return the pre-deployment proof for owner review first. Do **not** deploy merely because the code/build checks pass. After separate owner approval, deploy only the isolated web revision containing this fix and the directly generated web build output.

## Required completion statement

> “Only the active cultural-site detail fetch endpoint was corrected from the failing directory-slug endpoint to the canonical cultural-site-by-ID endpoint. No cultural-site records, slugs, API routes, database/schema, map behavior, mobile, Kinfolk, preview, QR/waitlist, configuration, or unrelated files were changed.”
