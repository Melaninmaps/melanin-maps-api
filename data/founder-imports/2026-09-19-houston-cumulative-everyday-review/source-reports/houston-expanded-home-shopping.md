# Houston Home Shopping and Household Needs — Research Report

**Scope and result.** This research-only wave identifies **19 candidate destinations** in Houston or the clearly Houston-metro communities of Humble and Seabrook. It focuses on home furnishings, décor, household supplies, renovation materials, cleaning support, laundry-adjacent support, and practical household-resource access. The records pair a customer-facing official destination with an opened credible source. Seven candidates retain an explicit Black-owned designation from Houstonia’s 2022 Houston list, one retains an official self-designation as minority-owned, and the remaining candidates are included for their documented retail, municipal, nonprofit, library, or cultural value without an inferred demographic identity.[1] [2]

The set has useful functional breadth. It includes furniture and décor retail, home fragrance and entry décor shopping, art buying, reuse and renovation materials, nonprofit furniture assistance, public library gardening-tool lending, and cleaning-supply shopping. Municipal and nonprofit records are correctly routed as **community_resource**, while art galleries are routed as **cultural_place**. No regulated provider was included.

| Record type | Candidate count | Examples of documented use |
|---|---:|---|
| Physical business | 7 | Furniture, home décor, hardware, cleaning supplies |
| Online business | 3 | Home fragrance, custom doormats, home décor |
| Community resource | 7 | Reuse materials, furniture help, tool lending, home-improvement resale |
| Cultural place | 2 | Art galleries with documented art sales |
| **Total** | **19** | **Distinct, source-backed records** |

## Evidence and inclusion approach

For every candidate, an official customer-facing site was opened. The `sourceUrl` field either preserves a third-party designation source or points to an official municipal, nonprofit, library, or business destination that supports the record’s existence, location, and/or documented scope. Designation language is deliberately attributed rather than generalized. For example, Houstonia’s January 2022 article is titled “18 Local Black-Owned Businesses To Support”; its Black-owned designation is retained in the applicable records as **Black-owned (Houstonia, 2022)**, not inferred from a name, neighborhood, product, or image.[1]

The household-resource candidates have material access limits that testers should check directly. Houston Furniture Bank’s furniture-assistance pathway is delivered through partner organizations and appointments, Houston ToolBank lends to validated nonprofit or tax-exempt organizations, and the municipal Reuse Warehouse states that inventory is variable and available on a first-come basis.[3] [6] [7] Harris County Public Library’s tool locations require an eligible library cardholder and a signed gardening-tool waiver; the two physical branches remain separate records because they are distinct named locations with their own tool inventories and limits.[8] [9] [10]

## Candidate coverage

The candidate JSONL includes seven source-attributed Black-owned leads: Oasis FINO, Avant-Garde Home, Kicky Mats, Love & Make, Llulo, Bisong Art Gallery, and Mitochondria Gallery. Current official destinations were opened for all seven. Oasis FINO’s Black-owned attribution is from the Houston Chronicle; the official gallery supplies its current address and public contact details.[2] [11] The others rely on Houstonia’s explicit 2022 Black-owned-business-list context while their official destinations support current customer access.[1]

The practical retail and resource portion includes Goodman Janitorial Supplies, whose official homepage explicitly labels the company “Minority-Owned Business,” Living Designs Furniture, Westheimer Plumbing and Hardware, High Fashion Home, and Paloma & Co. The official resources also support the City of Houston Reuse Warehouse, Houston Habitat ReStore, Habitat Northwest Harris County ReStore, Houston Furniture Bank, Houston ToolBank, and two Harris County Public Library gardening-tool branches.[4] [5] [6] [7] [8] [9] [10] [12] [13] [14] [15] [16] [17]

## Held leads and limitations

**Five leads are held rather than promoted to candidates.** The Furniture lead “No Credit Check — Financing Available!” has no numbered location or official destination in the opened Houston Black Pages detail. Atkins Carpet has a directory address and phone but no verified official customer-facing destination. Laundry-4U has an official Houston-area service page, but its location-specific page rendered a verification screen and no numbered current location was obtained. The Gite Gallery’s 2022 Houstonia address cannot be reconciled with its opened official site, which lists products but no address and shows a 2015 footer. Goodwill Houston officially confirms home-goods and furniture sales, but its opened locator did not expose an individual retail address; its corporate office is not substituted for a shop.[18] [19] [20] [21] [22]

The final records do **not** infer current ownership, demographic identity, language, affordability, inventory, quality, accessibility, safety, availability, hours, delivery, licensure, or service outcomes. Existing ownership/designation claims remain tied to named sources and, where applicable, their publication date. Stated addresses, phone numbers, products, and access conditions are source-supported as of the research pass, but availability and operations can change.

## Within-category de-duplication and structural checks

The candidate set was reviewed on normalized name, address, website, and organization/location relationships. There is no duplicate normalized name-and-address pair and no repeated website among candidates. Houston Furniture Bank is represented once despite three resale outlets. Houston Habitat ReStore is distinct from Habitat for Humanity Northwest Harris County ReStore because they are separate operating organizations and official destinations. The two Harris County Public Library records represent different named tool-lending branches with different addresses; they are not duplicate branch records. Living Designs Furniture is limited to its downtown showroom; its second location is noted but not duplicated. Westheimer’s warehouse is similarly noted but not separately recorded.

Both JSONL files use literal `null` for unknown values. Candidate `sourceRow` runs consecutively from 1 through 19; held `sourceRow` runs from 1 through 5. Each record has exactly the specified 23 fields in the requested order. No coordinates have been added.

## Opened sources and URLs

The following pages were opened during this research pass. The first group directly supports candidates; the second group supports held decisions or source screening.

| Ref. | Opened source | Role in this wave |
|---|---|---|
| [1] | Houstonia — Black-owned businesses list | Explicit Black-owned 2022 designations for seven candidates and The Gite held lead |
| [2] | Houston Chronicle — Oasis FINO | Black-owned designation and owners for Oasis FINO |
| [3] | Oasis FINO official gallery | Current customer-facing Houston address, phone, and socials |
| [4] | Houston Furniture Bank official home | Nonprofit mission, retail, and outlet contacts |
| [5] | Houston Furniture Bank assistance page | Partner/appointment assistance pathway |
| [6] | Houston Habitat ReStore official page | Store location and product categories |
| [7] | Habitat Northwest Harris County ReStore official page | Store location and materials/hardware scope |
| [8] | City of Houston Reuse Warehouse | Municipal location, materials, and access conditions |
| [9] | Houston ToolBank official borrow page | Organization eligibility, location, lending scope |
| [10] | Harris County Public Library Tool Library FAQ | Branches, eligible borrowers, tools, lending conditions |
| [11] | Avant-Garde Home official shop | Online home-fragrance and home-decor destination |
| [12] | Love & Make official about page | Houston studio address, workshops, founders, social links |
| [13] | Kicky Mats official shop | Online custom doormat shop and Houston selector |
| [14] | Llulo official shop | Online Home collection |
| [15] | Bisong Art Gallery official site | Art sales and current Houston gallery address |
| [16] | Mitochondria Gallery official site | Current Houston gallery address and exhibitions |
| [17] | Goodman Janitorial Supplies official site | Minority-owned self-designation and cleaning-supply scope |
| [18] | Living Designs Furniture official visit page | Downtown showroom address and furniture scope |
| [19] | Westheimer Plumbing and Hardware official contact page | Showroom address and phone |
| [20] | High Fashion Home official locator | Houston showroom address and phone |
| [21] | Paloma & Co official about page | Founder, store address, and product categories |
| [22] | HCPL Baldwin Boettcher official branch page | Humble branch address and Gardening Tool Library |
| [23] | HCPL Evelyn Meador official branch page | Seabrook branch address and Gardening Tool Library |
| [24] | Houston Black Pages furniture directory/detail | Screened; incomplete furniture held lead |
| [25] | Houston Black Pages cleaning directory | Screened; Atkins Carpet held lead |
| [26] | Laundry-4U official home and locations URL | Screened; location page did not yield address |
| [27] | The Gite Gallery official site | Screened; current official address not provided |
| [28] | Goodwill Houston official shopping and locations pages | Screened; no individual store address rendered |
| [29] | Houston East End Chamber official site | Opened local chamber context while screening Living Designs |
| [30] | Black Book Houston official directory | Opened Black-owned-directory context; no additional eligible household candidate extracted |
| [31] | The Houston Black Pages home | Opened directory-scope context |
| [32] | High Fashion Home official catalog | Opened furniture and décor category support |
| [33] | Paloma & Co official shop | Opened current furniture, art, tabletop, and lighting categories |
| [34] | Houston ToolBank official home | Opened mission and contact context |
| [35] | Houston Furniture Bank official shop | Opened public furniture-shop scope |

## Research-only status

This deliverable is **research-only**. It made **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**. It supplies candidate and held JSONL for later human or system review only.

## References

[1]: https://www.houstoniamag.com/style-and-shopping/2022/01/local-houston-black-owned-shops "Houstonia — 18 Local Black-Owned Businesses To Support"
[2]: https://www.houstonchronicle.com/lifestyle/home-design/article/Houston-is-getting-a-new-Black-owned-furniture-16924232.php "Houston Chronicle — New Black-owned furniture store among home design news in Houston"
[3]: https://www.oasisfinogallery.com/ "Oasis FINO Furniture Gallery at Hermann Park"
[4]: https://houstonfurniturebank.org/ "Houston Furniture Bank — Welcome"
[5]: https://houstonfurniturebank.org/programs-and-services/furniture-assistance-program/ "Houston Furniture Bank — Furniture Assistance Program"
[6]: https://www.houstonhabitat.org/restore/ "Houston Habitat for Humanity — ReStore"
[7]: https://www.habitatnwhc.org/restore/our-store.html "Habitat for Humanity Northwest Harris County — ReStore"
[8]: https://www.houstontx.gov/solidwaste/reuse.html "City of Houston Solid Waste Management — Reuse Warehouse"
[9]: https://www.houstontoolbank.org/borrow/ "Houston ToolBank — Borrow Tools"
[10]: https://hcpl.net/faq/tool-library/ "Harris County Public Library — Tool Library FAQ"
[11]: https://avant-gardehome.com/ "Avant-Garde Home"
[12]: https://www.loveandmake.com/about.html "Love & Make — About"
[13]: https://kickymats.com/ "Kicky Mats"
[14]: https://www.llulo.com/ "Llulo"
[15]: https://bisonggallery.com/ "Bisong Art Gallery"
[16]: https://mitochondriagallery.com/ "Mitochondria Gallery"
[17]: http://www.goodmanjanitorialsupplies.com/ "Goodman Janitorial Supplies & Services Inc."
[18]: https://www.livingdesignsfurniture.com/visit-us "Living Designs Furniture — Visit Our Houston Furniture Stores"
[19]: https://www.westheimerplumbing.com/Contact.HTML "Westheimer Plumbing and Hardware — Contact"
[20]: https://www.highfashionhome.com/pages/store-locator "High Fashion Home — Store Locator"
[21]: https://shoppalomaandco.com/pages/about "Paloma & Co — About"
[22]: https://hcpl.net/locations/BB "Harris County Public Library — Baldwin Boettcher Branch Library"
[23]: https://hcpl.net/locations/EV "Harris County Public Library — Evelyn Meador Branch Library"
[24]: http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-furniture-directory~5620 "The Houston Black Pages — Furniture Listings"
[25]: http://thehoustonblackpages.com/businessdirectory/houston-black-owned-cleaning-services-directory~5625 "The Houston Black Pages — Cleaning Services Listings"
[26]: https://laundry-4u.com/ "Laundry-4U"
[27]: http://thegitegallery.com/site/ "The Gite Gallery"
[28]: https://www.goodwillhouston.org/shop/what-we-sell/ "Goodwill Houston — What We Sell"
[29]: https://www.eecoc.org/ "Houston East End Chamber of Commerce"
[30]: https://www.blackbookhouston.com/ "Black Book Houston"
[31]: http://www.thehoustonblackpages.com/ "The Houston Black Pages"
[32]: https://www.highfashionhome.com/ "High Fashion Home"
[33]: https://shoppalomaandco.com/ "Paloma & Co"
[34]: https://www.houstontoolbank.org/ "Houston ToolBank"
[35]: https://shophoustonfurniturebank.org/ "Houston Furniture Bank — Shop"
