# Shared Location Input Repair

## Confirmed failures

The screenshots show three independent but related defects:

| Defect | Visible result | Required correction |
|---|---|---|
| Input foreground color inherits a light value on a light surface. | A member can type `Bookstore` or an area but cannot read it. | Use the explicitly scoped `mwm-readable-input` foreground, caret, placeholder, and autofill styles. |
| Browser geolocation and typed-area actions have no visible completion/failure state. | “Use my location” and “Search area” appear to do nothing. | Use one resolver that displays locating, selected-area, permission-denied, timeout, unavailable, and not-found states. |
| Each page owns a slightly different implementation. | Businesses, Explore, and Events repeat the same invisible-input failure. | Replace all page-local controls with `LocationSearchBar` and one shared location context. |

## Required installation

1. Import `client/src/styles/location-search.css` once in the application stylesheet.
2. Register `registerLocationResolutionRoutes(app, pool)` after authentication middleware and before the generic API 404 handler.
3. Confirm the resolver queries the existing canonical location index. This patch names it `community_locations`; if production uses `cities` or `service_areas`, adapt the **one repository query** rather than introducing a duplicate location dataset.
4. Apply `locationInputIntegration.patch.tsx` to Businesses, Explore, and Events.
5. Remove all page-local `navigator.geolocation` handlers and all conflicting input `color`, `-webkit-text-fill-color`, `opacity`, or dark-theme inheritance rules.
6. Delete the exact sentence requested from the Businesses empty state:

```text
We will not show a nationwide list and label it local.
```

Do not replace it with a warning. The interface already communicates location-first behavior through its controls and results.

## Behavior contract

| Member action | Required visible response |
|---|---|
| Types in either field | Text, caret, selection, and autofill contents are dark and readable on the white input surface. |
| Presses Enter or **Search area** | Searches the area and says `Showing results for {area}`. |
| Presses **Use my location** and grants permission | Shows `Finding location…`, then `Showing results for {area}`. |
| Denies permission | Explains that permission was not granted and keeps manual city search available. |
| Browser cannot locate the member | Explains the issue and keeps manual city/neighborhood search available. |
| Enters an unsupported area | Says the area was not found and gives the Charlotte, NC example. |

## Page responsibilities

**Businesses** uses both the service query and area. **Explore** uses only the area plus curated experience themes; it does not become a duplicate directory. **Events** uses the area plus dates/categories. All three write the resolved area to the same shared location context so a member who chooses Charlotte does not have to repeat it on the next page.

## Regression gate

Run `tests/locationInput.spec.ts` at the production build before release. The gate must pass on Businesses, Explore, and Events:

* `Charlotte, NC` is visible after typing.
* The input foreground is `rgb(40, 20, 10)`, not white/transparent.
* A typed location produces an explicit success state.
* Location denial produces a visible manual-entry instruction.
* The deleted nationwide-list sentence does not appear in the Businesses page source or rendered output.

No location action should be released if it leaves the member guessing whether anything happened.
