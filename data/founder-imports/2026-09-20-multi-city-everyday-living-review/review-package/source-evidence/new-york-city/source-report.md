# New York City, NY: Everyday-Life Research Sweep

**Result.** This research-only New York City inventory contains **38 candidates** and **3 held candidates**. It covers all five boroughs through physical locations in Manhattan, Brooklyn, the Bronx, Queens, and Staten Island, plus citywide online routing resources. It is designed to support weekend and day-trip planning, everyday services, and difficult-day navigation without claiming that any record is ready for publication.

> **Research boundary:** These files are research-only. They were not connected to a database, geocoded, mapped, pinned, published, or used to alter a production listing. They contain **no coordinates**.

## Count reconciliation

| File | Records | Reconciliation |
|---|---:|---|
| `candidates.jsonl` | 38 | 8 food/public-market records; 7 arts/culture records; 1 youth-ballet record; 1 fitness/recreation record; 6 health records; 5 practical/difficult-day support records; 4 beauty/barber/nail records; 1 faith/community record; 1 household-service record; 2 automotive records; and 2 travel/day-trip records. Categories are one-per-record; cross-cutting needs are captured in search terms and notes. |
| `held-candidates.jsonl` | 3 | La Morada has a compromised/unrelated current domain response; Arepa Lady’s official-site page was not extractable; Gotham Gymnastics published conflicting numbered street addresses. |
| **Total researched rows** | **41** | 38 eligible, source-backed candidates plus 3 plausible but incomplete or ambiguous leads held outside the candidate set. |

All 38 candidate rows use `sourceStatus: "official_customer_destination"`. The three hold rows use `sourceStatus: "held_incomplete_or_ambiguous"`. Medical settings, the health-access program, crisis navigation, legal services, financial counseling, and the regulated automobile-dealer/finance context are deliberately marked `regulated_review` or explicitly caveated where appropriate. No clinician, attorney, counselor, lender, or licensing claim is independently verified by this sweep.

## Coverage and evidence notes

The food selection offers several evidence-based everyday and outing contexts. Harlem soul-food options include Sylvia’s and Amy Ruth’s. Red Rooster combines restaurant service with an official live-music program, while Negril Village documents both Jamaican cuisine and a weekend Rhum Lounge. Los Tacos No. 1 provides the clearest published low-price evidence: its official menu lists tacos from $5.25 to $5.95. Rosa Mexicano officially markets itself as upscale, and Casa Enrique’s official site describes its Mexican cuisine and reservations without supporting an independently inferred price label. La Marqueta provides a public-market setting with named Puerto Rican, African Caribbean, and vegan-soul-food vendors. [1] [2] [3] [4] [5] [6] [7] [8]

For Black and Hispanic cultural outings, the inventory includes the Schomburg Center, Studio Museum in Harlem, The Apollo’s currently open Victoria stages, Weeksville, The Bronx Museum, and Pregones/PRTT. The Museum of the Moving Image contributes an all-ages Queens weekend option with official price, free-hour, and educational-program information. The Apollo’s historic theater is **not** represented as open because its own visit page says it is temporarily closed for renovation; the record instead uses the official open Victoria venue address. [9] [10] [11] [12] [13] [14] [15]

Youth and fitness coverage is limited to direct official evidence. Joffrey documents children’s ballet for ages 2–7 and youth ballet for ages 8–18. Greenbelt Recreation Center documents an accessible Staten Island site with fitness, dance, teen, media-lab, and outdoor-sports facilities. Gotham Gymnastics is held rather than promoted because the official page conflicts on its street number. [16] [17]

Health coverage is intentionally cautious. Community Healthcare Network is documented at Harlem, South Bronx, and Crown Heights locations, and its official services list includes primary care, dental care, behavioral health, psychiatric medicine, and other specialties. Those are `regulated_review` records because specific professionals and services need direct review. NYC Care is included as an online low/no-cost access program, NYC 988 as a 24/7 crisis and referral channel, and Brownsville’s Health Action Center as a municipal public-health/social-service resource. [18] [19] [20] [21]

Difficult-day and practical coverage includes New York Common Pantry, the citywide food-pantry directory, the Brooklyn Workforce1 center, Financial Empowerment Centers, and Legal Aid’s Brooklyn Neighborhood Office. Official sources identify the relevant food, employment, financial-counseling, and legal-service routes, but eligibility, schedules, intake capacity, and legal scope remain confirmation items. [22] [23] [24] [25] [26]

Beauty and household coverage includes a Brooklyn natural-hair salon with official service details, a Harlem booking destination for a hair stylist, a Midtown nail/spa site, a Midtown barber, and a Brooklyn dry cleaner with published laundry/alteration/household-item services. Faith/community coverage includes Abyssinian Baptist Church’s official worship and children/ministry offerings. Mobility coverage includes a Bronx repair/towing shop and a Queens dealer/service-center lead; the latter’s finance and licensing context must be reviewed. [27] [28] [29] [30] [31] [32] [33] [36]

For weekend and day-trip use, Governors Island’s official visitor page documents ferry access from 10 South Street and seasonal Brooklyn weekend/holiday service, while NYC Ferry provides five-borough route information. Visitors should always check the official schedule/status pages before departing. [34] [35]

## Geographic coverage

| Borough or coverage type | Candidate examples | Notes |
|---|---|---|
| Manhattan | Sylvia’s, Schomburg, Apollo Victoria, Joffrey, Workforce1, NYC Ferry/Governors Island gateway | Includes Harlem, Midtown, Union Square, and Lower Manhattan contexts. |
| Brooklyn | Weeksville, CHN Crown Heights, Brownsville Action Center, Happy Cleaners, Legal Aid Brooklyn | Includes family/culture, regulated health, support, and household services. |
| Bronx | Bronx Museum, Pregones, CHN South Bronx, Bronx Auto Service | Includes arts, health, and mobility. |
| Queens | Casa Enrique LIC, Museum of the Moving Image, Major World | Includes restaurant, museum, and regulated auto-dealer context. |
| Staten Island | Greenbelt Recreation Center | Includes accessible recreation, fitness, youth/teen, and media resources. |
| Citywide online | NYC Care, NYC 988, Financial Empowerment Centers, DYCD pantry directory, NYC Ferry | No physical pin is implied for online records. |

## Holds and limitations

Three plausible leads are intentionally excluded from the candidate file. La Morada’s retrieved domain appeared unrelated to the restaurant, making its present official customer destination unreliable. Arepa Lady’s official URL produced no readable extracted content, leaving the location unverified. Gotham Gymnastics’ official page supports its youth programming but conflicts between **315** and **316** Douglass Street; no candidate may use an ambiguous address.

This is a broad, time-bounded city sweep, not an exhaustive guide to NYC. It does not infer Black, Hispanic, Latino/a/x, immigrant, women, LGBTQ+, or other ownership/designation claims from cuisine, neighborhood, staff names, editorial coverage, or visual presentation. All `ownershipDesignations` fields are blank because no direct ownership attribution was collected for this batch. Food price positioning is used only where the official source publishes price values or directly uses the term “upscale.” Hours, menus, accessibility, admissions, ferry operations, care availability, eligibility, and service-area statements can change and should be reconfirmed with the official customer destination.

At the time the assigned `new-york-city` folder was inspected, it contained no pre-existing candidate or held files. Accordingly, no row-level overlap with existing NYC research was found. Notable destinations can occur through multiple discovery paths; the final inventory retains one exact-address row per selected destination and uses its official destination as the evidence source. A specific overlap risk remains for prominent Harlem institutions such as the Schomburg Center, Studio Museum, and Apollo, which are commonly surfaced by tourism and cultural guides; they were not duplicated here.

## Source register

[1]: https://sylviasrestaurant.com/ "Sylvia’s Restaurant official website"
[2]: https://amyruths.com/ "Amy Ruth’s official website"
[3]: https://redroosterharlem.com/ "Red Rooster Harlem official website"
[4]: https://negrilvillage.com/ "Negril Village official website"
[5]: https://www.lostacos1.com/locations/ "Los Tacos No. 1 official locations page"
[6]: https://casaenriquelic.com/contact-us "Casa Enrique LIC official contact page"
[7]: https://rosamexicano.com/location/union-square/ "Rosa Mexicano Union Square official page"
[8]: https://publicmarkets.nyc/la-marqueta "La Marqueta official NYC Public Markets page"
[9]: https://www.nypl.org/locations/schomburg "Schomburg Center official NYPL location page"
[10]: https://www.studiomuseum.org/ "Studio Museum in Harlem official website"
[11]: https://www.apollotheater.org/visit/ "Apollo Theater official visit page"
[12]: https://www.weeksvillesociety.org/visit "Weeksville Heritage Center official visit page"
[13]: https://bronxmuseum.org/visit "The Bronx Museum official visitor guide"
[14]: https://pregonesprtt.org/contact/ "Pregones/Puerto Rican Traveling Theater official contact page"
[15]: https://movingimage.org/visit/ "Museum of the Moving Image official visit page"
[16]: https://www.joffreyballetschool.com/contact-us/ "Joffrey Ballet School official contact page"
[17]: https://www.nycgovparks.org/facilities/recreationcenters/r129 "NYC Parks Greenbelt Recreation Center page"
[18]: https://www.chnnyc.org/locations/ "Community Healthcare Network official locations page"
[19]: https://www.nyccare.nyc/ "NYC Care official website"
[20]: https://nycwell.cityofnewyork.us/en/ "NYC 988 official website"
[21]: https://www.nyc.gov/site/doh/health/neighborhood-health/neighborhood-health-action-centers.page "NYC Health Neighborhood Health Services page"
[22]: https://nycommonpantry.org/contact/ "New York Common Pantry official contact page"
[23]: https://www.nyc.gov/site/dycd/services/food_pantries.page "NYC Department of Youth and Community Development Food Pantries page"
[24]: https://www.nyc.gov/site/sbs/careers/wf1-career-centers.page "NYC Workforce1 Career Centers page"
[25]: https://www.nyc.gov/site/dca/talk-money/get-free-financial-counseling.page "NYC Financial Empowerment Centers page"
[26]: https://legalaidnyc.org/contact-us/ "Legal Aid Society official locations page"
[27]: https://sabineshallway.com/ "Sabine’s Hallway official website"
[28]: https://www.feliciamichellehair.com/schedule-appointment "Felicia Michelle Hair official appointment page"
[29]: https://www.newyorknailspa.com/ "New York Nails & Spa official website"
[30]: https://www.pallmallbarbers.nyc/ "Pall Mall Barbers Midtown NYC official website"
[31]: https://www.abyssinian.org/ "Abyssinian Baptist Church official website"
[32]: https://happycleaners.com/ "Happy Cleaners official website"
[33]: https://bronxautorepair.com/ "Bronx Auto Service official website"
[34]: https://www.govisland.com/plan-your-visit "Trust for Governors Island official visitor page"
[35]: https://www.ferry.nyc/routes-and-schedules/ "NYC Ferry official routes and schedules page"
[36]: https://majorworld.com/ "Major World official website"

Major World is reflected in the mobility coverage discussion and its specific official source is [36].
