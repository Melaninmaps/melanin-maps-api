# Toronto and Greater Toronto Area Source Pass

**Conclusion.** This research-only pass retained **18 candidates** and held **15 candidates**. The retained set covers food, retail, beauty retail, recreation, arts and culture, youth and family resources, health-related community resources, legal services for review, and one explicitly online-only retailer. All retained physical commercial records have a numbered street or building address from an inspected official customer-facing destination. Community resources and cultural places are separately typed and are not commercial map pins.

## Scope and country treatment

This pass is limited to **Toronto** and localities expressly supported by a source as within Toronto/GTA coverage or by a Greater Toronto organization destination. Retained nearby localities are **Mississauga**, **Ajax**, **Scarborough**, and **Etobicoke**. Ajax is retained because the inspected BCAN Peel source describes its list as covering the GTA and Peel Region and includes the Ajax restaurant. Orillia was held as outside scope.

Addresses preserve Canadian forms: civic number and street, municipality, province abbreviation **ON**, and a six-character Canadian postal code only where an inspected source supplied one. No U.S. state, ZIP code, or U.S. address convention has been imposed. Where an official page displayed no postal code, none was invented. The single online-only candidate has a null address by design; no coordinates were created or included.

## Retained evidence and counts

| Target kind | Count | Categories represented |
|---|---:|---|
| `business` | 8 | food (5), retail (1), beauty (1), recreation (1) |
| `online_business` | 1 | retail (1) |
| `cultural_place` | 3 | arts_culture (3) |
| `community_resource` | 4 | family_youth (4) |
| `regulated_review` | 2 | health_community (1), professional_services (1) |
| **Total** | **18** | **8 categories represented** |

Food records are Potluck Restaurant, Beryl’s Pepper Pot, Roywoods, Mofer Coffee, and Rhapsody Toronto. A Different Booklist and Tribal Eye supply retail and beauty. Nice Day Pilates supplies recreation. Kyroche Beauty Supplies is the online-only retail record because the community source explicitly labels it online only. Nia Centre for the Arts, Blackhurst Cultural Centre, and the Afro Caribbean Culture & Art Community Centre are cultural places. ACCN, Toronto Youth Cabinet, ArtWorksTO, and Toronto Youth Job Corps are community resources. Black Mental Health Canada and GOOSELAW Immigration are routed to `regulated_review`; this pass does not certify any credential, licence, professional authority, clinical outcome, or eligibility.

## Why records were held

| Held reason | Count | Records |
|---|---:|---|
| No reliable numbered street address after official-destination inspection | 5 | The Suya Spot; Support & Growth; Fresh Paint Studio + Cafe; Blooming Flower Bar; Adrift Skate Co. |
| Parked, auction, or domain-for-sale destination | 3 | Rasta Pasta; We Are Radar; Jeln |
| Destination inaccessible or non-resolving, with no numbered address in source | 3 | Mummy’s Afro Caribbean Kitchen; Flame and Smoke; Tribe Space Yoga |
| Identity, geography, or current-destination conflict | 4 | Dream Market TO; Holding Space Yoga; Black Artists’ Networks in Dialogue Gallery; Black Youth Helpline |
| **Total held** | **15** | See `held-candidates.jsonl` for individual evidence notes. |

The held file records why each candidate was not retained. Reasons include a domain mismatch, an official destination in Orillia outside scope, a gallery address explicitly closed for renovations, and a resource site that gives contact details but no reliable Toronto/GTA street address. Search snippets were not used as evidence; in particular, a browser-verification gate prevented use of the 211 Ontario page for Black Youth Helpline.

## Deduplication and validation

Before writing, this pass parsed every existing research JSONL file under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this output folder. It normalized **name + city + province + country + address** for each existing record and proposed Toronto record. There were **zero exact matches** against the existing corpus and **zero duplicates within the Toronto output**. Both JSONL files were parsed line-by-line after writing, and every object has exactly the requested schema fields.

## Research-only boundary

This is a **research-only source pass**. It creates no map pins, coordinates, directions, database entries, API calls, applications, user accounts, payments, deployments, or publication. A retained record contains only facts supported by the cited public source and inspected customer-facing official destination. Community, cultural, demographic, and ownership wording is attributed in `ownershipEvidence`; no such label is inferred from a name, image, neighbourhood, or source title. Operational status, hours, prices, availability, accessibility, language fluency, licences, immigration outcomes, and ownership certification are not asserted unless a cited source expressly supports them.

## Inspected URL ledger

The following URLs were opened in this pass. “Retained evidence” supports retained rows. “Held evidence” supports the hold decision. “Context / checked” identifies opened discovery or corroboration pages that were not the sole basis for retention.

| Status | Inspected URL | Use in this pass |
|---|---|---|
| Retained evidence | [BCAN Peel directory][1] | Source evidence for Potluck, Beryl’s, Kyroche, Black Mental Health Canada, and GOOSELAW. |
| Retained evidence | [Potluck official site][2] | Official location, address, phone, and customer destination. |
| Retained evidence | [Beryl’s official site][3] | Official business destination and social links. |
| Retained evidence | [Beryl’s locations][4] | Ajax address and phone. |
| Retained evidence | [Kyroche official shop][5] | Official online shop and social links. |
| Retained evidence | [Nia Centre official site][6] | Cultural-place identity and Toronto address. |
| Retained evidence | [City Cultural Hotspot release][7] | Independent municipal Nia program evidence. |
| Retained evidence | [A Different Booklist official site][8] | Toronto address, phone, and customer-facing bookstore destination. |
| Retained evidence | [Destination Toronto Annex guide][9] | Black-owned business discovery evidence for A Different Booklist. |
| Retained evidence | [Blackhurst official site][10] | Cultural-place description, address, and contact. |
| Retained evidence | [ACCACC official about page][11] | Cultural-place description, Etobicoke address, phone, and social links. |
| Retained evidence | [ACCN official site][12] | Youth and family program description. |
| Retained evidence | [ACCN contact page][13] | Scarborough address and phone. |
| Retained evidence | [Black Mental Health Canada official site][14] | Organization description and official social destinations. |
| Retained evidence | [Black Mental Health Canada contact page][15] | Toronto mailing address and phone. |
| Retained evidence | [GOOSELAW official site][16] | Main office and social destinations. |
| Retained evidence | [GOOSELAW official about page][17] | Law-firm description and official office address. |
| Retained evidence | [Nice Day Pilates official site][18] | Toronto studio address. |
| Retained evidence | [Tribal Eye official site][19] | Retail description and Kensington address. |
| Retained evidence | [Roywoods official site][20] | Toronto location and phone. |
| Retained evidence | [Mofer Coffee official site][21] | Ethiopian coffee and Toronto café address. |
| Retained evidence | [Rhapsody official site][22] | Toronto address, phone, and social links. |
| Retained evidence | [Destination Toronto Black-owned business guide][23] | Discovery and Black-owned wording for five retained businesses. |
| Retained evidence | [City youth services][24] | Municipal source for Toronto Youth Cabinet. |
| Retained evidence | [Toronto Youth Cabinet official site][25] | Official youth-led description and City Hall address. |
| Retained evidence | [City youth job seekers][26] | Municipal source for ArtWorksTO and Toronto Youth Job Corps. |
| Retained evidence | [Toronto Arts Foundation ArtWorksTO][27] | ArtWorksTO host contact and youth program description. |
| Held evidence | [The Suya Spot contact page][28] | No numbered address on inspected destination. |
| Held evidence | [Rasta Pasta supplied domain][29] | GoDaddy parked-domain page. |
| Held evidence | [Dream Market TO destination][30] | Redirect/mismatch to Dream Building. |
| Held evidence | [Holding Space Yoga official site][31] | Orillia address outside scope. |
| Held evidence | [We Are Radar supplied domain][32] | Domain-for-sale page. |
| Held evidence | [Support & Growth official site][33] | Destination did not confirm source-listed office. |
| Held evidence | [Support & Growth contact page][34] | Contact page did not confirm source-listed office. |
| Held evidence | [Fresh Paint official domain][35] | Security/cookie gate prevented address confirmation. |
| Held evidence | [Blooming Flower Bar official site][36] | Postal locality but no numbered street/building address. |
| Held evidence | [Adrift official shop][37] | No numbered Toronto street address displayed. |
| Held evidence | [Jeln supplied domain][38] | Auction/parked-domain page. |
| Held evidence | [Black Youth Helpline official site][39] | Contact supplied but no street address. |
| Held evidence | [211 Ontario page][40] | Browser-verification gate; not used as evidence. |
| Held evidence | [BAND official site][41] | Permanent address explicitly marked closed for renovations. |
| Held evidence | [Mummy’s supplied domain][42] | Did not resolve during inspection. |
| Held evidence | [Flame and Smoke supplied domain][43] | Did not resolve during inspection. |
| Held evidence | [Tribe Space Yoga supplied domain][44] | Did not resolve during inspection. |
| Context / checked | [Destination Toronto Black culture guide][45] | Local discovery checked for further candidates. |
| Context / checked | [Destination Toronto food guide][46] | Local discovery checked for further candidates. |
| Context / checked | [City Community Justice page][47] | Municipal resource page inspected. |
| Context / checked | [City Arts in Oakwood Village page][48] | Dynamic page inspected; destination facts did not render. |
| Context / checked | [Canada Revenue Agency charity page][49] | Page returned a server error and was not used as evidence. |
| Context / checked | [The Suya Spot homepage][50] | Customer-facing homepage inspected before the contact page; it did not itself yield a retained street address. |
| Context / checked | [Dumo Law supplied destination][51] | Official destination inspected but yielded no extractable content; no record was retained from it. |
| Context / checked | [Ode Toronto official site][52] | Current lodging destination inspected as discovery context; it was not needed for a retained record. |

## References

[1]: https://www.bcanpeel.com/black-owned-businesses "BCAN Peel — Black Owned Businesses in GTA & Peel Region"
[2]: https://www.potluckrestaurant.ca/ "Potluck Restaurant official website"
[3]: https://www.berylspepperpot.com/ "Beryl’s Pepper Pot official website"
[4]: https://www.berylspepperpot.com/hours-and-locations "Beryl’s Pepper Pot Hours & Locations"
[5]: https://kyrochebeautysupplies.ca/ "Kyroche Beauty Supplies official online shop"
[6]: https://niacentre.org/ "Nia Centre for the Arts official website"
[7]: https://www.toronto.ca/news/city-of-toronto-cultural-hotspot-puts-the-spotlight-back-on-little-jamaica/ "City of Toronto Cultural Hotspot release"
[8]: https://www.adifferentbooklist.com/ "A Different Booklist official website"
[9]: https://www.destinationtoronto.com/leisure-blog/post/bathurst-bloor-black-history/ "Destination Toronto Annex guide"
[10]: https://blackhurstcc.org/ "Blackhurst Cultural Centre official website"
[11]: https://www.accacc.org/about-acccef "Afro Caribbean Culture & Art Community Centre About Us"
[12]: https://accntoronto.com/ "African Canadian Christian Network official website"
[13]: https://accntoronto.com/contact/ "African Canadian Christian Network contact page"
[14]: https://blackmentalhealth.ca/ "Black Mental Health Canada official website"
[15]: https://blackmentalhealth.ca/contact/ "Black Mental Health Canada contact page"
[16]: https://gooselaw.com/ "GOOSELAW Immigration official website"
[17]: https://gooselaw.com/about/ "GOOSELAW Immigration about page"
[18]: https://www.nicedaypilates.ca/ "Nice Day Pilates official website"
[19]: https://www.tribaleye.net/ "Tribal Eye official website"
[20]: https://roywoods.ca/ "Roywoods official website"
[21]: https://www.mofercoffee.com/ "Mofer Coffee official website"
[22]: https://rhapsodytoronto.com/ "Rhapsody Toronto official website"
[23]: https://www.destinationtoronto.com/leisure-blog/post/black-owned-businesses-toronto/ "Destination Toronto Black-owned businesses guide"
[24]: https://www.toronto.ca/community-people/children-parenting/youth/find-youth-services/ "City of Toronto Find Youth Services"
[25]: https://www.thetyc.ca/ "Toronto Youth Cabinet official website"
[26]: https://www.toronto.ca/community-people/employment-social-support/employment-support/youth-employment-seekers/ "City of Toronto Youth Job Seekers"
[27]: https://neighbourhoodartsnetwork.org/artworksto "Toronto Arts Foundation Neighbourhood Arts Network"
[28]: https://thesuyaspot.com/contact-us/ "The Suya Spot contact page"
[29]: http://eatrastapasta.ca/ "Rasta Pasta supplied domain"
[30]: https://www.dreamto.ca/ "Dream Market TO supplied destination"
[31]: https://www.theholdingspace.ca/ "The Holding Space official website"
[32]: https://www.weareradar.com/ "We Are Radar supplied domain"
[33]: https://supportandgrowth.com/ "Support & Growth official website"
[34]: https://supportandgrowth.com/contact-us/ "Support & Growth contact page"
[35]: https://www.freshpaintstudio.ca/ "Fresh Paint Studio official domain"
[36]: https://www.bloomingflowerbar.com/ "Blooming Flower Bar official website"
[37]: https://www.adriftshop.com/ "Adrift Skate Co. official shop"
[38]: https://www.yourjeln.com/ "Jeln supplied domain"
[39]: https://blackyouth.ca/ "Black Youth Helpline official website"
[40]: https://211ontario.ca/service/69794694/agency/black-youth-helpline/ "211 Ontario Black Youth Helpline agency page"
[41]: https://www.bandgallery.com/ "Black Artists’ Networks in Dialogue official website"
[42]: https://mummysafro-caribbeankitchen.com/ "Mummy’s Afro Caribbean Kitchen supplied domain"
[43]: https://flameandsmoke.online/ "Flame and Smoke supplied domain"
[44]: https://tribespace.ca/ "Tribe Space Yoga supplied domain"
[45]: https://www.destinationtoronto.com/leisure-blog/post/black-history-culture-toronto/ "Destination Toronto Black history and culture guide"
[46]: https://www.destinationtoronto.com/leisure-blog/post/african-caribbean-comfort-food-toronto/ "Destination Toronto African and Caribbean food guide"
[47]: https://www.toronto.ca/community-people/public-safety-alerts/community-safety-programs/youth-violence-prevention-intervention/ "City of Toronto Community Justice"
[48]: https://www.toronto.ca/explore-enjoy/festivals-events/cultural-hotspot/cultural-hotspot-tours/cultural-hotspot-tour-detail/?id=YO12&title=Arts-in-Oakwood-Village "City of Toronto Arts in Oakwood Village"
[49]: https://apps.cra-arc.gc.ca/ebci/hacc/srch/pub/chrtydtls?selectedCharityBn=854837952RR0001&isSingleResult=false&dsrdPg=1&q.bnRtNmbr=854837952&q.bnAccntNmbr=0001&q.stts=0007 "Canada Revenue Agency charity details page"

[50]: https://thesuyaspot.com/ "The Suya Spot official website"
[51]: https://www.dumolaw.com/ "Dumo Law supplied destination"
[52]: https://www.odetoronto.ca/ "Ode Toronto official website"
