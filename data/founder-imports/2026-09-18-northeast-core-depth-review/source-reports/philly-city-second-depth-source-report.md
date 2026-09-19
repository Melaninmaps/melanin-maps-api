# Philadelphia city — second-depth Mapping with Melanin research report

**Prepared by Manus AI — 2026-09-18.** This is a **review-only, Philadelphia-city** research package. It retains **25 evidence-complete candidates** and holds **3 leads**. It does not aim to fill the maximum of 90. Every retained row has a name, category, public directory record, inspected official customer-facing site or official business-social destination, and a publicly supported numbered Philadelphia street address. No latitude, longitude, geocode, map pin, or operational action appears in the output.

## Result

The retained set broadens coverage beyond the source families used in the earlier Philadelphia passes. Its evidence comes principally from public business-improvement or neighborhood directory families: Northern Liberties, South Street Headhouse District, Chestnut Hill Business District, Manayunk Development Corporation, Old City District, and Good Things PHL. West Philadelphia and Northeast Philadelphia source families were inspected as requested but did not yield additional evidence-complete records in this pass. The candidate collection spans **12 everyday-need categories** and is deliberately not restaurant-led.

| Dataset | Count |
|---|---:|
| Retained candidates | 25 |
| Held candidates | 3 |
| Physical businesses | 16 |
| Regulated-review leads | 9 |
| Online-only businesses | 0 |
| Community resources | 0 |
| Cultural places | 0 |

| Retained category | Count |
|---|---:|
| Retail | 8 |
| Beauty/personal care | 3 |
| Healthcare | 4 |
| Legal services | 1 |
| Childcare/family | 1 |
| Laundry/cleaning | 1 |
| Trades/home services | 1 |
| Retail/garden | 1 |
| Recreation/fitness | 1 |
| Business services | 1 |
| Pet care/retail | 1 |
| Grocer | 1 |

The category coverage therefore includes **retail, beauty, healthcare, legal, childcare, laundry, trades, garden, recreation, business services, pet care, and grocery**. Records offering health care, childcare, legal services, physical therapy, chiropractic, dental care, tattooing, or cosmetology-related services are explicitly routed to `regulated_review`. That routing is not a statement that any licensure, authorization, credential, safety, quality, scope, availability, or outcome has been verified.

## Source-family coverage

The following public source families were inspected. Search-result snippets were used only to locate pages; no candidate rests on a snippet.

| Source family and city coverage | Listing-level source reviewed | Outcome |
|---|---|---|
| Good Things PHL, citywide/South Philadelphia | [Places directory][1], Aiyah, Forbidden Closet, and Fruitcake profiles [2] [3] [4] | 2 retained; 1 held for no numbered public location. |
| South Street Headhouse District, South Philadelphia | [Directory][5] and [services route][6] | 10 retained and 2 held/secondary checks. |
| Northern Liberties BID, North Philadelphia | [Directory][7] | 7 retained. |
| Chestnut Hill Business District, Northwest/North Philadelphia | [Directory][8] and individual member profiles [9] [10] [11] | 4 retained. |
| Manayunk Development Corporation, Northwest/West edge | [Directory][12] | 3 retained. Individual record URLs were also attempted, but their extracted content was only a newsletter form. |
| Old City District, central/east Philadelphia | [Directory][13] and individual records [14] [15] [16] | 2 retained; 1 held. |
| TECCDC 52nd Street directory, West Philadelphia | [Directory landing][17] | Checked; it states that its digital map is “Coming Soon,” so it yielded no listing-level records. |
| University City District, West Philadelphia | [Local Business Guide][18] | Checked; its map is interactive and did not expose usable individual listing records in the public extraction. |
| South Philadelphia Business Association | [Association directory landing][19] | Checked; the linked member directory was dynamic and did not expose usable public listing-level records in extraction. |
| Mayfair BID, Northeast Philadelphia | [BID home][20] and linked directory-PDF endpoint [21] | Checked; the landing page describes a 300+ business corridor, but the linked older PDF endpoint returned 404. No record was used. |
| Northeast Philly Online, Northeast Philadelphia | [Business directory][22] | Checked; its category structure and listing architecture were read. No additional evidence-complete nonduplicate record was carried forward in the available time. |

## Retained-record disposition

Each row below has a record-level public source URL and an inspected customer destination in `candidates.jsonl`. The table is a concise audit index; the JSONL remains the controlling row-level evidence file.

| Source family | Retained names | Disposition |
|---|---|---|
| Good Things PHL | Aiyah; Forbidden Closet Vintage | Physical retail candidates. Aiyah’s official site corroborates the Fairmount Avenue location. Forbidden Closet’s directory profile supplies the numbered address and its inspected official e-commerce destination identifies active retail. |
| Chestnut Hill Business District | 50 Watts Books; Artisans on the Avenue; AskAliesh Skin Care Studio; Benedum Law | Two physical retailers, one cosmetology/esthetic lead routed to `regulated_review`, and one legal lead routed to `regulated_review`. The official social/customer destinations corroborate the published locations. |
| Northern Liberties BID | Any Garment Cleaners; Bell Floor Covering; City Planter; Creep Records; AKWD Preschool; Denteek | Four physical retail/service candidates and two regulated-review leads (childcare and dental). The Creep directory address of 606 N. 2nd is expanded—not contradicted—by the official 606–608 N. 2nd address. |
| Manayunk Development Corporation | Action Karate Manayunk; Heart Strong Chiropractic at Active Care; Aliza Schlabach Photography | Physical recreation and creative-service candidates plus a chiropractic `regulated_review` lead. Official sites corroborate their Main Street, Cresson Street, and Silverwood Street locations. |
| South Street Headhouse District | 20/20 Visual Media; Ac’Cent On Animals; Bario Neal; Essene Market & Café; Bonita Studio & Spa; Body Graphics South Street; 3 Dimensional Physical Therapy Old City; Bralow Medical Group | Three physical-business candidates, one grocer, and five regulated-review leads. Essene’s official business Facebook page, rather than its website verification-interstitial, corroborates the directory’s location. Bralow’s source and official site agree on the numbered address, but show different final phone digits; only the official-site phone is emitted. |
| Old City District | A Four Foot Prune; AA Abrasives, Inc. | Physical retail candidates. AA Abrasives’ official destination identifies the company and products but does not repeat the address, so the address remains sourced to the inspected Old City individual record without a conflicting public address found. |

The only retained ownership/designation information is for **Aiyah**. The Good Things PHL profile labels it “AAPI-owned” and “Woman-owned”; that wording is attributed in its `ownershipEvidence` and is not independently inferred. No protected trait, culture, language, ownership, license, or other sensitive attribute is inferred from business names, neighborhoods, services, imagery, or social accounts.

## Held-record disposition

| Name | Source family | Reason held |
|---|---|---|
| Brown Skin Studio | South Street Headhouse District | The directory supplies a numbered address and site, but the purported official domain displayed a parked GoDaddy page. It was not retained without a usable official customer destination. |
| 3rd Street Hardware | Old City District | The individual listing supplies address, phone, category, and a linked official domain, but the official domain yielded no extractable customer-facing content on inspection. |
| Fruitcake Floral Studio | Good Things PHL | The individual profile and official site were inspected, but neither public source supplied a numbered Philadelphia street address. |

## Deduplication

Before emission, all JSONL files beneath `/home/ubuntu/directory-research-wave-2026-09-18/` were parsed, excluding only this output folder. The comparison used a normalized **name + city + state + country + address** tuple: values were lowercased, punctuation and spacing were stripped, ampersands were harmonized, common entity suffixes were removed, and common street-type forms were normalized. A conservative same-name screen was also run across every prospective retained and held record, including rows with incomplete historical addresses. No exact normalized prior-package match or same-name match was re-added. Uncertain same-name or same-address records were not merged.

The second-depth candidate addresses are public directory/official-destination evidence only. No geocoding or coordinate enrichment was performed. If a directory and official page showed a non-address discrepancy, the row states it directly rather than resolving it by inference. This affected the Bralow phone number and does not affect its corroborated street address.

## Complete inspection ledger

Every URL below was opened, fetched, or attempted in this pass. “Held” and “not used” indicate research disposition only; neither is a conclusion about closure, quality, safety, current availability, or legal status.

### Directory and organization pages

| URL | Source family | Inspection result |
|---|---|---|
| [https://southphiladelphiabusinessassociation.com/][19] | South Philadelphia Business Association | Opened; dynamic member route not usable for records. |
| [https://southstreet.com/directory/][5] | South Street Headhouse District | Opened; directory listing evidence used. |
| [https://southstreet.com/directory/?category=service][6] | South Street Headhouse District | Opened; services listing evidence used. |
| [https://teccdc.com/community/52-st-business-directory][17] | TECCDC, West Philadelphia | Opened; page says directory is coming soon. |
| [https://mayfairphilly.com/][20] | Mayfair BID, Northeast Philadelphia | Opened; source family reviewed. |
| [https://mayfairphilly.com/wp-content/uploads/2019/04/Mayfair-Directory-Single-View.pdf][21] | Mayfair BID | Attempted; 404, not used. |
| [https://www.explorenorthernliberties.org/home/directory/][7] | Northern Liberties BID | Opened; listing evidence used. |
| [https://chestnuthillpa.com/business-directory/][23] | Chestnut Hill Business District | Opened; endpoint did not expose listings. |
| [https://chestnuthillpa.com/directory/][8] | Chestnut Hill Business District | Opened; listing and profile routes identified. |
| [https://www.goodthingsphl.com/places][1] | Good Things PHL | Opened; individual profiles identified. |
| [https://www.universitycity.org/businessguide/][18] | University City District, West Philadelphia | Opened; interactive map did not expose record-level public text. |
| [https://www.oldcitydistrict.org/directory][13] | Old City District | Opened; individual records identified. |
| [https://manayunk.com/manayunk-business-directory/][12] | Manayunk Development Corporation | Opened; listing evidence used. |
| [https://nephillyonline.com/listing][22] | Northeast Philly Online | Opened; category and listing architecture reviewed. |

### Individual public-directory records and official customer destinations

| URL | Disposition |
|---|---|
| [https://goodthingsphl.com/place/aiyah][2] | Opened; retained Aiyah listing. |
| [https://shopaiyah.com/][24] | Opened; retained Aiyah official store destination. |
| [https://chestnuthillpa.com/profile/50watt76/][25] | Opened; retained 50 Watts Books listing. |
| [https://50watts.com/][26] | Opened; retained official business site. |
| [https://www.instagram.com/50wattsbooks/][27] | Opened; retained official business-social destination and address corroboration. |
| [https://chestnuthillpa.com/profile/artisans-on-the-avenue/][9] | Opened; retained Artisans listing. |
| [https://artisansontheavenue.com/][28] | Opened; retained official store destination. |
| [https://chestnuthillpa.com/profile/askaliskin35/][10] | Opened; retained AskAliesh listing. |
| [https://askaliesh.com/][29] | Opened; retained official studio destination. |
| [https://chestnuthillpa.com/profile/benedulaw40/][11] | Opened; retained Benedum Law listing. |
| [https://benedumlaw.com/][30] | Opened; retained official firm destination. |
| [https://www.benedumlaw.com/contact-us/][31] | Opened; address corroboration. |
| [https://www.wemeananygarment.com/philly][32] | Opened; retained Any Garment official location. |
| [http://bellfloorcovering.com/][33] | Opened; retained Bell Floor Covering official showroom. |
| [https://www.cityplanter.com/][34] | Opened; retained City Planter official store. |
| [https://shopcreep.com/][35] | Opened; retained Creep Records official store. |
| [https://www.anykidwilldo.org/][36] | Opened; retained AKWD official preschool site. |
| [https://actionkarate.net/locations/manayunk/][37] | Opened; retained Action Karate official location. |
| [https://www.activecarerx.com/][38] | Opened; retained Heart Strong location in official location list. |
| [http://byaliza.com/][39] | Opened; official business purpose inspected. |
| [http://byaliza.com/contact][40] | Opened; retained official studio address. |
| [https://manayunk.com/business-directory/action-karate/][41] | Opened; individual route returned newsletter-only content; top-level directory remains source evidence. |
| [https://manayunk.com/business-directory/activecare-at-heart-strong-chiropractic/][42] | Opened; newsletter-only content; top-level directory remains source evidence. |
| [https://manayunk.com/business-directory/aliza-schlabach-photography/][43] | Opened; newsletter-only content; top-level directory remains source evidence. |
| [https://www.2020visualmedia.com/][44] | Opened; official business purpose inspected. |
| [https://www.2020visualmedia.com/contact][45] | Opened; retained official studio address. |
| [https://aoapets.com/][46] | Opened; retained Ac’Cent on Animals official store. |
| [https://bario-neal.com/][47] | Opened; official store purpose inspected. |
| [https://bario-neal.com/locations/][48] | Opened; retained official Philadelphia showroom address. |
| [http://www.essenemarket.com/][49] | Attempted; verification interstitial, not used as corroboration. |
| [https://www.facebook.com/Essene-Market-Caf%C3%A9-51496132898/][50] | Opened; retained official business-social destination. |
| [https://bonitastudiospa.com/][51] | Opened; retained official studio destination. |
| [http://www.bodygraphics.com/contact-hours-locations.php][52] | Opened; retained official Body Graphics location. |
| [https://3dpt.com/locations/old-city-philadelphia/][53] | Opened; retained official physical-therapy location. |
| [https://bralowmedicalgroup.com/][54] | Opened; retained official medical-group destination. |
| [https://www.oldcitydistrict.org/business/four-foot-prune][14] | Opened; retained A Four Foot Prune listing. |
| [https://www.afourfootprune.com/][55] | Opened; retained official store destination. |
| [https://www.oldcitydistrict.org/business/aa-abrasives-inc][15] | Opened; retained AA Abrasives listing. |
| [https://www.aaabrasives.com/][56] | Opened; retained official retail destination. |
| [https://goodthingsphl.com/place/forbidden-closet-vintage][3] | Opened; retained Forbidden Closet listing. |
| [https://forbiddencloset.online/][57] | Opened; retained official retail destination. |
| [https://southstreet.com/directory/?category=service][6] | Opened; source page for Brown Skin Studio, Essene, Bonita, Body Graphics, 3D PT, and Bralow. |
| [https://www.brownskinstudio.com/][58] | Opened; held because the domain is parked. |
| [https://www.oldcitydistrict.org/business/3rd-street-hardware][16] | Opened; held 3rd Street Hardware listing. |
| [https://www.3rdstreethardware.com/][59] | Attempted; no extractable content, held. |
| [https://goodthingsphl.com/place/fruitcake-floral-studio][4] | Opened; held for no numbered address. |
| [https://fruitcakefloralstudio.com/][60] | Opened through the linked source destination; no numbered public address retained. |

### Additional official or listing checks not used as final evidence

| URL | Result |
|---|---|
| [https://www.aecpartners.net/][61] | Opened; source/official business page inspected but did not corroborate a listed physical address, not retained. |
| [https://www.anhcustomtailor.com/][62] | Attempted; hostname was not publicly resolvable, not retained. |
| [https://www.brownskinstudio.com/][58] | Opened; parked, held. |
| [https://www.counterculturephl.com/][63] | Opened; redirect response only, not retained. |
| [https://www.cityelectricsupply.com/branch/414][64] | Opened; branch page did not expose usable location content in extraction, not retained. |
| [https://www.cityelectricsupply.com/branches/pa/philadelphia/philadelphia-central][65] | Opened; branch page did not expose usable location content in extraction, not retained. |
| [https://www.3jsfoodmarket.com/][66] | Attempted; blocked/private resolution, not retained. |
| [https://www.3rdsthardware.com/][59] | Attempted; no extractable content, held. |
| [https://www.3rdstreethardware.com/][59] | Same official destination spelling used by Old City record; no extractable content, held. |

## Research-only boundary

This work created local research artifacts only. It did **not** geocode addresses, collect coordinates, create map pins, submit forms, write to external APIs or databases, publish records, deploy a service, or change user accounts, authentication, passwords, waitlists, payments, or any operational setting. It does not infer protected traits, ownership, culture, language, licensure, price, operating hours, safety, quality, availability, accessibility, activity status, or closure. An inaccessible, parked, or non-extractable destination is documented only as an evidence limitation.

## References

[1]: https://www.goodthingsphl.com/places "Good Things PHL Places Directory"
[2]: https://goodthingsphl.com/place/aiyah "Good Things PHL — Aiyah"
[3]: https://goodthingsphl.com/place/forbidden-closet-vintage "Good Things PHL — Forbidden Closet Vintage"
[4]: https://goodthingsphl.com/place/fruitcake-floral-studio "Good Things PHL — Fruitcake Floral Studio"
[5]: https://southstreet.com/directory/ "South Street Headhouse District Business Directory"
[6]: https://southstreet.com/directory/?category=service "South Street Headhouse District Services Directory"
[7]: https://www.explorenorthernliberties.org/home/directory/ "Northern Liberties BID Directory"
[8]: https://chestnuthillpa.com/directory/ "Chestnut Hill Business District Directory"
[9]: https://chestnuthillpa.com/profile/artisans-on-the-avenue/ "Chestnut Hill Business District — Artisans on the Avenue"
[10]: https://chestnuthillpa.com/profile/askaliskin35/ "Chestnut Hill Business District — AskAliesh Skin Care Studio"
[11]: https://chestnuthillpa.com/profile/benedulaw40/ "Chestnut Hill Business District — Benedum Law"
[12]: https://manayunk.com/manayunk-business-directory/ "Manayunk Business Directory"
[13]: https://www.oldcitydistrict.org/directory "Old City District Directory"
[14]: https://www.oldcitydistrict.org/business/four-foot-prune "Old City District — A Four Foot Prune"
[15]: https://www.oldcitydistrict.org/business/aa-abrasives-inc "Old City District — AA Abrasives"
[16]: https://www.oldcitydistrict.org/business/3rd-street-hardware "Old City District — 3rd Street Hardware"
[17]: https://teccdc.com/community/52-st-business-directory "TECCDC 52nd Street Business Directory"
[18]: https://www.universitycity.org/businessguide/ "University City District Local Business Guide"
[19]: https://southphiladelphiabusinessassociation.com/ "South Philadelphia Business Association"
[20]: https://mayfairphilly.com/ "Mayfair Business Improvement District"
[21]: https://mayfairphilly.com/wp-content/uploads/2019/04/Mayfair-Directory-Single-View.pdf "Mayfair Directory PDF endpoint"
[22]: https://nephillyonline.com/listing "Northeast Philly Online Business Directory"
[23]: https://chestnuthillpa.com/business-directory/ "Chestnut Hill Business Directory endpoint"
[24]: https://shopaiyah.com/ "Aiyah official store"
[25]: https://chestnuthillpa.com/profile/50watt76/ "Chestnut Hill Business District — 50 Watts Bookstore"
[26]: https://50watts.com/ "50 Watts Books official site"
[27]: https://www.instagram.com/50wattsbooks/ "50 Watts Books official Instagram"
[28]: https://artisansontheavenue.com/ "Artisans on the Avenue official store"
[29]: https://askaliesh.com/ "AskAliesh official site"
[30]: https://benedumlaw.com/ "Benedum Law official site"
[31]: https://www.benedumlaw.com/contact-us/ "Benedum Law official contact page"
[32]: https://www.wemeananygarment.com/philly "Any Garment Cleaners Philadelphia location"
[33]: http://bellfloorcovering.com/ "Bell Floor Covering official showroom site"
[34]: https://www.cityplanter.com/ "City Planter official store"
[35]: https://shopcreep.com/ "Creep Records official store"
[36]: https://www.anykidwilldo.org/ "AKWD Preschool official site"
[37]: https://actionkarate.net/locations/manayunk/ "Action Karate Manayunk official location"
[38]: https://www.activecarerx.com/ "Active Care Chiropractic & Rehabilitation official site"
[39]: http://byaliza.com/ "Aliza Schlabach Photography official site"
[40]: http://byaliza.com/contact "Aliza Schlabach Photography official contact page"
[41]: https://manayunk.com/business-directory/action-karate/ "Manayunk Directory — Action Karate"
[42]: https://manayunk.com/business-directory/activecare-at-heart-strong-chiropractic/ "Manayunk Directory — ActiveCare at Heart Strong Chiropractic"
[43]: https://manayunk.com/business-directory/aliza-schlabach-photography/ "Manayunk Directory — Aliza Schlabach Photography"
[44]: https://www.2020visualmedia.com/ "20/20 Visual Media official site"
[45]: https://www.2020visualmedia.com/contact "20/20 Visual Media official contact page"
[46]: https://aoapets.com/ "Ac’Cent on Animals official site"
[47]: https://bario-neal.com/ "Bario Neal official site"
[48]: https://bario-neal.com/locations/ "Bario Neal official locations page"
[49]: http://www.essenemarket.com/ "Essene Market website"
[50]: https://www.facebook.com/Essene-Market-Caf%C3%A9-51496132898/ "Essene Market & Café official Facebook page"
[51]: https://bonitastudiospa.com/ "Bonita Studio & Spa official site"
[52]: http://www.bodygraphics.com/contact-hours-locations.php "Body Graphics official locations page"
[53]: https://3dpt.com/locations/old-city-philadelphia/ "3 Dimensional Physical Therapy Old City official location"
[54]: https://bralowmedicalgroup.com/ "Bralow Medical Group official site"
[55]: https://www.afourfootprune.com/ "A Four Foot Prune official store"
[56]: https://www.aaabrasives.com/ "AA Abrasives official site"
[57]: https://forbiddencloset.online/ "Forbidden Closet official store"
[58]: https://www.brownskinstudio.com/ "Brown Skin Studio supplied official domain"
[59]: https://www.3rdstreethardware.com/ "3rd Street Hardware supplied official domain"
[60]: https://fruitcakefloralstudio.com/ "Fruitcake Floral Studio official site"
[61]: https://www.aecpartners.net/ "AEC Partners official site"
[62]: https://www.anhcustomtailor.com/ "Anh Custom Tailors supplied official domain"
[63]: https://www.counterculturephl.com/ "Counter Culture supplied official domain"
[64]: https://www.cityelectricsupply.com/branch/414 "City Electric Supply Philadelphia branch page"
[65]: https://www.cityelectricsupply.com/branches/pa/philadelphia/philadelphia-central "City Electric Supply Philadelphia Central branch page"
[66]: http://www.3jsfoodmarket.com/ "3J’s Food Market supplied official domain"
