# Los Angeles County Fitness & Wellness Directory Research

**Scope and result.** This research covers one directory category only: **fitness and wellness**. It identifies gyms, personal training, yoga, Pilates, wellness and recovery offerings, outdoor fitness, and adult fitness communities in Los Angeles County. The output contains **29 candidate records** and **13 held records**. The candidate set includes 20 physical businesses, two regulated-review records, and seven community resources. It does not use the voluntary profile to make claims about anyone’s identity, health, wealth, occupation, eligibility, safety, preferences, or the quality of a business.

The geographic screen is limited to Los Angeles, West Hollywood, and Santa Monica records, plus a Los Angeles County public resource. West Hollywood and Santa Monica records were retained only where the opened source and official destination identify those California locations; no out-of-county leads are included. The primary public sources were a city tourism guide, a chamber directory, a visitor bureau wellness guide, an explicitly LGBTQ+ sports directory, and the County parks resource. [1] [2] [3] [4] [5]

## File inventory

| File | Records | Purpose |
|---|---:|---|
| `candidates-fitness-wellness.jsonl` | 29 | Distinct, source-supported candidates with a public source and an opened official customer-facing destination. |
| `held-fitness-wellness.jsonl` | 13 | Leads excluded from candidates because the official destination was unverified, stale, conflicting, inaccessible, or lacked a required numbered address. |
| `report-fitness-wellness.md` | 1 | This methods, evidence, limitation, and source inventory report. |

## What is included

The public directory evidence supports the included studio and gym records across West Hollywood and Santa Monica. Visit West Hollywood’s gym guide identifies the West Hollywood businesses, while Santa Monica Travel & Tourism and the Santa Monica Chamber support the Santa Monica wellness and fitness leads. [1] [2] [3] The official customer-facing pages were then opened for every included business. The JSONL notes identify when the public directory supplied a numbered address because the official page did not display it.

Community resources were included when an official destination and an explicit Los Angeles directory listing support the record. USGSN’s Los Angeles page is explicit about its LGBTQ+ league directory and links to the organizations’ official destinations. [5] Los Angeles County Parks’ health page is retained as an area-wide public resource because it directs people to County fitness zones, yoga classes, walking clubs, running tracks, weight rooms, and related public facilities. [6]

Two records are deliberately routed to **regulated_review**, rather than represented as ordinary wellness providers. SportsFit describes physical therapy and Doctors of Physical Therapy, while Dripology states that its medical and aesthetic services are performed under licensed-physician supervision. [7] [8] This is a routing decision, not an eligibility, safety, quality, or clinical assessment.

## Candidate coverage by subcategory

| Subcategory group | Candidate records | Examples of source-supported service terms |
|---|---:|---|
| Gyms, strength, HIIT, and personal training | 11 | HIIT, strength, cycling, functional training, CrossFit, private training, boxing fitness |
| Pilates, yoga, dance fitness, and mindful movement | 7 | Reformer Pilates, beach yoga, dance cardio, breathwork, group Pilates |
| Recovery and hotel wellness | 2 | Infrared sauna, red light, recovery suite, cold plunge, compression |
| Regulated-review services | 2 | Physical therapy, IV therapy, physician-supervised services |
| Adult fitness communities and public resources | 7 | Masters swimming, adult rugby, running/walking, recreational sports, tennis, cycling, County parks resource |

## Within-category duplicate review

Names, websites, and normalized street addresses were checked within this single category. No exact duplicate candidates remain. The two OPVS records were retained because Visit West Hollywood and the official OPVS site identify **two distinct West Hollywood addresses**: 8252 Santa Monica Boulevard and 8969 Santa Monica Boulevard. Speir Pilates has only one West Hollywood candidate record. Santa Monica leads that appear in both chamber and tourism material were consolidated to one record per physical location. Multi-service hotels and clinical practices were not split into artificial duplicates.

## Source-attribution rules applied

All service terms are neutral and limited to language on the opened public source or official customer destination. No claim of premium positioning, luxury level, quality, safety, ownership, demographic fit, or suitability is made. The record for Burn Fitness carries a **female-owned** designation solely because Santa Monica Travel & Tourism explicitly uses that term. Speir’s **female-founded; LGBTQ+-friendly** designation comes solely from its official site. LGBTQ+ designations for the adult sports resources are recorded only where the official organization says so or where USGSN explicitly lists the organization within its Los Angeles LGBTQ+ league directory. [3] [5]

Physical business candidates have source-supported numbered addresses. Community resources that do not maintain one fixed published meeting venue have `address: null` and the notes state why; they are
nonphysical organization records rather than physical-business records. An address is not inferred from a social page, an itinerary, a postal region, or a map pin. No coordinates were collected.

## Opened public sources and official destinations

The following public directory, civic, tourism, chamber, and organizational sources were opened and read. Each candidate’s `sourceUrl` identifies the public source that supports its inclusion. Official destinations were separately opened for every candidate; the detailed record notes identify the material confirmed at each destination.

| ID | Opened public source | URL | Role in this research |
|---|---|---|---|
| 1 | Visit West Hollywood — West Hollywood’s Best Gyms | https://www.visitwesthollywood.com/stories/stay-fit-at-these-weho-gyms/ | West Hollywood fitness business directory and addresses. |
| 2 | Visit West Hollywood — Wellness Experiences | https://www.visitwesthollywood.com/experiences/wellness/ | West Hollywood wellness and recovery discovery. |
| 3 | Santa Monica Travel & Tourism — Santa Monica Wellness | https://www.santamonica.com/things-to-do/wellness-activities/ | Santa Monica wellness, outdoor fitness, recovery, and studio discovery. |
| 4 | Santa Monica Chamber — Health & Fitness Directory | https://members.smchamber.com/list/category/health-fitness-1553 | Chamber member names, addresses, and telephone numbers. |
| 5 | USGSN — Los Angeles Leagues | https://www.usgsn.com/losangeles | Explicit LGBTQ+ Los Angeles sports community directory. |
| 6 | Los Angeles County Parks — Health | https://parks.lacounty.gov/health/ | County-wide public outdoor fitness resource. |
| 7 | Santa Monica Travel & Tourism — Original Muscle Beach | https://www.santamonica.com/things-to-do/original-muscle-beach/ | Outdoor-fitness venue lead; held because no numbered address was published. |
| 8 | LA County Library — West Hollywood Library | https://lacountylibrary.org/location/west-hollywood-library/ | County-operated location page used as a geographic context check. |

The official customer-facing destinations opened for candidates were: Barry’s West Hollywood (`https://www.barrys.com/studio/west-hollywood/`); Pvolve West Hollywood (`https://studios.pvolve.com/los-angeles-west-hollywood`); JOHN REED West Hollywood (`https://us.johnreed.fitness/clubs/west-hollywood/`); DOGPOUND Training (`https://www.thedogpound.com/training`); Hot Pilates (`https://hotpilates.com/`); Training Mate West Hollywood (`https://trainingmate.com/locations/west-hollywood/`); KINRGY West Hollywood (`https://www.kinrgy.com/westhollywood`); Reebok LAB (`https://www.reeboklab.com/`); OPVS (`https://opvsfitness.com/`); Speir Pilates (`https://speirpilates.com/`); Brick Fitness (`https://www.brick.fit/`); Beach Yoga SoCal (`https://beachyogasocal.com/`); Good Body Pilates (`https://www.goodbodypilates.com/`); BODYROK Santa Monica (`https://bodyrok.com/studios/santa-monica/`); BoxUnion Santa Monica (`https://www.boxunion.com/location/santa-monica`); Burn Fitness (`https://burnfitness.com/`); Phoenix Classical Pilates (`https://phoenixclassicalpilates.com/`); Perspire Sauna Studio Santa Monica (`https://www.perspiresaunastudio.com/locations/santa-monica/`); Santa Monica Proper wellness and contact pages (`https://www.properhotel.com/santa-monica/wellness/`; `https://www.properhotel.com/contact-us/`); SportsFit (`https://sportsfitphysicaltherapy.com/`); Dripology (`https://dripology.co/`); West Hollywood Aquatics (`https://www.wh2o.org/page/home`); Los Angeles Rebellion Rugby (`https://rebellionrugby.org/playrugby/`); Los Angeles Frontrunners (`https://www.lafrontrunners.com/`); OutLoud Sports LA (`https://outloudsports.com/losangeles`); Los Angeles Tennis Association (`https://www.lataweb.com/`); and Different Spokes Southern California (`https://www.differentspokes.com/`).

## Held-lead review and limitations

The held file preserves leads without promoting them to candidates. It includes: Club Studio, Restore Hyper Wellness, and Body Fit Training because opened location pages did not yield verifiable customer-facing location content; The Haven Pilates and True Pilates because the opened domains were parked or for sale; Churchill Boxing because the opened domain was a general boxing-information site; Nike Running Studio because the opened official Nike experience page did not confirm the local studio; SoulCycle and Be Kind Studios because public-directory and currently opened official-location evidence conflicted; Bünda because the attempted official destination could not resolve; Remedy Place and Infuse Wellness because customer-facing destination and numbered-address verification was incomplete; and Original Muscle Beach because the official visitor source supplied a directional description but not a numbered address.

Source pages, schedules, amenities, ownership/designation language, and business availability can change. An opened official page is evidence of a public web destination at the time of research, not a guarantee of operating status, capacity, pricing, availability, accessibility, safety, quality, eligibility, or suitability. The record set does not verify professional licensure, insurance participation, clinical appropriateness, hotel guest-access terms, or whether a class is currently bookable. Regulated-review records require separate professional and regulatory due diligence before any use beyond research.

## Operational boundary

This was **research-only** work. There was **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**.

## References

[1]: https://www.visitwesthollywood.com/stories/stay-fit-at-these-weho-gyms/ "Visit West Hollywood — West Hollywood’s Best Gyms"
[2]: https://www.visitwesthollywood.com/experiences/wellness/ "Visit West Hollywood — Wellness Experiences"
[3]: https://www.santamonica.com/things-to-do/wellness-activities/ "Santa Monica Travel & Tourism — Santa Monica Wellness"
[4]: https://members.smchamber.com/list/category/health-fitness-1553 "Santa Monica Chamber of Commerce — Health & Fitness Directory"
[5]: https://www.usgsn.com/losangeles "United States Gay Sports Network — Los Angeles Leagues"
[6]: https://parks.lacounty.gov/health/ "Los Angeles County Department of Parks and Recreation — Health"
[7]: https://sportsfitphysicaltherapy.com/ "SportsFit Physical Therapy & Fitness"
[8]: https://dripology.co/ "Dripology"
