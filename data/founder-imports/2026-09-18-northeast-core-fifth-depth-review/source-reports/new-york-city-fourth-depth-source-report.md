# New York City Fourth-Depth Mapping with Melanin: Source Report

**Area:** New York City only: Bronx, Brooklyn, Manhattan, Queens, and Staten Island. **Research status:** review-only. **Prepared:** 2026-09-18.

## Result

This pass retained **15 qualified commercial candidates** and held **20 leads**. The retained set is balanced across all five boroughs and emphasizes everyday needs rather than restaurant inventory. The verified rows cover **12 categories**, including apparel, vision, personal care, fitness, florist, home improvement, veterinary care, storage, vehicle sales/service, bathroom fixtures, retail goods, insurance, and title/settlement services. Seven retained rows are routed as **regulated_review** because the directory category or the business’s stated services concern optometry, cosmetology, veterinary medicine, cannabis-product retail, insurance, or title insurance/settlement services. No quality, safety, licensure, ownership, culture, language, pricing, availability, accessibility, or hours claim was inferred.

| Borough / city field | Verified candidates | Held leads |
|---|---:|---:|
| Queens | 2 | 3 |
| Brooklyn | 2 | 5 |
| Bronx | 3 | 4 |
| New York (Manhattan) | 5 | 3 |
| Staten Island | 3 | 5 |
| **Total** | **15** | **20** |

| Retained category | Count |
|---|---:|
| Apparel and accessories | 1 |
| Animal health services | 1 |
| Fitness and recreation | 1 |
| Health and vision services | 1 |
| Home and garden | 1 |
| Home improvement | 3 |
| Insurance and financial services | 2 |
| Personal services | 1 |
| Real-estate support services | 1 |
| Retail goods | 1 |
| Storage services | 1 |
| Vehicle products and service | 1 |
| **Total** | **15** |

## Source families checked

The work inspected ten fresh public source families. Listing pages, not search snippets, were used as the basis for any retain or hold decision. The City of New York’s Small Business Services BID directory was inspected as a city public source to identify borough coverage and current BID organizations. [1] The remaining inspected families were the Myrtle Avenue BID in Queens, Myrtle Avenue Brooklyn Partnership, Morris Park BID, Southern Boulevard Merchant Association, 161st Street BID, Hudson Square BID, Forest Avenue BID, Shop Your City, and Atlantic Avenue BID. [2] [3] [4] [5] [6] [7] [8] [9] [10]

The City directory establishes that BID coverage includes all five boroughs; it was not treated as an individual-business listing source. [1] Shop Your City’s Black-Owned Businesses page and the Myrtle Avenue Brooklyn Partnership’s Black-owned business page were consulted as public attribution sources and discovery context. Any ownership designation retained in JSONL is quoted only where the public source expressly supplied it. [9] [11]

## Retained candidates and two-destination inspection

Each retained row has a listing-level directory source and an inspected official customer-facing website or official business social destination. The source-supported numbered address was retained only when no unresolved address conflict appeared in the reviewed destinations.

| ID | Candidate | Borough | Decision basis | Listing source | Official customer destination |
|---|---|---|---|---|---|
| 001 | Portabella Men’s Store | Queens | Retained: BID listing supplies the numbered address and links the customer site. | [12] | [13] |
| 002 | Sterling Optical | Queens | Retained as regulated_review: BID listing and official Ridgewood location page show 56-52 Myrtle Avenue. | [14] | [15] |
| 003 | Shic by Soketah | Brooklyn | Retained as regulated_review: merchant listing and official Facebook business page show 564 Myrtle Avenue. The explicit source designation is preserved. | [16] | [17] |
| 004 | Brooklyn Brazilian Jiu-Jitsu | Brooklyn | Retained: merchant listing provides 412 Myrtle Avenue and links the customer site. | [18] | [19] |
| 005 | Park Floral Company | Bronx | Retained: BID directory and official florist contact page show 1055 Morris Park Avenue. | [20] | [21] |
| 006 | Loconsolo of Morris Park | Bronx | Retained: BID directory and official Morris Park location page show 1057 Morris Park Avenue. The official site’s family-owned statement is preserved as attribution. | [20] | [22] |
| 007 | Animal Hospital of Morris Park | Bronx | Retained as regulated_review: BID directory and official hospital page show 1135A Morris Park Avenue. | [20] | [23] |
| 008 | Manhattan Mini Storage | Manhattan | Retained: BID listing and official facility page show 260 Spring Street. | [24] | [25] |
| 009 | Ducati Triumph NYC | Manhattan | Retained: BID listing’s “155 6th Avenue” and the official site’s “155 Avenue of the Americas” are the same street designation; no conflict found. | [26] | [27] |
| 010 | Lefroy Brooks | Manhattan | Retained: BID profile supplies 86 King Street and links the inspected customer destination. | [28] | [29] |
| 011 | Sherwin-Williams Paint Store | Manhattan | Retained: BID profile supplies 150 Varick Street and links the inspected customer destination. | [30] | [31] |
| 012 | CBD Kratom | Manhattan | Retained as regulated_review: BID profile supplies 161 6th Avenue and links the inspected SoHo customer page. | [32] | [33] |
| 013 | Bentson & Company Insurance | Staten Island | Retained as regulated_review: BID profile and official site show 653 Forest Avenue. | [34] | [35] |
| 014 | Admiral Insurance Group | Staten Island | Retained as regulated_review: BID profile and official contact page show 690 Forest Avenue. | [36] | [37] |
| 015 | Custom Land Services, Inc. | Staten Island | Retained as regulated_review: BID profile and official site show 690 Forest Avenue. | [38] | [39] |

## Held leads

The held file preserves leads rather than presenting them as candidates. The reasons are direct and mechanical: no inspectable official customer destination, source-to-official address conflict, official-link extraction failure, or an official social page expressly labeled unofficial.

| IDs | Source family | Held reason |
|---|---|---|
| 001, 002, 003, 020 | Myrtle Avenue BID (Queens) | Super Yapa and Ruby Palace had no official destination; Rent-A-Center’s listed location URL returned no extractable page; the Ridgewood Savings Bank linked destination did not resolve. [40] [41] [42] [43] [44] |
| 004, 005, 006, 007, 008 | Myrtle Avenue Brooklyn Partnership | Sandbox’s directory address conflicts with its inspected official site; Doo’s linked Facebook page calls itself unofficial; RBM links to a third-party profile; Bravo and Key Food’s listed official store URLs returned no extractable page. [45] [46] [47] [48] [49] [50] [51] [52] [53] |
| 009, 010 | Southern Boulevard Merchant Association | The individual merchant profiles supply address and phone but no official customer-facing destination. [54] [55] |
| 011 | 161st Street BID | The listing says “Website: N/A.” [56] |
| 012 | Morris Park BID | The source-listed Tech Daddy domain yielded no extractable official page content. [20] [57] |
| 013, 014, 015, 016 | Forest Avenue BID | Chey Florist had conflicting phone numbers; American Homes Group’s official site listed a different Staten Island address; Action Lock and Bement Shoe Hospital had no official destination. [58] [59] [60] [61] [62] [63] [64] |
| 017, 018, 019 | Hudson Square BID | Charlton Cleaners, Global Newsstand, and CVS profiles did not link a specific official customer destination. [65] [66] [67] |

## Inspection URL register

The following URL register documents all listing, source-family, and customer-destination pages inspected in this pass. Search-result snippets were discovery only and are not listed as evidence. Pages that returned no extractable content or failed to resolve are explicitly marked in the held-reason table above.

### City public and cross-borough sources

[1] [NYC SBS BID Directory](https://www.nyc.gov/site/sbs/neighborhoods/bid-directory.page).
[9] [NYC Shop Your City: Black-Owned Businesses](https://shopyourcity.cityofnewyork.us/syc-black/).
[10] [Atlantic Avenue BID Business Directory](https://atlanticavebid.org/business-directory/).
[11] [Myrtle Avenue Brooklyn Partnership: Support Black-Owned Businesses & Community](https://myrtleavenue.org/blackowned/).
[68] [Sunset Park BID: On the Avenue](https://sunsetparkbid.org/on-the-avenue/).

### Queens source pages and customer destinations

[2] [Myrtle Avenue BID (Queens) home page](https://ridgewood-ny.com/).
[12] [Myrtle Avenue BID: Bridal/Formal Wear](https://ridgewood-ny.com/business-directory/wpbdp_category/bridalformal-wear/).
[14] [Myrtle Avenue BID: Sterling Optical](https://ridgewood-ny.com/business-directory/sterling-optical/).
[40] [Myrtle Avenue BID: Super Yapa Supermarket/Ecuator Family Money Transfer](https://ridgewood-ny.com/business-directory/super-yapa-supermarket/).
[41] [Myrtle Avenue BID: Home Decorators](https://ridgewood-ny.com/business-directory/wpbdp_category/home-decorators/).
[42] [Rent-A-Center Ridgewood location URL (no extractable content)](https://locations.rentacenter.com/new-york/ridgewood/5652-myrtle-ave/).
[43] [Myrtle Avenue BID: Ridgewood Savings Bank](https://ridgewood-ny.com/business-directory/ridgewood-savings-bank/).
[44] [Ridgewood Savings Bank linked branch URL (unresolved)](http://www.branches.ridgewoodbank.com/).
[60] [Myrtle Avenue BID: Ruby Palace category listing](https://ridgewood-ny.com/business-directory/wpbdp_category/jewelry/?l=r).
[69] [Myrtle Avenue BID: Shopping](https://ridgewood-ny.com/business-directory/wpbdp_category/shopping/).
[70] [Myrtle Avenue BID: Professional Services](https://ridgewood-ny.com/business-directory/wpbdp_category/professional-services/).
[71] [Myrtle Avenue BID: All Listings](https://ridgewood-ny.com/business-directory/?wpbdp_view=all_listings).
[13] [Portabella customer website](https://www.portabellastores.com/).
[15] [Sterling Optical locations](https://sterlingoptical.com/locations/).
[72] [Portabella store locator](https://www.portabellastores.com/pages/store-locator).

### Brooklyn source pages and customer destinations

[3] [Myrtle Avenue Brooklyn Partnership: Shop Myrtle Avenue](https://myrtleavenue.org/explore/shop-myrtle-avenue/).
[16] [Shic by Soketah merchant listing](https://myrtleavenue.org/explore/myrtle-merchants/shic-by-soketah/).
[17] [Shic Hair, Nail & Beauty Bar Facebook page](https://www.facebook.com/SHICBK/).
[18] [Brooklyn Brazilian Jiu-Jitsu merchant listing](https://myrtleavenue.org/explore/myrtle-merchants/brooklyn-brazilian-jiu-jitsu/).
[19] [Brooklyn Brazilian Jiu-Jitsu customer website](https://brooklynbjj.com/bbjj-clinton-hill/).
[45] [Sandbox Pack & Ship merchant listing](https://myrtleavenue.org/explore/myrtle-merchants/sandbox-pack-ship/).
[46] [Sandbox customer website](http://www.sandbox.biz/).
[47] [Doo’s Barber Shop merchant listing](https://myrtleavenue.org/explore/myrtle-merchants/doos-barber-shop/).
[48] [Doo’s linked Facebook page, marked unofficial](https://www.facebook.com/pages/Doos-Barbershop/110415419021392).
[49] [RBM Brokerage merchant listing](https://myrtleavenue.org/explore/myrtle-merchants/rbm-brokerage/).
[50] [Bravo Supermarket merchant listing](https://myrtleavenue.org/explore/myrtle-merchants/bravo-supermarket/).
[51] [Bravo linked store URL (no extractable content)](https://locations.bravosupermarkets.com/ny-brooklyn-u43_169).
[52] [Key Food merchant listing](https://myrtleavenue.org/explore/myrtle-merchants/key-food/).
[53] [Key Food linked store URL (no extractable content)](http://www.keyfood.com/pd/stores/NY/Brooklyn/Key-Food-1900/1BC0128161).
[73] [Pitkin Avenue BID Business Directory](https://www.pitkinavenue.nyc/business-directory-1).

### Bronx source pages and customer destinations

[4] [Morris Park BID Business Directory](https://www.morrisparkbid.org/a-directory-copy).
[5] [Southern Boulevard Merchant Association Shop page](https://www.southernboulevard.org/shop/).
[6] [161st Street BID Directory](https://www.161bid.org/directory).
[20] [Morris Park BID directory record page](https://www.morrisparkbid.org/a-directory-copy).
[21] [Park Floral Company contact page](https://www.parkfloralbx.com/contact_us.php).
[22] [Loconsolo of Morris Park customer location](https://loconsolo.com/morris-park/).
[23] [Animal Hospital of Morris Park customer website](https://bronxanimalhospital.com/).
[54] [Supermarket Needs Corporation profile](https://www.southernboulevard.org/supermarket-needs-corporation/).
[55] [Luis Deli Grocery Corp profile](https://www.southernboulevard.org/luis-deli-grocery-corp/).
[56] [Leff Pharmacy profile](https://www.161bid.org/directory/leff-pharmacy).
[57] [Tech Daddy NYC source-listed domain (no extractable content)](https://techdaddynyc.com/).
[74] [Southern Boulevard grocery category page](https://www.southernboulevard.org/grocery/).
[75] [Park Floral Company customer website](https://www.parkfloralbx.com/).
[76] [Loconsolo customer website](https://loconsolo.com/).

### Manhattan source pages and customer destinations

[7] [Hudson Square BID Business Directory](https://hudsonsquarebid.org/business-resources/business-directory/).
[24] [Manhattan Mini Storage BID profile](https://hudsonsquarebid.org/business/manhattan-mini-storage-260-spring-street/).
[25] [Manhattan Mini Storage Spring Street customer location](https://www.storage-mart.com/manhattan/1987-spring-st-soho).
[26] [Ducati Triumph NYC BID profile](https://hudsonsquarebid.org/business/ducati-triumph-nyc/).
[27] [Ducati NYC customer website](https://www.ducatinyc.com/).
[28] [Lefroy Brooks BID profile](https://hudsonsquarebid.org/business/lefroy-brooks/).
[29] [Lefroy Brooks customer website](https://usa.lefroybrooks.com/).
[30] [Sherwin-Williams BID profile](https://hudsonsquarebid.org/business/sherwin-williams-paint-store/).
[31] [Sherwin-Williams customer website](https://www.sherwin-williams.com/homeowners).
[32] [CBD Kratom BID profile](https://hudsonsquarebid.org/business/cbd-kratom/).
[33] [CBD Kratom SoHo customer page](https://shopcbdkratom.com/pages/soho-opening).
[65] [Charlton Cleaners BID profile](https://hudsonsquarebid.org/business/charlton-cleaners/).
[66] [Global Newsstand BID profile](https://hudsonsquarebid.org/business/global-newsstand/).
[67] [CVS BID profile](https://hudsonsquarebid.org/business/cvs/).

### Staten Island source pages and customer destinations

[8] [Forest Avenue BID business directory](https://www.forestavenuebid.com/our-businesses).
[34] [Bentson & Company Insurance BID profile](https://www.forestavenuebid.com/our-businesses/bentson-company-insurance).
[35] [Bentson & Company customer website](https://www.bentsoninsurance.net/).
[36] [Admiral Insurance Group BID profile](https://www.forestavenuebid.com/our-businesses/admiral-insurance-group).
[37] [Admiral Insurance Group customer contact page](https://useadmiral.com/contact-us/).
[38] [Custom Land Services BID profile](https://www.forestavenuebid.com/our-businesses/custom-land-services-inc).
[39] [Custom Land Services customer website](https://customlandservice.com/).
[58] [Chey Florist BID profile](https://www.forestavenuebid.com/our-businesses/chey-florist).
[59] [Chey Florist customer website](https://www.cheyfloristsi.com/).
[61] [American Homes Group of SI BID profile](https://www.forestavenuebid.com/our-businesses/american-homes-group-of-si).
[62] [American Homes Group customer website](https://www.americanhomesgroup.com/).
[63] [Action Lock & Appliance Service BID profile](https://www.forestavenuebid.com/our-businesses/action-lock-appliance-service).
[64] [Bement Shoe Hospital BID profile](https://www.forestavenuebid.com/our-businesses/bement-shoe-hospital).

## Deduplication and validation

Before writing the output, the process parsed **3,536** JSONL records from every other folder beneath `/home/ubuntu/directory-research-wave-2026-09-18`; the output folder itself was excluded. Names and address components were case-folded and stripped of punctuation. Each proposed candidate was compared by normalized **name + city + state + country + address**, followed by a conservative normalized same-name screen. The audit found **zero exact-key matches and zero same-name hits** for the 15 retained candidates. The audit artifact is `dedupe-audit.json` in the output folder.

Both emitted JSONL files were parsed after writing. Every record has the required 23 fields in the prescribed order, and all unknown values are JSON `null`, not string placeholders. The emitted results are intentionally small because leads without a verified official destination, with a source-to-official address conflict, or with an unsupported current status were held rather than padded into the candidate file.

## Research-only boundary

This is a public-web research pass only. It made **no** geocoding, coordinates, map-pin placement, database or API writes, deployments, account changes, authentication changes, payments, waitlist actions, or contact with businesses. Addresses are source-published text, not geocoded values. The data does not assert ownership, protected traits, culture, language, licensure, quality, safety, hours, price, availability, or accessibility beyond explicitly attributed statements preserved in the row fields.

## References

[1]: https://www.nyc.gov/site/sbs/neighborhoods/bid-directory.page "NYC Small Business Services BID Directory"
[2]: https://ridgewood-ny.com/ "Myrtle Avenue Business Improvement District, Queens"
[3]: https://myrtleavenue.org/explore/shop-myrtle-avenue/ "Myrtle Avenue Brooklyn Partnership: Shop Myrtle Avenue"
[4]: https://www.morrisparkbid.org/a-directory-copy "Morris Park BID Business Directory"
[5]: https://www.southernboulevard.org/shop/ "Southern Boulevard Merchant Association Shop"
[6]: https://www.161bid.org/directory "161st Street BID Directory"
[7]: https://hudsonsquarebid.org/business-resources/business-directory/ "Hudson Square BID Business Directory"
[8]: https://www.forestavenuebid.com/our-businesses "Forest Avenue BID Business Directory"
[9]: https://shopyourcity.cityofnewyork.us/syc-black/ "NYC Shop Your City: Black-Owned Businesses"
[10]: https://atlanticavebid.org/business-directory/ "Atlantic Avenue BID Business Directory"
[11]: https://myrtleavenue.org/blackowned/ "Support Black-Owned Businesses & Community on Myrtle Avenue"
[12]: https://ridgewood-ny.com/business-directory/wpbdp_category/bridalformal-wear/ "Myrtle Avenue BID Bridal and Formal Wear Listings"
[13]: https://www.portabellastores.com/ "Portabella Customer Website"
[14]: https://ridgewood-ny.com/business-directory/sterling-optical/ "Myrtle Avenue BID Sterling Optical Listing"
[15]: https://sterlingoptical.com/locations/ "Sterling Optical Locations"
[16]: https://myrtleavenue.org/explore/myrtle-merchants/shic-by-soketah/ "Shic by Soketah Merchant Listing"
[17]: https://www.facebook.com/SHICBK/ "Shic Hair, Nail & Beauty Bar Facebook Page"
[18]: https://myrtleavenue.org/explore/myrtle-merchants/brooklyn-brazilian-jiu-jitsu/ "Brooklyn Brazilian Jiu-Jitsu Merchant Listing"
[19]: https://brooklynbjj.com/bbjj-clinton-hill/ "Brooklyn Brazilian Jiu-Jitsu Clinton Hill"
[20]: https://www.morrisparkbid.org/a-directory-copy "Morris Park BID Directory"
[21]: https://www.parkfloralbx.com/contact_us.php "Park Floral Company Contact Page"
[22]: https://loconsolo.com/morris-park/ "Loconsolo of Morris Park"
[23]: https://bronxanimalhospital.com/ "Animal Hospital of Morris Park"
[24]: https://hudsonsquarebid.org/business/manhattan-mini-storage-260-spring-street/ "Manhattan Mini Storage Hudson Square BID Listing"
[25]: https://www.storage-mart.com/manhattan/1987-spring-st-soho "Manhattan Mini Storage Spring Street"
[26]: https://hudsonsquarebid.org/business/ducati-triumph-nyc/ "Ducati Triumph NYC Hudson Square BID Listing"
[27]: https://www.ducatinyc.com/ "Ducati NYC Customer Website"
[28]: https://hudsonsquarebid.org/business/lefroy-brooks/ "Lefroy Brooks Hudson Square BID Listing"
[29]: https://usa.lefroybrooks.com/ "Lefroy Brooks Customer Website"
[30]: https://hudsonsquarebid.org/business/sherwin-williams-paint-store/ "Sherwin-Williams Paint Store Hudson Square BID Listing"
[31]: https://www.sherwin-williams.com/homeowners "Sherwin-Williams Homeowners"
[32]: https://hudsonsquarebid.org/business/cbd-kratom/ "CBD Kratom Hudson Square BID Listing"
[33]: https://shopcbdkratom.com/pages/soho-opening "CBD Kratom SoHo Customer Page"
[34]: https://www.forestavenuebid.com/our-businesses/bentson-company-insurance "Bentson and Company Insurance Forest Avenue BID Listing"
[35]: https://www.bentsoninsurance.net/ "Bentson and Company Insurance Customer Website"
[36]: https://www.forestavenuebid.com/our-businesses/admiral-insurance-group "Admiral Insurance Group Forest Avenue BID Listing"
[37]: https://useadmiral.com/contact-us/ "Admiral Insurance Group Contact Page"
[38]: https://www.forestavenuebid.com/our-businesses/custom-land-services-inc "Custom Land Services Forest Avenue BID Listing"
[39]: https://customlandservice.com/ "Custom Land Services Customer Website"
[40]: https://ridgewood-ny.com/business-directory/super-yapa-supermarket/ "Super Yapa Supermarket Myrtle Avenue BID Listing"
[41]: https://ridgewood-ny.com/business-directory/wpbdp_category/home-decorators/ "Myrtle Avenue BID Home Decorators Listings"
[42]: https://locations.rentacenter.com/new-york/ridgewood/5652-myrtle-ave/ "Rent-A-Center Ridgewood Location"
[43]: https://ridgewood-ny.com/business-directory/ridgewood-savings-bank/ "Ridgewood Savings Bank Myrtle Avenue BID Listing"
[44]: http://www.branches.ridgewoodbank.com/ "Ridgewood Savings Bank Linked Branch Destination"
[45]: https://myrtleavenue.org/explore/myrtle-merchants/sandbox-pack-ship/ "Sandbox Pack and Ship Merchant Listing"
[46]: http://www.sandbox.biz/ "Clinton Hill Sandbox Customer Website"
[47]: https://myrtleavenue.org/explore/myrtle-merchants/doos-barber-shop/ "Doo's Barber Shop Merchant Listing"
[48]: https://www.facebook.com/pages/Doos-Barbershop/110415419021392 "Doo's Barbershop Linked Facebook Page"
[49]: https://myrtleavenue.org/explore/myrtle-merchants/rbm-brokerage/ "RBM Brokerage Merchant Listing"
[50]: https://myrtleavenue.org/explore/myrtle-merchants/bravo-supermarket/ "Bravo Supermarket Merchant Listing"
[51]: https://locations.bravosupermarkets.com/ny-brooklyn-u43_169 "Bravo Supermarkets Linked Store Destination"
[52]: https://myrtleavenue.org/explore/myrtle-merchants/key-food/ "Key Food Merchant Listing"
[53]: http://www.keyfood.com/pd/stores/NY/Brooklyn/Key-Food-1900/1BC0128161 "Key Food Linked Store Destination"
[54]: https://www.southernboulevard.org/supermarket-needs-corporation/ "Supermarket Needs Corporation Profile"
[55]: https://www.southernboulevard.org/luis-deli-grocery-corp/ "Luis Deli Grocery Corp Profile"
[56]: https://www.161bid.org/directory/leff-pharmacy "Leff Pharmacy 161st Street BID Listing"
[57]: https://techdaddynyc.com/ "Tech Daddy NYC Linked Customer Destination"
[58]: https://www.forestavenuebid.com/our-businesses/chey-florist "Chey Florist Forest Avenue BID Listing"
[59]: https://www.cheyfloristsi.com/ "Chey Florist Customer Website"
[60]: https://ridgewood-ny.com/business-directory/wpbdp_category/jewelry/?l=r "Myrtle Avenue BID Jewelry Listings"
[61]: https://www.forestavenuebid.com/our-businesses/american-homes-group-of-si "American Homes Group Forest Avenue BID Listing"
[62]: https://www.americanhomesgroup.com/ "American Homes Group Customer Website"
[63]: https://www.forestavenuebid.com/our-businesses/action-lock-appliance-service "Action Lock and Appliance Service Forest Avenue BID Listing"
[64]: https://www.forestavenuebid.com/our-businesses/bement-shoe-hospital "Bement Shoe Hospital Forest Avenue BID Listing"
[65]: https://hudsonsquarebid.org/business/charlton-cleaners/ "Charlton Cleaners Hudson Square BID Listing"
[66]: https://hudsonsquarebid.org/business/global-newsstand/ "Global Newsstand Hudson Square BID Listing"
[67]: https://hudsonsquarebid.org/business/cvs/ "CVS Hudson Square BID Listing"
[68]: https://sunsetparkbid.org/on-the-avenue/ "Sunset Park BID On the Avenue"
[69]: https://ridgewood-ny.com/business-directory/wpbdp_category/shopping/ "Myrtle Avenue BID Shopping Listings"
[70]: https://ridgewood-ny.com/business-directory/wpbdp_category/professional-services/ "Myrtle Avenue BID Professional Services Listings"
[71]: https://ridgewood-ny.com/business-directory/?wpbdp_view=all_listings "Myrtle Avenue BID All Listings"
[72]: https://www.portabellastores.com/pages/store-locator "Portabella Store Locator"
[73]: https://www.pitkinavenue.nyc/business-directory-1 "Pitkin Avenue BID Business Directory"
[74]: https://www.southernboulevard.org/grocery/ "Southern Boulevard Merchant Association Grocery Category"
[75]: https://www.parkfloralbx.com/ "Park Floral Company Customer Website"
[76]: https://loconsolo.com/ "Loconsolo Customer Website"
