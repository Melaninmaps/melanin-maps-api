# Replit Prompt — Verified African American and Caribbean Public-Art Seed Rules

## Owner intent

Seed public-art candidates that are **verifiably** connected to African American and Caribbean communities, while also making appropriate room for Indigenous and Hispanic/Latine public art when the cultural connection is documented. MWM must be inclusive without assigning identity from a name, image, neighborhood, language, or model inference.

This instruction is **Stage 1 research and non-public manifest work only**. It does not authorize code edits, migrations, data imports, automatic publication, image downloads, API changes, mobile changes, map changes, Kinfolk changes, build, or deployment.

## 1. African American and Caribbean candidate eligibility

A candidate may receive an `african_american` or `caribbean_diaspora` context tag only when the connection is documented by a source that meets the rules below.

| Context tag | Publishable evidence examples | Never infer from |
|---|---|---|
| `african_american` | Artist’s own biography/site; municipal or cultural-institution artist record; commission statement; museum/archive entry; source-supported work subject matter or community-history statement. | Artist name, appearance, a Black neighborhood, presumed race, a mural depicting a person of color without source context, or a social-media caption alone. |
| `caribbean_diaspora` | Artist’s documented Caribbean self-description/heritage; an official/cultural institution record; commissioner statement; source-supported subject matter or community-history statement. | Surname, language, flag colors, neighborhood, national stereotypes, appearance, or a photo alone. |
| Both tags / intersection | A source explicitly documents the intersection, or two independent high-quality sources document each relevant connection. | Combining separate hints into an assumed identity. |

When a source provides a more specific community/cultural description, preserve that wording. Examples may include a documented Jamaican, Haitian, Trinidadian and Tobagonian, Barbadian, Dominican, Puerto Rican, Cuban, Garifuna, or other regional/national/community context. Do not manufacture these descriptions. If an artwork has both Caribbean and Hispanic/Latine context, keep both only when each relationship is source-supported.

## 2. Required source standard

Every candidate must have a durable source URL for title, location, and cultural-context basis. A record can advance from `in_review` to `eligible_for_owner_review` only when it has either:

```text
A. one complete Tier 1 source that establishes the work, exact local location, artist/creator or explicit attribution status, access status, and cultural context;
OR
B. two independent sources that collectively establish the physical work/location and the artist/cultural-context basis.
```

Use source tiers exactly as follows:

| Tier | Sources | Allowed use |
|---|---|---|
| **Tier 1** | Municipal/county public-art registry; artist official site; commissioner, owner, venue, or cultural-institution record; museum/archive collection page. | Supports owner review when complete. |
| **Tier 2** | Established mural program; community arts nonprofit; public-art archive; recognized cultural organization. | Supports owner review only with independent corroboration of missing critical facts. |
| **Tier 3** | Journalism; community map; social post; local guide; member/ambassador submission. | Discovery lead only. Never enough alone. |

Do not use search-result snippets as evidence. Do not use a source photo as proof of artist identity or cultural relevance. Do not reuse source images without rights clearance.

## 3. Indigenous records — non-assumption rule

Indigenous public-art records are welcome, but must be held to a specific evidence standard.

1. Tag `indigenous_communities` only when an artist, Nation/Tribe/Pueblo/First Nation, commissioner, museum/archive, or recognized Indigenous cultural institution documents that connection.
2. If the source identifies a Nation, Tribe, Pueblo, First Nation, or community, save the exact documented name in `community_context_display`. Do not reduce it to a generic label where a specific name is available.
3. Never label a record Indigenous because it is near Indigenous land, contains symbols that appear Indigenous, is by an artist with a presumed name/appearance, or is located in a neighborhood with Indigenous history.
4. If the artist’s preferred language or affiliation is not published, set `review_status = in_review` and store the missing-evidence reason. Do not fill it with an AI guess.

## 4. Hispanic/Latine records — non-assumption rule

Hispanic/Latine public-art records are welcome, but must preserve self-described or source-documented context.

1. Tag `hispanic_latine_communities` only when an artist’s official biography, commissioner, cultural institution, archive, or other qualified source documents the relevant community, heritage, subject matter, or collaboration.
2. Preserve the source’s own language in `community_context_display`, such as Hispanic, Latine, Latino/a, Latinx, Chicano/a/x, Boricua, Mexican American, Afro-Latine, or a national/heritage-specific term.
3. Never assign a Hispanic/Latine tag from surname, language spoken, restaurant/business proximity, neighborhood demographics, geography, or appearance.
4. If a work has Indigenous, African American, Caribbean, and/or Hispanic/Latine context, assign multiple tags only if every tag has its own documented relationship/evidence note.

## 5. Required candidate-manifest fields

Create a non-public CSV or JSON manifest. A candidate must include every field below:

```text
external_candidate_id
city
state
country
title_or_work_label
public_art_kind
artist_display_name
artist_credit_status
street_address_or_precise_public_location
latitude
longitude
geocode_precision
access_status
access_notes
work_status
source_tier
source_url
source_publisher
source_accessed_at
artist_evidence_note
location_evidence_note
community_context_tags
community_context_display
community_context_relationship
community_context_evidence_note
community_context_source_url
source_rights_note
candidate_confidence
review_status
missing_evidence_reason
```

Allowed `community_context_relationship` values:

```text
artist_self_description
artist_biographical_source
subject_matter
commission_or_collection_statement
community_history_or_place
community_collaboration
cultural_institution_record
other_documented_basis
```

Every `community_context_tags` value requires a matching documented relationship, evidence note, and source URL. A record with an unsupported tag is invalid.

## 6. Required dry-run output — no changes

Return the following attachments, with no source or data edits:

1. **African American candidate manifest:** high-confidence records from Atlanta, Philadelphia, and Chicago only.
2. **Caribbean candidate manifest:** high-confidence records from the same three cities only.
3. **Indigenous/Hispanic-Latine review manifest:** valid candidates and candidates held in review, including the exact missing-evidence reason for each held record.
4. **Evidence matrix:** one row per candidate showing evidence for title, artist, exact location, access status, and every cultural-context tag.
5. **Deduplication report:** normalized title, artist, address, and coordinate collisions; recommendation only.
6. **Canonical-route dry run:** expected universal non-business detail URL for every eligible candidate and every potential 404.
7. **Coverage-gap report:** phrase gaps as MWM collection coverage gaps; never suggest a community has no public art because the seed has not reached it.
8. **Changed-file list:** required value is `none`.

## Stop conditions

Stop and ask the owner before any action beyond the manifest if a source requires access permission or payment; terms prohibit extraction/reuse; a work lacks precise location, attribution status, or documented cultural-context basis; media rights are unclear; a candidate may reveal a private/sensitive site; a schema/importer/migration/route change is needed; or any source/database/application/deployment edit is proposed.

## Required closing statement

> “No public-art records, source files, database rows, routes, media, map behavior, mobile artifacts, Kinfolk behavior, preview files, or deployment settings were changed. The attached manifest is non-public and requires separate owner approval before any import or publication.”
