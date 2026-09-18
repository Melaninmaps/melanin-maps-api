# Indianapolis and Central Indiana — Research-Only Source Pass

**Scope.** This pass covers Indianapolis only. No location outside Indianapolis was retained. It is a research dataset, not a published directory, map, recommendation, licensing determination, availability statement, or operational-status claim. No coordinates, mapping actions, accounts, logins, waitlist submissions, payments, APIs, deployment, directions, or database actions were performed.

**Requested Mapping with Melanin source check.** The public Mapping with Melanin website, its Business page, and its official Instagram profile were inspected without joining the waitlist or signing in. The Business page was an early-access/waitlist gate and did not expose an Indianapolis listing corpus that could be used as record-level evidence. Accordingly, it produced no retained or held named candidate in this pass; supplemental public local directories/editorial sources listed below supplied discoverable records.

## Output Summary

- **Retained candidates:** 17
- **Held candidates:** 9
- **Inspected URLs:** 73

### Retained Counts by Target Kind

| Target kind | Count |
|---|---:|
| business | 12 |
| community_resource | 4 |
| cultural_place | 1 |

### Retained Counts by Category

| Category | Count |
|---|---:|
| arts_and_culture | 1 |
| arts_and_education | 1 |
| arts_and_recreation | 1 |
| community_resources | 3 |
| family_and_youth | 1 |
| food | 7 |
| professional_services | 2 |
| retail | 1 |

## Retention and Held Evidence

Retained commercial records have a name, category, public discovery/source URL, customer-facing official website or official business-social destination, and a non-conflicting numbered street address. Cultural places and community resources are classified as `cultural_place` or `community_resource` rather than commercial pins. No regulated service is retained as certified; the only hair-service prospect encountered is held as `regulated_review required` context because a usable public street address was not independently verified.

Identity, ownership, and community language appears only where the inspected source explicitly states it. Phrases such as “Black-owned (Visit Indy editorial-described),” “Minority Owned (Visit Indy listing-described),” “Black-owned (Indy Black Businesses directory-described/verified),” and “Latinx business (directory-described)” intentionally preserve the source and do not certify ownership. Current hours, status, pricing, availability, accessibility, language fluency, licenses, or outcomes are not asserted.

Held records are present where a required official destination was parked, inaccessible, or clearly unrelated; where a current physical address could not be verified; or where inspected sources had an address/brand conflict. Reasons are recorded per JSON object in `sourceStatus` and `notes`. Black Leaf Vegan is retained because its official Instagram profile was subsequently independently inspected and corroborates the numbered Indianapolis street address.

## Deduplication Methodology

Before writing, the generator parsed every existing `*.jsonl` file below `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding the new `/indianapolis/` output folder. It normalized `name`, `city`, `state`, and `address` by lowercasing and removing non-alphanumeric characters, then rejected any retained record whose full normalized four-part key exactly matched an existing record. It also rejected duplicate full keys within this output. The pre-write comparison examined **2,837 parseable records across 67 existing JSONL files** and found **zero exact duplicate matches** for the retained records.

## Inspected URL Register

Every URL opened/fetched during this pass is enumerated below. URLs marked failed, mismatched, parked, blocked, dynamically unextractable, or waitlist-gated were not silently treated as evidence.

| URL | Inspection role | Result / disposition |
|---|---|---|
| <https://indyblackbusinesses.com/> | Discovery source | Opened; public Black-owned-economy directory homepage; no accessible candidate index on homepage. |
| <https://downtownindy.org/post/celebrate-black-owned-businesses-back-downtown> | Discovery source | Opened; Downtown Indy editorial article, used for candidates/held context. |
| <https://indybcc.org/> | Discovery source | Opened; public Black Chamber page, used for two professional-service discovery records. |
| <https://www.visitindy.com/restaurants/features/black-owned/> | Discovery source | Opened; Visit Indy Black-Owned Restaurants feature; source context for retained food businesses and one held business. |
| <https://www.visitindy.com/things-to-do/black-culture-indy-guide/> | Discovery source | Opened; Visit Indy Black Culture guide; source context for Indiana Black Expo. |
| <https://www.lisc.org/media/filer_public/68/3a/683aa38e-261a-4a55-a2b1-1e4796dc0384/latinx_business_directory.pdf> | Discovery source | Opened; 2020 Latinx Business Directory; source context for Artisan Bakery and Pastries. |
| <https://www.latinosindy.com/negocios> | Discovery source | Opened; Central Indiana Latino business-directory category index; individual profile content is dynamically rendered. |
| <https://blackartscollective.org/artist-directory/> | Discovery source | Opened; artist directory; no directly retained person entry. |
| <https://www.visitindy.com/blog/post/10-favorite-black-spaces-in-indianapolis/> | Discovery source | Opened; Visit Indy Black spaces editorial guide. |
| <http://www.barbqheaven1952.com/> | Official destination check | Opened; parked-domain content. Related candidate held. |
| <https://blackleafvegan.com/> | Official destination check | Opened; customer-facing Black Leaf Vegan Cafe destination with matching address/phone. |
| <https://www.theblockbistro.com/> | Official destination check | Opened; address/contact and restaurant description match source. |
| <https://dabluelagoon.com/> | Official destination check | Opened; address/contact and Jamaican restaurant description. |
| <https://hisplaceeatery.com/> | Official destination check | Opened; address/contact and food-service description. |
| <https://www.teasmeindy.com/> | Official destination check | Opened; published locations conflict with Visit Indy listing; candidate held. |
| <https://madamwalkerlegacycenter.com/> | Official destination check | Opened; address/contact and cultural-institution description. |
| <http://www.indypl.org/cblc/> | Official destination check | Opened; CBLC page points to Central Library location. |
| <https://deckademics.com/> | Official destination check | Opened; footer gives matching Deckademics location/contact despite unrelated main-body content. |
| <https://kicassoindy.com/> | Official destination check | Opened; address/contact and class/event information. |
| <https://www.indypl.org/locations/central-library> | Official destination check | Opened; official 40 E Saint Clair St, 46204, creating ZIP conflict with source listing. |
| <https://kheprw.org/> | Official destination check | Opened; address/contact and community-program description. |
| <https://www.visitindy.com/events/annual-events-festivals/ibe-summer-celebration/> | Discovery source | Opened; IBE event page and program context. |
| <https://portal.indychamber.com/list/member/100-black-men-of-indianapolis-inc-10340> | Discovery source | Opened; extraction returned no content. |
| <https://downtownindy.org/go/a-scent-of-sunshine> | Discovery source | Opened; source gave 29 W Maryland, conflicting with IBB’s 838 N Delaware. |
| <https://downtownindy.org/go/zurri-boutique> | Discovery source | Opened; source/contact listing; official destination inaccessible. |
| <https://downtownindy.org/go/rise-house-fitness-studio> | Discovery source | Opened; source/contact listing; official destination mismatch. |
| <https://downtownindy.org/go/b-bliss-spa> | Discovery source | Opened; source/contact listing; official destination moved/brand mismatch. |
| <https://scentofsunshine.com/> | Official destination check | Opened; product site but no public location. |
| <https://zurriboutique.com/> | Official destination check | Opened; hostname could not resolve. |
| <https://risehouseindy.com/> | Official destination check | Opened; unrelated Reading, Pennsylvania pizzeria content. |
| <https://www.bblissspa.com/> | Official destination check | Opened; redirected to Be Bliss Bodywork at conflicting 120 E Market St location. |
| <https://www.indianablackexpo.com/> | Official destination check | Opened; nonprofit address/contact and program description. |
| <https://100blackmenindy.org/> | Official destination check | Opened; youth-program descriptions and address/contact. |
| <https://www.indplsul.org/> | Official destination check | Opened; mission and programs, with no conflicting street address. |
| <https://artisanbakeryinc.com/> | Official destination check | Opened; bakery address/contact and product details. |
| <https://www.latinosindy.com/businesses#!biz/id/67b7d505e63a7d65a90662aa> | Discovery-source test | Opened; dynamically rendered page did not expose the selected business profile. |
| <https://www.facebook.com/blackleafvegan/> | Official business-social check | Opened; temporarily blocked by Facebook. |
| <https://www.instagram.com/blackleafvegan/> | Official business-social check | Opened; official business profile with name and retained Indianapolis street address. |
| <https://www.instagram.com/milkshakeindy/> | Official business-social check | Opened; business profile, retained address corroboration. |
| <https://www.facebook.com/profile.php?id=100054190484617> | Official business-social check | Opened; Cleo’s official profile/address corroboration. |
| <https://blackartscollective.org/> | Discovery source | Opened; says Black Arts Collective is supported by Kheprw Institute and Cafe Creative. |
| <https://www.leecomp.net/> | Official destination check | Opened; Lee Infinite Solutions services and city/address information. |
| <https://isponline24.com/> | Official destination check | Opened; Impact promotional-products service description. |
| <https://www.facebook.com/100064673964982> | Official business-social check | Opened; Maite Hair Salon name/services/phone, but no street address. |
| <https://www.instagram.com/mapping_with_melanin/> | Requested-source check | Opened; Mapping with Melanin profile. It describes the platform generally but gave no public Indianapolis candidate listings used here. |
| <https://indyblackbusinesses.com/biz/a-scent-of-sunshine> | Discovery source | Opened; source gave 838 N Delaware, conflicting with Downtown Indy address. |
| <https://isponline24.com/ContactUs/> | Official destination check | Opened; Impact office address/contact corroboration. |
| <https://www.leecomp.net/contact> | Official destination check | Opened; Lee address/contact corroboration. |
| <http://www.mappingwithmelanin.com/> | Requested-source check | Opened; public marketing/waitlist page, no publicly inspectable Indianapolis listings used. |
| <https://www.blackswanholisticheadspa.com/> | Prospective official destination | Opened; no numbered public street address and no inspected qualifying public discovery source; not output. |
| <https://www.wrtv.com/news/local-news/indy-black-business/black-owned-boutique-beauty-supply-store-opens-in-indianapolis> | Discovery source | Opened; historical report on The Maxx; linked official site inaccessible, record held. |
| <https://indyblackbusinesses.com/biz/urban-beauty-supply> | Discovery source | Opened; Indianapolis beauty-directory profile, address/contact/services. |
| <https://www.instagram.com/urbanbeautysupplyindy/> | Official business-social check | Opened; no extracted profile content; this was not the linked account handle. |
| <https://www.visitindy.com/directory/gordons-milkshake-bar/> | Discovery source | Opened; address/contact and dessert-shop description corroboration. |
| <https://www.visitindy.com/directory/cleos-bodega-grocery-cafe/> | Discovery source | Opened; address/contact and cafe/grocery description corroboration. |
| <https://www.visitindy.com/directory/artisan-bakery-pastries/> | Discovery-source test | Opened; extraction returned no content. |
| <https://indianapolisrecorder.com/black-representation-matters-urban-beauty-supply/> | Discovery source | Opened; local editorial report and official-site link for Urban Beauty Supply. |
| <https://indyblackbusinesses.com/explore/beauty> | Discovery source | Opened; directory’s verified-Black-owned description and Urban category placement. |
| <https://indyencyclopedia.org/100-black-men-of-indianapolis-inc/> | Discovery source | Opened; local encyclopedia entry and youth-program discovery context. |
| <https://www.mappingwithmelanin.com/businesses> | Requested-source check | Opened without signing in; page is early-access/waitlist gate and did not expose listings. |
| <https://themaxxbeautyco.com/> | Official destination check | Opened; hostname could not resolve. |
| <https://www.instagram.com/urban_beauty_supply.indy/> | Official business-social check | Opened; no extracted content; official Facebook profile was independently inspected. |
| <https://www.facebook.com/indybeautysupply/> | Official business-social check | Opened; address/contact/services corroboration. |
| <https://www.visitindy.com/directory/indianapolis-urban-league/> | Discovery source | Opened; address/contact and social-service program categories. |
| <https://www.visitindy.com/directory/deckademics-dj-school/> | Discovery source | Opened; address/contact and DJ-school description. |
| <https://www.visitindy.com/directory/kicasso-sneaker-art-bar/> | Discovery source | Opened; address/contact, class details, and source-described Minority Owned amenity. |
| <https://www.visitindy.com/directory/teas-me-cafe-ivy-tech/> | Discovery source | Opened; source address causing held decision. |
| <https://www.visitindy.com/directory/madam-walker-legacy-center/> | Discovery source | Opened; venue address/contact and cultural-place context. |
| <https://www.visitindy.com/directory/center-for-black-literature-and-culture-at-central-library/> | Discovery source | Opened; ZIP 46206 that conflicts with official library ZIP 46204. |
| <https://www.visitindy.com/directory/his-place-eatery/> | Discovery source | Opened; source address/contact and restaurant description. |
| <https://www.visitindy.com/directory/da-blue-lagoon-jamaican-kitchen/> | Discovery source | Opened; source address/contact and Jamaican-food context. |
| <https://www.visitindy.com/directory/the-block-bistro-grill/> | Discovery source | Opened; source address/contact and restaurant description. |
| <https://www.visitindy.com/directory/black-leaf-vegan/> | Discovery source | Opened; source address/contact and source-described Minority Owned amenity. |

## Research-Only / No-Publication Boundary

This work stops at evidence collection and structured candidate triage. It does not publish a directory, create a map pin, provide directions, represent a business as currently open, make a recommendation, validate a professional license, certify ownership, create user access, submit any business, or contact any organization. Held records require a human reviewer to resolve the stated evidence issues before any possible downstream use.
