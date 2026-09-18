# Philadelphia Online Businesses — Evidence Report

## Scope and method

This pass searched Philadelphia founder and brand directories, prioritizing Philadelphia-area Black-owned and Latino/diaspora business listings. The inclusion rule was narrow: the source had to explicitly identify an online-only business (either a source section titled **Online-Only Stores** or an explicit **Online** label), and the listing had to provide an official customer-facing website or official business social profile. Because these records are online-only, `address` is `null` and no map pin or inferred street address was added.

## Included candidates

The JSONL file contains **19 candidates**. Seventeen come from Visit Philadelphia’s Black-owned guide, whose page places them under the explicit “Online-Only Stores” section. Two come from Philadelphia Magazine’s Black-owned startups article, which labels Barley Sober and Two Locals Brewing “Online.” Ownership designations are retained only where the source itself supports them. Service and product descriptions are limited to the published wording; regulated-profession flags remain false because none of the included listings is presented as a regulated professional service.

| Source rows | Source | Evidence basis | Official destination |
|---|---|---|---|
| 1–17 | Visit Philadelphia, [A Guide to Black-Owned Shops & Boutiques in Greater Philadelphia](https://www.visitphilly.com/articles/philadelphia/black-owned-shops-and-boutiques-in-philadelphia/) | Explicit “Online-Only Stores” section; clothing/accessories, home goods, baby, beauty, and flowers subsections | Brand websites or official Instagram profiles linked from the listing |
| 18–19 | Philadelphia Magazine, [Meet the 2.5 Percent: Philly’s Black-Owned Enterprises and Early-Stage Start-Ups](https://www.phillymag.com/news/2020/08/31/philly-black-owned-startups-enterprises/) | Barley Sober and Two Locals Brewing each appear under an explicit “Online” label | Official websites; Two Locals also has the article-linked official Instagram |

## Candidate-level evidence notes

Rows 1–17 preserve the exact Visit Philadelphia article URL as `sourceUrl` and the exact business destination linked by the article in `website`. Visit Philadelphia’s guide identifies the section as “Online-Only Stores,” which is the online-only basis for every row in that group. The article’s listing text provides the published product or service description and, where stated, founder/owner context. No physical location was supplied for these online-only entries, so no address was inferred.

Rows 18–19 preserve the exact Philadelphia Magazine article URL. The article labels Barley Sober and Two Locals Brewing “Online.” For Barley Sober, the article names Rohan Brown as founder and links to `https://barley-sober.com/`. For Two Locals Brewing, it names Richard and Mengistu Koilor as co-owners, states that the company had not yet secured a physical space, and links to `https://www.twolocalsbrewing.com/` plus the official Instagram profile. The records therefore use a null address and do not create a fabricated city pin.

## Accessibility limits and exclusions

The Visit Philadelphia pages were accessible through text extraction, although long pages were returned with relevant sections selected rather than every page section. The Philadelphia Magazine page was fully accessible. The PHL Food & Shops “Founded in Philly” page was accessible but did not provide enough explicit online-only evidence for qualifying candidates in this pass; it was therefore used for discovery context only and no records were imported from it. The Latino-owned Visit Philadelphia guide was accessible, but the reviewed entries described physical shops, cafés, studios, or other locations rather than explicit online-only businesses, so no Latino-owned record was added under this strict scope.

Physical businesses from the source pages were excluded because this pass requested online-only businesses. Businesses with only a generic directory page, chamber page, Google Maps page, shared directory social account, or personal LinkedIn profile were excluded as destinations. No database/API calls were made, no publishing was performed, and no ownership, address, language, hours, accessibility, license, insurance, availability, or unlisted services were inferred. Product descriptions involving wellness, beauty, or skincare were kept as retail categories and were not converted into medical or therapeutic claims.

## Output

The companion JSONL file is:

`/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-philadelphia-deep-dive-pass-3/source-passes/19-phila-online-businesses-deep-candidates.jsonl`

It contains sequential `sourceRow` values 1–19 and uses `targetKind: "online_business"` for every included record, with `address: null` throughout.
