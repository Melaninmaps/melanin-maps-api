# Delaware Third-Depth — Review-Only Mapping Research Report

## Scope and research boundary

This review-only pass covered Delaware statewide, deliberately spanning Wilmington/New Castle County, Dover/Kent County, and Sussex communities. It retained only records for which a public listing-level source and an inspected official customer destination supported the required facts. No map pins, latitude/longitude, geocoding, production writes, account actions, waitlists, payments, or deployments were performed. Claims about ownership, protected traits, licensing, quality, safety, accessibility, hours, price, and availability were not inferred. The two designated regulated categories are routed for review rather than endorsed.

## Exact output counts

- **Retained candidates:** 17
- **Held candidates:** 12
- **Maximum requested:** 100; this pass intentionally does not pad.
- **Existing JSONL files parsed for dedupe:** 102
- **Existing research records parsed:** 3391

## Source families opened and read

| Source family | Listing-system evidence | Records retained | Held / exclusions |
|---|---|---:|---|
| Downtown Wilmington Business Directory | Public directory says it highlights 350+ BID businesses; detail pages contain category, address, phone, and destination links. | 3 | 3 held for destination failure/address conflict; Herbert Studios excluded as exact existing record. |
| Downtown Dover Partnership | Category pages expose local eateries, shops, personal services, public buildings, culture, and lodging with physical addresses. | 4 | 2 held for official-destination issues. |
| Visit Rehoboth Business Listings | Paginated regional directory exposed 233 records and individual profiles with address, phone, website, and descriptions. | 4 | 1 held for a non-numbered address. |
| Western Sussex Chamber Business Directory | Public category directory provides named local members, addresses, phones, and official links. | 5 | No held emitted from this family. |
| DelawareBlack Black Directory | Individual record pages provide category, explicit directory context, contacts, and official destination links when available. | 1 | 6 held for official destination, address, locality, or online-only evidence gaps. |
| Delaware Division of Small Business Business Resource Connection | Public government system has eight pages of organization records and individual profile pages. | 0 | Reviewed for source breadth; non-Delaware physical location not retained. |
| Delaware State Chamber / New Castle County Chamber / Delaware Small Business Chamber | Public chamber directory/search systems were read. | 0 | No adequately exposed individual records selected. |
| Georgetown Chamber and Lewes Chamber | Public Sussex chamber directories were read; Georgetown showed 275 listings. | 0 | Individual profile pages were protected/not extractable or individual listings were not exposed. |
| Cape Gazette, Downtown Dover Dollars, and Delaware State Parks | Public local/public listing systems were read for additional everyday-need coverage. | 0 | No record met this pass’s source-plus-official-destination rules. |
| Main Street Delaware, Ohio | System was opened during discovery. | 0 | Explicitly excluded: Ohio, not Delaware geography. |

## Retention results and category coverage

| Category | Retained count | Names |
|---|---:|---|
| arts and culture | 2 | Clear Space Theatre, Nanticoke River Arts Council |
| automotive | 2 | Delmarva Auto Repair, LLC, Covey’s Car Care, Inc. |
| business services | 1 | Delmarva Digital |
| childcare and education | 1 | Little Folks Too Child Development Center |
| community arts | 1 | Developing Artist Collaboration |
| dining | 3 | Spark’d Creative Pastry + Coffee, The House of Coffi, Bodhi Kitchen |
| government and civic services | 1 | Dover City Hall |
| home services | 1 | Wills Affordable Pest Service, LLC |
| lodging | 1 | State Street Inn |
| public library | 1 | Bridgeville Public Library |
| retail | 2 | Spaceboy Clothing, Bin 66 Wine & Spirits |
| retail and repair | 1 | Del-Mar Appliance |

The retained set deliberately inspected more than eight everyday-need categories: childcare, dining, clothing and specialty retail, appliance sales/repair, alcohol retail, lodging, automotive repair, technology services, pest control, municipal services, library services, and arts/culture. Target-kind counts are: **business: 10**, **community_resource: 4**, **cultural_place: 1**, **regulated_review: 2**.

## Retained record reasons

| Name | Area | Target kind | Why retained |
|---|---|---|---|
| Little Folks Too Child Development Center | New Castle / Wilmington | regulated_review | Listing-level source and official destination support location; routed as regulated_review. |
| Spark’d Creative Pastry + Coffee | New Castle / Wilmington | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Spaceboy Clothing | New Castle / Wilmington | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| The House of Coffi | Kent / Dover | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Del-Mar Appliance | Kent / Dover | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Bodhi Kitchen | Sussex / Rehoboth Beach | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Bin 66 Wine & Spirits | Sussex / Rehoboth Beach | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Clear Space Theatre | Sussex / Rehoboth Beach | cultural_place | Listing-level source and official destination support location; classified noncommercial. |
| Developing Artist Collaboration | Sussex / Rehoboth Beach | community_resource | Listing-level source and official destination support location; classified noncommercial. |
| Delmarva Auto Repair, LLC | Sussex / Greenwood | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Covey’s Car Care, Inc. | Sussex / Seaford | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Delmarva Digital | Sussex / Laurel | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Bridgeville Public Library | Sussex / Bridgeville | community_resource | Listing-level source and official destination support location; classified noncommercial. |
| Nanticoke River Arts Council | Sussex / Seaford | community_resource | Listing-level source and official destination support location; classified noncommercial. |
| Wills Affordable Pest Service, LLC | New Castle / Newark | regulated_review | Listing-level source and official destination support location; routed as regulated_review. |
| State Street Inn | Kent / Dover | business | Listing-level source and inspected official destination support name, category, and numbered address. |
| Dover City Hall | Kent / Dover | community_resource | Listing-level source and official destination support location; classified noncommercial. |

## Held record reasons

| Name | Target kind | Held reason |
|---|---|---|
| Precision’s Barbers Lounge | regulated_review | the source listing supports the name, barbershop category, numbered address, phone, and a Google Business-site URL, but the inspected destination produced no extractable customer content. No reliable inspected official destination was available for retention. It is also a designated regulated-review service category. |
| CoreTen Fitness | manual_review | the public source lists 1007 N Orange Street, while the inspected official site lists 220 W. Eleventh St., Market West, Wilmington, DE 19801. The public address conflict prevents retention. |
| Fulcrum Pharmacy | regulated_review | the source supports the numbered address, phone, pharmacy category, and official URL, but the inspected official destination produced no extractable customer content. A pharmacy is routed to regulated_review. |
| All Clean Floor Care, LLC | manual_review | the DelawareBlack listing describes a Delaware-area mobile floor-care service, but the inspected official site identifies a business located in Northeast Columbia, South Carolina and serving the South Carolina Midlands. The locality conflict prevents Delaware retention. |
| Anderson Travel Services, Inc. | manual_review | the individual directory explicitly describes a “Home Based” travel agency, but provides no official customer website or official business-social destination for inspection and no numbered public business location. The online-only/mobile rule cannot be used because online-only status is not explicitly supported. |
| Star Beyond LLC | manual_review | the directory says the Delaware-based business offers real estate, online education, virtual-assistant services, and work-from-home opportunities. The inspected official destination produced no extractable customer content, no numbered address was supported, and the evidence does not explicitly identify the whole business as online-only. |
| Harveys Heating & A/C LLC | manual_review | the individual listing describes heating, boilers, heat pumps, air conditioners, and water-heater work, but supplies neither a numbered business address nor an official customer website/social destination for inspection. |
| Delaware Afro-American Sports Hall of Fame | manual_review | the individual listing describes the organization’s sports-recognition and educational-support work, but provides neither a numbered current public location nor an official customer destination for inspection. |
| Dover Art League | community_resource | the public source identifies Dover Art League as a nonprofit at 21 W. Loockerman St., but the inspected official destination did not provide extractable content. The required inspected official destination condition was not met. |
| Dover Army Navy Store | manual_review | the public source supports name, street address, phone, and retail category. The inspected official site is an ecommerce destination but did not publish the Dover street address in its extractable content; it is held rather than assuming the online destination confirms the physical location. |
| Browseabout Books | manual_review | the inspected Visit Rehoboth record lists only “Rehoboth Beach Gardens, Rehoboth Beach, Delaware 19971,” not a numbered street address. It is held for an unsupported physical address; no street number is inferred. |
| Biggs Museum of American Art | cultural_place | the public Downtown Dover source supports 406 Federal St. and the museum category, but the supplied/intended official URL resolved to unrelated artist content rather than an identifiable Biggs Museum destination. Held for a reliable official-destination check. |

## Dedupe process

Every existing JSONL under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this output folder, was parsed before emission: **102 files / 3391 records**, with no parse failures. The comparison index normalized Unicode, case, punctuation, whitespace, name, city, state, country, and address. Each proposed retained record was rejected if its full normalized key existed. A conservative exact same-name screen was also applied; **Herbert Studios** was found as an exact existing record and excluded entirely. No uncertain same-name records were merged. All 17 retained rows cleared both screens.

## Inspected URLs

The following table is the complete inventory of URLs opened in this pass, including source/listing systems, individual listings, official customer destinations, and discovery systems. Search-result snippets were not used as evidence.

| Type | URL | Result / use |
|---|---|---|
| Downtown Wilmington BID directory system | <https://downtownwilmingtonde.com/business-directory> | directory index; 350+ business listings; source family reviewed |
| Downtown Wilmington listing | <https://downtownwilmingtonde.com/businesses/2019/4/15/precisions-barbers-lounge> | held: official destination had no extractable content |
| Official customer destination | <https://precision-barbers-lounge.business.site/> | held: no extractable customer content |
| Downtown Wilmington listing | <https://downtownwilmingtonde.com/businesses/2015/09/13/little-folks-too-3> | retained |
| Official customer destination | <https://littlefolkstoo.com/> | retained |
| Downtown Wilmington listing | <https://downtownwilmingtonde.com/businesses/2019/4/25/im-coffee> | retained |
| Official customer destination | <https://www.sparkdcreativepastry.com/> | retained |
| Downtown Wilmington listing | <https://downtownwilmingtonde.com/businesses/2015/09/13/fulcrum-pharmacy-2> | held: official destination had no extractable content |
| Official customer destination | <https://www.fulcrumrx.com/index.htm> | held: no extractable customer content |
| Downtown Wilmington listing | <https://downtownwilmingtonde.com/businesses/2015/09/13/plexus-fitness-2> | held: source/official address conflict |
| Official customer destination | <https://coretenfitness.com/> | held: conflicts with source address |
| Downtown Wilmington listing | <https://downtownwilmingtonde.com/businesses/2015/09/13/spaceboy-clothing-2> | retained |
| Official customer destination | <https://www.spaceboyclothing.com/> | retained |
| Downtown Wilmington listing | <https://downtownwilmingtonde.com/businesses/2015/09/13/pro-shoe-repair-2> | reviewed; no retained record because the listed official destination was restricted Facebook |
| Downtown Wilmington listing | <https://downtownwilmingtonde.com/businesses/2023/12/7/herbert-studios> | excluded as exact existing-corpus duplicate |
| Official customer destination | <https://www.herbertstudios.com/> | inspected for excluded duplicate |
| Downtown Dover local-directory hub | <https://downtowndoverpartnership.com/visit-downtown/> | directory source family reviewed |
| Downtown Dover dining category | <https://downtowndoverpartnership.com/visit-downtown-eat-drink/> | retained House of Coffi; category reviewed |
| Official customer destination | <https://www.thehouseofcoffi.com/> | retained |
| Downtown Dover retail category | <https://downtowndoverpartnership.com/visit-downtown-shop-2/> | retained Del-Mar Appliance; held Dover Army Navy |
| Official customer destination | <https://delmarappliance.com/> | retained |
| Official customer destination | <https://www.doverarmynavy.com/> | held: does not support physical address in extractable customer content |
| Downtown Dover personal services | <https://downtowndoverpartnership.com/visit-downtown-personal-services/> | category reviewed; no retained record |
| Downtown Dover public buildings | <https://downtowndoverpartnership.com/visit-downtown-public-buildings/> | retained Dover City Hall |
| Official City of Dover directory | <https://www.cityofdover.gov/directory> | retained Dover City Hall |
| Downtown Dover culture/explore | <https://downtowndoverpartnership.com/visit-downtown-explore/> | held Dover Art League and Biggs Museum after official-destination checks |
| Official destination | <https://www.doverartleague.com/> | held: no extractable customer content |
| Official destination | <https://www.biggsmuseum.org/> | held: unrelated artist content |
| Downtown Dover stay/gather | <https://downtowndoverpartnership.com/stay-and-gather/> | retained State Street Inn |
| Official customer destination | <https://www.statestreetinn.com/> | retained |
| Downtown Dover financial category | <https://downtowndoverpartnership.com/visit-downtown-banks/> | category reviewed; no retained record |
| Downtown Dover Dollars merchant directory | <https://dover-de.yiftee.com/explore-businesses> | public merchant system inspected; entries not exposed in extraction |
| Visit Rehoboth listing index | <https://www.visitrehoboth.com/listings> | 233-record listing system reviewed |
| Visit Rehoboth profile | <https://www.visitrehoboth.com/browseabout-books> | held: no numbered address |
| Visit Rehoboth profile | <https://www.visitrehoboth.com/bodhi-kitchen> | retained |
| Official customer destination | <https://www.bodhirb.com/> | retained |
| Visit Rehoboth profile | <https://www.visitrehoboth.com/bin-66-beer-wine-spirits> | retained |
| Official customer destination | <https://www.bin66.com/> | retained |
| Visit Rehoboth profile | <https://www.visitrehoboth.com/clear-space-theatre> | retained |
| Official customer destination | <https://www.clearspacetheatre.org/> | retained |
| Visit Rehoboth profile | <https://www.visitrehoboth.com/developing-artist-collaboration> | retained |
| Official customer destination | <https://www.developingarts.org/> | retained |
| Western Sussex Chamber directory | <https://www.westernsussexcoc.com/business-directory/> | listing-level source family reviewed; retained five records |
| Official customer destination | <https://www.delmarvaautorepair.com/> | retained |
| Official contact destination | <https://www.delmarvaautorepair.com/Contact-Us.html> | retained |
| Official customer destination | <https://www.delmarvadigital.com/> | retained |
| Official customer destination | <https://www.delmarvadigital.com/contact.htm> | inspected; retained using source numeric address and no conflict |
| Official customer destination | <https://www.coveyscarcare.com/> | retained |
| Official customer destination | <https://www.bridgevillelibrary.com/> | retained |
| Official customer destination | <https://www.nanticokeriverartscouncil.org/> | retained |
| DelawareBlack individual listing | <https://delawareblack.com/black-directory/listing/wills-affordable-pest-service-llc> | retained as regulated_review |
| Official customer destination | <https://willspest.com/> | retained |
| DelawareBlack individual listing | <https://delawareblack.com/black-directory/listing/star-beyond-llc> | held |
| Official customer destination | <https://www.starbeyondllc.com/> | held: no extractable customer content |
| DelawareBlack individual listing | <https://delawareblack.com/black-directory/listing/anderson-travel-services-inc> | held |
| DelawareBlack individual listing | <https://delawareblack.com/black-directory/listing/all-clean-floor-care-llc> | held: locality conflict |
| Official customer destination | <https://www.allcleanfloorcare.com/> | held: South Carolina location |
| DelawareBlack individual listing | <https://delawareblack.com/black-directory/listing/harveys-heating-a-c-llc> | held |
| DelawareBlack individual listing | <https://delawareblack.com/black-directory/listing/cozy-by-coffield> | reviewed; not retained because public listing lacked numbered location and explicit online-only status |
| DelawareBlack individual listing | <https://delawareblack.com/black-directory/listing/delaware-afro-american-sports-hall-of-fame> | held |
| Delaware State Chamber directory | <https://web.dscc.com/demo/search> | public chamber source family reviewed |
| New Castle County Chamber directory | <https://ncccc.com/member-directory/> | public chamber source family reviewed; individual records not exposed |
| Delaware Small Business Chamber directory | <https://www.dsbchamber.com/member-directory> | public chamber source family reviewed; individual records not exposed |
| Delaware Division of Small Business resource connection | <https://business.delaware.gov/find/> | public/government listing source family reviewed |
| Delaware Division individual organization record | <https://business.delaware.gov/organization-details/?rid=38> | government individual record reviewed; Pennsylvania address, not retained |
| Georgetown Chamber directory | <https://www.georgetowncoc.com/directory.asp> | 275-record Sussex chamber source family reviewed |
| Georgetown Chamber attempted member profile | <https://www.georgetowncoc.com/directory/adkins-produce> | no extractable record |
| Georgetown Chamber attempted member profile | <https://www.georgetowncoc.com/directory/antique-alley-of-bridgeville> | no extractable record |
| Georgetown Chamber attempted member profile | <https://www.georgetowncoc.com/directory/arenas-at-the-airport> | no extractable record |
| Lewes Chamber directory | <https://leweschamber.com/business-directory/> | public Sussex chamber source family reviewed; individual records not exposed |
| Cape Gazette business directory | <https://www.capegazette.com/business-directory> | Sussex-area listing system reviewed; no retained record in this pass |
| Main Street Delaware | <https://www.mainstreetdelaware.com/places/> | excluded from this geography: directory is Delaware, Ohio |
| Delaware State Parks | <https://destateparks.com/> | public source system reviewed; no individual physical candidate emitted |

## Research-only boundary

The JSONL files are research artifacts only. They provide no map coordinates and make no claim about current operating status, ownership beyond attributed directory wording, protected traits, licensure, quality, price, safety, hours, availability, accessibility, or service outcomes. No third-party actions were taken.
