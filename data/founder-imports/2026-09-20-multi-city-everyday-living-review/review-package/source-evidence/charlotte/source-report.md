# Charlotte, North Carolina Everyday-Life Research Source Report

**Status: research only.** This folder was prepared for downstream review and does not create, edit, geocode, pin, publish, suppress, or otherwise alter any production directory record. The two JSONL files contain **no coordinates**.

## Result and count reconciliation

The final dataset contains **39 candidate records** in `candidates.jsonl` and **6 held records** in `held-candidates.jsonl`, for **45 researched records**. Every candidate has a numbered physical street address in Charlotte, North Carolina, and at least one official customer-facing, governmental, health-system, education, or organizational destination was read before inclusion. Candidate `sourceRow` identifiers run from `multi-city-charlotte-001` through `multi-city-charlotte-039`; held identifiers run from `multi-city-charlotte-held-001` through `multi-city-charlotte-held-006`.

| Output | Count | Reconciliation rule |
|---|---:|---|
| `candidates.jsonl` | 39 | Current official destination and numbered physical street address verified. |
| `held-candidates.jsonl` | 6 | Plausible official lead, but a numbered current physical address or other required field was absent or ambiguous on the reviewed official source. |
| Total researched records | 45 | 39 candidates + 6 holds. |

## Coverage achieved

The inventory emphasizes everyday decision points rather than only visitor destinations. It covers **Black-owned and Black-diaspora food**, Hispanic and broader Latin food, Ethiopian and West African food leads, health, dental, behavioral health, civil legal aid, financial counseling, education, economic-pressure assistance, natural hair, barbering, nails, fitness, ballet, museums, nightlife, family science activities, outdoor recreation, hotel support, dry cleaning, home repair, auto repair, and towing.

| Area | Candidates | Evidence-led examples |
|---|---:|---|
| Food and dining | 12 | Mert’s, Sol’ Delish, Don’s, Cuzzo’s, Abugida, Enat, Sabor, Sonrisa, Raíces, La Capital, Calle Sol, and Pio Pio. |
| Health, dental, behavioral health, and legal/financial support | 10 | Community medical and dental care, Mecklenburg County Public Health, Atrium behavioral health, Legal Aid, legal advocacy, financial counseling, UNC Charlotte, and two county resource centers. |
| Beauty and fitness | 6 | Two natural-hair salons, barbershop, nail spa, conventional strength gym, and fitness/recovery club. |
| Arts, culture, youth/family, nightlife, and travel | 8 | Charlotte Ballet, three museums, Trio, Whitewater Center, and Omni Charlotte Hotel. |
| Practical and mobility services | 3 | Dry cleaning, home services, and auto repair/towing. |

## Evidence notes and representative source paths

### Food: price range and community-specific options

Charlotte’s official tourism guide explicitly frames its list as Black-owned restaurants and names **Mert’s**, **Cuzzo’s**, and other Black-owned food destinations.[1] Mert’s official site supplies its Uptown street address and identifies its Southern comfort-food focus.[2] Don’s official site directly calls itself Black-owned fine dining and publishes its Uptown address.[3] Cuzzo’s official site confirms its street address, Southern cuisine, seafood-oriented dishes, and pickup/delivery.[4]

The direct menu evidence supports varied published food price points without relying on inferred budget labels. Sol’ Delish’s official menu lists examples from a **$12** greens scramble to a **$30** ribeye, subject to its stated pricing-change notice.[5] Pio Pio’s official Dilworth menu lists items from **$3** empanadas and **$6** quarter chicken through a **$29** red snapper.[6] La Capital’s official Taco Tuesday menu lists **$10** street tacos and an **$8** regular house margarita.[7] These documented examples establish multiple price points across Black-diaspora and Hispanic/Latin offerings, while avoiding unsourced claims about a restaurant’s overall affordability.

The Hispanic and Latin set includes official customer pages for Sabor’s multi-country Latin street-food menu, Sonrisa’s Latin American menu, Raíces’ Jalisco- and Oaxaca-rooted Mexican dining, La Capital, Calle Sol’s Cuba-to-Peru café, and Pio Pio’s Peruvian/Latin menu.[8] [9] [10] [7] [11] [6] Ethiopian community/diaspora dining has two fully addressed official entries: Abugida, which calls itself family-owned and identifies vegan, vegetarian, and gluten-free choices, and Enat, which lists full-service and food-hall locations and vegan/vegetarian dishes.[12] [13]

### Health, legal, financial pressure, education, and difficult-day support

Charlotte Community Health Clinic’s official locations page supports separate medical and dental destinations at its University and West/Goodwill campus locations.[14] Mecklenburg County Public Health’s clinical-services page supports the Northwest clinic and its listed immunization, reproductive health, STI, TB, and refugee-health services.[15] Atrium’s official page identifies its Behavioral Health Charlotte facility as a dedicated psychiatric emergency department that provides inpatient and outpatient care.[16] These provider and facility entries are routed to `regulated_review`, not treated as published professional endorsements.

The legal entries are also `regulated_review`. Legal Aid’s official offices page verifies its Charlotte office and published local number, while the organization’s main official page describes civil legal assistance categories.[17] [18] Charlotte Center for Legal Advocacy’s official site verifies the office and lists civil legal areas including housing, immigration, expunction, health-care access, tax, and veterans services.[19] Common Wealth Charlotte’s official site supports no-fee nonprofit financial counseling and its stated 0% loan pathway, subject to the site’s approval condition.[20]

For employment, education, and ordinary financial stress, UNC Charlotte’s official site identifies the main campus, program types, and financial-aid resource.[21] Mecklenburg County’s Community Resource Centers page confirms both included addresses and lists food/nutrition, employment, housing, energy, Medicaid, WIC, health, child-support, and workforce-related services.[22] This pair provides especially relevant source-backed routes for food insecurity, job search, public-benefit navigation, caregiving, family support, and utility or housing pressure without asserting eligibility.

### Beauty, fitness, arts, family, travel, and practical services

Two official natural-hair sites support Charlotte addresses and service descriptions: Anew You lists natural hair, locs, braiding, cuts, and color; Styles By Lisa lists wash-and-go, twist, protective-style, color, cut, and hair-growth services.[23] [24] Hawk & Fade’s official site lists the Charlotte shop and posted haircut, shave, and beard-trim prices.[25] Ava Nails Spa confirms manicure, pedicure, artificial-nail, eyelash, waxing, and kid services.[26]

For fitness, Fitness Factory’s official site publishes 24/7 member access, a $20 day pass, membership pricing from $79/month, and strength/cardio modalities.[27] The Health Club CLT’s official page supports its gym, Pilates, training, classes, sauna, steam, and plunge offerings.[28] Charlotte Ballet’s official page supports academy classes for children and adults as well as free community dance classes open to all ages and levels.[29]

Arts and family activities are backed by official institution pages. The Mint Museum has two Charlotte locations and describes exhibits, programs, performances, and all-ages education.[30] The Bechtler identifies art and jazz/music programming.[31] Discovery Place describes its science museum, IMAX, live shows, KidScience, sensory-friendly hours, and location.[32] Charlotte Museum of History identifies its exhibits, historic grounds, group tours, and eight-acre campus.[33] Trio’s official page supports the nightlife entry and its stated venue format, event calendar, and hours.[34]

Travel/day-trip context is sourced to the Whitewater Center’s official activities description and its contact page, which verifies the address; activities include rafting/kayaking, trails, ropes/zipline, camps, and yoga.[35] [36] The Omni’s official page verifies its Uptown hotel address and lodging, dining, fitness, and event offerings.[37]

The practical-service entries each use a direct official page. American Dry Cleaners supports dry cleaning, wash/dry/fold, alterations, pickup/delivery, leather/suede, wedding, and household-item services.[38] Morris-Jenkins supports HVAC, plumbing, cooling, electrical, and home-performance work.[39] Woodie’s supports the Midtown shop and Charlotte towing/roadside-assistance service.[40]

## Held candidates

The six held lines preserve credible leads but do not meet the physical-candidate rule. Charlotte Youth Ballet’s official site supports youth ballet performances, auditions, and outreach but did not publish a numbered organization address on the reviewed page.[41] Charlotte Works’ official site supports workforce and training functions but did not disclose a numbered customer-facing address on the reviewed page.[42] Jones Dry Cleaning’s official landing page says it operates five Charlotte locations but does not identify one numbered current location.[43] Families Forward Charlotte publishes a P.O. Box rather than a physical street address.[44] Mama Gee’s official site supports West African food and ordering but did not supply a numbered current address.[45] The Fillmore’s official page confirmed the venue identity but did not yield a numbered address in the reviewed official content.[46]

## Overlap risk and deduplication notes

Several records were reached through both a discovery source and their own official source. The clearest overlap is Mert’s, Cuzzo’s, Abugida, and other food businesses appearing in Charlotte’s official tourism guide and then being confirmed on their customer destinations; only one candidate line was retained per named/addressed destination.[1] The Black-owned designation is only populated where directly stated by the destination itself or the official Charlotte tourism guide. No ownership identity was inferred from cuisine, marketing, staff, community association, or social presence. Multiple locations are represented only when the official source clearly identifies a distinct location; otherwise, one location was selected or the record was held.

## Limitations

This is a broad but time-bounded research sweep. It does not claim to be exhaustive, does not validate appointment availability, eligibility, insurance acceptance, credentials, licensing status, accessibility features, hours after the source review, or real-time menu/price availability. Menu prices and service terms can change; price examples are explicitly recorded as published source snapshots rather than a permanent affordability classification. Some high-value community, youth, food, and entertainment leads were intentionally held because a reviewed official page lacked a numbered physical address. Doctor, dentist, behavioral-health, and legal candidates are represented as `regulated_review` and require governed validation before any later use.

## References

[1]: https://www.charlottesgotalot.com/articles/eat-drink/black-owned-restaurants-in-clt "Black-Owned Restaurants in Charlotte"
[2]: https://mertscharlotte.com/ "Mert's Heart & Soul official website"
[3]: https://donscharlotte.com/menu "Don's Restaurant official menu"
[4]: https://www.cuzzoscuisine.com/ "Cuzzo's Cuisine II official website"
[5]: https://www.soldelish.com/menu "Sol' Delish official menu"
[6]: https://piopiocharlotte.com/menu/dilworth "Pio Pio Chicken Dilworth official menu"
[7]: https://www.lacapitalmxclt.com/menus/ "La Capital MX official menu"
[8]: https://www.saborlatingrill.com/menu/ "Sabor Latin Street Grill official menu"
[9]: https://www.sonrisaclt.com/ "Sonrisa official website"
[10]: https://www.raicesclt.com/ "Raíces official website"
[11]: https://callesolcafe.com/ "Calle Sol official website"
[12]: https://abugidacafe.com/ "Abugida Ethiopian Cafe & Restaurant official website"
[13]: https://enatethiopianrestaurant.com/ "Enat Ethiopian Restaurant official website"
[14]: https://charlottecommunityhealth.org/en/for-patients/hours-and-locations/ "Charlotte Community Health Clinic hours and locations"
[15]: https://health.mecknc.gov/clinical-services "Mecklenburg County Public Health clinical services"
[16]: https://atriumhealth.org/locations/detail/atrium-health-behavioral-health "Atrium Health Behavioral Health Charlotte"
[17]: https://legalaidnc.org/offices/ "Legal Aid of North Carolina offices"
[18]: https://legalaidnc.org/ "Legal Aid of North Carolina official website"
[19]: https://charlottelegaladvocacy.org/ "Charlotte Center for Legal Advocacy official website"
[20]: https://www.commonwealthcharlotte.org/ "Common Wealth Charlotte official website"
[21]: https://www.charlotte.edu/ "University of North Carolina at Charlotte official website"
[22]: https://dcr.mecknc.gov/crc "Mecklenburg County Community Resource Centers"
[23]: https://www.anewyouhair.com/ "Anew You Transitional Salon official website"
[24]: https://www.naturalstylesbylisa.com/ "Styles By Lisa official website"
[25]: https://hawkfade.com/ "Hawk & Fade Barbershop official website"
[26]: https://avanailsspacharlotte.com/ "Ava Nails Spa official website"
[27]: https://www.fitnessfactorycharlotte.com/ "Fitness Factory of Charlotte official website"
[28]: https://www.thehealthclubclt.com/ "The Health Club CLT official website"
[29]: https://charlotteballet.org/ "Charlotte Ballet official website"
[30]: https://www.mintmuseum.org/ "Mint Museum official website"
[31]: https://www.bechtler.org/ "Bechtler Museum of Modern Art official website"
[32]: https://discoveryplace.org/ "Discovery Place Science official website"
[33]: https://www.charlottemuseum.org/ "Charlotte Museum of History official website"
[34]: https://www.triocharlotte.com/ "Trio Nightclub official website"
[35]: https://center.whitewater.org/ "Whitewater Center official website"
[36]: https://whitewater.org/contact/ "Whitewater Center contact page"
[37]: https://www.omnihotels.com/hotels/charlotte "Omni Charlotte Hotel official website"
[38]: https://www.americandrycleaners.net/ "American Dry Cleaners official website"
[39]: https://morrisjenkins.com/ "Morris-Jenkins official website"
[40]: https://www.woodiesautoservice.com/services/charlotte-nc/towing "Woodie's Charlotte towing official page"
[41]: https://www.charlotteyouthballet.org/ "Charlotte Youth Ballet official website"
[42]: https://www.charlotteworks.com/ "Charlotte Works official website"
[43]: https://jonesdrycleaning.com/ "Jones Dry Cleaning official website"
[44]: https://www.familiesforwardcharlotte.org/ "Families Forward Charlotte official website"
[45]: https://www.mamageesclt.com/ "Mama Gee's official website"
[46]: https://www.fillmorenc.com/ "The Fillmore Charlotte official website"
