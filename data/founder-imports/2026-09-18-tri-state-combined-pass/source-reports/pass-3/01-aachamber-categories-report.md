# African American Chamber categories — Philadelphia deep-dive pass 3

## Scope and method

This pass used the African American Chamber of Commerce of PA, NJ, DE [Active Member Directory](https://membership.aachamber.com/list), with category pages for accounting, restaurants/food/beverages, construction, arts/culture/entertainment, health/wellness, and real estate. Philadelphia and Pennsylvania-suburb records were prioritized, with nearby South Jersey included where the category surfaced a relevant member. The chamber listing was used for exact listing/profile URLs, published address and phone fields, and linked business websites. Each retained record has a physical address and a business-specific customer-facing website; entries without both were excluded.

The chamber directory’s category pages were accessible as rendered text on 2026-09-18. Individual “More Details” profile links were not exposed in the fetched rendering, so category listing URLs are preserved exactly in `sourceUrl`. Social profiles were not published in the reviewed chamber pages and were not fabricated or substituted with generic directory accounts. Ownership designations are empty because chamber membership is not evidence of ownership.

## Candidate coverage

The JSONL contains 26 candidates. Accounting, health/wellness, and real-estate records use `regulated_review` because the source categories describe potentially regulated professional or care services; this is a routing designation, not a claim that a particular license was verified. Commercial arts, food, construction, and flooring/removal records use `business`. No house of worship or online-only record was identified in the reviewed category pages.

| Category pass | Source URL | Records retained | Key caveat |
|---|---|---:|---|
| Accounting | https://membership.aachamber.com/list/Search/accounting-792024 | 4 | Regulated review; chamber category and linked websites only. |
| Restaurants, Food & Beverages | https://membership.aachamber.com/list/Search/restaurants-food-beverages-792064 | 2 | Records without a physical address were excluded. |
| Construction | https://membership.aachamber.com/list/Search/construction-792018 | 7 | Records without a customer website were excluded; one malformed chamber website URL retained for manual verification. |
| Arts, Culture & Entertainment | https://membership.aachamber.com/list/Search/arts-culture-entertainment-792069 | 3 | One chamber-published website URL contains a comma typo and is marked for manual review. |
| Health & Wellness | https://membership.aachamber.com/list/Search/health-wellness-792050 | 7 | Regulated review; no license or service claims inferred. |
| Real Estate | https://membership.aachamber.com/list/Search/real-estate-792022 | 2 | Regulated review; no license or ownership claim inferred. |

## Exclusions and limits

Excluded examples include chamber listings with no street address, no business-specific website or social destination, or both. This includes directory entries such as Horsey Buckner & Heffler, Camfred Construction, Claffey Construction, and Community Property Management where the rendered listing did not provide the required customer destination; no map pin was fabricated. The chamber itself does not establish African-American ownership, so ownership fields remain explicitly unverified. Search-engine results, generic Google pages, chamber account pages, LinkedIn personal profiles, and shared directory social accounts were not used as customer destinations.

## Source URLs

- [Active Member Directory](/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-philadelphia-deep-dive-pass-3/../.. if False else 'https://membership.aachamber.com/list')
- [https://membership.aachamber.com/list/Search/accounting-792024](https://membership.aachamber.com/list/Search/accounting-792024)
- [https://membership.aachamber.com/list/Search/restaurants-food-beverages-792064](https://membership.aachamber.com/list/Search/restaurants-food-beverages-792064)
- [https://membership.aachamber.com/list/Search/construction-792018](https://membership.aachamber.com/list/Search/construction-792018)
- [https://membership.aachamber.com/list/Search/arts-culture-entertainment-792069](https://membership.aachamber.com/list/Search/arts-culture-entertainment-792069)
- [https://membership.aachamber.com/list/Search/health-wellness-792050](https://membership.aachamber.com/list/Search/health-wellness-792050)
- [https://membership.aachamber.com/list/Search/real-estate-792022](https://membership.aachamber.com/list/Search/real-estate-792022)
