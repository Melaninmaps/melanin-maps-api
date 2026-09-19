# New York City — High-Yield Research Report

## Scope and result

This **review-only** research package covers **only the five boroughs of New York City**. It contains **10 retained candidates** and **10 held candidates**. It does not assert eligibility, ownership, quality, licensure, safety, pricing, hours, availability, accessibility, or any protected trait except where wording is explicitly attributed in the record’s `ownershipEvidence`.

The retained set is intentionally short of the 100-record ceiling. Each retained physical listing has a name, category, inspected public source URL, an inspected official customer-facing website, and a non-conflicting numbered street address. The one cosmetology lead is routed as `regulated_review`; no licensing conclusion is made. No online-only records were retained in this pass.

## Source-family coverage

| Source family | Inspected source pages | Function in this pass | Outcome |
|---|---|---|---|
| **Diaspora/community directory** — Little Caribbean NYC | [Visit Us directory](https://littlecaribbean.nyc/visit-us) | Candidate discovery for Brooklyn retail, beauty, technology, and marketplace businesses | 5 retained; 1 held for a ZIP conflict |
| **Borough/community marketplace organization** — Flatbush Central | [official marketplace directory](https://flatbushcentral.com/); [Zeby’s vendor listing](https://flatbushcentral.com/portfolio-item/zebys-printing/) | Marketplace and vendor discovery in Flatbush | 1 retained; 1 held for no separate official customer destination |
| **Neighborhood business improvement organization** — Alliance for Downtown New York | [12 Black-Owned Businesses to Shop at in February](https://downtownny.com/news/black-owned-businesses-downtown-nyc-2026/) | Lower Manhattan retail, fitness, and visitor-service discovery | 3 retained; 3 held |
| **Official city tourism / Black-business guide** — NYC Tourism + Conventions | [Black-Owned Bookstores in NYC](https://www.nyctourism.com/articles/black-owned-bookstores-in-nyc); [Black-Owned Bed-Stuy guide](https://www.nyctourism.com/articles/black-owned-bed-stuy-itinerary); [Black-Owned Harlem guide](https://www.nyctourism.com/articles/black-owned-harlem-itinerary/) | Bronx and Manhattan bookstore discovery; cross-check / hold discovery for Brooklyn and Harlem businesses | 2 retained; 5 held |
| **Business-organization directories checked but not used for retained rows** | [125th Street Harlem BID directory](https://harlembid.com/exploreconnect/125th-street-harlem-directory/); [Brooklyn Chamber directory](https://www.brooklynchamber.com/membership/directory/); [Bronx Chamber ABNY directory](https://www.bronxchamber.org/abnys-directory) | Directory-family coverage assessment | Harlem and Brooklyn interfaces did not expose usable individual records in inspected text; Bronx Chamber routed to ABNY and was not used for a retained lead |
| **Additional public directory checked** | [Black-Owned Brooklyn](https://www.blackownedbrooklyn.com/); [NYC Shop Black hub](https://shopyourcity.cityofnewyork.us/syc-black/); [125th Street BID mapping page](https://harlembid.com/125th-street-businesses/) | Discovery / source-family coverage | Used only for context and further-source discovery; no record retained solely from a search snippet |

The work covers at least five everyday-need categories: **retail/personal care**, **beauty services**, **apparel**, **technology repair**, **fitness**, **travel/experiences**, and **books/cultural retail**.

## Retained-record rationale

| Source row | Entity | Category | Target kind | Why retained |
|---|---|---|---|---|
| nyc-high-001 | Ambrosia Health Foods | retail | `business` | Little Caribbean NYC lists the numbered Brooklyn address. The official customer shop identifies Ambrosia Health Foods, says it serves East Flatbush Brooklyn, and offers bulk herbs, natural products, and sea moss. |
| nyc-high-002 | Barry's Beauty Bar | beauty and personal care | `regulated_review` | Little Caribbean NYC supplies the numbered address and service categories. The official site identifies Barry's Beauty Bar, supplies a customer appointment destination and phone number. Routed as regulated_review because it is a cosmetology/barber service lead; no licensure status is represented. |
| nyc-high-003 | Fe Noel Little Caribbean | retail | `business` | The Little Caribbean directory provides the numbered address. The official site identifies the establishment as Fe Noel's brick-and-mortar designer outlet in Brooklyn's Little Caribbean and provides customer shopping and directions links. |
| nyc-high-004 | Flatbush Central | retail and business services | `business` | The inspected official site identifies Flatbush Central as a Caribbean marketplace with independent vendors, a food hall, shared kitchen, and entrepreneur programs, and publishes this numbered Brooklyn address. |
| nyc-high-005 | Kaos Computing | technology services | `business` | Little Caribbean NYC lists this numbered address. The official customer site identifies Kaos Computing at 661 Flatbush Ave and describes smartphone, laptop, tablet, and game-console repair services. |
| nyc-high-006 | Pretty Well Beauty | retail | `business` | The Downtown Alliance lists Pretty Well Beauty at 185 Greenwich Street. Its official customer shop independently lists the same street address and sells beauty and personal-care products. |
| nyc-high-007 | Bout Fight Club | fitness and recreation | `business` | The Downtown Alliance lists Bout Fight Club at 139 Fulton Street. The official customer site confirms 139 Fulton Street, Studio 133, provides the phone number, schedule, and a class sign-up destination. |
| nyc-high-008 | Inside Out Tours | travel and experiences | `business` | The Downtown Alliance includes Inside Out Tours in its Black-owned-business guide. The official booking site describes its tours, lists the Brooklyn office address and customer contact number, and provides booking destinations. |
| nyc-high-009 | The Lit. Bar | retail | `business` | NYC Tourism lists The Lit. Bar’s numbered Bronx address. The official customer site identifies it as an independent bookstore and wine bar in Mott Haven and confirms the same numbered address and phone. |
| nyc-high-010 | Sister's Uptown Bookstore & Cultural Center | retail | `business` | NYC Tourism lists the numbered Washington Heights address. The official customer site independently lists the same address and phone, describes books and events, and offers an online shop. |

## Held-record rationale

| Source row | Entity | Hold reason | Why held |
|---|---|---|---|
| nyc-high-h01 | Labay Market | `conflicting_address_sources` | Little Caribbean NYC lists 1127 Nostrand Ave, Brooklyn, NY 11225. The official site lists 1127 Nostrand Avenue, Brooklyn, NY 11234. The numbered street is the same but the ZIP codes conflict, so no address is retained. |
| nyc-high-h02 | Barizi | `parked_or_inactive_official_destination` | The Downtown Alliance lists Barizi at 185 Greenwich Street, but the inspected official domain is a 'Coming Soon' page with only a launch-email field and Instagram link; it is not a reliable active customer destination. |
| nyc-high-h03 | Institute of Black Imagination | `official_destination_not_reliably_inspectable` | The Downtown Alliance describes the physical Oculus hub, but the inspected official domain yielded only the words 'Black Imagination' and no usable visitor, customer, or contact destination. Held rather than treating the official destination as verified. |
| nyc-high-h04 | Twenty Four | `unsupported_or_conflicting_current_physical_location` | The Downtown Alliance lists an Oculus location, while the inspected official shop presents 'HUDSON YARDS' and does not publish a numbered address. The current physical customer location cannot be confirmed without conflict or unsupported inference. |
| nyc-high-h05 | Moshood Creations | `missing_numbered_street_address` | The guide says Moshood is in Restoration Plaza but supplies no numbered storefront address, and the inspected official shopping site describes a Brooklyn boutique without publishing a numbered customer address. |
| nyc-high-h06 | Zeby's Printing | `no_reliable_official_customer_destination` | The Flatbush Central vendor listing describes Zeby's services and places the vendor in the marketplace address, but it does not provide an official customer-facing website or business-social destination for Zeby's itself. |
| nyc-high-h07 | Calabar Imports | `parked_or_mismatched_official_destination_and_missing_address` | The source presents Calabar Imports as a Harlem retailer, but the inspected official domain resolves to a Turbify domain-sale landing page rather than the business; no current customer destination or numbered address was verified. |
| nyc-high-h08 | Kente Royal Gallery | `missing_numbered_street_address_and_insufficient_official_destination` | The official website exposed only a gallery name and Instagram link, with no address or usable visitor/customer content. The source text also supplied no numbered street address. |
| nyc-high-h09 | Sincerely, Tommy | `missing_numbered_street_address` | The official site identifies a Brooklyn lifestyle store with a coffee bar and customer social links, but neither it nor the inspected source publishes a numbered street address. |
| nyc-high-h10 | BLK MKT Vintage | `missing_numbered_street_address` | The official site is an active e-commerce and services destination, but it does not publish a numbered physical address. The source calls it a Bed-Stuy stop but likewise lacks a numbered street address. |

## Counts

### Retained target kinds

| Target kind | Count |
|---|---:|
| `business` | 9 |
| `regulated_review` | 1 |

### Retained categories

| Category | Count |
|---|---:|
| beauty and personal care | 1 |
| fitness and recreation | 1 |
| retail | 5 |
| retail and business services | 1 |
| technology services | 1 |
| travel and experiences | 1 |

### Held reasons

| Hold reason | Count |
|---|---:|
| `conflicting_address_sources` | 1 |
| `missing_numbered_street_address` | 3 |
| `missing_numbered_street_address_and_insufficient_official_destination` | 1 |
| `no_reliable_official_customer_destination` | 1 |
| `official_destination_not_reliably_inspectable` | 1 |
| `parked_or_inactive_official_destination` | 1 |
| `parked_or_mismatched_official_destination_and_missing_address` | 1 |
| `unsupported_or_conflicting_current_physical_location` | 1 |

## Dedupe method and result

Before writing, the script parsed **every `*.jsonl` file beneath `/home/ubuntu/directory-research-wave-2026-09-18`**, excluding only this output directory. It normalized **name + city + state + country + address** by lowercasing and removing non-alphanumeric characters, then compared each proposed retained candidate to the resulting prior-package composite-key index. Exact composite matches were excluded; uncertain same-name records were not merged. **0 exact prior-package matches** were found among proposed retained rows and excluded. The output was additionally checked for internal composite-key duplicates. Both emitted JSONL files were then parsed line-by-line as JSON and checked for all **23 required candidate fields**; held rows additionally include a non-required `hold_reason` field.

## Inspection log — every URL opened/read in this pass

The following URLs were opened and read directly. Search-result snippets were used only to locate pages and never as evidence.

| URL | Inspection result / use |
|---|---|
| https://www.blackownedbrooklyn.com/ | Public Black-Owned Brooklyn landing page; reviewed source-family scope and directory entry points. |
| https://harlembid.com/125th-street-businesses/ | Harlem BID online-mapping entry point; it directs to a Vibemap directory but did not expose individual business records in extracted text. |
| https://harlembid.com/exploreconnect/125th-street-harlem-directory/ | Harlem BID directory entry point; no usable individual records in inspected text. |
| https://shopyourcity.cityofnewyork.us/syc-black/ | NYC Shop Black municipal hub; reviewed linked source families and discovery context. |
| https://www.brooklynchamber.com/membership/directory/ | Brooklyn Chamber directory; page loaded a client-side company listing but exposed no individual records in inspected text. |
| https://www.bronxchamber.org/abnys-directory | Bronx Chamber page routing to ABNY minority/veteran/LGBTQ/women-owned directory; not used for row retention. |
| https://littlecaribbean.nyc/visit-us | Little Caribbean NYC community directory; primary source for Brooklyn discovery, addresses, and source-attributed culture/ownership wording. |
| https://myrtleavenue.org/blackowned/ | Myrtle Avenue BID Black-owned guide; inspected as a neighborhood BID source family. Its viable listings overlapped the pre-existing NYC package or were not used in this pass. |
| https://downtownny.com/news/black-owned-businesses-downtown-nyc-2026/ | Alliance for Downtown New York guide; source for Downtown candidates and holds. |
| https://www.nyctourism.com/articles/black-owned-bed-stuy-itinerary | NYC Tourism guide; source for Bed-Stuy hold screening. |
| https://www.nyctourism.com/articles/black-owned-jamaica-itinerary | Fetch attempted; no text could be extracted, so no evidence was used. |
| https://www.nyctourism.com/articles/black-owned-bookstores-in-nyc | NYC Tourism source for The Lit. Bar and Sister’s Uptown; also confirmed source-family scope. |
| https://www.nyctourism.com/articles/black-owned-harlem-itinerary/ | NYC Tourism source for Harlem hold screening. |
| https://flatbushcentral.com/ | Official marketplace directory/customer site; source and official customer destination for Flatbush Central. |
| https://flatbushcentral.com/portfolio-item/zebys-printing/ | Flatbush Central vendor listing; held because there was no separate official Zeby’s customer destination. |
| https://ambrosiahealthfoods.com/ | Official Ambrosia customer shop; verified business identity and product categories, while the directory supplied the numbered address. |
| https://www.barrysbeautybar.com/ | Official Barry’s customer/appointment site; verified identity, booking link, phone, and social links. |
| https://fenoel.com/ | Official Fe Noel online shop; confirmed Little Caribbean brick-and-mortar identity. |
| https://fenoellittlecaribbean.com/ | Official Fe Noel Little Caribbean customer/shop site; confirmed physical boutique status and official social/directions destinations. |
| https://www.granrumarket.com/ | Official Granru Market shop was inspected during Little Caribbean directory screening; it did not publish a numbered physical customer address, so no record was retained. |
| https://kaoscomputing.com/ | Official Kaos customer site; verified numbered address, phone, and stated repair services. |
| https://www.labaymarket.com/ | Official Labay customer site; held due to the official ZIP conflict against the directory ZIP. |
| https://prettywellbeauty.com/ | Official Pretty Well Beauty customer shop; verified numbered address, shop, and social links. |
| https://www.boutfightclub.com/ | Official Bout Fight Club customer site; verified numbered address, phone, schedule, and sign-up destination. |
| https://insideouttours.com/ | Official Inside Out customer/booking site; verified company identity, office address, contact, booking, and source-stated designation. |
| https://www.thelitbar.com/ | Official Lit. Bar customer site; verified Mott Haven identity, street address, phone, shop, and events. |
| https://www.sistersuptownbookstore.com/ | Official Sister’s Uptown customer site; verified numbered address, phone, shop, events, and family-owned wording. |
| https://barizi.com/ | Official domain was a Coming Soon/launch page; held as an inactive or insufficient customer destination. |
| https://www.blackimagination.com/ | Official domain returned only “Black Imagination”; held for insufficient inspectable visitor/customer information. |
| https://twentyfouroculus.com/ | Official online shop; held because it displayed Hudson Yards but no numbered address, conflicting with the source’s Oculus placement. |
| https://www.afrikanspirit.com/ | Redirected official Moshood online shop; held because no numbered physical customer address was published. |
| https://sincerelytommy.com/ | Official Sincerely, Tommy site; held for missing numbered street address. |
| https://www.blkmktvintage.com/ | Official BLK MKT Vintage shop/services site; held for missing numbered physical address. |
| https://www.calabar-imports.com/ | Domain-sale/parking page; held as a parked or mismatched official destination. |
| https://www.kenteroyalgallery.com/ | Official site exposed only name and Instagram link; held for no address and insufficient visitor/customer information. |
| https://www.harlemhaberdashery.com/ | Official site returned an insufficient one-line shell; not retained. |
| https://www.trunkshowconsignment.com/ | Official site returned only a minimal landing/shop link; not retained. |
| https://charlespatrickjewelers.com/ | Fetch attempted but hostname could not be resolved by the extraction tool; no evidence used. |
| https://nilu-nyc.com/ | Fetch attempted but hostname could not be resolved by the extraction tool; no evidence used. |

## Research-only / no-publication boundary

This package is for research and review only. **No map pins, geocoding, latitude/longitude, production database/API writes, deployments, authentication changes, password changes, waitlist or payment changes, public publication, or contact with businesses was performed.** The files are local JSONL and a local Markdown report only.
