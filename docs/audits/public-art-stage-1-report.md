# Inclusive Public-Art Seed Audit — Stage 1

**Status:** Read-only, non-public research package  
**Scope:** Atlanta, Philadelphia, and Chicago only  
**Audit date:** 2026-08-19  
**Import/publication status:** None. All candidates remain `in_review`.

## 1. Current schema and route report

### Universal non-business entity contract

| Area | Current implementation | Stage 1 finding |
|---|---|---|
| Entity kinds | `artifacts/api-server/src/map/ensureUniversalMapEntities.ts:5-15` includes `public_art` alongside cultural sites, HBCUs, festivals, markets, events, and heritage markers. | Public art has a universal entity kind. |
| Basic entity fields | `ensureUniversalMapEntities.ts:17-34` carries ID, kind, title, slug, summary, public location, coordinates, website/source URLs and labels, and source-record ID. The migration/upsert contract is at `:109-219`. | It can record a basic pin and one source URL, but not structured artist attribution, access/work status, review workflow, multi-source provenance, or documented community context. |
| Public-art classification | `ensureUniversalMapEntities.ts:86-93` classifies mural, public art, sculpture, and artwork text as `public_art`. | Classification is keyword-based rather than an art-specific importer. |
| Existing mural seed convention | `artifacts/api-server/src/lib/seeds/murals-diaspora-v1.ts:1-22` defines only name, city/state, address, description, and coordinates for `tour_cultural_sites` rows with `site_type='mural'`. | Existing mural seeds cannot preserve the Stage 1 artist, rights, access, review, or structured context fields. |
| Legacy cultural-site fields | `artifacts/api-server/src/lib/startup-migrations.ts:227-284` provides richer narrative fields (`ethnic_community`, `cultural_community`, `content_note`, source fields and basic accessibility). | Narrative context is possible, but the model remains insufficient for safely governed public-art records. |

### Current canonical route behavior

| Route/path | Current behavior | Dry-run implication |
|---|---|---|
| `GET /api/map/entities?kind=public_art&city=…` | `artifacts/api-server/src/map/registerUniversalMapEntityRoutes.ts:8-30` filters the published universal view by exact kind and city. | This is location-first and is the correct future list source. |
| `GET /api/places/:id` | `registerUniversalMapEntityRoutes.ts:32-48` resolves only a published, geocode-resolved universal entity, returning `/places/:id/:slug`. | A future import must create the universal entity, mark it published only after review, and set `geocode_status='resolved'`. |
| Web detail route | `artifacts/web/src/App.tsx:313-327` provides `/places/:id/:slug` and `/places/:id`; `artifacts/web/src/pages/universal-place-detail.tsx:52-124` fetches the universal route and redirects legacy cultural-site paths. | This is the one route to use for a future public-art pin. |
| Legacy paths | `artifacts/api-server/src/routes/canonical-cultural-sites.ts:1-59`, `artifacts/api-server/src/routes/maps.ts:462-559`, and legacy `tour_cultural_sites` routes still expose cultural records separately. | The same work could surface through a legacy cultural/tour path and a universal `/places` path unless future import work explicitly uses a single canonical source. |

### Local-query finding

The universal entity list has exact `kind` and city filtering. The older discoverability endpoint queries legacy tables directly. The local-business search is business-only, so it does not establish a public-art global fallback. No map ranking or closest-two behavior was modified in this audit.

## 2. Inclusive candidate manifest

The complete, non-public machine-readable manifest is attached as:

`docs/audits/public-art-stage-1-inclusive-manifest.json`

It contains exactly three pilot candidates, one in each requested city:

1. **Atlanta — _Cometh The Sun_**, Curtis Patterson, City of Atlanta archive (Tier 1).
2. **Philadelphia — _Our Voice, Our Strength_**, Ernel Martinez / Felix St. Fort / Parris Stancell, Mural Arts Philadelphia (Tier 2).
3. **Chicago — _Wonders of Woodlawn_**, Bernard Williams, Chicago Public Art Group (Tier 2).

No candidate is published or eligible for import in Stage 1.

## 3. Cultural-context evidence matrix

| Candidate | Title and artist | Verified location | Access/work status | Documented context basis | Future-publication result |
|---|---|---|---|---|---|
| _Cometh The Sun_ | City of Atlanta credits Curtis Patterson. | City archive: Gordon White Park, Ralph David Abernathy Boulevard SW and White Street SW. | Archive describes the sculpture in the public park; a current condition/access check remains outstanding. | The City page says the work “draws heavily on African motifs.” Tag: `african_diaspora`; relationship: `subject_matter`. | **Not yet eligible.** Complete Tier 1 evidence, but no approved structured metadata/route integration and no current access/work-status check. |
| _Our Voice, Our Strength_ | Mural Arts names Ernel Martinez, Felix St. Fort, and Parris Stancell. | Mural Arts lists 4675 Germantown Ave and provides exact map coordinates. | Mural Arts lists it as “On View.” | Mural Arts documents work with Haitian earthquake survivors and the larger Haitian population in Germantown. Tag: `caribbean_diaspora`; relationship: `community_collaboration`. | **Not yet eligible.** Complete Tier 2 project record; requires Tier 1 or independent corroboration plus the model/route approval. |
| _Wonders of Woodlawn_ | Chicago Public Art Group credits Bernard Williams. | Chicago Public Art Group lists 6014 South Cottage Grove Ave. | Source says completed/installed in 2019, but Stage 1 has no independent current access/condition confirmation. | Source documents African textiles and carvings and references Afri-COBRA artists in Woodlawn. Tag: `african_diaspora`; relationship: `subject_matter`. | **Not yet eligible.** Needs independent corroboration, current access/work confirmation, and the model/route approval. |

All cultural context above records the wording and relationship stated by the cited publisher. It does **not** infer identity from an artist’s name, appearance, location, surname, demographics, or imagery.

## 4. Duplicate dry run

### Method

- Normalized the three proposed titles and checked title/address/city signals against `map_entities`, `cultural_sites`, and `tour_cultural_sites` in the development database.
- Reviewed likely same-neighborhood results rather than treating a city/neighborhood word match as a duplicate.
- Compared the pilot titles against the checked-in mural seed convention.

### Result

| Candidate | Exact normalized title collision | Address/coordinate collision | Recommendation |
|---|---:|---:|---|
| _Cometh The Sun_ | No | No | No merge recommendation. Nearby West End and Ralph David Abernathy records are not title/address matches. |
| _Our Voice, Our Strength_ | No | No | No merge recommendation. Other Germantown entries are different works/sites. |
| _Wonders of Woodlawn_ | No | No | No merge recommendation. Existing Woodlawn/Bronzeville entries are different entities and some legacy coordinates are not reliable enough to support a merge. |

**Systemic duplicate risk:** The legacy `tour_cultural_sites`, legacy `cultural_sites`, direct discoverability union, and universal `map_entities` representations can describe related public-art records through different URLs. That is a schema/route governance issue, not evidence that any of these three candidates are duplicates.

## 5. Canonical-route dry run

No entity IDs were created. If a future owner-approved importer creates a published, resolved universal entity, current slug logic (`ensureUniversalMapEntities.ts:68-76`) would yield:

| Candidate | Expected slug | Expected canonical future URL | Current route risk |
|---|---|---|---|
| _Cometh The Sun_ | `cometh-the-sun-atlanta` | `/places/{unassigned-uuid}/cometh-the-sun-atlanta` | Will 404 until a universal entity exists, is published, and is geocode-resolved. |
| _Our Voice, Our Strength_ | `our-voice-our-strength-philadelphia` | `/places/{unassigned-uuid}/our-voice-our-strength-philadelphia` | Same prerequisite. Do not send it through a business or old tour-detail route. |
| _Wonders of Woodlawn_ | `wonders-of-woodlawn-chicago` | `/places/{unassigned-uuid}/wonders-of-woodlawn-chicago` | Same prerequisite. Do not create a competing legacy cultural/tour card. |

The `/places/:id/:slug` page is the correct future route, but none of these routes can be verified against a real record without creating data—which is outside Stage 1. The report therefore identifies all three as potential 404s **until** an approved importer creates the canonical entity.

## 6. Coverage-gap report

This small source-backed pilot demonstrates:

- documented African-diaspora subject matter in Atlanta;
- a documented Haitian community collaboration in Philadelphia; and
- documented African-diaspora art/history references in Chicago.

MWM still needs more verified, source-backed records—rather than claiming any culture is absent—for:

- Indigenous communities, including source-specific Nation/Tribe affiliations where published;
- Hispanic/Latine, Afro-Latine, Black-Indigenous, and Caribbean-Latine community contexts;
- community mosaics, sanctioned street art, temporary installations, monuments, and sculptures;
- current work/access status and rights-safe, creator-authorized media;
- additional neighborhoods within the three pilot cities.

## 7. Minimal-change proposal — **not applied**

### Finding

The universal entity table can hold a basic title/location/source link but cannot safely hold the required artist credit, access/work status, editorial review, cultural-context evidence, or multi-source provenance. It also does not expose those fields at the canonical place detail route.

### Smallest safe proposal

Do **not** overload generic map fields or continue placing public-art governance data in prose. Add one public-art metadata table keyed to the existing universal entity:

```sql
-- Proposal only. Do not run in Stage 1.
CREATE TABLE public_art_metadata (
  map_entity_id UUID PRIMARY KEY REFERENCES map_entities(id) ON DELETE CASCADE,
  artist_display_name TEXT NOT NULL,
  artist_credit_status TEXT NOT NULL
    CHECK (artist_credit_status IN ('confirmed', 'team_confirmed', 'not_yet_confirmed')),
  access_status TEXT NOT NULL
    CHECK (access_status IN ('publicly_viewable', 'limited_access', 'temporary',
                             'permission_required', 'removed_or_unknown')),
  access_notes TEXT NOT NULL,
  work_status TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'in_review'
    CHECK (review_status IN ('in_review', 'approved', 'rejected', 'archived')),
  community_context_tags TEXT[] NOT NULL DEFAULT '{}',
  community_context_display TEXT,
  community_context_relationship TEXT,
  community_context_evidence_note TEXT,
  community_context_source_url TEXT,
  source_tier SMALLINT NOT NULL CHECK (source_tier BETWEEN 1 AND 3),
  source_publisher TEXT NOT NULL,
  source_accessed_at TIMESTAMPTZ NOT NULL,
  source_rights_note TEXT NOT NULL,
  additional_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The separately approved implementation would also:

1. create/update `map_entities` first, with `entity_kind='public_art'`;
2. attach a matching `public_art_metadata` record;
3. expose the factual fields through the existing `/api/places/:id` and `/places/:id/:slug` canonical path;
4. publish only after review status is `approved`, coordinates are resolved, and evidence/access requirements are met;
5. avoid inserting the same artwork into competing legacy tables/routes.

This proposal is intentionally not a migration, code change, seed, route change, or importer.

## 8. Changed-file list

**Application/source/database/configuration changed files: `none`.**

This audit package contains only the two non-public Stage 1 deliverables:

- `docs/audits/public-art-stage-1-report.md`
- `docs/audits/public-art-stage-1-inclusive-manifest.json`

> “No public-art records, source files, database rows, routes, media, map behavior, mobile artifacts, Kinfolk behavior, preview files, or deployment settings were changed. The attached inclusive candidate manifest is non-public and requires separate owner approval before any import or publication.”