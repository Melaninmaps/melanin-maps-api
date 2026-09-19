# New Jersey Fourth-Depth Review-Only Mapping — Source Report

## Result and boundary

This research-only pass retained **28 candidates** and held **14 candidates**. It covers New Jersey statewide with a deliberate concentration in **South Jersey (Glassboro)** and **Philadelphia commuter-area municipalities (Maplewood, Millburn/Short Hills, Scotch Plains, Metuchen)**, plus Phillipsburg. It is a local review queue, not a map, recommendation, or operational directory. No geocoding, latitude/longitude, map pins, deployment, production/API/database action, payment action, account/authentication change, or other external write was performed.

A `listed` source status means only that a public directory showed the record when inspected. It is not a statement about current operation, quality, safety, pricing, hours, inventory, accessibility, ownership, protected traits, culture, language, credentialing, licensure, or availability. Ownership and protected-trait fields are null because none is inferred from source placement or any other context.

## Fresh source-family coverage

| Source family | Listing-level sources inspected | Candidate outcome |
|---|---|---|
| Metuchen Downtown Alliance (downtown/BID) | Food & Dining; Shopping; Pet Care; Home & Garden category lists | 8 retained; 3 held |
| Township of Scotch Plains (municipal) | Retail & Specialty Stores; Restaurants & Food Establishments lists | 7 retained; 2 held |
| Borough of Glassboro (municipal) | Borough business directory | 3 retained |
| Town of Phillipsburg (municipal) | Retail and Laundromats category lists; two individual record pages | 1 retained; 6 held |
| Township of Maplewood (municipal) | Township business directory | 6 retained |
| Explore Millburn–Short Hills (downtown) | Business directory | 3 retained; 3 held |
| Borough of New Providence (municipal) | Business-directory landing page and CivicPlus directory destination | no record retained |
| Pompton Lakes BID (downtown/BID) | BID directory | no extractable listing record retained |


All eight source families are **fresh to this pass**. Six yielded retained records. The coverage includes municipal and downtown/BID listing sources and spans at least **ten everyday-need categories inspected**: food and beverage; food retail; retail; home and garden; pet care; laundry; arts and crafts/culture; fitness; photography/media; technology services; and health retail. Regulation-sensitive pharmacy was routed to `regulated_review`; no licensure determination was made.

## Retention and hold rules

Physical candidates were retained only where the listing-list page provided a business name, category, and numbered New Jersey address, and a customer-facing official site was inspected. A record was held if that destination was blocked/unreadable, unrelated, permanently-closure-signaled, generic, or conflicted with the listing address. The source-supported numbered address appears in every retained physical record. Source and destination facts are summarized strictly in each record’s `notes` field.

## Dedupe method

Before emission, the workflow parsed **112 prior JSONL files / 3,420 valid rows** under `/home/ubuntu/directory-research-wave-2026-09-18`, excluding this output directory. It normalized Unicode, case, punctuation, and spacing for `name + city + state + country + address`. It blocked exact five-part collisions and additionally ran a conservative `name + city + state` screen. The same conservative screen was also applied within candidate and held outputs and across them. **No emitted record collided**; uncertain matches were not merged. This preserves prior records rather than re-adding them.

## Counts

| Category | Retained | Held | Total reviewed output |
|---|---:|---:|---:|
| arts_crafts | 1 | 0 | 1 |
| arts_culture | 1 | 0 | 1 |
| fitness | 0 | 1 | 1 |
| food_beverage | 10 | 1 | 11 |
| food_retail | 3 | 0 | 3 |
| health_retail | 1 | 0 | 1 |
| home_garden | 3 | 3 | 6 |
| home_services | 0 | 1 | 1 |
| laundry_services | 0 | 1 | 1 |
| pet_care | 1 | 1 | 2 |
| photography_media | 1 | 1 | 2 |
| retail | 6 | 4 | 10 |
| technology_services | 1 | 1 | 2 |
| **Total** | **28** | **14** | **42** |

### Target-kind counts

| Target kind | Retained | Held |
|---|---:|---:|
| manual_review | 0 | 14 |
| physical_business | 27 | 0 |
| regulated_review | 1 | 0 |

## Complete candidate/hold source and destination inspection log

Each row below provides the listing-level list or directory page that was inspected and the official customer destination inspected for that lead. URLs are public; search snippets were used only for discovery and are not evidence.

| Record | Listing-level source inspected | Official customer destination inspected | Disposition |
|---|---|---|---|
| Bonney's BBQ | https://www.downtownmetuchen.org/directory/food-dining/ | https://www.bonneysbbq.com/ | retained |
| Café Paris | https://www.downtownmetuchen.org/directory/food-dining/ | https://www.thecafeparis.com/index_home.html | retained |
| Khorasan Kabab | https://www.downtownmetuchen.org/directory/food-dining/ | https://www.khorasankabab.com/ | retained |
| FK Living | https://www.downtownmetuchen.org/directory/shopping/ | http://www.fkliving.com/ | retained |
| Ragingeek | https://www.downtownmetuchen.org/directory/shopping/ | https://www.ragingeek.com/ | retained |
| Woof Gang Bakery & Grooming | https://www.downtownmetuchen.org/directory/pet-care/ | https://woofgangbakery.com/pages/locations/metuchen | retained |
| Gardenias Floral | https://www.downtownmetuchen.org/directory/home-garden/ | https://gardeniasfloral.com/ | retained |
| See More Appliances & Television | https://www.downtownmetuchen.org/directory/home-garden/ | http://www.seemoreappliance.com/ | retained |
| Barry's Frame Shoppe | https://www.scotchplainsnj.gov/departments/71-business-directory/1306-retail-specialty-stores-directory | http://barrysframeshop.com/ | retained |
| BISC Pottery | https://www.scotchplainsnj.gov/departments/71-business-directory/1306-retail-specialty-stores-directory | https://www.biscpotterystudio.com/ | retained |
| ArtSpace 4U | https://www.scotchplainsnj.gov/departments/71-business-directory/1306-retail-specialty-stores-directory | https://www.artspace4u.com/ | retained |
| Black Drop Coffee | https://www.scotchplainsnj.gov/departments/71-business-directory/1305-restaurants-food-establishments-directory | https://www.blackdropcoffeenj.com/ | retained |
| Darby Road Public House & Restaurant | https://www.scotchplainsnj.gov/departments/71-business-directory/1305-restaurants-food-establishments-directory | https://www.darbyroadpub.com/ | retained |
| John's Meat Market | https://www.scotchplainsnj.gov/departments/71-business-directory/1305-restaurants-food-establishments-directory | https://www.johnsmarket.com/ | retained |
| Tom the Green Grocer | https://www.scotchplainsnj.gov/departments/71-business-directory/1305-restaurants-food-establishments-directory | https://www.tomthegreengrocer.com/ | retained |
| High Grounds Coffee Roasters | https://www.glassboro.org/business-directory | https://www.highgroundscoffeeroasters.com/ | retained |
| Axe & Arrow Brewing | https://www.glassboro.org/business-directory | https://axeandarrowbrewing.com/about/ | retained |
| Cali Shakes | https://www.glassboro.org/business-directory | https://www.calishakes.com/location/calishakes-glassboro/ | retained |
| Medimax Pharmacy | https://phillipsburgnj.org/business-directory/wpbdp_category/retail/ | http://www.medimaxpharmacy.com/ | retained |
| A Paper Hat | https://www.maplewoodnj.gov/business | https://apaperhat.com/ | retained |
| Anna Herbst Photography | https://www.maplewoodnj.gov/business | https://www.annaherbstphoto.com/index | retained |
| AV Luxury Design | https://www.maplewoodnj.gov/business | https://avluxurydesign.com/home | retained |
| Baker Street Market | https://www.maplewoodnj.gov/business | https://www.bakerstmarket.com/ | retained |
| Barn Bird Kitchen | https://www.maplewoodnj.gov/business | https://barnbirdkitchen.com/ | retained |
| Brave Floral | https://www.maplewoodnj.gov/business | https://bravefloral.com/ | retained |
| Jhanna Fine Jewelry | https://exploremillburnshorthills.org/directory/ | https://www.jhannafinejewelry.com/contact | retained |
| Jia Boutique | https://exploremillburnshorthills.org/directory/ | https://jia-boutique.com/ | retained |
| Joey's Tap & Tavern | https://exploremillburnshorthills.org/directory/ | https://joeystaptavern.com/ | retained |
| Genus Boni | https://www.downtownmetuchen.org/directory/shopping/ | http://www.genusboni.com/ | held: the Downtown Alliance Shopping list supplies this name and address, but the inspected destination identifies itself as ‘genus boni’ and shows London content without a usable Metuchen address or sufficient identity confirmation. |
| Pedigree Pet Spa | https://www.downtownmetuchen.org/directory/pet-care/ | http://www.pedigreepetspa.com/ | held: the Downtown Alliance Pet Care list supplies name and numbered address; the listed official website could not be resolved by the public extractor, so the official customer destination could not be inspected. |
| Adamer Interiors | https://www.downtownmetuchen.org/directory/home-garden/ | https://adamerinteriors.com/ | held: the Downtown Alliance Home & Garden list supplies name and numbered address; the inspected official domain was a password-gated ‘Opening soon’ storefront, so it did not provide usable customer-facing identity/location confirmation. |
| Bubbles & Baskets Laundromat | https://www.scotchplainsnj.gov/departments/71-business-directory/1306-retail-specialty-stores-directory | https://bubblesandbaskets.com/ | held: the municipal directory supplies name and numbered address; the inspected customer website returned a 403 Forbidden response, leaving the customer destination uninspectable. |
| First Option Juice Hub and Salad Bar | https://www.scotchplainsnj.gov/departments/71-business-directory/1305-restaurants-food-establishments-directory | https://www.firstoptionhealthcorner.com/ | held: the municipal directory supplies name and numbered address; no public content could be extracted from the listed customer website, so identity/address was not confirmed. |
| Cycle Funattic | https://phillipsburgnj.org/business-directory/wpbdp_category/retail/ | http://www.cyclefunattic.com/ | held: the Town directory lists 403 South Main Street, Phillipsburg. The inspected official site says its current store is at 1091 Delabole Junction Rd, Pen Argyl, PA; this is an unresolved address/state conflict. |
| Dave Phillips Music & Sound | https://phillipsburgnj.org/business-directory/wpbdp_category/retail/ | http://www.davephillipsmusicstore.com/ | held: the Town directory supplies a Phillipsburg record, but the inspected official site’s December 2023 post says ‘permanent closure’; retained only as a reviewer signal, not an operational claim. |
| Helen's Floral Shoppe Inc | https://phillipsburgnj.org/business-directory/wpbdp_category/retail/ | http://www.helensfloralshoppe.com/ | held: the Town directory lists this address, while the inspected official site identifies Helen’s Floral Shoppe in Phillipsburg but did not yield a verifiable numbered business address; location linkage is insufficient under the retention rule. |
| Jewell Computing Solutions | https://phillipsburgnj.org/business-directory/wpbdp_category/retail/ | http://www.jewellcomputing.com/ | held: the Town directory supplies a Phillipsburg computer-repair record, but the inspected listed domain displays unrelated Ontario casino content; identity mismatch. |
| Jiorle's Office Supplies | https://phillipsburgnj.org/business-directory/wpbdp_category/retail/ | http://www.jiorles.com/ | held: the Town directory supplies name and numbered address; the listed customer domain could not be resolved by the public extractor. |
| The Lock Doctor | https://phillipsburgnj.org/business-directory/wpbdp_category/retail/ | http://www.thelockdoctor.com/ | held: the Town directory supplies name and numbered address; no public content could be extracted from the listed customer website. |
| K+Co Living | https://exploremillburnshorthills.org/directory/ | https://kbwinteriors.com/ | held: the downtown directory lists 38 Chatham Rd. The inspected official K+CO Living site publishes 36 Chatham Rd, Short Hills; unresolved numbered-address conflict. |
| Jordan Elyse Photography | https://exploremillburnshorthills.org/directory/ | http://www.jordanelyse.com/ | held: the downtown directory supplies name and numbered address; the inspected official destination rendered only a generic ‘View More’ page and did not provide usable business identity or address confirmation. |
| JD Fitness | https://exploremillburnshorthills.org/directory/ | https://www.jdfitness.net/locations | held: the downtown directory lists 11 Short Hills Ave, Short Hills, NJ 07041, while the inspected official locations page publishes 11 Short Hills Ave, Short Hills, NJ 07078; unresolved ZIP/address conflict. |

## Other public pages opened for source-family and category coverage

| Source family / purpose | URL opened | Outcome |
|---|---|---|
| Metuchen Downtown Alliance directory root | https://www.downtownmetuchen.org/directory/ | Category index read. |
| Scotch Plains municipal directory root | https://www.scotchplainsnj.gov/departments/business-listing-directory | Category index read. |
| Glassboro municipal directory (source record page) | https://www.glassboro.org/business-directory | Public municipal listing read. |
| Phillipsburg municipal directory root | https://phillipsburgnj.org/business-directory/ | Category index read. |
| Phillipsburg laundromats | https://phillipsburgnj.org/business-directory/wpbdp_category/laundromats/ | Category page read; records lacked a usable official destination. |
| Phillipsburg — Helen’s individual record | https://phillipsburgnj.org/business-directory/1304/helens-floral-shoppe-inc/ | Individual record read; directory endpoint did not expose address in extracted content. |
| Phillipsburg — Medimax individual record | https://phillipsburgnj.org/business-directory/1319/medimax-pharmacy/ | Individual record read; category list used for address support. |
| New Providence municipal directory | https://www.newprov.us/315/Business-Directory | Directory landing page read. |
| New Providence CivicPlus directory destination | https://nj-newprovidence.civicplus.com/BusinessDirectoryII.aspx | Directory destination opened; no qualifying record emitted. |
| Pompton Lakes BID directory | https://pomptonlakesbid.org/directory/ | Directory page opened; no extractable listing record emitted. |
| Official destination (not retained): Helen’s contact | https://helensfloralshoppe.com/pages/contact | No numbered business location extracted. |
| Official destination (not retained): JD Fitness locations | https://www.jdfitness.net/locations | Address/ZIP conflict documented in held record. |
| Official destination (not retained): Bonney’s location | https://www.bonneysbbq.com/location | Used to confirm retained Bonney’s location. |
| Official destination (not retained): Jhanna contact | https://www.jhannafinejewelry.com/contact | Used to confirm retained Jhanna storefront location. |
| Official destination discovery / inspected candidate source | https://creamcafe.square.site/locations | Opened; extraction was dominated by consent content, so no Cream Cafe record emitted. |
| Official destination discovery page | https://www.calishakes.com/ | Official brand site read in addition to Glassboro location page. |

## Hold summary

The **14 held leads** were not relaxed into the candidate file. Five lacked an inspectable official destination because it failed, was blocked, or was contentless; three had address conflicts; one displayed a permanent-closure notice; one redirected to unrelated casino content; one was a password-gated placeholder; and three lacked enough current identity/location linkage. These are **reviewer signals only**—in particular, a failed page or closure notice has not been generalized into a claim about current business status.

## Research-only conclusion

The JSONL artifacts retain public directory facts and direct observations from official customer destinations. The output intentionally does not claim who owns a business, any protected characteristic, culture or language, licensing, price, hours, safety, quality, availability, access, or whether an entity is presently open. The dataset contains no coordinates or map data and is not published or written to a production system.
