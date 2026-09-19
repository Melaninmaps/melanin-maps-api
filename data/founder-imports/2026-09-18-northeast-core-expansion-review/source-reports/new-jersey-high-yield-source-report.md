# New Jersey Review-Only Mapping Research Report

**Scope and result.** This research package covers New Jersey statewide, with the retained set concentrated in South Jersey and the Philadelphia commuter corridor. It contains **13 retained review targets** and **4 held targets**. It does not assert or infer ownership, demographic identity, culture, language, licensure, price, hours, quality, safety, availability, or accessibility. Where an official page itself displays a license or service description, that is recorded only as a routing signal rather than independently validated fact.

## Source-family coverage and approach

Four public source families were opened and read. The Statewide Hispanic Chamber of Commerce of New Jersey Business Link was examined as a Hispanic-business-association directory. The South Jersey Business Association Local Business Directory was examined as a local association directory. The Chamber of Commerce Southern New Jersey member directory was examined as a regional association directory. Downtown Camden’s Business Directory was examined as a local downtown association directory. The source family describes its directory or membership network; it is **not** evidence that a listed business has any owner characteristic, and no such characteristic was inferred.

The retained sample spans **six everyday-need categories**: home services, business services, community services, automotive, dining, health, and bakery retail. Dining accounts for two retained records and was not used as the sole focus.

## Retention and hold decisions

Every retained physical record has a name, category, source listing URL, inspected official customer website, and a numbered New Jersey address supported without an observed address conflict. Regulated services are routed as `regulated_review`; noncommercial routes are typed as `community_resource`. No coordinates, map pins, geocoding, production writes, deployment changes, authentication changes, or publication were performed.

| Disposition | Records | Reasoning |
|---|---:|---|
| Retained | 13 | Source profile/listing and inspected official customer destination identify the entity. A numbered New Jersey address is supported without a discovered conflict. |
| Held | 4 | Phoenician Construction’s official destination was unreadable; RGB Construction has conflicting source and official addresses; Aether Electrical lacks both a numbered address and official customer destination; South Jersey Eye Center lacks a source-linked official destination and a separately inspected plausible site did not confirm its name/address relationship. |
| Excluded before output | 1 | Viva Margar Bake Art was inspected from the Statewide Hispanic Chamber listing but its normalized name/city/state/country/address exactly matched a prior package record, so it was not re-added to either JSONL. |

### Retained record notes

| sourceRow | Name | Target kind | Source family | Address support and destination check |
|---:|---|---|---|---|
| 1 | Luminous Solar | business | South Jersey Business Association | Directory and official site publish 3747 Church Road, Suite 107, Mount Laurel. |
| 2 | Runnemede Plumbing, Heating, Cooling & Electric | regulated_review | South Jersey Business Association | Directory and official site publish 39 N. Black Horse Pike, Runnemede. |
| 3 | Bricks Chimney Services | business | South Jersey Business Association | Directory publishes 1200 Delsea Dr, #6, Westville; official site is identity-matched. |
| 4 | Fresh Start Restoration | regulated_review | South Jersey Business Association | Directory publishes 1595 Imperial Way, STE 112, West Deptford; official site is identity-matched. |
| 5 | Digital Marketing Group, LLC | business | South Jersey Business Association | Source address and official Five Greentree Centre address identify the same 525 NJ-73 N, Suite 104, Marlton location. |
| 6 | ACE Handyman Services South Jersey & Philadelphia | regulated_review | Chamber of Commerce Southern New Jersey | Both pages publish 923 Haddonfield Road, Cherry Hill. |
| 7 | Cathedral Kitchen | community_resource | Chamber of Commerce Southern New Jersey | Both pages publish 1514 Federal Street, Camden. |
| 8 | 21 Plus, Inc. | community_resource | Chamber of Commerce Southern New Jersey | Both pages publish 1900 Route 70, Suite 12, Manchester. |
| 9 | Genesis of Cherry Hill | business | South Jersey Business Association | Source publishes 550 W Route 70, Marlton; official dealer page confirms the business and Marlton locality. |
| 10 | Victor’s Pub | business | Downtown Camden | Both pages publish 1 Market Street, Camden. |
| 11 | Southern Pest Control | regulated_review | South Jersey Business Association | Source publishes 3300 Crescent Blvd, Oaklyn; customer site identifies the New Jersey business and Oaklyn contact. |
| 12 | Rizzo Family Chiropractic Center | regulated_review | South Jersey Business Association | Both pages publish 401 Harmony Rd, Suite 25, Gibbstown. |
| 13 | Angela Logan’s Mortgage Apple Cakes | business | Statewide Hispanic Chamber Business Link | Both pages publish 740 Chestnut Avenue, Teaneck. |

### Held record notes

| sourceRow | Name | Target kind | Hold reason |
|---:|---|---|---|
| 14 | Phoenician Construction, LLC | manual_review | Customer URL was opened but returned no readable official content. |
| 15 | RGB Construction | manual_review | Source says 1104 Parliament Way, West Deptford; official site says 401 Southgate Ct, Mickleton. |
| 16 | Aether Electrical | manual_review | Association page lists only Bellmawr locality and no customer-facing official destination. |
| 17 | South Jersey Eye Center | regulated_review | Source does not supply official destination; the separately inspected plausible site uses a different business name and does not confirm the Camden address. |

## Deduplication

Before writing, **all 82 JSONL files** under `/home/ubuntu/directory-research-wave-2026-09-18/` were parsed, excluding only this output directory. The procedure compared normalized **name + city + state + country + address**, stripping case, punctuation, spacing, and diacritics. It blocked any exact normalized composite collision and checked for duplicate keys within this package. No retained or held output record collides with a prior package record. The Viva Margar Bake Art chamber profile was excluded because it collided exactly with a record in `existing-tri-state-candidates.jsonl`. Uncertain same-name records were not merged.

## Inspected URL log

The following table logs every URL opened or attempted in this pass. “Read” means public page content was extracted and assessed; “failed extract” means no usable readable content was returned; “excluded” means it was not written because the dedupe test blocked it.

| # | URL | Result and use |
|---:|---|---|
| 1 | https://business.shccnj.org/list | Read. Statewide Hispanic Chamber category index and individual-profile structure. |
| 2 | https://www.southjerseybusinessassociation.org/local-business-directory/ | Read. South Jersey Association local directory and individual listing links. |
| 3 | https://mydowntowncamden.com/business-directory/ | Read. Downtown Camden category index and individual listing links. |
| 4 | https://chamberofcommercesouthernnewjerseyccsnj.growthzoneapp.com/directory/FindStartsWith?term=%23%21 | Read. CCSNJ member directory with addresses and destinations. |
| 5 | https://www.southjerseybusinessassociation.org/listings/luminous-solar/ | Read. Retained source profile for Luminous Solar. |
| 6 | https://www.southjerseybusinessassociation.org/listings/phoenician-construction-llc/ | Read. Held source profile for Phoenician Construction. |
| 7 | https://www.southjerseybusinessassociation.org/listings/runnemede-plumbing-heating-cooling-electric/ | Read. Retained source profile for Runnemede Plumbing. |
| 8 | https://www.southjerseybusinessassociation.org/listings/bricks-chimney-services/ | Read. Retained source profile for Bricks Chimney Services. |
| 9 | https://www.southjerseybusinessassociation.org/listings/fresh-start-restoration-anthony-cellasio/ | Read. Retained source profile for Fresh Start Restoration. |
| 10 | https://www.southjerseybusinessassociation.org/listings/aether-electrical/ | Read. Held source profile for Aether Electrical. |
| 11 | https://www.southjerseybusinessassociation.org/listings/roofers-in-south-jersey/ | Read. Held source profile for RGB Construction. |
| 12 | https://www.southjerseybusinessassociation.org/listings/digital-marketing-group-llc/ | Read. Retained source profile for Digital Marketing Group. |
| 13 | https://www.luminoussolar.com/ | Read. Official customer site, identity and Mount Laurel address confirmed. |
| 14 | https://www.phoenicianconstructioninc.com/ | Failed extract. Official destination could not be confirmed for retention. |
| 15 | https://www.thebigredr.com/ | Read. Official customer site, Runnemede identity and address confirmed. |
| 16 | https://www.fixedbybricks.com/ | Read. Official Bricks Chimney Services identity confirmed. |
| 17 | http://www.getafreshstartrestoration.com/ | Read after redirect. Official Fresh Start identity confirmed. |
| 18 | https://rgbconstructionservices.com/ | Read. Official identity found; Mickleton address conflicted with source address. |
| 19 | https://thinkdmg.com/ | Read. Official Digital Marketing Group identity and Marlton address confirmed. |
| 20 | https://business.shccnj.org/list/category/grocery-stores-72 | Read. Hispanic Chamber grocery category sampled; no additional qualifying destination was retained. |
| 21 | https://business.shccnj.org/list/category/bakery-and-cafe-164 | Read. Hispanic Chamber bakery category; led to individual profiles. |
| 22 | https://business.shccnj.org/list/category/auto-repair-services-123 | Read. Hispanic Chamber auto-repair category sampled; no qualifying customer destination found. |
| 23 | https://chamberofcommercesouthernnewjerseyccsnj.growthzoneapp.com/directory/Details/ace-handyman-services-south-jersey-philadelphia-4368597 | Read. Retained source profile for ACE Handyman. |
| 24 | https://www.acehandymanservices.com/offices/south-jersey-and-philadelphia | Read. Official customer location page, identity and Cherry Hill address confirmed. |
| 25 | https://chamberofcommercesouthernnewjerseyccsnj.growthzoneapp.com/directory/Details/cathedral-kitchen-891747 | Read. Retained source profile for Cathedral Kitchen. |
| 26 | https://www.cathedralkitchen.org/ | Read. Official organization site, identity and Camden address confirmed. |
| 27 | https://chamberofcommercesouthernnewjerseyccsnj.growthzoneapp.com/directory/Details/21-plus-inc-1657129 | Read. Retained source profile for 21 Plus. |
| 28 | http://www.21plus.org/ | Read. Official organization site, identity and Manchester address confirmed. |
| 29 | https://mydowntowncamden.com/places/south-jersey-eye-center/ | Read. Held source profile for South Jersey Eye Center. |
| 30 | https://www.sjeye.com/ | Read. Plausible but unlinked site; identity/address not matched to source, so held. |
| 31 | https://business.shccnj.org/list/member/viva-margar-bake-art-llc-46839 | Read. Excluded because exact prior normalized composite duplicate. |
| 32 | https://www.vivamargar.com/ | Attempted official destination; hostname could not be resolved. No output record written because prior dedupe already blocked the entity. |
| 33 | https://www.southjerseybusinessassociation.org/listings/genesis-of-cherry-hill/ | Read. Retained source profile for Genesis of Cherry Hill. |
| 34 | https://www.genesisofcherryhill.com/ | Read. Official customer dealer site, identity and Marlton locality confirmed. |
| 35 | https://www.southjerseybusinessassociation.org/listings/southern-pest-control/ | Read. Retained source profile for Southern Pest Control. |
| 36 | https://southernpestcontrol.com/ | Read. Mismatched Virginia/Maryland company; not used. |
| 37 | https://mydowntowncamden.com/places/victors-pub/ | Read. Retained source listing for Victor’s Pub. |
| 38 | https://www.victorspub.com/ | Read. Official customer site, identity and Camden address confirmed. |
| 39 | https://www.southjerseybusinessassociation.org/listings/rizzo-family-chiropractic-center/ | Read. Retained source profile for Rizzo Family Chiropractic Center. |
| 40 | https://business.shccnj.org/list/member/angela-logan-s-mortgage-apple-cakes-51452 | Read. Retained source profile for Mortgage Apple Cakes. |
| 41 | http://www.gibbstownchiro.com/ | Read after redirect. Official customer site, identity and Gibbstown address confirmed. |
| 42 | http://www.maccakes.com/ | Read. Official Mortgage Apple Cakes site, identity and Teaneck address confirmed. |
| 43 | https://southernpestcontrolnj.com/ | Read. Correct New Jersey customer site, identity and Oaklyn contact confirmed. |
| 44 | https://mydowntowncamden.com/places/category/professional-services/ | Read. Downtown Camden professional-services category sampled. |
| 45 | https://www.southjerseybusinessassociation.org/listing-category/heating-and-air-conditioning/ | Read. South Jersey Association home-service category sampled. |
| 46 | https://business.shccnj.org/list/category/contractors-23 | Read. Hispanic Chamber contractors category sampled. |
| 47 | https://chamberofcommercesouthernnewjerseyccsnj.growthzoneapp.com/directory/Category/community-nonprofit-organizations-11 | Failed extract. No record was based on this URL. |

## Research-only boundary

This is a **review-only research package**. It was not published publicly and did not create map pins, geocode addresses, call a production database or API, alter deployment, authentication, passwords, waitlists, or payment settings. It makes no operational, quality, safety, availability, access, ownership, protected-trait, or credential validation claim. The required output is limited to local JSONL research artifacts and this source report.

## Counts

| Dimension | Count |
|---|---:|
| Retained candidates | 13 |
| Held candidates | 4 |
| Inspected/attempted URLs logged | 47 |
| Source families checked | 4 |
| Everyday-need categories represented by retained records | 6 |
| `business` | 6 |
| `regulated_review` | 5 |
| `community_resource` | 2 |
| `manual_review` held | 3 |
| `regulated_review` held | 1 |

### Category counts

| Category | Retained | Held | Total |
|---|---:|---:|---:|
| Home services | 6 | 3 | 9 |
| Business services | 1 | 0 | 1 |
| Community services | 2 | 0 | 2 |
| Automotive | 1 | 0 | 1 |
| Dining | 2 | 0 | 2 |
| Health | 1 | 1 | 2 |

## References

[1]: https://business.shccnj.org/list "Statewide Hispanic Chamber of Commerce of New Jersey Business Link"
[2]: https://www.southjerseybusinessassociation.org/local-business-directory/ "South Jersey Business Association Local Business Directory"
[3]: https://chamberofcommercesouthernnewjerseyccsnj.growthzoneapp.com/directory/FindStartsWith?term=%23%21 "Chamber of Commerce Southern New Jersey Member Directory"
[4]: https://mydowntowncamden.com/business-directory/ "Downtown Camden Business Directory"
