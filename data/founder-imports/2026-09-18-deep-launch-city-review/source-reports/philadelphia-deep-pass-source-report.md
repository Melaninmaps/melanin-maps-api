# Philadelphia and Southeastern Pennsylvania Deep Pass: Source Report
## Outcome
This research-only pass retained **5** candidates and held **6** candidates. The retained set intentionally prioritizes childcare, grooming, pharmacy, legal, and cultural/community needs rather than dining. All regulated services are labeled **regulated_review**; this is a routing label and is not a certification of a license, credential, authorization, safety, quality, availability, or current operating status.
## Counts
| Dataset | Target kind | Category | Count |
|---|---|---:|---:|
| Retained | regulated_review | childcare/family | 1 |
| Retained | regulated_review | salons/barbers/braiders | 1 |
| Retained | regulated_review | health leads | 1 |
| Retained | regulated_review | legal leads | 1 |
| Retained | cultural_place | worship/community | 1 |
| Held | manual_review | childcare/family | 1 |
| Held | manual_review | trades | 1 |
| Held | manual_review | childcare/family | 1 |
| Held | manual_review | salons/barbers/braiders | 1 |
| Held | manual_review | financial leads | 1 |
| Held | manual_review | dining | 1 |

**Exact totals:** retained: 5 (`regulated_review`: 4; `cultural_place`: 1). Held: 6 (`manual_review`: 6).
## Source-family coverage
At least three relevant public source families were inspected. The **Africatown Business Directory / ACANA** family supplied multi-category local leads and explicitly describes its directory as a place for African and Caribbean businesses. The **Greater Philadelphia Hispanic Chamber of Commerce** supplied a public member directory. The **African American Chamber of Commerce of PA, NJ and DE** supplied a public member-directory path. The **Beech Community Services Black Business Directory** and **Visit Philadelphia** Black-owned shops guide provided additional Black-business/cultural directory coverage. **Taller Puertorriqueño** provided a credible cultural-community organization source. The **City of Philadelphia** business and self-employment portal was checked as the municipal/regional business-support family.
Community, cultural, demographic, or ownership wording is preserved only where an inspected public source stated it. In particular, the “African and Caribbean business” entry wording is attributed to the Africatown directory footer; it is not inferred from names, neighborhood, services, or appearance. Taller’s Puerto Rican/Latino wording is quoted as organizational mission language, not an ownership claim.
## Retention and hold decisions
| Entity | Decision | Rationale |
|---|---|---|
| Little Darlings Child Care Center | Retained — regulated_review | Retained as regulated_review because childcare is regulated. No licensing status is certified. Official site describes services and publishes address/phone; source directory independently lists the same address. |
| Details Barber Studio | Retained — regulated_review | Retained as regulated_review because barber/cosmetology services are regulated. No license or credential is certified. Official site names the Philadelphia shop and publishes the same address as the source listing. |
| Davis Pharmacy | Retained — regulated_review | Retained as regulated_review because pharmacy services are regulated. No pharmacy license, service availability, or other credential is certified. The inspected Good Neighbor Pharmacy location page identifies Davis Pharmacy and its address. |
| Fibi Law Firm | Retained — regulated_review | Retained as regulated_review because legal services are regulated. No attorney admission, authorization, outcome, language fluency, availability, or credential is certified. Official Philadelphia page describes immigration services and publishes the address. |
| Taller Puertorriqueño | Retained — cultural_place | Retained as cultural_place. The organization describes its purpose as preserving, developing, and promoting Puerto Rican arts and culture and says it supports other Latino cultural expressions. This is organizational mission wording, not an ownership assertion. Existing records at the address were checked: the prior Julia de Burgos Bookstore record is a different normalized name and was not consolidated. |
| Hope Rising Child Learning Center | Held — manual_review | Held. The directory’s linked .org destination resolved to unrelated casino content. A different inspected .com site described Hope Rising services but did not provide a numbered address. The child-care address therefore cannot be sufficiently corroborated through an official customer destination. |
| Besco Shippers Inc. | Held — manual_review | Held. The only linked business website was inspected and is a HugeDomains sale page, not a usable customer-facing business destination. |
| Peake’s Little Angels Day Care | Held — manual_review | Held. The directory has a numbered address but no linked official website. The inspected candidate Facebook destination displayed “This content is not available right now,” so an accessible customer-facing official destination could not be confirmed. No licensing status is certified. |
| Mamba’s Hair Braiding | Held — manual_review | Held. Source page provides a numbered address and phone, but it does not provide an official customer-facing web or business-social destination. As a cosmetology-related service, it would require regulated_review if later retained; no license is certified. |
| D & D Express Tax Service | Held — manual_review | Held. The source page provides a numbered address and phone but no official customer-facing destination. Tax preparation is treated as regulated_review if later retained; no authorization or credential is certified. |
| Buna Cafe | Held — manual_review | Held. The directory supplies the address and business URL, but the official website returned no extractable page content in inspection. It was not retained without a readable customer-facing official page. |

## Deduplication
Before writing, all JSONL records beneath `/home/ubuntu/directory-research-wave-2026-09-18/` were read, excluding this output folder. The comparison normalized **name + city + state + country + address** by lowercasing and removing non-alphanumeric characters. The retained five records had no exact normalized prior-package match. Existing prior-package matches were excluded rather than re-added: Booker’s Restaurant & Bar, Accesso Care, Acore Construction, Queen & Rook, ACANA, Black and Nobel, Hakim’s Bookstore, Salon A’Marie, and Sistah Scents. Taller Puertorriqueño itself had no exact normalized duplicate; a separately named prior Julia de Burgos Bookstore record at its address was left separate because uncertain/same-address records were not consolidated.
## Inspection ledger
The following ledger enumerates every URL opened or fetched in this pass. Search-result snippets were used only to discover potential URLs; no record was retained solely on a snippet.
| Inspected URL | Page or purpose | Result / decision |
|---|---|---|
| <https://businessdirectory.philaafricatown.org/> | Africatown directory landing | source family; categories and listings inspected |
| <https://beechcompanies.com/beech-community-services/black-business-directory> | Beech Black Business Directory | source family; 2021 PDF directory identified, not used for retention because recency/customer-page verification was not completed |
| <https://aachamber.com/> | African American Chamber of Commerce | source family; member-directory link inspected, not used for retention |
| <https://membership.aachamber.com/list> | AACC member directory link | referenced from inspected source family; not retained from it |
| <https://www.philahispanicchamber.org/> | Greater Philadelphia Hispanic Chamber | source family; membership directory inspected |
| <https://www.philahispanicchamber.org/membership-directory> | GPHCC membership directory | source page reviewed; profiles sampled but all viable matches were existing-record duplicates or lacked suitable local verification |
| <https://www.philahispanicchamber.org/membership-directory/corporate/3440958> | Acore Construction GPHCC profile | sampled; later excluded as prior duplicate |
| <https://www.philahispanicchamber.org/membership-directory/corporate/3440786> | Queen & Rook GPHCC profile | sampled; later excluded as prior duplicate |
| <https://www.philahispanicchamber.org/membership-directory/corporate/3440790> | Phoenix Language Services GPHCC profile | sampled; no physical commercial address, not retained |
| <https://www.philahispanicchamber.org/membership-directory/corporate/3440956> | Accesso Care GPHCC profile | sampled; excluded as prior duplicate |
| <https://www.philahispanicchamber.org/membership-directory/corporate/3533072> | A & I Security GPHCC profile | sampled; no physical commercial address found |
| <https://www.visitphilly.com/articles/philadelphia/black-owned-shops-and-boutiques-in-philadelphia/> | Visit Philadelphia Black-owned shops guide | source family; candidates sampled, but Black and Nobel, Hakim’s, Salon A’Marie, and Sistah Scents were prior duplicates |
| <https://www.blackandnobel.com/> | Black and Nobel official site | inspected; excluded as prior duplicate |
| <https://www.facebook.com/blackandnobel/> | Black and Nobel Facebook | inspected; excluded as prior duplicate |
| <https://hakimsbookstore.com/> | Hakim’s Bookstore official site | inspected; excluded as prior duplicate |
| <https://www.salonamarie.com/> | Salon A’Marie official site | inspected; excluded as prior duplicate |
| <https://www.sistahscents.com/> | Sistah Scents official site | inspected; excluded as prior duplicate |
| <https://www.sistahscents.com/about-1> | Sistah Scents official about | inspected; excluded as prior duplicate |
| <https://www.safiskinsentials.com/> | Safi Skinsentials official site | inspected; no address shown |
| <https://www.instagram.com/american_grammar/> | American Grammar Instagram | inspected; login wall/inaccessible |
| <https://businessdirectory.philaafricatown.org/listing/besco-shippers-inc/> | Besco directory record | held; public source has address but official domain parked |
| <https://bescoshippers.com/> | Besco official domain | held; HugeDomains parked sale page |
| <https://businessdirectory.philaafricatown.org/listing/bookers-restaurant-dock-bar/> | Booker’s directory record | excluded as prior duplicate |
| <https://www.bookersrestaurantandbar.com/> | Booker’s official site | inspected; excluded as prior duplicate |
| <https://businessdirectory.philaafricatown.org/listing/buna-cafe/> | Buna directory record | held; linked official site unreadable |
| <https://bunacafephilly.com/> | Buna Cafe official site | held; no extractable content |
| <https://businessdirectory.philaafricatown.org/listing-category/child-care/> | Africatown child-care category | source category reviewed |
| <https://businessdirectory.philaafricatown.org/listing/little-darling-child-care-center/> | Little Darlings directory record | retained; address corroborated by official customer site |
| <https://littledarlings.dev/> | Little Darlings official site | retained; corroborates address/services |
| <https://businessdirectory.philaafricatown.org/listing/peakes-little-angels-day-care/> | Peake’s directory record | held; official social destination inaccessible |
| <https://www.facebook.com/100042647216086/> | Peake’s Facebook | held; content unavailable |
| <https://businessdirectory.philaafricatown.org/listing/hope-rising-child-learning-center/> | Hope Rising directory record | held; .org destination mismatch |
| <https://www.hoperisingchild.org/> | Hope Rising directory-linked site | held; unrelated casino content |
| <https://www.hoperisingchild.com/home-2> | Hope Rising alternate site | inspected; service page lacked numbered address |
| <https://businessdirectory.philaafricatown.org/listing-category/shopping/> | Africatown shopping category | source category reviewed; no retained candidate with official destination |
| <https://businessdirectory.philaafricatown.org/listing/umu-international-market/> | Umu International Market record | inspected; no official customer destination linked |
| <https://businessdirectory.philaafricatown.org/listing/jinxed-phila-variety-store/> | Jinxed record | inspected; no official customer destination linked |
| <https://businessdirectory.philaafricatown.org/listing-category/beauty-personnal-care/> | Africatown beauty category | source category reviewed |
| <https://businessdirectory.philaafricatown.org/listing/details-barber-studio/> | Details directory record | retained; official site corroborates address |
| <https://detailsbarber.com/> | Details official site | retained; corroborates address/services |
| <https://businessdirectory.philaafricatown.org/listing/mambas-hair-braiding/> | Mamba’s directory record | held; no official customer destination on source page |
| <https://businessdirectory.philaafricatown.org/listing-category/home-services/> | Africatown home-services category | source category reviewed |
| <https://businessdirectory.philaafricatown.org/listing/straight-line-contractor-llc/> | Straight Line Contractor record | inspected; no official customer destination |
| <https://businessdirectory.philaafricatown.org/listing-category/community-government/> | Africatown community category | source category reviewed |
| <https://businessdirectory.philaafricatown.org/listing/fibi-immigration-law-offices/> | Fibi directory record | retained; official office page corroborates address |
| <https://fibilaw.com/philadelphia-pa> | Fibi official Philadelphia office | retained; corroborates address/services |
| <https://fibilaw.com/immigration-offices-and-locations> | Fibi official locations | corroborates Philadelphia office address |
| <https://businessdirectory.philaafricatown.org/listing/du-bois-robeson-peoples-center/> | Du Bois Robeson record | inspected; customer social URL not independently readable during pass |
| <https://businessdirectory.philaafricatown.org/listing-category/medical-services/> | Africatown medical category | source category reviewed |
| <https://businessdirectory.philaafricatown.org/listing/davis-pharmacy/> | Davis directory record | retained; customer pharmacy page corroborates address |
| <https://www.mygnp.com/pharmacies/davis-pharmacy-philadelphia-pa-19143/> | Davis Pharmacy customer page | retained; corroborates address and pharmacy status |
| <https://businessdirectory.philaafricatown.org/listing-category/financial-services/> | Africatown financial category | source category reviewed |
| <https://businessdirectory.philaafricatown.org/listing/d-d-express-tax-service/> | D & D directory record | held; no official customer destination |
| <https://businessdirectory.philaafricatown.org/listing-category/personnal-care-service/> | Africatown personal-care category | inspected; no listings |
| <https://acanaus.org/> | ACANA official site | source family; community organization and service scope inspected |
| <https://acanaus.org/contact/> | ACANA contact | official address corroboration; ACANA candidate excluded as prior duplicate |
| <https://acanaus.org/legal-services> | ACANA legal services | source-family scope inspected; ACANA excluded as prior duplicate |
| <https://philaafricatown.org/> | Africatown official site | source-family context inspected |
| <https://tallerpr.org/> | Taller official home | retained cultural place; corroborates address/services |
| <https://tallerpr.org/dev/about-us/> | Taller official about | retained cultural place; corroborates mission/address |
| <https://tallerpr.org/contact/> | Taller contact | inspected; not found page, address unavailable there |
| <https://www.acoreconstruction.com/> | Acore official site | inspected; excluded as prior duplicate |
| <https://acoreconstruction.com/contact-us> | Acore official contact | inspected; excluded as prior duplicate |
| <https://acoreconstruction.com/mbe-%26-wbe-certifications> | Acore certifications | inspected; excluded as prior duplicate |
| <https://www.queenandrookcafe.com/> | Queen & Rook official site | inspected; excluded as prior duplicate |
| <https://plsi.net/> | Phoenix Language Services official site | inspected; mailing address only, no physical commercial destination |
| <https://www.accessocare.com/> | Accesso Care official site | inspected; excluded as prior duplicate |
| <https://aandisecurity.com/> | A & I Security official site | inspected; no physical commercial address shown |
| <https://www.phila.gov/services/business-self-employment/> | City of Philadelphia business support | municipal source family checked; support portal, not a candidate directory |
| <https://businessdirectory.philaafricatown.org/listing-category/arts-entertainment/> | Africatown arts category | inspected; unavailable/removed page |

## Research-only boundary
This pass created local research artifacts only. It made **no** production database or API calls; did not publish records; did not create map pins, coordinates, directions, user accounts, authentication changes, payments, deployments, waitlists, or other operational changes. No latitude or longitude appears in the JSONL. Customer-facing web pages are retained solely as evidence links.
## References
[1]: https://businessdirectory.philaafricatown.org/ "Africatown Business Directory"
[2]: https://www.philahispanicchamber.org/membership-directory "Greater Philadelphia Hispanic Chamber membership directory"
[3]: https://aachamber.com/ "African American Chamber of Commerce"
[4]: https://beechcompanies.com/beech-community-services/black-business-directory "Beech Community Services Black Business Directory"
[5]: https://www.visitphilly.com/articles/philadelphia/black-owned-shops-and-boutiques-in-philadelphia/ "Visit Philadelphia Black-owned shops guide"
[6]: https://acanaus.org/ "ACANA official site"
[7]: https://tallerpr.org/ "Taller Puertorriqueño official site"
[8]: https://www.phila.gov/services/business-self-employment/ "City of Philadelphia Business & self-employment"
