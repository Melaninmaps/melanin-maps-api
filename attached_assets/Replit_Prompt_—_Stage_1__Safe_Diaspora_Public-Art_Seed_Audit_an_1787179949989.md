# Replit Prompt — Stage 1: Safe Diaspora Public-Art Seed Audit and Dry-Run Manifest

## Owner objective

Mapping With Melanin has a **Public Art** category, but it currently has little or no visible coverage. Build a safe path to seed verified murals and public artworks that celebrate, document, or are created within the African diaspora across the United States.

This is **not** approval for a nationwide scrape, automatic publication, image download, or broad redesign. Stage 1 is a read-only schema/route audit plus a non-public candidate manifest for a small, high-confidence pilot.

## Stage 1 scope — allowed work only

1. Inspect the existing universal non-business map entity schema, public-art/category handling, import/seed conventions, canonical detail-route handling, and local map query filters.
2. Produce a source-backed candidate manifest for **Atlanta, Philadelphia, and Chicago only**.
3. Produce a duplicate/route/location dry-run report.
4. Propose the smallest data-model or migration change only if the current schema cannot store required provenance/access/artist fields.

Do not edit source files, database data, seed data, schemas, migrations, routes, media, API behavior, mobile, preview, Kinfolk, map ranking, deployment configuration, or build/release settings in Stage 1.

## Source rules

Use sources in this order:

| Tier | Allowed source | Stage 1 use |
|---|---|---|
| 1 | Municipal/county public-art collection, city mural registry, artist official site, commissioner/owner/venue record, museum/archive collection | Candidate evidence; may support later publication if complete. |
| 2 | Established mural/public-art program, cultural nonprofit, reputable arts organization/archive | Candidate evidence; needs corroboration for any missing critical field. |
| 3 | Journalism, community maps, public social posts, community submissions | Discovery lead only; never sufficient for a public record. |

Approved discovery examples for the initial cities include:

```text
City of Atlanta Office of Cultural Affairs Public Art Program
Atlanta Street Art Map (discovery/corroboration only)
Mural Arts Philadelphia
City of Chicago Mural Registry
Black Mural Map (discovery/corroboration only)
```

Do not use search snippets as evidence. Open and record the original source page for every candidate.

Do not infer an artist’s racial, ethnic, national, or diaspora identity from appearance, a name, a location, demographics, or a photo. Diaspora relevance must be supported by a source: artist self-description, commissioner/collection statement, documented subject matter, reputable cultural source, or a community institution record.

## Candidate manifest — required fields

Create a **non-public** JSON or CSV manifest. A candidate is incomplete unless it includes every required field below.

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
diaspora_relevance_tags
diaspora_relevance_evidence_note
source_rights_note
candidate_confidence
review_status = in_review
```

Allowed values:

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

Do not use `unknown` for title/work label, city/state, source URL, location evidence, or artist evidence in a candidate proposed for later publication. Such records may be retained only in a separate rejected/research backlog, never in the publishable manifest.

## Publication eligibility test — do not publish in Stage 1

For every candidate, run this rule and show the result:

```text
eligible_for_future_publication =
  has precise local location
  AND has exact source URL
  AND has confirmed/explicitly-unconfirmed artist attribution status
  AND has documented diaspora relevance basis
  AND has access/work status
  AND (has one complete Tier 1 source OR has two independent sources covering location + attribution/relevance)
```

Candidates that fail must remain `in_review` with a specific missing-evidence reason. Do not “fill in” facts with model output, web inference, image interpretation, or generic descriptions.

## Media and rights rules

Do not download, copy, hotlink, or import source photography. Do not generate an image of an existing artwork. Store only the source page URL and a rights note in Stage 1.

If a source page contains an image, it is not automatic permission for MWM to reuse it. Any future media upload must be MWM-owned, creator-authorized, rights-cleared, or explicitly licensed.

## Location and routing rules

1. A candidate must have enough verified location information to avoid a misleading pin.
2. A later published record must use the existing universal non-business canonical entity route; do not route it through a business page.
3. A later published record must resolve after browser refresh and must never produce a 404.
4. Public Art search remains location-first. Never show a mural in Philadelphia or Chicago as if it were local to Atlanta, Charlotte, or another city.
5. Do not change the existing closest-two local search behavior or add a global fallback.

## Required Stage 1 report — no source edits

Return attachments containing:

1. **Current-schema report:** exact existing tables/types/fields and the current public-art/category and canonical-route paths. Include file paths and relevant line ranges; do not modify them.
2. **Candidate manifest:** Atlanta, Philadelphia, and Chicago candidates only, with all required fields and source links.
3. **Evidence matrix:** a row per candidate showing which source verifies title, artist, location, access status, and diaspora relevance.
4. **Deduplication report:** likely duplicate entities based on normalized title/artist/address/coordinates, with merge recommendation only.
5. **Route dry-run report:** how each eligible candidate would receive a canonical slug/URL using the existing entity convention; identify any path that would 404.
6. **Gap report:** public-art categories/cities with insufficient verified evidence; phrase gaps as collection coverage gaps, not absence of culture.
7. **Minimal-change proposal:** only if the existing schema cannot store provenance, attribution, access status, and review state. Show a one-migration/file diff proposal, but do not apply it.
8. **Complete changed-file list:** required value in Stage 1 is `none`.

## Stop conditions

Stop and ask the owner before doing anything beyond Stage 1 if:

```text
A source requires credentials, paid licensing, terms acceptance, or automated access permission.
A source prohibits the planned reuse or extraction.
A candidate lacks precise location, artist evidence, or a diaspora relevance basis.
The existing schema needs a migration or route change.
A candidate would use copied/uncleared imagery.
A record could expose private/sensitive access details.
Any code, data, database, deployment, build, or configuration edit is proposed.
```

## Required closing statement

End the Stage 1 response with:

> “No public-art records, source files, database rows, routes, media, map behavior, mobile artifacts, Kinfolk behavior, preview files, or deployment settings were changed. The attached manifest is non-public and requires separate owner approval before any import or publication.”
