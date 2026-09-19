# Philadelphia city — high-yield research source report
**Scope and result.** This review-only package covers **Philadelphia city only**. It retains **11** non-duplicate, evidence-complete records from one listing-level neighborhood directory after also inspecting Africatown/ACANA, the African American Chamber of Commerce, and the Greater Philadelphia Hispanic Chamber of Commerce sources. The retained set spans fitness, lodging, health care, floristry, personal care, business services, arts retail, and a nonprofit thrift-resource route. It does not pad toward the requested maximum of 60.
**Evidence standard.** A retained physical location has an inspected public listing-level source, an inspected customer-facing official site, and a numbered Philadelphia street address that is supported without an unresolved conflict. Where an NKCDC ZIP differs from the official site, the retained address intentionally omits ZIP code rather than reproducing the conflict; the street number, Philadelphia locality, and relevant contact evidence were compared. Health care, pharmacy, barbering, tattooing, and permanent makeup are classified as `regulated_review`; this is a review-routing label, not a license certification.
## Counts
| Measure | Count |
|---|---:|
| Retained candidates | 11 |
| Held candidates | 10 |
| `business` | 5 |
| `regulated_review` | 5 |
| `community_resource` | 1 |
| `online_business` | 0 |
| `cultural_place` | 0 |
| `manual_review` retained | 0 |
### Retained category coverage
| Category | Count |
|---|---:|
| business services | 1 |
| community resources | 1 |
| fitness/wellness | 1 |
| healthcare | 2 |
| personal care/body art | 1 |
| personal care/cosmetology | 2 |
| retail | 1 |
| retail/arts | 1 |
| travel/lodging | 1 |
The retained records cover at least five everyday-need categories: **retail**, **fitness/wellness**, **lodging**, **healthcare**, **personal care**, **business services**, and **community resources**. Dining was not used to pad the package.
## Source-family coverage and disposition
| Source family | Public source inspected | Coverage outcome |
|---|---|---|
| Africatown / ACANA | Africatown Business Directory and category routes [1] [2] [3] [4] | Public directory structure and categories were read. Viable names encountered in the source sweep had already appeared in the prior Philadelphia package; none was re-added. |
| African American Chamber of Commerce | Active Member Directory plus retail, food, health, transportation, beauty, electrical, construction, and education categories [5] [6] [7] [8] [9] [10] [11] [12] [13] | Listing-level categories were read across everyday needs. Known prior-package records were not re-added; other listings did not yield an additional evidence-complete nonduplicate city record. |
| Greater Philadelphia Hispanic Chamber of Commerce | Chamber site, membership directory, and member profiles [14] [15] [16] [17] [18] [19] [20] [21] | Member profiles were read. The public directory withholds many contact fields; the review produced four documented holds and excluded two known prior-package records. |
| New Kensington Community Development Corporation (NKCDC) | Business/Community Directory pages and individual listings [22] [23] | Eleven retained records and six held records resulted after official-destination inspection. |
## Dedupe method
Before writing, every JSONL under `/home/ubuntu/directory-research-wave-2026-09-18/` was parsed except the target output directory. I compared a normalized tuple of **name + city + state + country + address**, lowercased with punctuation and spacing removed. I also performed a conservative name-level screen so that known prior-package names with incomplete old fields were not re-added. The prior corpus contained 3,009 JSONL records at screening time. This excluded, among others, Hair Du Jour, Nostalgic Eye Care, Dahlia Rose Wellness Center, All Day Hoagies, A.M. Electric, AR Spruce, Girl Concrete, WEBCO Construction, Philly Banner & Graphics, and Ahida Garcia State Farm. Uncertain same-name entities were not merged.
## Retention and hold rationale
**Retained.** Each final JSONL record documents its listing URL, official destination, address comparison, category, and target kind in `sourceStatus` and `notes`. The principal address normalizations were deliberately narrow: CEX Marketing & Graphic Design/CEX Agency shares the same address and phone; Cloud Nine Pottery/Cloud 9 Clay shares 2527 Frankford Avenue; Care Trust’s official 2534 address lies within the directory range 2532–34; and Circle Thrift’s official 2233 address lies within the directory range 2233–43.
**Held.** Amour et Fleurs is held for an address conflict; Active Mom Fitness lacks official corroboration for the directory’s physical site; Appliance & TV Discounters, Art Machine Productions, and GMS Auto Tag Services lack usable official destinations; Ava’s Farm has an insufficient official landing page; Acore Construction’s official addresses are outside Philadelphia; Plaza Garibaldi’s official domain is an empty index; and The FAIYA Company and Tamalex lack public address and/or official-destination evidence in the inspected Hispanic Chamber profiles. These detailed records are in `held-candidates.jsonl`; they are not candidate records.
## Inspected URL audit log
This log records **every URL opened or attempted** in this pass. “Opened” means page text was read. “Attempted” is retained in the audit when a destination did not resolve or extract; it never serves as retention evidence.
| # | Source family | URL | Inspection / disposition |
|---:|---|---|---|
| 1 | Africatown / ACANA directory | [https://businessdirectory.philaafricatown.org/](https://businessdirectory.philaafricatown.org/) | **opened** — Directory landing page read; it identifies a public directory and categories; its featured listing routes were screened against prior packages. |
| 2 | Africatown / ACANA directory | [https://businessdirectory.philaafricatown.org/listing-category/auto-service/](https://businessdirectory.philaafricatown.org/listing-category/auto-service/) | **attempted** — Category page requested during systematic sweep; automated response did not complete before the source crawl stalled. |
| 3 | Africatown / ACANA directory | [https://businessdirectory.philaafricatown.org/listing-category/beauty-personnal-care/](https://businessdirectory.philaafricatown.org/listing-category/beauty-personnal-care/) | **attempted** — Category page requested during systematic sweep; automated response did not complete before the source crawl stalled. |
| 4 | Africatown / ACANA directory | [https://businessdirectory.philaafricatown.org/listing-category/shopping/](https://businessdirectory.philaafricatown.org/listing-category/shopping/) | **attempted** — Category page requested during systematic sweep; automated response did not complete before the source crawl stalled. |
| 5 | African American Chamber directory | [https://membership.aachamber.com/list](https://membership.aachamber.com/list) | **opened** — Active member directory read; public categories and member-listing architecture inspected. |
| 6 | African American Chamber directory | [https://membership.aachamber.com/list/Search/shopping-specialty-retail-792059](https://membership.aachamber.com/list/Search/shopping-specialty-retail-792059) | **opened** — Retail listings read; Hair Du Jour and Miss Mahogany were already known prior-package records. |
| 7 | African American Chamber directory | [https://membership.aachamber.com/list/Search/restaurants-food-beverages-792064](https://membership.aachamber.com/list/Search/restaurants-food-beverages-792064) | **opened** — Food listings read; All Day Hoagies and other prior-name matches were not re-added. |
| 8 | African American Chamber directory | [https://membership.aachamber.com/list/Search/health-wellness-792050](https://membership.aachamber.com/list/Search/health-wellness-792050) | **opened** — Health/wellness listings read; city candidates were compared against the full dedupe corpus. |
| 9 | African American Chamber directory | [https://membership.aachamber.com/list/Search/transportation-792034](https://membership.aachamber.com/list/Search/transportation-792034) | **opened** — Transportation listings read; no additional eligible Philadelphia commercial record was retained. |
| 10 | African American Chamber directory | [https://membership.aachamber.com/list/Search/fashion-beauty-792060](https://membership.aachamber.com/list/Search/fashion-beauty-792060) | **opened** — Fashion/beauty listings read; Philadelphia candidates were deduplicated or lacked new qualifying evidence. |
| 11 | African American Chamber directory | [https://membership.aachamber.com/list/Search/electrician-792062](https://membership.aachamber.com/list/Search/electrician-792062) | **opened** — Electrical listings read; A.M. Electric was a known prior-package record. |
| 12 | African American Chamber directory | [https://membership.aachamber.com/list/Search/construction-792018](https://membership.aachamber.com/list/Search/construction-792018) | **opened** — Construction listings read; AR Spruce, Girl Concrete, and WEBCO were known prior-package records; other leads were screened. |
| 13 | African American Chamber directory | [https://membership.aachamber.com/list/Search/education-792041](https://membership.aachamber.com/list/Search/education-792041) | **opened** — Education listings read; public-school/childcare leads were prior-package records, out of city, or did not add a qualifying new record. |
| 14 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/](https://www.philahispanicchamber.org/) | **opened** — Chamber home page read; it states it promotes and advocates for Hispanic businesses and links its membership directory. |
| 15 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/membership-directory](https://www.philahispanicchamber.org/membership-directory) | **opened** — Membership directory read; individual company profile routes were identified. |
| 16 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/membership-directory/corporate/3440958](https://www.philahispanicchamber.org/membership-directory/corporate/3440958) | **opened** — Acore Construction profile read; held because its official site supports non-Philadelphia locations. |
| 17 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/membership-directory/corporate/3440965](https://www.philahispanicchamber.org/membership-directory/corporate/3440965) | **opened** — Agua Arc profile read; public business/contact details unavailable; not retained. |
| 18 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/membership-directory/corporate/3440856](https://www.philahispanicchamber.org/membership-directory/corporate/3440856) | **opened** — Plaza Garibaldi profile read; held due empty official domain and no public address. |
| 19 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/membership-directory/corporate/3577766](https://www.philahispanicchamber.org/membership-directory/corporate/3577766) | **opened** — Philly Banner & Graphics profile read; known prior-package record, excluded from re-addition. |
| 20 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/membership-directory/corporate/3440777](https://www.philahispanicchamber.org/membership-directory/corporate/3440777) | **opened** — Ahida Garcia State Farm profile read; known prior-package record, excluded from re-addition. |
| 21 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/membership-directory/corporate/3440794](https://www.philahispanicchamber.org/membership-directory/corporate/3440794) | **opened** — The FAIYA Company profile read; held because public address/contact evidence is unavailable. |
| 22 | Greater Philadelphia Hispanic Chamber | [https://www.philahispanicchamber.org/membership-directory/corporate/3516475](https://www.philahispanicchamber.org/membership-directory/corporate/3516475) | **opened** — Tamalex profile read; held because no public official destination or numbered address is provided. |
| 23 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/](https://nkcdc.org/business-arts/business-directory/) | **opened** — Directory page 1 read; listing-level links and categories covering food, retail, health, home services, beauty, auto and fitness were inspected. |
| 24 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/page/2/](https://nkcdc.org/business-arts/business-directory/page/2/) | **opened** — Directory page 2 read; listing-level links across retail, barbering, pharmacy, design, nonprofit and arts categories were inspected. |
| 25 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/amrita-yoga/](https://nkcdc.org/business-arts/business-directory/amrita-yoga/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 26 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/archway-hotel-plus-reform-and-sev/](https://nkcdc.org/business-arts/business-directory/archway-hotel-plus-reform-and-sev/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 27 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/barefoot-doctor-community-acupuncture-clinic/](https://nkcdc.org/business-arts/business-directory/barefoot-doctor-community-acupuncture-clinic/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 28 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/bee-flowers/](https://nkcdc.org/business-arts/business-directory/bee-flowers/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 29 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/black-vultures-gallery-tattoo/](https://nkcdc.org/business-arts/business-directory/black-vultures-gallery-tattoo/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 30 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/bolt-brow/](https://nkcdc.org/business-arts/business-directory/bolt-brow/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 31 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/born-free-barber/](https://nkcdc.org/business-arts/business-directory/born-free-barber/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 32 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/care-trust-pharmacy/](https://nkcdc.org/business-arts/business-directory/care-trust-pharmacy/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 33 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/cex-marketing-graphic-design/](https://nkcdc.org/business-arts/business-directory/cex-marketing-graphic-design/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 34 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/cloud-nine-pottery/](https://nkcdc.org/business-arts/business-directory/cloud-nine-pottery/) | **retained** — Listing-level source supports physical listing; official site inspected. |
| 35 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/circle-thrift-2/](https://nkcdc.org/business-arts/business-directory/circle-thrift-2/) | **retained as community resource** — Listing-level source supports physical listing; official nonprofit site inspected. |
| 36 | NKCDC directory | [https://nkcdc.org/business-arts/business-directory/amour-et-fleurs/](https://nkcdc.org/business-arts/business-directory/amour-et-fleurs/) | **held** — Held due conflicting address presentation between source listing and official site. |
| 37 | Official business destination | [https://1900icecream.com/](https://1900icecream.com/) | **opened, not retained** — Official page opened but did not provide the NKCDC numbered location; no record retained. |
| 38 | Official business destination | [https://activemomfitness.com/](https://activemomfitness.com/) | **opened, held** — Official page read; it did not corroborate the listed physical location. |
| 39 | Official business destination | [https://amouretfleursflowers.com/](https://amouretfleursflowers.com/) | **opened, held** — Official page read; address conflicts with directory listing. |
| 40 | Official business destination | [https://amritayogawellness.com/](https://amritayogawellness.com/) | **opened, retained** — Official page read; corroborates 1204 Frankford Ave and phone. |
| 41 | Official business destination | [http://appliancetvdiscounters.com/](http://appliancetvdiscounters.com/) | **attempted, held** — Destination could not be resolved as a usable public customer site. |
| 42 | Official business destination | [https://appliancetvdiscounters.com/](https://appliancetvdiscounters.com/) | **attempted, held** — HTTPS variant could not be resolved as a usable public customer site. |
| 43 | Official business destination | [https://archwayfishtown.com/](https://archwayfishtown.com/) | **opened, retained** — Official hotel-residence site read. |
| 44 | Official business destination | [https://archwayfishtown.com/contact/](https://archwayfishtown.com/contact/) | **opened, retained** — Official contact page read; confirms phone and customer contact route. |
| 45 | Official business destination | [http://artmachineproductions.com/](http://artmachineproductions.com/) | **attempted, held** — No usable customer-facing content extracted. |
| 46 | Official business destination | [http://avasfarm.com/](http://avasfarm.com/) | **opened, held** — Rendered only a business name, not sufficient customer/address evidence. |
| 47 | Official business destination | [https://www.barefootclinic.com/](https://www.barefootclinic.com/) | **opened, retained** — Official clinic page read; corroborates street address and phone. |
| 48 | Official business destination | [https://www.bee-flowers.com/](https://www.bee-flowers.com/) | **opened, retained** — Official store page read; corroborates address and phone. |
| 49 | Official business destination | [http://blackvulturegallery.com/](http://blackvulturegallery.com/) | **opened, retained** — Official studio page read; corroborates street address. |
| 50 | Official business destination | [http://boltbrow.com/](http://boltbrow.com/) | **opened, retained** — Official site read; permanent-makeup services inspected. |
| 51 | Official business destination | [https://boltbrow.com/contact](https://boltbrow.com/contact) | **opened, retained** — Official contact page read; corroborates address and phone. |
| 52 | Official business destination | [http://bornfreebarber.com/](http://bornfreebarber.com/) | **opened, retained** — Official site read; corroborates street address. |
| 53 | Official business destination | [http://caretrustpharmacy.com/](http://caretrustpharmacy.com/) | **opened, retained** — Official site read; address falls within directory range and phone agrees. |
| 54 | Official business destination | [http://cexagency.com/](http://cexagency.com/) | **opened, retained** — Official site read; corroborates street address and phone. |
| 55 | Official business destination | [http://circlethrift.com/](http://circlethrift.com/) | **opened, retained** — Official nonprofit site read; corroborates location and nonprofit status. |
| 56 | Official business destination | [http://cloud9clay.com/](http://cloud9clay.com/) | **opened, retained** — Official retail site read; corroborates street address. |
| 57 | Official business destination | [https://gmsautotagservices.business.site/](https://gmsautotagservices.business.site/) | **attempted, held** — No accessible customer-facing content was extracted. |
| 58 | Official business destination | [https://www.acoreconstruction.com/](https://www.acoreconstruction.com/) | **opened, held** — Official site read; location is Pottstown/Houston, not Philadelphia city. |
| 59 | Official business destination | [https://www.plazagaribalditogo.com/](https://www.plazagaribalditogo.com/) | **opened, held** — Opened as empty directory index, not a usable customer destination. |
| 60 | Official business destination | [https://phillybannergraphics.com/](https://phillybannergraphics.com/) | **opened, excluded duplicate** — Official page read; entity already exists in the prior research corpus. |
| 61 | Official business destination | [https://www.ahidagarcia.com/](https://www.ahidagarcia.com/) | **opened, excluded duplicate** — Official page read; entity already exists in the prior research corpus. |
| 62 | Official business destination | [https://www.arspruce.com/](https://www.arspruce.com/) | **opened, excluded duplicate** — Official page read; entity already exists in the prior research corpus. |
| 63 | Official business destination | [http://www.girlconcrete.com/](http://www.girlconcrete.com/) | **opened, excluded duplicate** — Official page read; entity already exists in the prior research corpus. |
| 64 | Official business destination | [https://www.allaroundremoval.net/philadelphia](https://www.allaroundremoval.net/philadelphia) | **opened, not retained** — Official Philadelphia service page read; source/address requirements were not used for a new record. |
| 65 | Official business destination | [https://www.webcoconstruction.com/](https://www.webcoconstruction.com/) | **opened, excluded duplicate** — Official page read; entity already exists in the prior research corpus. |
| 66 | Official business destination | [http://bububeauty.com/](http://bububeauty.com/) | **attempted, not retained** — Destination could not be resolved as a usable public customer site. |
| 67 | Official business destination | [http://hdjsalon.com/](http://hdjsalon.com/) | **opened, excluded duplicate** — Official page read; Hair Du Jour is already in the prior research corpus. |
| 68 | Official business destination | [http://www.nostalgiceyecare.com/](http://www.nostalgiceyecare.com/) | **opened, excluded duplicate** — Official page read; Nostalgic Eye Care is already in the prior research corpus. |
| 69 | Official business destination | [http://www.dahliarosewellness.com/](http://www.dahliarosewellness.com/) | **opened, excluded duplicate** — Official page read; Dahlia Rose Wellness Center is already in the prior research corpus. |
| 70 | Official business destination | [http://www.speaklifetransformation.com/](http://www.speaklifetransformation.com/) | **opened, not retained** — Official site read; no customer-facing numbered location was established. |
| 71 | Official business destination | [http://www.eatibledelghtscatering.com/](http://www.eatibledelghtscatering.com/) | **attempted, not retained** — Destination could not be resolved; no new record retained. |
| 72 | Official business destination | [http://alldayhoagiesandicecream.com/](http://alldayhoagiesandicecream.com/) | **opened, excluded duplicate** — Official site read; All Day Hoagies is a known prior-package record. |
## Research-only boundary
This work is **research only**. No geocoding, latitude/longitude collection, map pins, database or API writes, deployment changes, authentication changes, password changes, waitlist/payment changes, or public publication were performed. The package does not infer protected traits, ownership, culture, language, licenses, quality, safety, price, hours, availability, or accessibility. Cultural, demographic, ownership, and language text was preserved only when an official page explicitly stated it; no retained record required such a designation.
## References

[1]: https://businessdirectory.philaafricatown.org/ "Inspected research source"
[2]: https://businessdirectory.philaafricatown.org/listing-category/auto-service/ "Inspected research source"
[3]: https://businessdirectory.philaafricatown.org/listing-category/beauty-personnal-care/ "Inspected research source"
[4]: https://businessdirectory.philaafricatown.org/listing-category/shopping/ "Inspected research source"
[5]: https://membership.aachamber.com/list "Inspected research source"
[6]: https://membership.aachamber.com/list/Search/shopping-specialty-retail-792059 "Inspected research source"
[7]: https://membership.aachamber.com/list/Search/restaurants-food-beverages-792064 "Inspected research source"
[8]: https://membership.aachamber.com/list/Search/health-wellness-792050 "Inspected research source"
[9]: https://membership.aachamber.com/list/Search/transportation-792034 "Inspected research source"
[10]: https://membership.aachamber.com/list/Search/fashion-beauty-792060 "Inspected research source"
[11]: https://membership.aachamber.com/list/Search/electrician-792062 "Inspected research source"
[12]: https://membership.aachamber.com/list/Search/construction-792018 "Inspected research source"
[13]: https://membership.aachamber.com/list/Search/education-792041 "Inspected research source"
[14]: https://www.philahispanicchamber.org/ "Inspected research source"
[15]: https://www.philahispanicchamber.org/membership-directory "Inspected research source"
[16]: https://www.philahispanicchamber.org/membership-directory/corporate/3440958 "Inspected research source"
[17]: https://www.philahispanicchamber.org/membership-directory/corporate/3440965 "Inspected research source"
[18]: https://www.philahispanicchamber.org/membership-directory/corporate/3440856 "Inspected research source"
[19]: https://www.philahispanicchamber.org/membership-directory/corporate/3577766 "Inspected research source"
[20]: https://www.philahispanicchamber.org/membership-directory/corporate/3440777 "Inspected research source"
[21]: https://www.philahispanicchamber.org/membership-directory/corporate/3440794 "Inspected research source"
[22]: https://www.philahispanicchamber.org/membership-directory/corporate/3516475 "Inspected research source"
[23]: https://nkcdc.org/business-arts/business-directory/ "Inspected research source"
[24]: https://nkcdc.org/business-arts/business-directory/page/2/ "Inspected research source"
[25]: https://nkcdc.org/business-arts/business-directory/amrita-yoga/ "Inspected research source"
[26]: https://nkcdc.org/business-arts/business-directory/archway-hotel-plus-reform-and-sev/ "Inspected research source"
[27]: https://nkcdc.org/business-arts/business-directory/barefoot-doctor-community-acupuncture-clinic/ "Inspected research source"
[28]: https://nkcdc.org/business-arts/business-directory/bee-flowers/ "Inspected research source"
[29]: https://nkcdc.org/business-arts/business-directory/black-vultures-gallery-tattoo/ "Inspected research source"
[30]: https://nkcdc.org/business-arts/business-directory/bolt-brow/ "Inspected research source"
[31]: https://nkcdc.org/business-arts/business-directory/born-free-barber/ "Inspected research source"
[32]: https://nkcdc.org/business-arts/business-directory/care-trust-pharmacy/ "Inspected research source"
[33]: https://nkcdc.org/business-arts/business-directory/cex-marketing-graphic-design/ "Inspected research source"
[34]: https://nkcdc.org/business-arts/business-directory/cloud-nine-pottery/ "Inspected research source"
[35]: https://nkcdc.org/business-arts/business-directory/circle-thrift-2/ "Inspected research source"
[36]: https://nkcdc.org/business-arts/business-directory/amour-et-fleurs/ "Inspected research source"
[37]: https://1900icecream.com/ "Inspected research source"
[38]: https://activemomfitness.com/ "Inspected research source"
[39]: https://amouretfleursflowers.com/ "Inspected research source"
[40]: https://amritayogawellness.com/ "Inspected research source"
[41]: http://appliancetvdiscounters.com/ "Inspected research source"
[42]: https://appliancetvdiscounters.com/ "Inspected research source"
[43]: https://archwayfishtown.com/ "Inspected research source"
[44]: https://archwayfishtown.com/contact/ "Inspected research source"
[45]: http://artmachineproductions.com/ "Inspected research source"
[46]: http://avasfarm.com/ "Inspected research source"
[47]: https://www.barefootclinic.com/ "Inspected research source"
[48]: https://www.bee-flowers.com/ "Inspected research source"
[49]: http://blackvulturegallery.com/ "Inspected research source"
[50]: http://boltbrow.com/ "Inspected research source"
[51]: https://boltbrow.com/contact "Inspected research source"
[52]: http://bornfreebarber.com/ "Inspected research source"
[53]: http://caretrustpharmacy.com/ "Inspected research source"
[54]: http://cexagency.com/ "Inspected research source"
[55]: http://circlethrift.com/ "Inspected research source"
[56]: http://cloud9clay.com/ "Inspected research source"
[57]: https://gmsautotagservices.business.site/ "Inspected research source"
[58]: https://www.acoreconstruction.com/ "Inspected research source"
[59]: https://www.plazagaribalditogo.com/ "Inspected research source"
[60]: https://phillybannergraphics.com/ "Inspected research source"
[61]: https://www.ahidagarcia.com/ "Inspected research source"
[62]: https://www.arspruce.com/ "Inspected research source"
[63]: http://www.girlconcrete.com/ "Inspected research source"
[64]: https://www.allaroundremoval.net/philadelphia "Inspected research source"
[65]: https://www.webcoconstruction.com/ "Inspected research source"
[66]: http://bububeauty.com/ "Inspected research source"
[67]: http://hdjsalon.com/ "Inspected research source"
[68]: http://www.nostalgiceyecare.com/ "Inspected research source"
[69]: http://www.dahliarosewellness.com/ "Inspected research source"
[70]: http://www.speaklifetransformation.com/ "Inspected research source"
[71]: http://www.eatibledelghtscatering.com/ "Inspected research source"
[72]: http://alldayhoagiesandicecream.com/ "Inspected research source"
