# Boston and nearby Greater Boston: research-only directory source pass

## Result

This pass retains **15 source-backed records** in Boston and clearly supported nearby Greater Boston communities. The retained set is deliberately mixed across food, retail, hair and beauty, recreation, family/youth services, community resources, and cultural places. It also retains one explicitly no-storefront bakery as `online_business`. Eight records are held rather than mapped because a source conflict, unreliable/absent physical address, destination issue, or locality/identity shift prevents responsible promotion.

**Research-only boundary.** This work is a source-verification pass only. It does not publish a directory, create map pins, derive coordinates, provide directions, make operational or licensing determinations, or take any account, payment, deployment, or user action. Commercial businesses and the online business are distinct from `community_resource` and `cultural_place` records; the latter are not treated as commercial map pins.

## Evidence basis and retention decisions

Black Owned Bos. says that its public directory connects people with Black-owned businesses across Massachusetts and describes discovery throughout Greater Boston.[1] Its individual listings were therefore used as public directory discovery evidence, while each retained commercial candidate also had a customer-facing official website inspected. The Boston Black Business Directory states that it serves as a guide to patronize Black businesses in Greater Boston.[2] The City of Boston and local cultural-destination sources were used for municipal and cultural-resource discovery where indicated.

| Disposition | Source rows | Evidence retained or reason held |
|---|---:|---|
| Retained commercial businesses | boston-001 through boston-005, boston-007 | Each has a named category, a public source URL, an official customer-facing website, and a non-conflicting numbered address. |
| Retained regulated-review service | boston-006 | Styllistik has source, official-site, and address evidence. It is deliberately `regulated_review`; no cosmetology license or credential is certified. |
| Retained online business | boston-008 | Its directory profile expressly states “NO STOREFRONT.” Address is null and no coordinates are supplied. |
| Retained community resources | boston-009, boston-010, boston-012, boston-013 | These are separately typed community resources, not commercial pins. Official or municipal sources support their stated role and contact address. |
| Retained cultural places | boston-011, boston-014, boston-015 | These are separately typed cultural places, not commercial pins. The NCAAA record preserves the official site’s limited public-access statement rather than asserting ordinary availability. |
| Held | boston-held-001 through boston-held-008 | The held JSONL carries the exact reason: address conflict, reopening/status uncertainty, no verified official destination, no physical address, locality/identity shift, or missing current location. |

## Candidate counts

### By target kind

| Target kind | Count |
|---|---:|
| business | 6 |
| regulated_review | 1 |
| online_business | 1 |
| community_resource | 4 |
| cultural_place | 3 |
| **Total retained** | **15** |
| held | 8 |

### By category (retained records)

| Category | Count |
|---|---:|
| food_and_drink | 4 |
| retail | 2 |
| hair_and_beauty | 1 |
| recreation | 1 |
| family_youth | 1 |
| community_resources | 3 |
| arts_culture | 3 |
| **Total** | **15** |

## Deduplication and validation

Before output, every record in every pre-existing `*.jsonl` below `/home/ubuntu/directory-research-wave-2026-09-18/` was loaded, excluding this output folder. The comparison key was the normalized tuple **name + city + state + address**: lowercased strings with punctuation and whitespace removed. The pre-existing corpus contained 2,772 parseable records. No exact normalized match was found for any retained or held record. The final candidate and held JSONL files were also parsed line-by-line as JSON after writing; both validate successfully and every row has the required field set with JSON `null` where facts are unknown.

## Inspected URL register

The following register enumerates every URL opened or fetched in this pass. Search-result snippets were used only to identify possible destinations and are not evidence. “Retained evidence” means the URL supports a retained record or source context; “held/screening” means it supported a hold decision, source-quality assessment, or an ultimately unretained lead.

| Ref | Inspected URL / title | Role and result |
|---:|---|---|
| [1] | Black Owned Bos. — About | **Retained evidence.** Directory scope and Black-owned-business context. |
| [2] | Boston Black Business Directory — Why the directory | **Retained evidence.** Directory purpose and Greater Boston Black-business context. |
| [3] | Black Owned Bos. — Directory | **Retained evidence.** Directory categories and Greater Boston discovery scope. |
| [4] | Comfort Kitchen — Black Owned Bos. profile | **Retained evidence.** Named restaurant profile and official links. |
| [5] | Comfort Kitchen — official site | **Retained evidence.** Address, phone, restaurant description, and social links. |
| [6] | M&M Barbecue — Boston Black Business Directory profile | **Retained evidence.** Address, category, official link, and directory context. |
| [7] | M&M Barbecue — official ordering site | **Retained evidence.** Current pickup location and customer-facing menu. |
| [8] | Frugal Bookstore — Boston Black Business Directory profile | **Retained evidence.** Address, category, phone, and official link. |
| [9] | Frugal Bookstore — official home | **Retained evidence.** Customer-facing bookstore website. |
| [10] | Frugal Bookstore — official about | **Retained evidence.** Roxbury community-bookstore description. |
| [11] | Bos. Shop South End — Black Owned Bos. profile | **Retained evidence.** Retail category and official link. |
| [12] | Bos. Shop South End — official site | **Retained evidence.** Address, phone, gift-shop description, and official ownership wording. |
| [13] | Boing! Toy Shop — Black Owned Bos. profile | **Retained evidence.** Retail category and official link. |
| [14] | Boing! Toy Shop — official home | **Retained evidence.** Customer-facing toy-shop site. |
| [15] | Boing! Toy Shop — official location | **Retained evidence.** Jamaica Plain street address and phone. |
| [16] | Styllistik Hair Salon — Black Owned Bos. profile | **Retained evidence.** Beauty category and official links. |
| [17] | Styllistik — official products page | **Retained evidence.** Official address, phone, hair-care identity, and socials. |
| [18] | Styllistik — official contact page | **Retained evidence.** Street address and salon contact evidence. |
| [19] | TRILLFIT — Black Owned Bos. profile | **Retained evidence.** Dance-and-fitness source profile. |
| [20] | TRILLFIT — official contact | **Retained evidence.** Boston studio address and customer contact. |
| [21] | Boston Cookie Kitchen — Black Owned Bos. profile | **Retained evidence.** Explicit no-storefront statement and official links. |
| [22] | Boston Cookie Kitchen — official site | **Retained evidence.** Online order model and Boston-made shipping description. |
| [23] | 826 Boston — official site | **Retained evidence.** Nonprofit role, address, and youth writing/tutoring work. |
| [24] | BCYF — City of Boston | **Retained evidence.** Municipal status, mission, and administrative contact. |
| [25] | City of Boston — Latino community organizations | **Retained evidence.** Discovery/source context for La CASA, Sociedad Latina, and Hyde Square Task Force. |
| [26] | La CASA — IBA official page | **Retained evidence.** Cultural place and operator/address information. |
| [27] | Sociedad Latina — official site | **Retained evidence.** Youth/family role and street address. |
| [28] | Hyde Square Task Force — official site | **Retained evidence.** Nonprofit, youth, Afro-Latin arts, and street address. |
| [29] | Roxbury Cultural District — featured community businesses | **Retained evidence.** GRACC and NCAAA cultural-place addresses. |
| [30] | GRACC — official site | **Retained evidence.** Official contact and public-charity statement. |
| [31] | Meet Boston — NCAAA museum listing | **Retained evidence.** Credible destination listing and address. |
| [32] | NCAAA — official site | **Retained evidence.** Mission, address, and limited public-access statement. |
| [33] | Blue Mountain — Boston Black Business Directory profile | **Held evidence.** One of two conflicting street addresses. |
| [34] | Blue Mountain Jamaican Restaurant — official site | **Held evidence.** Conflicting current street address. |
| [35] | Pure Oasis — Boston Black Business Directory profile | **Held evidence.** Legacy address/hours. |
| [36] | Pure Oasis — official site | **Held evidence.** “Reopening Soon” status. |
| [37] | 50 Kitchen — Boston Black Business Directory profile | **Held evidence.** Legacy brick-and-mortar address. |
| [38] | 50Kitchen — official site | **Held evidence.** Food-truck description without a reliable Boston numbered location. |
| [39] | Soleil — Boston Black Business Directory profile | **Held evidence.** Address/phone but no verified official destination. |
| [40] | soleilboston.com | **Held evidence.** Unrelated gambling content; rejected as a candidate official site. |
| [41] | Snapped Boston — Black Owned Bos. profile | **Held evidence.** Service/ownership wording and official links, but no address. |
| [42] | Snapped Boston — official site | **Held evidence.** Contact-only site without numbered address. |
| [43] | Velasquez Tax and Business Services — Black Owned Bos. profile | **Held evidence.** Boston/Allston profile links to changed official presentation. |
| [44] | Velasquez Tax / VTBS Success — official site | **Held evidence.** Cambridge office and changed branding; no mapping promotion. |
| [45] | McCloud Business Services — Black Owned Bos. profile | **Held evidence.** Accounting-service listing and official links. |
| [46] | McCloud Business Services — official site | **Held evidence.** No numbered address and generic signed-in account state. |
| [47] | Embrace Boston — official site | **Held evidence.** Program description without current numbered location. |
| [48] | Boston Chamber — Black-owned business feature | **Screening only.** Opened as a local chamber discovery source; not used for a retained row. |
| [49] | Analyze Boston — Certified Business Directory | **Screening only.** Opened as municipal discovery/source-quality context; no row derived from its downloadable data. |
| [50] | We Are ALX — business directory | **Screening only.** Access blocked by its security check; no candidate derived. |
| [51] | Mass Cultural Council — cultural districts | **Screening only.** No extractable content; no candidate derived. |
| [52] | Frugal Bookstore — official contact page | **Screening only.** No extractable content; the individual directory profile supplies the retained address. |
| [53] | Black Owned Bos. — official main site | **Screening/source context.** Opened to verify the platform’s public-facing Boston presence. |
| [54] | styllistikhairsalon.com | **Screening only.** Destination could not be resolved; the directory-linked Styllistik official site supplied the retained evidence. |
| [55] | Black Owned Bos. — 50Kitchen profile | **Screening only.** The requested profile did not return extractable content; 50Kitchen was held on directly inspected directory and official-site evidence. |
| [56] | Boston Black Business Directory — home | **Screening/source context.** Opened as the directory’s public landing page; individual profiles support business rows. |
| [57] | M&M Ribs ordering domain | **Screening only.** An alternate official ordering-domain URL was opened; its location evidence is represented by the retained M&M BBQ ordering site. |

## References

[1]: https://directory.blackownedbos.com/about "Black Owned Bos. — About"
[2]: https://bostonblackbiz.com/why-the-boston-black-business-directory/ "Why The Boston Black Business Directory?"
[3]: https://directory.blackownedbos.com/ "Black Owned Bos. Business Directory"
[4]: https://directory.blackownedbos.com/business/Comfort+Kitchen "Comfort Kitchen — Black Owned Bos."
[5]: https://www.comfortkitchenbos.com/ "Comfort Kitchen"
[6]: https://bostonblackbiz.com/places/united-states/massachusetts/boston/food/mm-barbecue/ "M&M Barbecue — Boston Black Business Directory"
[7]: https://www.mandmbbq.com/ "M&M BBQ"
[8]: https://bostonblackbiz.com/places/united-states/massachusetts/boston/bookstore/frugal-bookstore/ "Frugal Bookstore — Boston Black Business Directory"
[9]: https://frugalbookstore.net/ "Frugal Bookstore"
[10]: https://frugalbookstore.net/pages/about-us "Frugal Bookstore — Who We Are"
[11]: https://directory.blackownedbos.com/business/Bos.+Shop+South+End "Bos. Shop South End — Black Owned Bos."
[12]: https://www.blackownedbos.com/bos-shop "Bos. Shop South End"
[13]: https://directory.blackownedbos.com/business/Boing%21+Toy+Shop "Boing! Toy Shop — Black Owned Bos."
[14]: https://www.boingtoys.com/ "Boing! Toy Shop"
[15]: https://boingtoys.com/pages/our-location "Boing! Toy Shop — Hours and Location"
[16]: https://directory.blackownedbos.com/business/Styllistik+Hair+Salon "Styllistik Hair Salon — Black Owned Bos."
[17]: https://www.styllistik.com/styllistik-products/ "Styllistik Products"
[18]: https://www.styllistik.com/contact-us "Styllistik — Contact Us"
[19]: https://directory.blackownedbos.com/business/TRILLFIT "TRILLFIT — Black Owned Bos."
[20]: https://trill.fit/contact "TRILLFIT — Contact Us"
[21]: https://directory.blackownedbos.com/business/Boston+Cookie+Kitchen "Boston Cookie Kitchen — Black Owned Bos."
[22]: https://www.bostoncookiekitchen.com/ "Boston Cookie Kitchen"
[23]: https://826boston.org/ "826 Boston"
[24]: https://www.boston.gov/departments/boston-centers-youth-and-families "Boston Centers for Youth and Families"
[25]: https://www.boston.gov/news/local-latino-community-organizations-preserve-space-preserve-culture "Local Latino Community Organizations Preserve Space to Preserve Culture"
[26]: https://ibaboston.org/la-casa "La CASA"
[27]: https://www.sociedadlatina.org/ "Sociedad Latina"
[28]: https://www.hydesquare.org/ "Hyde Square Task Force"
[29]: https://www.roxburyculturaldistrict.com/about-us-1-1 "Roxbury Cultural District — Featured Community Businesses"
[30]: https://www.graccboston.org/ "Greater Roxbury Arts & Cultural Center"
[31]: https://www.meetboston.com/listing/museum-of-the-national-center-of-afro-american-artists/11517/ "Museum of the National Center of Afro-American Artists — Meet Boston"
[32]: https://ncaaa.org/ "National Center of Afro-American Artists"
[33]: https://bostonblackbiz.com/places/united-states/massachusetts/boston/food/blue-mountain-jamaican-restaurant/ "Blue Mountain Jamaican Restaurant — Boston Black Business Directory"
[34]: https://bluemountainjamaicanrestaurant.com/ "Blue Mountain Jamaican Restaurant"
[35]: https://bostonblackbiz.com/places/united-states/massachusetts/boston/cannabis/pure-oasis/ "Pure Oasis — Boston Black Business Directory"
[36]: https://mypureoasis.com/ "Pure Oasis"
[37]: https://bostonblackbiz.com/places/united-states/massachusetts/boston/food/50-kitchen/ "50 Kitchen — Boston Black Business Directory"
[38]: https://50kitchen.com/ "50Kitchen"
[39]: https://bostonblackbiz.com/places/united-states/massachusetts/boston/food/soleil/ "Soleil — Boston Black Business Directory"
[40]: https://soleilboston.com/ "soleilboston.com"
[41]: https://directory.blackownedbos.com/business/Snapped+Boston "Snapped Boston — Black Owned Bos."
[42]: https://www.snappedboston.com/ "Snapped Boston"
[43]: https://directory.blackownedbos.com/business/Velasquez+Tax+and+Business+Services+LLC "Velasquez Tax and Business Services LLC — Black Owned Bos."
[44]: https://velasqueztaxbizsvcs.com/ "VTBS Success"
[45]: https://directory.blackownedbos.com/business/McCloud+Business+Services "McCloud Business Services — Black Owned Bos."
[46]: https://www.mccloudbusiness.com/ "McCloud Business Services"
[47]: https://www.embraceboston.org/ "Embrace Boston"
[48]: https://bostonchamber.com/thought-leadership/black-history-month-in-boston-support-local-black-owned-businesses/ "Support Local Black-Owned Businesses — Boston Chamber"
[49]: https://data.boston.gov/dataset/certified-business-directory "Certified Business Directory — Analyze Boston"
[50]: https://wearealx.org/business-directory/ "We Are ALX Business Directory"
[51]: https://massculturalcouncil.org/communities/massachusetts-cultural-districts/ "Massachusetts Cultural Districts"
[52]: https://frugalbookstore.net/pages/contact "Frugal Bookstore — Contact"
[53]: https://blackownedbos.com/ "Black Owned Bos."
[52]: https://frugalbookstore.net/pages/contact "Frugal Bookstore — Contact"
[53]: https://blackownedbos.com/ "Black Owned Bos."
[54]: https://styllistikhairsalon.com/ "Styllistik Hair Salon candidate domain"
[55]: https://directory.blackownedbos.com/business/50Kitchen "50Kitchen — Black Owned Bos."
[56]: https://bostonblackbiz.com/ "Boston Black Business Directory"
[57]: https://www.mandmribs.com/ "M&M Ribs ordering domain"
