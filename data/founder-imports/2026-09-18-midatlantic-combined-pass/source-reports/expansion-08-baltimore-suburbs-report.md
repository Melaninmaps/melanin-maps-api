# Baltimore Suburbs Candidate Source Pass (08)

## Scope and method
This pass covered **Baltimore County, Anne Arundel County, Howard County, and Harford County** and started with public local-government, civic, chamber, and local-directory sources. Candidates were retained only when the public source supplied a physical street address and a customer-facing official website or social destination. Ownership was not inferred from names, neighborhoods, or chamber membership.

## Sources reviewed
1. [Harford County NAACP Black-Owned Business Directory](https://www.harconaacp.org/black-owned-businesses) — a civic directory whose published criterion says applicants must identify as a Black Owned Business headquartered in Harford County. It supplies name, sector, town, phone, website, and mailing address.
2. [The Columbia MD Mom: Highlighting Black-Owned Businesses in Howard County](https://thecolumbiamdmom.com/blog/black-owned-businesses-howard-county-md) — a public local feature explicitly framed as Black-owned businesses in Howard County; individual entries include addresses and first-party website links.
3. [Baltimore County MWBE Program](https://www.baltimorecountymd.gov/departments/budfin/purchasing/supplier-diversity/MWBE) — reviewed for county certification context. Baltimore County does not itself certify; it accepts MDOT or Baltimore City certifications, and the page did not expose a usable public candidate listing in this pass.
4. [Anne Arundel County Certified Business Enterprise Directory](https://www.aacounty.org/central-services/purchasing/procurement-access-and-vendor-equity-pave/cbe-directory) — reviewed as an official minority-designation directory. The page reports 496 registered minority businesses and filters by owner designation, but the rendered page did not expose stable individual listing rows with complete customer URLs in this pass.

## Results
The JSONL contains **23 physical candidates**: **12 Harford County** listings and **11 Howard County** listings. No online-only candidate was added. No health, legal, financial, childcare, or funeral listings were included in this pass; those categories require regulated review and were excluded rather than classified without additional verification.

| County | Candidates | Primary source | Notes |
|---|---:|---|---|
| Baltimore County | 0 | County MWBE program page | Gap: no stable public business rows exposed; certification context only. |
| Anne Arundel | 0 | County CBE directory | Gap: directory is interactive/rendered and individual rows were not reliably extractable with complete customer destinations. |
| Howard | 11 | Local public feature | Addresses and first-party customer links published in article. |
| Harford | 12 | Harford County NAACP directory | Directory states Black-owned/headquartered criterion and publishes contact details. |

## Exclusions, gaps, and accessibility limitations
The Visit Baltimore Black-owned guide was reviewed but its featured businesses were Baltimore City listings, outside this four-county suburban scope, so none were imported. Generic search pages, Yelp, chamber social accounts, and directory home pages were not used as customer destinations. The Anne Arundel directory is large and interactive; only aggregate statistics were available in extracted text, so no individual record was fabricated. Baltimore County’s official page explains accepted certifications but does not provide a public candidate roster. Website availability, hours, accessibility, language, licenses, insurance, and current operations were not inferred. The source pages and directory contents may change; this is a dated research pass, not a live verification.
