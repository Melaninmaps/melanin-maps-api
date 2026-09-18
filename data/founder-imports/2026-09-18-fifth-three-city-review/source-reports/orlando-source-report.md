# Orlando and Nearby Central Florida — Source-Pass Report

**Scope:** One research-only wave for Orlando and nearby Central Florida communities, Florida. This pass used the African American Chamber of Commerce of Central Florida (AACCCF) public member directory as the primary source and inspected linked official customer destinations before retaining records. The Hispanic Chamber of Metro Orlando was also inspected as a reputable local discovery source, but its public landing-page extraction did not yield individual business details for this pass.

**Status:** Results are **research-only**. Nothing was staged, published, imported, deployed, or written to any public system, account, application, database, repository, or API.

## Results

| Measure | Count |
|---|---:|
| Retained candidates | 8 |
| Held candidates | 5 |
| Distinct inspected public URLs | 36 |
| Exact local duplicates found | 0 |

### Retained by target kind

| targetKind | Count |
|---|---:|
| business | 4 |
| regulated_review | 1 |
| community_resource | 2 |
| cultural_place | 1 |
| online_business | 0 |
| manual_review | 0 |

### Retained by category

| Category | Count |
|---|---:|
| beauty_and_personal_care | 1 |
| food_and_drink | 2 |
| shopping_and_retail | 2 |
| youth_and_mentoring | 1 |
| community_and_civic | 1 |
| arts_and_culture | 1 |

The retained set intentionally spans beauty/personal care, food, shopping, youth entrepreneurship, community support, and a nonprofit cultural place; it is not restaurant-dominant. AACCCF publisher categories that expressly said “African American Owned,” “Minority Owned,” or “Woman Owned” were preserved exactly as **publisher-supplied designations**. A chamber relationship or membership by itself was never converted into an ownership claim.

## Duplicate Check

A feasible exact duplicate check was run over every existing local `*.jsonl` record under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this Orlando output directory. It compared normalized `name + city + state + address` (lowercase, with non-alphanumeric characters removed). **No exact duplicate** of a retained Orlando record was found.

## Held Records

Beautycanbraid LLC is held because the linked purported official destination did not show matching business identity or customer services. Men of Integrity Mentoring Program, Inc. is held because its chamber address conflicts with its official site’s displayed Orlando contact address and Winter Park meeting location. Velvet Bloom is held because the directory exposes a P.O. Box rather than a numbered street address. Tender Beauty is held because the directory supplies only a city and no official customer destination. Hyphen Beauty + Massage School is held because its regulated education/services context lacks a numbered address, official destination, and credentialing information needed for safe promotion.

## Inspected URL Register

Every URL below was opened and inspected; search-result snippets were not used as evidence.

| # | Inspected URL | What it supported or why it was inspected |
|---:|---|---|
| 1 | <https://hispanicchamber.com/directory-of-companies/> | Official Hispanic Chamber directory landing page; it describes a directory of Hispanic-owned businesses in Metro Orlando but exposed no individual listing details in this extraction. |
| 2 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list> | AACCCF Active Member Directory landing page; it identifies the public directory, its categories, and Central Florida coverage. |
| 3 | <https://blackcommerce.org/> | Official AACCCF site; it describes the chamber and its Central Florida service area. |
| 4 | <https://hispanicchamber.com/> | Official Hispanic Chamber of Metro Orlando site; it describes the organization’s Central Florida mission and Hispanic-business network. |
| 5 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Search/african-american-owned-617544> | AACCCF African American Owned category result; it supplied publisher-assigned designations and candidate discovery. |
| 6 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Search/beauty-products-services-639959> | AACCCF Beauty Products & Services results; it supplied candidate discovery and held-record evidence. |
| 7 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Search/arts-culture-entertainment-818749> | AACCCF Arts, Culture & Entertainment results; it supplied cultural-resource discovery. |
| 8 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Search/community-civic-organizations-628795> | AACCCF Community & Civic Organizations results; it supplied community-resource discovery. |
| 9 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Search/food-beverages-628798> | AACCCF Food & Beverages results; it supplied food-business discovery. |
| 10 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Search/retail-644615> | AACCCF Retail results; it supplied retail-business discovery. |
| 11 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Search/tourism-628809> | AACCCF Tourism results; it supplied visitor-life and media discovery, including records not promoted. |
| 12 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Search/education-individuals-628804> | AACCCF Education & Individuals results; it supplied mentoring and education-resource discovery. |
| 13 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/beautycanbraid-llc-4052467> | AACCCF detail page; supported Beautycanbraid’s name, address, phone, link, and publisher designations; record held pending destination confirmation. |
| 14 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/treasuring-tresses-4986099> | AACCCF detail page; supported Treasuring Tresses’ directory identity, address, phone, and publisher designations. |
| 15 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/corwin-s-personal-chef-catering-llc-4648746> | AACCCF detail page; supported Corwin’s directory identity, address, phone, category, and publisher designation. |
| 16 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/smile-ice-cream-company-3952098> | AACCCF detail page; supported SMILE Ice Cream Company’s directory identity, address, phone, categories, official site link, Facebook link, and publisher designations. |
| 17 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/equip2supply-4058132> | AACCCF detail page; supported Equip2Supply’s directory identity, address, retail category, website link, and publisher designations. |
| 18 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/harmony-way-candle-company-4013595> | AACCCF detail page; supported Harmony Way Candle Company’s directory identity, address, phone, categories, site link, and publisher designations. |
| 19 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/black-bee-honey-3952134> | AACCCF detail page; supported Black Bee Honey’s directory identity, address, phone, site link, and food categories. |
| 20 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/black-empowerment-community-council-3952139> | AACCCF detail page; supported the Council’s directory identity, street address, phone, nonprofit/community categories, and official-site link. |
| 21 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/men-of-integrity-mentoring-program-inc-4774333> | AACCCF detail page; supported the program’s directory identity, Apopka address, phone, website link, and publisher designation; record held because its official site conflicts on address. |
| 22 | <https://africanamericanchamberofcommerceofcentralflorida.growthzoneapp.com/list/Details/the-winter-park-playhouse-3952120> | AACCCF detail page; supported the Playhouse’s address, phone, nonprofit/cultural categories, site link, Facebook link, and cultural/nonprofit description. |
| 23 | <http://beautycanbraid.com/> | Linked purported official site inspected; generic cart/thank-you content did not establish matching business identity, so the record was held. |
| 24 | <http://www.treasuringtresses.com/> | Official site inspected; matched Treasuring Tresses’ identity, address, phone, services, and official social links. |
| 25 | <http://corwinscatering.com/> | Official site inspected; matched Corwin’s Catering’s identity and Winter Springs address, stated Black-owned, and linked official Facebook and Instagram pages. |
| 26 | <http://www.smileicecream.co/> | Official site inspected; matched SMILE Ice Cream Company’s identity and Orlando address and linked official Facebook and Instagram pages. |
| 27 | <https://equip2supply.com/> | Official store inspected; supported janitorial, office, and personal-care retail identity and official Facebook/Instagram links. |
| 28 | <https://harmonywaycandles.com/> | Official store inspected; supported candles and soap retail identity and official Facebook/Instagram links. |
| 29 | <https://www.blackbeehoneyhq.com/Home> | Official site inspected; identified Black Bee Honey as a student entrepreneurship program operated by the Orlando Community and Youth Trust, a nonprofit, and linked official social pages. |
| 30 | <http://www.beccouncil.org/> | Official site inspected; identified the Council as an affiliated charitable organization and supplied its community-support context and official social links. |
| 31 | <http://www.moimentoring.com/> | Official site inspected; identified the mentoring program, nonprofit status, social link, Orlando contact address, and Winter Park meeting location; conflict with AACCCF address triggered a hold. |
| 32 | <http://www.winterparkplayhouse.org/> | Official Playhouse site inspected; established a current official cultural-place destination and official Facebook link. |
| 33 | <http://www.winterparkplayhouse.org/contact.html> | Official contact page inspected; matched Winter Park Playhouse’s 711 N. Orange Avenue address and (407) 645-0145 phone number. |
| 34 | <https://equip2supply.com/pages/contact-us> | Official contact page inspected; matched Equip2Supply’s 3564 Avalon Park East Boulevard address and customer phone. |
| 35 | <https://harmonywaycandles.com/pages/about-us-1> | Official about page inspected; identified Harmony Way Candle Company and its retail story; no street address was displayed there. |
| 36 | <https://www.blackbeehoneyhq.com/Contact> | Official contact page inspected; it supplied the official contact route and social links but no numbered street address. |

## Limitations

This is a bounded public-web source pass, not a license, ownership-certification, safety, accessibility, price, hours, availability, operational-status, health-outcome, or credential audit. No protected trait, bilingual ability, ownership status beyond the publisher’s explicit designation, or other unstated attribute was inferred. Official sites were inspected only to establish customer-facing destinations and directly stated identity/location/context; changing facts require re-checking at review time. Physical addresses are retained only where a numbered street address was directly supplied by an inspected source. No coordinates, pins, or directions data were created.
