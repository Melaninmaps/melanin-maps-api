# Mapping with Melanin Research Report: Allentown / Lehigh Valley Family Resources

**Prepared by Manus AI — 19 September 2026**

## Result

This research-only package contains **21 candidate records** and **3 held leads** for the Allentown / Lehigh Valley slice. It covers family services, financial education, cultural organizations, professional services, shopping, and everyday resources. The city scope is limited to **Allentown, Bethlehem, and clearly Lehigh Valley-serving organizations**. No Houston or non-Lehigh-Valley records were researched or included.

The stated profile context was used only to select potentially useful categories: family and youth resources, bilingual Latino-serving services, an explicitly Black-led community organization, financial education, cultural destinations, business resources, and everyday public resources. It was **not** used to infer any person’s identity, health, income, housing status, family circumstances, language ability, safety needs, or preferences. Demographic designations appear only where an opened source explicitly attributes them.

| Category | Candidates |
|---|---:|
| Family services | 7 |
| Financial education | 1 |
| Cultural organizations | 4 |
| Professional services | 5 |
| Shopping | 1 |
| Everyday resources | 3 |
| **Total** | **21** |

The candidate file uses exactly the required **23 JSON fields in the required order**. `sourceRow` is consecutive from 1 through 21. Candidate records use only the allowed target kinds and contain numbered street addresses unless clearly online-only. The package includes **no coordinates**.

## Candidate selection and evidence approach

Each candidate has an opened official customer-facing destination. Public or nonprofit resources are classified as `community_resource`; museums and science/history/culture venues are `cultural_place`; the farmers market is a `physical_business`; and the Chamber business-search offering is `online_business`. No regulated provider was included, so this slice has no `regulated_review` records.

The strongest explicitly attributed community designations are retained without extending them beyond the source language. The Hispanic American Organization says it was founded to serve the Latino community, describes itself as fully bilingual, and lists its Allentown public office. The Hispanic Chamber of Commerce identifies itself as a Hispanic Chamber. The Museum of Indian Culture describes itself as a Native American museum. Promise Neighborhoods’ official page explicitly identifies it as Black-led, anti-racist, woman-centered, and resident-led, but its inconsistent official-page address evidence places it in held rather than candidates. [2] [11] [23] [25]

Financial Literacy Center of the Lehigh Valley is included because its official website describes free, comprehensive financial education and its opened official Facebook Page publishes the numbered Allentown address and telephone number. That social destination is recorded transparently in `sourceUrl` and `socialSourceUrl`; no claim about its ownership, licensing, fees, availability, or outcomes is made. [24] [26]

## Within-category deduplication checks

A case-insensitive exact-name check, official website/source URL check, street-address check, and category review were completed before finalizing the files. There are **0 duplicate candidates** by exact normalized name and **0 accidental same-destination duplicates** within a category. The following similar or co-located records were retained as distinct only because the opened sources establish different entities or services:

- **Allentown Health Bureau** and **City of Allentown Child & Family Services** share Alliance Hall at 245 N. 6th Street, but the former is the municipal bureau and the latter is its separately described injury-prevention program.
- **Community Action Lehigh Valley** is a Bethlehem-based regional organization, while **Sixth Street Shelter** is its separately branded Allentown program with its own official public contact address and coordinated-entry instructions.
- **Hispanic Chamber of Commerce of the Lehigh Valley** is a Chamber program/destination, while the **Lehigh Valley Business Directory** is a distinct online search offering; the latter is marked `online_business` and has no address.
- The Allentown Public Library’s English home page and Spanish library-card page were opened, but they support **one** candidate, not two.

## Held leads

The held file preserves three leads that should not enter a production directory without resolution.

| Held lead | Reason held | Resolution needed |
|---|---|---|
| Promise Neighborhoods of the Lehigh Valley | Its official page presents 535 Hamilton St., Suite 201, Allentown, PA 18101, while the same page’s marketing footer identifies 333 W. Union St., Allentown, PA 18102. | Confirm the current public service address directly with the organization. |
| Allentown School District Family & Community Resource Center | The District describes the center as under development with a December 2026 target completion date; no numbered operating destination is published. | Recheck after opening and verify the customer-facing address. |
| Allentown Public Theatre | The official contact page gives an address c/o St. Luke’s Lutheran Church, but the opened pages do not establish it as a public visitor or program venue. | Confirm whether the c/o address is a public-facing destination and where programs occur. |

## Limitations and use boundaries

This is a point-in-time research package, not a recommendation, eligibility decision, quality assessment, safety assessment, or accessibility audit. Addresses, programs, admission processes, hours, pricing, language access, and availability can change. The data does not infer demographic ownership, demographic identity, licensing, accessibility, price, hours, quality, language, safety, or services beyond what the cited source explicitly states. Where a resource involves housing, health, or other potentially sensitive assistance, the record describes the organization’s stated offering only and does not infer a need for it.

The candidate records contain concise, neutral, source-supported search terms. Social links are retained only when present on an opened official destination. The source set prioritizes municipal, school, nonprofit, Chamber, cultural, and official business/customer-facing destinations; third-party listings were used only as supplementary corroboration during research and not as a substitute for an opened official destination.

## Opened source register

The following public pages were opened and read. These are the source URLs used to verify candidate details, source status, address/contact evidence, or held status.

| # | Opened source | Primary use |
|---:|---|---|
| 1 | [City of Allentown — Child & Family Services][1] | Municipal family-safety program, Alliance Hall address, phone, stated services |
| 2 | [Hispanic American Organization][2] | Explicit Latino-serving/bilingual description, Allentown office, services |
| 3 | [United Way of the Greater Lehigh Valley][3] | Regional resource organization, address, phone, stated investment areas |
| 4 | [Family Promise of Lehigh Valley][4] | Family-support mission, Allentown contact, service description |
| 5 | [Sixth Street Shelter][5] | Allentown program address, phone, coordinated-entry and family-service description |
| 6 | [Community Action Lehigh Valley][6] | Bethlehem regional organization contact and program areas |
| 7 | [PA CareerLink® Lehigh Valley][7] | Workforce/youth resource address, phone, stated services |
| 8 | [Allentown Public Library][8] | Library location, public resources, events, contact |
| 9 | [Allentown Public Library — Spanish library-card information][9] | Spanish public-facing library-card information |
| 10 | [City of Allentown — Office of Business Development][10] | Municipal small-business support, address, phone, service links |
| 11 | [Hispanic Chamber of Commerce of the Lehigh Valley][11] | Explicit Chamber designation, business/community-development mission, resources |
| 12 | [Lehigh Valley Chamber offices][12] | Numbered Allentown office address supporting Chamber destination |
| 13 | [Allentown Economic Development Corporation — Urban Made][13] | Business-development and lending program description, address, phone |
| 14 | [Lehigh University Small Business Development Center][14] | Bethlehem office, consulting and educational offerings |
| 15 | [Lehigh Valley Business Directory][15] | Clearly online regional business-directory function |
| 16 | [Allentown Fairgrounds Farmers Market][16] | Market address, phone, merchant and shopping categories |
| 17 | [Allentown Art Museum — About][17] | Museum address, phone, exhibitions and educational-program description |
| 18 | [Museum of Indian Culture][18] | Native American museum self-description, address, educational offerings |
| 19 | [Lehigh Valley Heritage Museum][19] | Museum address, history/archive and program description |
| 20 | [Da Vinci Science Center][20] | Science-center visitor address, contact, family and education offerings |
| 21 | [City of Allentown — Parks & Recreation][21] | Parks/recreation office and program-reservation resource |
| 22 | [Allentown Health Bureau][22] | Municipal public-health office and stated services |
| 23 | [Promise Neighborhoods of the Lehigh Valley][23] | Explicit self-designations, mission, and conflicting address evidence |
| 24 | [Financial Literacy Center of the Lehigh Valley][24] | Financial-education mission, contact and social links |
| 25 | [Allentown School District Family & Community Resource Center][25] | Future-project status and planned service scope |
| 26 | [Financial Literacy Center official Facebook Page][26] | Numbered Allentown address, phone, nonprofit page description |
| 27 | [Allentown Public Theatre contact page][27] | c/o address and contact details for held review |

## Research-only confirmation

This work was **research only**. It made **no production database or API write**, no pin placement, no geocode, no deployment, and no change to authentication, users, sessions, payments, or waitlist status.

## References

[1]: https://www.allentownpa.gov/en-us/Government/Departments/Community-Economic-Development/Health-Bureau/Injury-Prevention-Program/Child-Family-Services "City of Allentown: Child & Family Services"
[2]: https://www.hao-lv.org/ "Hispanic American Organization"
[3]: https://www.unitedwayglv.org/ "United Way of the Greater Lehigh Valley"
[4]: https://fplehighvalley.org/ "Family Promise of Lehigh Valley"
[5]: https://www.sixthstreetshelter.org/ "Sixth Street Shelter"
[6]: https://www.communityactionlv.org/ "Community Action Lehigh Valley"
[7]: https://careerlinklehighvalley.org/ "PA CareerLink® Lehigh Valley"
[8]: https://www.allentownpl.org/ "Allentown Public Library"
[9]: https://www.allentownpl.org/como-obtener-una-tarjeta-de-la-biblioteca/ "Allentown Public Library: Cómo Obtener Una Tarjeta de la Biblioteca"
[10]: https://www.allentownpa.gov/en-us/Government/Departments/Community-Economic-Development/Business-Development-Office "City of Allentown: Office of Business Development"
[11]: https://www.lehighvalleychamber.org/hispanicchamber.html "Hispanic Chamber of Commerce of the Lehigh Valley"
[12]: https://www.lehighvalleychamber.org/offices.html "Greater Lehigh Valley Chamber of Commerce: Our Offices"
[13]: https://www.allentownedc.com/urban-made/ "Allentown Economic Development Corporation: Urban Made"
[14]: https://business.lehigh.edu/centers/small-business-development-center "Lehigh University Small Business Development Center"
[15]: https://web.lehighvalleychamber.org/search "Lehigh Valley Business Directory"
[16]: https://www.allentownfarmersmarket.com/ "Allentown Fairgrounds Farmers Market"
[17]: https://www.allentownartmuseum.org/about/ "Allentown Art Museum: About"
[18]: https://www.museumofindianculture.org/ "Museum of Indian Culture"
[19]: https://www.lehighcountyhistoricalsociety.org/?page_id=905 "Lehigh Valley Heritage Museum: About the Museum"
[20]: https://www.davincisciencecenter.org/ "Da Vinci Science Center"
[21]: https://www.allentownpa.gov/en-us/Government/Departments/Parks-Recreation "City of Allentown: Department of Parks & Recreation"
[22]: https://www.allentownpa.gov/en-us/Government/Departments/Community-Economic-Development/Health-Bureau "City of Allentown: Allentown Health Bureau"
[23]: https://promiseneighborhoodslv.org/ "Promise Neighborhoods of the Lehigh Valley"
[24]: https://www.flclv.org/ "Financial Literacy Center of the Lehigh Valley"
[25]: https://www.allentownsd.org/about-us/capital-projects/family-resource-center "Allentown School District: Family & Community Resource Center"
[26]: https://www.facebook.com/FinancialLiteracyCenter/ "Financial Literacy Center of the Lehigh Valley Facebook Page"
[27]: https://allentownpublictheatre.com/contact-us/ "Allentown Public Theatre: Contact Us"
