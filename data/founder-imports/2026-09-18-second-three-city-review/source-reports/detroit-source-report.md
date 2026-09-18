# Detroit, MI directory-research wave — source report

**Scope.** This single bounded pass covers Detroit and nearby suburbs. It prioritizes public Black/African American, Latino/Hispanic, diaspora-focused, and municipal minority-business sources, then retains only records meeting the requested evidence and address/destination requirements. The candidate file contains **68 retained records**. The held file contains **12 records** that were considered but not promoted.

## Retained evidence

The retained set includes **5 explicitly online-only Black-owned directory entries**, **6 Black-owned physical businesses plus one Black-led/community-owned grocery**, **17 Hispanic-owned physical businesses**, **6 community or cultural places**, and **33 municipal-certification candidates**. City register records were retained only where the municipal public data showed an active Minority-Owned Business Enterprise certification, a numbered address, and a listed business website. Category labels for the municipal set are deliberately broad when only the company name or an official website supported the classification.

Community resources and cultural places are separate target kinds. Health/wellness, child-care, financial-technology, and security-service records are sent to `regulated_review` when retained or held. This routing is not a claim about licensure, regulatory status, eligibility, quality, ownership beyond the stated source designation, language ability, accessibility, availability, hours, services beyond the cited evidence, or geographic service area.

## Held records and limitations

Held records demonstrate application of the required caution rule. Records were held where a physical business lacked a numbered street address, an entry was not explicitly online-only, a purported official destination was not current or resolvable, or the source placed the offering outside the Detroit-area physical scope. In particular, Honey Bee La Colmena’s source domain redirected to an unrelated site, and Rodriguez Vaquerita’s listed domain did not resolve during this pass. The Carr Center’s inspected page substantiated its cultural mission but did not supply a numbered street address.

Directory and visitor-bureau designations were treated as evidence of the stated ownership/identity designation only. Chamber membership or sponsorship was not used as ownership proof. The municipal register’s “Minority-Owned Business Enterprise” designation was used exactly as an active City of Detroit certification signal; it was not expanded into a more specific racial, ethnic, or personal identity claim. Addresses and official destinations can change after this single-pass research date. The report does not represent an exhaustive directory.

## Validation and non-publication

Every JSONL row was generated in UTF-8, parsed as JSON, checked for the required contract keys, checked for URL-or-null fields, and checked for the required numbered physical address on retained physical candidates. An exact case-insensitive duplicate check on **name + city + state + address** found no retained duplicates. No latitude or longitude was written. **No production database/API was called or modified, no account was accessed, and no production publication occurred.**

## Every source URL inspected

[1]: https://www.detroitworldwide.com/black-business-directory "Detroit Worldwide Black Business Directory"
[2]: https://visitdetroit.com/inside-the-d/detroits-black-owned-businesses/ "Visit Detroit: Detroit’s Black-Owned Businesses"
[3]: https://visitdetroit.com/inside-the-d/black-owned-grocery-stores/ "Visit Detroit: Black Owned Grocery Stores in the Detroit Area"
[4]: https://www.metroparent.com/things-to-do/hispanic-owned-businesses-to-support-this-hispanic-heritage-month-154858 "Metro Parent: Hispanic-Owned Businesses to Support this Hispanic Heritage Month"
[5]: https://downtowndetroit.org/news-insights/list-downtown-detroit-black-owned-businesses/ "Downtown Detroit Partnership: List of Downtown Detroit Black-Owned Businesses"
[6]: https://data-detroitmi.hub.arcgis.com/datasets/detroit-business-certification-register/about "Detroit Business Certification Register dataset description"
[7]: https://www.americanarab.com/ "American Arab Chamber of Commerce official site"
[8]: https://www.dhdc1.org/ "Detroit Hispanic Development Corporation official site"
[9]: https://www.thewright.org/visit "The Wright official visit page"
[10]: https://detroitpeoplesfoodcoop.com/ "Detroit People’s Food Co-op official site"
[11]: https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/Detroit_Business_Certification_Register/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json&resultRecordCount=50 "City of Detroit certification-register feature query"
[12]: https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/Detroit_Business_Certification_Register/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json&resultRecordCount=1000 "City of Detroit certification-register full feature query"
[13]: https://www.mexicantowncdc.org/ "Mexicantown CDC official site"
[14]: https://www.thecarrcenter.org/ "The Carr Center official site"
[15]: https://www.dbcfsn.org/ "Detroit Black Community Food Sovereignty Network official site"
[16]: https://www.mhcc.org/ "Michigan Hispanic Chamber of Commerce official site"
[17]: https://brazeltonsflorist.com/ "Brazelton’s Florals official site"
[18]: http://www.thedetroitpeppercompany.com/ "The Detroit Pepper Company official site"
[19]: http://goodcakesandbakes.com/ "Good Cakes & Bakes official site"
[20]: https://savannahbluedetroit.com/ "SavannahBlue official site"
[21]: http://www.eatdimestore.com/ "Dime Store official site"
[22]: https://www.bluehorizonco.com "Blue Horizon Construction official site"
[23]: https://earlyfoundationscdc.com "Early Foundations Child Development Center official site"
[24]: https://amprocontractor.com "Ampro Construction official site"
[25]: https://www.reaganmech.com "Reagan Mechanical official site"
[26]: https://benwashingtonandsons.com "Ben Washington & Sons Plumbing and Heating official site"
[27]: https://idealcontracting.com "Ideal Contracting official site"
[28]: https://www.fit4lifemichigan.com/ "Fit4Life Michigan official site"
[29]: https://www.rodriguezvaquerita.com/ "Rodriguez Vaquerita official site (unresolved during fetch)"
[30]: https://honeybeemkt.com/ "Honey Bee Market official site (redirected to unrelated site)"
[31]: https://laferiadetroit.com/ "La Feria official site"
