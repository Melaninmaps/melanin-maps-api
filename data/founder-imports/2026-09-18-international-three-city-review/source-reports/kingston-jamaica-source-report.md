# Kingston, Jamaica Directory Research Wave — Source Report

## Scope and result

This was one bounded, **research-only** Mapping with Melanin international directory source pass for **Kingston and clearly supported Kingston/St Andrew locations in Jamaica**. The output retains **25 candidates** and holds **7 records**. The retained mix includes food, retail, hair/beauty, youth and family support, arts and culture, legal services, recreation, civic services, business support, and public information resources. The sources are primarily Jamaican government, municipal, tourism, nonprofit, cultural, or first-party business/organisation pages.

No Black-, African-, Caribbean-, diaspora-, Latino/Hispanic-, ownership-, language-, license-, or other protected-trait designation was inferred. Where a source explicitly used cultural or organisational wording, that limited wording is quoted or attributed in the relevant `ownershipEvidence` or `notes` field. The record set makes no assertion of current operating status, availability, price, accessibility, language fluency, licences, credentials, or ownership certification.

## Output summary

| Measure | Count |
|---|---:|
| Retained candidates | 25 |
| Held candidates | 7 |
| Inspected URLs | 62 |
| Exact duplicates against prior research JSONL | 0 |
| Retained `business` records | 7 |
| Retained `cultural_place` records | 7 |
| Retained `community_resource` records | 8 |
| Retained `regulated_review` records | 3 |

| Retained category | Count |
|---|---:|
| Arts and culture | 8 |
| Community resources | 6 |
| Education | 1 |
| Food and drink | 4 |
| Retail | 3 |
| Recreation | 1 |
| Beauty and personal care | 1 |
| Professional services | 1 |

## Jamaica address and geography treatment

Jamaican address forms were preserved as published. The records use street/building, locality and Jamaican postal-zone forms such as **Kingston 5**, **Kingston 6**, and **Kingston 10** where a source supplied them. No U.S. state, ZIP code, coordinate, map pin, or U.S.-specific geocoding convention was imposed. `state` is null unless a source explicitly supplied a supported parish/region. Hope Botanical Gardens is held with `state: "St Andrew"` because the Jamaica Tourism Board explicitly locates it in urban St Andrew within the Kingston metropolitan region, but the inspected evidence did not provide a physical street/building address.

Commercial records were retained only when a public source supplied a non-conflicting physical street/building address and a separately inspected official website or official business-social destination. Cultural places and community resources remain distinct `cultural_place` or `community_resource` targets and are not labelled as commercial map pins. Beauty, legal, and credentialing education records are deliberately routed to `regulated_review`; this is a reviewer-routing label, **not** a certification of licence, accreditation, or qualification.

## Deduplication

Before writing, every existing `*.jsonl` record under `/home/ubuntu/directory-research-wave-2026-09-18/` was compared while excluding this output directory. The normalized comparison key was **name + city + state/province/parish + country + address**, with case, punctuation, whitespace, and common address-token variation normalised. The scan covered **2,863 parsable prior records across 70 JSONL files**. No exact Jamaica/Kingston match was found, and no exact duplicate key exists within the retained output.

## Inspected sources and disposition

The table enumerates every URL opened or attempted during the pass. “Retained evidence” means it contributed to a retained record or corroborated it; “held evidence” means it established a reason not to promote the candidate. The five hostname-resolution attempts are recorded for completeness.

| # | Inspected URL | Evidence disposition |
|---:|---|---|
| 1 | [Jamaica Tourism Board — Kingston guide][1] | Context / discovery; retained cultural-place context. |
| 2 | [Bob Marley Museum official website][2] | Retained evidence; official museum identity and visitor-facing destination. |
| 3 | [National Gallery of Jamaica official website][3] | Retained evidence; current gallery programming and identity. |
| 4 | [Kingston Creative official projects page][4] | Retained evidence; nonprofit identity, address, programmes. |
| 5 | [Liberty Hall official contact page][5] | Retained evidence; address and project affiliation. |
| 6 | [Devon House official visitor page][6] | Retained evidence; visitor identity, historic context, address. |
| 7 | [Sweetwood Jerk Joint official Facebook page][7] | Retained evidence; customer-facing official social destination. |
| 8 | [Institute of Jamaica official website][8] | Retained evidence; cultural institution identity and address. |
| 9 | [Hope Zoo Jamaica website][9] | Inspection attempt could not resolve public hostname; no record retained. |
| 10 | [Bookophilia website][10] | Inspection attempt could not resolve public hostname; no record retained. |
| 11 | [Kingston and St. Andrew Municipal Corporation restaurant directory][11] | Retained discovery for M10 and Chilitos; held discovery for six records with gaps or mismatches. |
| 12 | [Bookophilia official Instagram profile][12] | Retained evidence; customer-facing bookstore/cafe profile. |
| 13 | [Kingston Creative — Artisan Collective Store][13] | Retained evidence; retail purpose, Kingston location and contact. |
| 14 | [Jamaica Cultural Development Commission official website][14] | Retained evidence; address and cultural-agency contact. |
| 15 | [Jamaica Chamber of Commerce privacy page][15] | Supplementary retained address/context evidence. |
| 16 | [National Museum Jamaica official contact page][16] | Retained evidence; address and contact. |
| 17 | [YouthJamaica official website][17] | Retained evidence; youth-resource programme context and Ministry contact. |
| 18 | [Kingston and St. Andrew Municipal Corporation official contact page][18] | Retained evidence; municipal-resource address and contact. |
| 19 | [Jamaica Tourism Board — Devon House][19] | Retained evidence; numbered address and historic-site description. |
| 20 | [Purported Jojo’s Jerk Pit website][20] | Held evidence; inspected destination is unrelated online gambling content. |
| 21 | [Broken Plate Jamaica official website][21] | Held evidence; conflicts with municipal-directory address. |
| 22 | [Chillin’ Restaurant official website][22] | Held evidence; conflicts with municipal-directory address. |
| 23 | [Purported Tea Tree Creperie website][23] | Held evidence; inspected destination is unrelated online gambling content. |
| 24 | [Cafe Blue official website][24] | Held evidence; inspected official site did not provide a numbered address for the Sovereign Centre branch. |
| 25 | [One Hundred official website][25] | Retained evidence; restaurant/entertainment identity and address. |
| 26 | [Chilitos Jamexican Restaurant official website][26] | Retained evidence; address, food description and social links. |
| 27 | [Purported Pastry Passions website][27] | Held evidence; parked domain-for-sale destination. |
| 28 | [Jamaica Tourism Board — Bob Marley Museum][28] | Retained evidence; address and cultural-place description. |
| 29 | [Jamaica Tourism Board — National Gallery of Jamaica][29] | Retained evidence; destination corroboration. |
| 30 | [Bob Marley Museum official Instagram profile][30] | Retained evidence; current customer-facing museum profile and address corroboration. |
| 31 | [M10 Bar and Grill official Facebook page][31] | Retained evidence; official bar-and-grill customer-facing destination. |
| 32 | [Things Jamaican Shopping official Facebook page][32] | Retained evidence; retail identity, address, phone. |
| 33 | [Jamaica Tourism Board — Hope Botanical Gardens][33] | Held evidence; clearly supports urban St Andrew but lacks street/building address. |
| 34 | [Jamaica National Heritage Trust — Parks and Botanical Gardens][34] | Supplementary context; confirms Hope Gardens is in Kingston/St Andrew area. |
| 35 | [Roots FM Jamaica][35] | Inspected; extraction returned no readable content; no record retained. |
| 36 | [Edna Manley College official website][36] | Retained regulated-review evidence; address and educational-programme identity. |
| 37 | [University of the West Indies Mona contact page][37] | Inspected; extraction returned no readable content; no record retained. |
| 38 | [Jamaica Library Service official website][38] | Retained evidence; public-library network context. |
| 39 | [Cafe Blue Jamaica official Instagram profile][39] | Held evidence; official profile inspected but no numbered Sovereign Centre branch address extracted. |
| 40 | [Jamaica Chamber of Commerce official contact page][40] | Retained evidence; address and contact. |
| 41 | [National Gallery of Jamaica official contact page][41] | Retained evidence; official address and contact. |
| 42 | [Liberty Hall official website][42] | Retained evidence; museum, African-diaspora research context and youth programme descriptions. |
| 43 | [Jamaica Library Service official contact page][43] | Retained evidence; headquarters street address, public-library role. |
| 44 | [Kingston and St. Andrew Municipal Corporation official website][44] | Retained evidence; municipal mission and jurisdiction context. |
| 45 | [Jamaica Chamber of Commerce official history page][45] | Retained evidence; business-association role. |
| 46 | [Jamaica Cultural Development Commission official about page][46] | Retained evidence; government cultural-agency role. |
| 47 | [National Museum Jamaica official website][47] | Retained evidence; national-museum purpose and address corroboration. |
| 48 | [The Artisan Collective Store official Instagram profile][48] | Retained evidence; Shop 2 / 12 Ocean Boulevard address corroboration. |
| 49 | [Bookophilia official Facebook page][49] | Retained evidence; bookstore/cafe identity, address and phone. |
| 50 | [Kingston and St. Andrew Municipal Corporation — Emancipation Park][50] | Retained evidence; official attraction context, cross-street address, phone. |
| 51 | [Jamaica Travel and Culture — Sweetwood Jerk Joint][51] | Retained evidence; numbered address, phone, and restaurant description. |
| 52 | [Kurly Kulture official website][52] | Retained regulated-review evidence; salon address and service descriptions. |
| 53 | [Myers, Fletcher & Gordon official website][53] | Retained regulated-review evidence; law-firm identity and practice areas. |
| 54 | [Support Jamaica official contact page][54] | Retained evidence; community-resource address. |
| 55 | [YouthJamaica official Facebook page][55] | Retained evidence; official youth-centres statement and address. |
| 56 | [Jamaica Business Development Corporation official contact page][56] | Retained evidence; Kingston office address. |
| 57 | [Emancipation Park official website][57] | Retained supplementary official destination inspection. |
| 58 | [Myers, Fletcher & Gordon official contact page][58] | Retained evidence; 21 East Street address. |
| 59 | [Jamaica Business Development Corporation official website][59] | Retained evidence; entrepreneurship-support services. |
| 60 | [National Youth Service website][60] | Inspection attempt could not resolve public hostname; no record retained. |
| 61 | [YMCA of Jamaica website][61] | Inspection attempt could not resolve public hostname; no record retained. |
| 62 | [Jamaican Foundation for Lifelong Learning website][62] | Inspection attempt could not resolve public hostname; no record retained. |

## Held candidates

| Source row | Candidate | Reason held |
|---|---|---|
| KJM-H01 | Jojo’s Jerk Pit | The municipal directory supplies name, address and a purported website, but the inspected jojojerkpit.com destination is an unrelated online-casino website. The customer-facing destination is therefore mismatched. |
| KJM-H02 | Broken Plate Jamaica | the municipal directory lists 14 Canberra Crescent, Kingston 6, while the inspected official website lists 24–28 Barbican Road. Address facts conflict, so the record is not retained. |
| KJM-H03 | Chillin’ Restaurant | the municipal directory lists Gibson Close, Hope Zoo, Kingston, while the inspected official restaurant website lists 3 Musgrave Avenue, Kingston. Address facts conflict, so the record is not retained. |
| KJM-H04 | Tea Tree Creperie | the municipal directory supplies an address and purported website, but the inspected teatreecreperie.com site is an unrelated online-gambling destination. The customer-facing destination is mismatched. |
| KJM-H05 | Pastry Passions | the municipal directory supplies an address and purported website, but the inspected pastrypassions.com destination is a parked domain-for-sale page. The customer-facing destination is inaccessible/mismatched. |
| KJM-H06 | Cafe Blue | municipal directory provides only “Sovereign Centre, Kingston,” and the inspected official website and official Instagram do not supply a numbered physical street/building address for this branch. It is not established as online-only. |
| KJM-H07 | Hope Botanical Gardens | the Jamaica Tourism Board clearly places the gardens in urban St Andrew in the Kingston metropolitan region, but its inspected listing does not provide a reliable physical street/building address. No city or address was invented. |

## Limitations and research-only boundary

This is a time-bounded discovery and verification pass rather than a claim of exhaustiveness. A public directory, destination guide, government page, or official social account was used only for facts it visibly stated. A first-party destination was independently opened before a record was retained. Contradictory addresses were held even when an official site offered a plausible newer address. Parked, hijacked, unrelated, inaccessible, or non-resolving destinations were not accepted as valid business destinations.

**No production database, API, map, coordinate service, account, login, user record, payment process, publication endpoint, deployment action, or external system was created, modified, or called for publication.** The pass only read publicly accessible web pages and wrote local UTF-8 JSONL and Markdown research artifacts.

## References

[1]: https://www.visitjamaica.com/resort-areas/kingston/ "Jamaica Tourism Board — Kingston guide"
[2]: https://www.bobmarleymuseum.com/ "Bob Marley Museum official website"
[3]: https://nationalgalleryofjamaica.wordpress.com/ "National Gallery of Jamaica official website"
[4]: https://kingstoncreative.org/projects/ "Kingston Creative official projects page"
[5]: https://libertyhall-ioj.org.jm/contact-us/ "Liberty Hall official contact page"
[6]: https://www.devonhouseja.com/things-to-do "Devon House official visitor page"
[7]: https://www.facebook.com/sweetwoodjerkjoint/ "Sweetwood Jerk Joint official Facebook page"
[8]: https://instituteofjamaica.org.jm/ "Institute of Jamaica official website"
[9]: https://hopezooja.com/ "Hope Zoo Jamaica website"
[10]: https://bookophilia.com/ "Bookophilia website"
[11]: https://www.ksamc.gov.jm/restaurants "Kingston and St. Andrew Municipal Corporation restaurant directory"
[12]: https://www.instagram.com/bookophilia/ "Bookophilia official Instagram profile"
[13]: https://kingstoncreative.org/artisan-collective-store-project/ "Kingston Creative — Artisan Collective Store"
[14]: https://jcdc.gov.jm/ "Jamaica Cultural Development Commission official website"
[15]: https://jamaicachamber.org.jm/privacy-policy-2/ "Jamaica Chamber of Commerce privacy page"
[16]: https://museums-ioj.org.jm/contact/ "National Museum Jamaica official contact page"
[17]: https://youthjamaica.gov.jm/ "YouthJamaica official website"
[18]: https://www.ksamc.gov.jm/contact-us "Kingston and St. Andrew Municipal Corporation official contact page"
[19]: https://www.visitjamaica.com/listing/devon-house-development-limited/25/ "Jamaica Tourism Board — Devon House"
[20]: http://jojosjerkpit.com "Purported Jojo’s Jerk Pit website"
[21]: https://brokenplatejamaica.com "Broken Plate Jamaica official website"
[22]: https://chillinrestaurant.com "Chillin’ Restaurant official website"
[23]: https://teatreecreperie.com "Purported Tea Tree Creperie website"
[24]: https://cafeblue.com "Cafe Blue official website"
[25]: https://onehundredja.com "One Hundred official website"
[26]: https://www.chilitosjamexican.com "Chilitos Jamexican Restaurant official website"
[27]: https://pastrypassions.com "Purported Pastry Passions website"
[28]: https://www.visitjamaica.com/listing/bob-marley-museum-ltd/6/ "Jamaica Tourism Board — Bob Marley Museum"
[29]: https://www.visitjamaica.com/listing/national-gallery-of-jamaica/2313/ "Jamaica Tourism Board — National Gallery of Jamaica"
[30]: https://www.instagram.com/bobmarleymuseum/ "Bob Marley Museum official Instagram profile"
[31]: https://www.facebook.com/M10BarAndGrill/ "M10 Bar and Grill official Facebook page"
[32]: https://www.facebook.com/ThingsJamaicanshopping/ "Things Jamaican Shopping official Facebook page"
[33]: https://www.visitjamaica.com/listing/hope-botanical-gardens/432/ "Jamaica Tourism Board — Hope Botanical Gardens"
[34]: http://www.jnht.com/parks_gardens.php "Jamaica National Heritage Trust — Parks and Botanical Gardens"
[35]: https://www.rootsfmja.com/ "Roots FM Jamaica"
[36]: https://emc.edu.jm/ "Edna Manley College official website"
[37]: https://www.mona.uwi.edu/contact-us "University of the West Indies Mona contact page"
[38]: https://www.jls.gov.jm/ "Jamaica Library Service official website"
[39]: https://www.instagram.com/cafeblueja/ "Cafe Blue Jamaica official Instagram profile"
[40]: https://jamaicachamber.org.jm/contact/ "Jamaica Chamber of Commerce official contact page"
[41]: https://nationalgalleryofjamaica.wordpress.com/contact-us/ "National Gallery of Jamaica official contact page"
[42]: https://libertyhall-ioj.org.jm/ "Liberty Hall official website"
[43]: https://www.jls.gov.jm/contact-us/ "Jamaica Library Service official contact page"
[44]: https://www.ksamc.gov.jm/ "Kingston and St. Andrew Municipal Corporation official website"
[45]: https://jamaicachamber.org.jm/history/ "Jamaica Chamber of Commerce official history page"
[46]: https://jcdc.gov.jm/about-us "Jamaica Cultural Development Commission official about page"
[47]: https://museums-ioj.org.jm/ "National Museum Jamaica official website"
[48]: https://www.instagram.com/artisanstorekc/ "The Artisan Collective Store official Instagram profile"
[49]: https://www.facebook.com/Bookophilia/ "Bookophilia official Facebook page"
[50]: https://www.ksamc.gov.jm/attractions/emancipation-park "Kingston and St. Andrew Municipal Corporation — Emancipation Park"
[51]: https://jamaicatravelandculture.com/destinations/kingston/sweetwood-jerk-joint.htm "Jamaica Travel and Culture — Sweetwood Jerk Joint"
[52]: https://www.kurlykultureltd.com/ "Kurly Kulture official website"
[53]: https://myersfletcher.com/ "Myers, Fletcher & Gordon official website"
[54]: https://supportjamaica.gov.jm/contact-us "Support Jamaica official contact page"
[55]: https://www.facebook.com/youthja/ "YouthJamaica official Facebook page"
[56]: https://jbdc.net/contact-us/ "Jamaica Business Development Corporation official contact page"
[57]: http://www.emancipationpark.org.jm/ "Emancipation Park official website"
[58]: https://myersfletcher.com/contact-us/ "Myers, Fletcher & Gordon official contact page"
[59]: https://jbdc.net/ "Jamaica Business Development Corporation official website"
[60]: https://nys.gov.jm/ "National Youth Service website"
[61]: https://www.ymcaofjamaica.org/ "YMCA of Jamaica website"
[62]: https://jfll.gov.jm/ "Jamaican Foundation for Lifelong Learning website"
