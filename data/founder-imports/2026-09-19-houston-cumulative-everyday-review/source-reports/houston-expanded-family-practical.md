# Houston family and practical-needs discovery research

**Result.** This research produced **37 candidate records** and **12 held records** for Mapping with Melanin’s Houston directory category. Candidates concentrate on family support, civil legal help, financial education, housing navigation, workforce support, community groups, food access, public resource navigation, and a limited number of clearly online discovery tools. The candidate set deliberately includes public and nonprofit services alongside a small number of everyday-life destinations. It does not assert ownership, demographic identity, service availability, price, hours, quality, safety, accessibility, licensure, or eligibility unless those facts are explicit in an opened source.

## Evidence model and selection

Houston Public Library’s Community Resources Guide was the primary public discovery source. It explicitly links readers to local support in disability/senior services, domestic violence, job training, food, homelessness, housing, immigration, legal, LGBTQ, substance-use, and veteran categories. [1] The Houston Lawyer Referral Service directory and the Harris County Community Resources page supplied additional public directory corroboration for legal, family, workforce, financial, housing, and community resources. [2] [3] Every candidate was also checked against an opened official customer-facing or program destination. Where an official site was the only opened support, `sourceStatus` transparently says so rather than implying independent directory validation.

The record schema contains **exactly 23 ordered fields** in both JSONL files. Candidate `sourceRow` values run consecutively from 1 through 37. Unknown fields use JSON `null`. Only the Greater Houston Black Chamber carries an explicit designation because its opened Buy Black directory and Chamber site expressly describe Black/African-American business support; no identity was inferred for any other record. [47] [48]

## Coverage and deduplication

The candidate set includes 37 distinct destinations/products. Internal deduplication compared normalized name, address, and website tuples. It found **no duplicate candidate records**. Separate records were preserved only where they are materially different discovery targets: for example, the Houston Food Bank organization and its Find Food Map are respectively a physical community-resource organization and an online locator. No source was converted into multiple branch records merely because it has several programs.

| Coverage focus | Candidate examples | Notes |
|---|---|---|
| Family and community support | Family Houston, Community Family Centers, AVANCE-Houston, Catholic Charities, PFLAG Houston, public disability and veteran offices | Services search terms are limited to the opened source text. |
| Legal aid and information | Houston Volunteer Lawyers, Lone Star Legal Aid, Harris County Law Library, Texas Free Legal Answers | Legal-assistance nonprofits/libraries are treated as `community_resource`; no individual lawyer/provider licensing is asserted. |
| Financial and housing navigation | MAM, Easter Seals Greater Houston, Family Houston, Harris County HCD, Greater Houston Fair Housing Center | The fair-housing center remains a no-address community resource because its official page supplies services and contact phone but not an office address. |
| Workforce and re-entry | Workforce Solutions East End, More Jobs Houston, Community Re-Entry Network Program, AAMA, BakerRipley | More Jobs Houston is a clearly online offering. |
| Grocery and everyday life | Houston Food Bank, Kids’ Meals, Heights Interfaith Ministries Food Pantry, Houston Farmers Market, Houston Public Library resource center | Food/location conditions and merchant/payment details are not inferred. |

## Held leads and limitations

The held file contains 12 leads excluded from candidate treatment because the opened evidence was incomplete, inconsistent, out of scope, or lacked the required current physical evidence. Examples include the Houston Housing Authority/Alliance naming discrepancy, entities where neither the public source nor official destination supplied a numbered location, failed official extraction for two legal-service leads, statewide online legal information without a Houston-specific designation, and laundry businesses found only through their own customer pages. This approach avoids converting weak or source-only leads into directory candidates.

The research was constrained to publicly accessible pages that could be opened in this session. Dynamic search databases, member-only directories, and pages whose text extraction failed were not treated as verified evidence. The Houston Public Library guide itself identifies Texas Free Legal Answers and TexasLawHelp, but TexasLawHelp was held for statewide rather than Houston-specific scope. [1] No claim has been made about current intake, eligibility, waitlists, language, fees, operating status, appointment availability, accessibility, safety, professional licensure, or service quality beyond literal source language.

## Research-only statement

This is **research-only** work. There was **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**.

## Opened sources and URLs

The following source and destination URLs were opened during this research. Pages identified as extraction-unavailable are listed because the attempted verification informed the held decision.

[1]: https://houstonlibrary.org/community-resources "Houston Public Library Community Resources Guide"
[2]: https://hlrs.org/resources/ "Houston Lawyer Referral Service Community Resources Directory"
[3]: https://cscd.harriscountytx.gov/More-Information/Client-Resources/Community-Resources "Harris County Community Resources"
[4]: https://ghcf.org/community-impact/giving-guide-of-houston-black-led-organizations/ "Greater Houston Community Foundation Giving Guide of Houston Black-Led Organizations"
[5]: https://www.ghcfgivingguide.org/ "Giving Guide of Houston Black-Led Organizations"
[6]: https://crghouston.org/ "Community Resources Guide Houston"
[7]: https://www.houstonfoodbank.org/ "Houston Food Bank"
[8]: https://kidsmealsinc.org/ "Kids' Meals"
[9]: https://housingforhouston.com/ "Houston Housing Authority / Alliance for Houston Hope Housing"
[10]: https://www.makejusticehappen.org/ "Houston Volunteer Lawyers"
[11]: https://www.bakerripley.org/services "BakerRipley Services"
[12]: https://www.bakerripley.org/locations "BakerRipley Locations"
[13]: https://www.familyhouston.org/communitysupport "Family Houston Community Support"
[14]: https://www.familyhouston.org/financial-stability-coaching "Family Houston Financial Stability Coaching"
[15]: https://www.mamhouston.org/financialed "Memorial Assistance Ministries Financial Education"
[16]: https://eastersealshouston.org/houston-financial-education/ "Easter Seals Greater Houston Financial Education and Coaching"
[17]: https://catholiccharities.org/ "Catholic Charities Galveston-Houston"
[18]: https://catholiccharities.org/needhelp/ "Catholic Charities Need Help"
[19]: https://www.wrksolutions.com/ "Gulf Coast Workforce Solutions"
[20]: https://www.wrksolutions.com/find-a-career-office "Gulf Coast Workforce Solutions Career Office Finder"
[21]: https://avda.org/ "AVDA"
[22]: https://tbotw.org/ "The Bridge Over Troubled Waters"
[23]: https://hawc.org/ "Houston Area Women's Center"
[24]: https://www.homelesshouston.org/ "Coalition for the Homeless of Houston/Harris County"
[25]: https://www.homeless-healthcare.org/ "Healthcare for the Homeless — Houston"
[26]: https://lonestarlegal.org/ "Lone Star Legal Aid"
[27]: https://houston.dressforsuccess.org/ "Dress for Success Houston"
[28]: https://www.houstonhealth.org/services/community-re-entry "Community Re-Entry Network Program"
[29]: https://www.houstonfairhousing.org/ "Greater Houston Fair Housing Center"
[30]: https://www.combinedarms.us/ "Combined Arms"
[31]: https://www.pflaghouston.org/ "PFLAG Houston"
[32]: https://www.communityfamilycenters.org/ "Community Family Centers"
[33]: https://aama.org/ "AAMA"
[34]: https://avancehouston.org/ "AVANCE-Houston"
[35]: https://www.houstontx.gov/vetaffairs/ "Office of Veterans and Military Affairs"
[36]: https://unitedwayhouston.org/ "United Way of Greater Houston"
[37]: https://publichealth.harriscountytx.gov/ "Harris County Public Health"
[38]: https://www.houstonhealth.org/services/disease-prevention/farmers-markets-food-access "Houston Farmers Markets Food Access"
[39]: https://himfoodpantry.org/ "Heights Interfaith Ministries Food Pantry"
[40]: https://www.namonline.org/ "Northwest Assistance Ministries"
[41]: https://www.harriscountylawlibrary.org/ "Harris County Robert W. Hainsworth Law Library"
[42]: https://csd.harriscountytx.gov/ "Harris County Housing and Community Development"
[43]: https://thehoustonfarmersmarket.com/ "Houston Farmers Market"
[44]: https://thehoustonfarmersmarket.com/market-faqs/ "Houston Farmers Market FAQ"
[45]: https://morejobshouston.com/ "More Jobs Houston"
[46]: https://houstonrecoverycenter.org/ "Houston Recovery Center"
[47]: https://houstonbuyblack.com/ "Houston Buy Black"
[48]: https://ghbcc.com/ "Greater Houston Black Chamber"
[49]: https://www.northshepherdlaundromat.com/ "North Shepherd Laundromat"
[50]: https://soapsudslaundry.com/ "Soap Suds Coin Laundry"
[51]: https://wavemaxlaundry.com/houston-tx/ "WaveMAX Laundry Houston"
[52]: https://www.houstontx.gov/disabilities/ "Office for People with Disabilities"
[53]: https://www.houstontx.gov/health/Aging/ "Harris County Area Agency on Aging"
[54]: https://www.houstonfoodbank.org/find-help/ "Houston Food Bank Find Help"
[55]: https://www.houstonfoodbank.org/find-help/find-food-map/ "Houston Food Bank Find Food Map"
[56]: https://texas.freelegalanswers.org/ "Texas Free Legal Answers"
[57]: https://texaslawhelp.org/ "TexasLawHelp"
[58]: https://www.tsulaw.edu/ecli/ "Earl Carl Institute official destination (extraction unavailable)"
[59]: https://www.houstonimmigration.org/resources/need-help/ "Houston Immigration Legal Services Collaborative official destination (extraction unavailable)"
[60]: https://www.wesleycommunitycenter.org/ "Wesley Community Center"
