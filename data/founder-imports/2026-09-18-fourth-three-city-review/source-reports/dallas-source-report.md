# Dallas–Fort Worth Source Pass Report

**Scope.** This is one research-only, source-backed pass for Mapping with Melanin across Dallas–Fort Worth and adjacent suburbs. It is **not staged, published, deployed, or written to any public system**. The pass prioritizes public chamber directories, official customer destinations, and City/cultural institution sources. It does not infer identity, ownership, services beyond source text, operational status, licensing, accessibility, or other unprovided facts.

## Results

| Measure | Count |
|---|---:|
| Retained candidates | 11 |
| Held candidates | 11 |
| Unique inspected URLs | 53 |
| Existing local JSONL files checked for normalized exact duplicates | 26 |
| Duplicate matches retained | 0 |

The exact duplicate check was feasible and applied across all pre-existing `*.jsonl` files under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this Dallas output directory. It compared normalized `name + city + state + address`; no retained candidate matched.

### Retained counts by target kind

| targetKind | Count |
|---|---:|
| business | 7 |
| cultural_place | 4 |
| online_business | 0 |
| regulated_review | 0 |
| community_resource | 0 |
| manual_review | 0 |

### Retained counts by category

| Category | Count |
|---|---:|
| Arts & culture | 5 |
| Retail | 2 |
| Home & garden | 2 |
| Food & beverage | 1 |
| Retail & leisure | 1 |

## Inspected source inventory

Every URL below was opened and inspected; search-result snippets were not treated as evidence. “Held” means the URL supplied an incomplete, conflicting, stale, or unverified record rather than a retained candidate.

| URL | What it supported / disposition |
|---|---|
| https://www.dallasblackchamber.org/directory | Dallas Black Chamber’s current public directory context, broad member categories, and source basis; also supplied detailed profile links. |
| https://dallasblacktxcoc.weblinkconnect.com/search | Dallas Black Chamber searchable-directory context and category coverage. |
| https://business.fwhcc.org/list/ | Fort Worth Hispanic Chamber public directory context and its broad category coverage. |
| https://business.fwhcc.org/list/searchalpha/o | FWHCC sample results and links; led to individual record review. |
| https://web.gdhcc.com/directory/directoryemailform.aspx?listingid=630 | Greater Dallas Hispanic Chamber directory interface; this particular contact form did not supply an eligible customer record. |
| https://dallasblacktxcoc.weblinkconnect.com/Beauty-Services- | DBCC beauty category; supplied candidate details and identified records held for unreachable or conflicting destinations. |
| https://dallasblacktxcoc.weblinkconnect.com/Retail | DBCC retail category; supplied customer links/details and records requiring holds. |
| https://dallasblacktxcoc.weblinkconnect.com/Arts | DBCC Arts listing for IMOC Productions; address, phone, destination, category. |
| https://www.dallasblackchamber.org/members-directory/recipe-oak-cliff | Retained Recipe Oak Cliff: Food & Beverage, address, phone, official site. |
| https://www.recipeoc.com/ | Retained Recipe Oak Cliff: official customer site and food/drink descriptions. |
| https://www.dallasblackchamber.org/members-directory/soul-rep-theatre-company | Retained Soul Rep: theatre category, address, phone, official site. |
| https://www.soulrep.org/ | Retained Soul Rep: official theater destination and social links. |
| https://business.fwhcc.org/list/member/office-furniture-plus-5016251 | Retained Office Furniture Plus: showroom listing, address, category, official site. |
| https://www.officefurnitureplus.com/fort-worth-showroom/ | Retained Office Furniture Plus: official showroom address, phone, new/used furniture and space-planning descriptions. |
| https://business.fwhcc.org/list/member/oakspy-signs-and-graphics-5016094 | Retained OakSpy: FWHCC listing, address, phone, official site. |
| http://www.oakspysignsandgraphics.com/ | Retained OakSpy: official services, Richland Hills address, phone, and business-published woman-owned designation. |
| https://business.fwhcc.org/list/member/oovo-window-films-5015932 | Retained OOVO: FWHCC listing, address, phone, official site, category. |
| https://oovo.com/ | Retained OOVO: official Grand Prairie/DFW destination, phone, and window-film descriptions. |
| https://dallasblacktxcoc.weblinkconnect.com/Retail/Smoking-Jacket-Cigar-Lounge-4674 | Retained Smoking Jacket source profile. |
| http://www.smokingjacketcl.com/ | Retained Smoking Jacket: official address, phone, offerings, socials, and business-published WBE/MBE statements. |
| http://imocproductions.com/ | Retained IMOC: official Dallas destination, event presentation, and socials. |
| https://dallasblacktxcoc.weblinkconnect.com/Retail/Brendan-Bass-Showroom-4565 | Attempted detailed DBCC profile; extractor returned a feed-rendering error, so the DBCC retail category page was used as source evidence instead. |
| http://brendanbass.com/ | Retained Brendan Bass: official Dallas showroom address, phone, furnishings/decor descriptions, Instagram. |
| https://sdcc.dallasculture.org/ | Retained South Dallas Cultural Center: official City division, location, programs, and Instagram. |
| https://sdcc.dallasculture.org/contact/ | Attempted official contact page; no extractable content; homepage supplied retained facts. |
| https://dallascityhall.com/departments/arts-culture/Pages/City-Cultural-Facilities.aspx | City corroboration for South Dallas Cultural Center and African American Museum as cultural facilities and their locations. |
| https://aamdallas.org/ | Retained African American Museum Dallas: official mission, visitor programs, address, phone. |
| https://aamdallas.org/contact/ | Museum contact-page corroboration of address, phone, email. |
| https://lcc.dallasculture.org/ | Retained Latino Cultural Center: official City division, mission, address, public programs, socials. |
| https://tbaal.org/ | Official site returned only “Go top”; insufficient to create a record. |
| https://business.fwhcc.org/list/category/retail-store-5005188 | FWHCC retail category screened; no additional record retained without an opened official destination. |
| https://business.fwhcc.org/list/category/engineers-consultant-5005133 | FWHCC coffee category screened; no additional record retained in this non-restaurant-heavy pass. |
| https://business.fwhcc.org/list/category/furniture-5005447 | FWHCC furniture category screened; no additional record retained after official-destination threshold. |
| https://business.fwhcc.org/list/category/non-profit-organization-5005141 | FWHCC nonprofit category screened; public community-resource possibilities required more specific official-destination/entity review than this pass allowed. |
| https://www.dallasblackchamber.org/members-directory/sacred-heart-co.- | Held Sacred Heart: current chamber profile gives Chemical Street address. |
| https://sacredheartcollections.com/ | Held Sacred Heart: official storefront/socials inspected but no resolving address; conflicts with older DBCC portal retail address. |
| https://business.fwhcc.org/list/member/one-safe-place-5014807 | Held One Safe Place: FWHCC profile points to Ladder Alliance and a shared location. |
| https://ladderalliance.org/ | Held One Safe Place: official page supports The Ladder and One Safe Place services but leaves entity naming ambiguous. |
| https://business.fwhcc.org/list/member/ocelotl-mexican-cocinita-5015297 | Held Ocelotl: city/ZIP and phone but no numbered address or official destination. |
| https://business.fwhcc.org/list/member/ocean-star-recycling-inc-5016171 | Held Ocean Star: address/phone/description but no official destination. |
| https://dallasblacktxcoc.weblinkconnect.com/Beauty-Services-/Beauty-B-Hair-Company-Dallas--4779 | Held Beauty B: listing profile; listed official domain was unreachable. |
| http://www.beautybhair.biz/ | Attempted listed official destination; hostname could not resolve to a public IP. |
| https://dallasblacktxcoc.weblinkconnect.com/Retail/Konceited-Kloset-LLC-4717 | Held Konceited Kloset: listing profile; listed domain was unreachable. |
| http://mykonceitedkloset.com/ | Attempted listed official destination; hostname could not resolve to a public IP. |
| https://dallasblacktxcoc.weblinkconnect.com/Beauty-Services-/Tree-of-Life-Salon-Medical-Hair-Loss-Center-4510 | Held Tree of Life: listing profile; medical-titled business and unreachable official domain require review. |
| http://www.treeoflifesalon.com/ | Attempted listed official destination; hostname could not resolve to a public IP. |
| http://www.sheardivaartistry.com/ | Held Shear Diva: official location/phone conflict with chamber category listing. |
| http://www.bestfitalterations1.com/ | Held BestFit: official location conflict with DBCC retail listing. |
| https://business.fwhcc.org/list/member/old-gringo-boot-store-1-5015608 | Held Old Gringo: street address and phone but no official destination. |

## Limitations and handling

This was a bounded, high-yield source pass, not a census. Several chamber profiles omitted a working direct customer destination or a numbered street address; they were held rather than inferred. Some directory records were stale or conflict with an official site; all such records were held. Chamber membership/listing was treated only as a source basis for inclusion—not as an ownership certification. Protected traits, language/bilingual capability, pricing, hours, availability, accessibility, licensing, treatment outcomes, coordinates, pins, and directions were not inferred. No record was staged, published, deployed, or sent externally.

### Additional inspected URLs

| URL | What it supported / disposition |
|---|---|
| http://www.erinsbeautysupply.co/ | Attempted listed official destination from the Dallas Black Chamber retail page; hostname could not resolve to a public IP, so no record was retained. |
| https://dallasblacktxcoc.weblinkconnect.com/Beauty-Services-/Shear-Diva-Artistry-LLC-4875 | Attempted detailed Dallas Black Chamber profile; extractor returned a feed-rendering error. The category page and official site established a location/phone conflict, so the record was held. |
| https://dallasblacktxcoc.weblinkconnect.com/Retail/The-Chic-Collegiate-4741 | Dallas Black Chamber profile supplied the listing’s website, address, phone, and indirect Instagram referral; the listed official domain was then checked. |
| http://www.thechiccollegiate.com/ | Attempted listed official destination; hostname could not resolve to a public IP, so no record was retained. |
