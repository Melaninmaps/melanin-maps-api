# Pennsylvania Suburbs Around Philadelphia — Review-Only Research Report

**Scope.** This package covers Pennsylvania suburbs only. It includes Bucks, Chester, Delaware, and Montgomery Counties and excludes Philadelphia city. Research ended after retaining **26** records that satisfy the address and official-destination rule; it does not attempt to pad to 60.

## Result summary

The retained set spans everyday needs in food, grooming, health, family support, legal/financial review leads, home and automotive trades, technology, faith/community services, culture, and recreation. Records categorized as `regulated_review` are **leads requiring appropriate independent review**, not statements of licensure, quality, or availability.

| Target kind | Retained count |
|---|---:|
| `business` | 11 |
| `community_resource` | 5 |
| `cultural_place` | 1 |
| `regulated_review` | 9 |
| **Total** | **26** |

| Category | Retained count |
|---|---:|
| Arts and Culture | 1 |
| Automotive | 2 |
| Business Services | 1 |
| Community | 3 |
| Faith and Community | 1 |
| Financial Services | 2 |
| Food | 1 |
| Grooming | 2 |
| Health | 2 |
| Health Products | 1 |
| Recreation and Education | 1 |
| Recreation and Events | 1 |
| Retail and Recreation | 1 |
| Technology Services | 1 |
| Trades | 5 |
| Transportation | 1 |

**Held records:** 19. All held items are `manual_review`; they are kept out of the retained candidate package for the stated evidence reason.

## Source-family coverage

At least five source families were examined; four supplied retained records.

| Source family | Coverage and result |
|---|---|
| Black-owned community directory | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory. It explicitly says it compiled a list of Black-owned businesses. It supplied retained health and grooming leads and several holds. |
| Official county/tourism directory | Visit Bucks County’s Black Owned Businesses guide and official listing pages supplied Bucks food, creative recreation, and event-venue candidates. |
| County/chamber business support directory | Delaware County Chamber’s public MBE directory and electrical-trades directory supplied Delaware/Montgomery business, trade, finance, transportation, arts, and community candidates. The MBE directory’s ownership wording is preserved only as the directory’s attribution. |
| Municipal and regional chamber directories | Middletown Township’s public business directory supplied faith and grooming records; Greater BucksMont Chamber supplied a retained health-community resource and a held record with a street-name variance. |
| Official county community-resource directories | Chester County’s public Resource Directory supplied AgConnect; the Library page was inspected but its record was already present in prior research. |

## Evidence and retention method

For every retained physical commercial or resource record, I read a public source listing and an official business or organization destination. The retained object records the source listing URL in `sourceUrl`, the official customer destination in `website`, and a numbered street address that is publicly supported and not contradicted by inspected material. For multi-location organizations, the record identifies the inspected local site/address. No coordinates, map pins, geocoding, production database/API calls, deployment changes, payments, authentication changes, or publication actions were performed.

The following directly sourced phrases are retained as attribution, not as independent determinations: **“Black-owned”** is attributed to the Jack & Jill directory’s introductory statement about its compiled list; **“Black-owned”** for Visit Bucks guide listings is attributed to the guide’s title and introductory language; and **“Minority Owned Business”** / **“Women Owned Business”** is attributed to the Delaware County Chamber MBE directory. No other demographic, ownership, culture, language, price, schedule, safety, quality, availability, accessibility, licensure, or credential claim is inferred.

## Deduplication

Before writing, I parsed **3,009** JSON objects from **81** pre-existing JSONL research files under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this output directory. I compared normalized `name + city + state + country + address`, where normalization lowercases and removes non-alphanumeric characters. Because some prior packages omit country/state or address fields, I also ran a conservative screen for the same normalized name, city, and nonempty address. Known prior-package records for **Abington Day School, 4 Legged Barber Shop, Nutz About Popcorn, Sani-Jan Cleaning, The Burgerly, Mamie Colette, and Chester County Library System** were held rather than re-added. The retained set has zero exact or stronger prior-package collisions under the automated screen.

## Inspection ledger

Every URL directly opened/read during this pass is logged below. “Retained” means it supplied direct evidence for one or more records; “held” describes why it did not yield a retained record. Search-result snippets alone were not used as evidence.

### Public directory and government/community URLs

| Inspected URL | Result |
|---|---|
| https://jackandjillmontco.org/business_directory/ | Retained Enspire Consulting Group and Fade Factory; held several listings as documented below. |
| https://www.montgomerycc.org/minority-women-owned-business-directory/ | Held from sourcing: this is Montgomery County, Virginia, not Pennsylvania. |
| https://www.middletownbucks.org/Businesses/Business-Directory | Retained/held seed directory for Bucks; source listings read. |
| https://www.middletownbucks.org/Businesses/Business-Directory?page=2 | Read for coverage; no retained record from this page. |
| https://www.middletownbucks.org/Businesses/Business-Directory?page=10 | Read for coverage; no retained record from this page. |
| https://www.middletownbucks.org/Businesses/Business-Directory?page=18 | Retained Parkland Community Church. |
| https://www.middletownbucks.org/Businesses/Business-Directory?page=25 | Retained The Glam Girly. |
| https://www.visitbuckscounty.com/blog/stories/post/black-owned-businesses-in-bucks-county/ | Retained So Fresh So Green Cafe; guided inspection of other Visit Bucks listings. |
| https://www.visitbuckscounty.com/listing/mamie-colette/8574/ | Held as prior-package duplicate. |
| https://www.visitbuckscounty.com/listing/the-burgerly/8498/ | Held as prior-package duplicate. |
| https://www.visitbuckscounty.com/listing/wax-n-scent-studio-llc/8253/ | Retained Wax N Scent Studio LLC. |
| https://www.visitbuckscounty.com/listing/the-falls-banquet-by-eventroostr/5682/ | Retained The Falls Banquet by EventRoostr. |
| https://web.delcochamber.org/2018/search | Read directory taxonomy and public categories. |
| https://web.delcochamber.org/2018/Electrical-Contractors | Retained Dream Team, Ford Brothers Electric, and A.V. Electric. |
| https://web.delcochamber.org/directory/results/results.aspx?affcode=MBE | Retained MBE-attributed records and held Galle Electric. |
| https://web.delcochamber.org/Electrical-Contractors/Galle-Electric--5233 | Held: no reliable official customer site/social destination was present. |
| https://cca.bucksmontchamber.com/37__memberdirectory.aspx | Retained BCHIP; held Big Brothers Big Sisters of Bucks County for an unresolved street-name variance. |
| https://www.buckscounty.gov/715/Bucks-County-Chambers-of-Commerce | Read official Bucks chamber-resource directory; source-family coverage documented. |
| https://www.chesco.org/resourcedirectory | Retained AgConnect. |
| https://www.chesco.org/501/Support-Groups | Read official Chester support-group directory; no retained individual record from the page. |
| https://www.chesco.org/181/Library | Held: Chester County Library System was a known prior-package duplicate. |
| https://hccmc.org/ | Held from sourcing: this chamber is in Montgomery County, Maryland, not Pennsylvania. |

### Official customer or organization destinations inspected

| Inspected URL | Result |
|---|---|
| http://www.theblackreservebookstore.com | Held: parked/forwarding code, not a reliable customer destination. |
| https://abingtondayschool.com/ | Held: prior-package duplicate and locality variance. |
| https://dsqphotography.com/ | Held: official site identifies Philadelphia, inconsistent with suburban source location. |
| http://Thefadefactorybarbershop.com | Retained after inspecting its linked official contact destination. |
| https://fade-antique-factory-flow.base44.app/contact | Retained Fade Factory Barbershop; Bryn Mawr location and contact verified. |
| https://thevillagevets.com/ | Held: official site is a Georgia veterinary chain and mismatches Plymouth Meeting listing. |
| https://4leggedbarbershop.com/ | Held: prior-package duplicate and updated-address conflict. |
| https://nutzaboutpopcorn.com/ | Held: prior-package duplicate. |
| https://www.sanijan.com/ | Held: prior-package duplicate. |
| https://www.thestainbuster.com/ | Held: no reliable numbered Pennsylvania commercial address. |
| https://www.enspirecg.com/ | Retained Enspire Consulting Group. |
| https://www.mamiecolettebakery.com/ | Held: prior-package duplicate. |
| https://www.sofreshjuiceco.com/ | Retained So Fresh So Green Cafe. |
| https://yogamazia.com/ | Held: not explicitly online-only and no numbered local commercial address on official site. |
| http://waxnscentstudio.com | Retained Wax N Scent Studio LLC. |
| http://thefallsbanquet.com/ | Retained The Falls Banquet by EventRoostr. |
| https://theburgerly.com/ | Held: prior-package duplicate. |
| https://www.dreamteampa.com/ | Retained Dream Team. |
| https://www.fordbrothers.net/ | Retained Ford Brothers Electric. |
| https://electriciandelco.com/ | Retained A.V. Electric. |
| https://www.samanyan.com/ | Held: Philadelphia city office is outside scope. |
| https://go-agconnect.org/ | Retained AgConnect. |
| https://allstaffingwarehousing.net/ | Held: official Bensalem address conflicts with directory Langhorne address. |
| https://www.adaywithmyfrieds.org/ | Held: supplied official domain did not resolve. |
| https://alloedhomeservicesllc.com/ | Held from sourcing: supplied official domain did not resolve. |
| https://sugarandspicekiddiespa.com/ | Held: no numbered street address in source/official pages. |
| http://www.1119salon.glossgenius.com | Held: official booking page did not supply reliable local address. |
| https://hairbylora.com/ | Held from sourcing: large cookie/technical page did not provide reliable directly extracted business/location evidence. |
| https://theglamgirly.com/ | Retained The Glam Girly. |
| https://duringconsult.com/ | Held: public directory and official-site ZIP codes conflict for the same street address. |
| https://victoriousgracecharityfoundation.org/ | Retained Victorious Grace Charity Foundation. |
| https://maxxortho.com/ | Retained Maxx Orthopedics. |
| http://www.nerdstogo.com/ | Retained Nerds To Go. |
| http://www.mightylionai.com/ | Retained MightyLion. |
| http://www.stithhealthinsurance.com/ | Retained Stith & Associates. |
| https://qualitytouchsolutions.com/ | Retained Quality Touch Solutions. |
| http://girlsautoclinic.com/ | Retained Girls Auto Clinic & Clutch Beauty Bar. |
| http://www.lync-transport.com/ | Retained Lync Transportation Services. |
| http://www.mywealthbuildingblocks.com/ | Retained Community Solutions Financial. |
| http://delco.schoolofrock.com/ | Retained School of Rock Delco. |
| https://www.chestercommunitycoalition.org/ | Retained Chester Community Coalition. |
| http://www.darlingtonarts.org/ | Retained Darlington Arts Center. |
| https://toprailfences.com/media/ | Retained Top Rail Fence Media. |
| http://briarcliffeautoservice.com/ | Retained Briarcliffe Auto Service. |
| http://www.bbbsbc.org | Held: directory and official-site street names differ (Old York Road vs. York Road). |
| https://www.bchip.org/ | Retained Bucks County Health Improvement Partnership. |
| https://www.parklandchurch.org/ | Retained Parkland Community Church. |

## Hold summary

Held records are in `held-candidates.jsonl` with record-level reasons. The main exclusion patterns were: known prior-package duplicate; a parked, inaccessible, mismatched, or insufficient official customer destination; a missing or conflicting numbered street address; and Philadelphia-city location. Each held object preserves the inspected evidence rather than promoting uncertain information to a candidate.

## Record-level outcome ledger

This ledger is generated from the final JSONL records. It logs every retained/held entity’s source family and the record-specific retention or hold rationale.

### Retained records

| Name | Target kind | Source family | Retention basis |
|---|---|---|---|
| Enspire Consulting Group, LLC | `regulated_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | The official site lists the Flourtown location and client services. Retained as a regulated-service review lead; no credential or license outcome is asserted. |
| Fade Factory Barbershop | `regulated_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | The official contact page confirms the Bryn Mawr booking location. Retained as a cosmetology/barber regulated-service review lead. |
| So Fresh So Green Cafe | `business` | Visit Bucks County — Black Owned Businesses in Bucks County | The official site identifies the cafe address and offers food, beverages, juice orders, catering, and event/kitchen rentals. |
| Wax N Scent Studio LLC | `business` | Visit Bucks County — Wax N Scent Studio LLC Listing | The official studio site confirms the address and customer candle-making workshops. |
| The Falls Banquet by EventRoostr | `business` | Visit Bucks County — The Falls Banquet by EventRoostr Listing | The official site confirms the Morrisville location and event-venue offerings. |
| Dream Team - Plumbing, Heating, Cooling, & Electric | `regulated_review` | Delaware County Chamber of Commerce — Electrical Contractors Directory | The Chamber directory supplies the street address. The official site describes plumbing, HVAC, and electrical service. Retained as a regulated-trade review lead. |
| Ford Brothers Electric | `regulated_review` | Delaware County Chamber of Commerce — Electrical Contractors Directory | The official site confirms the Norwood address, electrical work, and listed Pennsylvania license number. Retained as a regulated-trade review lead. |
| A.V. Electric | `regulated_review` | Delaware County Chamber of Commerce — Electrical Contractors Directory | The official site confirms the Collingdale address and electrical offerings, and says work is done through a licensed electrical contractor. Retained as a regulated-trade review lead. |
| Victorious Grace Charity Foundation Inc. | `community_resource` | Delaware County Chamber of Commerce — MBE Directory | The Chamber provides the numbered Lansdowne street address; the official site confirms Lansdowne, PA and describes community-support programs. |
| Maxx Orthopedics | `business` | Delaware County Chamber of Commerce — MBE Directory | The Chamber provides the numbered King of Prussia address; the official site presents orthopedic product information. |
| Nerds To Go | `business` | Delaware County Chamber of Commerce — MBE Directory | The Chamber provides the Swarthmore address and phone; the inspected official customer site describes managed IT and support services. |
| MightyLion | `business` | Delaware County Chamber of Commerce — MBE Directory | The Chamber provides the street address; the official site describes business-growth systems, automation, CRM, and AI services. |
| Stith & Associates Health Insurance Agency, Inc. | `regulated_review` | Delaware County Chamber of Commerce — MBE Directory | The official site confirms the Glenside suite address and insurance offerings. Retained as a regulated financial-service review lead. |
| Quality Touch Solutions LLC | `business` | Delaware County Chamber of Commerce — MBE Directory | The Chamber provides the numbered address; the official site confirms Broomall, PA and describes the trade services. |
| Girls Auto Clinic & Clutch Beauty Bar | `business` | Delaware County Chamber of Commerce — MBE Directory | The official site confirms the Upper Darby address and auto-repair services. The source supplies the ownership designations. |
| Community Solutions Financial LLC | `regulated_review` | Delaware County Chamber of Commerce — MBE Directory | The official site confirms the Collingdale suite address and financial, tax, and accounting offerings. Retained as a regulated financial-service review lead. |
| School of Rock Delco | `business` | Delaware County Chamber of Commerce — MBE Directory | The official local-school page confirms the Media suite address, phone, and music programs. |
| Chester Community Coalition | `community_resource` | Delaware County Chamber of Commerce — MBE Directory | The official site confirms the numbered Chester address and describes free support, case management, and trainings. |
| Darlington Arts Center | `cultural_place` | Delaware County Chamber of Commerce — MBE Directory | The official site identifies Darlington as a nonprofit community center for arts education and confirms the Garnet Valley address. |
| Top Rail Fence Media | `business` | Delaware County Chamber of Commerce — MBE Directory | The Chamber provides the numbered street address; the official site confirms Springfield, PA and fence-installation and repair services. |
| Briarcliffe Auto Service | `business` | Delaware County Chamber of Commerce — MBE Directory | The official site confirms the Glenolden address and describes repair, inspection, towing, and maintenance services. |
| Bucks County Health Improvement Partnership (BCHIP) | `community_resource` | Greater BucksMont Chamber of Commerce Member Directory | The official site confirms the Newtown address and community-health programs. |
| AgConnect | `community_resource` | Chester County, PA Resource Directory | Chester County’s official resource directory lists AgConnect and its address; AgConnect’s official site describes farm, producer, agribusiness, and education resources. |
| Parkland Community Church | `community_resource` | Middletown Township, Bucks County Business Directory | Middletown Township lists the church and official website; the official site confirms the numbered Langhorne address and community-service activities. |
| The Glam Girly | `regulated_review` | Middletown Township, Bucks County Business Directory | Middletown Township provides the directory listing; the official site confirms the numbered Langhorne address. Retained as a cosmetology-service review lead. |
| Lync Transportation Services | `regulated_review` | Delaware County Chamber of Commerce — MBE Directory | The Chamber provides the numbered Secane address; the official site describes passenger transportation and states that it is authorized by the Pennsylvania PUC, USDOT, and FMCSA. Retained as a regulated-transportation review lead. |

### Held records

| Name | Target kind | Source family | Hold reason |
|---|---|---|---|
| The Black Reserve Book Store | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — inspected official domain returned parked/forwarding PHP code rather than a reliable customer-facing business destination. |
| Abington Day School | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — deduplication found known prior-package records for the same business; not re-added. The directory calls the locality Abington while the official site states Roslyn. |
| DSQ Photography | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — source lists a Glenside street address, while the inspected official site identifies its location only as Philadelphia; location support conflicts/does not satisfy the suburb requirement. |
| The Village Vets | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — inspected official website is for Georgia locations and does not corroborate the Plymouth Meeting listing; official destination is mismatched. |
| 4 Legged Barber Shop | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — deduplication found known prior-package records for the same business; source address is also older/different from the official site’s “New Address.” |
| Nutz About Popcorn | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — deduplication found known prior-package records for the same business; not re-added. |
| Sani-Jan Cleaning | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — deduplication found a known prior-package record for Sani-Jan Cleaning; not re-added. |
| The Stain Buster | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — official site was live and service-specific but neither source nor official page supplied a reliable numbered Pennsylvania commercial address; not explicitly online-only. |
| Sugar & Spice Kiddie Spa Oxford Valley | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — source says “Inside Oxford Valley Mall” and official site confirms the Oxford Valley branch but neither inspected page supplied a numbered street address. |
| Yogamazia | `manual_review` | Visit Bucks County — Black Owned Businesses in Bucks County | None |
| Sam Anyan, Jr. Esq, LLC | `manual_review` | Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory | HELD — official business address is in Philadelphia city, which is excluded from the requested geography. |
| All Staffing Warehousing Logistics, INC | `manual_review` | Middletown Township, Bucks County Business Directory | HELD — Middletown directory lists 180 Wheeler Court, Langhorne; official site lists 3161 State Road, Bensalem. Conflicting physical addresses were not resolved. |
| A Day with my Friends | `manual_review` | Middletown Township, Bucks County Business Directory | HELD — directory source has address and website, but the supplied official domain could not resolve when inspected; no reliable official customer destination. |
| Galle Electric | `manual_review` | Delaware County Chamber of Commerce — MBE Directory | HELD — the Chamber MBE listing supplies address and phone but no official website or business-social customer destination was provided or found in the inspected listing. |
| The Burgerly | `manual_review` | Visit Bucks County — The Burgerly Listing | HELD — deduplication found a known prior-package record for the same business; not re-added. |
| Mamie Colette | `manual_review` | Visit Bucks County — Mamie Colette Listing | HELD — deduplication found a known prior-package record for the same business; not re-added. |
| Chester County Library System | `manual_review` | Chester County, PA — Library Page | HELD — deduplication found a known prior-package record for the same organization and address; not re-added. |
| DuringConsult | `manual_review` | Delaware County Chamber of Commerce — MBE Directory | HELD — the Chamber directory lists 110A Baltimore Pike, Springfield, PA 19074, while the official site gives the same street with Suite 1025 but ZIP 19064. Treated as a public-address conflict rather than assumed equivalent. |
| Big Brothers Big Sisters of Bucks County | `manual_review` | Greater BucksMont Chamber of Commerce Member Directory | HELD — Greater BucksMont Chamber lists 2875 Old York Road, Jamison, while the official site gives 2875 York Road, Jamison. The street-name variance was treated as unresolved rather than assumed equivalent. |

## Research-only boundary

This is a **review-only research package**. It was not published, deployed, geocoded, map-pinned, written to a production database/API, or used to change account authentication, passwords, waitlists, payments, or any live system. The data does not represent endorsement, eligibility, service availability, quality, safety, price, licensure verification, or ownership determination beyond the exact attributions recorded.

## References

[1]: https://jackandjillmontco.org/business_directory/ "Jack & Jill of America, Inc. Montgomery County, PA Chapter Business Directory"
[2]: https://www.visitbuckscounty.com/blog/stories/post/black-owned-businesses-in-bucks-county/ "Visit Bucks County: Black Owned Businesses in Bucks County"
[3]: https://web.delcochamber.org/directory/results/results.aspx?affcode=MBE "Delaware County Chamber of Commerce MBE Directory"
[4]: https://web.delcochamber.org/2018/Electrical-Contractors "Delaware County Chamber of Commerce Electrical Contractors Directory"
[5]: https://cca.bucksmontchamber.com/37__memberdirectory.aspx "Greater BucksMont Chamber of Commerce Member Directory"
[6]: https://www.chesco.org/resourcedirectory "Chester County Resource Directory"
[7]: https://www.middletownbucks.org/Businesses/Business-Directory "Middletown Township Business Directory"
[8]: https://www.chesco.org/181/Library "Chester County Library System Page"
