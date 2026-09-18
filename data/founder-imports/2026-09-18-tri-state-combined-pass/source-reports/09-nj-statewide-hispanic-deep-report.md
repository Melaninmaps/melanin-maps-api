# Statewide Hispanic Chamber of Commerce of New Jersey directory — deep expansion pass 2

**Scope and status.** This is a research expansion, not a claim that any business is live, open, available, insured, licensed, accessible, or currently operating. Chamber membership is not ownership evidence; no Hispanic/Latino identity was inferred.

## Sources searched

| Source | Exact pages | Result |
|---|---|---|
| SHCCNJ Business Directory | [landing page](https://business.shccnj.org/list), alphabetical pages `/list/searchalpha/0-9` and `/list/searchalpha/a` through `/list/searchalpha/z`, and linked member detail pages | 26 alphabetical pages plus the landing page were enumerated; 388 unique member detail URLs were discovered. The landing page also exposed 146 category/segment links, which were reviewed as directory navigation and used to cross-check coverage. |
| SHCCNJ member detail pages | Example: [Los Tamales de Ana y mas](https://business.shccnj.org/list/member/los-tamales-de-ana-y-mas-west-new-york-45366) | Detail pages were checked for published name, category, street address, phone, and official “Visit Website” destination. |
| First-party destinations linked from member pages | Per-record URLs in JSONL | Used only where the chamber page supplied an official customer-facing website or social destination; Google map links and chamber social links were not treated as customer destinations. |

## Candidate counts

The JSONL contains **209 records**: **29 regulated_review** and **180 business**. Records are sequentially numbered from 1.

## Inclusion and exclusion rules

Included records have a chamber detail URL, a published street address, city/state, category, and at least one linked official customer-facing website or social URL. Health, legal, financial, tax, insurance, immigration, counseling, childcare, and similar services were classified as `regulated_review`. Houses of worship were not imported as commercial businesses. Entries already present in the other pass-2 NJ source-passes were excluded to keep this file an expansion rather than a duplicate.

## Gaps and limitations

The directory is powered by a GrowthZone/Micronet template and some detail pages expose a generic template heading before the actual listing name; extraction used the structured `itemprop` listing name. Some records lack a category or official destination, some have incomplete or non-street addresses, and these were excluded. The directory may change after the fetch date. No database/API or generic Google page was used, and no map coordinates were published.
