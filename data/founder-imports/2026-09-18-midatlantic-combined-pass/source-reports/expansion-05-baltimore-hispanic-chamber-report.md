# Baltimore Hispanic Chamber Candidates — Evidence Report

## Scope and method

This pass used the public **Maryland Hispanic Chamber of Commerce (MDHCC) Corporate Membership Directory** as the starting directory and checked each retained candidate against its own official customer-facing website. The geographic focus was Baltimore and nearby Anne Arundel County (Hanover). The directory page is [MDHCC Corporate Membership Directory](https://maryland-hispanic-chamber-of-commerce.org/membership-directory/corporate); the chamber homepage is [MDHCC](https://maryland-hispanic-chamber-of-commerce.org/).

The directory exposed a public list of corporate members but did not expose full address/phone/site details in the fetched text. Accordingly, a candidate was retained only when an official first-party site supplied a customer destination and the required location facts. Chamber membership is recorded as a source relationship only, never as ownership evidence.

## Retained candidates

| Row | Candidate | City | Classification | Evidence basis |
|---:|---|---|---|---|
| 1 | M&T Bank - Light and Redwood | Baltimore | regulated_review | Official branch page publishes 1 Light Street, Baltimore, phone, branch/ATM and banking services. |
| 2 | University of Maryland Medical Center (UMMC) | Baltimore | regulated_review | Official UMMC page identifies 22 S. Greene Street, Baltimore and hospital/telehealth information. |
| 3 | Live! Casino & Hotel Maryland | Hanover | regulated_review | Official property site publishes address, phone, casino/hotel/dining/spa/entertainment offerings and responsible-gambling notice. |
| 4 | Somos Baltimore Latino | Baltimore | community_resource | Official site publishes address, phone, appointment basis, media/news and community-information mission. |

## Counts and exclusions

**4 candidates were retained.** The chamber directory showed many additional members, including utilities, banks, insurers, law firms, consultants, government/economic-development bodies, and organizations outside the Baltimore-area target. They were excluded from this pass when the fetched public evidence did not establish a Baltimore/nearby-county street address plus an official customer-facing destination, or when the listing appeared outside the geographic scope. The chamber’s “small business” directory page returned no results in the fetched view. No online-only candidate was retained because no chamber-listed candidate was verified as explicitly online-only with a distinct customer destination. Houses of worship were not identified among the retained Baltimore-area results; none was reclassified as a business.

## Ownership and regulated-service cautions

No retained record has a positive ownership designation. The chamber directory does not itself establish Hispanic, Latino, Black, immigrant, women-owned, or other ownership. M&T Bank, UMMC, and Live! Casino & Hotel are marked `regulated_review` because banking, healthcare, and gambling are regulated service domains; this is a review-routing classification, not a claim about licensure or service availability.

## Accessibility and evidence limitations

The chamber directory is a dynamic public page whose member detail links were not exposed in the text extraction, and the small-business view returned no results. Official sites vary in completeness: UMMC’s cited page did not publish a phone in the extracted footer; official pages may change hours, services, social URLs, or availability. No inference was made about ownership, language capability, identity, accessibility, insurance acceptance, licenses, hours beyond explicitly published information, or current availability. No database/API was called and no publication occurred.

## Source URLs

- [MDHCC homepage](https://maryland-hispanic-chamber-of-commerce.org/)
- [MDHCC corporate membership directory](https://maryland-hispanic-chamber-of-commerce.org/membership-directory/corporate)
- [M&T official Baltimore branch](https://locations.mtb.com/md/baltimore/bank-branches-and-atms-baltimore-md-6443.html)
- [UMMC official page](https://www.umms.org/ummc)
- [Live! Casino & Hotel Maryland official site](https://maryland.livecasinohotel.com/)
- [Somos Baltimore Latino official site](https://somosbaltimorelatino.com/)
