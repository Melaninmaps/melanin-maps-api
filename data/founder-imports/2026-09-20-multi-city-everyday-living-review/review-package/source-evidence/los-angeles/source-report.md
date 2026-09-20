# Los Angeles, California — Everyday-Living Research Source Report

**Research status:** This is a research-only inventory. It has not been connected to a database, geocoded, mapped, pinned, published, suppressed, or otherwise altered in a production directory. Both JSONL files contain **no coordinates**.

## Count reconciliation

The completed inventory contains **40 candidate records** in `candidates.jsonl` and **4 held leads** in `held-candidates.jsonl`, for **44 total researched records**. Candidate record types are 20 businesses, 7 community resources, 5 regulated-review records, 4 cultural places, 3 online services, and 1 physical place. Regulated providers and financial/legal services are deliberately routed to `regulated_review` rather than treated as publication-ready professional endorsements.

| Category | Candidate count | Scope supported by official sources |
|---|---:|---|
| Food and dining | 12 | Black food, soul food, Creole/Cajun, Oaxacan, Sonoran, Yucatecan, Mexican seafood, and contemporary Mexican dining |
| Health | 4 | Community primary/dental/behavioral care, hospital/emergency context, and County behavioral-health navigation |
| Community support | 7 | Food navigation and distributions, reentry, towed-vehicle support, and practical difficult-day resources |
| Mobility | 4 | Repair, two auto sales/service options, towing/impound support |
| Arts and culture | 4 | General art, African American art, Latin American/Latino art, concerts, films, memorial/funeral context |
| Beauty | 1 | Natural hair, locs, braids, and treatments |
| Fitness | 2 | Low-cost gym and functional group fitness |
| Employment and education | 2 | County workforce center and library technology/literacy/tutoring support |
| Legal | 1 | Civil legal-aid access; classified regulated review |
| Financial | 1 | Credit union branch; classified regulated review |
| Youth and family | 1 | Youth ballet, dance, and musical-theatre programming |
| Practical services | 1 | Dry cleaning, laundry, alterations, and shoe repair |

## Evidence and coverage findings

The food coverage intentionally spans stated price examples and cuisines rather than inventing a price tier. Official menus support lower-price examples at Sonoratown (a $3.50 taco and a $13 burrito) and Chichen Itza (a $4.25 vaporcito and $8.25 two-taco orders). Harold & Belle’s official menu supports mid-range and special-occasion examples from $6 garlic bread through a $58 ribeye. Damian’s official menu includes $24 guacamole, $72 fish, and a $155 ribeye. These are source-stated examples, not normalized affordability ratings. [1] [2] [3] [4]

Black-food coverage includes two Dulan’s locations, The Serving Spoon, Harold & Belle’s, and Alta. Where a source explicitly used an ownership or family statement, it was captured narrowly; the inventory does not infer race, ethnicity, or ownership from cuisine, location, publicity, names, or imagery. In particular, the Serving Spoon site calls the business family-run and describes its history, while Alta identifies its chef and cuisine without an ownership designation. [5] [6] [7]

Hispanic food is included independently of any profile: Guelaguetza’s official page describes Oaxacan cooking and a family-run history; Sonoratown’s official page describes traditional Sonora-style tacos; Holbox provides an official Mercado la Paloma location; Chichen Itza describes authentic Yucatecan cuisine; Damian describes cuisine rooted in Mexican culture; and Casa Vega provides an official Mexican dining location. [1] [8] [9] [10] [11] [12]

Health entries use official government or provider destinations. Angeles Community Health Center’s official page lists primary/preventive medical, dental, and behavioral-health services and multiple addresses. LA General is included only as a regulated hospital context from the County health system. The County Department of Mental Health 24/7 help line is intentionally an `online_service`, because the official source is a phone/resource navigation destination rather than a single walk-in clinic. [13] [14] [15]

Difficult-day and practical support includes official food-navigation/delivery sources, Homeboy Industries reentry and training support, LAFLA civil legal-aid navigation, County AJCC career support, Central Library technology/literacy support, and LADOT’s release information for booted or towed vehicles. The food-bank warehouse itself is not represented as a public food-pickup candidate because its official page says its warehouses do not distribute directly to the public; the pantry locator is used instead. [16] [17] [18] [19] [20] [21] [22]

Arts coverage includes LACMA’s officially listed Jazz at LACMA and Latin Sounds programming, California African American Museum’s free admission, and a nearby Long Beach day-trip option at MOLAA, which is officially described as dedicated to modern and contemporary Latin American and Latino art. Hollywood Forever is included carefully as a combined cultural-event and end-of-life-service context, based on its own description of concerts, films, cemetery, funeral, and cremation services. Debbie Allen Dance Academy supplies a source-backed youth ballet/dance/musical-theatre option. [23] [24] [25] [26] [27]

Beauty, fitness, daily services, and mobility entries were confirmed on direct customer destinations. Salon Daba expressly describes natural-hair, loc, braid, and treatment services. Planet Fitness publishes the club address, equipment/trainer offering, and membership offer; F45 publishes studio contact information and functional group fitness. A Carriage Regal/Mr. Dry Cleaner publishes cleaning, alterations, shoe repair, and pickup/delivery offerings. Mobility coverage includes LA Auto Center’s official repair page, two official dealer pages, Hollywood Tow’s official-police-garage services, and the LADOT government release page. [28] [29] [30] [31] [32] [33] [34]

## Sources and discovery approach

Discovery began with credible city, government, cultural, and established food-directory paths, then each included candidate was checked against an official customer, government, organization, museum, provider, or service destination. Search-result snippets were not treated as evidence. The direct official destinations cited above are the evidence sources for included records; exact source URLs are also stored per row in `sourceUrl`.

The research used government and official organization sources for health, County workforce, food-support, library, legal-aid, and vehicle-release context. It used official business or venue pages for dining, beauty, fitness, dry cleaning, auto repair, dealerships, towing, museums, youth programs, and cultural programming. The travel/day-trip portion is intentionally narrow: the nearby Long Beach museum is source-supported, while the potentially relevant Catalina ferry terminal remained held because the official terminal page could not be read during this run.

## Holds and exclusion reasons

Four plausible leads are deliberately held rather than added to the candidate inventory.

| Held lead | Reason retained in `held-candidates.jsonl` |
|---|---|
| Virgo | Its official page displays conflicting addresses: 513 Molino Street, Los Angeles and 2684 Lacy Street #217, Los Angeles. A single current physical location could not be determined. |
| Meals by Genet | The reviewed former domain resolves to a domain-for-sale page, not a current official restaurant customer destination. |
| Post & Beam | The official hospitality page describes the restaurant as operating from 2009 through 2019 and does not establish a current restaurant location. |
| Catalina Express Long Beach terminal | The official terminal page was not readable by the research extraction tool, so no numbered terminal address or current service detail was accepted. |

## Overlap risk and limitations

**Overlap risk:** This Los Angeles folder was empty when researched, so no duplicate reconciliation with pre-existing city-folder records was possible. Several official sources can lead to overlapping discovery paths: Mercado la Paloma contains both Holbox and Chichen Itza; City food-assistance resources point to LA Regional Food Bank and partner distributions; and City/County official pages may repeat the same resource network. Records were deduplicated by destination name and numbered address within this deliverable. Review should still compare notable entries—especially Guelaguetza, Dulan’s, The Serving Spoon, Alta, LACMA, CAAM, MOLAA, Homeboy Industries, LAFLA, and Debbie Allen Dance Academy—against research from nearby city assignments before any later governed reconciliation.

**Limitations:** The inventory is broad but not exhaustive. It does not assert ownership without a direct attribution. It does not assert licensing, accessibility, languages, hours, age eligibility, pricing, availability, or professional suitability unless the stated source explicitly supplied it. Current schedules, menu prices, public distributions, class availability, dealer inventory, legal eligibility, clinical access, and towing fees can change and should be rechecked directly with the listed official destination. Doctors, dentists, counselors, hospital services, legal services, and financial services are marked `regulated_review`; no judgment about quality, credentialing, eligibility, insurance, or fit is made. The County mental-health line and food-resource navigators are included as online/phone services, not falsely as map-ready physical care or food-pickup sites.

## References

[1]: https://www.sonoratown.com/ "Sonoratown official locations and menu"
[2]: https://chichenitzarestaurant.com/menu/chichen-itza-restaurant-3655-south-grand-avenue-c6 "Chichen Itza Restaurant official menu"
[3]: https://haroldandbelles.com/menu/ "Harold & Belle's official menu"
[4]: https://www.damiandtla.com/ "Damian official restaurant site"
[5]: https://www.dulans-sfk.com/ "Dulan's Soul Food Kitchen official site"
[6]: https://theservingspoon.net/ "The Serving Spoon official site"
[7]: https://www.altaadams.com/reservations "Alta official reservations and location page"
[8]: https://www.ilovemole.com/pages/restaurant "Guelaguetza official restaurant page"
[9]: https://www.holboxla.com/ "Holbox official restaurant site"
[10]: https://chichenitzarestaurant.com/ "Chichen Itza official restaurant site"
[11]: https://www.damiandtla.com/ "Damian official restaurant site"
[12]: https://www.casavega.com/ "Casa Vega official restaurant site"
[13]: https://www.angelescommunity.org/locations/ "Angeles Community Health Center official locations"
[14]: https://dhs.lacounty.gov/lageneral/ "LA General Medical Center official County page"
[15]: https://dmh.lacounty.gov/get-help-now/ "Los Angeles County Department of Mental Health Get Help Now"
[16]: https://www.lafoodbank.org/about/locations/ "Los Angeles Regional Food Bank official locations"
[17]: https://emergency.lacity.gov/FoodAssistance "City of Los Angeles Community Food Resources"
[18]: https://homeboyindustries.org/ "Homeboy Industries official site"
[19]: https://lafla.org/get-help/ "Legal Aid Foundation of Los Angeles Get Legal Help"
[20]: https://www.ajcc.lacounty.gov/ajcc "Los Angeles County AJCC official locations"
[21]: https://www.lapl.org/branches/central-library "Los Angeles Public Library Central Library official page"
[22]: https://ladotparking.org/adjudication-division/booted-towed-vehicles/ "LADOT Booted and Towed Vehicles official information"
[23]: https://www.lacma.org/visit "LACMA official visit page"
[24]: https://caamuseum.org/visit "California African American Museum official visit page"
[25]: https://molaa.org/visit "Museum of Latin American Art official visit page"
[26]: https://hollywoodforever.com/ "Hollywood Forever official site"
[27]: https://www.debbieallendanceacademy.com/ "Debbie Allen Dance Academy official site"
[28]: https://www.salondabala.com/ "Salon Daba official site"
[29]: https://www.planetfitness.com/gyms/los-angeles-dtla-ca "Planet Fitness Los Angeles DTLA official club page"
[30]: https://f45training.com/studio/downtownlosangeles/ "F45 Downtown Los Angeles official studio page"
[31]: https://mrdrycleaner.com/ "A Carriage Regal Cleaner and Mr. Dry Cleaner official site"
[32]: https://www.laautocenter.biz/ "LA Auto Center official site"
[33]: https://www.fordofdtla.com/ "Ford of Downtown LA official site"
[34]: https://hollywoodtow.com/ "Hollywood Tow Service official site"
