# Minneapolis–Saint Paul Everyday-Life Research Source Report

**Research-only status.** This inventory is research only. It does not create, edit, geocode, pin, publish, suppress, or otherwise alter a production-directory record. The JSONL files contain **no coordinates**. Each candidate has a numbered street address and an official customer, organization, government, medical, school, or museum destination read before inclusion.

## Count reconciliation

The completed sweep contains **47 candidate records** in `candidates.jsonl` and **6 held records** in `held-candidates.jsonl`, for **53 researched leads**. Candidate IDs run from `multi-city-minneapolis-001` through `multi-city-minneapolis-047`; held IDs run from `multi-city-minneapolis-901` through `multi-city-minneapolis-906`. Every record uses the required 23-field order and contains no latitude, longitude, coordinate, or fabricated map-location field.

| Coverage area | Candidate count | Representative verified destinations |
|---|---:|---|
| Food and drink | 10 | Soul Bowl; Pimento Jamaican Kitchen; Afro Deli; West Indies Soul Food; Golden Thyme; El Burrito Mercado; La Madre; Los Andes; Sonora Grill; La Estancia |
| Health and regulated-care review | 7 | Southside Community Health (two sites); CUHCC; Neighborhood HealthSource (three sites); Riverland Community Health |
| Legal, financial, employment, and education | 5 | Mid-Minnesota Legal Aid; CareerForce Minneapolis North; CareerForce St. Paul; Minneapolis Adult Education; Lutheran Social Service |
| Practical/difficult-day and community resources | 6 | CLUES Saint Paul and Minneapolis; Domestic Abuse Service Center; Bridges to Safety; East Side Neighborhood Services Glendale and Senior Food Shelves |
| Beauty, spa, and fitness | 3 | JUUT Saint Paul; Estetica Salon & Day Spa; Anytime Fitness Minnehaha Falls |
| Family, youth, and movement | 7 | Minneapolis Gymnastics (two sites); Saint Paul Ballet; Zenon Dance; Minnesota Children’s Museum; Science Museum; Como |
| Arts, music, museums, and cultural outlets | 6 | Minneapolis Institute of Art; Walker Art Center; Weisman Art Museum; Hook and Ladder; Cedar Cultural Center; Black Garnet Books |
| Travel, household, and mobility | 3 | Meet Minneapolis Visitor Center; Pilgrim Dry Cleaners Uptown; Bobby & Steve’s Auto World |
| **Total** | **47** | **All candidates have official destination evidence and a numbered address.** |

## Food, budget, and cultural coverage

The food set intentionally includes Black-centered discovery and Hispanic/Latin-American food for all profiles. Ownership designations were recorded only where directly attributed by an official tourism/visitor guide; no ownership was inferred from cuisine, name, neighborhood, or images. Minneapolis’s official Black-owned restaurant guide supports Black-owned designations for Soul Bowl and Pimento, while Visit Saint Paul’s Black-owned-business guide supports Afro Deli, West Indies Soul Food, and Black Garnet Books. The official Golden Thyme site’s wording is only a nomination for “Best black Owned business,” so it is not recorded as an ownership designation.

Hispanic and Latin-American options span Mexican, Ecuadorian/Latin-American, Argentine, and Uruguayan menus. Official restaurant pages confirm street addresses and offerings for El Burrito Mercado, La Madre, Los Andes Latin Bistro, Sonora Grill, and La Estancia. The Minneapolis visitor bureau’s Latin-American guide was used as a credible discovery source and then the restaurant’s own page was read for every included candidate. **Published price signals were captured only where official pages actually listed them**: El Burrito Mercado advertises two tacos/tostadas for $5 and a two-person Thursday menu for $30; Sonora’s official menu lists $5 chips and salsa, $6+ tacos, and $17–$25 platos; La Estancia’s official menu lists $6 empanadas and $41–$59 grill steaks; West Indies Soul Food’s official ordering menu lists $1.95 beverages, $6 patties, a $15.95 special, and $20.75–$25.50 meals [33] [36] [37] [45]. Pimento’s official direct-order page lists $6.50 patties, $15–$19 sandwiches/specials, and $17.50–$28 entrees [46]. Minneapolis Gymnastics publishes examples from $62/month; Science Museum’s general adult/youth tickets are $34.95/$24.95 with a $3 income-based Great Tix option; Como states free admission and lists $5 giraffe feeding. No unsupported universal “budget,” “mid-price,” or “upscale” label has been added to individual records.

## Evidence and source paths

The following discovery sources were read and used to identify candidates before following through to official customer destinations: [1] [2] [3] [4]. Official pages were the direct evidence of address, operation, program, menu/service, and contact details. Key service evidence came from official health-center pages, state and county resource pages, museum/venue visitor pages, school pages, and company location pages [5]–[36].

Health and legal candidates are deliberately routed to `regulated_review` under the contract. This includes medical, dental, behavioral-health, optometry, pharmacy/midwifery and legal-aid destination records. Their notes describe only official scope and access statements. They do **not** make a provider-quality, licensing, availability, insurance, eligibility, legal-advice, or clinical-suitability determination. Southside says no one is turned away because of inability to pay, Neighborhood HealthSource describes a sliding-fee program, and Riverland describes discounts/insurance assistance; those are precise organization statements, not generalized price claims [5] [7] [8]. CUHCC’s official page also identifies patient legal services, which stays within the regulated-review route [6].

Practical and difficult-day resources were included only with clear official contact/location evidence. The county Domestic Abuse Service Center lists multilingual advocacy, safety planning, protection-order support, legal referrals, and emergency-shelter referral; Bridges to Safety describes appointment-based Ramsey County intimate-partner-abuse support and separately lists a 24-hour crisis line [15] [16]. These entries are informational leads; in immediate danger, the source itself directs people to emergency services. Food-shelf eligibility notes mirror East Side Neighborhood Services’ published self-declaration and income statements rather than inferring eligibility [17].

## Held candidates

Six plausible leads were retained in `held-candidates.jsonl`, rather than promoted:

1. **The Curl District** has an official natural-hair page, but the page read lacks a numbered street address.
2. **Minneapolis Beauty Lounge** has a thin official-page extraction without a numbered address or adequate current customer-location evidence.
3. **Grooming House Barbershop – Selby** has a published official website but the page read did not produce the current numbered address. A tourism page is discovery evidence only, not a replacement for official location confirmation.
4. **7 Nails And Spa** was blocked behind a security/cookie screen, preventing official-page verification of current location and services.
5. **Jambo Africa Restaurant N Bar** publishes an internally ambiguous city/postal identity alongside its numbered address. It is held pending direct confirmation of the city field.
6. **Minnesota Valley National Wildlife Refuge – Bloomington Education and Visitor Center** is a relevant government day-trip lead, but its official location page’s extracted text did not supply the numbered visitor-center address; the search-result snippet was not used as evidence.

## Coverage, overlap risk, and limitations

This is a broad but bounded Twin Cities sweep. It covers food, community health, dental and behavioral-health gateways, legal/financial/employment/education support, difficult-day resources, beauty/spa, fitness, youth gymnastics and ballet/dance, museums, live music, bookstore culture, travel information, dry cleaning, and auto repair/towing context. It includes Minneapolis and Saint Paul as the core Twin Cities, with no surrounding destination promoted unless it had direct physical evidence. No generic chains were added just to fill a category.

**Overlap risk:** notable destinations may appear in more than one discovery path. Pimento and Soul Bowl appear on Minneapolis’s Black-owned restaurant guide and their official pages; Afro Deli and West Indies Soul Food appear on Visit Saint Paul’s Black-owned-business guide and their official pages. The Minneapolis tourism Latin-American guide helped discover Latin food possibilities, while individual official restaurant destinations govern their final candidate records. Cultural candidates also appear in official visitor/museum pages and area tourism guides. This folder does not perform reconciliation against external or pre-existing city research; later controlled review must resolve any existing-record duplicates.

Important limitations are currentness and scope. Websites, menus, hours, prices, eligibility, service availability, and physical locations can change. Several restaurant pages publish menu content without prices, so “multiple-price” coverage should not be treated as a full price database. No credible, current official physical candidate was found and promoted for a dedicated car-sale listing, towing-only operation, funeral/grief program, or a fully evidenced natural-hair/barber/nail candidate; incomplete leads were held rather than padded. The dataset does not identify owners except where a cited discovery source expressly applies a designation, does not infer language or accessibility, and contains no clinician, lawyer, counselor, or individual staff personally identifying information.

## References

[1]: https://www.minneapolis.org/food-drink/restaurants/black-owned/ "Popular Black-Owned Restaurants in Minneapolis"
[2]: https://www.minneapolis.org/food-drink/international/latin-american/ "Beyond the Taco: Latin American Restaurants in Minneapolis"
[3]: https://www.visitsaintpaul.com/things-to-do/shopping/black-owned-businesses/ "Black-Owned Businesses in Saint Paul"
[4]: https://www.minneapolis.org/visitor-information/ "Meet Minneapolis Visitor Center"
[5]: https://www.southsidechs.org/ "Southside Community Health Services"
[6]: https://cuhcc.umn.edu/ "Community-University Health Care Center"
[7]: https://neighborhoodhealthsource.org/ "Neighborhood HealthSource"
[8]: https://riverlandcommunityhealth.org/ "Riverland Community Health"
[9]: https://mylegalaid.org/locations/minneapolis/ "Mid-Minnesota Legal Aid Minneapolis"
[10]: https://careerforce.mn.gov/careerforce-location/careerforce-minneapolis-north "CareerForce in Minneapolis North"
[11]: https://careerforce.mn.gov/careerforce-location/careerforce-st-paul "CareerForce in St. Paul"
[12]: https://ce.mpschools.org/adults/adult-ed/ged-adult-diploma "Minneapolis Adult Education Adult Classes"
[13]: https://www.lssmn.org/services/financial-and-employment "Lutheran Social Service of Minnesota Financial & Employment"
[14]: https://clues.org/ "Comunidades Latinas Unidas En Servicio"
[15]: https://www.hennepinattorney.org/get-help/crime/domestic-abuse-service-center "Hennepin County Domestic Abuse Service Center"
[16]: https://bridgestosafety.org/ "Bridges to Safety"
[17]: https://www.esns.org/foodprograms "East Side Neighborhood Services Food Programs"
[18]: https://juut.com/locations/saint-paul-salon-spa/ "JUUT Saint Paul"
[19]: https://mplsgymnastics.com/ "Minneapolis Gymnastics"
[20]: https://spballet.org/ "Saint Paul Ballet"
[21]: https://zenondance.org/ "Zenon Dance Company and School"
[22]: https://www.artsmia.org/ "Minneapolis Institute of Art"
[23]: https://www.walkerart.org/ "Walker Art Center"
[24]: https://wam.umn.edu/ "Weisman Art Museum"
[25]: https://mcm.org/ "Minnesota Children's Museum"
[26]: https://smm.org/visit/ "Science Museum of Minnesota Plan Your Visit"
[27]: https://comozooconservatory.org/ "Como Park Zoo & Conservatory"
[28]: https://thehookmpls.com/ "The Hook and Ladder"
[29]: https://www.thecedar.org/ "The Cedar Cultural Center"
[30]: https://www.blackgarnetbooks.com/ "Black Garnet Books"
[31]: https://www.pilgrimdrycleaners.com/locations/minneapolis-uptown "Pilgrim Dry Cleaners Minneapolis Uptown"
[32]: https://www.bobbyandstevesautoworld.com/Find-Us/Mode/1/5801-Nicollet-Avenue-S-Minneapolis-MN-55419/details "Bobby & Steve's Auto World South Minneapolis"
[33]: https://www.elburritomercado.com/menus/ "El Burrito Mercado Menus"
[34]: https://lamadremn.com/ "La Madre Minneapolis"
[35]: https://www.losandesmn.com/ "Los Andes Latin Bistro"
[36]: https://sonorampls.com/ "Sonora Grill"
[37]: https://www.laestanciasteakhouse.com/ "La Estancia Steakhouse"
[38]: https://www.soulbowlmn.com/ "Soul Bowl"
[39]: https://pimento.com/ "Pimento Jamaican Kitchen"
[40]: https://www.afrodeli.com/locations "Afro Deli Locations"
[41]: https://www.westindiessoulfoods.com/ "West Indies Soul Food"
[42]: https://goldenthymeco.com/ "Golden Thyme Restaurant & Bar"
[43]: https://www.anytimefitness.com/locations/minneapolis-minnesota-4289 "Anytime Fitness Minneapolis Minnehaha Falls"
[44]: https://esteticastpaul.com/about-us/contact-us/ "Estetica Salon & Day Spa Contact"
[45]: https://west-indies-soul-food-saint-paul.cloveronline.com/menu/all "West Indies Soul Food Official Ordering Menu"
[46]: https://order.toasttab.com/online/pimentonicollet "Pimento Jamaican Kitchen Official Direct Ordering Menu"
