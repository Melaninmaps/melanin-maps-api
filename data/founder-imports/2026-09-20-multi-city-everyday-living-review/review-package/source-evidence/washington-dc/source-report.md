# Washington, DC Everyday-Life Research Source Report

**Scope and result.** This research-only sweep identified **37 candidate records** and **4 held records** for Washington, DC. The candidate set is designed to support everyday and difficult-day navigation while keeping ownership designations blank unless an official source directly attributes one. It contains **no coordinates** and has not been written to, connected to, or published in any directory or production database.

## Count reconciliation

| File | Records | Reconciliation |
|---|---:|---|
| `candidates.jsonl` | 37 | 37 unique `sourceRow` values, all beginning `multi-city-washington-dc-`; 35 physical candidates have a numbered DC street address and 2 official online services have no physical pin. |
| `held-candidates.jsonl` | 4 | 4 plausible leads withheld because a current official page did not confirm a numbered address, readable current destination, or stable physical service location. |
| **Total researched lines** | **41** | Candidate and hold files are disjoint; no coordinates are present. |

## Coverage and evidence notes

The inventory covers food across several current menu price points: Ben’s official ordering page lists $5.99 junior dogs, $8.49 half-smokes and $7.99 small chili; La Plaza lists $4.50 pupusas and a $24.95 sampler; Oohh’s & Aahh’s lists items from $10.45 Brussels sprouts through a $39.95 seafood platter; Oyamel shows $18–$35 current specials and flights. These are **specific published examples**, not an inferred global price-tier designation. The food selection includes soul-food and Hispanic/Latin American destinations, without making unsupported ownership claims. [1] [2] [3] [4]

The cultural section prioritizes Chocolate City’s music and Black cultural institutions. The Go-Go Museum describes itself as a site for the appreciation and study of go-go music, history and culture in Anacostia. NMAAHC and the Anacostia Community Museum provide museum destinations, while The Howard Theatre is a current ticketed music venue. Dance Place and The Washington Ballet provide source-supported youth/adult dance pathways. [5] [6] [7] [8] [9] [10]

Health destinations include a community health center, a family health/birth center and District behavioral-health navigation. Unity’s Anacostia page expressly lists primary care, dental, behavioral health, pharmacy, reproductive health, medication-assisted treatment, WIC and interpretation services. Community of Hope lists medical, dental, emotional-wellness, midwifery, pediatric, WIC and insurance-enrollment support. These, and organizations that publish legal or health services, are deliberately marked `regulated_review`; the sweep does not credential, rank, or individually recommend clinicians, dentists, therapists, lawyers or counselors. [11] [12] [13]

Difficult-day and practical support includes food, clothing, housing, employment training, civil legal assistance, immigrant/community navigation, household garment care, auto repair/towing, District service requests and visitor planning. Bread for the City, SOME, DC Central Kitchen, Martha’s Table and the Capital Area Food Bank are separately listed because their official sources support distinct service roles and physical destinations. Legal Aid DC, NLSP, CARECEN and Housing Counseling Services are retained only as regulated-review leads. [14] [15] [16] [17] [18] [19] [20] [21] [22]

## Category totals

| Category | Candidate count |
|---|---:|
| Food and drink | 7 |
| Arts, culture and music | 4 |
| Youth and family activities | 2 |
| Fitness and wellness | 1 |
| Beauty and personal care | 3 |
| Health and medical | 3 |
| Legal and financial/housing counseling | 4 |
| Community and difficult-day support | 6 |
| Career and education | 2 |
| Household services | 1 |
| Mobility | 2 |
| Practical government service / online service | 1 |
| Travel and day-trip planning / online service | 1 |
| **Total** | **37** |

## Discovery and source protocol

Discovery began with the official tourism destination’s Black-chef/restaurant and Latin-American dining guides, community-health and District government sources, museum/cultural organizations and official customer sites. Each retained candidate was checked against a current official customer destination, government page, official organization page, official ordering/booking page, or official location page before it was added. Search-result snippets were not used as final evidence. The record-level `sourceUrl` field supplies the particular official page for every line. Washington.org was used as a credible DC discovery/visitor context source rather than proof of ownership. [23]

The report also records an overlap risk: **Ben’s Chili Bowl, the Go-Go Museum, NMAAHC, La Cosecha, The Howard Theatre, Dance Place, Oohh’s & Aahh’s and Bread for the City** are prominent destinations that may recur in future culture-, food-, community- or travel-specific research paths. Their `sourceRow` identifiers and exact addresses should be used for later duplicate reconciliation; this sweep did not access an existing directory or existing city research database.

## Held leads and limitations

El Tamarindo’s official site supports its food identity and customer offering but, in the page read here, lacks a numbered address. Cane and Florida Avenue Grill have plausible official domains, but those domains returned bot/verification interstitials and could not provide readable current official location evidence. Freestyle DansFit publishes a schedule of several venues but not a single stable numbered business address. These leads are in `held-candidates.jsonl`, not the candidate file.

The collection is intentionally conservative. Service availability, menu prices, hours, eligibility, appointments, insurance acceptance, provider credentials, event programming, accessibility and transport options can change and should be reconfirmed with the named official source. No ownership, language, accessibility, age-suitability, licensing, or price classification is inferred when the official source does not state it. The geographical scope is **the District only**; Washington.org is retained as an online official visitor-planning context, not as an out-of-District physical listing.

## Publication boundary

These files are **research-only**, contain **no coordinates**, and have not staged, created, edited, geocoded, pinned, published, suppressed, or altered any production directory record. They have not been connected to a database. Any later production route must follow the separate review and controlled publishing process in the research contract.

## References

[1]: https://order.toasttab.com/online/bens-chili-bowl-u-st "Ben’s Chili Bowl Original U Street official ordering"
[2]: https://oohhsnaahhs.com/georgia-ave "Oohh’s & Aahh’s Georgia Avenue official location"
[3]: https://www.laplazawashington.com/czuohd16/la-plaza-mexican-and-salvadorian-cuisine-washington-20003/order-online "La Plaza Mexican & Salvadorian Cuisine official menu"
[4]: https://www.oyamel.com/washington-dc-menu/ "Oyamel Washington, DC official menu"
[5]: https://www.gogomuseumcafe.com/ "The Go-Go Museum & Café official site"
[6]: https://nmaahc.si.edu/visit "National Museum of African American History and Culture official visit page"
[7]: https://anacostia.si.edu/visit "Anacostia Community Museum official visit page"
[8]: https://www.thehowardtheatre.com/ "The Howard Theatre official site"
[9]: https://www.danceplace.org/ "Dance Place official site"
[10]: https://www.washingtonballet.org/ "The Washington Ballet official site"
[11]: https://www.unityhealthcare.org/locations/anacostia-health-center "Unity Health Care Anacostia Health Center official page"
[12]: https://www.communityofhopedc.org/locations/family-health-and-birth-center/ "Community of Hope Family Health and Birth Center official page"
[13]: https://dbh.dc.gov/ "DC Department of Behavioral Health official site"
[14]: https://breadforthecity.org/ "Bread for the City official site"
[15]: https://some.org/ "SOME official site"
[16]: https://dccentralkitchen.org/ "DC Central Kitchen official site"
[17]: https://marthastable.org/ "Martha’s Table official site"
[18]: https://www.capitalareafoodbank.org/ "Capital Area Food Bank official site"
[19]: https://www.legalaiddc.org/ "Legal Aid DC official site"
[20]: https://www.nlsp.org/ "Neighborhood Legal Services Program official site"
[21]: https://carecendc.org/ "CARECEN DC official site"
[22]: https://housingetc.org/ "Housing Counseling Services official site"
[23]: https://washington.org/ "Washington.org official tourism site"
