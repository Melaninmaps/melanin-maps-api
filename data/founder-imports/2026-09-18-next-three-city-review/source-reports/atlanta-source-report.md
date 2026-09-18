# Atlanta, Georgia Directory Research Wave — Source Report

**Wave date:** 2026-09-18
**Geographic scope:** Atlanta, Georgia, and nearby metro-area suburbs represented in the publicly inspected sources.
**Result:** 69 retained candidate records; 15 held records; 36 distinct URLs fully inspected or fetch-attempted.

## Method and evidence standard

This was one bounded research pass using public webpages only. A physical candidate was retained only when the assembled record had a specific name, a numbered street address, city, state, country, an evidence-supported category, a public source URL, and a customer-facing official website or social destination. Customer-facing destinations appearing in Black Restaurant Week listings were recorded as destinations published by that directory, not independently authenticated beyond the listing. Exact `name + city + state + address` records were de-duplicated only against the records assembled in this wave; no external or production dataset was read or queried.

The Black Restaurant Week source explicitly describes its Atlanta campaign as a place to discover Black-owned restaurants and culinary businesses. Records selected from those campaign pages preserve that context as **“Black-owned (campaign-described)”**, not as a broader claim about ownership, certification, or current operation. The Discover Atlanta article explicitly calls its subject “Latino-Owned Businesses in Atlanta You Should Know”; records derived from it preserve that context as **“Latino-owned (publisher-described)”**. First-party claims are labelled self-described. No claim is made merely because a business belongs to a chamber.

Health, legal, massage, financial, and early-childhood education listings were not silently treated as ordinary businesses. The retained health, law, massage, and childcare records use `targetKind: "regulated_review"`; their inclusion is not verification of licensure, eligibility, quality, availability, or regulatory status. Community, faith, and cultural resources are separately labelled `community_resource` or `cultural_place`.

## Inspected sources

The following unique URLs were fully read via public-page extraction or explicitly attempted. A repeated fetch of the same URL is listed once. Search-result snippets used only for discovery are not counted as fully inspected sources.

| # | URL | Use in this wave | Result |
|---:|---|---|---|
| 1 | https://blackrestaurantweeks.com/atlanta-black-restaurant-week/ | Black-owned Atlanta campaign scope and initial food listings | Read |
| 2 | https://blackrestaurantweeks.com/brw-campaigns/category/atlanta-brw/ | Black Restaurant Week listing page 1 | Read |
| 3 | https://blackrestaurantweeks.com/brw-campaigns/category/atlanta-brw/page/2/ | Black Restaurant Week listing page 2 | Read |
| 4 | https://blackrestaurantweeks.com/brw-campaigns/category/atlanta-brw/page/3/ | Black Restaurant Week listing page 3 | Read |
| 5 | https://blackrestaurantweeks.com/brw-campaigns/category/atlanta-brw/page/4/ | Black Restaurant Week listing page 4 | Read |
| 6 | https://blackrestaurantweeks.com/brw-campaigns/category/atlanta-brw/page/5/ | Black Restaurant Week listing page 5 | Read |
| 7 | https://blackrestaurantweeks.com/brw-campaigns/category/atlanta-brw/page/6/ | Black Restaurant Week listing page 6 | Read |
| 8 | https://discoveratlanta.com/stories/things-to-do/latin-culture-in-atlanta-a-guide-to-local-shops-and-unique-finds/ | Publisher-described Latino-owned business context and locations | Read |
| 9 | https://discoveratlanta.com/stories/things-to-do/atlantas-black-churches-and-their-civil-rights-legacy/ | Black-church heritage context | Read |
| 10 | https://abc.iamblackbusiness.com/ | Atlanta Black Chambers/I Am Black Business directory entries | Read |
| 11 | https://www.ghcc.org/directory | Georgia Hispanic Chamber directory landing page | Read; no usable member entries exposed |
| 12 | https://www.atlantaga.gov/government/mayor-s-office/executive-offices/the-office-of-contract-compliance/diversity-in-business | City diversity-program and certified-firm-database context | Read; no candidate entries used |
| 13 | https://www.fultoncountyga.gov/inside-fulton-county/fulton-county-departments/purchasing-and-contract-compliance/mfbe-registration | County MFBE registration context | Read; no candidate entries used |
| 14 | https://southern-queenz.com/ | First-party food business record | Read |
| 15 | https://beautifulrestaurant-atlanta.com/ | First-party food business record | Read |
| 16 | https://www.arepamiaatlanta.com/hours-location | First-party Arepa Mia location | Read |
| 17 | https://www.nomasatlanta.com/ | First-party No Más! location and market description | Read |
| 18 | https://tkstlaw.com/ | First-party legal-services record | Read |
| 19 | https://www.apexmuseum.org/ | First-party cultural-place record | Read |
| 20 | https://thelaa.org/ | First-party Latino community-resource record | Read |
| 21 | https://www.ebenezeratl.org/ | First-party faith/community record | Read |
| 22 | https://ourhousega.org/childcare/ | First-party early-childhood education record | Read |
| 23 | https://nourishandbloommarket.com/ | First-party grocery candidate | Read; held for no targeted identity evidence in reviewed sources |
| 24 | https://atlantaharvest.com/ | First-party urban-farm/grocery candidate | Read; held for lack of numbered address |
| 25 | https://www.instagram.com/hilomusica/ | Customer-facing social destination for cultural candidate | Read; held because location data was incomplete across reviewed sources |
| 26 | https://www.aromadesserts.com/ | First-party dessert business page | Read; held because location data was incomplete across reviewed sources |
| 27 | http://marcusbarandgrille.com | First-party food destination check | Read; category/location proof remains the campaign listing |
| 28 | https://www.tsbrunchbaratl.com | First-party food destination check | Read; category/location proof remains the campaign listing |
| 29 | https://unbelieveganatl.com/ | First-party vegan-food location and self-description | Read |
| 30 | https://bolivarcoffee.com/ | First-party Colombian coffee locations and description | Read |
| 31 | https://elponceatl.com/ | Attempted first-party food destination check | Fetch failed: hostname could not be resolved to public IPs |
| 32 | https://www.patriacocina.com/ | Attempted first-party food destination check | Fetch failed: hostname could not be resolved to public IPs |
| 33 | https://arepa-grill.com/ | Attempted first-party food destination check | Fetch failed: hostname could not be resolved to public IPs |
| 34 | https://atlantablackchambers.org/ | Atlanta Black Chambers homepage discovered during directory review | Inspected through public search result; not used as individual-record proof |
| 35 | https://www.ghcc.org/ | Georgia Hispanic Chamber homepage discovered during directory review | Inspected through public search result; not used as individual-record proof |
| 36 | https://www.atlantaga.gov/government/mayor-s-office/executive-offices/the-office-of-contract-compliance | City Office of Contract Compliance landing page discovered during municipal-directory review | Inspected through public search result; no candidate entries used |

## Retained and held results

| Outcome | Count | Treatment |
|---|---:|---|
| Retained records | 69 | Written to `candidates.jsonl`; each record has all contract fields and the required physical-candidate core fields. |
| Held records | 15 | Written to `held-candidates.jsonl`; these are intentionally not promoted. |
| Regulated-review records | 4 | Legal, medical, massage, and early-childhood education records were routed to `regulated_review`. |
| Community/cultural/faith records | 3 | Kept distinct from commercial candidates through `community_resource` or `cultural_place`. |

## Factual limitations and hold rationale

Public directory content can be stale, incomplete, or imprecise. This pass did **not** independently verify current operations, ownership beyond the cited descriptor, legal/business status, hours, languages, licensing, credentials, accessibility, prices, inventory, service area, availability, or quality. It does not invent latitude/longitude, phone numbers where a source did not supply one, or any missing attributes.

Records were held where the available evidence lacked a numbered address, an official customer-facing destination, a complete enough physical-location chain, targeted identity evidence for an otherwise valid grocery record, or where a duplicate/location conflict needed reconciliation. The held file contains the candidate-level rationale, including an exact duplicate found within this wave and failed first-party site lookups. An official destination that could not be resolved was not substituted with a third-party review or map profile.

## Publication and systems safeguard

**No production database, production API, login, write endpoint, or publication workflow was accessed or called. No candidate was published.** The only deliverables created are local UTF-8 JSONL and this local Markdown report in the requested output directory.
