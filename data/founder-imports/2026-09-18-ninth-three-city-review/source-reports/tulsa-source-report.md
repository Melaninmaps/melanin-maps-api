# Tulsa and Nearby Oklahoma Communities — Source Report

## Scope and method

This **research-only** source pass covers Tulsa and the immediately nearby Oklahoma context identified in the assignment. It uses public tourism/editorial directory pages, the public Tulsa Area Hispanic Chamber of Commerce directory, and official customer-facing or public-service destinations. Every URL below was opened and inspected; search-result snippets were not used as evidence. Records were retained only where a public source URL, an official customer-facing website or official social destination, and—where applicable—a numbered physical street address were available. No coordinates, pins, directions data, or inferred protected traits were created.

A feasible exact-duplicate check was performed against all pre-existing `*.jsonl` research files under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this newly written Tulsa output directory. The comparison normalized Unicode/accents, case, punctuation, and whitespace over **name + city + state + address**. None of the six retained rows duplicated a pre-existing local research row; no duplicate tuples occur within the retained output.

## Results

| Measure | Count |
|---|---:|
| Retained candidates | 6 |
| Held candidates | 6 |
| Inspected public URLs | 25 |
| URLs yielding inspectable page content | 23 |
| URLs blocked or inaccessible to the text inspector | 2 |

| Retained target kind | Count |
|---|---:|
| `business` | 4 |
| `cultural_place` | 1 |
| `community_resource` | 1 |

| Retained category | Count |
|---|---:|
| `food_and_drink` | 1 |
| `retail_shopping` | 2 |
| `grocery` | 1 |
| `arts_culture_history` | 1 |
| `community_services` | 1 |

The retained set is intentionally not restaurant-heavy. It includes a Caribbean restaurant, two retail businesses, a grocery store, a cultural history center, and a business-community resource. Three records preserve Visit Tulsa’s direct editorial Black-owned designation. Chamber-listed records are included on the basis of public chamber membership, **not** as an inference or certification of protected-trait ownership; the sole retained chamber-member business also has a first-party locally-owned statement. The chamber itself is retained as a community resource based on its own stated identity and public directory/service destination.

## Inspected URLs and source support

| # | URL inspected | Publisher / type | Result and use |
|---:|---|---|---|
| 1 | <https://www.visittulsa.com/black-history/black-owned-businesses/> | Visit Tulsa editorial tourism guide | Inspected successfully. Directly frames the named guide as Black-owned businesses in Tulsa and names Sisserou’s, Silhouette, Poppi’s, Black Wall Street Tees, and Umberto’s. Used only for its supplied editorial designation. |
| 2 | <https://www.greenwoodculturalcenter.org/> | Greenwood Cultural Center official site | Inspected successfully. Gives mission, 322 North Greenwood Ave contact, official social links, and expressly reports the facility closed for renovations. Held for current-status closure. |
| 3 | <https://tulsahispanicchamber.wildapricot.org/> | Tulsa Area Hispanic Chamber official public site | Inspected successfully. Gives public directory, official social links, and 2160 S Garnett Rd. Supports the retained community resource. |
| 4 | <https://www.visittulsa.com/listing/sisserous-caribbean-restaurant-%26-catering/857/> | Visit Tulsa listing | Inspected successfully. Tourism listing for Sisserou’s; paired with the official restaurant site and the guide in item 1. |
| 5 | <https://www.visittulsa.com/listing/umbertos/296/> | Visit Tulsa listing | Inspected successfully. Gives 3147 S Harvard Ave, phone, and pizza description. Held because an official business destination was not independently verified. |
| 6 | <https://www.visittulsa.com/listing/silhouette-sneakers-%26-art/1919/> | Visit Tulsa listing | Inspected successfully. Gives 10 N Greenwood Ave C, phone, and retail/art description; paired with items 1 and 14. |
| 7 | <https://www.visittulsa.com/listing/poppis-spa-%26-lounge/1719/> | Visit Tulsa listing | Inspected successfully. Gives address, phone, spa description; paired with item 1 and official source in item 15. Held as regulated-service-insufficient. |
| 8 | <https://www.visittulsa.com/listing/black-wall-street-tees-%26-souvenirs/2406/> | Visit Tulsa listing | Inspected successfully. Gives 101 North Greenwood Ave and retail description; paired with items 1 and 16. |
| 9 | <https://tulsahispanicchamber.wildapricot.org/Sys/PublicProfile/84598064/7170577> | Chamber member profile | Inspected successfully. Lists Oasis Fresh Market as a food-market member at 1725 N Peoria Ave with phone. Paired with official item 17. |
| 10 | <https://tulsahispanicchamber.wildapricot.org/Sys/PublicProfile/96503881/7170577> | Chamber member profile | Inspected successfully. Lists MHS Commercial Cleaning details but conflicts with official item 21 and has a city typo. Held. |
| 11 | <https://tulsahispanicchamber.wildapricot.org/Sys/PublicProfile/76480723/7170577> | Chamber member profile | Inspected successfully. Lists Cell City details and membership. Paired with official item 19; phone conflicts, so held. |
| 12 | <https://tulsahispanicchamber.wildapricot.org/Sys/PublicProfile/94332094/7170577> | Chamber member profile | Inspected successfully. Lists 918Maples membership, address, and phone. Paired with official items 20 and 22; phone conflicts, so held. |
| 13 | <https://sisserousrestaurant.com/> | Sisserou’s official restaurant site | Inspected successfully. Confirms customer ordering, reservation/catering paths, 107 North Boulder Avenue Unit C, phone, and official Facebook/Instagram. Supports retained Sisserou’s. |
| 14 | <https://www.silhouettetulsa.com/> | Silhouette official store | Inspected successfully. Provides a customer-facing shop and confirms 10 N Greenwood Ave Suite C. Supports retained Silhouette. |
| 15 | <https://www.tulsapoppi.com/> | Poppi’s official spa site | Inspected successfully. Provides booking, official socials, address, phone, and describes massage/skin/body services. Supports the regulated-service hold. |
| 16 | <https://bwstees.com/> | Black Wall Street Tees official shop | Inspected successfully. Customer-facing store offers apparel and souvenirs. Supports the official destination for retained Black Wall Street Tees. |
| 17 | <https://www.oasisfreshmarkets.net/> | Oasis Fresh Market official site | Inspected successfully. Confirms customer shopping/order destination, 1725 N Peoria Ave, phone, owner/local-ownership statement, and official Instagram/Facebook. Supports retained Oasis. |
| 18 | <https://www.greenwoodrising.org/visit> | Greenwood Rising official visitor page | Inspected successfully. Provides ticketing, location at 23 North Greenwood Avenue, phone, official socials, and Black Wall Street History Center visitor context. Supports retained Greenwood Rising. |
| 19 | <https://www.cellcityshop.com/s/store-locator> | Cell City official store locator | Inspected successfully. Confirms the 10662 E 31st St location, current public store phone, local-ownership statement, and official socials. Its phone conflicts with item 11; held. |
| 20 | <https://www.918maples.com/> | 918Maples official site | Inspected successfully. Public restaurant location navigation and official social links. Paired with item 22 for the exact Studio Row address; held for phone conflict. |
| 21 | <https://www.mhstulsacleaning.com/> | MHS official service site | Inspected successfully. Provides a customer assessment destination and a different phone, but no numbered street address; held. |
| 22 | <https://www.918maples.com/stuidiorow> | 918Maples official Studio Row page | Inspected successfully. Confirms customer menu/order destination, 317 South Trenton Avenue Suite A, and a phone conflicting with item 12; held. |
| 23 | <https://bwstees.com/pages/contact> | Black Wall Street Tees official contact page | Inspected successfully. It offers a customer contact form, but no independent address or phone. The retained address comes only from item 8. |
| 24 | <https://historicgreenwooddistrict.com/business/silhouette-sneakers-art/> | Historic Greenwood District directory | Open attempt returned HTTP 403. Not used as evidence. |
| 25 | <https://historicgreenwooddistrict.com/business/black-wall-street-tees-souvenirs/> | Historic Greenwood District directory | Open attempt reached a cookie/security interstitial. Not used as evidence. |

## Holds and limitations

Six records are deliberately held rather than promoted. Poppi’s is a `regulated_review` hold because its official site describes massage services but the inspected pages did not establish sufficient current provider/license details. Umberto’s lacked an independently inspected official customer destination. Cell City and 918Maples have source-to-source phone conflicts. MHS has both contact/address conflicts and lacks a resolved numbered street address on its current official customer-facing site. Greenwood Cultural Center’s own site explicitly says the facility is closed for renovations.

This is a finite public-web source pass, not a certification, endorsement, ownership audit, licensing verification, or operational-status guarantee. Public pages can change. The source records avoid inferring racial, ethnic, language, bilingual, service, pricing, hour, availability, accessibility, licensing, health-outcome, or geographic attributes beyond what is directly supplied. No source result was treated as proof solely from a search snippet.

**Research-only: this wave was not staged, not published, not deployed, and made no external writes.**
