# New York City — Fifth-Depth Source Report

## Research boundary and result

This **review-only** package covers **only the five boroughs of New York City: Bronx, Brooklyn, Manhattan, Queens, and Staten Island**. It does not include any other New York locality. The research prioritized fresh public municipal-market, market-vendor, commercial-corridor, and chamber member-directory sources after reading the New York City high-yield, second-depth, third-depth, and fourth-depth reports and candidate files.

The result contains **8 accepted candidates** and **28 held leads**. The accepted set is intentionally limited to records for which the reviewed directory published a numbered physical address and an official customer website or clearly official business social profile was also opened. Two accepted records are routed to `regulated_review` because their published business activity concerns tobacco retail or alcohol service. The package makes no licensing claim.

No listing was published, geocoded, mapped, or written to a production system. Addresses are source-published text only, not coordinates.

## Source families and URLs reviewed

The following public source families were opened and read. Listing pages, not search-result snippets, were used for every retained or held row.

| Source family | URLs reviewed | Use and result |
|---|---|---|
| **NYC Public Markets / NYCEDC municipal market directory** | [Public Markets landing page](https://publicmarkets.nyc/); [La Marqueta](https://publicmarkets.nyc/la-marqueta); [Moore Street Market](https://publicmarkets.nyc/moore-street-market); [Arthur Avenue Market](https://publicmarkets.nyc/arthur-avenue-market); [Jamaica Farmers Market](https://publicmarkets.nyc/jamaica-farmers-market); [Certo Market](https://publicmarkets.nyc/certo-market) | The public municipal market pages supplied listing-level vendor, stall, and market-address evidence. La Marqueta, Moore Street Market, and Arthur Avenue Market produced the accepted candidates and most holds. Jamaica Farmers Market and Certo Market were reviewed for coverage only. |
| **Essex Market / Lower East Side Partnership vendor directory** | [Vendor index](https://www.essexmarket.nyc/vendors); [Viva Fruits & Vegetables](https://www.essexmarket.nyc/vendors/viva-fruits-vegetables); [Czar’s Grooming](https://www.essexmarket.nyc/vendors/czars-grooming); [Cuchifritos Gallery](https://www.essexmarket.nyc/vendors/cuchifritos-gallery); [Catalyst Records](https://www.essexmarket.nyc/vendors/catalyst-records-les); [Essex Olive & Spice](https://www.essexmarket.nyc/vendors/essex-olive-spice); [Luis Meat Market](https://www.essexmarket.nyc/vendors/luis-meats) | Individual public market profiles were read. All leads from this source family were held where the profile did not link an independently verified official business customer destination or where the linked organizational site did not substantiate the named entity. Catalyst Records’ official social profile was inspected as a screening check but was not retained in this deliberately small pass. |
| **Staten Island Chamber of Commerce Member Marketplace** | [Directory](https://statenisland.membermarketplaceinc.com/Members); [Advance Lock & Key](https://statenisland.membermarketplaceinc.com/Member/Advance-Lock-26-Key); [A&J Power Washing & Maintenance](https://statenisland.membermarketplaceinc.com/Member/A26J-Power-Washing-26-Maintenance); [A Very Special Place, Inc. (AVSP) & Harvest Cafe](https://statenisland.membermarketplaceinc.com/Member/A-Very-Special-Place-Harvest-Cafe); [3 Bites LLC](https://statenisland.membermarketplaceinc.com/Member/3Bitesllc) | The Chamber’s public member profiles supplied fresh Staten Island discovery. All four screened rows were held because either a numbered location, a separately verified official customer destination, or both were not established. A coordinate string exposed on the Advance Lock & Key source was intentionally omitted. |
| **New York City Hispanic Chamber of Commerce** | [NYC Hispanic Chamber](https://hispanicchamber.nyc/) | Reviewed as a citywide Hispanic-business source family. The readable page expressed its mission and member names but did not expose usable individual member profiles for row retention. |
| **Madison Avenue BID** | [Business directory](https://madisonavenuebid.org/directory/) | Reviewed as a Manhattan BID directory. The extracted directory exposed categories but not usable individual listing details. |
| **Grand Street BID** | [Business directory](https://www.grandstreetbk.org/business-directory) | Reviewed as a Brooklyn commercial-corridor directory. The page routes to an interactive map that did not expose usable individual listing records in readable extracted text. |

## Accepted records: listing evidence and official customer destination

Each row below has a public directory URL and an inspected official customer-facing website or official business social profile. Where an official business source supplied a social destination, it is preserved in the corresponding JSONL fields.

| Source row | Candidate | Borough / city field | Target kind | Listing source inspected | Official customer destination inspected | Evidence disposition |
|---:|---|---|---|---|---|---|
| 1 | Mama T | New York (Manhattan) | `physical_business` | [La Marqueta](https://publicmarkets.nyc/la-marqueta) | [Mama T](https://www.mamatnyc.com/) | Both sources place the cafe at La Marqueta / 1590 Park Avenue. |
| 2 | Black-Eyed Peas NYC | New York (Manhattan) | `physical_business` | [La Marqueta](https://publicmarkets.nyc/la-marqueta) | [official Instagram](https://www.instagram.com/blackeyedpeas.nyc/) | The municipal market directory identifies stalls 36–37; the linked profile identifies the business as Blackeyed Peas NYC vegan soul food. |
| 3 | Urban Garden Center | New York (Manhattan) | `physical_business` | [La Marqueta](https://publicmarkets.nyc/la-marqueta) | [official customer shop](https://urbangardennyc.com/) | The municipal directory identifies Lot 1 at La Marqueta and the official shop exposes customer product and service destinations. |
| 4 | Valuji Studio | Brooklyn | `physical_business` | [Moore Street Market](https://publicmarkets.nyc/moore-street-market) | [official customer shop](https://valujistudio.com/) | Both sources place the shop at Moore Street Market, 110 Moore Street. The official site’s Dominican-owned wording is preserved as attributed evidence only. |
| 5 | Martino Sisters Pasta, Gelato, Coffee | Brooklyn | `physical_business` | [Moore Street Market](https://publicmarkets.nyc/moore-street-market) | [official customer shop](https://www.martinosisters.com/) | The vendor page supplies stall 7; the official site supplies 108–110 Moore Street, Space 7, consistent with the market address. |
| 6 | Ital Emporium | Brooklyn | `physical_business` | [Moore Street Market](https://publicmarkets.nyc/moore-street-market) | [official Instagram](https://www.instagram.com/italemporium/) | The directory identifies stall 25; the linked profile identifies the NYC plant-based concept and names Moore Street Market. |
| 7 | La Casa Grande Cigars | Bronx | `regulated_review` | [Arthur Avenue Market](https://publicmarkets.nyc/arthur-avenue-market) | [official customer website](https://www.lcgcigars.com/) | Both sources identify the business at 2344 Arthur Avenue. It is routed for tobacco-retail review, not represented as licensed. |
| 8 | The Bronx Beer Hall | Bronx | `regulated_review` | [Arthur Avenue Market](https://publicmarkets.nyc/arthur-avenue-market) | [official customer website](https://www.thebronxbeerhall.com/) | Both sources identify the business inside Arthur Avenue Retail Market at 2344 Arthur Avenue. It is routed for alcohol-service review, not represented as licensed. |

## Held-record evidence ledger

Held leads remain in `held-candidates.jsonl` because the source did not establish a separate reliable official customer destination, a current physical location, or an unambiguous target-kind route. No hold is a claim that a business has closed.

| Source rows | Leads | Listing source inspected | Official/customer destination checked where available | Hold basis |
|---|---|---|---|---|
| 1–5 | Viva Fruits & Vegetables; Czar’s Grooming; Luis Meat Market; Essex Olive & Spice; Cuchifritos Gallery | [Essex Market individual profiles](https://www.essexmarket.nyc/vendors) | [Artists Alliance](https://www.artistsallianceinc.org/) for Cuchifritos; no separate official destinations exposed for the other listed vendors | The profiles publish a market address but either no separate official customer destination or an insufficiently entity-specific linked destination. |
| 6–11 | Cocotazo; Little Green Gourmets; Yesi’s Bookstore & Gift Shop; Will Love Designs; Maruka Café Galería; X-Square African Caribbean Foods | [La Marqueta](https://publicmarkets.nyc/la-marqueta) | [Cocotazo](https://www.cocotazocateringllc.com/); [Little Green Gourmets](https://www.littlegreengourmets.com/); [Yesi’s Instagram](https://www.instagram.com/yesi_sbookstoreandgiftshop/); [Will Love Designs Instagram](https://www.instagram.com/will.love/designsllc/); [Carmen Ayala page](http://www.7mujeresenmovimiento.com/carmen-ayala.html) | Cocotazo’s official address conflicts with the market listing context; Little Green Gourmets does not establish a physical customer location; social or linked destinations for the remaining leads were inaccessible, unverified, or missing. |
| 12–17 | Stuart Cinema & Café; Torie’s Treasures; YR Market Fresh Corp.; Latin America Unisex Barbershop; Jerez Tailor Shop; La Union Fruit & Grocery Inc. | [Moore Street Market](https://publicmarkets.nyc/moore-street-market) | [Stuart Cinema](https://www.stuartcinema.com/); [Torie’s Instagram](https://www.instagram.com/toriestreasures57/); [YR Market Fresh Instagram](https://www.instagram.com/yrmarketfreshcorp/) | Stuart’s official site publishes a different Queens location. Torie’s account does not reliably establish official business identity. YR’s social page was unavailable for inspection. The other directory entries lacked an official customer destination. |
| 18–24 | Boiano Foods; Café Nocciola; Felix’s Custom T-Shirts; Gene Bean’s Ice Cream; Mount Carmel Foods; O'Ccaffè; Peter’s Meat Market | [Arthur Avenue Market](https://publicmarkets.nyc/arthur-avenue-market) | The market page links social profiles for most; they were not separately verified in this pass | The market listing establishes market membership but the required official-customer destination identity was not fully substantiated. |
| 25–28 | Advance Lock & Key; A&J Power Washing & Maintenance; A Very Special Place, Inc. (AVSP) & Harvest Cafe; 3 Bites Sandwich Shop | [Staten Island Chamber member profiles](https://statenisland.membermarketplaceinc.com/Members) | Chamber outbound website links were not resolved to independently verified official customer destinations | Missing numbered address, missing verified official customer destination, or both. |

## Counts

**Source count:** 12 distinct public listing/profile source URLs contributed accepted or held rows, across **3 principal source families**. Three additional source families were reviewed for coverage but did not produce rows.

| Measure | Count |
|---|---:|
| Accepted candidates | 8 |
| Held leads | 28 |
| Candidate listing source URLs | 3 |
| Accepted `physical_business` | 6 |
| Accepted `regulated_review` | 2 |

| Accepted category | Count |
|---|---:|
| Food and drink | 5 |
| Home and garden | 1 |
| Retail | 2 |

| Accepted borough / city field | Count |
|---|---:|
| Bronx | 2 |
| Brooklyn | 3 |
| New York (Manhattan) | 3 |
| Queens | 0 |
| Staten Island | 0 |

## Duplicate checks and validation

Before emission, all raw candidate records in the four prescribed prior passes were compared: `new-york-city-high-yield/candidates.jsonl`, `new-york-city-second-depth/candidates.jsonl`, `new-york-city-third-depth/candidates.jsonl`, and `new-york-city-fourth-depth/candidates.jsonl`. The comparison normalized `name`, `city`, `state`, `country`, and `address` by case-folding and removing non-alphanumeric characters. It also screened normalized same-name plus city/state/country matches conservatively. **No exact composite collision and no uncertain same-name candidate collision was emitted.** The same checks were run internally against this output file.

Both JSONL files were then parsed line-by-line with `jq`. Validation confirmed every record contains exactly the prescribed 23 fields in the prescribed order, each `sourceRow` is a sequential integer beginning at 1 in its own file, values are JSON `null` when unknown rather than the string `"null"`, and no coordinate field is present. The candidate and held files contain no latitude, longitude, map-pin, or geocoding fields.

## Limitations

Public directory pages can change and a source-addressed market stall does not by itself establish continued availability, hours, pricing, accessibility, quality, or licensing. These are not asserted. Social destinations were used only where the inspected profile clearly identified the business. Leads without a sufficiently reliable official customer destination, a supported numbered address, current listing detail, or confident target-kind route were held rather than added as candidates. The reviewed fresh source families did not yield an eligible Queens or Staten Island candidate in this pass; no records were padded to achieve borough coverage.

## Research-only / no-publication statement

This is a **protected review package only and is not published**. No production database or API writes, deployments, app-code changes, geocoding, coordinates, map pins, account or authentication changes, password or session changes, waitlist, membership, payment, or contact with businesses occurred. These local files support later protected review only.

## References

[1]: https://publicmarkets.nyc/la-marqueta "NYC Public Markets: La Marqueta"
[2]: https://publicmarkets.nyc/moore-street-market "NYC Public Markets: Moore Street Market"
[3]: https://publicmarkets.nyc/arthur-avenue-market "NYC Public Markets: Arthur Avenue Market"
[4]: https://www.essexmarket.nyc/vendors "Essex Market: Vendors"
[5]: https://statenisland.membermarketplaceinc.com/Members "Staten Island Chamber of Commerce Member Marketplace: Directory"
[6]: https://www.mamatnyc.com/ "Mama T Official Website"
[7]: https://valujistudio.com/ "Valuji Studio Official Website"
[8]: https://www.martinosisters.com/ "Martino Sisters Official Website"
[9]: https://www.lcgcigars.com/ "La Casa Grande Cigars Official Website"
[10]: https://www.thebronxbeerhall.com/ "The Bronx Beer Hall Official Website"
[11]: https://hispanicchamber.nyc/ "New York City Hispanic Chamber of Commerce"
[12]: https://madisonavenuebid.org/directory/ "Madison Avenue BID Business Directory"
[13]: https://www.grandstreetbk.org/business-directory "Grand Street BID Business Directory"
