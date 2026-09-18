# Kansas City Metropolitan Area Source Report

**Scope and result.** This research-only source pass retained **16** non-duplicate candidates for the Kansas City metropolitan area in Missouri and Kansas. It favors a mixed everyday-life directory set: food and beverage, retail, fitness, civic resources, culture and heritage, and local media. Four records requiring more evidence are held separately. **Nothing in this wave was staged, published, deployed, or written to any external system.**

## Retained-record distribution

| Target kind | Count |
|---|---:|
| business | 7 |
| online_business | 0 |
| regulated_review | 0 |
| community_resource | 7 |
| cultural_place | 2 |
| manual_review | 0 |
| **Total** | **16** |

| Category | Count |
|---|---:|
| Community & Civic | 7 |
| Food & Beverage | 4 |
| Culture & Heritage | 2 |
| Retail | 1 |
| Fitness & Wellness | 1 |
| Media | 1 |
| **Total** | **16** |

## Source support and validation

Visit KC’s editorial guide directly identifies Ruby Jean’s Juicery, Blue Nile Café, Fannie’s African Cuisine, Urban Café, and Island Spice within its guide to Black-owned Kansas City businesses. Its separate KC Black Owned listing supplies the directory organization’s address and contact details. The official customer sites were opened for Ruby Jean’s, Blue Nile, Fannie’s, Island Spice, House of Gladitude, Bliss Books & Wine, The Beauté Factory, and Urban Café. The usable retained rows preserve only the published customer-facing destination and directly stated details; Urban Café lacks a published street address and is held. [1] [13] [14] [15] [16] [17] [18] [19] [20] [21]

The official KC Black Owned directory was opened at its landing page and in its beauty, retail, services, arts, fitness-and-wellness, nonprofit/church, and food sections. These public directory pages supplied the source basis for records designated by that publisher. Inclusion in a directory is not treated as a certification beyond the specific designation published there. The final retained set uses the directory basis for House of Gladitude, Bliss Books & Wine, KC Health Initiative, and Friendship Baptist Church, while maintaining the official customer or public-service site for each retained record. [2] [7] [8] [9] [10] [11] [23] [24] [29] [30] [31] [32]

The City of Kansas City, Missouri’s official outreach page supplied civic organization and local-media contacts. The official sites for the Hispanic Chamber, Black Chamber, Heartland Black Chamber, Urban League, Black Archives, Negro Leagues Baseball Museum, Mattie Rhodes Center, and Kansas City Hispanic News were opened to verify their public-facing destinations and only directly stated mission, exhibit, program, or contact information. The two history organizations are classified as cultural places; chambers and the Urban League are classified as community resources rather than commercial listings. [3] [4] [5] [6] [22] [25] [26] [28]

A normalized exact duplicate comparison used name + city + state + address against all pre-existing JSONL research beneath `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this Kansas City output directory. No exact matches were found. Every line in both JSONL files was parsed after writing. Retained physical businesses, community locations, and cultural places have numbered addresses. No coordinates, pins, or directions data were created. The final retained set has no mapless entries.

## Held records and limitations

Four source-inspected records are in `held-candidates.jsonl`: Urban Café lacks a numbered street address on its inspected official customer site; Mattie Rhodes Center has regulated behavioral-health content but the inspected official pages do not supply a street address or sufficient provider/licensing evidence; A Kid & A Kitchen lacks an explicit city and numbered street address on the inspected official site; and The Beauté Factory’s public shop does not directly establish a Kansas City locality. These records are not retained candidates.

This is a source-pass directory research artifact, not a certification, licensing review, ownership audit, availability check, or endorsement. Chamber or directory inclusion is a source basis for discovery but does not certify ownership of every member or listing. Operational claims, hours, pricing, accessibility, languages, clinical outcomes, and coordinates were not inferred. Some current source pages have sparse contact information or dated presentation; those limits are preserved through null fields or holds rather than filled by inference.

## Inspected URLs

The following public URLs were opened and inspected. The supporting role of each page is stated beside it.

1. [Visit KC — Support Black-Owned KC Businesses][1] — editorial source designating four retained restaurants and the held Urban Café as Black-owned.
2. [KC Black Owned Directory — home][2] — official directory landing page, category navigation, and official social destinations.
3. [City of Kansas City, Missouri — Minority and Women Organizations][3] — official outreach list; supplied contact/location context for chambers, Urban League, and Kansas City Hispanic News.
4. [Hispanic Chamber of Commerce of Greater Kansas City][4] — official mission, membership/directory destination, contact location, and socials.
5. [Black Chamber of Commerce of Greater Kansas City][5] — official chamber mission and member-facing destination.
6. [Heartland Black Chamber of Commerce][6] — official chamber mission, membership destination, and socials.
7. [KC Black Owned — Beauty][7] — source listing The Beauté Factory.
8. [KC Black Owned — Retail][8] — source listing Bliss Books & Wine.
9. [KC Black Owned — Services][9] — inspected for balanced candidate discovery; no retained record from this page.
10. [KC Black Owned — Arts][10] — inspected for cultural candidate discovery; no retained record from this page.
11. [KC Black Owned — Fitness & Wellness][11] — source listing House of Gladitude.
12. [Ruby Jean’s Juicery][12] — official shopping/customer site and Troost location.
13. [Blue Nile Cafe][13] — official dining site, address, phone, menu, and customer ordering information.
14. [Fannie’s African Cuisine][14] — official dining site, address, phone, and West African cuisine description.
15. [Urban Café][15] — official customer site; no published numbered address found.
16. [Island Spice][16] — official dining site, address, phone, and ordering information.
17. [House of Gladitude][17] — official yoga-studio site, address, phone, services, and socials.
18. [Bliss Books & Wine][18] — official bookstore/wine-bar site, address, phone, services, and socials.
19. [The Beauté Factory][19] — official online store and social destinations; locality was not directly established.
20. [Urban League of Greater Kansas City][20] — official community-program site, address, phone, and socials.
21. [Negro Leagues Baseball Museum][21] — official visitor site, museum mission, address, phone, ticket/visit destination, and socials.
22. [Mattie Rhodes Center][22] — official behavioral-health and community-program description; held for regulated-review insufficiency.
23. [KC Black Owned — Non-profits & Churches][23] — source listing for KC Health Initiative, Friendship Baptist Church, and A Kid & A Kitchen.
24. [KC Black Owned — Food][24] — inspected for balanced candidate discovery; no additional retained record from this page.
25. [Black Archives of Mid-America][25] — official exhibit, visitor, address, phone, and social information.
26. [Kansas City Hispanic News][26] — official publication page and Facebook destination.
27. [Visit KC — KC Black Owned listing][27] — tourism-directory listing that supplies KC Black Owned’s physical address and phone.
28. [Urban on Troost][28] — official customer destination for Urban Café; no street address found.
29. [Mattie Rhodes — Contact][29] — official contact page, inspected for location; none published.
30. [Friendship Baptist Church][30] — official worship, address, phone, and social information.
31. [A Kid & A Kitchen][31] — official youth culinary-program description and socials; no explicit city/address found.
32. [KC Health Initiative][32] — official community food/wellness education description and address.

## References

[1]: https://www.visitkc.com/support-black-owned-kc-businesses/ "Support Black-Owned KC Businesses"
[2]: https://www.kcblackowned.org/ "KC Black Owned Directory"
[3]: https://www.kcmo.gov/city-hall/departments/human-relations/minority-and-women-organizations "Minority and Women Organizations"
[4]: https://www.hccgkc.com/ "Hispanic Chamber of Commerce of Greater Kansas City"
[5]: https://bccgkc.org/ "Black Chamber of Commerce of Greater Kansas City"
[6]: https://heartlandblackchamber.com/ "Heartland Black Chamber of Commerce"
[7]: https://www.kcblackowned.org/beauty "KC Black Owned Directory: Beauty"
[8]: https://www.kcblackowned.org/retail "KC Black Owned Directory: Retail"
[9]: https://www.kcblackowned.org/services "KC Black Owned Directory: Services"
[10]: https://www.kcblackowned.org/arts "KC Black Owned Directory: Arts"
[11]: https://www.kcblackowned.org/fitness-wellness "KC Black Owned Directory: Fitness & Wellness"
[12]: https://www.rubyjeansjuicery.com/ "Ruby Jean’s Juicery"
[13]: https://www.bluenilekc.com/ "Blue Nile Cafe"
[14]: https://www.fanniescuisine.com/ "Fannie’s African Cuisine"
[15]: https://www.urbancafekc.com/ "Urban Café"
[16]: https://www.islandspicekc.com/ "Island Spice"
[17]: https://www.houseofgladitude.com/ "House of Gladitude"
[18]: http://www.blissbooksandwine.com/ "Bliss Books & Wine"
[19]: https://thebeautefactory.com/ "The Beauté Factory"
[20]: https://www.ulkc.org/ "Urban League of Greater Kansas City"
[21]: https://nlbm.com/ "Negro Leagues Baseball Museum"
[22]: https://www.mattierhodes.org/ "Mattie Rhodes Center"
[23]: https://www.kcblackowned.org/nonprofits "KC Black Owned Directory: Non-profits & Churches"
[24]: https://www.kcblackowned.org/food "KC Black Owned Directory: Food"
[25]: https://blackarchives.org/ "Black Archives of Mid-America"
[26]: https://kchispanicnews.com/ "Kansas City Hispanic News"
[27]: https://www.visitkc.com/listings/kc-black-owned/ "KC Black Owned"
[28]: https://urbanontroost.com/ "Urban on Troost"
[29]: https://mattierhodes.org/contact/ "Contact — Mattie Rhodes"
[30]: http://www.fbckcmo.org/ "Friendship Baptist Church"
[31]: https://www.akidandakitchen.org/ "A Kid & A Kitchen"
[32]: https://kchealthinitiative.org/ "KC Health Initiative"
