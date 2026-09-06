# Cumulative Content and Global Curated Workbook Bundle

This bundle preserves the two founder-supplied workbooks received on **2026-09-05** as immutable, checksum-locked staging inputs. It does not publish records, alter production data, or authorize city-centroid business pins.

## Source inventory

| Workbook | SHA-256 | Audited contents |
| --- | --- | --- |
| `Mapping-with-Melanin-CUMULATIVE-SOCIAL-NIGHTLIFE-ENRICHMENT-3392.xlsx` | `56163070c7309ed03a2a4fd7344d401cd00e179c9f63a2fef9c798b8ab3840fb` | 3,392 content-location rows; 3,294 unique name/city/state identities; 98 repeated rows; 1,139 exact overlaps with the existing founder candidate bundles |
| `Mapping-with-Melanin-GLOBAL-BUILD-36-CURATED-MINORITY-RECOMMENDED-CUMULATIVE-5086.xlsx` | `db67c6290aa2407b26aabbadebca194c839160ad048dde8a7435f8002ddf5a7c` | 74 worksheets; 545 unique destination-coordinate records and 3,378 unique named-entity/country/city/type records |

The complete deterministic workbook profile is stored in `workbook-readiness-audit.json`. `SHA256SUMS` locks both original workbooks and the audit output.

The checksum-locked converter generated **7,315 review candidates** in `cumulative-content-global-candidates.jsonl`: 3,392 local content-location rows, 545 travel-destination rows, and 3,378 global named-entity rows. Exhaustive conservative routing produced 5,005 business candidates, 699 community-resource candidates, 152 regulated-review candidates, and 1,459 event/place/travel/manual-review candidates. Every generated row remains `needs_research`; the converter and staging command perform **zero publication writes**.

## Routing and publication policy

The social/nightlife workbook is a **content and outreach bible**, not a physical-location import. It has no street-address, postal-code, latitude, or longitude columns. Its records mix businesses, community resources, cultural organizations, health and education records, and content targets. A public business record may be created only after destination classification, exact duplicate reconciliation, valid public-link evidence, and a precise physical location are available. No city-center pin may substitute for a business address.

The workbook contains **1,139 unique identities** overlapping prior founder bundles across **1,227 source rows**. Prior-target associations are not mutually exclusive: they include 823 business, 238 community-resource, 86 regulated-review, and 2 manual-review associations; nine identities associate with more than one prior target. Only 244 overlapping identities have an address in the prior bundle. These are enrichment/reconciliation opportunities, not permission to create duplicate rows.

The global workbook contains two different record families. Its 545 destination records are travel-planning locations; 342 explicitly describe their coordinates as approximate or centroid-level. Its 3,378 named records include restaurants, hotels, museums, events, retailers, experiences, and other place types. Every named record carries a required quality-assurance note, and no worksheet has both a business-name field and a street-address field. Travel destinations must enter a travel destination layer. Businesses and resources must be classified and precisely located before they can enter their respective searchable destinations.

## Operational boundary

These inputs may be processed only through the single governed staging pipeline. Run `pnpm --filter @workspace/scripts stage-cumulative-content-global` for the checksum-verified dry run. A review-only apply additionally requires `--apply`, `DIRECTORY_IMPORT_LOCAL_STAGING=1`, `DEPLOYMENT_TIER=local_staging`, and a loopback `mwm_directory_staging*` database. The apply creates one atomic review batch and performs zero publication writes. Production, stores, TestFlight Build 105, and real production data remain prohibited.
