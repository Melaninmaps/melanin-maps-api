# Minneapolis–St. Paul Elevated Dining & Social: Research Report

**Category:** Minneapolis elevated dining and social
**Research date:** September 19, 2026
**Scope:** Minneapolis, Saint Paul, and clearly Minneapolis–St. Paul metro locations only

## Result

This research package contains **15 candidate records** and **3 held records**. Candidates are customer-facing physical dining or social venues. The selection emphasizes special-occasion dining, brunch, cocktails, nightlife, cultural dining, and social gathering places, while also retaining a small number of source-supported wellness or café venues that align with the stated discovery preference. That preference was used only to prioritize relevant business types and source leads; no additional identity, health, or financial facts were inferred.

All candidate entries have two evidence layers: a credible Black-owned or diaspora-related public listing and a customer-facing official destination. Meet Minneapolis explicitly frames its restaurant guide as a Black-owned restaurant guide and provides ownership or cultural context for several businesses. Visit Saint Paul explicitly frames its directory as a Black-owned-business list and provides physical-directory listings. Official business pages were then opened to verify current customer destinations and, where present, physical street addresses, contact details, offerings, and official social links. [1] [2]

## Search sources and URLs read

The following public pages were opened and read, rather than used only as search-result snippets:

| Source | URL | Use in this wave |
|---|---|---|
| Meet Minneapolis, **Popular Black-Owned Restaurants in Minneapolis** | https://www.minneapolis.org/food-drink/restaurants/black-owned/ | Primary Black-owned dining source for Minneapolis candidates, including Cobble, Pimento, Soul Bowl, Tamu, Trio, The Dripping Root, and The Camden Social. |
| Visit Saint Paul, **Black-Owned Businesses** | https://www.visitsaintpaul.com/things-to-do/shopping/black-owned-businesses/ | Primary Black-owned business source for Saint Paul candidates, including Afro Deli, Demera, Flava, La Fusion, Hyacinth, La Boulangerie Marguerite, MetroNOME, and West Indies Soul Food. |
| Center for Economic Inclusion, **Restaurant Directory** | https://www.centerforeconomicinclusion.org/2021-restaurant-directory | Cross-check source. Its directory says it lists Minneapolis–St. Paul metro restaurants owned by Black, Indigenous, Latine, and Asian business leaders and links to several leads. |
| Official business destinations | See candidate `website` fields | Current customer-facing verification of physical locations and source-supported offerings/social links. |

## Candidate coverage

The candidate file uses the required 23 fields in the required order. Every candidate has `targetKind: "physical_business"`; no addresses were geocoded and no coordinates were created. Every unknown value is JSON `null`, not the string `"null"`.

| Coverage area | Candidate count | Examples |
|---|---:|---|
| Minneapolis | 7 | Cobble Social House, The Camden Social, Pimento Jamaican Kitchen & Rum Bar, Soul Bowl, Tamu Grill, Trio Plant-Based, The Dripping Root |
| Saint Paul | 8 | Afro Deli, Demera Ethiopian Restaurant & Bar, Flava Café, La Fusion Café, Hyacinth, La Boulangerie Marguerite, MetroNOME Brewery, West Indies Soul Food |
| Dining, brunch, pastry, or café | 12 | The Camden Social, Soul Bowl, Tamu, Trio, Flava, La Fusion, Hyacinth, La Boulangerie Marguerite |
| Cocktails, beer, music, or nightlife-oriented social venues | 5 | Cobble Social House, The Camden Social, Pimento Jamaican Kitchen & Rum Bar, Demera Ethiopian Restaurant & Bar, MetroNOME Brewery |

## Dedupe and quality checks

A manual candidate-level dedupe review compared normalized venue name, city, official website/domain, and street address. It found **no duplicate candidate records**. Pimento appears once as the current official Minneapolis location. The separately discovered Visit Saint Paul listing for Pimento at 354 Wabasha St N was not promoted because the official Pimento location page read during this wave listed the Minneapolis location only; it is documented in held data rather than duplicated.

Source pages and official destinations were also checked for scope. All promoted records are in Minneapolis or Saint Paul. The record review did not infer ownership, quality, prices, operating status beyond what a source showed, accessibility, licensing, language, or any offering beyond source-supported terms. Social links appear only when an official business page directly linked them or when the official customer destination itself was that social page.

## Held leads and limitations

Three leads are retained in `held-dining-social.jsonl` rather than candidates. Lutunji’s Palate and Wendy’s House of Soul have credible Meet Minneapolis Black-owned-guide evidence, but their current numbered physical addresses were not verified from an official destination in this wave. The Saint Paul Pimento listing conflicts with the current official locations page; it remains held pending confirmation of current status. Held status is not a negative assessment of any business.

The public directory sources are editorial/visitor guides and can lag behind business moves, closures, or changes to contact details. Customer-facing websites and social pages can also change after research. The data is therefore suitable for research review, not a representation that any venue’s current hours, reservations, availability, price, accessibility, liquor status, or other time-sensitive condition has been guaranteed.

## Research-only statement

This work was **research only**. No production database, API, map pin, geocoding record, deployment, authentication configuration, user, session, payment, or waitlist record was changed.

## References

[1]: https://www.minneapolis.org/food-drink/restaurants/black-owned/ "Popular Black-Owned Restaurants in Minneapolis"
[2]: https://www.visitsaintpaul.com/things-to-do/shopping/black-owned-businesses/ "Black-Owned Businesses"
[3]: https://www.centerforeconomicinclusion.org/2021-restaurant-directory "Restaurant Directory"
[4]: https://cobblempls.com/ "Cobble Social House"
[5]: https://thecamdensocial.com/ "The Camden Social"
[6]: https://pimento.com/ "Pimento Jamaican Kitchen & Rum Bar"
[7]: https://soulbowlmn.com/ "Soul Bowl"
[8]: https://tamugrill.com/contact "Tamu Grill and Catering Contact"
[9]: https://www.instagram.com/trioplantbasedmn/ "Trio Plant-Based Instagram"
[10]: https://www.thedrippingrootjuicebar.com/ "The Dripping Root"
[11]: https://www.afrodeli.com/locations "Afro Deli Locations"
[12]: https://www.facebook.com/DemeraMN/ "Demera Ethiopian Restaurant & Bar Facebook"
[13]: https://www.flavacafe.org/ "Flava Café"
[14]: https://lafusioncafe.com/about-us/ "La Fusion Café About Us"
[15]: https://www.hyacinthstpaul.com/contact "Hyacinth Contact"
[16]: https://la-marg.com/ "La Boulangerie Marguerite"
[17]: https://metronomebrewery.com/ "MetroNOME Brewery"
[18]: https://www.westindiessoulfoods.com/about "West Indies Soul Food About"
