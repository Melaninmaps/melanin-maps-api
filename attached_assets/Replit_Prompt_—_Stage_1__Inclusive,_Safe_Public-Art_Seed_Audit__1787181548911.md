# Replit Prompt — Stage 1: Inclusive, Safe Public-Art Seed Audit and Dry-Run Manifest

## This instruction supersedes the prior Stage 1 public-art prompt

Use this version for all public-art discovery, candidate review, data modeling, and later publication work.

## Owner intent: cultural scope

Mapping With Melanin is rooted in the Black diaspora and must also make room for public art that is created by, celebrates, documents, or is meaningfully connected to **African, African American, Caribbean, Indigenous, Hispanic/Latine, and intersecting communities**.

This is an inclusive cultural framework, not a license to assume anyone’s identity. It must reflect artists’ and communities’ own published language, preserve specificity, and recognize intersections such as Afro-Latine, Black-Indigenous, Caribbean-Latine, and multiracial/community-collaborative work when documented.

> **Core rule:** Include cultural context when it is documented; never assign cultural, ethnic, racial, tribal, national, or community identity from a name, appearance, image, geography, demographics, surname, or model inference.

## Stage 1 scope — read-only only

1. Inspect the existing universal non-business map entity schema, public-art/category handling, import/seed conventions, canonical detail-route handling, and local map query filters.
2. Produce a non-public candidate manifest for **Atlanta, Philadelphia, and Chicago only**.
3. Produce source, attribution, cultural-context, location, route, and duplicate dry-run reports.
4. Propose the smallest data-model/migration change only if the current schema cannot store safe provenance, access, artist, and cultural-context metadata.

Do not edit source files, database records, seed data, schemas, migrations, routes, media, APIs, mobile, preview, Kinfolk, map ranking, deployment configuration, builds, or releases.

## Cultural inclusion and tagging rules

### 1. Record cultural context, not inferred identity

Each candidate may include one or more controlled `community_context_tags` **only when an approved source supports them**. Preserve the source’s own terminology in `community_context_display` and cite the exact source/evidence in `community_context_evidence_note`.

Approved controlled tags:

```text
african_diaspora
african_american
caribbean_diaspora
indigenous_communities
hispanic_latine_communities
afro_latine
black_indigenous
caribbean_latine
cross_community_collaboration
other_documented_community
```

The tag list is not a ranking system and is not meant to flatten people into broad categories. It is a discovery/context aid that must remain source-backed.

### 2. Preserve specificity where it is documented

| Context | Required handling |
|---|---|
| **Indigenous** | If the source identifies a Nation, Tribe, Pueblo, First Nation, community, or artist’s preferred affiliation, record that exact source-supported name in `community_context_display`. Do not label a work Indigenous merely because it is located on Indigenous land, uses visual motifs, or is geographically nearby. |
| **Hispanic/Latine** | Preserve the artist’s, commissioner’s, or cultural source’s own documented terminology—for example Hispanic, Latine, Latino/a, Latinx, Chicano/a/x, Boricua, Dominican, Mexican American, or a national/heritage-specific term. Do not assign a term from surname, language, neighborhood, or appearance. |
| **African/Caribbean** | Use documented regional, national, diasporic, or community-specific context when sources provide it. Do not compress every African or Caribbean connection into one tag if a more precise source-backed description exists. |
| **Intersecting communities** | Use multiple tags only when the source supports the intersection or collaboration. Do not infer an intersection from appearance or geography. |
| **Subject matter / commission / location history** | A work can be relevant because of documented subject matter, a community commission, local historical context, or collaborative process even if the artist’s identity is not publicly documented. Store the relationship type separately. |

### 3. Store why the work is included

Every candidate must include:

```text
community_context_tags
community_context_display
community_context_relationship
community_context_evidence_note
community_context_source_url
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

A candidate with a cultural tag but no relationship, evidence note, and source URL is invalid and cannot move beyond `in_review`.

## Source hierarchy

| Tier | Allowed source | Use |
|---|---|---|
| **Tier 1** | Municipal/county public-art collection; city mural registry; artist official site; commissioner/owner/venue record; museum/archive collection; documented tribal/Nation cultural institution record. | Can support future publication if it covers required fields. |
| **Tier 2** | Established mural/public-art program; cultural nonprofit; reputable arts organization/archive; recognized community cultural organization. | May support future publication with independent corroboration of any missing critical field. |
| **Tier 3** | Journalism; community maps; public social content; local guides; community submissions. | Discovery lead only. Never enough by itself for public publication. |

Do not use search snippets as evidence. Open and preserve the original source URL for every candidate.

## Required non-public candidate manifest

Create a JSON or CSV manifest for Atlanta, Philadelphia, and Chicago only. Every candidate must contain:

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
review_status = in_review
```

Use the following controlled values:

```text
public_art_kind:
  mural | monument | sculpture | installation | community_mosaic | sanctioned_street_art | other

artist_credit_status:
  confirmed | team_confirmed | not_yet_confirmed

access_status:
  publicly_viewable | limited_access | temporary | permission_required | removed_or_unknown

geocode_precision:
  rooftop | street_address | intersection | public_area | unknown

candidate_confidence:
  high | medium | low
```

## Eligibility rule — future publication only, not Stage 1

A record may be considered for later publication only if it has:

```text
precise local location
AND durable source URL
AND confirmed or explicitly-unconfirmed artist credit status
AND documented community/cultural-context basis
AND work/access status
AND one complete Tier 1 source OR two independent sources covering location + attribution/context
AND a canonical non-business detail route that resolves after refresh
```

Do not publish in Stage 1. Do not treat an unsupported identity claim as cultural relevance. A record that lacks evidence remains `in_review` or moves to a research backlog.

## Rights, safety, and local-discovery rules

1. Do not download, copy, hotlink, or import third-party art photography. Source-page URLs and rights notes only.
2. Do not generate images that depict existing artworks.
3. Do not expose private residences, fragile locations, restricted sites, or access details beyond what the primary source makes public.
4. Do not use culture or demographics to make a safety judgment about a neighborhood. Use **Community Intelligence** and **Community-Sourced** only for moderated context.
5. Later public-art search must stay location-first. Never show a distant mural as a local result and never add a global fallback.
6. Every later published pin must use the existing universal non-business canonical route and may never produce a 404.

## Required Stage 1 output

Return attachments containing:

1. **Current-schema/route report:** existing public-art/category and universal entity paths, exact tables/types/fields, and relevant line ranges. No edits.
2. **Inclusive candidate manifest:** Atlanta, Philadelphia, and Chicago candidates only, with every field above populated or marked invalid/in-review with the missing-evidence reason.
3. **Cultural-context evidence matrix:** one row per candidate showing source support for title, artist, location, access, and each community-context tag/display term/relationship.
4. **Duplicate report:** normalized-title/artist/address/coordinate collisions and merge recommendations only.
5. **Canonical-route dry run:** expected future detail URLs and every potential 404/routing issue.
6. **Coverage-gap report:** cities/communities/art types where MWM needs more verified records; phrase this as collection coverage, never as an absence of culture.
7. **Minimal-change proposal:** only if the existing schema cannot store provenance, access, review state, and documented inclusive cultural context. Show a surgical proposal but do not apply it.
8. **Changed-file list:** required value is `none`.

## Stop conditions

Stop and ask the owner before any action beyond Stage 1 if:

```text
A source requires login, payment, an API license, terms acceptance, or automated-access permission.
A source prohibits planned extraction or reuse.
A candidate lacks precise location, artist evidence/status, or documented cultural-context basis.
The current schema needs a migration, route change, or new importer.
A candidate would use unlicensed imagery.
A record could expose private/sensitive access detail.
Any source, database, API, preview, mobile, configuration, build, or deployment edit is proposed.
```

## Required closing statement

> “No public-art records, source files, database rows, routes, media, map behavior, mobile artifacts, Kinfolk behavior, preview files, or deployment settings were changed. The attached inclusive candidate manifest is non-public and requires separate owner approval before any import or publication.”
