# Mapping with Melanin — New York City Source Pass

## Scope and disposition

This is one **research-only** source pass for New York City and nearby boroughs, New York. It used official business destinations, a New York City government gateway, New York City Tourism + Conventions guides, a Brooklyn Business Improvement District guide, Little Caribbean NYC, and official cultural/community sites. **Nothing was staged, published, deployed, or written externally.** The files are research artifacts only.

After normalized `name + city + state + address` comparison against existing JSONL research under `/home/ubuntu/directory-research-wave-2026-09-18/` (excluding this output directory), **20** candidates were retained and **7** were held. No exact candidate duplicate was found. JSON parsing was validated for every output line.

## Retained-count summary

| Target kind | Count |
| --- | ---: |
| business | 15 |
| online_business | 0 |
| regulated_review | 0 |
| community_resource | 1 |
| cultural_place | 4 |
| manual_review | 0 |

| Category | Count |
| --- | ---: |
| beauty and personal care | 2 |
| community development | 1 |
| cultural institution | 4 |
| dining | 7 |
| retail | 5 |
| shipping and business services | 1 |

## Held-record summary

| Hold reason | Count |
| --- | ---: |
| `conflicting_address_sources` | 1 |
| `no_current_numbered_street_address_and_possible_stale_source` | 1 |
| `no_current_numbered_street_address_for_brooklyn_location` | 1 |
| `no_numbered_street_address` | 1 |
| `no_numbered_street_address_and_no_clear_customer_destination` | 1 |
| `no_numbered_street_address_and_official_destination_not_verifiable` | 1 |
| `official_social_destination_not_independently_verifiable` | 1 |

## Inspected URL ledger

Every URL opened in this pass is listed below. “Supports” is limited to what was observed in the opened content; an entry does not imply an unverified claim about operating status, services, accessibility, price, languages, licensing, or identity.

| URL | Source | What inspection supported or showed |
| --- | --- | --- |
| <https://shopyourcity.cityofnewyork.us/syc-black/> | NYC Department of Small Business Services guide | Inspected as a government gateway to Black-owned business guides; it linked the NYC Tourism and Little Caribbean sources used below. |
| <https://www.blackownedbrooklyn.com/> | Black-Owned Brooklyn | Inspected community publication homepage; it states its local Black-business discovery mission but yielded no address-plus-destination record used in this pass. |
| <https://hispanicchamber.nyc/> | NYC Hispanic Chamber of Commerce | Inspected chamber homepage; it stated its mission but did not provide a sufficiently specific public member destination for a retained record. |
| <https://www.nyctourism.com/articles/black-owned-harlem-itinerary/> | NYC Tourism + Conventions | Supports publisher-designated Black-owned Harlem entries, including Home Sweet Harlem; also used to assess other leads. |
| <https://littlecaribbean.nyc/visit-us> | Little Caribbean NYC | Community directory supporting Aunts et Uncles, Allan’s Bakery, Best Bites, Caribbean Vibes, and Cocoa Bean; also supports/flags held leads. |
| <https://www.nyctourism.com/articles/black-owned-bookstores-in-nyc> | NYC Tourism + Conventions | Supports publisher-designated Black-owned bookstore entries and the held Gladys lead. |
| <https://adanne.co/> | Adanne official website | Confirms customer shop and 115 Ralph Avenue address. |
| <https://www.cafeconlibrosbk.com/> | Café con Libros official website | Confirms address, bookstore/coffee business, and explicit business designation. |
| <https://lizsbookbar.com/> | Liz’s Book Bar official website | Confirms bookstore/café/bar, address, and phone. |
| <https://www.gladysbooksandwine.com/> | Gladys Books & Wine official website | Confirms customer website and social destinations but no numbered street address in inspected text; held. |
| <https://homesweetharlem.nyc/> | Home Sweet Harlem official website | Confirms address, phone, dining, reservations, catering, and official social links. |
| <https://www.sugarhillcreamery.com/> | Sugar Hill Creamery official website | Confirms explicit Black-owned and woman-led designation, customer offerings, and official social links. |
| <https://www.harlemhaberdashery.com/> | Harlem Haberdashery official website | Opened but returned only a minimal page; no retained record. |
| <https://www.calabar-imports.com/> | Calabar Imports URL | Opened and found a parked-domain page, so not retained. |
| <https://www.kenteroyalgallery.com/> | Kente Royal Gallery official website | Opened and found only a minimal page and Instagram link; no address for retention. |
| <https://www.nypl.org/locations/schomburg> | New York Public Library | Supports the Schomburg cultural-place record with visitor address and institutional description. |
| <https://myrtleavenue.org/blackowned/> | Myrtle Avenue Brooklyn Partnership | BID community list explicitly describes listed businesses as Black-owned; supports Peace & Riot, Hair & Co., Ray’s, Clinton Hill Sandbox, and held leads. |
| <https://www.nyctourism.com/articles/black-owned-bed-stuy-itinerary> | NYC Tourism + Conventions | Supports publisher-designated Bed-Stuy entries; source for Make Manifest and held Brooklyn Tea/Bed-Stuy Museum leads. |
| <https://www.nyctourism.com/articles/black-owned-flatbush/> | NYC Tourism + Conventions | Opened, but the extraction returned no content; no record used. |
| <https://www.nyctourism.com/articles/black-owned-jamaica/> | NYC Tourism + Conventions | Opened, but the extraction returned no content; no record used. |
| <https://www.nyctourism.com/articles/a-weekend-exploring-black-owned-crown-heights> | NYC Tourism + Conventions | Inspected for additional leads; no additional record retained because the present pass already had stronger current sources/destinations. |
| <https://studiomuseum.org/visit> | Studio Museum in Harlem | Supports the Studio Museum cultural-place record with visitor address and contact details. |
| <https://www.apollotheater.org/visit/> | The Apollo Theater | Supports the Apollo cultural-place record, visitor destination, and renovation qualifier. |
| <https://brooklyntea.com/> | Brooklyn Tea official website | Current site identifies a JFK Terminal 4 gate but not a numbered Brooklyn storefront; held. |
| <https://www.peaceandriot.com/> | Peace & Riot official website | Confirms 401 Tompkins Avenue customer shopping destination. |
| <https://www.makemanifestbk.com/> | Make Manifest official website | Confirms current Tompkins Avenue retail/creative-hub address and offerings. |
| <https://www.bedstuymuseum.org/> | Bedford Stuyvesant Museum of African Art official website | Opened but yielded no inspectable content or visitor address; held. |
| <https://restorationplaza.org/> | Bedford Stuyvesant Restoration Corporation official website | Supports the noncommercial community-resource record and headquarters/community-service facts. |
| <http://hairandcobklyn.com/> | Hair & Co. BKLYN official website | Confirms Prospect Heights address, phone, and salon services. |
| <https://www.raysbarbershopnyc.com/> | Ray’s Barber Shop official website | Confirms street address, phone, appointment and walk-in customer destination. |
| <https://www.movewithgrace.com/> | Move With Grace official website | Shows virtual/private program emphasis and no current numbered street address; held. |
| <https://www.sandbox.biz/> | Clinton Hill Sandbox official website | Confirms Myrtle Avenue address, phone, and packing/shipping/printing services. |
| <http://www.voodofe.com/> | Voodo Fé official website | Opened; no numbered address or clear current shop/visitor destination; held. |
| <https://www.weeksvillesociety.org/visit> | Weeksville Heritage Center official visitor page | Supports cultural-place record with address, phone, tours, and visitor information. |
| <https://www.allansbakery.com/> | Allan’s Bakery official website | Confirms customer shop and family/third-generation business designation; Little Caribbean supplies retained numbered Brooklyn address. |
| <https://auntsetuncles.com/> | Aunts et Uncles official website | Confirms Brooklyn customer destination, address, ordering, reservations, and catering. |
| <https://bestbitesrestaurant.com/> | Best Bites official website | Confirms customer site, address, phone, food categories, and family-owned business designation. |
| <https://www.sugarhillcreamery.com/visit-our-locations-1> | Sugar Hill Creamery official locations page | Confirms the retained Central Harlem 184 Lenox Avenue location. |
| <https://www.instagram.com/ahmanijusjuice/> | Ahmani’s Jus Juice Instagram | Opened but extraction returned no content; no record used. |
| <https://www.instagram.com/caribbeanvibesrestaurant/?hl=en> | Caribbean Vibes Restaurant Instagram | Confirms identity, address, and phone for the retained social-destination record. |
| <https://www.instagram.com/cocoabeanjuiceandsaladbar/?hl=en> | Cocoa Bean Instagram | Confirms identity as a smoothie and juice bar for the retained social-destination record. |
| <https://www.instagram.com/mrcsbakery> | Mr. C’s Bakery Instagram | Displays an address conflicting with the Little Caribbean address; held. |
| <https://www.instagram.com/originalculpeppersbk/?hl=en> | Culpepper Instagram | Opened but returned a login page without identity verification; held. |

## Limitations and handling notes

Publisher labels from NYC Tourism + Conventions and Myrtle Avenue Brooklyn Partnership are preserved only as **publisher designations**; a directory inclusion or chamber-style membership is not treated as an ownership certification. Explicit designations on individual official websites are labeled as business designations. Little Caribbean NYC was used as a community-directory source without inferring identity from Caribbean location, cuisine, flags, or name.

A physical business required a numbered street address and an inspected specific official website or official social destination to remain in `candidates.jsonl`. Incomplete addresses, address conflicts, stale-looking local references, parked/minimal pages, login-blocked social identity, and missing current destinations were routed to `held-candidates.jsonl` with `hold_reason`. The pass deliberately retains community resources and cultural institutions under their own target kinds rather than recasting them as commercial listings. No coordinates, directions, hours, prices, accessibility claims, languages, availability, licensing, or health outcomes were added.

Some sources were editorial or community guides with dates earlier than the current inspection. Official sites and official social profiles were opened where available, but this is not a live operational-status verification. The NYC Tourism Flatbush and Jamaica URLs and the Bed-Stuy museum site did not yield usable extracted content when opened; those results are reflected in the ledger and, where applicable, the held file.
