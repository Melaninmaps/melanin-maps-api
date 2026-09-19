# New Jersey Fifth-Depth — Source Report

## Research boundary and disposition

This **review-only** package covers **New Jersey only**. It prioritizes newly opened public municipal, business-improvement-district (BID), downtown/corridor, and Black-chamber directory sources. It preserves public listing facts and information directly read from official customer destinations. It contains **13 accepted candidates** and **2 held leads**. It is **not published** and has not been written to a production database, geocoded, converted into map pins, or used to alter an application, deployment, account, session, authentication, membership, waitlist, payment, or password.

A candidate labeled `physical_business` has a numbered New Jersey street address on its listing-level source and an inspected official customer website or clearly official customer social destination. `community_resource` is used only where the public source expressly identifies an organization as a not-for-profit. The package does not infer ownership, demographic identity, culture, language, licensing, price, hours, safety, quality, availability, accessibility, or operating status. Placement in a Black-chamber directory is not ownership or identity evidence.

## Source-family ledger

Five source families were reviewed. Four were **new source families for this pass**: Downtown Toms River, Montclair Center BID, the Borough of Merchantville, and the Borough of Fanwood. The African American Chamber directory was re-opened as a supplemental priority source family and yielded a new, non-colliding member profile. Two additional municipal/directory resources were opened but did not yield records under the retention rules.

| Source family | Source type | URLs reviewed | Accepted / held outcome |
|---|---|---:|---|
| Downtown Toms River Business Directory | Downtown/corridor organization directory | 19 | 7 accepted; 1 held |
| Montclair Center BID Business Directory | BID directory | 6 | 2 accepted |
| Borough of Merchantville Business Directory | Municipal directory | 4 | 1 accepted; 1 held |
| Borough of Fanwood Business Directory | Municipal directory | 4 | 3 accepted |
| African American Chamber Active Member Directory | Black chamber member directory | 8 | 1 accepted |
| Supplemental discovery/assessment pages | Municipal/directory discovery | 4 | No output record |
| **Total** |  | **45 unique URLs** | **13 accepted; 2 held** |

## Accepted-record evidence ledger

Each source URL below is a public listing-level profile or public municipal/BID directory page. Each destination was opened and inspected before acceptance.

| Row | Record and target kind | Listing source | Official customer destination | Evidence summary |
|---:|---|---|---|---|
| 1 | First Date Coffee Shop — `physical_business` | [Downtown profile][8] | [Official site][9] | Both identify First Date Coffee Shop at 11 Washington Street, Suite C, Toms River. |
| 2 | Spire Coffeehouse — `physical_business` | [Downtown profile][10] | [Official site][11] | The source lists 53 Main Street; the official site lists that Toms River location. |
| 3 | K’s Catnip Corner Cat Lounge — `community_resource` | [Downtown profile][12] | [Official site][13] | The source supplies 40 Main Street, Suite 101 and explicitly says it is part of a registered 501(c)(3). |
| 4 | Ellie’s Indian Curry Corner — `physical_business` | [Downtown profile][16] | [Official site][17] | Both identify 73 Main Street, Suite 4, Toms River. |
| 5 | Oi Sushi — `physical_business` | [Downtown profile][18] | [Official site][19] | The source and official ordering site identify 10 Washington Street, Toms River. |
| 6 | Art is Bond — `physical_business` | [BID profile][24] | [Official site][25] | BID profile supplies 8 Lackawanna Plaza; official site confirms identity and customer social destinations. |
| 7 | Ahava Felicidad Hair and Body — `physical_business` | [BID profile][22] | [Official site][23] | BID profile provides the 4 Midland Avenue address, phone, destination, and services; official site identifies the business. |
| 8 | DaVilla’s Creamery and Cookies — `physical_business` | [Municipal directory][26] | [Official site][27] | Municipal directory and official site identify 21 S Centre Street, Merchantville. |
| 9 | Enchantments — `physical_business` | [Municipal directory][30] | [Official site][31] | Both identify 234 South Avenue, Fanwood. |
| 10 | Houdini Pizza Lab — `physical_business` | [Municipal directory][30] | [Official site][33] | Both identify 25 South Avenue, Fanwood. |
| 11 | DJs For You — `physical_business` | [Chamber profile][38] | [Official site][39] | Chamber profile supplies 522 Society Hill Boulevard, Cherry Hill; official site confirms identity and services. |
| 12 | A Thyme For All Seasons — `physical_business` | [Downtown profile][14] | [Official site][15] | Source provides 63 Main Street and official destination; no conflicting location was observed. |
| 13 | Rocko’s Ice Cream — `physical_business` | [Municipal directory][30] | [Official site][32] | Municipal directory provides 38 South Martine Avenue; official site identifies the ice-cream business without a conflicting location. |

## Held-lead evidence ledger

Held leads are reviewer signals. A failed readable extraction, a source-address gap, or other evidence limitation is **not** a claim that the organization has closed or is inactive.

| Row | Lead and proposed route | Listing source | Official customer destination | Hold reason |
|---:|---|---|---|---|
| 1 | Netty’s Sweets — `manual_review` | [Downtown profile][6] | [Official site attempted][7] | The source profile supplies a detailed address, phone, and official domain. The domain returned no readable public extraction during inspection, so official-customer-destination support was insufficient for acceptance. |
| 2 | Rasta Kitchen — `manual_review` | [Municipal directory][26] | [Official site][29] | The municipal listing identifies Caribbean Cuisine but has no numbered address. The official site supplies 618 W Maple Ave, Merchantville, but the listing-level source does not meet the source-address predicate for `physical_business`. |

## Counts

| Dimension | Accepted | Held | Total |
|---|---:|---:|---:|
| Records | 13 | 2 | 15 |
| `physical_business` | 12 | 0 | 12 |
| `community_resource` | 1 | 0 | 1 |
| `manual_review` | 0 | 2 | 2 |

| Category | Accepted | Held |
|---|---:|---:|
| arts_culture | 1 | 0 |
| arts_entertainment | 1 | 0 |
| community_services | 1 | 0 |
| food_beverage | 8 | 2 |
| personal_care | 1 | 0 |
| retail | 1 | 0 |

## Duplicate checks

Before final emission, all four prior New Jersey passes were parsed: `new-jersey-high-yield`, `new-jersey-second-depth`, `new-jersey-third-depth`, and `new-jersey-fourth-depth`. Their `candidates.jsonl` files were treated as the required baseline, and their held files were also screened conservatively. The comparison normalized Unicode, case, punctuation, whitespace, and diacritics across **name + city + state + country + address**. A second screen compared normalized **name + city + state + country**, so uncertain same-name/locality matches could not be silently added. The same checks ran within this candidate file, within the held file, and across the two outputs. **No emitted candidate or held lead collides with the prior four-pass raw candidates or with another emitted record.**

## URLs reviewed without emitted record

The following pages were opened for source-family assessment, category discovery, or leads that were not emitted. They are included to make the research boundary auditable.

| Source family / purpose | URLs reviewed | Outcome |
|---|---|---|
| Downtown Toms River directory | [Directory root][1]; [Food Stores][2]; [Coffeehouse][3]; [Retail][4]; [Restaurants][5] | Source family and category pages read. |
| Montclair Center BID | [Directory root][20]; [Ama Professional African Hair profile][21] | BID structure and a profile without a verified official customer destination were assessed; no record emitted. |
| Merchantville municipal directory | [Brotherly Love Creations official site][28] | Official site was opened but extraction was dominated by consent content; no record emitted. |
| African American Chamber | [Directory root][34]; [Food & Beverages][35]; [Specialty Retail][36]; [Arts, Culture & Entertainment][37]; [Non-Profit][40]; [Business & Professional Services][41] | Categories and member profiles assessed; no other New Jersey record met the inclusion rule. |
| Other municipal / directory assessment | [Union Township directory][42]; [Support Latino Business directory][43]; [Morris Plains announcement][44]; [NJ Chamber directory][45] | Assessed; no individually source-supported record was emitted. |

## Limitations and non-publication statement

Directory information can change, and this package does not represent an operating-status confirmation. Where an official customer page did not repeat a listing address, the address is retained only because the listing-level public directory supplied it and no conflict was observed. The output contains no coordinates, latitude, longitude, map pins, or geocoding. It remains a **protected, review-only research package and is not published**.

## References

[1]: https://downtowntomsriver.com/downtown-toms-river-business-directory/ "Downtown Toms River Business Directory"
[2]: https://downtowntomsriver.com/downtown-toms-river-business-directory/wpbdp_category/food-stores/ "Downtown Toms River Food Stores"
[3]: https://downtowntomsriver.com/downtown-toms-river-business-directory/wpbdp_category/coffeehouse/ "Downtown Toms River Coffeehouse"
[4]: https://downtowntomsriver.com/downtown-toms-river-business-directory/wpbdp_category/retail/ "Downtown Toms River Retail"
[5]: https://downtowntomsriver.com/downtown-toms-river-business-directory/wpbdp_category/restaurants/ "Downtown Toms River Restaurants"
[6]: https://downtowntomsriver.com/downtown-toms-river-business-directory/32784/nettys-sweets/ "Netty’s Sweets — Downtown Toms River Profile"
[7]: https://nettyssweetsnj.com/ "Netty’s Sweets Official Customer Website"
[8]: https://downtowntomsriver.com/downtown-toms-river-business-directory/14332/first-date-coffee-shop/ "First Date Coffee Shop — Downtown Toms River Profile"
[9]: https://www.firstdatecoffeeshops.com/ "First Date Coffee Shop Official Customer Website"
[10]: https://downtowntomsriver.com/downtown-toms-river-business-directory/33735/spire-coffeehouse/ "Spire Coffeehouse — Downtown Toms River Profile"
[11]: https://www.spirecoffeehouse.com/ "Spire Coffeehouse Official Customer Website"
[12]: https://downtowntomsriver.com/downtown-toms-river-business-directory/33254/ks-catnip-corner-cat-lounge/ "K’s Catnip Corner Cat Lounge — Downtown Toms River Profile"
[13]: https://kscatnipcorner.com/ "K’s Catnip Corner Cat Lounge Official Customer Website"
[14]: https://downtowntomsriver.com/downtown-toms-river-business-directory/1065/a-thyme-for-all-seasons/ "A Thyme For All Seasons — Downtown Toms River Profile"
[15]: https://athymeforallseasons.com/ "A Thyme For All Seasons Official Customer Website"
[16]: https://downtowntomsriver.com/downtown-toms-river-business-directory/55225/ellies-indian-curry-corner/ "Ellie’s Indian Curry Corner — Downtown Toms River Profile"
[17]: https://elliesindiancurrycorner.com/ "Ellie’s Indian Curry Corner Official Customer Website"
[18]: https://downtowntomsriver.com/downtown-toms-river-business-directory/7383/safu-sushi/ "Oi Sushi — Downtown Toms River Profile"
[19]: https://www.oisushidtr.com/ "Oi Sushi Official Customer Website"
[20]: https://montclaircenter.com/directory-bid/ "Montclair Center BID Business Directory"
[21]: https://montclaircenter.com/directory-bid/listing/ama-professional-african-hair/ "Ama Professional African Hair — Montclair Center BID Profile"
[22]: https://montclaircenter.com/directory-bid/listing/ahava-felicidad-hair-and-body/ "Ahava Felicidad Hair and Body — Montclair Center BID Profile"
[23]: https://ahavafelicidad.wordpress.com/ "Ahava Felicidad Hair and Body Official Customer Website"
[24]: https://montclaircenter.com/directory-bid/listing/art-is-bond/ "Art is Bond — Montclair Center BID Profile"
[25]: https://artisbond.com/ "Art is Bond Official Customer Website"
[26]: https://merchantvillenj.gov/community/business_directory.php "Borough of Merchantville Business Directory"
[27]: https://davillascremeandcookie.com/ "DaVilla’s Creamery and Cookies Official Customer Website"
[28]: https://www.brotherlylovecreations.com/ "Brotherly Love Creations Official Customer Website"
[29]: https://rastakitchenmerchantville.com/ "Rasta Kitchen Official Customer Website"
[30]: https://fanwoodnj.org/discover-fanwood/business-directory/ "Borough of Fanwood Business Directory"
[31]: http://www.enchantmentsnj.com/ "Enchantments Official Customer Website"
[32]: https://rockosicecream.com/ "Rocko’s Ice Cream Official Customer Website"
[33]: http://houdinipizzalab.net/ "Houdini Pizza Lab Official Customer Website"
[34]: https://membership.aachamber.com/list "African American Chamber of Commerce Active Member Directory"
[35]: https://membership.aachamber.com/list/Search/restaurants-food-beverages-792064 "African American Chamber Restaurants, Food & Beverages"
[36]: https://membership.aachamber.com/list/Search/shopping-specialty-retail-792059 "African American Chamber Shopping & Specialty Retail"
[37]: https://membership.aachamber.com/list/Search/arts-culture-entertainment-792069 "African American Chamber Arts, Culture & Entertainment"
[38]: https://membership.aachamber.com/list/Details/djs-for-you-4884816 "DJs For You — African American Chamber Member Profile"
[39]: https://djs4you.com/ "DJs For You Official Customer Website"
[40]: https://membership.aachamber.com/list/Search/non-profit-792052 "African American Chamber Non-Profit"
[41]: https://membership.aachamber.com/list/Search/business-professional-services-792025 "African American Chamber Business & Professional Services"
[42]: https://www.uniontownship.com/287/Business-Directory "Union Township Business Directory"
[43]: https://supportlatino.biz/shop-and-find-businesses/ "Support Latino Business Directory"
[44]: https://www.downtownmorrisplains.org/post/introducing-the-morris-plains-business-directory "Downtown Morris Plains Business Directory Announcement"
[45]: https://njccdirectory.com/ "NJ Chamber Business Directory"
