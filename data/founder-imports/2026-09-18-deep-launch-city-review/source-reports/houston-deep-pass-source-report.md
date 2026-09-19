# Houston Metro Deep Pass — Research Source Report

## Scope and research boundary

This was **one research-only Houston metro directory pass**, completed on **2026-09-18**. It prioritized everyday-life coverage rather than restaurant volume: grocery and retail, barber education, worship, public business support, pharmacy, HVAC, recreation, public health, and family/child-care resource leads. All retained places are in Houston, Texas; no unsupported nearby community was included. This work is an evidence package only: it made **no publication, database/API, map-pin, geocoding, deployment, account, payment, authentication, licensing, or operational-status change**. In particular, inclusion does not certify ownership, identity, eligibility, hours, availability, price, safety, quality, accessibility, language fluency, licensing, or current operations.

## Results and counts

**Retained: 9** records. **Held: 6** records.

| Outcome | Target kind | Count | Categories represented |
|---|---:|---:|---|
| Retained | business | 1 | Grocery & retail (1) |
| Retained | regulated_review | 4 | Personal care & education (1); Health (1); Home & trades (1); Health & family support (1) |
| Retained | community_resource | 3 | Business & workforce support (2); Recreation & community (1) |
| Retained | cultural_place | 1 | Worship & community (1) |
| Held | manual_review | 6 | Legal (1); Dining (1); Automotive (1); Personal care (1); Childcare & family (2) |
| **Total** | — | **15** | — |

## Source-family coverage

| Source family | Public sources opened | What it contributed | Treatment |
|---|---|---|---|
| **Greater Houston Black Chamber / Houston Buy Black** | GHBC main site, GHBC GlueUp membership directory, Houston Buy Black home and directory | Established a local Black business/community directory family and its wide category coverage. | Individual Buy Black page-one names were not retained because an inspected current official destination plus supported numbered address was not established during this pass. The GHBC/Buy Black context was never used to infer ownership for any retained business. |
| **Houston Hispanic Chamber of Commerce** | HHCC main site, member-directory home, several direct directory/contact routes | Established a regional Hispanic business/civic chamber directory family. | Studio A salon was held: its inspected direct contact page had no public numbered address or official destination. No demographic, ownership, or language claim was inferred. |
| **African Houston Business Directory** | About page, category pages and individual profiles across grocery, barber, worship, restaurant, HVAC, legal, pharmacy, and auto repair | Principal discovery family for everyday commercial/service leads. | Only records with an inspected official website or clearly official business-social URL and non-conflicting numbered address were retained. The source’s community wording was not converted into an ownership or protected-trait claim. |
| **Municipal / regional business support** | City of Houston OBO; U.S. MBDA Houston center; HCC operator page | Public business-resource entries. | OBO and Houston MBDA Center retained as community resources on their official public pages. |
| **Municipal health and recreation** | Houston Parks community-center pages; Houston Health Department health-center and Sunnyside pages | Local public recreation and health/family resource entries. | Alief Community Center retained as community_resource. Sunnyside retained as regulated_review because it provides clinical health services. |
| **State / regional childcare-support sources** | Workforce Solutions Gulf Coast child-care page; Texas Child Care Connection | Family/child-care support screening. | Both leads were held because the inspected sources did not establish a Houston-specific numbered public location (Workforce Solutions) or Houston locality (TX3C). |

## Retention and holds

All commercial records had a name, category, source URL, a customer-facing official website or official business-social destination, and a non-conflicting numbered street address. Regulated or potentially regulated fields were routed to **`regulated_review`** and no license was certified. Community and cultural places remain distinct target kinds.

| Record | Outcome | Rationale |
|---|---|---|
| Texas African Grocery Store | Retained — business | African Houston Directory gives 10814 S Gessner Rd; inspected official Instagram profile matches the business name and offers a customer-facing presence. |
| Trend Barber College — Southwest Campus | Retained — regulated_review | Directory and official college website support the 8250 W Bellfort location. Regulated-review routing reflects barber education/credentialing, not a certification. |
| Our Savior's Church | Retained — cultural_place | Directory and official church website support 7070 W Orem Dr. |
| City of Houston Office of Business Opportunity | Retained — community_resource | Official municipal page supplies its business-support role and 611 Walker St address. |
| Houston MBDA Business Center | Retained — community_resource | Official MBDA page identifies HCC operation and lists 3100 Main St Ste 701. |
| Choice Pharmacy | Retained — regulated_review | Directory and official pharmacy website agree on 9935 Bissonnet St Ste B. Pharmacy licensing was not verified. |
| McHenry Mechanical & Energy, Inc. | Retained — regulated_review | Directory and inspected official Facebook page agree on 8950 Westpark Dr; HVAC is routed to regulated review, without licensing claim. |
| Alief Community Center | Retained — community_resource | Official Houston Parks page lists 11903 Bellaire Blvd. |
| Sunnyside Health and Multi-Service Center | Retained — regulated_review | Official Health Department page lists 4410 Reed Rd and clinical/community services. No service availability or credential certification is made. |
| Gabe Giwa & Associates | Held — manual_review | Directory says Suite 325; official firm website says Suite 540. Address conflict prevents retention. |
| Cafe Abuja | Held — manual_review | Directory shows Cafe Abuja at 15015 Westheimer Pkwy; its inspected domain currently presents Taste of Nigeria at 5959 Richmond Ave. Identity/address conflict prevents retention. |
| Pro-Tech Auto Repair | Held — manual_review | Numbered street is present in directory but no exact official website or official business-social destination was verified. |
| Studio A salon | Held — manual_review | Inspected HHCC contact page has the name only; no numbered address or official business destination. |
| Workforce Solutions Gulf Coast Child Care Financial Assistance | Held — manual_review | Official program source gives phone/service data but no numbered Houston-area location and does not state online-only status. |
| Texas Child Care Connection | Held — manual_review | Official State resource is statewide; Houston locality was not established. |

## Deduplication

Before writing, all **76 pre-existing JSONL research files** beneath `/home/ubuntu/directory-research-wave-2026-09-18/` were programmatically enumerated, excluding this output folder. Existing records were compared on normalized **name + city + state + country + address**. The nine retained records did not match an existing prior-package record. The six held names likewise did not duplicate a prior Houston-package record; no uncertain same-name candidates were consolidated. The existing Houston package was separately reviewed because it contained prior Houston records and holds, primarily in different categories.

## URL audit — every inspected page

The following table records every page opened/inspected in this pass. Search-result snippets were used only for discovery and are not evidence; they are not included as inspected sources.

| Inspected URL | Role/result and retention or hold impact |
|---|---|
| https://ghbcc.com/ | GHBC official home; established local chamber source family and member-directory link. No individual candidate retained from this page. |
| https://app.glueup.com/organization/8755/widget/membership-directory/corporate | GHBC public membership directory; inspected names/categories but no individual detail/address/official-destination package was completed. |
| https://houstonbuyblack.com/ | GHBC Buy Black source-family home; inspected local-directory purpose/context only. |
| https://houstonbuyblack.com/buyblack/ | Public Buy Black directory; individual page-one entries were not retained without independent official destination/address confirmation. |
| https://www.houstonhispanicchamber.com/ | HHCC official home; established regional chamber source family and public directory link. |
| https://business.houstonhispanicchamber.com/hhccmemberdirectory | HHCC directory home; notes optional inclusion; no individual facts retained from it alone. |
| https://business.houstonhispanicchamber.com/hhccmemberdirectory/FindStartsWith?term=U | HHCC directory access check; did not yield usable individual evidence in extracted content. |
| https://business.houstonhispanicchamber.com/hhccmemberdirectory/FindStartsWith?term=J | HHCC directory access check; did not yield usable individual evidence in extracted content. |
| https://business.houstonhispanicchamber.com/hhccmemberdirectory/Contact/rn9lbR5L?listingTypeId=bLqWMWpD | Direct HHCC Studio A salon contact page; held because it lacked public address/official destination. |
| https://business.houstonhispanicchamber.com/hhccmemberdirectory/Contact/rXZdedEP?listingTypeId=bLqWMWpD | Direct HHCC Brown Law Group contact page; no candidate retained because extracted content lacked usable business facts. |
| https://www.africanhbd.com/about | African Houston Directory source-family scope/mission page. |
| https://www.africanhbd.com/categories | Category index used to plan diverse everyday-service review. |
| https://www.africanhbd.com/groceries | Grocery category discovery page. |
| https://www.africanhbd.com/texas/houston/top-level-category/texas-african-grocery-store | Retained Texas African Grocery Store source profile/address. |
| https://www.instagram.com/texas_african_grocery_store/ | Retained official business-social customer destination for Texas African Grocery Store. |
| https://www.africanhbd.com/barbers | Barber category discovery page. |
| https://www.africanhbd.com/texas/houston/top-level-category/trend-barber-college-south-west-campus | Retained Trend Southwest source profile/address. |
| https://trendbarbercollege.org/ | Retained Trend official website; independently supports the Southwest location. |
| https://www.africanhbd.com/churches | Worship category discovery page. |
| https://www.africanhbd.com/texas/houston/top-level-category/our-savior-s-church | Retained Our Savior's source profile/address. |
| https://oursaviorschurch-houston.org/ | Retained official church site; independently supports address and social links. |
| https://www.africanhbd.com/restaurants | Restaurant category discovery page; not used to increase restaurant volume. |
| https://www.africanhbd.com/texas/houston/top-level-category/cafe-abuja | Cafe Abuja source profile; contributed to hold after conflict. |
| https://cafeabuja.com/ | Cafe Abuja domain now presents Taste of Nigeria at a conflicting address; hold. |
| https://www.africanhbd.com/air-conditioning | HVAC category discovery page. |
| https://www.africanhbd.com/pro/20221016184055 | Retained McHenry source profile/address. |
| https://www.facebook.com/McHenryMechanicalAC/ | Retained official McHenry business-social page; supports address/phone/service description. |
| https://www.africanhbd.com/attorneys | Legal category discovery page. |
| https://www.africanhbd.com/braids | Braid category discovery page; it returned no results, so it supplied no candidate. |
| https://www.africanhbd.com/texas/houston/top-level-category/gabe-giwa-associates-attorneys-and-counselors-at-law | Gabe Giwa source profile with Suite 325; caused hold after official-site conflict. |
| https://giwalaw.com/ | Gabe Giwa official site lists Suite 540; address conflict caused hold. |
| https://www.africanhbd.com/pharmacies | Pharmacy category discovery page. |
| https://www.africanhbd.com/texas/houston/top-level-category/choice-pharmacy | Retained Choice Pharmacy source profile/address. |
| https://www.choicepharmacyinc.com/ | Retained Choice Pharmacy official site; agrees with address/phone. |
| https://www.africanhbd.com/auto-repair | Auto-repair category discovery page. |
| https://www.africanhbd.com/top-level-category/pro-tech-auto-repair | Pro-Tech source profile; held because official destination was not verified. |
| https://www.houstontx.gov/obo/sbe/ | Municipal OBO subpage attempted; extraction returned no content, so it was not used as evidence. |
| https://www.houstontx.gov/obo/ | Retained City OBO official source, role, address, and contact. |
| https://www.mbda.gov/tl/business-center/houston-mbda-business-center | Retained official MBDA Houston center source, operator, address, and contact. |
| https://www.hccs.edu/hcc-in-the-community/entrepreneurial-initiatives/mbda/ | Inspected official operator context linked by MBDA; supports business-resource context. |
| https://www.houstontx.gov/parks/communitycenters/index.html | Municipal community-center system context. |
| https://www.houstontx.gov/parks/communitycenters/southwest.html | Retained Alief Community Center address and departmental context. |
| https://www.houstonhealth.org/services/clinical/health-centers | Municipal health-center context and listed locations. |
| https://www.houstonhealth.org/services/multi-service-centers/sunnyside-multi-service-center | Retained Sunnyside official location and public service description. |
| https://www.wrksolutions.com/childcare-financial-assistance | Held Workforce Solutions resource: no numbered local location on inspected page. |
| https://www.childcare.texas.gov/ | Held statewide Texas Child Care Connection: Houston locality unsupported. |
| https://childcareresourcecenter.org/ | Screened and excluded: the official page gives Winston-Salem, North Carolina contact information, not Houston metro. |

## Caveats for later reviewers

The African Houston Directory does not itself establish a business’s current operation, ownership, or licensing; it was treated as discovery/source evidence only and all retained commercial candidates have a separately inspected customer-facing official website or official business-social destination. For the Houston Hispanic Chamber, direct detail extraction was limited; the one named accessible contact record was held, not guessed. City, state, and federal public resources were retained only where their own official pages stated a specific Houston street address. Future review should re-check public destinations and addresses before any directory publication.
