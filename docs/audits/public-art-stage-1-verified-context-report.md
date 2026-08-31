# Verified African American and Caribbean Public-Art Seed Rules — Stage 1 Addendum

**Status:** Read-only, non-public research package  
**Audit date:** 2026-08-19  
**Cities:** Atlanta, Philadelphia, Chicago only  
**Publication/import status:** None. Every candidate remains `in_review`.

This addendum applies the more specific African American, Caribbean, Indigenous, and Hispanic/Latine evidence rules to the original Stage 1 schema/route audit. See `public-art-stage-1-report.md` for the inspected implementation and the minimal-change proposal, which remains unapplied.

## Attached non-public manifests

| Manifest | Candidate count | Evidence posture |
|---|---:|---|
| `public-art-stage-1-african-american-manifest.json` | 3 | Atlanta, Philadelphia, and Chicago; all source-backed with explicit African American/community-history language. |
| `public-art-stage-1-caribbean-manifest.json` | 1 | Philadelphia Haitian-community collaboration; no unsupported Atlanta/Chicago Caribbean candidate was retained. |
| `public-art-stage-1-indigenous-hispanic-latine-review-manifest.json` | 2 | Chicago Indigenous community collaboration and Philadelphia Aymara Bolivian/Andean context. Both remain in review. |

## Evidence matrix

| Candidate | Source support for title/artist/location | Access/work evidence | Context tag and source-supported basis | Review result |
|---|---|---|---|---|
| Auburn Avenue Bas Reliefs, Atlanta | City of Atlanta archive credits Brian Owens and gives Auburn Ave NE/Courtland St NE. | Public intersection; archive documents a 1996 installation. Current condition not field-verified. | `african_american`: the source documents Sweet Auburn Black business history through the work's subject matter. | `in_review`; dry-run point is near an unrelated existing entity, so official map/field resolution is required before any future import. |
| Black Family Reunion / Heavenly Hall, Philadelphia | Mural Arts credits Jane Golden and Dietrich L. Adonis; provides 4022 Parkside Ave and exact coordinates. | On View; restored in 2001 and 2008. | `african_american`: commissioned by the National Council of Negro Women and commemorates the African American family. | `in_review`; Tier 2 requires independent corroboration for future owner review. |
| Paul Laurence Dunbar Monument, Chicago | Chicago Park District credits Debra Hand and gives 300 E. 31st St. | Outdoor sculpture, erected 2014. Current condition not field-verified. | `african_american`: source calls Dunbar one of the most significant figures in African American history. | `in_review`; Tier 1 facts complete, but model/route approval and current condition check are needed. |
| Our Voice, Our Strength, Philadelphia | Mural Arts credits the artist team and provides 4675 Germantown Ave plus exact coordinates. | On View. | `caribbean_diaspora`: collaboration with Haitian survivors and the wider Haitian community in Germantown. | `in_review`; Tier 2 needs independent corroboration. |
| Indian Land Dancing, Chicago | Chicago Park District credits the artist team and gives the Foster St/Lake Shore Dr underpass. | Outdoor mosaic, produced in 2009. Current condition not field-verified. | `indigenous_communities`: source names Potawatomi history, the American Indian Center of Chicago, and Native community collaboration. | `in_review`; Tier 1 facts complete, but model/route approval and current condition check are needed. |
| MALLKUANKA, Philadelphia | Mural Arts credits Roberto Mamani Mamani and Efrain Herrera and provides an exact Washington Ave/S. 26th St location/coordinates. | On View. | `indigenous_communities` and `hispanic_latine_communities`: source says Aymara Bolivian artist, Aymara Indigenous descent, and Andean cosmovision. | `in_review`; Tier 2 needs independent corroboration. |

## Duplicate dry run

The refined development-database check covered normalized title, exact address/city, and a near-coordinate threshold across `map_entities`, `cultural_sites`, and `tour_cultural_sites`.

| Candidate | Result | Recommendation |
|---|---|---|
| Auburn Avenue Bas Reliefs, Atlanta | No normalized-title or exact-address collision. Its dry-run intersection point is within the near-coordinate threshold of the unrelated `Open Mic at Café Circa` universal entity. | **No merge.** Do not assign that provisional coordinate to a future record until an official map or field check resolves the art point. |
| Remaining five refined candidates | No normalized-title, exact-address/city, or near-coordinate collision found. | No merge recommendation. |

The broader risk remains systemic: a future importer must prevent one work from being represented independently in `tour_cultural_sites`, `cultural_sites`, and universal `map_entities`.

## Canonical-route dry run

For any later approved record, the existing universal route remains:

`/places/{generated-uuid}/{slugified-title-and-city}`

Expected slugs include:

- `auburn-avenue-bas-reliefs-atlanta`
- `black-family-reunion-heavenly-hall-philadelphia`
- `paul-laurence-dunbar-monument-chicago`
- `our-voice-our-strength-philadelphia`
- `indian-land-dancing-chicago`
- `mallkuanka-vuelo-surnorte-de-colores-the-south-north-flight-of-colors-philadelphia`

Every one is a potential 404 today because Stage 1 created no universal entity ID. A future route resolves only after an approved import creates a `map_entities` row, marks it published after review, and resolves the geocode.

## Coverage gaps

MWM's non-public Stage 1 collection now has explicit-source examples of African American, Caribbean, Indigenous, and Hispanic/Latine/Andean context. It still needs more verified records—never an assumption that culture is absent—for:

- additional Caribbean-context records in Atlanta and Chicago;
- source-specific Indigenous Nation/Tribe affiliations where published;
- additional Hispanic/Latine, Afro-Latine, Black-Indigenous, and Caribbean-Latine community context;
- rights-cleared media and current access/work-status checks;
- more public-art kinds and neighborhoods across the three pilot cities.

## Changed-file list

**Application/source/database/configuration changed files: `none`.**

This addendum creates only non-public audit attachments. No public-art row, source file, database row, route, media asset, map behavior, mobile artifact, Kinfolk behavior, preview file, build/release setting, or deployment setting was changed.

> “No public-art records, source files, database rows, routes, media, map behavior, mobile artifacts, Kinfolk behavior, preview files, or deployment settings were changed. The attached manifest is non-public and requires separate owner approval before any import or publication.”