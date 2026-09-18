# St. Louis Metropolitan Area, MO/IL: Source Report

## Result

This **research-only** wave retains seven Maplewood, Missouri candidates from one official local-government directory wave: the City of Maplewood’s *Black-Owned Businesses* guide. Each retained record has the guide as its inclusion source and a separately inspected official website or official business social destination. The candidate rows do not assert ownership certification; their `Black-owned` designation is the City’s published directory classification. One health-adjacent listing is explicitly routed as `regulated_review` rather than an ordinary business listing.

No records were staged, published, imported, or written to any repository, application, database, public API, account, waitlist, deployment, or external service. The three files in this output directory are local research artifacts only.

## Counts

| Dimension | Count |
|---|---:|
| Verified retained candidates | 7 |
| Held candidates | 0 |
| Inspected public URLs | 12 |
| `business` | 6 |
| `regulated_review` | 1 |

| Category | Count |
|---|---:|
| Beauty & Personal Care | 2 |
| Food & Beverage | 2 |
| Fitness & Recreation | 1 |
| Retail | 1 |
| Shopping | 1 |

## Directory basis and customer destinations

The City of Maplewood guide directly classifies the included establishments within its Black-owned-businesses page and supplies a numbered Maplewood street address for each retained physical listing. It also links to each relevant official website or official social account. The linked customer destinations were opened to confirm that each is a public-facing destination for the named business. The retained set deliberately spans food, beauty retail and services, fitness, retail, and vintage shopping rather than concentrating only on restaurants. [1]

Sistalove by Kimmie’s official storefront displays shopping categories for hair, lashes, and accessories. Blissfully Popped Popcorn’s official site identifies its Maplewood address and contact details. Sugar Fix 101’s official Facebook page identifies it as a bakery and has a recent post naming its Manchester location. Saint Louis Boxing Club’s official site describes boxing, kickboxing, and personal-training offerings. [2] [3] [4] [5]

Nail Doctor Unblemished is classified as `regulated_review` because its official site markets services connected to foot and skin conditions. The site says services are performed by a certified medical pedicurist and licensed esthetician. Those business-stated credentials are preserved as source text only and were not independently validated. Cheryl’s Herbs operates a public online shop and lists the Maplewood address in its contact section. Vintage Gold’s Facebook page identifies the business as a vintage store and displays its Maplewood address. [6] [7] [8]

## Duplicate check

A feasible exact duplicate check was completed before writing candidates. The check scanned all pre-existing JSONL files under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this output directory, using normalized **name + city + state + address**. No retained candidate matched an existing row under that four-part comparison.

## Inspected sources

| # | Inspected URL | What inspection supported |
|---:|---|---|
| 1 | `https://www.maplewoodmo.gov/enjoy_maplewood/black-owned_businesses.php` | Retained-wave source: City of Maplewood’s Black-Owned Businesses guide; it supplied the seven names, Black-owned directory context, numbered addresses, contacts/links where shown, and service descriptions. |
| 2 | `https://www.sistalovebykimmie.com/` | Official customer storefront for Sistalove by Kimmie, including hair, lash, and accessory shopping. |
| 3 | `https://www.blissfullypopped.com/` | Official customer site for Blissfully Popped Popcorn, including Maplewood address and contact details. |
| 4 | `https://facebook.com/SweetToothBakeryStl/` | Official Sugar Fix 101 Facebook destination; it identifies the business as a bakery and includes a recent post with the Manchester location. |
| 5 | `http://www.saintlouisboxingclub.com/` | Official customer site describing the studio’s boxing, kickboxing, and personal-training offerings. |
| 6 | `http://www.naildoctor.net/` | Official booking/customer site for Nail Doctor Unblemished; it supplies address, contact information, services, and business-stated credentials. |
| 7 | `http://www.cherylsherbs.com/` | Official customer storefront for Cheryl’s Herbs, including shop categories and address. |
| 8 | `https://www.facebook.com/profile.php?id=100063898009518` | Official Vintage Gold Facebook destination; it identifies a vintage-store page and gives the Maplewood address. |
| 9 | `https://www.hbcstl.com/` | Heartland St. Louis Black Chamber homepage inspected to establish the organization’s stated Black-business mission; it was not used as a candidate-row source. |
| 10 | `https://www.hbcstl.com/directory` | Chamber member-directory page inspected for additional discovery. Listings were not retained from this page because individual physical-address and official-destination support was not established in this wave. |
| 11 | `https://business.hccstl.com/` | Hispanic Chamber directory host inspected; its public module was in development mode and did not furnish usable member details for this wave. |
| 12 | `https://business.hccstl.com/list` | Hispanic Chamber directory listing endpoint inspected; its extracted content did not furnish usable member details for this wave. |

## Limitations

This is a small, source-bounded wave focused on the City of Maplewood’s published Black-owned-businesses guide, which is within the St. Louis metropolitan area but does not represent the entire MO/IL region. A directory listing is a basis for research inclusion, not a current-operational-status check or ownership certification. Customer-facing sites and social pages were inspected to verify that a destination was public, but no claims about current hours, prices, inventory, accessibility, language capability, availability, licensing validity, health outcomes, coordinates, or directions are made. The Chamber pages were inspected for discovery, but lack of sufficiently extractable individual details meant they did not add records in this source pass.

## References

[1]: https://www.maplewoodmo.gov/enjoy_maplewood/black-owned_businesses.php "City of Maplewood: Black-Owned Businesses"
[2]: https://www.sistalovebykimmie.com/ "Sistalove by Kimmie"
[3]: https://www.blissfullypopped.com/ "Blissfully Popped Popcorn"
[4]: https://www.facebook.com/SweetToothBakeryStl/ "Sugar Fix 101 Facebook page"
[5]: http://www.saintlouisboxingclub.com/ "Saint Louis Boxing Club"
[6]: http://www.naildoctor.net/ "Nail Doctor Unblemished"
[7]: https://cherylsherbs.com/ "Cheryl's Herbs"
[8]: https://www.facebook.com/profile.php?id=100063898009518 "Vintage Gold Facebook page"
[9]: https://www.hbcstl.com/ "Heartland St. Louis Black Chamber of Commerce"
[10]: https://www.hbcstl.com/directory "Heartland St. Louis Black Chamber Directory"
[11]: https://business.hccstl.com/ "Hispanic Chamber of Commerce of Metropolitan St. Louis Directory Host"
[12]: https://business.hccstl.com/list "Hispanic Chamber of Commerce of Metropolitan St. Louis Directory Listing"
