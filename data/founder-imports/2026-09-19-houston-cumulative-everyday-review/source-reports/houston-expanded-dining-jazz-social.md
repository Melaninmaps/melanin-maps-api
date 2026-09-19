# Houston dining, jazz, social, and evening-experience directory research

**Research date:** 2026-09-19
**Geography:** Houston and clearly Houston-metro locations only
**Directory category:** Dining, drinks, jazz/live music, social, date-night, and evening experiences

## Result

This research pass produced **26 candidate records** and **26 held leads**. The candidate file favors public-facing Houston-area restaurants, bars, lounges, and dessert destinations that have (1) an opened Black-, Hispanic-, or Latinx-attributed directory source and (2) an opened official customer-facing destination. The result includes food, drink, live-entertainment, rooftop, lounge, bar, reservation, catering, and private-event options when those offerings are expressly described by the official destination. It does not represent an endorsement or a claim about current availability, quality, safety, accessibility, price, hours, or licensure.

Ownership or demographic designations are deliberately narrow. **Black-owned** is recorded only as source-attributed through Houston Black Restaurant Week’s program description and Houston directory placement. **Hispanic-owned** is recorded only for the two Texas Restaurant Association Houston-area businesses used here. **Latinx culinary business** is recorded only for Exilio based on Latin Restaurant Weeks’ own campaign description and listing. No identity has been inferred from names, cuisine, neighborhood, imagery, or social media.

## Candidate coverage

| Attribution source | Candidates | Examples of supported evening-oriented discovery terms |
|---|---:|---|
| Houston Black Restaurant Week | 23 | cocktails, bar, lounge, live music, DJ, karaoke, rooftop, private events, brunch, reservations |
| Texas Restaurant Association’s Hispanic-Owned Restaurants in Texas | 2 | Mexican coastal dining, regional Mexican dinner, reservations, catering, private parties |
| Latin Restaurant Weeks — Houston | 1 | Latin dining, menus, private events, reservations |
| **Total** | **26** | — |

The candidate records include physical addresses exactly to the level supported by the listing or official destination. The three candidate addresses without a ZIP in the JSONL are intentionally left without one; a ZIP was not added from inference. Phone and social fields are `null` where not directly supported by an opened official page or linked source.

## Opened source set and URLs

The research used the following publicly opened source directories. Houston Black Restaurant Week states that it celebrates Black-owned restaurants and culinary businesses and supplies campaign listings across six pages. The Texas Restaurant Association source explicitly labels its page “Hispanic-Owned Restaurants in Texas.” Latin Restaurant Weeks says it supports local Latinx culinary businesses. [1] [2] [3] [4] [5] [6] [7] [8] [9]

| Opened source | Role in this pass | URL |
|---|---|---|
| Houston Black Restaurant Week campaign | Program-level Black-owned attribution and initial listings | [1] |
| Houston Black Restaurant Week, pages 1–6 | Houston-metro names, addresses, subcategories, and linked destinations | [2] [3] [4] [5] [6] [7] |
| Texas Restaurant Association | Hispanic-owned designation and Houston-area restaurant leads | [8] |
| Latin Restaurant Weeks — Houston | Latinx culinary-business campaign framing and Houston leads | [9] |
| Latin Restaurant Weeks — La Fishería | Address, contact, and official-site link corroboration | [10] |
| Latin Restaurant Weeks — Hugo’s | Address, contact, and official-site link corroboration | [11] |
| Latin Restaurant Weeks — Exilio Latin Flair | Address and official-site link corroboration | [12] |

Every candidate has an opened official customer-facing destination. The customer-facing URLs used to validate the candidate set are enumerated below. This table is also a compact provenance check; it is not a statement that all features on a business’s site are continuously available.

| Candidate group | Opened official customer-facing destination URLs |
|---|---|
| Lolo’s; Davis Street; Caribbean Jerk Palace; Dandelion; Esther’s; The Greasy Spoon | [13] [14] [15] [16] [17] [18] |
| Jamaica Pon Di Road; Winsome Prime; MOCA; The Puddery; Güzel Cakes; Kilwins; A’dor Almeda; Juliet | [19] [20] [21] [22] [23] [24] [25] [26] |
| Creole Kitchen; Myst; Moonlight Miso; Creole’s; Privilege; Haii Keii; The Savoy; Doves; Lucille’s | [27] [28] [29] [30] [31] [32] [33] [34] [35] |
| La Fishería; Hugo’s; Exilio Latin Flair | [36] [37] [38] |

## Dedupe and inclusion checks

A within-category check normalized each candidate by operating name and public numbered street address. There are **no duplicate candidate records**. Dandelion appears in the campaign at more than one location; only the opened and explicitly selected **Heights** location is in candidates. A’dor Almeda and the separately held A’dor Kitchen and Cocktail lead have different source-listed addresses and are not merged. The records also retain their source-attributed designation rather than assigning it to unrelated brands or locations.

The held file contains 26 leads. It is not a reject list. It preserves useful source provenance for later verification without turning weak or conflicting evidence into production-ready suggestions. The principal reasons are: one official-site ZIP conflict (Day & Night); only social-media links and no opened official destination; an unverified or third-party destination; a private, mobile, PO-box, or otherwise non-public address; or a linked destination not opened in this research pass. Jamburritos, although sourced by the campaign, was not added to either file because its opened official site says the Pearland location is currently closed.

## Limitations

The source directories are not a census of Houston venues, and campaign membership or directory inclusion may change. Black Restaurant Week and Latin Restaurant Weeks are campaign sources, so their lists can combine current and historical participants. The candidate file preserves explicit campaign and association designations as attribution evidence; it does not independently verify legal ownership, management, certification, alcohol licensing, or an owner’s identity. Some official sites used an ordering or reservation platform, and some source-listed addresses lacked ZIP codes. Those gaps are represented as `null` or as limited source-supported address strings rather than supplemented through geocoding or third-party data.

This is **research-only**. No production database or API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change was performed.

## References

[1]: https://blackrestaurantweeks.com/houston-black-restaurant-week/ "Houston Black Restaurant Week campaign"
[2]: https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/ "Houston Black Restaurant Week directory, page 1"
[3]: https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/2/ "Houston Black Restaurant Week directory, page 2"
[4]: https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/3/ "Houston Black Restaurant Week directory, page 3"
[5]: https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/4/ "Houston Black Restaurant Week directory, page 4"
[6]: https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/5/ "Houston Black Restaurant Week directory, page 5"
[7]: https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/6/ "Houston Black Restaurant Week directory, page 6"
[8]: https://txrestaurant.org/Pub/Pub/Hispanic-Owned-Restaurants-in-Texas.aspx "Texas Restaurant Association: Hispanic-Owned Restaurants in Texas"
[9]: https://latinrestaurantweeks.com/houston-listings/ "Latin Restaurant Weeks: Houston listings"
[10]: https://latinrestaurantweeks.com/lrw-campaigns/united-states/texas/houston/hou-lrw/la-fisheria-2/ "Latin Restaurant Weeks: La Fishería"
[11]: https://latinrestaurantweeks.com/lrw-campaigns/united-states/texas/houston/hou-lrw/hugos/ "Latin Restaurant Weeks: Hugo’s"
[12]: https://latinrestaurantweeks.com/lrw-campaigns/united-states/texas/houston/hou-lrw/exilio-latin-flair/ "Latin Restaurant Weeks: Exilio Latin Flair"
[13]: https://www.loloschickenandwaffleshtx.com/ "Lolo’s Chicken & Waffles HTX official site"
[14]: https://www.davisstreet.com/ "Davis Street official site"
[15]: https://caribbeanjerkpalacetx.com/ "Caribbean Jerk Palace official site"
[16]: http://dandelionhouston.com/ "Dandelion Cafe official site"
[17]: https://www.estherscajunsoul.com/ "Esther’s Cajun Cafe & Soul Food official site"
[18]: https://thegreasyspoonhtx.com/ "The Greasy Spoon official site"
[19]: https://www.jamaicapondiroad.com/ "Jamaica Pon Di Road official site"
[20]: https://www.winsomeprime.com/houston "Winsome Prime Houston official site"
[21]: https://mocahtx.com/moca-restaurant/ "MOCA HTX Restaurant official site"
[22]: https://thepuddery.com/ "The Puddery official site"
[23]: http://www.gcakelovers.com/ "Güzel Cakes official site"
[24]: https://www.kilwins.com/cypress "Kilwins Cypress Towne Lake official site"
[25]: https://adoralmeda.com/ "A’dor Almeda Kitchen & Cocktail official site"
[26]: https://www.juliethtx.com/ "Juliet official site"
[27]: https://creole-kitchen.com/ "Creole Kitchen and Daiquiris official site"
[28]: https://mysthouston.com/ "Myst Lounge & Kitchen official site"
[29]: https://www.moonlightmiso.com/ "Moonlight Miso official site"
[30]: https://creoles.net/ "Creole’s Restaurant & Lounge official site"
[31]: https://privilegehou.com/ "Privilege Rooftop Lounge official site"
[32]: https://www.haiikeii.com/ "Haii Keii official site"
[33]: https://www.thesavoyhtx.com/ "The Savoy official site"
[34]: https://doveshouston.com/ "Doves Restaurant official site"
[35]: https://www.lucilleshouston.net/ "Lucille’s official site"
[36]: https://lafisheriahtx.com/ "La Fishería official site"
[37]: https://www.hugosrestaurant.net/ "Hugo’s official site"
[38]: https://www.exiliolatinflair.com/ "Exilio Latin Flair official site"
