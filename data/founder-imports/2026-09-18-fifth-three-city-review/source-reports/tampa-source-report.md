# Tampa Bay, Florida Source-Pass Report

## Scope and handling

This is **research-only** work for Mapping with Melanin’s Tampa Bay, Florida wave. Nothing in this pass was staged, published, submitted, deployed, or written to an external system. The three files in this folder are local research artifacts only. No repository, application, database, public API, account, authentication system, waitlist, or deployment was modified.

The pass prioritized a current local Black-business editorial directory, the Tampa Bay Black-Owned Business Directory, official Black and Latin chamber resources, a Black arts/community institution, and first-party business and organization destinations. Each retained row has a public HTTP(S) `sourceUrl` and a specific official customer-facing website or official social destination. Commercial businesses, online businesses, community resources, and cultural places are separated. Ownership or identity wording is preserved only where the publisher or business explicitly supplied it; directory/editorial inclusion is not treated as a certification.

## Results

**17 candidates** were retained and **8 records** were held for manual review. An exact duplicate check against existing local city JSONL research beneath `/home/ubuntu/directory-research-wave-2026-09-18/` found **no retained collision**, using normalized name + city + state + address. Both JSONL files were parsed successfully after writing. No coordinates, pins, directions, or other location geometry were created; online-business records have no address.

### Retained candidates by target kind

| targetKind | Count |
|---|---:|
| business | 8 |
| online_business | 2 |
| community_resource | 6 |
| cultural_place | 1 |

### Retained candidates by category

| category | Count |
|---|---:|
| arts_culture | 1 |
| business_services | 1 |
| community_services | 6 |
| food_and_drink | 6 |
| retail | 3 |

The mix is intentionally not restaurant-only: food-and-drink records are **6 of 17**, while the wave also includes printing services, clothing/fashion retail, two online stores, chambers, advocacy and literacy resources, arts-community programming, and an African American history museum across Tampa, Riverview, St. Petersburg, Gulfport, and Clearwater-adjacent Tampa Bay.

## Held records

The held file preserves source-backed leads where a linked official domain was unrelated, parked, unresolved, or 404; where a directory location could not be corroborated by a current official destination; where a physical location was explicitly temporarily closed; or where an identified regulated service lacked a current official destination for review. These holds are caution flags, not negative findings. Royal Diaspora Coffee remains held because its own site says its Busch Boulevard physical location is permanently closed and a new location is forthcoming, making its present local placement insufficiently specific.

## Every inspected URL (44)

| # | URL | What inspection supported or found |
|---:|---|---|
| 1 | <https://www.tampabaychamber.com/blog/2021/02/17/membership/tampa-bay-chamber-black-owned-businesses/> | Chamber editorial list of Black-owned businesses; used for lead screening. |
| 2 | <https://www.tampabayblackexcellencechallenge.com/p/tampa-bay-black-owned-business-directory.html> | Tampa Bay Black-Owned Business Directory; names, categories, addresses, phones, and official destination leads. |
| 3 | <https://portal.tampabaylatinchamber.com/members/directory/search_bootstrap.php?twocol&org_id=TBLC> | Official Latin Chamber member directory; public categories and scope screened. |
| 4 | <https://africanextravaganza813.com/> | Listed African Extravaganza domain rendered unrelated gambling content; held. |
| 5 | <https://closetofclasse.com/> | Listed Closet of Classe domain could not be resolved; held. |
| 6 | <https://www.queensvisionafricanapparelllc.com/> | Listed Queens Vision domain could not be resolved; not promoted. |
| 7 | <https://www.alsybor.com/> | First-party restaurant site; Ybor location, phone, customer menu, and catering. |
| 8 | <https://www.culturedbooks.org/> | First-party Literacy Foundation site; 501(c)(3), South St. Pete programs, and social destinations. |
| 9 | <https://ayesharodriguez.com/> | First-party children’s author site; screened, not selected because locality was not directly supported. |
| 10 | <https://www.nc100bwtampabay.org/> | First-party nonprofit chapter site; mission, initiatives, Tampa P.O. Box, and social destinations. |
| 11 | <https://tampamagazines.com/black-owned-tampa-bay-businesses-to-support/> | Current 2026 local editorial Black-owned-business directory; inclusion context, locations, and links. |
| 12 | <https://woodsonmuseum.org/> | First-party Woodson museum site; cultural mission, 501(c)(3), address, phone, and Facebook. |
| 13 | <https://tampabayhistorycenter.org/> | First-party regional history-center site; screened, not selected. |
| 14 | <https://tbbcci.org/> | Black Chamber home; Black-business support mission and Tampa location. |
| 15 | <https://hillsboroughblackchamber.org/> | Official Black Chamber mission; no public member listing extracted. |
| 16 | <https://www.instagram.com/queensvisionafricanapparelllc/> | Official profile had unconfirmed linkage to older directory storefront; held. |
| 17 | <https://www.instagram.com/accentstylesboutique/> | Official profile; East African boutique/tours identity and Linktree. |
| 18 | <https://tampabaylatinchamber.com/> | Official Latin Chamber; Latino-community mission, reach, and contact context. |
| 19 | <https://www.7thandgrove.com/> | First-party restaurant; Tampa address, phone, reservations, ordering, and catering. |
| 20 | <https://www.hoggbatch.com/> | First-party roaster; St. Petersburg address, phone, retail, wholesale, and social links. |
| 21 | <https://www.flavazjamaicangrille.com/> | First-party restaurant; Riverview address, phone, ordering, and social links. |
| 22 | <https://linktr.ee/Accentstylesboutique> | Owner-controlled Linktree; shop, social, tour, and founder resources. |
| 23 | <https://tbbcci.org/directory> | Official Black Chamber directory; seven verified business profiles screened. |
| 24 | <https://greenbooktampabay.org/> | First-party Black arts/community page; mission, calendar businesses, St. Pete contact, and social links. |
| 25 | <https://www.debonairprints.com/> | First-party printing site; Tampa address, phone, services, and official social links. |
| 26 | <https://kyvintageshop.com/> | First-party online vintage shop; retail destination and Facebook/Instagram. |
| 27 | <https://canviiy.com/> | First-party consumer scalp/hair store; screened, no direct local location supported. |
| 28 | <https://www.centralstationbarbershop.org/> | Listed Central Station site returned HTTP 404; regulated-service lead held. |
| 29 | <https://tbbcci.org/about> | First-party Black Chamber mission, services, and street address. |
| 30 | <https://tampabaylatinchamber.com/contact-us/> | First-party Latin Chamber phone and social destinations; P.O. Box only. |
| 31 | <https://greenbooktampabay.org/contact> | Contact-page extraction had no content; main site supplied usable organization details. |
| 32 | <https://www.tampabayblackexcellencechallenge.com/> | Directory publisher’s community/event context and posts. |
| 33 | <https://racewithoutism.com/> | First-party 501(c)(3); mission, St. Petersburg locality, phone, and social links. |
| 34 | <https://royaldiasporacoffee.com/> | First-party store; Black family-owned wording; listed physical location permanently closed, so held. |
| 35 | <http://curtismuseum.org/> | First-party museum; Clearwater address and temporary renovation closure, so held. |
| 36 | <https://noiterose.com/> | First-party online loungewear shop; ownership wording, retail destination, and social links. |
| 37 | <https://bluehibiscusorganics.com/shop> | Listed shop rendered a GoDaddy parked domain; held. |
| 38 | <https://islandflavorsandtings.com/> | First-party restaurant/grocer; Gulfport address, phone, shop, catering, and social links. |
| 39 | <https://www.raysvegansoul.com/> | First-party plant-based food site; South St. Pete pickup/event address and phone. |
| 40 | <https://poshwicks.shop/> | First-party candle storefront; screened, but no local place connection directly supported. |
| 41 | <https://www.accentstylesboutique.com/> | First-party online store; products, owner identity, and purchase destination. |
| 42 | <https://www.nosuncollective.com/> | First-party Tampa online fashion shop; former African Extravaganza; no numbered street address shown. |
| 43 | <https://tampabaylatinchamber.com/liz-galdamez-creating-a-destination-for-transformation/> | Official Latin Chamber Chic Image feature; screened. |
| 44 | <https://www.tampabaychamber.com/> | Tampa Bay Chamber home; public member-directory and business-support context. |

## Limitations

This was a bounded, source-backed discovery pass, **not** a certification, licensing review, or operational audit. Local editorial and directory entries can age. Current hours, prices, availability, accessibility, inventory, service area, licensing, language/bilingual capability, health outcomes, and operational status were not inferred. Sources were inspected on September 18, 2026. Official domains that were parked, unresolved, unrelated, or returned 404 were not used as customer destinations; material cases appear in the held file. Community organizations with P.O. Boxes or city-only contact details are retained as resources with `address: null`, not converted into physical listings. Chamber or directory participation is a source basis for inclusion only, never ownership certification.
