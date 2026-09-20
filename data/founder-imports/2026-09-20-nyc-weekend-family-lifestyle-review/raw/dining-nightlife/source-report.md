# NYC Dining & Nightlife Source Report

## Scope and result

This research covers **one NYC directory category: dining and nightlife**. It is a source-backed weekend inventory of lunch, dinner, brunch, bar, lounge, dessert, and Mexican/Latin food options. The submitted set contains **18 physical-business records** across all five boroughs. It includes Black-owned designations only where an opened source expressly made that designation, and LGBTQ-community relevance only where an opened venue source expressly described it. No owner identity, price tier, safety, accessibility, patron identity, hours beyond source context, or cultural affiliation has been inferred.

The review produced **18 submitted records** and **9 held records**. A held record is a plausible lead that failed a required source standard, including a missing numbered street address, permanent closure, unusable source, parked domain, or unresolved host. The candidate and held JSONL files are research artifacts only.

## Coverage ledger

| Coverage dimension | Submitted count | Source-grounded coverage |
|---|---:|---|
| Dining | 7 | Soul food, Caribbean/Jamaican, Creole/Cajun, juice/smoothies, Caribbean cafe, and African restaurant/lounges. |
| Bars and lounges | 3 | Craft beer bar, beer hall, and wine bar. |
| Nightlife | 3 | Bookstore/wine bar, queer-owned bar/event venue, and gay bar. |
| Dessert | 2 | Caribbean-inspired ice cream and bakery/dessert. |
| Mexican/Latin food | 3 | Mexican restaurant, Latin empanada restaurant, and Mexican grill. |
| Manhattan | 5 | Harlem, Hell’s Kitchen, and Church Street listings. |
| Brooklyn | 7 | Williamsburg, Crown Heights, Bed-Stuy, and other Brooklyn-address entries. |
| Queens | 3 | Long Island City, Jamaica, and Laurelton. |
| Bronx | 2 | Mott Haven and Arthur Avenue Retail Market. |
| Staten Island | 1 | Jewett Avenue. |

The files do not assign price points. Several opened sites publish menu prices or affordability language, but this batch has no consistent source basis for a citywide price taxonomy; no price tier was inferred.

## Primary submission evidence

| Record(s) | Primary source type | Evidence used | Decision |
|---|---|---|---|
| Sylvia’s; Kokomo; Island Pops; The Lit. Bar; Charles Pan-Fried Chicken; C’mon Everybody; Metropolitan; Harlem Hops; Casa Enrique; Empanada Mama; The Bronx Beer Hall; Guac Time | Official business/customer site | Numbered address plus business description; social/customer links where published. Four official sources also expressly state Black-owned/African American-owned or queer-owned status. | Submitted. |
| File Gumbo Bar; The Nourish Spot; Therapy Wine Bar 2.0; Sweet Sundays Cafe; Native Restaurant and Lounge; Butter Buttercream | Black Restaurant Week’s public New York campaign directory | The directory expressly presents its cohort as Black-owned and gives each selected entry’s address, category, and linked official/social customer destinations. | Submitted. |
| Sugar Hill Creamery; Melba’s | Official business/customer site | Business and service evidence was present, but no numbered street address was present in the successfully extracted pages. | Held. |
| Negril BK | Official business/customer site | Source explicitly says permanently closed. | Held. |
| The Crabby Shack; La Morada; Misi; Addisleigh Park Restaurant; Casa Adela | Public domains/URLs opened for verification | Redirect only, unrelated content, parked domain, or unresolved host prevented reliable listing evidence. | Held. |

## URL-opening ledger

Each URL below was opened/read during this research. “Supporting” sources were read to verify an attribute or to assess a lead; they are not necessarily the `sourceUrl` retained in every JSONL row.

| Ref. | URL opened | Evidence type / outcome | Used for |
|---:|---|---|---|
| [1] | https://www.sylviasrestaurant.com/ | Official business home; address, phone, services, Instagram/Facebook. | Submitted Sylvia’s. |
| [2] | https://sylviasrestaurant.com/about | Official About page; Woods family and explicit Black-owned/family-operated statement. | Supporting Sylvia’s ownership evidence. |
| [3] | https://www.kokomonyc.com/ | Official business home; address, founders, explicit Black-owned statement, dining/nightlife/social information. | Submitted Kokomo. |
| [4] | https://www.islandpops.com/ | Official business home; address, owner names, dessert/catering/social information. | Submitted Island Pops. |
| [5] | https://www.thelitbar.com/ | Official business home; address, bookstore/wine-bar/events information. | Submitted The Lit. Bar. |
| [6] | https://www.charlespanfriedchicken.com/ | Official business home; flagship address, menu, ordering, catering, social links. | Submitted Charles Pan-Fried Chicken. |
| [7] | https://www.cmoneverybody.com/ | Official business home; address, queer-owned/operated statement, drinks/events. | Submitted C’mon Everybody. |
| [8] | https://www.metropolitanbarny.com/ | Official business home; address, gay-bar description, phone, socials. | Submitted Metropolitan. |
| [9] | https://www.harlemhops.com/ | Official business home; address, phone, services, explicit African American-owned statement, socials. | Submitted Harlem Hops. |
| [10] | https://casaenriquelic.com/ | Official business home; Mexican cuisine, brunch/dinner/cocktail menu links and social links. | Supporting Casa Enrique. |
| [11] | https://casaenriquelic.com/contact-us | Official contact page; numbered Queens address, phone, hours. | Submitted Casa Enrique. |
| [12] | https://www.empanadamama.com/ | Official business home; Latin restaurant description, numbered locations, services. | Submitted Empanada Mama. |
| [13] | https://www.thebronxbeerhall.com/ | Official business home; address, phone, craft beer/food/event/social information. | Submitted The Bronx Beer Hall. |
| [14] | https://guactimeusa.com/ | Official business home; Mexican-cuisine description, locations including Staten Island, ordering/catering/social information. | Submitted Guac Time. |
| [15] | https://blackrestaurantweeks.com/new-york-black-restaurant-week/ | Reputable campaign directory; its Black-owned cohort statement plus selected listing addresses, categories, links, and socials. | Submitted six Black Restaurant Week entries. |
| [16] | https://www.sugarhillcreamery.com/ | Official business home; Black-owned/woman-led statement and dessert services; no numbered street address in extracted page. | Held Sugar Hill Creamery. |
| [17] | https://www.sugarhillcreamery.com/locations | Official location endpoint returned no extractable content. | Supporting hold for Sugar Hill Creamery. |
| [18] | https://www.negrilbk.com/ | Official site says permanently closed. | Held Negril BK. |
| [19] | https://www.thecrabbyshack.com/ | 308 Permanent Redirect only. | Held The Crabby Shack. |
| [20] | https://www.lamoradanyc.com/ | Unrelated casino/entertainment content, not a credible restaurant destination. | Held La Morada. |
| [21] | https://www.misini.com/ | Parked domain-for-sale page. | Held Misi and documented incorrect-domain disposition. |
| [22] | https://www.addisleighparkrestaurant.com/ | Host could not resolve to public IP in fetch tool. | Held Addisleigh Park Restaurant. |
| [23] | https://casaadelanyc.com/ | Host could not resolve to public IP in fetch tool. | Held Casa Adela. |
| [24] | https://www.melbasrestaurant.com/ | Official home; food/order/catering/private-event evidence but no numbered address in extraction. | Held Melba’s. |
| [25] | https://www.melbasrestaurant.com/contact/ | Official contact page; no numbered address in extraction. | Supporting hold for Melba’s. |
| [26] | https://www.nyctourism.com/restaurants/ | Municipal tourism organization’s generic restaurant directory landing page; no candidate selected from its dynamically filtered list. | Scope/context only; no record submitted from it. |

## Deduplication decisions

Deduplication used normalized business name plus street address and city. There are no duplicate submitted normalized name-and-address pairs. A single physical location was retained for brands with multiple published locations: Charles Pan-Fried Chicken (Harlem flagship), Empanada Mama (Hell’s Kitchen), and Guac Time (Staten Island). Casa Enrique’s correct official domain and contact page were retained; a parked wrong-domain lead is kept only in the held file to document its disposition and is not a duplicate business record. Each Black Restaurant Week entry is a distinct name-and-street-address record.

## Limitations and review boundaries

The set is intentionally not exhaustive. It relies on the public pages readable in this run. Several plausible leads are held rather than repaired with map data, search snippets, memory, or unreviewed sources. A link to an official customer website in a directory was captured when published, but this batch does not assert that every linked destination was separately opened. Black-owned evidence from Black Restaurant Week is attributable to that directory’s campaign-level statement and included entry, not independently verified ownership data. The source report records an address only where the relevant opened source provided one; no coordinates were collected or inferred.

No faith/worship record was added because this is strictly the dining-and-nightlife category and no such place was relabeled to force inclusion. LGBTQ-community relevance is represented only by venues whose own public descriptions support it.

## No-publication statement

**No application database was written. No publication endpoint was called. No claim is made that any record is live, approved, or published. No coordinates were created, inferred, or geocoded.** These files are strictly source-backed research for protected review.

## References

[1]: https://www.sylviasrestaurant.com/ "Sylvia’s Restaurant official website"
[2]: https://sylviasrestaurant.com/about "Sylvia’s Restaurant official About page"
[3]: https://www.kokomonyc.com/ "Kokomo Restaurant & Lounge official website"
[4]: https://www.islandpops.com/ "Island Pops official website"
[5]: https://www.thelitbar.com/ "The Lit. Bar official website"
[6]: https://www.charlespanfriedchicken.com/ "Charles Pan-Fried Chicken official website"
[7]: https://www.cmoneverybody.com/ "C’mon Everybody official website"
[8]: https://www.metropolitanbarny.com/ "Metropolitan Bar official website"
[9]: https://www.harlemhops.com/ "Harlem Hops official website"
[10]: https://casaenriquelic.com/ "Casa Enrique LIC official website"
[11]: https://casaenriquelic.com/contact-us "Casa Enrique LIC official contact page"
[12]: https://www.empanadamama.com/ "Empanada Mama official website"
[13]: https://www.thebronxbeerhall.com/ "The Bronx Beer Hall official website"
[14]: https://guactimeusa.com/ "Guac Time official website"
[15]: https://blackrestaurantweeks.com/new-york-black-restaurant-week/ "Black Restaurant Week New York Region campaign directory"
[16]: https://www.sugarhillcreamery.com/ "Sugar Hill Creamery official website"
[17]: https://www.sugarhillcreamery.com/locations "Sugar Hill Creamery official locations endpoint"
[18]: https://www.negrilbk.com/ "Negril BK official website"
[19]: https://www.thecrabbyshack.com/ "The Crabby Shack domain"
[20]: https://www.lamoradanyc.com/ "La Morada domain"
[21]: https://www.misini.com/ "misini.com parked domain"
[22]: https://www.addisleighparkrestaurant.com/ "Addisleigh Park Restaurant domain"
[23]: https://casaadelanyc.com/ "Casa Adela domain"
[24]: https://www.melbasrestaurant.com/ "Melba’s official website"
[25]: https://www.melbasrestaurant.com/contact/ "Melba’s official contact page"
[26]: https://www.nyctourism.com/restaurants/ "NYC Tourism restaurant directory"
