# Philadelphia city — fourth-depth Mapping with Melanin source report

## Scope and result

This is a **review-only** research package for **Philadelphia city, Pennsylvania, United States**. It retains **23** non-duplicate, evidence-complete records and holds **15** leads. The result is intentionally below the 160-record ceiling; it is not padded. Every retained physical business has a public listing-level source, an inspected official customer-facing website or official business-social destination, and a source-supported numbered Philadelphia address without an unresolved conflict. Noncommercial organizations are routed as `community_resource`, and the two cultural venues are routed as `cultural_place`.

The pass purposefully shifted away from the source families used in the preceding three Philadelphia passes. It concentrated on everyday needs that had been less represented in the cumulative manifest: **groceries; household goods; mobility; sewing/repair-adjacent retail; childcare/family education; disability and community resources; legal-help resources; cultural venues; recreation/fitness; flowers and gifts; laundry/cleaning; and home services**. The laundry/cleaning and home-service source records that did not meet the official-destination standard remain in the hold file rather than being promoted.

## Final counts

| Measure | Count |
|---|---:|
| Retained candidates | 23 |
| Held candidates | 15 |
| `physical_business` | 14 |
| `regulated_review` | 1 |
| `community_resource` | 6 |
| `cultural_place` | 2 |
| `online_business` | 0 |

### Retained category counts

| Category | Count |
|---|---:|
| childcare/family | 1 |
| community resources | 2 |
| cultural venue | 2 |
| disability/community resources | 4 |
| fitness/recreation | 1 |
| food retail | 1 |
| grocery | 3 |
| home goods | 2 |
| mobility | 1 |
| retail | 6 |


## Fresh public source families inspected

| Fresh source family | Listing/directory pages inspected | Outcome |
|---|---|---|
| Reading Terminal Market Merchant Directory | Merchant directory, map/directory, and individual merchant profiles | 5 retained from public-market merchant records; 3 held for address conflicts. |
| South 9th Street Italian Market Merchant Directory | Merchant index, grocery/produce and housewares category pages, and individual merchant pages | 2 retained; 2 held for a missing numbered address or unavailable official destination. |
| Historic Germantown Business Members Directory | Paged member directory and individual business records | 6 retained, 7 held/excluded after official-destination or duplicate checks. |
| Historic Germantown Cultural Directory | Individual cultural-place records | 1 retained cultural place; one existing-record duplicate held. |
| Midtown Village Merchants Association Business Directory | Directory landing, retail, fitness, art, and real-estate category pages plus individual profiles | 4 retained; 1 held for inadequate official-site verification. |
| City of Philadelphia Health Information Portal — Disability Health Resources | Public resource directory page with named organizations, addresses, phones, and official links | 6 retained as noncommercial community resources; 1 held for a parked official site. |
| City of Philadelphia Parks & Recreation | Department landing, locations page, and public finder | Inspected as a City-published recreation/cultural directory family. Its accessible extraction exposed category counts but not record-level, numbered location pages suitable for retention. |
| Bicycle Coalition of Greater Philadelphia shop directory | Public shop finder and public WordPress API route | Inspected as a mobility directory family. The rendered finder did not expose record-level public shop data; no record used. |
| Center City Business Association member directory | Directory landing and member-directory endpoint | Inspected; listing content was dynamically loaded and not extractable for record-level verification. |

The first six rows are distinct public source families used as listing-level evidence for retained/held candidates; the remaining three were separately inspected fresh families that broadened category coverage but did not yield suitable records.

## Retention and hold method

**Retention.** A business or place is retained only where its own public listing/directory record, official website or business-social destination, and numbered Philadelphia address were reviewed. The Reading Terminal Market merchant address is represented as `1136 Arch St, Philadelphia, PA 19107`: individual merchant profiles identify the merchants as market vendors, and the market publishes that numbered address. No coordinates, geocodes, latitude/longitude values, or map pins were collected.

**Classification.** The independent pre-K–12 school is routed to `regulated_review` for review handling of education/childcare-related service; this label does not state that a license, credential, quality, safety, availability, price, or outcome has been verified. Community Legal Services and Philadelphia Legal Assistance are noncommercial organizations described by their official sources as providing free legal assistance; they are therefore `community_resource`, not commercial law records. The Arc of Philadelphia, Vision for Equality, Liberty Resources, and Disability Rights Pennsylvania are also noncommercial community-resource records. The Black Writers Museum and Morton Contemporary Gallery are routed as `cultural_place`.

**Holds.** Holds preserve evidence limitations rather than decisions about quality, safety, operating status, accessibility, eligibility, or suitability. Specific reasons include address conflict (Contessa’s French Linens; Bee Natural; Downtown Cheese; Kinesics Dance Dynamics), missing numbered address (Liberty Fresh Produce), missing or uninspectable official destination (El Pueblo Mini Mart, L.E.W Residential and Commercial Services, Shanks Cleaning Service), insufficient official physical-location evidence (Iconic Barbershop; Paper on Pine), a destination yielding no usable content (Cane-Rush), a parked official site (VisionLink), and conservative project-corpus duplicate prevention (The Colored Girls Museum, Uncle Bobbie’s Coffee & Books, The Movement Philly).

## Deduplication

Before emission, the script parsed every JSONL record beneath `/home/ubuntu/directory-research-wave-2026-09-18`, excluding this output directory. The previous-corpus index contained **3420** rows. It compared the normalized tuple **name + city + state + country + address** after lowercasing, Unicode folding, ampersand harmonization, and removal of nonalphanumeric characters. It also ran a conservative normalized **name + city + state + country** same-name screen. Any prospective candidate with either prior key would have been rejected; the final candidate set produced zero such matches. Uncertain same-name and/or address-variant matches were not merged and were held rather than re-added.

## Complete inspected-URL audit

“Opened” means the page text was read or the public endpoint was called. “Attempted” records an inaccessible, parked, or non-extractable URL and is never retention evidence. This ledger includes all web URLs inspected in this pass, including source-family coverage pages, individual directory records, official destinations, and unretained checks.

| # | Source family / destination | URL | Inspection and disposition |
|---:|---|---|---|
| 1 | Reading Terminal Market | [https://readingterminalmarket.org/merchant-directory/](https://readingterminalmarket.org/merchant-directory/) | opened — merchant-directory structure and individual profile routes reviewed. |
| 2 | Reading Terminal Market | [https://readingterminalmarket.org/market-map-directory/](https://readingterminalmarket.org/market-map-directory/) | opened — market address and directory/map route reviewed. |
| 3 | Reading Terminal Market | [https://readingterminalmarket.org/merchant/dinics/](https://readingterminalmarket.org/merchant/dinics/) | opened — retained merchant listing. |
| 4 | Reading Terminal Market | [https://readingterminalmarket.org/merchant/bee-natural/](https://readingterminalmarket.org/merchant/bee-natural/) | opened — merchant profile reviewed; held from candidate set after official address conflict/out-of-city official address. |
| 5 | Reading Terminal Market | [https://readingterminalmarket.org/merchant/golden-fish-market/](https://readingterminalmarket.org/merchant/golden-fish-market/) | opened — retained merchant listing. |
| 6 | Reading Terminal Market | [https://readingterminalmarket.org/merchant/contessas-french-linens/](https://readingterminalmarket.org/merchant/contessas-french-linens/) | opened — held for address conflict. |
| 7 | Reading Terminal Market | [https://readingterminalmarket.org/merchant/amazulu/](https://readingterminalmarket.org/merchant/amazulu/) | opened — retained merchant listing. |
| 8 | Reading Terminal Market | [https://readingterminalmarket.org/merchant/downtown-cheese/](https://readingterminalmarket.org/merchant/downtown-cheese/) | opened — listing reviewed; no official destination was advanced. |
| 9 | Reading Terminal Market | [https://readingterminalmarket.org/merchant/iovine-brothers-produce/](https://readingterminalmarket.org/merchant/iovine-brothers-produce/) | opened — retained merchant listing. |
| 10 | Reading Terminal Market | [https://readingterminalmarket.org/merchant/herbiary/](https://readingterminalmarket.org/merchant/herbiary/) | opened — retained merchant listing. |
| 11 | Official destination | [http://www.beenaturalllc.com/](http://www.beenaturalllc.com/) | opened — official site gives Delaware address; not retained as a Philadelphia physical candidate. |
| 12 | Official destination | [http://www.urbankarmawear.com/](http://www.urbankarmawear.com/) | opened — retained Amazulu official customer website. |
| 13 | Official destination | [https://contessasfrenchlinens.blogspot.com/](https://contessasfrenchlinens.blogspot.com/) | opened — held due conflicting address presentation. |
| 14 | Official destination | [http://tommydinics.com/](http://tommydinics.com/) | opened — retained DiNic’s official customer website. |
| 15 | Official destination | [https://www.instagram.com/golden_fish_market/](https://www.instagram.com/golden_fish_market/) | opened — retained Golden Fish Market official social destination. |
| 16 | Official destination | [http://www.iovine.com/](http://www.iovine.com/) | attempted — hostname did not resolve in public extraction; official Instagram was inspected instead. |
| 17 | Official destination | [https://www.instagram.com/iovinebrothersproduce/](https://www.instagram.com/iovinebrothersproduce/) | opened — retained Iovine Brothers official social destination. |
| 18 | Official destination | [https://www.herbiary.com/](https://www.herbiary.com/) | opened — retained Herbiary official customer site. |
| 19 | South 9th Street Italian Market | [https://italianmarketphilly.org/merchants/](https://italianmarketphilly.org/merchants/) | opened — merchant index and individual routes reviewed. |
| 20 | South 9th Street Italian Market | [https://italianmarketphilly.org/merchants/groceries-produce/](https://italianmarketphilly.org/merchants/groceries-produce/) | opened — grocery category reviewed. |
| 21 | South 9th Street Italian Market | [https://italianmarketphilly.org/merchants/housewares/](https://italianmarketphilly.org/merchants/housewares/) | opened — home-goods category reviewed. |
| 22 | South 9th Street Italian Market | [https://italianmarketphilly.org/merchants/services/](https://italianmarketphilly.org/merchants/services/) | attempted — no extractable public content. |
| 23 | South 9th Street Italian Market | [https://italianmarketphilly.org/merchant/el-pueblo-mini-mart/](https://italianmarketphilly.org/merchant/el-pueblo-mini-mart/) | opened — held for no usable official customer destination. |
| 24 | South 9th Street Italian Market | [https://italianmarketphilly.org/merchant/liberty-fresh-produce/](https://italianmarketphilly.org/merchant/liberty-fresh-produce/) | opened — held for no numbered address. |
| 25 | South 9th Street Italian Market | [https://italianmarketphilly.org/merchant/fantes-cookware-shop/](https://italianmarketphilly.org/merchant/fantes-cookware-shop/) | opened — retained merchant listing. |
| 26 | South 9th Street Italian Market | [https://italianmarketphilly.org/merchant/di-bruno-bros/](https://italianmarketphilly.org/merchant/di-bruno-bros/) | opened — retained merchant listing. |
| 27 | Official destination | [https://fantes.com/](https://fantes.com/) | opened — retained Fante’s official customer site. |
| 28 | Official destination | [https://dibruno.com/](https://dibruno.com/) | opened — retained Di Bruno Bros. official customer site. |
| 29 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/](https://historicgermantownpa.org/directory-historic_germantown/) | opened — first page of 33-record member directory reviewed. |
| 30 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/?_page=2&num=20&sort=](https://historicgermantownpa.org/directory-historic_germantown/?_page=2&num=20&sort=) | opened — second page of directory reviewed. |
| 31 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/paper-trail-bike-cafe/](https://historicgermantownpa.org/directory-historic_germantown/listing/paper-trail-bike-cafe/) | opened — retained listing. |
| 32 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/uncle-bobbies-coffee-books/](https://historicgermantownpa.org/directory-historic_germantown/listing/uncle-bobbies-coffee-books/) | opened — excluded as prior-corpus duplicate. |
| 33 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/kinesics-dance-dynamics/](https://historicgermantownpa.org/directory-historic_germantown/listing/kinesics-dance-dynamics/) | opened — held for address conflict. |
| 34 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/gaffney-fabrics-inc/](https://historicgermantownpa.org/directory-historic_germantown/listing/gaffney-fabrics-inc/) | opened — retained listing. |
| 35 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/pomelo-flower-plant-giftshop/](https://historicgermantownpa.org/directory-historic_germantown/listing/pomelo-flower-plant-giftshop/) | opened — retained listing. |
| 36 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/william-penn-charter-school/](https://historicgermantownpa.org/directory-historic_germantown/listing/william-penn-charter-school/) | opened — retained listing. |
| 37 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/the-movement-philly/](https://historicgermantownpa.org/directory-historic_germantown/listing/the-movement-philly/) | opened — excluded by conservative same-name duplicate screen. |
| 38 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/l-e-w-residential-and-commercial-services/](https://historicgermantownpa.org/directory-historic_germantown/listing/l-e-w-residential-and-commercial-services/) | opened — held for missing official destination. |
| 39 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/cane-rush/](https://historicgermantownpa.org/directory-historic_germantown/listing/cane-rush/) | opened — held because official destination yielded no content. |
| 40 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/bargain-thrift-center/](https://historicgermantownpa.org/directory-historic_germantown/listing/bargain-thrift-center/) | opened — retained listing. |
| 41 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/shanks-cleaning-service-llc/](https://historicgermantownpa.org/directory-historic_germantown/listing/shanks-cleaning-service-llc/) | opened — held for missing official destination. |
| 42 | Historic Germantown | [https://historicgermantownpa.org/directory-historic_germantown/listing/iconic-barbershop/](https://historicgermantownpa.org/directory-historic_germantown/listing/iconic-barbershop/) | opened — held for insufficient official location evidence. |
| 43 | Historic Germantown cultural | [https://historicgermantownpa.org/black-writers-museum/](https://historicgermantownpa.org/black-writers-museum/) | opened — retained cultural listing. |
| 44 | Historic Germantown cultural | [https://historicgermantownpa.org/the-colored-girls-museum/](https://historicgermantownpa.org/the-colored-girls-museum/) | opened — held as prior-corpus duplicate. |
| 45 | Official destination | [https://papertrailbikecafe.com/](https://papertrailbikecafe.com/) | opened — retained Paper Trail official site. |
| 46 | Official destination | [https://www.kinesicsdance.com/](https://www.kinesicsdance.com/) | opened — held due address conflict with listing. |
| 47 | Official destination | [https://www.gaffneyfabrics.com/](https://www.gaffneyfabrics.com/) | opened — retained Gaffney official site. |
| 48 | Official destination | [https://www.shop-pomelo.com/](https://www.shop-pomelo.com/) | opened — retained Pomelo official site. |
| 49 | Official destination | [https://www.penncharter.com/](https://www.penncharter.com/) | opened — retained William Penn Charter official site. |
| 50 | Official destination | [https://bargainthriftcenter.com/](https://bargainthriftcenter.com/) | opened — retained Bargain Thrift Center official site. |
| 51 | Official destination | [https://thebwm.org/](https://thebwm.org/) | opened — retained Black Writers Museum official site. |
| 52 | Official destination | [https://cane-rush.business.site/](https://cane-rush.business.site/) | attempted — no extractable public content; held. |
| 53 | Official destination | [https://iconicbarber.com/](https://iconicbarber.com/) | opened — insufficient physical-location evidence; held. |
| 54 | Midtown Village | [https://midtownvillagephilly.com/business-directory/](https://midtownvillagephilly.com/business-directory/) | opened — category architecture reviewed. |
| 55 | Midtown Village | [https://midtownvillagephilly.com/business_category/fitness/](https://midtownvillagephilly.com/business_category/fitness/) | opened — fitness listings reviewed. |
| 56 | Midtown Village | [https://midtownvillagephilly.com/business_category/retail-shops/](https://midtownvillagephilly.com/business_category/retail-shops/) | opened — retail listings reviewed. |
| 57 | Midtown Village | [https://midtownvillagephilly.com/business_category/art/](https://midtownvillagephilly.com/business_category/art/) | opened — art listing reviewed. |
| 58 | Midtown Village | [https://midtownvillagephilly.com/business_category/real-estate/](https://midtownvillagephilly.com/business_category/real-estate/) | opened — housing/real-estate category reviewed; no record retained. |
| 59 | Midtown Village | [https://midtownvillagephilly.com/business/open-house/](https://midtownvillagephilly.com/business/open-house/) | opened — retained listing. |
| 60 | Midtown Village | [https://midtownvillagephilly.com/business/paper-on-pine/](https://midtownvillagephilly.com/business/paper-on-pine/) | opened — held for inadequate official-site evidence. |
| 61 | Midtown Village | [https://midtownvillagephilly.com/business/verde/](https://midtownvillagephilly.com/business/verde/) | opened — retained listing. |
| 62 | Midtown Village | [https://midtownvillagephilly.com/business/optimal-sport-health-club/](https://midtownvillagephilly.com/business/optimal-sport-health-club/) | opened — retained listing. |
| 63 | Midtown Village | [https://midtownvillagephilly.com/business/morton-contemporary/](https://midtownvillagephilly.com/business/morton-contemporary/) | opened — retained listing. |
| 64 | Official destination | [http://www.openhouseliving.com/](http://www.openhouseliving.com/) | opened — retained Open House official site. |
| 65 | Official destination | [http://www.paperonpine.com/](http://www.paperonpine.com/) | opened — insufficient listing corroboration; held. |
| 66 | Official destination | [http://www.verdephiladelphia.com/](http://www.verdephiladelphia.com/) | opened — retained Verde official site. |
| 67 | Official destination | [http://www.optimalsporthealthclubs.com/](http://www.optimalsporthealthclubs.com/) | opened — retained Optimal official site. |
| 68 | Official destination | [https://mortoncontemporarygallery.com/](https://mortoncontemporarygallery.com/) | opened — retained Morton Contemporary official site. |
| 69 | City of Philadelphia | [https://hip.phila.gov/emergency-response/disability-health-resources/](https://hip.phila.gov/emergency-response/disability-health-resources/) | opened — public disability/community resource directory and address records reviewed. |
| 70 | Official destination | [https://www.arcphiladelphia.org/](https://www.arcphiladelphia.org/) | opened — retained The Arc official site. |
| 71 | Official destination | [https://www.visionforequality.org/](https://www.visionforequality.org/) | opened — retained Vision for Equality official site. |
| 72 | Official destination | [https://www.asb.org/](https://www.asb.org/) | opened — parked future-home page; held VisionLink route. |
| 73 | Official destination | [https://libertyresources.net/](https://libertyresources.net/) | opened — redirected to/identified official Liberty Resources destination; retained. |
| 74 | Official destination | [https://www.disabilityrightspa.org/](https://www.disabilityrightspa.org/) | opened — retained Disability Rights Pennsylvania official site. |
| 75 | Official destination | [https://clsphila.org/](https://clsphila.org/) | opened — retained Community Legal Services official site. |
| 76 | Official destination | [https://philalegal.org/](https://philalegal.org/) | opened — retained Philadelphia Legal Assistance official site. |
| 77 | City of Philadelphia | [https://www.phila.gov/departments/division-of-housing-and-community-development/get-help/get-home-improvement-help/](https://www.phila.gov/departments/division-of-housing-and-community-development/get-help/get-home-improvement-help/) | opened — page extraction did not expose usable provider records. |
| 78 | City of Philadelphia Parks & Recreation | [https://www.phila.gov/departments/philadelphia-parks-recreation/](https://www.phila.gov/departments/philadelphia-parks-recreation/) | opened — department, directory routes, and category coverage reviewed. |
| 79 | City of Philadelphia Parks & Recreation | [https://www.phila.gov/departments/philadelphia-parks-recreation/our-locations/](https://www.phila.gov/departments/philadelphia-parks-recreation/our-locations/) | opened — official location-directory route reviewed. |
| 80 | City of Philadelphia Parks & Recreation | [https://www.phila.gov/parks-rec-finder/#/activities](https://www.phila.gov/parks-rec-finder/#/activities) | opened — public finder reviewed; record-level numbered location fields not exposed. |
| 81 | City of Philadelphia Parks & Recreation | [https://www.phila.gov/venues/the-dell-music-center/](https://www.phila.gov/venues/the-dell-music-center/) | attempted — no extractable public content. |
| 82 | Bicycle Coalition | [https://bicyclecoalition.org/shops/](https://bicyclecoalition.org/shops/) | opened — dynamic shop finder reviewed; no individual public records extracted. |
| 83 | Bicycle Coalition | [https://bicyclecoalition.org/wp-json/wp/v2/](https://bicyclecoalition.org/wp-json/wp/v2/) | opened — public API route inspected for directory data; not used as candidate evidence. |
| 84 | Center City Business Association | [https://www.centercitybusiness.org/directory](https://www.centercitybusiness.org/directory) | opened — dynamically loaded directory route reviewed. |
| 85 | Center City Business Association | [https://my.centercitybusiness.org/memberdirectory/Search](https://my.centercitybusiness.org/memberdirectory/Search) | attempted — no extractable directory content. |


## Research-only boundary

This package is **research only**. It does not determine business eligibility, endorsement, ownership, protected traits, culture, language, licensure, safety, quality, price, operating hours, availability, accessibility, or suitability. Ownership and protected-trait designations are null unless explicitly needed from a source; none is asserted in the final retained rows. No search-result snippet is evidence. No geocoding, coordinates, map pins, production/API/database writes, deployment, publication, account or authentication changes, password changes, waitlist changes, payment actions, form submissions, or purchases were performed.
