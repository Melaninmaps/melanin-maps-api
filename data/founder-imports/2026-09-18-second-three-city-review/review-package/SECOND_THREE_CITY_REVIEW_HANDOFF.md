# Charlotte, Detroit, and Los Angeles Source-Backed Directory Review Package

**Status:** **REVIEW ONLY — NOT PUBLISHED.** This package does not write to a production database, create public map pins, change users, or supply live Kinfolk recommendations. It is a protected input for reviewer staging and approval.

## Scope and candidate composition

This bounded package consolidates public-source research for **Charlotte metro, Detroit and nearby suburbs, and Los Angeles County**. The three city passes retained 280 candidate rows and independently held 320 records with incomplete, stale, or questionable evidence. During standardized consolidation, three locationless community-resource records were held rather than receiving invented addresses. One additional candidate was held because no usable customer-facing destination survived package validation. The final protected review manifest contains **276** records.

Five Detroit evidence-backed online retailers are included as `online_business` records. Their source describes them as online and does not establish a physical locality; therefore, their city/state and street address remain null. They are explicitly **mapless** and may only become searchable after reviewer approval. They are not given a made-up Detroit pin or a made-up address.

| Review route | Candidates | Publication treatment |
| --- | ---: | --- |
| Physical commercial business | 247 | May be considered for public directory and map-pin publication only after reviewer reconciliation, approval, and server-side geocode validation. |
| Online-only business | 5 | May be searchable after approval but must remain addressless and mapless. |
| Regulated-review lead | 7 | Requires the applicable authority, licensing, or higher-risk service review before any publication decision. |
| Community resource | 9 | Remains outside the commercial business and map-pin route. |
| Cultural place | 8 | Remains outside the commercial business and map-pin route. |
| **Total review candidates** | **276** | **Not public.** |

## Destination verification

The review manifest contains 261 unique customer destinations. Automated HTTP checks recorded 233 reachable destinations, 6 non-success responses requiring review, 16 timeouts, and 6 network errors. The 248 candidates whose selected customer destinations were reachable are marked `pending_review`. The remaining 28 candidates are `needs_research` and must not be promoted until a reviewer confirms a suitable public customer destination.

> A timeout, network error, or non-success HTTP response is a **review signal**, not a determination that a business has closed.

The exact review manifest is `second-three-city-combined-review-only-candidates.jsonl`. Its SHA-256 is **`6cb485bd80ac16fce18f662c678abe7fb2ac612138126014abd1cf39d066eff2`**. Do not edit it after review begins. Any change requires rebuilding the manifest and rechecking destinations.

## Evidence boundary

Every manifest record has a public source URL, a specific business or organization name, an evidence-supported category, and an HTTP(S) customer-facing official website or social destination. Physical records have numbered street addresses; online-only records deliberately do not. No record includes fabricated latitude/longitude. Health, legal, financial, childcare, dental, security, and similar higher-risk domains are routed to `regulated_review`. Community resources and cultural places are explicitly kept separate from commercial listings.

The Los Angeles source report records that the principal City GeoHub dataset was last updated on **2021-01-22**. Its candidates are not claims of present operation, ownership, licensing, availability, hours, accessibility, or quality. They remain subject to current-destination and reviewer verification. The city reports preserve their source evidence and limitations, including Charlotte visitor/city guides, Detroit municipal certification data and Black-business directories, and Los Angeles City GeoHub/area chamber resources.[1] [2] [3] [4] [5] [6]

## Required protected review sequence

First, stage the unchanged manifest through the existing protected local review route and verify the checksum. Second, reconcile each candidate against existing directory records so an existing listing is enriched rather than silently duplicated. Third, resolve the `needs_research`, collision, regulated, community, cultural, and held queues using their applicable policies. Fourth, approve only supported physical commercial candidates and validate a controlled geocode before publishing any map pin. Fifth, approve an online-only candidate only as a searchable, mapless service or retailer. Finally, validate public `/api/businesses` search, business-detail pages, map-pin click-through, customer links, and authenticated Kinfolk local retrieval after publication.

This package cannot and does not bypass those protections. No user, authentication, password, tester, session, access, waitlist, billing, or payment record is included or modified.

## References

[1]: https://www.charlottesgotalot.com/articles/eat-drink/black-owned-restaurants-in-clt "Charlotte Regional Visitors Authority guide"
[2]: https://www.charlottesgotalot.com/articles/things-to-do/latino-owned-businesses-in-charlotte "Charlotte Regional Visitors Authority Latino-owned guide"
[3]: https://www.detroitworldwide.com/black-business-directory "Detroit Worldwide Black Business Directory"
[4]: https://data-detroitmi.hub.arcgis.com/datasets/detroit-business-certification-register/about "Detroit Business Certification Register"
[5]: https://geohub.lacity.org/datasets/lahub::black-owned-businesses-1 "City of Los Angeles Black Owned Businesses GeoHub dataset"
[6]: https://glaaacc.org/ "Greater Los Angeles African American Chamber of Commerce"
