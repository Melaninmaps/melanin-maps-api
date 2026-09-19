# Philadelphia city third-depth research report

## Result

This review-only pass retained **23 valid candidates** and held **12 records**. The retained set is deliberately below the 130-record ceiling. It covers retail and grocery; pharmacy and medical/behavioral-health review leads; financial and insurance review leads; barber and salon review leads; fitness and recreation; children and family retail; pet care; bicycle mobility; and a community-services resource. No map coordinates, map pins, production writes, deployment steps, authentication changes, account changes, or payment actions were performed.

## Source families checked

I opened and read the City of Philadelphia commercial-corridor and neighborhood-economic-development pages, the City commercial-corridor dataset, Philadelphia BID Alliance, Park to Broad, Northern Liberties BID, Mount Airy BID, Roxborough Development Corporation and its directory, City Ave District and its directories, East Passyunk Avenue BID and its three directory categories, and Fishtown District and its paginated directory. East Passyunk and Fishtown supplied the retained records because they exposed public individual business pages and linked customer destinations. The remaining families were inspected for coverage, directory structure, and locality but did not produce additional retained records in this pass. [1] [2] [3] [4] [5] [6] [7] [8] [9] [10] [11] [12] [13] [14] [15] [16] [17] [18] [19] [20]

## Verification and retention

Each retained record has a numbered Philadelphia address, listing-level public source URL, and an inspected official website or official customer social destination. `sourceStatus` and `notes` retain concise attribution and route rationale. Health, pharmacy, behavioral-health, optical, medical-aesthetics, financial, insurance, and barber/salon services are designated `regulated_review`; the dataset does not assert licensure, credential, quality, safety, price, availability, outcomes, or status beyond the cited source wording. Lutheran Settlement House is routed as `community_resource`. All other retained records are physical commercial businesses. No ownership, identity, culture, language, protected trait, accessibility, prices, hours, or quality has been inferred. The only owner-like wording surfaced by an official source (The Groove Hound) was not copied into `ownershipDesignations`, because no directory ownership classification was needed for retention.

## Held records

The held file records address conflicts, a closed bank, blocked or non-extractable official destinations, an explicitly unofficial social destination, and one pre-existing duplicate. Every hold has its exact reason in the record’s `sourceStatus` and `notes`, and in the record disposition audit below. None was promoted to candidates.

## Category coverage

| Category | Retained count |
|---|---:|
| beauty/personal care | 3 |
| community_resource | 1 |
| finance | 3 |
| fitness/wellness | 2 |
| grocery | 2 |
| healthcare | 4 |
| mobility | 1 |
| pet care | 2 |
| recreation | 1 |
| recreation/culture | 1 |
| retail | 3 |


The category distribution totals 23 records. At least eight practical daily-need domains were directly inspected: childcare/family-facing retail, home/kitchen goods, finance and insurance, health and pharmacy, grocery, mobility, beauty/barber services, community services, fitness/recreation, pet care, and cultural retail.

## Dedupe process

I read and parsed **3300 JSONL research records** from every prior JSONL under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this output folder. I normalized names and addresses by lowercasing and removing non-alphanumeric characters. I compared normalized `name + city + state + country + address` identities and additionally ran a conservative normalized `name + city + state` screen. Any match was excluded rather than merged. The Black Vulture Gallery Tattoo match is documented in the held file. The script also retained its pre-output duplicate audit artifact at `/home/ubuntu/jobs/job_5EfJGGZw_a0/name_screen.txt`.

## Research-only boundary

This is a research artifact only. It supplies review leads and does not claim or determine eligibility, endorsement, ownership, protected traits, licensure, business status beyond explicit cited wording, quality, safety, pricing, hours, availability, accessibility, or suitability. It does not include geocodes or coordinates and it does not write to an external directory or map.

## Inspected URLs

Every source-family, listing-level, official-site, and official-social URL opened in this pass is enumerated in References. Listing and customer-destination URLs for every emitted record are also present directly in `candidates.jsonl` or `held-candidates.jsonl`.


## Record disposition audit

The following table records the retention or hold reason for every emitted record. These are evidence-routing reasons only, not endorsements or findings about businesses.

| Record | Disposition | Reason |
|---|---|---|
| Mercy LIFE | retained | Public individual East Passyunk Avenue BID directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Pottery Spottery | retained | Public individual East Passyunk Avenue BID directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Passyunk Pilates | retained | Public individual East Passyunk Avenue BID directory record and official studio site inspected; directory lists 1820 E Passyunk Ave and official site identifies it as Studio 1. |
| Unfiltered Medical Aesthetics | retained | Public individual East Passyunk Avenue BID directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| The Vault Beauty Lab | retained | Public individual East Passyunk Avenue BID directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Malvern Behavioral Health Services | retained | Public individual East Passyunk Avenue BID directory record and official facility site inspected; directory lists 1930 S Broad St and official site supplies the 4th Floor detail. |
| H&R Block | retained | Public individual East Passyunk Avenue BID directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| South Philly Food Co-op | retained | Public individual East Passyunk Avenue BID directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| South Philly Yarn and Craft | retained | Public individual East Passyunk Avenue BID directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| South Philly Optical | retained | Public individual East Passyunk Avenue BID directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Bell's Bike Shop | retained | Public individual East Passyunk Avenue BID directory record and official shop site inspected; BID record lists 1320 E Passyunk Ave and official site confirms 1320 E Passyunk Ave, Philadelphia. |
| Fishtown Pharmacy | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| In Flow Studio | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Lutheran Settlement House | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Minnow Lane | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Fresh Image & Grooming | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| The Groove Hound | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Quick Stop | retained | Public individual Fishtown District directory record and its linked official Facebook customer destination inspected; both publish 2518 Frankford Ave, Philadelphia. |
| Groom and Board | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| City Cycling Inc | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| State Farm Insurance – Vince Ovecka Agency | retained | Public individual Fishtown District directory record and official customer destination inspected; both publish the numbered Philadelphia address. |
| Christy H Neill – Ameriprise Financial Services, Inc. | retained | Public individual Fishtown District directory record and official Ameriprise advisor destination inspected; directory lists 254 E Girard Ave and official profile supplies the Ste 1 detail. |
| Toile | retained | Public individual Fishtown District directory record and official store destination inspected; directory lists 1331–33 Frankford Ave and official destination publishes 1333 Frankford Ave, a contained unit number within the directory range. |
| Cara Puff Lactation | held | Held for no reliable inspectable official destination; not retained. |
| CM Neff Knife Shop | held | Held for address conflict; not retained. |
| Barberino’s Hair Studio | held | Held for no reliable inspectable official destination evidence; not retained. |
| HearUSA | held | Held for official destination not reliably supporting the listed physical location; not retained. |
| Phone Pros | held | Held for no reliable inspectable official destination; not retained. |
| Redeemer Tattoo | held | Held for unavailable official customer destination verification; not retained. |
| Flying Pig Picture Frames | held | Held for address conflict; not retained. |
| Tioga Franklin Savings Bank | held | Held as inactive/closed according to the official destination; not retained. |
| Black Vulture Gallery Tattoo | held | Held as duplicate of existing record; not retained. |
| Herringbone Salon | held | Held for public-address conflict; not retained. |
| Ed’s Barber Shoppe | held | Held for no reliable inspectable official customer destination; not retained. |
| Dungan Haircuts | held | Held for no reliable official business-social destination; not retained. |

## References

[1]: https://www.phila.gov/departments/department-of-commerce/for-community-organizations/commercial-corridor-management-and-cleaning/ "City of Philadelphia — Commercial corridor management"
[2]: https://www.phila.gov/departments/department-of-commerce/about-us/divisions/office-of-neighborhood-economic-development/ "City of Philadelphia — Office of Neighborhood Economic Development"
[3]: https://hub.arcgis.com/maps/phl::commercial-corridors "Philadelphia commercial corridors dataset"
[4]: https://phillybidalliance.org/members "Philadelphia BID Alliance"
[5]: https://www.parktobroad.org/network "Park to Broad Business Network"
[6]: https://www.parktobroad.org/directory "Park to Broad directory"
[7]: https://www.explorenorthernliberties.org/ "Northern Liberties BID"
[8]: https://www.mtairybid.com/ "Mount Airy BID"
[9]: https://roxboroughpa.com/ "Roxborough Development Corporation"
[10]: https://roxborough.brightrtravel.com/ "Roxborough directory"
[11]: https://cityave.org/ "City Ave District"
[12]: https://cityave.org/shop/ "City Ave shops"
[13]: https://cityave.org/eat/ "City Ave dining"
[14]: https://www.visiteastpassyunk.com/ "East Passyunk BID home"
[15]: https://www.visiteastpassyunk.com/directory/services "East Passyunk services directory"
[16]: https://www.visiteastpassyunk.com/directory/food-drink "East Passyunk food directory"
[17]: https://www.visiteastpassyunk.com/directory/shops "East Passyunk shops directory"
[18]: https://fishtowndistrict.com/ "Fishtown District home"
[19]: https://fishtowndistrict.com/business-list/category/services "Fishtown multi-page directory"
[20]: https://fishtowndistrict.com/business-list/category/health-and-beauty "Fishtown health/beauty directory"
[21]: https://www.visiteastpassyunk.com/backend/directory-listings/wedge-recovery-center-dz8cb-xttnz-6hdsg-ft4p2-dag79-zy7r7-r5gtl-n3stt-wpmfr-bn2tx "listing"
[22]: https://www.mercylife.org/ "official/customer destination"
[23]: https://www.visiteastpassyunk.com/backend/directory-listings/pottery-spottery "listing"
[24]: https://www.thepotteryspottery.com/ "official/customer destination"
[25]: https://www.visiteastpassyunk.com/backend/directory-listings/passyunkpilates "listing"
[26]: https://passyunkpilates.com/ "official/customer destination"
[27]: https://www.visiteastpassyunk.com/backend/directory-listings/unfilteredmedicalaesthetics "listing"
[28]: https://www.unfilteredmedicalaesthetics.com/ "official/customer destination"
[29]: https://www.visiteastpassyunk.com/backend/directory-listings/thevaultbeautylab "listing"
[30]: https://www.thevaultbeautylab.com/ "official/customer destination"
[31]: https://www.visiteastpassyunk.com/backend/directory-listings/malvernbh "listing"
[32]: https://www.malvernbh.com/ "official/customer destination"
[33]: https://www.visiteastpassyunk.com/backend/directory-listings/hrblock "listing"
[34]: https://www.hrblock.com/local-tax-offices/pennsylvania/philadelphia/2029-s-broad-st/37396/ "official/customer destination"
[35]: https://www.visiteastpassyunk.com/backend/directory-listings/southphillyfoodcoop "listing"
[36]: https://www.southphillyfood.coop/ "official/customer destination"
[37]: https://www.visiteastpassyunk.com/backend/directory-listings/southphillyyarnandcraft "listing"
[38]: https://www.southphillyyarnandcraft.com/ "official/customer destination"
[39]: https://www.visiteastpassyunk.com/backend/directory-listings/southphillyoptical "listing"
[40]: https://www.southphillyoptical.com/ "official/customer destination"
[41]: https://www.visiteastpassyunk.com/backend/directory-listings/bells-bike-shop "listing"
[42]: https://bellsbikeshop.com/ "official/customer destination"
[43]: https://fishtowndistrict.com/business-list/details/fishtown-pharmacy/ "listing"
[44]: https://fishtownpharmacy.com/ "official/customer destination"
[45]: https://fishtowndistrict.com/business-list/details/in-flow-studio/ "listing"
[46]: https://www.inflowwstudio.com/ "official/customer destination"
[47]: https://fishtowndistrict.com/business-list/details/lutheran-settlement-house/ "listing"
[48]: https://www.lutheransettlement.org/ "official/customer destination"
[49]: https://fishtowndistrict.com/business-list/details/minnow-lane/ "listing"
[50]: https://minnowlane.com/ "official/customer destination"
[51]: https://fishtowndistrict.com/business-list/details/fresh-image-grooming/ "listing"
[52]: https://www.freshimageandgrooming.com/ "official/customer destination"
[53]: https://fishtowndistrict.com/business-list/details/the-groove-hound/ "listing"
[54]: https://www.thegroovehound.com/ "official/customer destination"
[55]: https://fishtowndistrict.com/business-list/details/quick-stop/ "listing"
[56]: https://www.facebook.com/quickstop2518/ "official social"
[57]: https://fishtowndistrict.com/business-list/details/groom-and-board/ "listing"
[58]: https://www.groomandboardphl.com/ "official/customer destination"
[59]: https://fishtowndistrict.com/business-list/details/city-cycling-inc/ "listing"
[60]: https://www.citycyclinginc.com/ "official/customer destination"
[61]: https://fishtowndistrict.com/business-list/details/state-farm-insurance-vince-ovecka-agency/ "listing"
[62]: https://www.vinceovecka.com/ "official/customer destination"
[63]: https://fishtowndistrict.com/business-list/details/christy-h-neill-ameriprise-financial-services-inc/ "listing"
[64]: https://www.ameripriseadvisors.com/christy.h.neill/ "official/customer destination"
[65]: https://fishtowndistrict.com/business-list/details/toile/ "listing"
[66]: https://shoptoile.com/ "official/customer destination"
[67]: https://www.visiteastpassyunk.com/backend/directory-listings/cara-puff-lactation "listing"
[68]: https://carapufflactation.com/ "official/customer destination"
[69]: https://www.visiteastpassyunk.com/backend/directory-listings/cm-neff-knife-shop "listing"
[70]: https://www.cmneffcooksupco.com/ "official/customer destination"
[71]: https://www.visiteastpassyunk.com/backend/directory-listings/watkins-drinkery-ekncm "listing"
[72]: https://barberinoshairstudio.com/ "official/customer destination"
[73]: https://www.visiteastpassyunk.com/backend/directory-listings/hearusa "listing"
[74]: https://www.hearusa.com/hearing-centers/details/us/19145/philadelphia/hearusa-south-broad/48023/ "official/customer destination"
[75]: https://fishtowndistrict.com/business-list/details/phone-pros/ "listing"
[76]: https://thephonepros.com/ "official/customer destination"
[77]: https://fishtowndistrict.com/business-list/details/redeemer-tattoo/ "listing"
[78]: https://redeemertattoo.com/ "official/customer destination"
[79]: https://fishtowndistrict.com/business-list/details/flying-pig-picture-frames/ "listing"
[80]: https://www.flyingpigpictureframes.com/ "official/customer destination"
[81]: https://fishtowndistrict.com/business-list/details/tioga-franklin-savings-bank/ "listing"
[82]: https://www.tiogafranklin.com/ "official/customer destination"
[83]: https://fishtowndistrict.com/business-list/details/black-vulture-gallery/ "listing"
[84]: https://www.blackvulturegallery.com/ "official/customer destination"
[85]: https://fishtowndistrict.com/business-list/details/herringbone-salon/ "listing"
[86]: https://www.herringbonesalon.com/ "official/customer destination"
[87]: https://fishtowndistrict.com/business-list/details/eds-barber-shoppe/ "listing"
[88]: https://www.edsbarbershoppe.com/ "official/customer destination"
[89]: https://fishtowndistrict.com/business-list/details/dungan-haircuts/ "listing"
[90]: https://www.facebook.com/pages/Dungan-Haircuts/123547297710885 "official social"
