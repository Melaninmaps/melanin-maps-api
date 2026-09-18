# Source Pass 18: Newark and North Jersey Directory Sources

## Source label

**African-American Chamber of Commerce of Pennsylvania, New Jersey, and Delaware — Active Member Directory**

## Source organization and URLs used

The source organization is the [African-American Chamber of Commerce of PA, NJ, and DE](https://aachamber.com/), whose official directory landing page identifies the directory as its “Active Member Directory.” The directory URL specified in the city-source matrix was opened: [https://membership.aachamber.com/list](https://membership.aachamber.com/list). The chamber’s public WordPress directory page was also opened at [https://aachamber.com/member-directory/](https://aachamber.com/member-directory/). A public alpha/detail results page was opened at [https://membership.aachamber.com/list/searchalpha/e](https://membership.aachamber.com/list/searchalpha/e), which exposed 17 public listings, all outside Newark/North Jersey (including Philadelphia-area, Delaware, and Pennsylvania addresses). The directory’s linked alpha-navigation pattern was reviewed through the public `FindStartsWith?term=` links shown on the landing page. Search was also used to locate publicly indexed official detail pages; those results exposed New Jersey records in Voorhees, Camden, Atlantic City, and Cherry Hill, but none in Newark or North Jersey, and they were outside the requested territory.

## Pages and ranges traversed

The directory landing page was traversed for all displayed alphabet links (0–9, A–Z, and All), together with its category index. The public E-alpha results page was opened in full and its 17 result cards were reviewed. Publicly indexed detail-page search results were checked for Newark, New Jersey, Jersey City, Paterson, Elizabeth, and Essex County terms. The directory’s search endpoint URLs for Newark and NJ were attempted (`/list/search?q=Newark&o=alpha&an=True` and `/list/search?q=NJ&o=alpha&an=True`), but the extractor returned no page content for those dynamic searches. A direct automated request pass was also attempted against the alpha endpoints; the sandbox experienced a transient DNS failure during that pass. Because no Newark/North Jersey listing page with a verifiable exact street address and independently opened official customer website/social destination was obtained, no candidate was retained.

## Candidate counts

| Target kind | Count |
|---|---:|
| business | 0 |
| community_resource | 0 |
| cultural_place | 0 |
| online_business | 0 |
| **Total** | **0** |

Category counts are therefore all zero. No healthcare, dental, legal, financial, counseling, or other regulated-profession record was retained. No house of worship, community center, cultural institution, library, mutual-aid, food-support, family-support, elder/disability-support, education/training, funeral, shelter, civic-support, or nonprofit record in Newark/North Jersey was exposed with the required independently opened official destination and exact street address during this source pass.

## Omissions and blocks

The directory is regional rather than Newark-specific, and its public UI does not provide a clearly exposed geographic filter in the extracted HTML. The visible E-alpha page showed only non-target locations. Dynamic Newark/NJ search URLs did not yield extractable content, and the direct request pass encountered transient DNS failure. Search-result snippets were not used as evidence. New Jersey results found through public indexing were deliberately omitted when they were outside Newark/North Jersey (for example Voorhees, Camden, Atlantic City, and Cherry Hill), and no record was inferred from a name or chamber membership alone. Since the task requires a current official public website or official social destination independently opened for every retained record, no incomplete or snippet-only record was invented.

The candidate JSONL file is intentionally empty, as required when the exact source has no usable public listings for the requested territory.
