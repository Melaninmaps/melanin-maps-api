# Philadelphia Latino Business Guides — Evidence Report

**Research pass:** 2026-09-18 Tri-State Expansion Pass 2
**Scope:** Philadelphia Latino-owned business guides, neighborhood/business associations, and community organizations beyond initial sources.
**Candidate output:** 26 JSONL records.

## Sources searched

| Source | What was checked | Result |
|---|---|---|
| [Visit Philadelphia — Latino-Owned Shops & Boutiques in Greater Philadelphia](https://www.visitphilly.com/articles/philadelphia/latino-owned-shops-boutiques-in-greater-philadelphia/) | Full published guide, including retail, classes, arts/culture, recreation, food, and drink sections; first-party links were followed from each usable listing. | 20 candidates retained from individually named listings with a physical address or explicit online/mobile basis and an official customer destination. |
| [Visit Philadelphia — Latino-Owned Restaurants in Philadelphia](https://www.visitphilly.com/articles/philadelphia/latino-owned-restaurants-in-philadelphia/) | Restaurant guide and linked official sites/social pages. | 6 candidates retained from named listings with Philadelphia-area address and official customer destination. |
| [PIDC — Support Hispanic and/or Latino-owned Businesses](https://pidcphila.com/blog/support-hispanic-latino-owned-businesses-2021/) | Named client businesses across food, arts/culture, health/wellness, and goods/services. | Corroborating discovery; no additional standalone candidates were added where the page lacked a street address or official customer destination. |
| [Greater Philadelphia Hispanic Chamber of Commerce membership directory](https://www.philahispanicchamber.org/membership-directory/corporate) | Corporate member names and accessible directory pages. | Discovery-only. The accessible index generally lacks street address and official customer destination; membership alone is not ownership evidence. No chamber-only records imported. |
| [Association of Mexican Business Owners of Philadelphia (AEM Philly)](https://aemphilly.org/en/) | Organization overview, events, and public social links. | Confirms a Latino-owned-business support network but exposes no individually attributable member roster with address plus official customer destination in accessible pages. No AEM-only records imported. |

## Included records

The JSONL contains **26 sequential records**: 20 from the Visit Philadelphia shops/boutiques guide and 6 from its restaurant guide. Categories include food and drink, retail, arts and culture, recreation, wellness, and services. Houses of worship were not encountered in retained entries; cultural organizations were classified as `cultural_place` where appropriate. Health, legal, and financial services were not imported from PIDC because the available evidence either lacked a street address or required regulated-service review.

For every physical record, the file preserves a street address, city/state/country, source page, and at least one official customer-facing website or social destination. Online/mobile records use `targetKind: online_business` and `address: null` only where the source explicitly states an online shop, online availability, mobile studio, or pop-up/mobile service basis. No coordinates were added.

## Exclusions and non-imported items

1. **Directory-only chamber members.** GPHCC’s accessible corporate index provides many names but not enough individually attributable address/destination evidence. Membership was not treated as ownership evidence.
2. **PIDC records without sufficient customer destination or address.** Boricua Restaurant, Ively Grocery, Jeisy’s Grill Chicken, Rico Mexican Tacos, CEG Performing Arts Academy, Fortaleza Physical Therapy Centers, Magaly Spa, Casa Papel, DL Metal Design, Financial Integrity Resources Management, O Z Collaborative, and Rehobot Real Estate were not added because the accessible page did not provide a complete street address plus sufficiently official customer destination, or used a third-party ordering page. Esperanza Health Center was not added because it is regulated healthcare and the accessible evidence did not provide a complete candidate-level address for this pass. Sculpere appeared in PIDC but was imported from the stronger Visit Philadelphia listing with address and official site.
3. **Third-party-only destinations.** Jeisy’s Grill Chicken was linked only to Grubhub; Rico Mexican Tacos was linked to a Google Business Site page. Neither satisfies the official customer-destination rule.
4. **Guide entries lacking an official destination.** Named entries without a first-party website or official social account were omitted even if they appeared in a guide index.
5. **Unverified attributes.** No hours, accessibility, language availability, licenses, insurance, service availability, or ownership beyond published wording was inferred.

## Gaps and limitations

The accessible GPHCC directory rendered a long corporate-member index, but its “More Info” detail pages were not exposed in the fetched response. AEM Philly’s public site describes its network and links to social channels but does not publish an individual member directory in accessible pages. PIDC’s 2021 roundup is useful for discovery but is partly historical and often links to social profiles or third-party ordering pages rather than complete first-party sites. Visit Philadelphia sometimes publishes “various locations” or pop-up/mobile language; the inventory uses the specific address shown and does not generalize other locations into separate records unless sufficiently explicit.

This is a research expansion and candidate-ingestion pass, **not a claim that every business is currently live, open, or accepting customers**. Recency, address, ownership, and destination status should be rechecked before publication or map activation.

## Record count summary

| Measure | Count |
|---|---:|
| Total candidate records | 26 |
| `business` records | 20 |
| `online_business` records | 4 |
| `cultural_place` records | 2 |
| `regulated_review` records | 0 |
| `community_resource` records | 0 |
| `manual_review` records | 0 |
| Visit Philadelphia shops/boutiques source | 20 |
| Visit Philadelphia restaurant source | 6 |

*One Greater Philadelphia restaurant (Tlali in Upper Darby) is retained because the restaurant guide explicitly covers the Greater Philadelphia region, although it is outside Philadelphia city limits.*

## Key source URLs

- https://www.visitphilly.com/articles/philadelphia/latino-owned-shops-boutiques-in-greater-philadelphia/
- https://www.visitphilly.com/articles/philadelphia/latino-owned-restaurants-in-philadelphia/
- https://pidcphila.com/blog/support-hispanic-latino-owned-businesses-2021/
- https://www.philahispanicchamber.org/membership-directory/corporate
- https://aemphilly.org/en/

**Prepared as evidence-backed candidate research only.**
