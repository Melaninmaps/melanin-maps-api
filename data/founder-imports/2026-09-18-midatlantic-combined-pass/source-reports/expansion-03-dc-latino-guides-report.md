# Washington, DC Latino Business Guides and Chambers — Evidence Report

**Scope.** This pass researched credible Washington, DC Latino-owned business guides, Hispanic chamber sources, and neighborhood organizations. It prioritized first-party organizational pages and the Greater Washington Hispanic Chamber of Commerce (GWHCC) published business directory. The pass did not call a database/API, publish records, or treat chamber membership alone as proof of ownership.

## Sources reviewed

| Source | Evidence used | Limitations |
|---|---|---|
| [GWHCC Business Resources](https://www.gwhcc.org/resources.html) | Officially states that its In the Biz Small Business Directory highlights and promotes Washington, DC businesses that participated in the GWHCC Small Business Technical Assistance Program, and links the directory. | The program directory is a historical 2017 edition; current operating status must be rechecked before publication. |
| [GWHCC In the Biz directory PDF](https://www.gwhcc.org/uploads/1/2/9/4/129415236/sbta_catalog_final_aug312017.pdf) | Published names, owner names, categories, addresses, phones, websites, online-only labels, and service descriptions for businesses in Washington, DC and the wider DMV. | Historical publication; some entries are outside DC and were excluded. Owner names and cultural/food descriptions were preserved as published, but no Latino ownership was inferred where ethnicity was not explicitly stated. |
| [Latino Economic Development Center](https://www.ledcmetro.org/) | First-party mission, Small Biz Directory link, DC office address and phone. | The accessible page did not expose a complete stable business listing, so it was recorded as a community resource rather than used to manufacture individual business records. |
| [District Bridges Columbia Heights  Mount Pleasant Main Streets](https://districtbridges.org/main-street/columbia-heights-mount-pleasant/) | First-party neighborhood organization page describes direct technical assistance, grants, events, and an Explore the neighborhood list of businesses. | The captured list did not provide street addresses or official customer-facing destinations for each business; no individual business pins were inferred. |

## Candidate summary

The JSONL file contains **10 candidates**: **7 commercial candidates** (5 physical businesses and 2 explicitly online-only businesses) and **3 community resources**. No candidate was assigned a Latino ownership designation unless the source explicitly supplied one; because the GWHCC directory generally names owners and describes Latino/Hispanic/Latin American food or service context without explicitly labeling owner ethnicity, the `ownershipDesignations` arrays remain empty and the evidence is recorded in prose.

| Rows | Type | Count | Notes |
|---:|---|---:|---|
| 1–2, 4–5, 7 | `business` | 5 | DC physical listings with street address, phone, and official website from the GWHCC directory. |
| 3, 6 | `online_business` | 2 | Dapper Guru and Mena's Boys Gourmet are explicitly labeled “Online Only Store” in the GWHCC directory; addresses are null and no map pin is invented. |
| 8–10 | `community_resource` | 3 | GWHCC, LEDC, and District Bridges neighborhood/Main Street support resources. |

## Included commercial records

The physical listings are Lady Clipper Barber Shop (1514 U Street NW), Image Hair Salon (3453 14th Street NW), Huacatay (2314 4th Street NE), Esencias Panamenas (3322 Georgia Avenue NW), and Taqueria Los Compadres (3213 Mt. Pleasant Street NW). The directory supplies each with a street address, phone, and customer-facing website. Dapper Guru and Mena's Boys Gourmet are retained as online-only because the source explicitly says “Online Only Store.”

The source’s published service descriptions were converted into restrained search terms such as barbershop, hair salon, Peruvian cuisine, Panamanian restaurant, Mexican food, grooming products, and gourmet food products. Hours were not imported as durable facts because the directory is old and hours can change.

## Exclusions and non-inferences

Entries outside Washington, DC, including College Park, Maryland, and DMV-wide mobile operations without a stable DC street address, were excluded from this DC physical-business pass. Mid City Café and other entries whose source capture did not provide a customer-facing website were not added as physical commercial candidates. The District Bridges Explore list was not converted into business rows because the captured source did not provide the required address plus official customer destination for each listing. Houses of worship were not treated as businesses; none was added in this pass. Health, legal, financial, childcare, and similar regulated services were not added as commercial records from the available evidence. No license, insurance, availability, accessibility, language, hours, or current operating status was inferred.

## Accessibility and verification limitations

The GWHCC directory is a 2017 PDF and therefore requires current re-verification of addresses, websites, phone numbers, hours, and operation before public map publication. The GWHCC resources page is accessible as HTML, but the linked directory’s current status is historical. LEDC’s official site exposes a Small Biz Directory link, but the full listing was not available in the captured page. District Bridges provides a useful neighborhood business discovery surface and program context, but its accessible page did not expose enough record-level fields for compliant import. Social URLs are included only where they were explicitly linked by the first-party source; no social account was guessed from a business name.

## Source URLs

1. https://www.gwhcc.org/resources.html
2. https://www.gwhcc.org/uploads/1/2/9/4/129415236/sbta_catalog_final_aug312017.pdf
3. https://www.ledcmetro.org/
4. https://districtbridges.org/main-street/columbia-heights-mount-pleasant/

The candidate file is intentionally conservative: it favors traceability and explicit evidence over completeness and does not claim that chamber participation alone proves Latino ownership.
