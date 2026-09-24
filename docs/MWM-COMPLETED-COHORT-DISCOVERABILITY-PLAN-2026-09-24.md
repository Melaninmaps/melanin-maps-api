# Completed Cohort Discoverability Plan

**Author:** Manus AI
**Date:** 2026-09-24
**Status:** Receipt reconciliation and activation design; no historical worker action

## Decision

Mapping With Melanin should make **all 4,183 source-receipted rows resolvable in discovery** without recreating, restaging, or republishing the protected historical batch. The immutable completed batch has receipt root `948c818563f36f7cd6da67e003b3d6c8eb3e220e6561d898c4e94a7c31371653` and manifest checksum `ca576aeb92b6cd0e73a7b967bf510f7e26b6a3ceb909c5511a222c25d862469a`.

“Discoverable” must have one consistent meaning across the website, mobile app, Directory, universal search, and Kinfolk: a search for the source business name must resolve to a visible MWM result or to the canonical MWM profile that represents it. A map pin remains a stricter promise. It is shown only when the record has a verified, non-zero latitude and longitude. The absence of a pin must not remove a source-backed business from name search.

## What the completed batch did

| Completed outcome | Rows | Meaning now |
|---|---:|---|
| Created public listing | 1,351 | Existing MWM profile should be reconciled to source provenance and designation data. |
| Linked to an existing public listing | 326 | Existing MWM profile should retain its identity and receive the historical source link. |
| Deduplicated within the batch | 1,171 | These are source aliases of a canonical source row, not permission to create conflicting duplicate profiles. |
| Geocode-held | 1,327 | Source business was retained, but the old worker could not prove an exact map location. |
| Publication-error hold | 8 | A narrowly classified error blocked publication and must be made visible for correction. |
| **Total** | **4,183** | Every row needs a discoverability resolution. |

The created-plus-linked group contains **1,677** existing public-record outcomes. When duplicates are represented as aliases, the completed batch contains **3,012 distinct source identities** before any later resolution of the eight error holds. The 1,171 duplicate source rows still remain discoverable by name, but should route to their canonical profile rather than produce a second competing listing.

## Why 1,327 records were held

The historical publisher did not hold those businesses because they lacked a minority designation or because they were rejected as invalid businesses. It used a strict physical-location rule. For a physical listing, it required all of the following:

1. A numbered street address.
2. A successful OpenStreetMap Nominatim response within an eight-second timeout.
3. Valid, non-zero latitude and longitude.
4. A returned city and state that matched the source city and state.
5. A matching house number and at least one matching street token.

If any condition failed, the result was `geocode_unverified`; a record without both address and non-zero coordinates could also produce `physical_record_incomplete`. That rule appropriately prevented false pins, but it wrongly made directory visibility depend on map precision. It must be replaced for this completed cohort by **public directory availability without a map pin**, never by an invented address or city-centre coordinate.

The receipt/export currently gives the aggregate 1,327 count, not a safely available row-by-row reason breakdown. The new read-only reconciliation endpoint is the required first step: it reads the retained candidate, outbox, and production-provenance data and exports only member-safe fields plus normalized hold categories. It cannot stage, publish, retry, update, delete, or enable the historical worker.

## Safe implementation sequence

### 1. Produce and verify the receipt-root reconciliation ledger

Deploy the read-only reconciliation route only after code review. Its query is locked to the completed receipt root and checksum. It must return an aggregate summary and paginated rows, and it may export a CSV for the administrator. It must classify each row as `public_listing`, `duplicate_source_alias`, `location_hold`, `publication_error_hold`, or `review_hold`.

The CSV must include name, locality, source-row identifier, canonical source-row identifier for exact within-batch duplicates, canonical business identifier where one exists, discovery state, safe hold category, source URL, and designation count. The administrator may request only `duplicate_source_alias` and `location_hold` rows together, so the initial inspection export contains the duplicate and geocode-held populations without unrelated records. It must not export raw payloads, credentials, protected evidence blobs, or database error strings. Values that could be interpreted as spreadsheet formulas are neutralized before export.

### 2. Attach provenance to the 1,677 existing public records

Use the final `directory_publication_provenance` mappings to attach receipt-root-scoped source provenance to **only** the existing created or linked business IDs. The migration must be idempotent and must not overwrite verified designations, owner claims, community posts, reviews, media, profile content, or a later listing-status decision.

Source-backed designations should appear as source-reported/unverified unless separately verified. They are eligible for recommendation under the user’s stated policy, while a member may choose an optional verified-only filter.

### 3. Create public, unpinned directory profiles for location-held source businesses

For each `location_hold` row, create at most one receipt-root-scoped **directory-only public profile** if no exact canonical source identity already exists. These profiles must use `listing_status = live_unclaimed`, `status = active`, null address/latitude/longitude when the source cannot support them, and a source-reported ownership claim when the source explicitly supplied a designation. They must be direct-name searchable, included in universal search and Kinfolk where their explicit source designation qualifies, and shown on the business profile page.

They must not be returned by map-pin endpoints, proximity/radius results, or directions. The profile should say only that a precise location is not yet confirmed, not imply closure or lack of legitimacy. A later address correction can add a verified pin through a separate audit-recorded location update.

### 4. Represent the 1,171 duplicate rows as searchable aliases

Do not make the user delete 1,171 duplicates to clean up a system-created issue. Create a `business_source_aliases` table keyed by receipt root and source row. Each alias must point only to a canonical public business after strict identity evidence is available. Name search and universal search should resolve an alias to the canonical profile and disclose no duplicate technical language to ordinary members.

Rows without a safe canonical match remain in the admin reconciliation queue rather than being guessed. This preserves all source findings without showing multiple profiles for the same storefront.

### 5. Resolve the eight publication-error holds through a bounded repair queue

The reconciliation report must show the exact normalized failure category for the eight rows. Each can then be repaired by a receipt-root-scoped, idempotent administrative operation that handles only the specific row. It must preserve the original source record and audit the correction. It must not invoke the historic batch worker.

## Required safeguards

The activation must fail closed unless all of the following are true:

- The requested receipt root and manifest checksum exactly match the completed cohort values above.
- The source-row count is exactly 4,183.
- A new profile is created only when no existing canonical receipt/provenance/alias mapping exists.
- Every new profile has a member-safe public destination or remains clearly flagged for administrative destination review.
- No latitude or longitude is derived from a city, neighborhood, business name, cuisine, or other inference.
- No designation is inferred from the business name, images, geography, or category.
- Existing owner-verified data and community/member content take precedence over a source-row field.
- All writes use an audit table and dry-run report first.
- The historical staging and publication worker remain disabled.

## Deliverables and proof

The first deliverable is the administrator-only reconciliation CSV. It will answer precisely how many rows are already public, which duplicates point to which canonical profile, and why each held location failed strict geocoding. The second deliverable is a dry-run activation report. It will state how many records would be created as directory-only profiles, how many aliases would be attached, and how many must remain in an eight-row repair queue.

Only after that dry run is reviewed should a separate additive activation pull request be merged and deployed. A successful source test is not proof of website or native behavior. Verification must separately confirm API data, public website search, web static bundle, native artifact provenance, and physical mobile search behavior.

## References

[1]: https://nominatim.org/release-docs/latest/api/Search/ "Nominatim Search API"
[2]: https://wiki.openstreetmap.org/wiki/Nominatim "OpenStreetMap Nominatim"
[3]: https://www.postgresql.org/docs/current/ddl-constraints.html "PostgreSQL Constraints"
