# Virginia Union University neighborhood business research

**Campus:** Virginia Union University, Richmond, Virginia. **Research date:** 2026-09-20. **Scope:** research-only, maximum three nearby everyday-life physical businesses; no ingestion, publication, or database access.

## Source ledger

| Source | URL | Use |
|---|---|---|
| Virginia Union University | https://www.vuu.edu/ | Campus identity and Richmond location context. |
| Venture Richmond | https://venturerichmond.com/news/post/xx-black-businesses-and-events-in-downtown-richmond/ | Authoritative 2026 guide explicitly titled “100+ Black-Owned Businesses to Check Out in Downtown Richmond”; supplies business categories and numbered addresses, including Mama J’s, Le Cache Dulcet, Hour Cycle Studio, and Moizelle’s. |
| Mama J’s official website | https://www.mamajskitchen.com/ | Current official destination; states restaurant identity, family-owned/operated description, phone, and 415 N. 1st Street address; links official social accounts. |
| WRIC ABC 8News | https://www.wric.com/news/local-news/richmond/owner-of-mama-js-kitchen-shares-impact-of-richmond-black-restaurant-experience/ | Authoritative ownership evidence: identifies Lester Johnson as owner of Mama J’s Kitchen and places it in Richmond’s Black Restaurant Experience. |
| Le Cache Dulcet official Instagram | https://www.instagram.com/lecachedulcet/ | Current official destination; profile identifies coffee shop/record store and publishes 109 E Broad St address. Ownership wording was visible in official social search material. |
| Hour Cycle official website | https://www.hourcyclestudio.com/home | Current official destination and fitness category; address evidence is inconsistent across indexed pages, so held rather than candidate. |

## Candidate decisions

Two candidates passed all contract gates: **Mama J’s Kitchen** and **Le Cache Dulcet**. Both have an HTTPS current official destination, a numbered street address supported by official/authoritative sources, a useful everyday-life category, and explicit Black-owned evidence. No third candidate was added because the remaining leads did not clear every evidence gate.

## Held leads

Two plausible leads are preserved in `held-candidates.jsonl`. **Hour Cycle Studio** has an official destination and address evidence, and an indexed official Instagram result says “Black Woman Owned,” but that ownership evidence was not independently readable from an accessible page in this pass. **Moizelle’s Cleaners & Launderer** has a numbered address and appears in Venture Richmond’s Black-owned guide, but no current official business website/social destination was located.

## Reconciliation and limitations

`candidates.jsonl`: 2 records. `held-candidates.jsonl`: 2 records. Total researched records: 4; eligible candidates: 2; held: 2. The guide is downtown-focused rather than a measured radius from the campus; “nearby” was interpreted conservatively as Richmond neighborhood businesses plausibly accessible from VUU, with no distance claim made. Ownership designations are included only where explicit source wording was found; no ownership was inferred from names, cuisine, geography, imagery, or reputation. Address conflicts are noted rather than silently resolved. The research does not assert hours, accessibility, licensing, pricing, menus, service completeness, current operating status beyond accessible destination evidence, or publication eligibility.

## Contract compliance

All candidate records use `targetKind: physical_business`, `country: US`, `sourceStatus: research_only`, HTTPS destinations, and the required 23-field order. No latitude/longitude, stringified nulls, PII, unsupported service claims, ingestion, publication, or database access was used.
