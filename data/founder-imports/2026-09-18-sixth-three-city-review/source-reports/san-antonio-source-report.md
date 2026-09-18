# San Antonio & Nearby Texas Communities — Source-Pass Report

## Scope and method

This is a **research-only** source pass for Mapping with Melanin. Nothing was staged, published, imported, or written to any repository, application, database, public API, account, authentication system, waitlist, deployment, or external service. The retained records use public, opened sources and an official customer-facing website or official social destination. The African American Chamber of Commerce of San Antonio (AACCSA) directory was the principal community-supported discovery source; its own public site says it works to elevate Black-owned businesses in and around San Antonio. Chamber presence was used as an inclusion basis only and was not converted into an ownership certification.

Every physical commercial business and cultural place retained has a numbered street address. The AACCSA itself is intentionally a **mapless** `community_resource`: its official page calls its listed street location “Mailing Only” and says its offices are virtual, so its `address` is null. No coordinate, pin, or directions data was created for it. No protected trait, language capability, hours, price, accessibility, licensure, availability, health outcome, coordinate, or operational-status claim was inferred. The five community resources are classified as resources rather than commercial listings.

## Retained records

Eleven records passed this source review: **3 businesses, 3 cultural places, and 5 community resources**. The non-restaurant commercial mix includes a florist and cosmetics retailer; the cultural and community entries provide a deliberately substantial everyday-life complement to the single restaurant.

| Target kind | Count |
|---|---:|
| business | 3 |
| cultural_place | 3 |
| community_resource | 5 |
| online_business | 0 |
| regulated_review | 0 |
| manual_review | 0 |
| **Total retained** | **11** |

| Category | Retained count |
|---|---:|
| Arts & culture | 3 |
| Community services | 5 |
| Food & beverage | 1 |
| Retail | 1 |
| Shopping & services | 1 |
| **Total retained** | **11** |

Eight candidates were held as `manual_review`. The held set includes records with an unconfirmed address, a generic/incorrect/uninspectable official destination, unresolved contact conflict, or a regulated health-related service lacking the information needed for review. Held counts are not included in the retained target-kind or category counts above.

## Exact duplicate check

A feasible local duplicate check was performed across every pre-existing `*.jsonl` file under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this new `san-antonio` output directory. The comparison normalizes Unicode, lowercases, removes non-alphanumeric characters, normalizes common street-type forms, and compares **name + city + state + address**. Candidate address-null entries were also compared conservatively by their null normalized address. No normalized duplicate key from the eleven retained records was found in the existing city research files. A preliminary name search also returned no existing entries for the eleven retained organizations/businesses.

## Inspected URL register

The following URLs were opened and inspected in this pass. “Used” means the content directly supported a retained or held row; “screened” means it was inspected for discovery/verification but did not support a retained row; “uninspectable” means the public URL was opened but extraction or resolution did not yield verifiable content.

| # | Inspected URL | Result and support |
|---:|---|---|
| 1 | https://members.africanamericanchambersa.org/ | Used for public directory scope and category discovery. |
| 2 | https://www.bexar.org/3283/Support-Local-Black-Business | Screened public county guide; it links the AACCSA, AABE resources, and local Black-business resources. |
| 3 | https://www.bexar.org/2601/AABE-Directory | Screened public county description of its African American Business Enterprise directory and certification context. |
| 4 | https://www.sahcc.org/ | Used for San Antonio Hispanic Chamber of Commerce identity, office location, programs, events, and official social links. |
| 5 | https://guadalupeculturalarts.org/ | Used for Guadalupe Cultural Arts Center address, phone, programming, and official social links. |
| 6 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/art-galleries/ | Used for In the Eye of The Beholder and Picquet Studios discovery; both were held after official-destination checks. |
| 7 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/restaurants/ | Used for The Big Bib, Trices, and Jacked Potato discovery; The Big Bib passed and the other two were held. |
| 8 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/food-beverage/ | Screened; entries lacked enough current-location/destination support for retention. |
| 9 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/books-stationary-training-promotional/ | Screened; entries lacked a safe current physical destination. |
| 10 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/fitness/ | Screened; entries did not provide a suitable verified destination. |
| 11 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/photography/ | Screened; official domains could not be verified in this pass. |
| 12 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/gifts-specialty-items/ | Used for Adinkra Creations discovery; official storefront was inspected but locality/address was not demonstrated, so it was not retained. |
| 13 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/automotive/ | Screened; no qualifying unregulated, current customer destination was retained. |
| 14 | https://www.jackedpotato.com/ | Used for Jacked Potato’s official ordering/catering destination, social links, and business-published veteran designation; held because the official site did not confirm the directory street address. |
| 15 | https://www.tricescafeandlounge.com/ | Used for Trices customer destination, address, social links, and business-published designations; held because several inspected phone numbers conflicted. |
| 16 | https://intheeye2021.wixsite.com/gllery | Uninspectable: opened URL did not yield extractable public content; held candidate. |
| 17 | https://www.thebigbib.com/ | Used for The Big Bib BBQ’s San Antonio address, customer ordering, catering, and official social links. |
| 18 | https://www.picquetstudios.com/ | Used to determine the domain was a generic WordPress coming-soon page; held candidate. |
| 19 | https://guadalupeculturalarts.org/contact/ | Used for Guadalupe Theater/gallery/classes addresses and public phone. |
| 20 | https://adinkracreations.com/ | Screened official online storefront; did not establish a San Antonio-area location or eligible address-null online business locality. |
| 21 | https://guadalupeculturalarts.org/guadalupe-latino-bookstore/ | Used for the bookstore/gift shop’s 1300 Guadalupe Street address, visitor-center/community-gallery role, and public destination. |
| 22 | https://www.saaacam.org/ | Used for SAAACAM’s museum address, public phone, events, mission, and official social links. |
| 23 | https://www.sa.gov/Directory/Departments/ACS/Programs-Services/Carver-Community-Cultural-Center | Uninspectable: opened URL did not yield extractable content; not used for a row. |
| 24 | https://esperanzacenter.org/ | Used for Esperanza’s community cultural programming and public-service destinations. |
| 25 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/churches/ | Used for Redeemer’s Praise/The Love Community Center discovery; held after official-domain resolution failed. |
| 26 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/florist/ | Used for A Dreamweaver Florist discovery, directory identity, and phone. |
| 27 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/nonprofit/ | Used for 100 Black Men, SAGE, Generations Excel, and SAAACAM discovery; 100 Black Men and SAGE passed, Generations Excel was held, and SAAACAM was supported also by its official site. |
| 28 | https://100blackmensa.org/ | Used for 100 Black Men’s address, public contact, youth programming, enrollment, volunteer, and donation destinations. |
| 29 | http://redeemerspraise.org/ | Uninspectable: hostname did not resolve to public IPs; held candidate. |
| 30 | http://adreamweaverflorist.com/ | Used for A Dreamweaver Florist’s address, public phone, flower/plant/gift offerings, and special-event decor. |
| 31 | https://www.africanamericanchambersa.org/ | Used for AACCSA’s Black-business support scope, public directory link, programs, and virtual-office/mailing-only statement. |
| 32 | https://jackedpotato.com/contact-us | Used to check location support; page did not publish a street address. |
| 33 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/beauty-salon-spa/ | Used for LXVE MXFFIN and Hair’ess & Co. discovery; LXVE MXFFIN passed and Hair’ess was held. |
| 34 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/boutiques/ | Used for Carmel Soap Company discovery; it was not retained because directory and official-site addresses conflicted. |
| 35 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/clothing/ | Used for Shalom African Fashion and Goods discovery; official destination was unreachable. |
| 36 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/personal-services/ | Used for Affordable Venture Home Healthcare discovery; held as a regulated health-related service with insufficient official/location evidence. |
| 37 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/dry-cleaners/ | Screened; directory listing lacked an official customer destination. |
| 38 | https://members.africanamericanchambersa.org/index.php/business-directory/wpbdp_category/jewelry/ | Used for Infinity Wear discovery; official domain was unreachable. |
| 39 | https://esperanzacenter.org/contact-us/ | Used for Esperanza Peace & Justice Center’s address, phone, and official social links. |
| 40 | https://www.hairessandco.com/ | Used to determine domain content was unrelated to the listed salon; held candidate. |
| 41 | https://www.lxvemxffin.com/ | Used for LXVE MXFFIN’s customer cosmetics storefront and products. |
| 42 | http://www.carmelsoap.com/ | Screened; official site supplied a different address from the AACCSA listing, producing an unresolved conflict. |
| 43 | https://www.sanantonioafricanmarket.com/ | Uninspectable: hostname did not resolve to public IPs; not retained. |
| 44 | http://www.infinitywearstore.com/ | Uninspectable: hostname did not resolve to public IPs; not retained. |
| 45 | https://www.affordablevhhc.com/ | Uninspectable: hostname did not resolve to public IPs; held regulated-service candidate. |
| 46 | https://www.genexcel.org/ | Uninspectable: opened URL did not yield extractable public content; held candidate. |
| 47 | http://www.sagesa.org/ | Used for SAGE’s current address, phone, program information, public involvement destinations, and official social links. |
| 48 | https://keepitrealphotography.net/ | Uninspectable: hostname did not resolve to public IPs; not retained. |
| 49 | http://www.gwendolenwilderauthor.com/ | Uninspectable: hostname did not resolve to public IPs; not retained. |
| 50 | https://www.barioaviaton.com/ | Uninspectable: hostname did not resolve to public IPs; not retained. |

## Limitations

The pass is deliberately conservative. Chamber directory entries can be stale, incomplete, or lack a street address, and membership alone does not certify ownership. Several listed official domains were unreachable, generic, unrelated to the listed organization, or unextractable. Some official pages published conflicting directory contact facts; those entities were held rather than reconciled by inference. The Bexar County AABE interface and some local-government content were discovery/context sources rather than a basis for a retained row because this pass did not authenticate into, export from, or rely on restricted features. No coordinates, map pins, directions, hours, availability, prices, accessibility, licensing, health outcomes, language capability, or operational-status assertions were produced.

The three deliverables in this directory are UTF-8 JSONL/Markdown research artifacts only: `candidates.jsonl`, `held-candidates.jsonl`, and this report.
