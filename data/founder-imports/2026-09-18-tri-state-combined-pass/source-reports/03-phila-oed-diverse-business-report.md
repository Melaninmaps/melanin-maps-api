# Philadelphia OEO diverse-business candidate pass

## Scope and method
This pass searched Philadelphia’s official Office of Economic Opportunity (OEO) pages and its linked registry guidance, then used the official regional visitor site Visit Philadelphia’s individual Black-owned and Latino-owned business guides as the record-level public directory. Each retained record has a named business, Philadelphia street address, a published identity/designation statement or guide inclusion, and a first-party customer destination (website or official social profile). No database/API was called.

## Sources searched

| Source | URL | Result |
|---|---|---|
| City of Philadelphia, Office of Economic Opportunity | https://www.phila.gov/departments/office-of-business-impact-and-economic-advancement/divisions/office-of-economic-opportunity/ | Confirmed OEO purpose and linked public OEO Registry; registry is an interactive external application and did not expose stable individual records in the fetched page. |
| City of Philadelphia, Supplier diversity | https://www.phila.gov/departments/procurement-department/supplier-diversity/ | Confirmed City M/W/DSBE supplier-diversity program and “find a business” link; no individual records rendered in the static page. |
| Visit Philadelphia, Black-owned shops | https://www.visitphilly.com/articles/philadelphia/black-owned-shops-and-boutiques-in-philadelphia/ | Individual records with addresses and first-party destinations. |
| Visit Philadelphia, Black-owned restaurants | https://www.visitphilly.com/articles/philadelphia/black-owned-restaurants-to-seek-out-in-philadelphia/ | Individual records with addresses and first-party destinations. |
| Visit Philadelphia, Latino-owned shops | https://www.visitphilly.com/articles/philadelphia/latino-owned-shops-boutiques-in-greater-philadelphia/ | Individual records with addresses and first-party destinations. |
| Visit Philadelphia, Latino-owned restaurants | https://www.visitphilly.com/articles/philadelphia/latino-owned-restaurants-in-philadelphia/ | Individual records with addresses and first-party destinations. |

## Results
The JSONL contains **29 candidates**: 16 Black-owned-guide records and 13 Latino-owned-guide records, with one business category per record. Counts are record lines, not deduplicated corporate entities or a claim of current operation. Ownership designations are copied only from published guide wording; no identity, language, hours, accessibility, licensing, insurance, or availability was inferred.

## Exclusions and limitations
Records were excluded where the guide supplied no Philadelphia street address, only a generic directory/map page, no official customer-facing website/social destination, or an ambiguous/non-business destination. Regulated services were not included in this pass; health, legal, financial, childcare, and similar records should be separately reviewed as `regulated_review`. Houses of worship and cultural institutions were not forced into the commercial-business set. The City OEO registry and “find a business” application were discoverable but interactive; stable individual listing URLs and complete pagination were not accessible through the static public pages, so this report does not claim exhaustive coverage. Visit Philadelphia is an official regional visitor site, not a City registry; it is used here for its detailed, public, individual business guides and first-party links.
