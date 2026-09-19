# Houston Culinary and Food Directory Research

**Scope and result.** This research-only package covers **Houston, Texas, and clearly Houston-metro Stafford**. It researches exactly one Mapping with Melanin directory category: **culinary and food**. The verified file contains **31 physical destinations or community/regulated-review records** spanning cooking classes, culinary education, kitchen-equipment stores, specialty and diaspora food markets, farmers markets, farmer education, and shared commercial kitchens. It does not infer ownership, demographic identity, language, cost, hours, availability, access, quality, safety, licensing, or service claims where the sources do not explicitly establish them.

Every candidate has an opened official customer-facing destination or official program/service page. Physical-business records have a source-supported numbered address; no coordinates were collected. The local visitor bureau was opened as a public business-directory source for the cooking-class records it names; official destinations were also opened for those included records. Explicit cultural/organizational designations are copied only when an opened official page literally supports them; absence of a designation is recorded as `null`, not inferred from a business name, neighborhood, images, product brands, or source category.

## Files and counts

| File | Count | Purpose |
|---|---:|---|
| `candidates-culinary-food.jsonl` | 31 | Verified, distinct culinary and food discovery candidates. |
| `held-culinary-food.jsonl` | 8 | Leads withheld for missing or unverified current official destination, incomplete address, or source-only support. |

## Candidate coverage

The file includes **nine cooking, culinary-education, kitchen-equipment, and social-food options**: The Cookery Houston; Central Market Houston; two distinct Sur La Table stores; Houston City College Culinary Arts; Culinary Institute LENOTRE; Cooking With A Twist in Houston-metro Stafford; Williams Sonoma Highland Village; and the JCC’s Cramer-Jacobs Family Culinary Studio. The external public directory, Visit Houston, names Central Market, Culinary Institute LENOTRE, and Sur La Table within its cooking-class guide, and each of their current official destinations was opened. The remaining entries rely on opened official pages that identify their programs and numbered destinations. [1] [2] [3] [4] [5] [6] [7] [8] [9] [10] [11]

The food-shopping section contains **fourteen discrete locations**: two Phoenicia Specialty Foods markets, Houston Farmers Market, two Keemat Grocers stores, African Food Embassy, four Southwest Farmers Market stores, three Hong Kong Food Market stores, and H Mart Blalock. These are separate physical locations with separately stated street addresses and phone numbers on their official pages. Cultural focus is only carried forward when literal official wording supports it, for example African Food Embassy’s “African Food Market,” Southwest Farmers Market’s “African groceries,” H Mart’s “The Best of Asia in America,” Phoenicia’s international gourmet-food imports, and Houston Farmers Market’s stated Mexican culinary-traditions influence. [12] [13] [14] [15] [16] [17] [18] [19]

The community and food-enterprise section contains Plant It Forward, Urban Harvest Farmers Market, CBG Shared Kitchen, two Houston Wingman Kitchens facilities, LIT Commercial Kitchen, PREP Houston, and Shared Commercial Kitchen. Plant It Forward’s official site describes farmer training rooted in refugee-farmer experience and supporting the next generation from underrepresented communities. The shared kitchen records are routed to `regulated_review` because the source describes commercial kitchen facilities and, in selected cases, makes certification/approval claims. Those claims are attributed in `regulatedProfession`; independent permit verification was not conducted. The City of Houston Food Safety and Inspection Program page was opened to document that city specialized food inspection includes commercial kitchens and commissaries, but it was not used as an individual-provider license verification. [20] [21] [22] [23] [24] [25] [26] [27]

## Within-category dedupe checks

| Group | Records compared | Check | Result |
|---|---|---|---|
| Cooking classes and culinary education | The Cookery; Central Market; Sur La Table River Oaks; Sur La Table CityCentre; HCC; LENOTRE; Cooking With A Twist; Williams Sonoma; JCC Culinary Studio | Normalized organization/site names, service type, and street address. | No duplicate records. The two Sur La Table records are distinct official locations with distinct addresses; Central Market is a grocery/school hybrid, while the others have separate operators or campuses. |
| International, diaspora, and specialty grocery | Phoenicia Downtown/Westheimer; Keemat Hillcroft/FM 1960; African Food Embassy; Southwest locations; Hong Kong Food Market locations; H Mart | Normalized location name plus street address and official store locator detail. | No duplicated location records. Same-brand entries are retained only when the official source lists a separate numbered street address and phone. |
| Farmers markets and farmer education | Houston Farmers Market; Urban Harvest Farmers Market; Plant It Forward | Operator, address, and primary function. | No duplicate. The first is a market complex, the second a recurring vendor market program, and the third a farmer-education/food-hub organization. |
| Shared commercial kitchens | CBG; Wingman Aldine; Wingman Pinemont; LIT; PREP; Shared Commercial Kitchen | Facility/operator and street address. | No duplicate. The two Wingman entries are separate official Houston facilities. |

A duplicate-risk check also excluded the Hong Kong Food Market Bellaire lead from candidates because the opened official page lacks a numbered street address. It is preserved in held rather than supplemented with an inferred street address. The shopper-facing businesses are recorded as individual physical locations, rather than being collapsed at brand level, because a record represents a discoverable destination and the official pages establish separate locations.

## Opened sources and URLs

The following pages were opened and read; search snippets were not used as final evidence.

1. Visit Houston, Cooking Classes — https://www.visithoustontexas.com/restaurants-and-bars/cultural-fare/cooking-classes/
2. The Cookery Houston — https://www.thecookeryhouston.com/
3. Central Market Houston location — https://www.centralmarket.com/locations/houston
4. Central Market Cooking School — https://www.centralmarket.com/cooking-school
5. Sur La Table River Oaks — https://www.surlatable.com/locations/tx/houston/store-14.html
6. Sur La Table CityCentre — https://www.surlatable.com/locations/tx/houston/store-89.html
7. Houston City College Culinary Arts — https://www.hccs.edu/programs--courses/explore-all-programs/culinary-arts/
8. Houston City College Central Campus — https://www.hccs.edu/about-us/campus-locations/central-campus/
9. Culinary Institute LENOTRE — https://culinaryinstitute.edu/
10. Cooking With A Twist — https://cookingwithatwisthouston.com/
11. Williams Sonoma Highland Village — https://www.williams-sonoma.com/stores/us-tx-houston-highland-village/
12. Evelyn Rubenstein JCC Culinary — https://www.erjcchouston.org/arts-culture/culinary/
13. Evelyn Rubenstein JCC Contact — https://www.erjcchouston.org/contact-us/
14. Phoenicia Downtown Market — https://phoeniciafoods.com/locations/downtown-market/
15. Phoenicia Westheimer Market — https://phoeniciafoods.com/locations/westheimer-market/
16. Houston Farmers Market — https://thehoustonfarmersmarket.com/
17. Houston Farmers Market FAQ — https://thehoustonfarmersmarket.com/market-faqs/
18. Urban Harvest Farmers Market — https://www.urbanharvest.org/urban-harvest-farmers-market/
19. Plant It Forward — https://www.plantitforward.farm/
20. Keemat Grocers — https://www.keematgrocers.com/
21. African Food Embassy — https://www.africanfoodembassy.com/
22. Southwest Farmers Market — https://www.southwestfarmersmarket.com/
23. Hong Kong Food Market, Store Info — https://www.shophongkongmarket.com/store-info/
24. H Mart Houston Blalock — https://www.hmart.com/store/houston-blalock-tx-77055/901e825a-261f-4a52-a8a8-281b4e82abe7
25. CBG Shared Kitchen — https://cbgsharedkitchen.com/
26. CBG Shared Kitchen Contact — https://cbgsharedkitchen.com/contact-2/
27. Wingman Kitchens — https://www.wingmankitchens.com/
28. LIT Commercial Kitchen — https://www.litcommercialkitchen.com/
29. PREP Houston — https://prepkitchens.com/houston/
30. Shared Commercial Kitchen — https://sharecommercialkitchen.com/
31. City of Houston Food Safety and Inspection Program — https://www.houstontx.gov/health/Food/
32. La Michoacana Supermarket — https://www.lamichoacana-supermarket.com/
33. Feed the Soul Foundation — https://feedthesoulfou.org/

## Held-record rationale and limitations

Eight leads were intentionally held. La Michoacana Supermarket has official text about its Houston origin and Mexican-family/Hispanic-community context, but the opened official page displayed Oklahoma City branches and did not verify a current numbered Houston customer destination. Main Course Cooking School appeared in the opened Visit Houston guide, but an attempted official destination could not be resolved. RecipeHouse, Well Done Cooking Classes, Sylvia’s Enchilada Kitchen cooking classes, and UrbanCHEF were similarly supported by the public directory but lacked an opened official customer-facing destination/address in this pass. Feed the Soul Foundation’s opened official page supports a national culinary-entrepreneur nonprofit and shows Houston events, but no fixed local destination was verified. Hong Kong Food Market Bellaire is held because its official page names a city mall but no numbered street address.

Source pages present time-sensitive details, particularly classes, market locations, operating hours, and food-business access. They should be rechecked directly before use. No claim is made here about an establishment’s current schedule, price, accessibility, language availability, safety, quality, independent licensure, product availability, or eligibility. `regulated_review` records preserve only source-attributed facility claims and explicitly note that independent permit status was not checked. No coordinates were collected or included.

## Research-only operational statement

**This was research only. No production database or API write, publication, map pin, geocode, deployment, native build, authentication, user, session, waitlist, or payment change occurred.**

## References

[1]: https://www.visithoustontexas.com/restaurants-and-bars/cultural-fare/cooking-classes/ "Visit Houston — Cooking Classes"
[2]: https://www.thecookeryhouston.com/ "The Cookery Houston"
[3]: https://www.centralmarket.com/locations/houston "Central Market Houston"
[4]: https://www.surlatable.com/locations/tx/houston/store-14.html "Sur La Table River Oaks"
[5]: https://www.surlatable.com/locations/tx/houston/store-89.html "Sur La Table CityCentre"
[6]: https://www.hccs.edu/programs--courses/explore-all-programs/culinary-arts/ "Houston City College Culinary Arts"
[7]: https://www.hccs.edu/about-us/campus-locations/central-campus/ "Houston City College Central Campus"
[8]: https://culinaryinstitute.edu/ "Culinary Institute LENOTRE"
[9]: https://cookingwithatwisthouston.com/ "Cooking With A Twist"
[10]: https://www.williams-sonoma.com/stores/us-tx-houston-highland-village/ "Williams Sonoma Highland Village"
[11]: https://www.erjcchouston.org/arts-culture/culinary/ "Evelyn Rubenstein JCC Culinary"
[12]: https://phoeniciafoods.com/locations/downtown-market/ "Phoenicia Downtown"
[13]: https://phoeniciafoods.com/locations/westheimer-market/ "Phoenicia Westheimer"
[14]: https://thehoustonfarmersmarket.com/ "Houston Farmers Market"
[15]: https://thehoustonfarmersmarket.com/market-faqs/ "Houston Farmers Market FAQ"
[16]: https://www.urbanharvest.org/urban-harvest-farmers-market/ "Urban Harvest Farmers Market"
[17]: https://www.plantitforward.farm/ "Plant It Forward"
[18]: https://www.keematgrocers.com/ "Keemat Grocers"
[19]: https://www.africanfoodembassy.com/ "African Food Embassy"
[20]: https://www.southwestfarmersmarket.com/ "Southwest Farmers Market"
[21]: https://www.shophongkongmarket.com/store-info/ "Hong Kong Food Market"
[22]: https://www.hmart.com/store/houston-blalock-tx-77055/901e825a-261f-4a52-a8a8-281b4e82abe7 "H Mart Houston Blalock"
[23]: https://cbgsharedkitchen.com/ "CBG Shared Kitchen"
[24]: https://www.wingmankitchens.com/ "Wingman Kitchens"
[25]: https://www.litcommercialkitchen.com/ "LIT Commercial Kitchen"
[26]: https://prepkitchens.com/houston/ "PREP Houston"
[27]: https://sharecommercialkitchen.com/ "Shared Commercial Kitchen"
