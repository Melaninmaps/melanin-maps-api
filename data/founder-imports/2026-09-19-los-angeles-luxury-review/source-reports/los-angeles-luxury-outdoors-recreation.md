# Los Angeles County Outdoors & Recreation Directory Research

**Scope and result.** This research-only wave identified **45 candidate records** across public golf, beaches, sailing and water recreation, cycling, hiking and parks, gardens and destination experiences, and wellness. It also preserved **5 held records** that did not meet the destination-verification, current-location, or numbered-address rule. Every included record has a numbered street address and an opened official customer-facing destination or, for government destinations, an opened official public destination page. The geographic scope is Los Angeles County only: County-run golf and beaches are explicitly County sources; the remaining city, State, university, and tourism records are located in named Los Angeles County municipalities.

The requester’s voluntary context was used only to select the recreational, destination, culture-adjacent garden, cycling, sailing, and wellness subcategories. This report does **not** infer or assign identity, sexual orientation, marital status, health, wealth, occupation, language, preferences, quality, luxury level, safety, ownership, or eligibility to any person or business. The only ownership designation recorded is FantaSea Yachts’ own “family-owned” statement, retained with explicit source attribution in the JSONL.

## Coverage and candidate counts

| Subcategory | Candidate count | Evidence basis |
|---|---:|---|
| Public golf courses | 18 | Los Angeles County Parks directory, plus individual County course pages opened |
| Public beach destinations | 10 | Los Angeles County Beaches & Harbors destination pages |
| Sailing, yachting, paddling, and aquatic recreation | 6 | County Marina directory and opened operator/university destinations |
| Cycling | 1 | Santa Monica tourism listing and opened operator destination |
| Hiking and outdoor parks | 3 | City and State official park sources |
| Gardens, cultural, and community destination experiences | 3 | Discover Los Angeles itinerary plus opened official destinations |
| Wellness / spa locations routed to `regulated_review` | 4 | Discover Los Angeles spa guide plus opened customer destinations |
| **Total candidates** | **45** | **Deduplicated by normalized name + street address** |

The candidate file uses `outdoors_recreation` as the single directory category and records a more specific neutral subcategory for discovery. `servicesSearchTerms` are semicolon-separated and limited to terms supported by the cited source or opened customer destination. Public beaches and parks are represented as physical destinations within the available target-kind vocabulary; this does not characterize them as private companies.

## Evidence rules and classification

The County golf directory states that Los Angeles County Parks & Recreation operates golf courses throughout the County and provides course locations and amenities.[1] The County beaches and harbors sources give location-level addresses and activity lists, including beaches, the Marina del Rey organization directory, and current access notices.[4] [31] The City parks directory provides listed park names and street addresses.[5] California State Parks provides Topanga State Park’s street address and current closure information.[10]

For businesses and community destinations, a credible public directory or tourism source was opened first, then the official business, university, government, or nonprofit customer-facing page was opened. For government destinations, the public agency destination page itself serves as the official customer-facing destination. `regulated_review` is a routing label for spa/massage/acupuncture and related wellness-service records; it is **not** a claim that a business, service, or professional is licensed, regulated, clinically appropriate, or suitable for anyone. The corresponding records expressly note that credentials, outcomes, and suitability were not assessed.

No LGBTQ+ designation is attached to any candidate, because no explicit source-backed designation was collected. No ownership designation is inferred. FantaSea Yachts is the sole exception: its official site explicitly states “Family-owned” and “family owned and operated,” which is captured as an attributed designation only.[34]

## Duplicate and conflict checks

Within each subcategory, names and numbered addresses were normalized and compared before JSONL creation. The 18 golf entries are distinct County course facilities. The 10 beaches are distinct County location pages; no beach was duplicated through a regional hub page. The water-recreation set separates membership yacht clubs, a charter operator, a sailing school/club, a university aquatic center, and a paddle/kayak operator by name and street address. The two Raven Spa leads were not merged: the former Silver Lake record is held because the official site says it is closed, while the active Santa Monica location is included.[47] This prevents a stale address from being presented as active.

## Current-access and information limitations

Several official pages report conditions that can affect a visit. Point Dume’s access road and construction-hour restrictions are explicitly noted in its candidate record; Topanga State Park lists post-fire closure exceptions; Will Rogers reports Parking Lot 5 closed; and Zuma reports an underpass closure while the beach remains open.[10] [29] [39] [60] These notices are source snapshots, not safety or availability determinations. Check each official destination before visiting.

Five leads were retained in `held-outdoors-recreation.jsonl`. Blue Water Sailing is held because its official site required a cookie/security step and usable destination content could not be verified.[33] The Ranch Malibu and Bikes and Hikes LA remain held because their opened official pages described services but did not expose a numbered business address in the retrieved content.[49] [50] The Raven Silver Lake is held as stale; Burke Williams Santa Monica is held because its targeted official page returned no extractable content and an address could not be verified.[47] [48]

The research did not assess price, value, accessibility, membership eligibility, availability, service quality, safety, credentials, ownership beyond the explicit FantaSea statement, or whether a candidate is appropriate for any individual. No coordinates were gathered, generated, or stored.

## Opened source register

All URLs below were opened and read during this research session. The two City park-detail endpoints and the Burke Williams page are retained in the register because they were attempted but returned no extractable page content; they were not used to support included destination facts.

### Government, public agency, and tourism sources

1. Los Angeles City Golf: [2]
2. Los Angeles County Parks golf directory: [1]
3. Los Angeles County Beaches & Harbors Marina organizations directory: [3]
4. Marina del Rey Tourism Board activities directory: [4]
5. Los Angeles County Beaches & Harbors landing page: [5]
6. City of Los Angeles parks directory: [6]
7. Discover Los Angeles outdoors and wellness landing page: [7]
8. Santa Monica Travel & Tourism landing page: [8]
9. Discover Los Angeles outdoor itinerary: [9]
10. California State Parks — Topanga State Park: [10]
11. Discover Los Angeles spa guide: [41]
12. Los Angeles City Golf tee-time page: [42]
13. Discover Los Angeles wellness itinerary: [52]
14. Santa Monica Travel & Tourism — Santa Monica Bike Center: [57]

### Los Angeles County golf course destination pages

Alondra [11]; Altadena [12]; Chester L. Washington [13]; Diamond Bar [14]; Don Knabe Golf Center & Junior Academy [15]; Eaton Canyon [16]; El Cariso [17]; Knollwood [18]; La Mirada [19]; Lakewood [20]; Los Amigos [21]; Los Verdes [22]; Maggie Hathaway [23]; Marshall Canyon [24]; Mountain Meadows [25]; Santa Anita [26]; Victoria [27]; and Whittier Narrows [28].

### Los Angeles County beach destination pages

Dan Blocker [29]; Dockweiler [30]; Marina “Mother’s” Beach [37]; Malibu “Surfrider” [38]; Zuma [39]; Point Dume [40]; Venice [59]; Will Rogers [60]; Nicholas Canyon [61]; and Redondo [62].

### Sailing, water recreation, cycling, and destination operators

California Yacht Club [31]; Del Rey Yacht Club [32]; Blue Water Sailing [33]; FantaSea Yachts [34]; Marina Sailing [35]; UCLA Marina Aquatic Center [36]; Pro SUP Shop [58]; The Bike Center [53]; Bikes and Hikes LA [51].

### Gardens, community, and wellness destinations

The Ritz-Carlton Spa, Los Angeles [45]; Wi Spa [46]; The Raven Spa [47]; Burke Williams Santa Monica attempted page [48]; Tomoko Japanese Spa Beverly Hills [49]; The Ranch Malibu [50]; Descanso Gardens [54]; The Huntington [55]; and Peace Awareness Labyrinth & Gardens [56].

### City pages attempted with no extractable content

Griffith Park detail [43] and Runyon Canyon Park detail [44]. The City’s parks-directory page, rather than these failed detail endpoints, supports the two City park candidates.[6]

## Deliverables and operational boundary

This wave created only the following local research artifacts:

- `candidates-outdoors-recreation.jsonl` — 45 source-backed candidate records.
- `held-outdoors-recreation.jsonl` — 5 leads withheld pending verification or correction.
- `report-outdoors-recreation.md` — this research report.

**Research-only; no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change.**

## References

[1]: https://parks.lacounty.gov/golf-courses-2026/ "Los Angeles County Parks & Recreation — Golf"
[2]: https://golf.lacity.gov/ "L.A. City Golf Courses"
[3]: https://beaches.lacounty.gov/marina-del-rey-organizations-and-clubs/ "Los Angeles County Beaches & Harbors — Marina del Rey Organizations & Clubs"
[4]: https://visitmdr.com/play/activities-marina-del-rey "Marina del Rey Tourism Board — Activities in Marina del Rey"
[5]: https://beaches.lacounty.gov/ "Los Angeles County Department of Beaches and Harbors"
[6]: https://recreation.parks.lacity.gov/parks "City of Los Angeles Department of Recreation and Parks — Parks"
[7]: https://www.discoverlosangeles.com/things-to-do/wellness "Discover Los Angeles — Outdoors & Wellness"
[8]: https://www.santamonica.com/ "Santa Monica Travel & Tourism"
[9]: https://www.discoverlosangeles.com/visit/3-days-of-las-great-outdoors "Discover Los Angeles — 3 Days of LA’s Great Outdoors"
[10]: https://www.parks.ca.gov/?page_id=629 "California State Parks — Topanga State Park"
[11]: https://parks.lacounty.gov/alondra-golf-course/ "Los Angeles County Parks — Alondra Golf Course"
[12]: https://parks.lacounty.gov/altadena-golf-course/ "Los Angeles County Parks — Altadena Golf Course"
[13]: https://parks.lacounty.gov/chester-l-washington-golf-course/ "Los Angeles County Parks — Chester L. Washington Golf Course"
[14]: https://parks.lacounty.gov/diamond-bar-golf-course/ "Los Angeles County Parks — Diamond Bar Golf Course"
[15]: https://parks.lacounty.gov/don-knabe-golf-center-and-junior-academy/ "Los Angeles County Parks — Don Knabe Golf Center and Junior Academy"
[16]: https://parks.lacounty.gov/eaton-canyon-golf-course/ "Los Angeles County Parks — Eaton Canyon Golf Course"
[17]: https://parks.lacounty.gov/el-cariso-golf-course/ "Los Angeles County Parks — El Cariso Golf Course"
[18]: https://parks.lacounty.gov/knollwood-golf-course/ "Los Angeles County Parks — Knollwood Golf Course"
[19]: https://parks.lacounty.gov/la-mirada-golf-course/ "Los Angeles County Parks — La Mirada Golf Course"
[20]: https://parks.lacounty.gov/lakewood-golf-course/ "Los Angeles County Parks — Lakewood Golf Course"
[21]: https://parks.lacounty.gov/los-amigos-golf-course/ "Los Angeles County Parks — Los Amigos Golf Course"
[22]: https://parks.lacounty.gov/los-verdes-golf-course/ "Los Angeles County Parks — Los Verdes Golf Course"
[23]: https://parks.lacounty.gov/maggie-hathaway-golf-course/ "Los Angeles County Parks — Maggie Hathaway Golf Course"
[24]: https://parks.lacounty.gov/marshall-canyon-golf-course/ "Los Angeles County Parks — Marshall Canyon Golf Course"
[25]: https://parks.lacounty.gov/mountain-meadows-golf-course/ "Los Angeles County Parks — Mountain Meadows Golf Course"
[26]: https://parks.lacounty.gov/santa-anita-golf-course/ "Los Angeles County Parks — Santa Anita Golf Course"
[27]: https://parks.lacounty.gov/victoria-golf-course/ "Los Angeles County Parks — Victoria Golf Course"
[28]: https://parks.lacounty.gov/whittier-narrows-golf-course/ "Los Angeles County Parks — Whittier Narrows Golf Course"
[29]: https://beaches.lacounty.gov/dan-blocker-beach/ "Los Angeles County Beaches & Harbors — Dan Blocker Beach"
[30]: https://beaches.lacounty.gov/dockweiler-beach/ "Los Angeles County Beaches & Harbors — Dockweiler State Beach"
[31]: https://www.calyachtclub.com/ "California Yacht Club"
[32]: https://www.dryc.org/ "Del Rey Yacht Club"
[33]: https://bluewatersailing.com/ "Blue Water Sailing"
[34]: https://fantaseayachts.com/ "FantaSea Yachts"
[35]: https://marinasailing.com/ "Marina Sailing"
[36]: https://recreation.ucla.edu/rec-programs/marina-aquatic-center "UCLA Marina Aquatic Center"
[37]: https://beaches.lacounty.gov/marina-beach/ "Los Angeles County Beaches & Harbors — Marina Mother’s Beach"
[38]: https://beaches.lacounty.gov/malibu-surfrider-beach/ "Los Angeles County Beaches & Harbors — Malibu Surfrider Beach"
[39]: https://beaches.lacounty.gov/zuma-beach/ "Los Angeles County Beaches & Harbors — Zuma Beach"
[40]: https://beaches.lacounty.gov/point-dume-beach/ "Los Angeles County Beaches & Harbors — Point Dume Beach"
[41]: https://www.discoverlosangeles.com/things-to-do/your-moment-of-zen-the-best-spas-in-los-angeles "Discover Los Angeles — Your Moment of Zen: The Best Spas in Los Angeles"
[42]: https://golf.lacity.gov/request_tt/ "L.A. City Golf Courses — Book a Tee Time"
[43]: https://recreation.parks.lacity.gov/parks/park-details/griffith-park "City of Los Angeles Recreation and Parks — Griffith Park detail page"
[44]: https://recreation.parks.lacity.gov/parks/park-details/runyon-canyon-park "City of Los Angeles Recreation and Parks — Runyon Canyon Park detail page"
[45]: https://www.ritzcarlton.com/en/hotels/california/los-angeles/spa/ "The Ritz-Carlton Spa, Los Angeles"
[46]: https://www.wispausa.com/ "Wi Spa"
[47]: https://www.theravenspa.com/ "The Raven Spa"
[48]: https://www.burkewilliams.com/locations/santa-monica/ "Burke Williams — Santa Monica"
[49]: https://tomokospa.com/ "Tomoko Japanese Spa Beverly Hills"
[50]: https://www.theranchlife.com/locations/malibu/ "The Ranch Malibu"
[51]: https://bikesandhikesla.com/ "Bikes and Hikes LA"
[52]: https://www.discoverlosangeles.com/things-to-do/3-days-of-wellness-in-los-angeles "Discover Los Angeles — 3 Days of Wellness in Los Angeles"
[53]: https://thebikecenter.com/santa-monica/ "The Bike Center — Santa Monica"
[54]: https://www.descansogardens.org/ "Descanso Gardens"
[55]: https://www.huntington.org/ "The Huntington"
[56]: https://www.peacelabyrinth.org/ "Peace Awareness Labyrinth & Gardens"
[57]: https://www.santamonica.com/things-to-do/santa-monica-bike-center/ "Santa Monica Travel & Tourism — Santa Monica Bike Center"
[58]: https://www.prosupshop.com/ "Pro SUP Shop"
[59]: https://beaches.lacounty.gov/venice-beach/ "Los Angeles County Beaches & Harbors — Venice Beach"
[60]: https://beaches.lacounty.gov/will-rogers-beach/ "Los Angeles County Beaches & Harbors — Will Rogers State Beach"
[61]: https://beaches.lacounty.gov/nicholas-canyon-beach/ "Los Angeles County Beaches & Harbors — Nicholas Canyon Beach"
[62]: https://beaches.lacounty.gov/redondo-beach/ "Los Angeles County Beaches & Harbors — Redondo Beach"
