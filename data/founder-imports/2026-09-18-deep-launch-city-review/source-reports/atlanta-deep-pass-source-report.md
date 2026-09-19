# Atlanta Metro Deep Pass: Research-Only Source Report

## Scope and method

This is **one research-only directory pass** for Atlanta and clearly supported metro communities. It emphasizes everyday needs across health, beauty, dining, retail, household services, financial and legal leads, childcare/family support, and community/cultural resources. Each retained physical commercial record has a numbered street address supported by a public source and a customer-facing official website or official business-social destination. Regulated health, legal, financial, childcare, and cosmetology-related entries are designated **`regulated_review`**; this label does **not** certify a license, registration, eligibility, availability, or quality.

### Source-family coverage

| Source family | Public sources inspected | What it contributed |
| --- | --- | --- |
| Black business chamber and directory | Atlanta Black Chambers and its I Am Black Business directory | Public directory leads across wellness, grooming, food, retail, cleaning/restoration, and financial services. The chamber says it advocates for Black-owned entities; where the directory itself labels an entry “Black Owned,” that label is preserved with attribution only. |
| Haitian/diaspora chamber directory | Georgia Haitian American Chamber of Commerce (GAHCCI) and detailed category/listing pages | Public leads for health, beauty, restaurants, community resources, and trades, with official destinations inspected before retention. |
| Latino/Hispanic and legal/community organizations | Latin American Association; Georgia Hispanic Chamber; Georgia Hispanic Bar Association; Gate City Bar; GABWA | Immigration/community/legal association source coverage and a regulated legal-community lead. |
| Caribbean/African-diaspora cultural and community organizations | Caribbean Association of Georgia; ADAMA; City of Atlanta bi-national chambers; Ghana International Chamber; GAHCCI | Cultural/community resource and cultural-place coverage; the parked Jamaican Chamber domain was rejected. |
| Municipal, childcare, and professional/community support | City of Atlanta, Georgia DECAL, YMCA of Metro Atlanta | Metro context and family/early-learning resource coverage. |

The first three families satisfy the required multi-family approach; the latter two broaden community and family-source coverage. Search snippets were used only to find URLs, never as evidence.

## Results

### Retained candidates by target kind

| Target kind | Count |
| --- | ---: |
| business | 3 |
| community_resource | 5 |
| cultural_place | 1 |
| regulated_review | 7 |

### Retained candidates by category

| Category | Count |
| --- | ---: |
| Arts and recreation | 1 |
| Childcare and family support | 1 |
| Community and culture | 1 |
| Community and household resource | 1 |
| Dining | 1 |
| Financial services | 1 |
| Health | 1 |
| Health and wellness | 1 |
| Health community resource | 1 |
| Legal and family support | 1 |
| Legal community resource | 2 |
| Retail | 1 |
| Salons and barbers | 1 |
| Salons and beauty | 1 |
| Trades and household services | 1 |

### Held candidates by target kind

| Target kind | Count |
| --- | ---: |
| manual_review | 9 |

### Held candidates by category

| Category | Count |
| --- | ---: |
| Dining | 4 |
| Health | 1 |
| Online retail | 1 |
| Salons and beauty | 1 |
| Trades and household services | 2 |

**Retained total: 16. Held total: 9.**

## Retention and hold rationale

| Record(s) | Decision | Rationale |
| --- | --- | --- |
| The Wellness Spot; The Man Cave Atlanta; 404 Coffee; The Black Art Depot; SERVPRO of Panthersville | Retained | Relevant chamber-directory record plus inspected official customer-facing site or official business page; numbered street address was confirmed or not contradicted. Regulated personal-care services are labeled `regulated_review`. |
| MOZAÏK Lifestyle Medicine; Blushed by Naomie | Retained as `regulated_review` | GAHCCI detail supplied an address and official destination; official sites were inspected. No license/credential claim is certified. |
| Latin American Association | Retained as `regulated_review` | The official immigration-services page describes its legal-service scope and official Atlanta outreach-center address. Attorney/DOJ authority status was not independently verified. |
| Essential Wealth Management | Retained as `regulated_review` | Chamber directory and official contact page support the Atlanta address; official site has investment-advisory disclosures. Registration and suitability are not certified. |
| Global Paint for Charity; Haitian Nurses Association of Georgia; Caribbean Association of Georgia; Gate City Bar Association; GABWA | Retained as `community_resource` | Official sites were inspected. Gate City and GABWA supply public mailing addresses rather than a street destination; neither is presented as a commercial storefront or attorney referral. |
| African Diaspora Art Museum of Atlanta | Retained as `cultural_place` | Official museum/cultural-hub site states the Atlanta address and public-facing mission. |
| YMCA of Metro Atlanta Early Learning | Retained as `regulated_review` | Official page describes early-learning programs and links specific centers. Retained address is explicitly documented as organizational headquarters, not as a claim that every program operates there. |
| Bomb Biscuit Company; C’est La Vie Cafe | Held | A directory street address conflicted with the inspected official location/footer information. |
| Grand Slam Pizza; 1804 Caribbean Cuisine; Personal Concierge MD; MDW Salon; ComfiArt | Held | The official destination was unavailable, inactive, unresolved, or inaccessible; the current customer-facing destination could not be reliably established. |
| Aspire Construction & Design; Zen Building Services | Held | Required official destination and/or reliable numbered street address was missing or unreliable. |

## Deduplication

Before writing, the script read every `*.jsonl` under `/home/ubuntu/directory-research-wave-2026-09-18` **except** this pass’s output folder. It normalized and compared **name + city + state + country + address**, also checking a country-agnostic legacy equivalent because several existing packages have no `country` key. **0 candidate(s) were excluded as prior-package duplicates.** No held record was promoted in place of a duplicate. JSONL field shape and parseability were validated after writing.

## Complete inspected-URL ledger

| Inspected URL | Source/page | Retention or hold use |
| --- | --- | --- |
| https://atlantablackchambers.org/ | Atlanta Black Chambers organizational page | Source-family validation: mission explicitly advocates for Black-owned entities; no candidate retained from this page alone. |
| https://abc.iamblackbusiness.com/ | Atlanta Black Chambers / I Am Black Business directory root | Source-family validation: collaboration and directory scope reviewed. |
| https://abc.iamblackbusiness.com/business/personal-concierge-md-llc/15257 | ABC individual listing | Held Personal Concierge MD: page extraction lacked listing content; linked official social unavailable. |
| https://abc.iamblackbusiness.com/business/the-wellness-spot/29339 | ABC individual listing | Retained The Wellness Spot after official-site address confirmation. |
| https://abc.iamblackbusiness.com/business/aspire-construction-design/11183 | ABC individual listing | Held Aspire Construction & Design: required fields and destination unavailable. |
| https://abc.iamblackbusiness.com/?filter=category%7CPersonal%20Care | ABC personal-care listings | Retained The Man Cave Atlanta; held MDW Salon due inaccessible official site. |
| https://abc.iamblackbusiness.com/?filter=category%7CRetail | ABC retail listings | Retained The Black Art Depot; held ComfiArt because official storefront was inactive. |
| https://abc.iamblackbusiness.com/?filter=category%7CRestaurants | ABC restaurant listings | Retained 404 Coffee; held Bomb Biscuit and C’est La Vie because of conflicting location facts. |
| https://abc.iamblackbusiness.com/?filter=category%7CGeneral%20Services | ABC general-services listings | Retained SERVPRO of Panthersville and Essential Wealth Management after official-site checks. |
| https://abc.iamblackbusiness.com/?filter=category%7CGeneral%20Services%2Bsubcategory%7CChildcare | ABC childcare filter | No qualifying listing exposed by this filter. |
| https://www.thewellnessspotatl.com/ | The Wellness Spot official site | Retained: official site confirms College Park address and customer services. |
| https://www.facebook.com/themancaveatlanta | The Man Cave Atlanta official Facebook page | Retained: official business page confirms Atlanta address and grooming description. |
| https://404coffeeatl.com/contact-us | 404 Coffee official contact page | Retained: official contact page confirms Atlanta street address. |
| https://www.blackartdepot.com/ | The Black Art Depot official storefront | Retained: official store identifies Decatur showroom; directory provides numbered street address. |
| https://www.blackartdepot.com/pages/about-us | The Black Art Depot official about page | Retained: supports official minority-owned-and-operated wording. |
| https://www.servpropanthersville.com/ | SERVPRO of Panthersville official site | Retained: customer-facing franchise site substantiates service identity; no address conflict with directory. |
| https://essentialwealthmanagement.com/ | Essential Wealth Management official site | Retained as regulated_review: official investment-advisory disclosure reviewed. |
| https://essentialwealthmanagement.com/contact/ | Essential Wealth Management official contact page | Retained: confirms retained Atlanta street/building address. |
| https://www.mdwsalon.com/ | MDW Salon stated official site | Held: hostname did not resolve during inspection. |
| https://comfiart.com/ | ComfiArt stated official site | Held: displayed Shopify store-owner/reactivation notice. |
| https://bombbiscuitatl.com/ | Bomb Biscuit official site | Held: official new Grant Park address conflicts with ABC directory address. |
| https://thecestlaviecafe.com/ | C’est La Vie Cafe official site | Held: mobile/event framing and mismatched Plano footer conflicted with directory locality. |
| https://www.facebook.com/personalconciergemd/ | Personal Concierge MD stated official Facebook | Held: unavailable at inspection. |
| https://www.atlantaga.gov/government/mayor-s-office/executive-offices/office-of-international-immigrant-affairs/bi-national-chambers-of-commerce | City of Atlanta bi-national chambers page | Municipal source-family validation: reviewed chamber ecosystem and Atlanta metro context. |
| https://www.ghcc.org/directory | Georgia Hispanic Chamber directory | Source-family checked; page did not expose usable member records in extraction. |
| https://gahcci.org/ | Georgia Haitian American Chamber of Commerce | Source-family validation: official chamber site and business-directory access reviewed. |
| https://gahcci.org/business-directory/ | GAHCCI business directory | Source-family validation: categories spanning beauty, healthcare, legal, trades, food, community, and education reviewed. |
| https://gahcci.org/listing-category/beauty-and-personal-care/ | GAHCCI beauty directory | Retained Blushed by Naomie after official-site check. |
| https://gahcci.org/listing/blushed-by-naomie-llc/ | GAHCCI Blushed by Naomie detail | Retained: chamber page supplies numbered Atlanta address and official URL. |
| https://www.blushedbynaomie.com/ | Blushed by Naomie official site | Retained as regulated_review: services and self-described licensure reviewed; no certification made. |
| https://gahcci.org/listing-category/restaurants/ | GAHCCI restaurant directory | Held Grand Slam Pizza and 1804 Caribbean Cuisine when customer-facing destination/address support was insufficient. |
| https://gahcci.org/listing/grand-slam-pizza/ | GAHCCI Grand Slam Pizza detail | Held: linked official Instagram unavailable and locality support incomplete. |
| https://www.instagram.com/grand_slam_pizza_kennesaw/ | Grand Slam Pizza stated official Instagram | Held: profile unavailable. |
| https://gahcci.org/listing/1804-caribbean-cuisine/ | GAHCCI 1804 Caribbean Cuisine detail | Held: directory supplies address but official social page was inaccessible. |
| https://www.instagram.com/1804caribbeancuisine/ | 1804 Caribbean Cuisine stated official Instagram | Held: login-only/inaccessible during inspection. |
| https://gahcci.org/listing-category/health-care-services/ | GAHCCI health directory | Retained MOZAÏK after official-site confirmation. |
| https://gahcci.org/listing/mozaik-lifestyle-medicine-direct-primary-care/ | GAHCCI MOZAÏK detail | Retained: official URL and Smyrna numbered address supplied. |
| https://yourmozaik.care/ | MOZAÏK official web entry | Retained: redirected/connected to official customer site; address and practice identity checked. |
| https://www.yourmozaik.com/ | MOZAÏK official site | Retained as regulated_review; no professional-authority verification. |
| https://gahcci.org/listing-category/legal-services/ | GAHCCI legal category | Checked but returned access-forbidden; no candidate retained from it. |
| https://gahcci.org/listing-category/construction-equipment-contractors/ | GAHCCI construction category | Held Zen Building Services because of unreliable address and missing customer destination. |
| https://gahcci.org/listing-category/janitorial-services/ | GAHCCI janitorial category | Checked; entry lacked street address/customer destination and was not retained. |
| https://gahcci.org/listing-category/community-organizations-nonprofits/ | GAHCCI community directory | Retained Global Paint for Charity after official contact check. |
| https://gahcci.org/listing/haitian-nurses-association-of-georgia/ | GAHCCI HANA detail | Retained after official organization-site confirmation. |
| https://hanaofgeorgia.com/ | Haitian Nurses Association of Georgia official site | Retained: mission and Snellville street address confirmed. |
| https://gahcci.org/listing-category/education-2/ | GAHCCI education directory | Checked; no candidate met street-address and customer-destination support standard. |
| https://gahcci.org/listing-category/health-care-services/ | GAHCCI health category | Source-family category reviewed; MOZAÏK retained with regulated-review designation. |
| https://globalpaints.org/ | Global Paint for Charity official site | Retained: community/household resource identity reviewed. |
| https://www.globalpaints.org/contact/ | Global Paint for Charity official contact page | Retained: Peachtree Corners numbered address confirmed. |
| https://thelaa.org/ | Latin American Association official homepage | Retained as regulated_review after official program/location review. |
| https://thelaa.org/what-we-do/immigration/ | LAA immigration services page | Retained as regulated_review: page identifies legal immigration services and staff types; no authority certification. |
| https://www.caribbeangeorgia.org/ | Caribbean Association of Georgia official site | Retained: official mission and Stockbridge street address confirmed. |
| https://www.adamatl.org/ | African Diaspora Art Museum of Atlanta official site | Retained: official cultural-place description and Atlanta street address confirmed. |
| https://gatecitybar.org/ | Gate City Bar Association official site | Retained as community resource: association mission and official mailing address reviewed. |
| https://www.gabwa.org/ | Georgia Association of Black Women Attorneys official site | Retained as community resource: association mission and official mailing address reviewed. |
| https://www.georgiahispanicbar.org/ | Georgia Hispanic Bar Association official site | Source-family checked; no candidate retained because no public street address or customer service listing was established. |
| https://www.ymcaatlanta.org/learning/early-learning | YMCA of Metro Atlanta official early-learning page | Retained as regulated_review: page outlines program types, a location finder, and organization contact; no facility certification. |
| https://www.decal.ga.gov/ | Georgia Department of Early Care and Learning official site | Official professional/municipal-family resource checked; it informs childcare search methodology but no separate Atlanta candidate was created. |
| https://www.jamaicanchamberatlanta.com/ | Jamaican Chamber Atlanta stated site | Held from use as a source family: domain was parked, so it was not used to support a candidate. |
| https://ghicc.org/ | Ghana International Chamber of Commerce official site | Diaspora chamber source-family checked; no local customer-service candidate derived. |
| https://gahcci.org/business-directory/ | GAHCCI directory (revisited) | Used as the public directory source for retained GAHCCI-origin candidates and reported once for audit trail. |

## Research-only boundary

This pass performed **research and local file creation only**. It did not submit records to any production database or API, publish a directory, create map pins or coordinates, provide directions, deploy anything, modify authentication/account/payment settings, or change availability, hours, licensing, ownership, quality, safety, affordability, accessibility, or language claims. Names for community, cultural, demographic, or ownership designations appear only where an inspected public source expressly supplied that wording and are attributed in the record fields or notes.
