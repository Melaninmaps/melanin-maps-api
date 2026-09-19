# Delaware Fourth-Depth Directory Research Report

## Scope and outcome

This pass covers **Delaware statewide only**, including New Castle County/Wilmington, Kent County/Dover, and Sussex County. It excludes **Newark, New Jersey** and every out-of-state location. The completed files contain **17 retained candidates** and **9 held candidates**. All retained rows are noncommercial public-library records classified as `community_resource`; they are not presented as commercial businesses.

## Retention decisions

The retained set comes from the Delaware Division of Libraries' public statewide list and has an inspected official library destination for every record. Each retained row has a source-supported numbered Delaware address and a matching or non-conflicting official destination. There are **7 New Castle County/Wilmington-area**, **3 Dover/Kent-area**, and **7 Sussex-area** retained resources.

The held set comprises **9 Middletown Area Chamber listings** for which the directory supplied a physical address but the inspected member detail page did not expose a usable official customer-facing destination. No candidate was retained from the WilmingtonMade, Georgetown, Lewes, Greater Millsboro, Milford Chamber, Delaware Hispanic Commission, or Downtown Middletown sources in this pass because they did not supply a fresh qualifying record after the required official-destination and dedupe screens.

### Candidate counts

| Measure | Count |
|---|---:|
| Retained candidates | 17 |
| Held candidates | 9 |
| `community_resource` retained | 17 |
| `manual_review` held | 9 |
| `regulated_review` held | 0 |
| Retained `public library` category | 17 |

## Cross-folder deduplication

Before writing, the pass parsed **297 existing Delaware-state JSONL records** from every `*.jsonl` below `/home/ubuntu/directory-research-wave-2026-09-18`, excluding this output directory. It normalized names, cities, states, countries, and addresses by case-folding and removing punctuation/spacing (and normalizing `&` to `and`). For every output row it screened the complete normalized `name + city + state + country + address` identity and applied a conservative same-name block where normalized name matched and either normalized city or numbered address matched. Existing or conflict-prone entries were not re-added, including records already present from WilmingtonMade. The generator parsed both final JSONL files line-by-line, confirmed the exact 23-key schema for each line, and checked all retained/held records against the pre-output index.

## Inspected sources and URLs

| Source family / destination | Inspected URL | Decision / use |
|---|---|---|
| Delaware Division of Libraries | <https://libraries.delaware.gov/> | Source-family landing page inspected. |
| Delaware Libraries List | <https://lib.de.us/list-of-libraries/> | **Retained 17** physical `community_resource` records after official-site checks. |
| Appoquinimink Community Library | <https://nccde.org/288/Appoquinimink-Community-Library> | Retained. |
| Bear Library | <https://nccde.org/291/Bear-Library> | Retained. |
| Route 9 Library & Innovation Center | <https://nccde.org/1389/Route-9-Library-Innovation-Center> | Retained. |
| New Castle Public Library | <https://newcastlelibrary.lib.de.us/> | Retained. |
| Wilmington Public Library | <https://wilmington.lib.de.us/> | Retained main and North Branch records. |
| Wilmington NoMa Library | <https://wilmington.lib.de.us/noma> | Retained. |
| Dover Public Library | <https://dover.lib.de.us/> | Retained. |
| Kent County Public Library | <https://www.kentcountyde.gov/Residents/Library-Services> | Retained. |
| Milford Public Library | <https://milford.lib.de.us/> | Retained. |
| Georgetown Public Library | <http://georgetown.lib.de.us/> | Retained. |
| Lewes Public Library | <https://lewes.lib.de.us/> | Retained. |
| Rehoboth Beach Public Library | <http://rehoboth.lib.de.us/> | Retained. |
| Seaford District Library | <http://seaford.lib.de.us/> | Retained. |
| Delmar Public Library | <http://delmar.lib.de.us/> | Retained Delaware record. |
| South Coastal Library | <http://southcoastal.lib.de.us/> | Retained. |
| Millsboro Public Library | <https://millsboro.lib.de.us/> | Retained. |
| Middletown Area Chamber directory | <https://middletownareachamber.chambermaster.com/list> | Source family inspected. |
| Middletown Chamber retail listing | <https://middletownareachamber.chambermaster.com/list/category/retail-268> | Same public listing as business-domain version; 8 retail listings held for unavailable official-destination check. |
| Middletown Chamber retail listing | <https://business.maccde.com/list/category/retail-268> | Used for source-supported addresses/phones in 8 held rows. |
| Middletown Chamber arts listing | <https://middletownareachamber.chambermaster.com/list/ql/arts-culture-entertainment-3> | Aster DryWall held: no official destination. |
| Eternal Soapourri member profile | <https://middletownareachamber.chambermaster.com/list/member/eternal-soapourri-2614> | No extractable member business content; held. |
| The April Edit member profile | <https://middletownareachamber.chambermaster.com/list/member/the-april-edit-llc-2536> | No extractable member business content; held. |
| Wisp Bookshop member profile | <https://middletownareachamber.chambermaster.com/list/member/wisp-bookshop-2575> | No extractable member business content; held. |
| McCall Books and Coffee member profile | <https://middletownareachamber.chambermaster.com/list/member/mccall-books-and-coffee-co-llc-2579> | No extractable member business content; held. |
| Hawkins & Sons member profile | <https://middletownareachamber.chambermaster.com/list/member/hawkins-sons-appliances-inc-2497> | No extractable member business content; held. |
| Greater Millsboro Chamber directory | <https://www.millsborochamber.com/business-directory/> | Listing page returned no extractable text; no retained/held row created from this URL. |
| Georgetown Chamber directory | <https://www.georgetowncoc.com/directory.asp> | Listing-level source inspected; no fresh qualifying record retained. |
| Lewes Chamber directory | <https://leweschamber.com/business-directory/> | Listing-level source inspected; no individual record exposed. |
| Milford Chamber directory | <https://milfordchamber.com/business-directory/> | Listing page returned no extractable text. |
| WilmingtonMade Black Owned Business Directory | <https://www.wilmingtonmade.com/blackownedbusinesses> | Source family inspected; existing-package names, including records with no qualifying official destination, were not re-added. |
| His Image Barber Lounge | <http://www.hisimagebarberlounge.com/> | No extractable business content; existing cross-folder record was not re-added. |
| Delaware Hispanic Commission Community Resources | <https://hispanic.delaware.gov/resources/> | Resource page inspected; no qualifying local record emitted. |
| Downtown Middletown business directory | <https://www.downtownmiddletownde.com/downtown-middletown> | Fresh public directory inspected; individual listings were not exposed. |
| DE.CO Food Hall | <https://www.decowilmington.com/> | Fresh listing system inspected; no row emitted because individual records were already in the cross-folder corpus or lacked a separate required screen. |
| Green Box Kitchen official site | <https://www.greenboxkitchen.com/> | Inspected only as an address-conflict/duplicate check; not re-added. |
| Drop Squad Kitchen official site | <https://dropsquadkitchen.com/> | Inspected only as a duplicate/location-status check; not re-added. |
| E Squared Cigar Bar official site | <https://www.esquaredcigarbar.com/> | Inspected only as an existing-record check; not re-added. |
| Phat Cuts official site | <https://phatcutshair.com/> | Inspected only as an existing-record check; not re-added. |
| Phat Cuts contact page | <https://phatcutshair.com/contact-us> | Confirmed existing-record address; not re-added. |
| LaFate Gallery official site | <http://www.lafategallery.com/> | Inspected only as a conflicting-address/existing-record check; not re-added. |
| LaFate Gallery official site | <https://lafategallery.com/> | Inspected only as a conflicting-address/existing-record check; not re-added. |
| SqueezeBox Records official site | <https://squeezeboxrecords.com/> | Parked/unrelated content; existing record was not re-added. |

## Research-only boundary

These JSONL files are **research artifacts only**. They contain no coordinates, geocoding, map pins, production API calls, database writes, deployments, or account changes. They do not claim current operating status, ownership beyond explicitly attributed directory wording, protected traits, culture, language, licensure, quality, prices, hours, safety, availability, accessibility, or service outcomes. Address and category text is retained only where supported by the cited public source and inspected official destination. No data source was used to exclude candidates based on protected traits.
