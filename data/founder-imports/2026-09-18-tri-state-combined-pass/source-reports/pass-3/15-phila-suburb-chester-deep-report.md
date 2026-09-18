# Philadelphia Suburb Chester County Deep-Dive Pass 3: Evidence Report

## Scope and method

This pass focused on West Chester, Coatesville, Kennett Square, Downingtown, and nearby Chester County communities. It used a local West Chester business article, the Start Local Chester County Black/people-of-color-owned signpost, the Kennett Collaborative directory, and official chamber/borough pages. Exact listing and customer-destination URLs are preserved in the JSONL file.

## Evidence summary

The strongest ownership evidence is the Hello, West Chester article, whose page title and section heading explicitly identify the listed West Chester businesses as Black-owned; the article supplies street addresses and business-specific websites or social pages for most entries. Start Local explicitly frames its Chester County list as African-American-owned and people-of-color-owned businesses, but several entries provide only a city and therefore are retained as address-verification leads rather than map-ready physical records. Kennett Collaborative supplies physical addresses and business-specific customer links for local establishments, but it does not designate ownership; no Latino ownership is inferred from names, cuisine, or language.

The chamber rows are community resources, not ownership evidence. Western Chester County Chamber is based in Coatesville, Southern Chester County Chamber is based in West Grove and links a business directory, and the county chamber provides broader coverage. Kennett Square’s official Advisory Commission on Latino Affairs is included as a community resource because its page explicitly concerns the Latino community, not as a business listing.

## Accessibility limits and exclusions

The Chester County Chamber member-directory endpoint returned only a shell during extraction, so no chamber-member businesses were promoted from that directory without a readable detail page. Generic directory home pages, generic chamber social accounts, Google Maps links, LinkedIn personal profiles, and shared directory social accounts were not used as customer destinations. Businesses whose cited source lacked a street address were retained only as manual verification leads with no fabricated map pin; this is especially relevant to Start Local entries and Little Faces Childcare Center. Kennett Collaborative businesses were retained only where a physical address and business-specific customer destination were both visible, but ownership remains unverified. Regulated rows (childcare and funeral services) are marked `regulated_review` and require independent licensing/service verification before publication.

## Candidate count

29 JSONL candidates were written.
