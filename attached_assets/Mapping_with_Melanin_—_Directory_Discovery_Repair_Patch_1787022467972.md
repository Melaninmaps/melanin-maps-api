# Mapping with Melanin — Directory Discovery Repair Patch

This patch addresses the two broken journeys shown in the screenshots. First, every cultural-site “View Details” action is routed through one canonical URL that resolves by record ID, so an incorrect or stale slug cannot create a 404. Second, a search for `Book Store`, `Bookstore`, `book shop`, or `bookshop` becomes a **location-first directory discovery request**, not a nationwide category dump.

The directory remains a directory. Kinfolk does not take over the page. The same retrieval result is recorded in the background as a privacy-preserving coverage signal so the product can measure where verified bookstore listings are missing and, when appropriate, make that context available to Kinfolk’s existing retrieval layer.

## Intended member behavior

| Member action | Required result |
|---|---|
| Clicks **View Details** for a cultural site on the map or a card. | Opens `/cultural-sites/:id/:slug`; the server resolves the ID and the client redirects legacy/malformed links to the canonical URL. |
| Searches `Book Store`, `Bookstore`, `book shop`, or `bookshop`. | Is asked to share location before any online recommendation is shown. |
| Shares location and a verified bookstore exists within the configured radius. | Sees the **single closest** bookstore first, with distance, address, and a link to its details. No nationwide dump is presented. |
| Shares location and no verified bookstore exists within the configured radius. | Sees one team-approved online bookstore recommendation, explicitly described as a directory coverage gap rather than proof that no local bookstore exists. |
| Searches from an area without a nearby verified listing. | The system stores only a coarse location cell and anonymous search outcome. Product reporting can identify coverage gaps after a minimum volume threshold. |

## File map

| File | Purpose |
|---|---|
| `db/migrations/20260817_directory_discovery.sql` | Adds the verified online-source table, anonymous coverage-signal table, and geospatial columns/indexes. |
| `server/directory/bookstoreDiscovery.ts` | Normalizes bookstore intent, calculates distance, ranks the closest listing, controls fallback, and records anonymous gap signals. |
| `server/directory/postgresDirectoryRepository.ts` | Parameterized PostgreSQL adapter. It is the single place to align this patch with existing table or column names. |
| `server/directory/registerDirectoryRoutes.ts` | Registers directory APIs for closest-bookstore discovery and cultural-site lookup. |
| `server/directory/bookstoreCoverageGaps.ts` | Supplies aggregate gap reporting and a safe text context for the existing Kinfolk retrieval layer. |
| `client/src/features/directory/BookstoreDiscoveryPanel.tsx` | Prompts for location and renders one closest result or a controlled online fallback. |
| `client/src/features/directory/directorySearch.patch.tsx` | Shows the exact interception needed on the current directory page. |
| `client/src/features/cultural-sites/*` | Supplies the canonical cultural-site URL, resolver page, and map-popup replacement. |
| `server/spaFallback.patch.ts` | Prevents direct or refreshed cultural-site URLs from reaching a server 404. |
| `server/directory/bookstoreDiscovery.test.ts` | Regression tests for the reported bookstore issue and fallback conditions. |

## Apply in this order

### 1. Migrate and clean the data

Run `db/migrations/20260817_directory_discovery.sql` using the application’s normal database migration command. Before release, ensure every business that should be returned as a local result has a verified latitude, longitude, active status, and category/subcategory/tag containing a bookstore alias. A business without valid coordinates must not be eligible for “closest to you,” because it cannot be ranked accurately.

Add only editorially approved online sources to `online_bookstores` and set `is_verified = TRUE`. The patch intentionally contains no preloaded vendor recommendation; this prevents an unreviewed external seller from being surfaced automatically.

### 2. Register the server-side repository and routes

In the existing server bootstrap file, create the repository with the project’s PostgreSQL client and register the directory routes **before** any broad `GET /api/search/universal` handler and before the SPA fallback.

```ts
import { createPostgresDirectoryRepository } from "./directory/postgresDirectoryRepository";
import { registerDirectoryRoutes } from "./directory/registerDirectoryRoutes";
import { registerSpaFallback } from "./spaFallback.patch";

const directoryRepository = createPostgresDirectoryRepository(dbPool);

registerDirectoryRoutes(app, directoryRepository);
registerExistingApiRoutes(app);
registerSpaFallback(app); // must be last
```

If the project uses an ORM rather than a `pg`-style client, keep the `DirectoryRepository` interface unchanged and replace only the query implementation in `postgresDirectoryRepository.ts`. Do not place query parsing, nearest-result logic, or fallback logic in the React component.

### 3. Make bookstore search location-first

Apply `client/src/features/directory/directorySearch.patch.tsx` to the existing directory component. The important decision is this branch:

```ts
if (isBookstoreQuery(trimmedQuery)) {
  setSearchMode("bookstore");
  return;
}
```

This prevents `Book Store` from entering the generic intent path that caused the “Named Business Intent / no results” screen. It also prevents `Bookstore` from returning an unranked mix of cultural sites and businesses. The existing universal search still handles all other categories and named-business searches.

Mount `BookstoreDiscoveryPanel` in the bookstore branch. It first calls the closest-bookstore API without coordinates; the API responds that location is required. The browser asks for location only after the member chooses **Share location and continue**. The browser’s precise coordinates are used only for the live distance calculation. The persistent signal is a rounded 0.05-degree cell, not a member ID, street address, IP address, or exact coordinates.

### 4. Repair cultural-site URLs

Add this route **above** the catch-all route:

```tsx
<Route path="/cultural-sites/:id/:slug?" element={<CulturalSiteDetailsPage />} />
```

Replace every map popup/card `View Details` URL with `site.detailUrl || culturalSiteDetailUrl(site)`, as shown in `culturalSiteRouting.patch.tsx`. Update map/list API mappers to include `detailUrl` from the server. A link must never be constructed from `site.name`, a legacy marker field, or a display string.

The `CulturalSiteDetailsPage` fetches the record by ID. If a slug is stale, it redirects to the record’s canonical URL; if the ID is absent or unpublished, it shows a useful in-app not-found state instead of routing the member to a generic 404.

### 5. Connect the background intelligence without changing the directory experience

The live directory request already calls `recordDirectorySearchSignal` asynchronously. This means a successful member-facing response does not wait for reporting work. The aggregate coverage query in `bookstoreCoverageGaps.ts` can run in an internal dashboard or a low-frequency daily task. It returns only cells with at least five fallback signals by default.

When the existing Kinfolk service performs a bookstore-related retrieval, it should call the same `discoverClosestBookstore` service or the same closest-bookstore API first. After retrieval, it may add the output of `buildKinfolkBookstoreContext(...)` to its server-side context. That context is deliberately bounded:

```ts
const directoryResult = await discoverClosestBookstore(directoryRepository, {
  query: memberQuestion,
  location: memberCoordinates,
});

const directoryContext = buildKinfolkBookstoreContext({
  radiusMiles: directoryResult.radiusMiles,
  closestBookstoreName: directoryResult.closestBookstore?.name ?? null,
  nearestDistanceMiles: directoryResult.closestBookstore?.distanceMiles ?? null,
});

// Pass directoryContext to the existing Kinfolk retrieval/context layer.
// Do not turn the directory UI into a Kinfolk chat screen.
```

The directory’s response remains the authority for live proximity results. Kinfolk augments the product in the background and must preserve the distinction between **“no verified listing within the selected radius”** and **“no bookstore exists.”**

## Required regression checks

Run the included `bookstoreDiscovery.test.ts` through the existing test runner. The release gate should also include manual checks in a browser.

| Check | Expected outcome |
|---|---|
| Search `Book Store` near Charlotte with Urban Reader’s approved coordinates present. | Urban Reader Bookstore appears as the closest result. |
| Search `Bookstore`, `book shop`, and `BOOK-SHOP` from the same location. | The same intent behavior and location prompt occur. |
| Deny location permission. | The directory asks again or accepts a future location share; it does **not** recommend an online store yet. |
| Search from a location with no verified local result within 25 miles. | One verified online fallback appears, with a clear coverage-gap explanation. |
| Click **View Details** on multiple cultural-site map markers. | Each opens a canonical cultural-site URL; refresh still works; no 404. |
| Open a legacy cultural-site link with a valid ID and wrong slug. | The page loads the correct record and replaces the URL with the canonical slug. |
| Review the coverage table. | No member ID, exact coordinates, IP address, or raw address is present. |

## Operations notes

The default local radius is **25 miles** and the endpoint allows a deliberate, bounded range of **5–100 miles**. Keep the default local enough to make the nearest result meaningful. If the product later offers a “show more nearby options” control, preserve the closest result as the primary card and sort additional results by distance; do not replace the location-first result with a nationwide category grid.

To correct location accuracy over time, give operations a review queue for listings that are missing coordinates, have geocoding confidence below the team’s threshold, or have a mismatch between address, city/state, and coordinates. The system should record that a listing is unverified rather than quietly using a guessed coordinate.
