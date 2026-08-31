# Replit Prompt — Surgical Fix for Cultural-Site Indefinite Loading

## Root cause confirmed in the active preview revision

Do not deploy the current `App.tsx` route correction yet.

The route mapping itself is now correct: canonical cultural-site URLs remain under `/cultural-sites/` and no longer redirect to `/places/:id`. However, the existing `CulturalSiteDetail` component is written only for the legacy path:

```ts
useRoute("/sites/:id")
```

The active canonical routes now mount that component at:

```text
/cultural-sites/:id
/cultural-sites/:id/:slug
```

Because the component does not match either canonical path, it receives no `id`; therefore it never calls `/api/cultural-sites/:id` and stays on the loading spinner forever. The failure was reproduced for MLK, Morehouse, and Bud Billiken on initial navigation and refresh.

## Owner authorization and strict scope

I authorize only the minimal active-component parameter-resolution correction described below, its directly generated ordinary web build output, and preview verification. **No production deployment is authorized by this request.**

Permitted source scope:

```text
artifacts/web/src/pages/<the existing source file that exports CulturalSiteDetail>
```

No other source file may be changed. In particular, do not modify `App.tsx` again, `universal-place-detail.tsx`, the inactive `cultural-site-details-page.tsx`, server/API code, data, slugs, database/schema, map behavior, mobile, Kinfolk, preview, QR/waitlist behavior, configuration, dependencies, build settings, or deployments.

## Exact code change

Locate the active existing component currently mounted at `/sites/:id` and exported/imported as `CulturalSiteDetail`. Confirm it currently reads only:

```ts
const [matches, params] = useRoute("/sites/:id");
```

Replace that single-route read with canonical-aware ID resolution that supports all three existing routes, without changing the fetch, UI, error states, redirect behavior, styles, or any other logic.

Use this exact pattern, adapted only to the existing local variable names and Wouter import already present:

```ts
const [, legacyParams] = useRoute("/sites/:id");
const [, canonicalParams] = useRoute("/cultural-sites/:id");
const [, canonicalSlugParams] = useRoute("/cultural-sites/:id/:slug");

const id =
  canonicalSlugParams?.id ??
  canonicalParams?.id ??
  legacyParams?.id ??
  "";
```

The component must continue to call only:

```ts
/api/cultural-sites/${encodeURIComponent(id)}
```

Do not use `window.location`, manually parse URLs, infer an ID from a slug/display name, add a server fallback, or redirect cultural sites to `/places/:id`.

## Mandatory stop-before-edit proof

Return these outputs before editing:

```bash
# Identify the one active component source file and existing legacy matcher.
grep -RIn --exclude-dir=node_modules --exclude-dir=dist \
  'useRoute("/sites/:id")' artifacts/web/src

# Prove the same file already fetches the canonical cultural-site API.
grep -RIn --exclude-dir=node_modules --exclude-dir=dist \
  '/api/cultural-sites/' artifacts/web/src/pages artifacts/web/src/features

# Prove no active App route source must change again.
grep -nE 'path="/cultural-sites/:id' artifacts/web/src/App.tsx
```

Stop and request clarification if the legacy matcher and canonical API call are not in the same active component, if more than that one component source file would need change, or if the route correction in `App.tsx` is missing/reverted.

## Required pre-preview proof

After the one-file edit, return:

```bash
git diff --name-only
git diff -- <ACTIVE_CULTURAL_SITE_DETAIL_SOURCE_FILE>
grep -nE 'useRoute\("/sites/:id"\)|useRoute\("/cultural-sites/:id' <ACTIVE_CULTURAL_SITE_DETAIL_SOURCE_FILE>
grep -n '/api/cultural-sites/' <ACTIVE_CULTURAL_SITE_DETAIL_SOURCE_FILE>
```

The accepted diff must contain only the addition of canonical route parameter matching/ID precedence in the active `CulturalSiteDetail` component. No fetch endpoint, markup, styling, error state, or unrelated behavior may change.

## Required preview verification

Run the current committed route mapping plus this one component correction in the Replit **web preview**. Authenticate normally with the disposable audit account. Do not deploy.

For each URL below, run an initial direct navigation and one refresh:

| Site | URL path | Expected title |
|---|---|---|
| MLK | `/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87/martin-luther-king-jr-national-historic-site-162c3111` | `Martin Luther King Jr. National Historic Site` |
| Morehouse | `/cultural-sites/3dcf7e76-ab4e-4e62-ac50-e64f9c3fe09f/morehouse-college-3dcf7e76` | `Morehouse College` |
| Bud Billiken | `/cultural-sites/bd0d4816-874e-4e62-ac50-e64f9c3fe09f/bud-billiken-parade-and-picnic-bd0d4816` | `Bud Billiken Parade and Picnic` |

All six loads must meet every requirement:

```text
- final URL remains under /cultural-sites/
- expected <h1> renders; the page never remains on a spinner
- no “Cultural site not found” or “We could not load this cultural site” UI
- exactly one matching GET /api/cultural-sites/<id> returns 200
- zero GET /api/places/<same-id> calls
- zero browser console errors
```

Also retain the existing known-good preview place control:

```text
/places/6fc8f881-99cb-4dd9-bc05-cc6ebaaf3c0e/44th-3rd-bookseller-atlanta
```

Verify it remains on `/places/`, renders `44th & 3rd Bookseller`, and receives `GET /api/places/6fc8f881-99cb-4dd9-bc05-cc6ebaaf3c0e` with 200 initially and permitted 304 revalidation on refresh.

Return the full six-load cultural evidence table, screenshots, network summary, console summary, place control result, and final one-file diff. If any check fails, stop; do not modify additional files or request deployment.

## Next action

Only if preview passes may Replit request separate owner approval to deploy the isolated two-file route correction:

```text
artifacts/web/src/App.tsx
<ACTIVE_CULTURAL_SITE_DETAIL_SOURCE_FILE>
```
