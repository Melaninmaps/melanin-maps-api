# Houston Everyday Needs — Auto Repair & Practical Mobility Research

**Research date:** 2026-09-19
**Geography:** Houston and clearly Houston-metro records only (Pasadena, Friendswood, Conroe, and Missouri City/Stafford leads only where relevant).
**Directory category:** Mechanics, auto repair, tires, bodywork, detailing, towing, windshield, inspection, car-care education, and practical mobility services.

## Method and inclusion standard

This is a **research-only** discovery pass for Mapping with Melanin. I prioritized opened Black-business directories, public education, municipal, transit, nonprofit, and official customer-facing sources. A candidate required a real, distinct use case, source-backed fields, and an opened official customer-facing or official public destination. Ownership and designation text is recorded only where the source itself supplied it; directory-context statements are labeled as **directory listings**, not independent certification. Services search terms are source-supported and neutral.

## Output counts

| File | Count | Treatment |
|---|---:|---|
| `candidates-auto-repair.jsonl` | 15 | Candidates meeting the verification standard |
| `held-auto-repair.jsonl` | 29 | Leads retained for no official destination, no address, a conflict, potential staleness, or fit limitation |

## Candidate inventory

| Source row | Candidate | Target kind | Subcategory |
|---:|---|---|---|
| 1 | 24 Hour Tire Connection | physical_business | Tires and roadside tire service |
| 2 | Uptown Car Care Center | physical_business | Auto repair and tires |
| 3 | Hitmen Auto Detailing | physical_business | Mobile auto detailing and paint care |
| 4 | 4K Mobile Auto Detailing & Ceramic Coatings | physical_business | Mobile auto detailing and paint care |
| 5 | Houston City College Automotive Technology Training Center | community_resource | Automotive and collision repair education |
| 6 | San Jacinto College Automotive Technology | community_resource | Automotive technician education |
| 7 | Barbara Jordan Career Center Automotive Technology Program | community_resource | Secondary automotive education |
| 8 | The Care Zone | community_resource | Transportation assistance and vehicle donation support |
| 9 | God's Garage | community_resource | Vehicle assistance and repair support |
| 10 | METRO curb2curb | community_resource | On-demand neighborhood rideshare |
| 11 | METRO Vanpool | community_resource | Commuter vanpool |
| 12 | City of Houston Tow and Go Program | community_resource | Freeway incident assistance and towing information |
| 13 | Houston Police Department Auto Dealers Detail | regulated_review | Automotive business licensing, inspection, and towing oversight |
| 14 | Houston Police Department 68-A Inspections | regulated_review | Vehicle identification inspection |
| 15 | Texas DPS Vehicle Inspection Station Locator | community_resource | Online vehicle inspection station finder |

The candidate file uses exactly 23 ordered fields: `sourceRow`, `targetKind`, `name`, `city`, `state`, `country`, `category`, `subcategory`, `address`, `phone`, `website`, `sourceUrl`, `sourceName`, `sourceStatus`, `ownershipDesignations`, `ownershipEvidence`, `regulatedProfession`, `instagramUrl`, `facebookUrl`, `tiktokUrl`, `socialSourceUrl`, `servicesSearchTerms`, and `notes`. Unknown values are literal JSON `null`.

## Dedupe and verification checks

Within-category dedupe used normalized name plus street-address and phone comparisons. All 15 candidate names are distinct. I did **not** merge different public programs merely because they share a government or institutional parent: METRO curb2curb, METRO Vanpool, City Tow and Go, HPD Auto Dealers Detail, and HPD 68-A Inspections have distinct stated functions. I consolidated Houston City College into the single Automotive Technology Training Center record rather than duplicating the related program page. No candidate repeats a held record.

A material conflict was found for **A1 Fleet Service**: its BuyBlack profile names `7425 E Mt Houston Rd, Houston 77050`, while its opened official site names `5807 Little York Rd, Houston 77016`; it is held and has no selected address. The individual BuyBlack profile for 24 Hour Tire Connection was server-blocked, but the opened Houston Automotive index and the opened official business site agree on business identity, phone, and official Houston address. The Yazid’s official domain did not resolve in the opened-source check, so it is held. Da Boyz Automotive’s stated official domain rendered a web-hosting placeholder, so it was not used as a candidate.

## Opened sources and URLs

| # | Source opened | URL |
|---:|---|---|
| 1 | The Houston Black Pages — automotive directory | <http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-car---car-maintenance---car-repair-directory~20> |
| 2 | The Houston Black Pages — towing directory | <http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-towing-services-directory~5626> |
| 3 | The Houston Black Pages — Bemer Plus detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-bemer-plus~30614> |
| 4 | The Houston Black Pages — Elgin detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-elgin-car-care-center~30616> |
| 5 | The Houston Black Pages — Floyd’s detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-floyd%E2%80%99s-premier-muffler-shop~30617> |
| 6 | The Houston Black Pages — Guillory detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-guillory-paint--body-shop~30605> |
| 7 | The Houston Black Pages — In Out detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-in--out-auto-repair~30619> |
| 8 | The Houston Black Pages — Kwik Kar detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-kwik-kar-10-minute-oil-change~30618> |
| 9 | The Houston Black Pages — Little Car Shop detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-little-car-shop~30620> |
| 10 | The Houston Black Pages — Maurice detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-maurice@mobilemechscom~30621> |
| 11 | The Houston Black Pages — Mitchell’s detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-mitchell%E2%80%99s-car-care~30622> |
| 12 | The Houston Black Pages — Sledge detail | <http://thehoustonblackpages.com/BusinessDetails/houston-black-car---car-maintenance---car-repair-sledge-paint--body-shop~30607> |
| 13 | BuyBlack.org — Houston Automotive Directory | <https://www.buyblack.org/houston/automotive> |
| 14 | BuyBlack.org — Yazid's Mobile Mechanic | <https://www.buyblack.org/united-states-of-america/houston/automotive/yazid-s-mobile-mechanic> |
| 15 | BuyBlack.org — Larry Auto Repair Shop LLC | <https://www.buyblack.org/united-states-of-america/houston/automotive/larry-auto-repair-shop-llc> |
| 16 | BuyBlack.org — Uptown Car Care Center | <https://www.buyblack.org/united-states-of-america/houston/automotive/uptown-car-care-center> |
| 17 | BuyBlack.org — Vaughns Space City Tires | <https://www.buyblack.org/united-states-of-america/houston/automotive/vaughns-space-city-tires> |
| 18 | BuyBlack.org — B&R Wheels and Tires | <https://www.buyblack.org/united-states-of-america/houston/automotive/b-r-wheels-and-tires> |
| 19 | BuyBlack.org — Hitmen Auto Detailing | <https://www.buyblack.org/united-states-of-america/houston/automotive/hitmen-auto-detailing> |
| 20 | BuyBlack.org — A1 Fleet Service | <https://www.buyblack.org/united-states-of-america/houston/automotive/a1-fleet-service> |
| 21 | BuyBlack.org — 24 Hour Tire Connection | <https://www.buyblack.org/united-states-of-america/houston/automotive/24-hour-tire-connection> |
| 22 | BuyBlack.org — Anderson Radiator Repair Shop | <https://www.buyblack.org/united-states/houston/automotive/anderson-radiator-repair-shop> |
| 23 | 24 Hour Tire Connection — official site | <https://24hourtireconnectionllc.com/> |
| 24 | Uptown Car Care Center — official site | <https://www.uptowncarcare.com/> |
| 25 | Hitmen Auto Detailing — official site | <https://www.hitmenautodetailing.com/> |
| 26 | 4K Mobile Auto Detailing & Ceramic Coatings — official site | <https://www.4k-autodetailing.com/> |
| 27 | A1 Fleet Service — official site | <https://a1fleetservice.com/> |
| 28 | Yazid's Mobile Mechanic — official site attempted | <https://yazidsmobilemechanic.com/> |
| 29 | Da Boyz Automotive — official site attempted | <http://www.daboyzauto.com/> |
| 30 | Houston City College — Automotive Technology | <https://www.hccs.edu/programs--courses/explore-all-programs/automotive-technology/> |
| 31 | Houston City College — Automotive Technology Training Center | <https://www.hccs.edu/about-us/campus-locations/automotive-technology-training-center/> |
| 32 | San Jacinto College — Automotive Technology | <https://www.sanjac.edu/programs/areas-of-study/manufacturing/automotive-tech/index.php> |
| 33 | San Jacinto College — Central Campus | <https://www.sanjac.edu/about/locations/central/index.php> |
| 34 | HISD Barbara Jordan Career Center — Automotive Technology | <https://jordan.houstonisd.org/academics-programs/academic-offerings/programs-of-study/automotive-technology> |
| 35 | The Care Zone — official site | <https://www.thecarezone.com/> |
| 36 | God's Garage — official site | <https://www.godsgarage.org/> |
| 37 | METRO — curb2curb | <https://www.ridemetro.org/riding-metro/transit-services/curb2curb> |
| 38 | METRO — Vanpool | <https://www.ridemetro.org/riding-metro/transit-services/vanpool> |
| 39 | City of Houston — Tow and Go | <https://www.houstontx.gov/towandgo/> |
| 40 | Houston Police Department — Auto Dealers Detail | <https://www.houstontx.gov/police/auto_dealers_detail/> |
| 41 | Houston Police Department — 68-A Inspections guidance | <https://www.houstontx.gov/police/auto_theft/pdfs/Information-Letter-for-68A.pdf> |
| 42 | Texas Department of Public Safety — Vehicle Inspection | <https://www.dps.texas.gov/section/vehicle-inspection> |
| 43 | Texas DPS — Vehicle Inspection Station Locator | <https://www.dps.texas.gov/apps/rsd/vi/VIactiveStationLocator/> |
| 44 | Houston Hispanic Chamber directory — F | <https://business.houstonhispanicchamber.com/hhccmemberdirectory/FindStartsWith?term=F> |
| 45 | Houston Hispanic Chamber directory — P | <https://business.houstonhispanicchamber.com/hhccmemberdirectory/FindStartsWith?term=P> |

## Limitations

The older Houston Black Pages directory supplied useful Black-business discovery leads but frequently did not provide a business-controlled website, and its currentness cannot be assumed. Those entries were held rather than promoted. BuyBlack profiles are treated as source-attributed directory designations; apart from profiles that literally state “Black-owned business,” this report does not independently certify ownership. The Hispanic Chamber directory pages were opened but rendered only a skip-content fragment in extraction, so no chamber lead was promoted. Public agency and education records are included for practical access, training, regulation, or mobility utility and do not carry an ownership designation unless the source says so.

No facts about demographic identity, language, price, service availability, quality, hours, accessibility, safety, licensure, or eligibility were inferred from names, neighborhoods, imagery, or source category. Users should reconfirm active status, booking requirements, eligibility, and any service details directly with a provider or agency. No coordinates were added.

## Research-only scope statement

This work is **research-only**. It made **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**. The three local files are research outputs only.
