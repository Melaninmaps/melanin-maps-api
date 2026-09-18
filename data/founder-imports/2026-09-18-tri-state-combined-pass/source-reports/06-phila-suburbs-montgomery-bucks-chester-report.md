# Philadelphia Suburbs Expansion Pass 2: Montgomery, Bucks, and Chester Counties

## Scope and method

This pass searched credible public county/local chamber and community directory pages for Black- and Latino-focused business discovery, supplemented by first-party links exposed in those directories. The target was everyday needs beyond restaurants, including retail, personal care, childcare, professional services, pet care, automotive, senior care, community resources, and cultural places. No database or API was queried. This research expansion is not a claim that any business is currently live or accepting customers.

## Sources searched

| Source | URL | Result | Limitation |
|---|---|---|---|
| Jack & Jill of America, Montgomery County PA Chapter Business Directory | https://jackandjillmontco.org/business_directory/ | Black-owned business list with categories, several addresses/phones, and official destinations | Some entries lack street addresses or customer-facing URLs; several locations are Philadelphia rather than the three-county target |
| Montgomery County Black Collective directory | https://directory.mocoblackcollective.org/ | Public directory taxonomy and featured listings | Accessible page exposed mostly Maryland featured listings; no substantiated Montgomery County PA records were added from it |
| Greater BucksMont Chamber Member Directory | https://cca.bucksmontchamber.com/WebForms/37__memberdirectory.aspx | Public alphabetical listings with addresses, phones, categories, websites, and social links | Chamber membership is not ownership evidence; no Black/Latino identity inferred |
| Start Local Chester County Black-Owned Businesses page | https://startlocal.co/black-owned-businesses-in-chester-county-pa/ | Chester County area list with first-party customer links | Several entries provide city only, not street address; retained as manual review where incomplete |
| Greater Philadelphia Hispanic Chamber of Commerce | https://www.philahispanicchamber.org/ | Confirms Hispanic business mission and exposes a Membership Directory section | Underlying member listings were not accessible in the fetched public page; no individual county business was fabricated |
| Chester County Chamber active member directory | https://business.chescochamber.org/member-directory | Directory endpoint/contact page accessible | Member listings did not render in the accessible extraction, so no records were added |

## Results

The candidate file contains **32 unique JSONL records** after removing one duplicate chamber record and retaining incomplete entries as `manual_review`. The set includes Montgomery County Black-owned leads, Chester County Black-owned leads, Bucks-area chamber listings, community resources, cultural places, regulated-review records, online-only shops, and one Hispanic chamber directory lead. Ownership designations are recorded only when explicitly stated by a source. Chamber membership alone is explicitly not treated as ownership evidence.

| County/coverage | Records | Notes |
|---|---:|---|
| Montgomery County / nearby Montgomery directory coverage | 19 | Primarily Jack & Jill directory; includes retail, childcare, professional services, personal care, pet care, and online retail |
| Bucks County / BucksMont chamber coverage | 12 | Everyday services plus health, legal, senior care, community, and cultural records; no ownership inference |
| Chester County | 5 | Start Local signpost list; incomplete address records are manual review |
| Hispanic chamber directory lead | 1 | Manual review only because the underlying member list was not exposed |

Counts overlap by coverage because some directory records are regional and the county field is not always stated.

## Exclusions and quality controls

Restaurants were not targeted. Entries without a street address and/or official customer-facing URL were not published as ordinary physical map candidates; they were downgraded to `manual_review`. Regulated health, legal, childcare, veterinary, funeral, medical-weight-loss, and senior-care services were marked `regulated_review`; this does not assert licensure, insurance, availability, or current operation. The source page's references to Black-owned businesses were preserved as ownership evidence only for the named records. No identity, language, hours, accessibility, or services were inferred beyond published text.

The Chester chamber directory endpoint was accessible only as a contact/resources shell in extraction, and the Hispanic chamber's membership directory was visible as a section but its records were not publicly exposed in the fetched page. The Montgomery Black Collective page likewise showed categories and Maryland featured listings rather than verifiable Montgomery County Pennsylvania entries. These limitations are recorded rather than filled with guesses.

## Candidate file

`/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-tri-state-expansion-pass-2/source-passes/06-phila-suburbs-montgomery-bucks-chester-candidates.jsonl`
