# International Founder Business Address Recovery

This staging-only evidence bundle covers the **1,316 published founder-sourced international businesses that had neither street addresses nor coordinates** when exported from isolated staging on September 6, 2026. The source export contains public listing fields only.

## Source-first outcome

The first pass inspected **146 unique founder-supplied public source pages** under a fail-closed robots policy, direct public-IP validation, bounded requests, and no proxy use. It found one strict business-specific structured address/coordinate candidate and 214 exact-name business detail links. The second pass inspected the **216 unique detail URLs** attached to those 214 listings and found one additional strict candidate. Three listings produced ambiguous structured candidates across the two passes and were held.

Across both passes, only **two distinct strict candidates** satisfied all of these requirements: exact normalized business name in one structured record; structured street address; exact listed city; recognized matching country; and embedded non-Null-Island coordinates from that same record. Both remain `candidate_unverified`; neither source recovery pass wrote to the database or map.

| Metric | Result |
|---|---:|
| International unpinned businesses | 1,316 |
| Unique initial source pages | 146 |
| Exact-name listings with detail links | 214 |
| Unique detail pages | 216 |
| Strict source-backed candidates | 2 |
| Ambiguous candidates held | 3 candidate outcomes across the passes |
| Database writes during recovery | 0 |
| Map-pin writes during recovery | 0 |

The two strict candidates are locked in `accepted-source-backed-pin-candidates.jsonl`. Publication is handled only by the guarded, staging-only `publish-source-backed-international-pins` command after independent review and a dry run. Publication must preserve `unclaimed` and `verified=false` status and must not overwrite any existing address or coordinates.

## Practical implication

The source-first route recovered only **0.15%** of the 1,316-business cohort as strict address candidates. Scraping the same shared pages more aggressively would lower evidence quality rather than materially increase coverage. The remaining inventory therefore needs either founder-supplied street addresses, business-specific public-page research in controlled batches, or a geocoding/places provider whose terms explicitly permit MWM to store and display results in its own directory and map.

The existing disabled TomTom connector is not an acceptable durable enrichment path under the reviewed standard TomTom terms because those terms prohibit storing API results beyond permitted client caching and prohibit constructing a secondary database from the results. No connector was enabled.

All evidence artifacts in this directory are covered by `SHA256SUMS`.
