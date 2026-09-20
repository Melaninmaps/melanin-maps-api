# Montgomery, Alabama — Everyday-Life Research Source Report

## Research status and count reconciliation

This is **research only**. It does not create, alter, geocode, pin, publish, suppress, or connect to any production directory record or database. The two JSONL files contain **no coordinates**.

| File | Count | Reconciliation |
|---|---:|---|
| `candidates.jsonl` | 49 | Candidate records `multi-city-montgomery-001` through `multi-city-montgomery-049` |
| `held-candidates.jsonl` | 6 | Held records `multi-city-montgomery-901` through `multi-city-montgomery-906` |
| Total researched records | 55 | All records use the contract’s exact 23-field schema and `multi-city-montgomery-` source-row prefix. |

Every candidate has a numbered physical address in Montgomery, AL, except **AirNow Home Services**, which is a source-supported nearby Millbrook, AL physical destination whose official site explicitly advertises service in Montgomery. Every candidate was read at a current official customer destination, official government/education page, official social customer page, or named official organization directory before inclusion. Medical, dental, mental-health, legal and financial records are explicitly routed as `regulated_review`.

## Coverage achieved

| Coverage area | Candidate count | Evidence-backed examples and notes |
|---|---:|---|
| Black food culture, comfort food, seafood/wings, coffee and restaurant/bar outings | 5 | Pannie-George’s menu supplies multiple verified price points ($11, $12, $14 and $18); Martha’s, Double Down, Brin’s and Baristas offer distinct dining/social contexts. Experience Montgomery’s Black-owned-business guide directly supports the `Black-owned` designation retained for Baristas and Brin’s only. |
| Hispanic food | 5 | La Zona Rosa (Mexican/Tex-Mex/Salvadoran), Salsarita’s, SOL, Taqueria El Campesino and El Rey are all included from read official customer pages. |
| Health, dental, mental health and veterans’ care | 6 | HSI, VA Clinic, Medical Outreach Ministries, Carastar, Montgomery Family Dental Care and Montgomery Women’s Health Associates. All are `regulated_review`; descriptions preserve source-stated services rather than quality or eligibility inference. |
| Legal and financial | 2 | Legal Services Alabama Montgomery Office and MAX Credit Union Eastdale Branch are `regulated_review`. |
| Beauty, natural-hair, barber, nails, spa and beauty supply | 6 | Envy, Amelia, Legacy Barber, Luxury Nails, Mammoth Beauty Supply and The Spa at Montgomery. |
| Fitness and youth athletics | 4 | Amped Fitness, Armory Athletics (gymnastics/tumbling/ninja), Montgomery Ballet and Alabama River Region Ballet. |
| Civil-rights culture, museums, art, music and outdoor recreation | 10 | EJI Legacy Museum and National Memorial, Civil Rights Memorial Center, Rosa Parks Museum, Freedom Rides Museum, MMFA, MPAC, ASU Interpretive Center, Whitewater and Zoo/Mann Museum. Whitewater’s official site reported seasonal public operations paused at time read. |
| Food-access, workforce, education and family-support resources | 4 | Heart of Alabama Food Bank, City Office of Workforce and Opportunity, Trenholm State and Alabama State University. |
| Mobility, household and practical services | 5 | Chico’s repair/towing, Stivers sales/service, Worth Cleaners, Clark HVAC/plumbing, and nearby AirNow HVAC/plumbing/electrical. |
| Travel and day-trip context | 2 | Experience Montgomery Visitor Center and Elevation Hotel. The visitor bureau’s official site supplies visitor-guide context and states Montgomery’s approximate driving context to Atlanta, beaches, Nashville and New Orleans; Elevation’s official site describes Legacy Sites lodging/shuttle context. |

## Discovery and verification sources

Discovery relied on multiple credible source types: **Experience Montgomery/Montgomery Chamber** tourism pages and its Black-owned-business guide; **City of Montgomery** government pages; **U.S. Department of Veterans Affairs** and **Alabama Historical Commission** pages; university/college and state agency pages; and official company/organization sites. Search result snippets were not used as evidence. The candidate-level `sourceUrl` field always points to the official customer destination (or an allowable official government, official education, named official organization directory, or official social customer page) that was read.

### Official customer/government/organization destinations read

| Source group | URLs read and applied |
|---|---|
| Food and drink | [Pannie-George’s location](https://www.panniegeorgeskitchen.com/montgomery-location), [Pannie-George’s menu](https://www.panniegeorgeskitchen.com/menus?menu=plate-options), [Martha’s](https://www.marthasplacebuffet.com/), [Double Down](https://doubledownbistro.com/), [Baristas](https://bandbcoffeebar.com/), [Brin’s](https://www.brinswings.com/brins-wings-downtown-montgomery), [La Zona Rosa](https://www.zonarosa.net/), [Salsarita’s](https://salsaritas.com/locations/alabama/festival-plaza/), [SOL](https://www.solrestaurante.com/location/location/), [El Campesino](https://taqueriaelcampesino.toast.site/), [El Rey](https://burritolounge.com/). |
| Health/legal/finance | [HSI](https://www.healthservicesinc.org/), [VA Clinic](https://www.va.gov/central-alabama-health-care/locations/central-alabama-montgomery-va-clinic/), [MOM](https://www.momclinic.org/), [Carastar](https://www.carastar.org/), [Montgomery Family Dental](https://montgomeryfamilydentalcare.com/), [Montgomery Women’s Health](https://montgomerywomenshealth.com/), [Legal Services Alabama directory](https://www.alabamalegalhelp.org/organization/montgomery-office-legal-services-alabama), [MAX](https://www.mymax.com/montgomery-eastdale-branch). |
| Beauty/fitness | [Envy](https://envy-hair-designs.square.site/), [Amelia](https://ameliasalon.com/), [Legacy Barber](https://bakerlegacies.com/), [Luxury Nails](https://luxurynailspamontgomery.com/), [Mammoth Beauty official Facebook](https://www.facebook.com/MammothBeauty/), [Spa at Montgomery](https://rtjspatrail.com/spa/the-spa-at-montgomery/), [Amped](https://ampedfitness.com/location/montgomery-al/). |
| Culture/family | [Legacy Museum](https://legacysites.eji.org/about/museum/), [National Memorial](https://legacysites.eji.org/about/memorial/), [CRMC](https://www.splcenter.org/civil-rights-memorial/), [Rosa Parks Museum](https://www.troy.edu/student-life-resources/arts-culture/rosa-parks-museum/visit.html), [Freedom Rides](https://ahc.alabama.gov/properties/freedomrides/freedomrides.aspx), [MMFA](https://mmfa.org/), [MPAC](https://mpaconline.org/), [Interpretive Center official tourism directory](https://experiencemontgomeryal.org/listing/montgomery-interpretive-center-at-asu/1181/), [Whitewater](https://montgomerywhitewater.com/), [Zoo](https://www.montgomeryzoo.com/plan-your-visit/hours-admission), [Armory](https://armoryathletics.com/index/), [Montgomery Ballet](https://montgomeryballet.org/), [River Region Ballet](https://www.alabamariverregionballet.com/). |
| Practical, education and travel | [Heart of Alabama Food Bank](https://hafb.org/contact-us/), [Workforce Office](https://www.montgomeryal.gov/government/city-government/city-departments/grants/office-of-workforce-and-opportunity), [Trenholm](https://www.trenholmstate.edu/), [ASU](https://www.alasu.edu/), [Chico’s](https://www.chicosautopros.com/), [Stivers](https://www.stiversfordofmontgomery.com/), [Worth Cleaners official Facebook](https://www.facebook.com/WorthCleanersMontgomery/), [Clark](https://www.clarkcomfort.com/), [AirNow](https://www.airnowhvac.com/), [Experience Montgomery](https://experiencemontgomeryal.org/), [Elevation](https://www.elevationhotel.com/). |

### Credible discovery sources additionally used

* [Experience Montgomery’s Black-owned businesses guide](https://experiencemontgomeryal.org/blog/stories/post/pay-homage-to-the-past-help-bolster-the-present/) — discovery and the direct source for the two retained Black-owned designations. Every resulting candidate was separately read at its official customer destination before inclusion.
* [Experience Montgomery main visitor bureau](https://experiencemontgomeryal.org/) and [City of Montgomery visitor page](https://www.montgomeryal.gov/play) — destination/cultural discovery context.
* [City workforce office](https://www.montgomeryal.gov/government/city-government/city-departments/grants/office-of-workforce-and-opportunity), [City domestic-violence resources](https://www.montgomeryal.gov/city-government/departments/police/community/domestic-violence), [Alabama Department of Labor career-centers page](https://adol.alabama.gov/career-centers/) and [Alabama Department of Mental Health](https://mh.alabama.gov/contact-us/) — public-service discovery/triage.

## Holds and why they were not candidates

| Held lead | Reason held |
|---|---|
| Krab Kingz Seafood | The reviewed official social profile did not establish a current numbered Montgomery address; discovery sources conflicted with a listing reporting a former location closed. |
| Vybz Brunch | Current official customer destination and numbered address were not established; sources conflicted as to a prior location’s status. |
| Family Sunshine Center | The official site is strong evidence for its crisis, shelter, advocacy and counseling services, but publishes a P.O. Box rather than a public numbered service address. It is held to protect shelter-location safety and the contract’s physical-address rule. |
| Alabama Department of Mental Health | Official contact page establishes an administrative agency headquarters, not a patient-care destination. |
| Capital Market Montgomery | The reviewed official-looking site did not disclose a reliable numbered street address/contact information and contained unrelated external links. |
| Alabama Career Center — Montgomery | Statewide official page supports services but did not establish a numbered Montgomery career-center address. |

## Limitations and overlap risk

This is a **broad, evidence-backed sweep, not an exhaustive census**. Hours, availability, prices, admissions, services, eligibility, seasonal operations and locations can change; users should contact the official source before visiting. Price evidence was retained only where directly published (notably Pannie-George’s, Amped, Armory, Zoo, Rosa Parks and Freedom Rides); price tier was not inferred for other food businesses. The official Whitewater page reported paused public operations at time read. Family Sunshine Center is intentionally held because its public website does not provide a numbered service address. No ownership, heritage, language capability, accessibility, licensing or other designation has been inferred; the two Black-owned designations in candidates are tied to the cited Experience Montgomery guide. Medical, dental, mental-health, legal and financial records have been classified for governed review rather than endorsement.

No existing Montgomery city folder files were present when this work began, so no record-level overlap was detected locally. **External overlap risk remains**: notable destinations such as the Legacy Museum, National Memorial, Civil Rights Memorial Center, Rosa Parks Museum, Freedom Rides Museum, Montgomery Zoo, MPAC, Whitewater, Alabama State University and Experience Montgomery may already appear through separate civil-rights, tourism, education or family-recreation research paths and require later duplicate reconciliation.
