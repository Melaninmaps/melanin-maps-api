# Philadelphia Suburb / Delaware County Deep-Dive Pass 3

## Scope and method

This pass searched public Delaware County community and chamber sources for additional Black-, Latino-, and minority-designated businesses beyond Best in Delco, with emphasis on Upper Darby, Chester, Media, Lansdowne, Yeadon, and surrounding Delaware County communities. The candidate file contains **12 records**: six from Shop Lansdowne’s public Black-Owned Businesses page and six from the Delaware County Chamber of Commerce’s public MBE directory results.

Ownership labels are preserved exactly as published. A chamber designation of “Minority Owned Business” is not expanded into Black or Latino identity. Chamber membership or directory inclusion is not treated as proof beyond the directory’s own designation. No identity, language, hours, accessibility, license, insurance, availability, or unlisted services were inferred.

## Included source evidence

| Source | Exact URL | What it provided | Accessibility / caveat |
|---|---|---|---|
| Shop Lansdowne — Black-Owned Businesses | [shoplansdowne.com/black-owned-businesses](https://shoplansdowne.com/black-owned-businesses/) | Public list of Lansdowne-area businesses with names, contact names, addresses, phones, and some customer websites; page title explicitly identifies the list as Black-Owned Businesses. | Page was readable as static HTML. Several entries had no address, phone, or customer destination and were excluded. “Not My Lemonade” did not print the state/ZIP beside its address, so the record retains the published street address and Lansdowne context. |
| Delaware County Chamber of Commerce — MBE directory results | [web.delcochamber.org/directory/results/results.aspx?affcode=MBE](https://web.delcochamber.org/directory/results/results.aspx?affcode=MBE) | Public directory results with business names, addresses, phones, ownership designations, customer websites and/or social links. | Page was readable, but the directory is a broad county/regional list rather than a town-specific Black/Latino directory. Only entries with a Delaware County or immediately surrounding location and a usable customer destination were selected. Some social links are chamber referral wrappers; the underlying customer URLs were preserved where visible. |
| Media Borough Business Directory | [mediaborough.com/395/Business-Directory](https://www.mediaborough.com/395/Business-Directory) | Official borough page linking to the separate Visit Media directory. | The fetched page did not expose individual listings; it only supplied a link to the external directory. It was used as a source-accessibility finding, not as a candidate source for fabricated records. |
| Delaware County Chamber general directory | [web.delcochamber.org/2018/search](https://web.delcochamber.org/2018/search) | Search interface and category taxonomy for the public Delaware County business directory. | The fetch exposed the search form and categories but not individual result rows. No records were created from category names or the chamber’s own social accounts. |

## Candidate selection notes

The six Shop Lansdowne records selected were **Traci’s BIO, Don’t Touch My Crown, Not My Lemonade, Dugan Accounting & Tax Services, Inc., Promo Management,** and **The Royal Orange Boutique**. All were on the page explicitly titled “Black-Owned Businesses” and had enough location information plus a business-specific website to satisfy the physical-commercial rule. Dugan Accounting & Tax Services is routed to `regulated_review` because accounting and tax preparation are professional/regulated services.

The six chamber records selected were **Chosen Tweed** (Media), **Girls Auto Clinic & Clutch Beauty Bar** (Upper Darby), **Chester Cultural Arts and Technology Center** (Chester), **Casey’s Drexel Hill** (Drexel Hill), **Lifefire Weight & Wellness** (Havertown), and **Top Rail Fence** (Springfield). These records retain the chamber’s published labels such as “Minority Owned Business” and “Women Owned Business.” The Chester Cultural Arts and Technology Center is classified as `cultural_place`, not as a conventional business. Lifefire Weight & Wellness is routed to `regulated_review` because its published name and description indicate health/weight services.

## Exclusions and limits

The Shop Lansdowne page also listed **Foose Grill & Seafood, Sweet Gardena, Ann’s dress shop, Cinda hair boutique, Sophusion fine dining, Leo’s Breakfast, Denim Dolls Fashion Lounge, Kia’s Cakes & Gourmet Goodies,** and **Kaywayjuice**. They were excluded because the page did not provide all required physical-record fields, especially a business-specific customer-facing website or social destination for the entries without a published destination. No generic directory or shared chamber social account was substituted.

The chamber MBE results contained many businesses outside the requested Delaware County suburban focus, including entries in Plymouth Meeting, Glenside, Woodlyn, Radnor, Philadelphia, Garnet Valley, and other areas. They were not included unless the location was within the target area or a close surrounding Delaware County community. Records without a usable business website or customer-facing social destination were excluded, such as Your Needs Matter Homecare and Galle Electric. A customer-facing destination was required even when the chamber supplied a map link; Google Maps links were not used as business destinations.

No reliable public source page exposing additional Yeadon-specific Black/Latino businesses was found in this pass. The Media Borough page likewise exposed no individual listings in the fetched HTML. Yelp, Facebook group posts, generic search pages, and directory home pages were not used as sole evidence for physical candidates. No API, database, or publishing action was performed.

## Deliverable

The structured candidate records are in [`12-phila-suburb-delco-deep-candidates.jsonl`](../source-passes/12-phila-suburb-delco-deep-candidates.jsonl). Each line has sequential `sourceRow` values and the requested ownership, regulated-review, destination, evidence, and notes fields.

## Source URLs

1. https://shoplansdowne.com/black-owned-businesses/
2. https://web.delcochamber.org/directory/results/results.aspx?affcode=MBE
3. https://www.mediaborough.com/395/Business-Directory
4. https://web.delcochamber.org/2018/search
5. https://www.upperdarby.org/379/Delco-Chamber

The Upper Darby municipal Delco Chamber page was reviewed as a context/resource page but did not expose individual businesses and therefore did not generate a candidate.
