# Mapping With Melanin™ — Permanent Operating Standards Register

**Purpose:** This register indexes the mandatory operational rules that Replit must preserve in repository documentation and project instructions. These are not optional future-product ideas. They apply whenever the named work occurs.

| Standard ID | Standard | Trigger | Required completion evidence | Canonical file |
| --- | --- | --- | --- | --- |
| `OPS-BUSINESS-CONTENT-001` | Business and Content Intake Operating Standard | Any founder, member, owner, curator, import, Kinfolk, or tour request to add/change a business, link, photo, video, offer, event, or business-related community content | `published_verified` automatic proof package, updated control-sheet row, and zero unresolved mandatory checks | `MWM_Permanent_Business_and_Content_Intake_Operating_Standard.md` |
| `OPS-DEPLOY-IDENTITY-001` | Production deployment identity gate | Any production deployment or content publication verification | `/api/version` reports matching hashes and `stale_bundle:false` | `MWM_P0_Bundle_Identity_and_Rate_Limit.patch` |
| `OPS-CLAIM-OWNER-001` | Community listing, owner claim, and verification separation | Any business claim, owner join, or community-added listing | Owner access is derived only from approved owner link; verification state remains separate; claim route security tests pass | `MWM_Authoritative_Community_Business_Claims_Implementation_Package.md` |
| `OPS-LIBRARY-SOURCE-001` | Library source integrity and progressive discovery | Any source addition, evidence update, Library topic, Learn More action, or current source retrieval | Source validation and freshness state; valid external source behavior; no stale active link | `MWM_Progressive_Library_Source_Discovery_Implementation.md` |
| `OPS-PRIVACY-ANALYTICS-001` | Thresholded aggregate impact reporting | Any business/community/creator aggregate report | k-threshold, delay, contribution bound, persisted noise, suppression, and authorization tests | `MWM_Differential_Privacy_and_Creator_Matching_Guide.md` |

> **Permanent memory instruction for Replit:** Before making or declaring complete any work matching a trigger above, locate and follow the canonical file. If the required evidence is missing, report the work as `held` or `pending_review`, never complete.

## Required repository placement

Replit must copy this register and every canonical standard into `docs/operations/`, add an index link from `docs/README.md`, and place the permanent-memory instruction in the project-level engineering instructions. The register must be reviewed whenever a new workflow becomes mandatory.

## Founder notification rule

For any incident that causes live business search, maps, claim entry, media/content posting, Library sources, or authentication to fail, notify the founder first within five minutes. Investigation and repair occur after notification; they do not replace it.

| `OPS-SERVICE-AREA-001` | Service-area provider discoverability | Any traveling, mobile, appointment-only, or service-area business intake/change | City search, service-area label, no fabricated address/pin, map/list behavior, and claim eligibility pass automatically | `MWM_Service_Area_Business_Discoverability_Addendum.md` |

> **Service-area permanent-memory instruction:** A provider may publicly list a confirmed service city without a public client-visit address. Search must return the provider under that city and label `Serves [City]`. Never create a false exact pin, street address, directions link, or `0,0` coordinate. Use the service-area verification rules before declaring the intake complete.
