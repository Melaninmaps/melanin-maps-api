# Pennsylvania Philadelphia Suburbs — Second-Depth Review-Only Research Report

## Scope and result

This **review-only** package covers Pennsylvania Philadelphia suburbs: Bucks, Chester, Delaware, and Montgomery Counties. Philadelphia city was excluded. It retains **19** records only where a public listing-level source, inspected official customer-facing destination, and publicly supported numbered street address were available without an unresolved conflict. It does not attempt to reach the 90-record ceiling.

| Target kind | Count |
|---|---:|
| `business` | 6 |
| `community_resource` | 3 |
| `cultural_place` | 1 |
| `regulated_review` | 9 |
| **Retained total** | **19** |
| `manual_review` held | 6 |

| Category | Retained count |
|---|---:|
| Arts and Culture | 1 |
| Childcare and Family | 1 |
| Community | 1 |
| Faith and Community | 1 |
| Food | 1 |
| Groceries | 1 |
| Grooming | 1 |
| Health | 3 |
| Home Services | 3 |
| Legal and Finance | 2 |
| Recreation | 3 |
| Retail | 1 |

The retained set covers at least eight everyday-need category groupings: **home services, groceries/food, childcare/family, health, legal/finance, faith/community, grooming, and recreation**. `regulated_review` is a routing label for further independent review; it is not a finding about a license, credential, quality, price, availability, safety, or outcome.

## Public source families inspected

| Source family | Jurisdiction / role | Result in this package |
|---|---|---|
| Ambler Main Street Business Directory | Montgomery County BID | Retained 9 and held 3 listing-level records. |
| Kennett Collaborative Business Directory | Chester County downtown/community directory | Retained 5 listing-level records; a sixth inspected lead was excluded as an existing-package duplicate. |
| Upper Bucks Chamber of Commerce Business Directory | Bucks County chamber directory | Retained 3 and held 2 listing-level records. |
| Delaware County Chamber of Commerce Atlas Member Directory | Delaware County chamber directory; current category records | Retained 2 and held 1 listing-level record; a third inspected lead was excluded as an existing-package duplicate. |
| Middletown Township Business Directory | Official Bucks municipal directory | Inspected as a fresh source-family check; no new record retained because its early records were already represented or unsuitable in prior research. |
| Downtown West Chester | Chester County BID | Inspected; no additional complete listing-level record retained in this bounded pass. |
| Chester County Resource Directory | Official county community directory | Inspected; no new record retained in this bounded pass. |
| Media Business Authority / Visit Media PA | Delaware County business authority | Inspected; directory was marked “Updated Directory Coming Soon,” so it yielded no listing record. |
| Bucks County Alive | Bucks local business directory | Inspected; its accessed landing material did not provide a suitable numbered listing-level address for a new retained record. |
| Chester County Chamber of Business & Industry | Chester County chamber | Inspected; the accessed extraction did not expose complete member listings. |

The Ambler, Kennett, Upper Bucks, and current Delaware County category directories supplied listing-level records. Sources used in the previous suburban package were not re-used as prior records; current directory categories were treated as fresh listings only after examining individual records and applying the all-package dedupe screen.

## Evidence method and classification

Each retained record has (1) a `sourceUrl` that was opened and read at listing level, (2) an inspected official customer-facing website in `website`, and (3) a numbered street address. `notes` describes the narrow evidence basis. The sole ownership designation retained is for The Pagano Law Firm and is expressly attributed to the **Delaware County Chamber category listing**; it is not independently inferred. No protected trait, ownership, culture, language, licensure, price, hours, quality, safety, availability, or accessibility fact is inferred.

## Deduplication

Before writing, the final validation parsed **3181** JSON records from **96** existing JSONL files under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this output folder. It normalizes Unicode to ASCII where possible, lowercases, and removes non-alphanumeric characters. It compared normalized **name + city + state + country + address** for full-key equality and also ran a conservative same-normalized-name screen against every existing package record. Any collision aborts the build. The final new retained and held sets have **zero detected same-name or full-key collisions** with pre-existing package records; uncertain matches were not merged.

## Record disposition ledger

### Retained

| Name | Target kind | Source family | Disposition |
|---|---|---|---|
| Amazing Decks | `regulated_review` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Weaver’s Way Co-op | `business` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Mattie Dixon Community Cupboard | `community_resource` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Act II Playhouse | `cultural_place` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Kanna Fitness | `business` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Ambler Coal Building Supply | `business` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Ambler Flower Shop | `business` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| First Presbyterian Church | `community_resource` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Prive Salon | `regulated_review` | Ambler Main Street Business Directory (BID) | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Children's Developmental Program, Inc. | `regulated_review` | Upper Bucks Chamber of Commerce Business Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Mastery Plumbing, LLC | `regulated_review` | Upper Bucks Chamber of Commerce Business Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| River Crossing YMCA — Quakertown YMCA | `community_resource` | Upper Bucks Chamber of Commerce Business Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Hunter Family Acupuncture & Wellness | `regulated_review` | Kennett Collaborative Business Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Kennett Square Family Dentistry | `regulated_review` | Kennett Collaborative Business Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Yoga Secrets | `business` | Kennett Collaborative Business Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Kennett Square Massage, LLC | `regulated_review` | Kennett Collaborative Business Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| The Country Butcher | `business` | Kennett Collaborative Business Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| The Pagano Law Firm, LLC | `regulated_review` | Delaware County Chamber of Commerce Atlas Member Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |
| Brandywine Financial Advisors, LLC | `regulated_review` | Delaware County Chamber of Commerce Atlas Member Directory | Retained: listing-level source, official destination, and supported numbered address inspected. |

### Held

| Name | Source family | Disposition |
|---|---|---|
| Rittenhouse & Sons, Inc. | Upper Bucks Chamber of Commerce Business Directory | HELD — the public Chamber listing supplies a physical address, but the inspected listed official domain displays a parked-domain page rather than a reliable customer-facing destination. |
| LifeSpan Day Care | Upper Bucks Chamber of Commerce Business Directory | HELD — the Chamber listing provides address and official-domain link, but the official-domain inspection could not resolve a public hostname; no reliable customer-facing destination was established. |
| Butler Pike Periodontal Associates | Ambler Main Street Business Directory (BID) | HELD — Ambler Main Street lists 140 E Butler Avenue, Ambler. The inspected official site redirects to a practice site whose published Pennsylvania location is 1600 N Bethlehem Pike, Lower Gwynedd; the physical-location conflict was not resolved. |
| Magical Trims Cuts for Kids Hair Salon | Ambler Main Street Business Directory (BID) | HELD — the BID listing supplies name, address, and a business-site URL, but that listed official destination did not yield readable public customer-facing content during inspection. |
| Ambler Korean Presbyterian Church | Ambler Main Street Business Directory (BID) | HELD — the BID listing supplies an address and official-domain link, but the inspected linked domain returned only an empty body and did not establish a reliable public customer/organization destination. |
| DiOrio & Sereni, LLP | Delaware County Chamber of Commerce Atlas Member Directory | HELD — the Chamber category listing gives a Media address, but the inspected official URL redirects visitors to two differently named law-firm sites and does not corroborate the directory’s current business/location identity. |

## URL inspection ledger

Every public URL opened/read in this pass is included below. Search-result snippets were used only to discover sources and were not used as listing evidence.

| Inspected URL | Result / disposition |
|---|---|
| https://amblermainstreet.org/directory/ | Ambler BID main directory read; contains Act II listing and directory taxonomy. |
| https://amblermainstreet.org/directory/?cn-s=&cn-cat=11 | Ambler BID beauty/spa category read; retained Prive; held Magical Trims. |
| https://amblermainstreet.org/directory/?cn-s=&cn-cat=10 | Ambler BID health/wellness category read; retained Kanna; held Butler Pike Periodontal. |
| https://amblermainstreet.org/directory/?cn-s=&cn-cat=12 | Ambler BID house/home category read; retained Amazing Decks, Ambler Coal, Ambler Flower Shop. |
| https://amblermainstreet.org/directory/?cn-s=&cn-cat=8 | Ambler BID house-of-worship category read; retained First Presbyterian; held Ambler Korean Presbyterian. |
| https://amblermainstreet.org/directory/?cn-s=&cn-cat=9 | Ambler BID professional-services category read for coverage; no retained new record from this URL. |
| https://amblermainstreet.org/directory/?cn-s=&cn-cat=13 | Ambler directory URL read; response was automotive category rather than the queried family category; no retained record. |
| https://amblermainstreet.org/directory/?cn-s=&cn-cat=2 | Ambler directory URL read; response was organization category; provided community directory context only. |
| https://amblermainstreet.org/directory/name/amazing-decks/ | Ambler individual listing read; retained Amazing Decks. |
| https://amblermainstreet.org/directory/name/ambler-food-co-op/ | Ambler individual listing read; retained Weaver’s Way Co-op. |
| https://amblermainstreet.org/directory/name/mattie-dixon-community-cupboard/ | Ambler individual listing read; retained Mattie Dixon Community Cupboard. |
| https://kennettcollaborative.org/explore/ | Kennett Collaborative directory read; retained six Kennett Square records. |
| https://www.downtownwestchester.com/directory/ | West Chester BID site read; no complete new listing record retained. |
| https://www.downtownwestchester.com/personal-services/ | Extraction yielded no usable listing content; no retention. |
| https://www.downtownwestchester.com/professional-services/ | Returned nonexistent-page result; no retention. |
| https://www.visitmediapa.com/directory | Media Business Authority directory read; “Updated Directory Coming Soon”; no retention. |
| https://www.doylestownborough.net/Directory.aspx | Extraction returned no content; no retention. |
| https://web.ubcc.org/search | Upper Bucks Chamber search/category directory read. |
| https://web.ubcc.org/Day-Care | Upper Bucks day-care listings read. |
| https://web.ubcc.org/Day-Care/Children%27s-Developmental-Program,-Inc-150 | Upper Bucks individual child-care listing read; retained Children’s Developmental Program. |
| https://web.ubcc.org/Plumbing | Upper Bucks plumbing listings read; retained Mastery; held Rittenhouse. |
| https://web.ubcc.org/Fitness-Center | Upper Bucks fitness listings read; retained Quakertown YMCA. |
| https://business.chescochamber.org/member-directory/Find | Chester County Chamber page read; extraction did not expose member data. |
| https://www.chesco.org/businessdirectoryii.aspx | Official Chester County resource directory read; no new record retained. |
| https://web.delcochamber.org/2018/search | Delaware County Chamber directory taxonomy read. |
| https://web.delcochamber.org/2018/Child-Day-Care-Services | Current Delaware County Chamber child-care listings read; The Learning Experience Glen Mills was screened out as an existing-package duplicate. |
| https://web.delcochamber.org/2018/Attorneys | Current Delaware County Chamber attorney listings read; retained Pagano; held DiOrio & Sereni. |
| https://web.delcochamber.org/2018/Financial-Planning | Current Delaware County Chamber financial-planning listings read; retained Brandywine Financial Advisors. |
| https://buckscountyalive.com/business/ | Bucks business directory landing page read; no complete new address-level retention. |
| https://www.middletownbucks.org/Businesses/Business-Directory | Official Middletown Township directory read; no newly retained record. |
| https://weaversway.coop/pages/weavers-way-ambler | Official destination attempted; extraction lacked readable content; general official store page was also read. |
| https://weaversway.coop/ | Official customer site read; confirmed Ambler store address for retained Weaver’s Way. |
| https://community-cupboard.org/ | Official organization site read; confirmed retained Mattie Dixon address. |
| https://act2.org/cms2/ | Official theatre site read; confirmed retained Act II address. |
| http://www.amblerchurch.net/ | Official church domain read; empty body; held Ambler Korean Presbyterian. |
| https://magical-trims-cuts-for-kids-salon.business.site/ | Official destination attempted; extraction did not yield usable customer content; held Magical Trims. |
| http://www.privesalonps.net/ | Official salon site read; retained Prive as a review lead. |
| https://amblerperio.com/ | Official site read; showed a different Lower Gwynedd location; held Butler Pike Periodontal. |
| https://www.kanna.fit/ | Official site read; confirmed retained Kanna address. |
| http://www.anotheramazingdeck.com/ | Official site read; confirmed retained Amazing Decks address. |
| http://www.cdpchildren.org/ | Official site read; confirmed retained Children’s Developmental Program address. |
| http://www.lifepanchildcare.org/ | Official domain attempted; could not resolve publicly; held LifeSpan Day Care. |
| https://www.hunterfamilyacupuncture.com/ | Official site read; confirmed retained Hunter Family Acupuncture address. |
| https://www.kennettsquarefamilydentistry.com/service/dental-cleanings-and-exams | Official site read; confirmed retained Kennett Square Family Dentistry address. |
| https://www.yogasecretspa.com/ | Official site read; confirmed retained Yoga Secrets address. |
| https://www.ksqmassage.com/ | Official site read; confirmed retained Kennett Square Massage address. |
| https://curriedayspa.com/kennett-square/ | Official site read; confirmed retained Currie address. |
| https://www.countrybutcherksq.com/ | Official customer site read; source directory supports the retained street address. |
| https://www.fpcambler.org/ | Official church site read; confirmed retained First Presbyterian address. |
| https://www.dioriosereni.com/ | Official domain read; points to differently named firms; held DiOrio & Sereni. |
| https://www.cbiz.com/ | Official site read for finance-category reconnaissance; did not corroborate a local address; no retention. |
| http://www.rittenhouseandsonsinc.com/ | Official domain read; parked page; held Rittenhouse & Sons. |
| http://www.masteryplumbing.com/ | Official site read; confirmed retained Mastery Plumbing street address and suite. |
| http://www.ymcarivercrossing.org/ | Official YMCA site read for program and location navigation. |
| https://www.ymcarivercrossing.org/locations/quakertown-ymca | Official local YMCA location page read; confirmed retained address. |
| https://www.primroseschools.com/schools/concordville.com | Official destination attempted; no extractable content; no retention. |
| https://thelearningexperience.com/centers/glen-mills-pa/ | Official center page read; confirmed retained location. |
| https://www.paganolawyers.com/ | Official firm site read; confirmed retained address. |
| https://www.brandywinefinancialadvisors.com/ | Official firm site read; confirmed retained address. |
| https://www.camaplan.com/ | Official finance site read for source-category reconnaissance; no local-address corroboration retained. |
| https://www.amblercoal.com/ | Official site read; confirmed retained Ambler Coal address. |
| http://www.amblerflowershop.com/ | Official shop site read; confirmed retained Ambler Flower Shop address. |
| https://www.doylestownbid.com/business-directory | Attempted as a Bucks BID source; hostname could not be resolved by extraction; no retention. |

## Research-only boundary

This is a **research-only, review-only** package. It was not published, deployed, geocoded, map-pinned, written to a database or API, or used to alter authentication, user accounts, passwords, waitlists, payments, or any live system. No coordinates are present. Inclusion is not an endorsement or determination of ownership, protected traits, culture, language, credentials, licensure, quality, safety, price, hours, availability, or accessibility.
