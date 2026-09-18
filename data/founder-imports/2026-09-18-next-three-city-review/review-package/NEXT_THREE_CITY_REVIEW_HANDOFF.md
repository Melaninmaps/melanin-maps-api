# Atlanta, Chicago, and Houston Source-Backed Directory Review Package

**Status:** **REVIEW ONLY — NOT PUBLISHED.** This package does not write to a production database, create public map pins, change users, or supply live Kinfolk recommendations. It is a protected input for reviewer staging and approval.

## Scope and candidate composition

This bounded package consolidates public-source research for **Atlanta metro, Chicago and nearby suburbs, and Houston metro**. The three city passes initially retained 180 candidate rows and held 34 records with incomplete or questionable evidence. One exact normalized duplicate was reconciled during package consolidation, leaving 179 structurally complete review candidates. No candidate was invented. Public directory, campaign, and editorial ownership descriptions are retained only as the source’s own wording; membership, cuisine, names, geography, or photos are not used to infer identity or ownership.

| Review route | Candidates | Publication treatment |
| --- | ---: | --- |
| Physical commercial business | 158 | May be considered for public directory and map-pin publication only after reviewer reconciliation, approval, and server-side geocode validation. |
| Regulated-review lead | 10 | Requires the applicable authority, licensing, or higher-risk service review before any publication decision. |
| Community resource | 7 | Remains outside the commercial business and map-pin route. |
| Cultural place | 4 | Remains outside the commercial business and map-pin route. |
| **Total review candidates** | **179** | **Not public.** |

There are no approved online-only records in this particular package. The upstream city-pass held files remain included for audit and are not silently converted into businesses.

## Destination verification

The review manifest contains 228 unique customer destinations. Automated HTTP checks recorded 187 reachable destinations, 29 non-success responses requiring review, 8 timeouts, and 4 network errors. The 137 candidates whose selected customer destinations were reachable are marked `pending_review`. The remaining 42 candidates are `needs_research` and must not be promoted until a reviewer confirms a suitable public customer destination.

> A timeout, network error, or non-success HTTP response is a **review signal**, not a determination that a business has closed.

The exact review manifest is `next-three-city-combined-review-only-candidates.jsonl`. Its SHA-256 is **`e6160db5669a2c4fa96a50c3ec946405bddb3862ce652bfc952d12a46585e9d8`**. Do not edit it after review begins. Any change requires rebuilding the manifest and rechecking destinations.

## Evidence boundary

Every manifest record has a public source URL, a specific business or organization name, an evidence-supported category, a numbered physical street address, and at least one customer-facing HTTP(S) official website or social destination. No record includes fabricated latitude/longitude. Health, legal, financial, childcare, dental, and similar higher-risk domains are routed to `regulated_review`. Community resources and cultural places are explicitly kept separate from commercial listings. Source reports preserve each collection pass’s inspected URLs and limitations, including Black Restaurant Week, Black Book Chicago, Chicago Black Owned Business Directory, Do312’s Hispanic-owned business guide, Black Book Houston, Visit Houston, and relevant chamber or municipal directory pages.[1] [2] [3] [4] [5] [6]

## Required protected review sequence

First, stage the unchanged manifest through the existing protected local review route and verify the checksum. Second, reconcile each candidate against existing directory records so an existing listing is enriched rather than silently duplicated. Third, resolve the `needs_research`, collision, regulated, community, cultural, and manual-review queues using their applicable policies. Fourth, approve only supported physical commercial candidates and validate a controlled geocode before publishing any map pin. Finally, validate public `/api/businesses` search, business-detail pages, map-pin click-through, customer links, and authenticated Kinfolk local retrieval after publication.

This package cannot and does not bypass those protections. No user, authentication, password, tester, session, access, waitlist, billing, or payment record is included or modified.

## References

[1]: https://blackrestaurantweeks.com/atlanta-black-restaurant-week/ "Atlanta Black Restaurant Week campaign"
[2]: https://www.blackbookchi.com/directory-listings "Black Book Chicago directory"
[3]: https://www.chicagoblackbusinessdirectory.com/ "Chicago Black Owned Business Directory"
[4]: https://do312.com/p/hispanic-owned-businesses-chicago "Do312 Hispanic-Owned Businesses in Chicago"
[5]: https://www.blackbookhouston.com/ "Black Book Houston directory"
[6]: https://www.visithoustontexas.com/blog/post/supporting-black-owned-business-in-houston/ "Visit Houston guide to Black-owned businesses"
