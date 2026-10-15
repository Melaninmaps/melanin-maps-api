# Kinfolk Current Official-Presence Discovery — Consolidated Evidence

**Completed:** 2026-10-15T18:29:10.295934+00:00
**Scope:** 2,216 Kinfolk Current records whose stored website check was inconclusive.
**Production changes:** None. This work neither saved links nor changed any business, ownership designation, eligibility flag, map pin, visibility state, or lifecycle value.

## Candidate results

| Evidence outcome | Records | Share of the 2,216 records |
|---|---:|---:|
| Website candidate for review | 402 | 18.1% |
| Social candidate for review | 227 | 10.2% |
| Both website and social candidates | 40 | 1.8% |
| Any candidate source | 589 | 26.6% |
| Current page-level identity-matched website candidate | 246 | 11.1% |
| Current page-level identity-matched social candidate | 182 | 8.2% |

The candidate queue contains **589 records**. Each item retains its immutable business ID, city/state, source URL, validation state, and current snapshot hash. Every item remains `REQUIRES_FRESH_IDENTITY_REVIEW_BEFORE_ANY_SAVE`; no search result is treated as an official profile merely because it appeared in search.

## What the search result can and cannot prove

The public search provider returned usable result pages for **977** records. It did not return usable result pages for **1,239** records; **781** had hard request errors and **503** encountered provider challenge responses. Those records are **not evidence that a business lacks a website or social presence**. They remain research-unresolved.

The ABR Firm calibration demonstrates the distinction: the bulk search request was blocked, but direct public verification found the official site, which identifies ABR FIRM and lists a Memphis address, phone, and email. [1]

## Retained-receipt recovery

A separate current recheck used retained first-party receipt URLs rather than another search request. It rechecked **295** records that had eligible legacy sources and recovered **22** additional website-review records. These sources were still required to pass current identity checks; stale or mismatched historical links were not carried forward.

## Next safe step

The queue is ready for a separate review-and-apply process. That process must re-read the live record, compare the immutable snapshot, validate each exact official URL, preserve a field-level receipt, and save only approved profile fields. It must not infer ownership or alter Kinfolk Current qualification, map status, or business lifecycle.

## Evidence files

- Candidate review queue: `official-presence-candidate-review.jsonl`
- Consolidated counts: `consolidated-summary.json`
- Complete compressed probe and recheck receipts: `complete-discovery-receipts.tar.gz`
- Archive checksum: `RECEIPTS_SHA256.txt` (`8fe38aff506e4177dfcfbc009a36e9408cbb1bf474cff2e4c768e2976cbe28e9`)
- Calibration: `official-presence-search-calibration.jsonl`

## References

[1]: https://www.abrfirmmemphis.com/ "ABR FIRM official website"
