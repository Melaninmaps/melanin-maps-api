# Universal Non-Business Map Entity Stabilization

## The defect shown

The map has two disconnected systems: one source still renders non-business markers, while the Cultural Sites and HBCUs side panels query another source that returns zero. The detail links then use type-specific paths that do not have a reliable route, so every non-business pin can lead to a 404.

This is not acceptable map behavior. A pin is a claim that the corresponding published record, list item, and detail page exist.

## Permanent invariant

> **A non-business map entity may render only when one canonical published record supplies its pin coordinates, category-list row, and canonical detail URL.**

The source is `published_map_entities`. The API sends one `items` array; `UniversalEntityLayer` consumes the exact same array for both pins and side-panel rows. A category cannot show `0 sites` while those same category pins are visible.

## 1. Apply the migration

```bash
pnpm db:migrate
```

The migration creates `map_entities`, `map_entity_aliases`, and `published_map_entities`. Do not maintain new cultural-site/HBCU pins in a separate browser-only collection after this point.

## 2. Import existing records

Write one migration/import adapter for each existing source table—Cultural Sites, HBCUs, Festivals, Community Events, Markets, Public Art, and Heritage Markers. Each adapter must upsert the source record into `map_entities` with:

- `entity_kind`
- stable UUID
- server-generated slug
- city/address
- location coordinates from the approved geocoder
- `published=true` only after validation
- `source_record_id` and `map_entity_aliases` for legacy traceability

The import must not delete or hide a source record merely because an old type-specific slug route is broken.

## 3. Restore Atlanta HBCUs before production promotion

Run the `ATLANTA_HBCU_SEED` importer, then use the approved server geocoder on the supplied institution-backed addresses. Do not insert guessed browser coordinates. The promotion verifier requires at least these six published, resolved, routable Atlanta records:

| Institution | Institution-backed source |
|---|---|
| Clark Atlanta University | Atlanta University Center Consortium member list [1] |
| Morehouse College | Morehouse College contact page [2] |
| Spelman College | Atlanta University Center Consortium member list [1] |
| Morehouse School of Medicine | Morehouse School of Medicine contact page [3] |
| Morris Brown College | Morris Brown College contact page [4] |
| Interdenominational Theological Center | ITC map and directions [5] |

## 4. Register the universal APIs

```ts
registerUniversalMapEntityRoutes(app, pool);
```

All non-business map requests must use:

```text
GET /api/map/entities?kind={entity_kind}&city={city}
GET /api/places/{id}
```

Never query a legacy cultural-site or HBCU table directly from the client map pane. The API has exactly one response source for list and pins.

## 5. Mount the universal map and detail components

```tsx
<UniversalEntityLayer kind="cultural_site" city={selectedCity} renderPins={(items) => <MapPins items={items} />} />
<UniversalEntityLayer kind="hbcu" city={selectedCity} renderPins={(items) => <MapPins items={items} />} />
```

Every non-business card and pin must link only to:

```text
/places/{uuid}/{slug}
```

Mount `UniversalPlaceDetailPage` at `/places/:id/:slug?`. The page resolves the UUID, corrects an obsolete readable slug, and handles direct visits/refreshes when the web host uses the standard SPA fallback. Redirect old cultural-site and HBCU URLs to this route rather than rendering another type-specific page.

## 6. Make failure impossible to promote

Run:

```bash
API_BASE_URL=https://api.melaninmaps.com \
WEB_BASE_URL=https://www.mappingwithmelanin.com \
pnpm tsx scripts/verifyUniversalMapEntities.ts
```

The release must fail when any of the following is true:

1. Atlanta has fewer than six published, resolved HBCU entities.
2. A category endpoint reports an item with no coordinates, no detail URL, or no ID.
3. A canonical web detail URL returns an error.
4. A canonical API detail request returns an error.
5. The client passes a global pin collection instead of the category API `items` array.

The current screenshots would fail this gate: the visible Cultural Site markers cannot coexist with `0 sites`, and Atlanta cannot report `0 hbcu` after the canonical seed is resolved.

## References

[1]: https://aucenter.edu/member-institutions/ "Atlanta University Center Consortium — Member Institutions"

[2]: https://morehouse.edu/contact-us "Morehouse College — Contact Us"

[3]: https://www.msm.edu/about_us/facts/facts_contactus.php "Morehouse School of Medicine — Contact Us"

[4]: https://morrisbrown.edu/contact-us/ "Morris Brown College — Contact Us"

[5]: https://www.itc.edu/about/map-direction/ "Interdenominational Theological Center — Map & Directions"
