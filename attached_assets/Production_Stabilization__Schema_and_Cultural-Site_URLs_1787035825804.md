# Production Stabilization: `slug` Schema and Cultural-Site URLs

## What this release fixes

The production message `column "slug" does not exist` proves that the deployed location-first search code expects a field that the production database does not provide. The cultural-site 404 is a separate, but related, contract failure: the map/client emits a detail URL that the deployed web router and refresh path do not resolve consistently.

This patch establishes two non-negotiable contracts:

| Contract | Required behavior |
|---|---|
| Canonical entity identity | Every cultural site has a non-empty, unique `slug`, but its UUID remains the authoritative identifier. |
| Canonical detail URL | Every API response, map pin, and detail link uses `/cultural-sites/:id/:slug`. |
| Direct access and refresh | Opening or refreshing a canonical web URL serves the React client, which fetches the detail record by ID and corrects an outdated slug. |
| No silent schema failure | The schema migration completes before any API build that selects `slug` is promoted. |

## Production deployment order

Do not deploy the client patch by itself. Use this order in Replit:

1. **Back up PostgreSQL** and note the active API and web build SHA.
2. Put `20260818_03_canonical_slugs.sql` into the production migration directory.
3. Run the migration once against the same `DATABASE_URL` used by `api.melaninmaps.com`.
4. Run the SQL verification queries below. Stop if any returns an error or a non-zero count.
5. Deploy the API code containing `canonicalCulturalSiteRepository.ts` and `registerCanonicalCulturalSiteRoutes.ts`.
6. Deploy the web-client route and `CulturalSiteDetailPage.tsx`.
7. Install `registerSpaFallback` **only on the service that serves the compiled web client**. If API and web are separate Replit deployments, this belongs in the web deployment, not the API deployment.
8. Run the Playwright checks against the production build with a real seeded cultural-site ID and slug.
9. Test one old map link, one direct canonical URL, and one browser refresh. Only then resume the bookstore/location acceptance checks.

## Required SQL verification

Run these immediately after the migration:

```sql
-- Must return exactly one row with has_slug = true.
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'cultural_sites'
    AND column_name = 'slug'
) AS has_slug;

-- Must return 0.
SELECT count(*) AS empty_cultural_site_slugs
FROM cultural_sites
WHERE slug IS NULL OR btrim(slug) = '';

-- Must return 0 rows. A duplicate would make a readable URL ambiguous.
SELECT slug, count(*)
FROM cultural_sites
GROUP BY slug
HAVING count(*) > 1;

-- Use a known record. It must return id, slug, and name.
SELECT id, slug, name
FROM cultural_sites
WHERE id = '<known-cultural-site-id>';
```

## Required server registration

```ts
app.use(express.json());
app.use(express.static(clientDistDirectory));

registerCanonicalCulturalSiteRoutes(app, culturalSiteRepository);

// Only for the web-serving deployment; this must remain LAST.
registerSpaFallback(app, clientDistDirectory);
```

A broad SPA fallback registered before API routes is unsafe: it can convert API 404s into HTML `200` responses and hide errors. Conversely, omitting the fallback causes a valid direct cultural-site URL to return the hosting service's 404 after refresh.

## Client route and link rule

Register this React Router route:

```tsx
<Route path="/cultural-sites/:id/:slug?" element={<CulturalSiteDetailPage />} />
```

Map pins, result cards, and “View Details” controls must always use the server-supplied `detailUrl`. Do not build URLs with `name`, `title`, or a client-generated slug.

## Why the ID is required

A title can change, duplicate, or contain punctuation. The UUID never changes. Keeping both pieces in the URL gives people a readable link while allowing the page to resolve the right record even after an editorial rename. If only the human-readable slug is stale, the client replaces it with the current canonical URL; it does not show a 404.

## Release acceptance checklist

| Check | Expected result |
|---|---|
| Search `Bookstore` | No `slug` database error; the location-first prompt or ranked local result renders. |
| Search `Bookstore Charlotte NC` | The query either renders closest verified Charlotte results or a truthful no-nearby fallback. |
| Cultural-site map card | `View Details` points to `/cultural-sites/<UUID>/<slug>`. |
| Pasted canonical URL | Loads the cultural-site detail page. |
| Browser refresh on a detail page | Loads the same detail page; no host-level 404. |
| Old single-segment slug URL | Redirects to the canonical ID-plus-slug URL or provides a clear not-found page. |
| Missing UUID | Returns API `404` JSON and a human-readable client not-found page. |

The release should be blocked if any of these checks fail. This prevents a new UI from relying on a database or deep-link behavior that production does not yet provide.
