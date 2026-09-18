# Source Pass 18: Mid-Atlantic Online Businesses

## Scope and method

This pass searched founder/brand-style editorial directories and official customer-facing sites for **Black, Latino, or diaspora online retailers and services headquartered in the Mid-Atlantic**. The principal source was District Fray’s local-business roundup, which describes itself as covering Black-owned businesses in the DMV and explicitly marks qualifying entries **“Online only.”** Official destination sites were retained as the customer destinations. No database/API was called and nothing was published.

## Included candidates

| Row | Candidate | Published basis | Destination | Address treatment |
|---:|---|---|---|---|
| 1 | All Very Goods | District Fray labels it “Online only” and places it in its DMV Black-owned-business roundup. | [allverygoods.com](https://allverygoods.com/) | `null`; no street address or map pin fabricated |
| 2 | The District Pit BBQ Catering Company | District Fray labels it “Online only,” identifies its BBQ/catering offer, and places it in its DMV Black-owned-business roundup. | [thedistrictpit.com](https://www.thedistrictpit.com/) | `null`; no street address or map pin fabricated |
| 3 | MochaBox | District Fray labels it “Online only,” says beans and merchandise are shipped, and places it in its DMV Black-owned-business roundup. | [mochabox.com](https://www.mochabox.com/) | `null`; no street address or map pin fabricated |

**Candidate count: 3.** The JSONL uses `targetKind: online_business`, `address: null`, sequential `sourceRow` values, and leaves unpublished contact/social fields null rather than guessing. City/state are recorded as Washington, DC from the article’s DC/DMV local-business scope; the source does not publish street-level headquarters details.

## Source and evidence notes

The source is [District Fray, “17 Local Businesses to Celebrate During National Black Business Month”](https://districtfray.com/articles/black-owned-businesses-dc/). Its introduction says it is spotlighting “DMV Black-owned businesses both online and brick-and-mortar.” In the entries used here, it explicitly states “Online only” for All Very Goods, The District Pit BBQ Catering Company, and MochaBox, and provides each official customer destination plus an Instagram link. The article’s contextual Black-owned designation is applied conservatively to the listed candidates; no additional identity, language, hours, accessibility, license, insurance, or availability claims are inferred.

## Exclusions and gaps

Physical businesses from the same article—such as The Museum, Skin Beauty Bar, The Spice Suite, and Flowers by Alexes—were excluded from this online-only pass because the source publishes physical addresses and describes in-person locations. Black Pepper Paperie Co., Frères Branchiaux Candle Co., and MahoganyBooks were excluded because the source says “online and in-stores” or identifies physical locations, not online-only operation. The African Diaspora Group was not included: its official site documents Maryland headquarters and online membership/merchandise, but does not explicitly state that the organization is online-only. Hija De Tu Madre was not included because the official site confirms a Latina-oriented online storefront but does not establish Mid-Atlantic headquarters. Search results that lacked a first-party destination, explicit online-only basis, or reliable Mid-Atlantic headquarters evidence were not promoted to candidates.

## Accessibility limitations

The evidence is web-based and does not verify physical accessibility, delivery coverage, accommodations, language availability, hours, inventory, or current operating status beyond the accessed pages. Because the accepted businesses are explicitly online-only, no physical access point or map pin should be generated from this pass. The article does not provide precise headquarters addresses for the three included businesses, so city/state placement should be treated as editorial DMV-scope evidence for follow-up verification rather than a street-address claim.
