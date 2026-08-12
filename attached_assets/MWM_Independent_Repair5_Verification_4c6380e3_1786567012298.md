# Independent Repair 5 Verification — Deployment `4c6380e3`

**Target:** `https://www.mappingwithmelanin.com`  
**Verified deployment:** `4c6380e3f6c68cc68dee04a5126f03e53834783f`  
**Verdict:** **Partial pass. The staged final 30-user audit is still not authorized because the authenticated Phuket directory-to-map handoff remains broken.**

> The new deployment is genuine. It fixes the active map’s discoverability-pin fetch and improves readiness telemetry. It does **not** complete the end-to-end Phuket map handoff: the URL query is present, but the client does not run geo-extract or universal search and remains centered on Philadelphia.

## 1. Independently verified passes

| Gate | Independent production observation | Result |
| --- | --- | --- |
| Deployment identity | `/api/version` reports SHA `4c6380e3`; bundle hashes match; `stale_bundle: false`. | **PASS** |
| Readiness telemetry | `/api/readyz` returns database healthy and real pool maximum: `{ total: 1, idle: 1, waiting: 0, max: 50 }` while idle. | **PASS** |
| Member authentication | Isolated account login succeeded. | **PASS** |
| Core authenticated routes | Preferences, sessions, Library graph, Phuket geo-extract, Phuket universal search, and map-pin adapter each returned HTTP 200 singly. | **PASS — single requests only** |
| City event filters | Philadelphia and Phuket return zero events; Houston returns the one Houston event only. | **PASS** |
| Phuket local fuzzy search | `city=Phuket&search=hair` returns zero results and no Washington fallback. | **PASS** |
| Active map pin-layer request | The authenticated browser now requests `/api/maps/discoverability-pins`. | **PASS** |
| Pin validity | The adapter returns 103 pins, all coordinate-valid: 95 tour-site and 8 recurring-event pins. | **PASS** |

## 2. Exact live failure — Phuket map handoff

The live authenticated route was opened directly:

```text
/map?q=restaurant%20in%20Phuket
```

The results did not meet the feature’s acceptance condition.

| Required behavior | Independent browser observation | Result |
| --- | --- | --- |
| Keep `q` in the URL | Present: `restaurant in Phuket`. | Partial pass |
| Populate the visible map search field | It remained empty. | **FAIL** |
| Call `/api/maps/geo-extract?q=restaurant in Phuket` | No browser request observed. | **FAIL** |
| Call `/api/search/universal?q=restaurant in Phuket&surface=map` | No browser request observed. | **FAIL** |
| Pan map to Phuket | Map remained centered on Philadelphia. | **FAIL** |
| Show local Phuket business results/pins | Not demonstrated. | **FAIL** |
| Fetch discoverability pins | `/api/maps/discoverability-pins` was fetched. | Pass |

The new bundle removed one guard and correctly mounted the pin-fetch layer, but the handoff effect still does not execute. Server-side geo-extract and universal-search responses are not a substitute for the browser actually calling them.

### One narrowly scoped correction

Replit must change **only** `artifacts/web/src/pages/map.tsx` and one focused browser/component test. In the final effect, ensure the route query triggers `runUniversalSearch(handoffQuery)` after the actual map readiness state becomes true.

The failure is most likely a mismatch between the effect’s `ready` condition and the real map-ready state or an unstable/stale `runUniversalSearch` dependency. Replit must add a test that mounts `/map?q=restaurant%20in%20Phuket`, asserts one geo-extract request, one universal-search request, populated input, and Phuket map center. Do not report it fixed from source inspection or server endpoint success.

## 3. Coordinate state — truthful but incomplete

The claimed live coordinate state is independently confirmed.

| Collection | Total | Valid pairs | Missing/invalid | Current disposition |
| --- | ---:| ---:| ---:| --- |
| Tour cultural sites | 599 | 95 | 504 | 95 valid pins available; remainder excluded. |
| Recurring events | 85 | 8 | 77 | 8 valid pins available; remainder excluded. |
| Community organizations | 61 | 0 | 61 | No map pins available. |
| Map adapter | 103 | 103 valid | 0 invalid served | Correctly filters null/invalid records. |

This is a truthful and policy-compliant posture after the unsafe public-Nominatim batch was disabled. It is not equivalent to the earlier claim that all tours, recurring events, and organizations are map-ready. The remaining unlocated real records must remain excluded until an authoritative or properly licensed provider-backed coordinate process is approved.

## 4. Capacity proof assessment

Replit supplied a staged 1 → 5 → 15 → 30 internal bootstrap table reporting zero 5xx and zero waiting connections. This is encouraging but does not yet authorize the independent final audit because the required map journey remains broken.

Two clarifications are required when the handoff is fixed:

1. The reported Stage 4 pool value is `total: 50` with `max: 50`. Under the written `poolTotal >= 80% of pool.max` abort rule, that would be a threshold breach, even if all 39 observed connections were idle and `waiting` was zero. Replit must identify whether `total` means allocated clients, active database sessions, or active work, and revise the observable/abort metric to use the correct pressure signal rather than treating a preallocated idle pool as saturation.
2. The table reports a per-stage `2xx` count equal to account count, not the expected number of endpoint requests, and does not include the required cache hit/miss/coalesced totals. Replit should provide the endpoint-level request totals and cache metrics in the final package.

No additional 30-user load was generated independently. It should begin only after the single map-handoff failure is fixed and its browser proof is shown.

## 5. Final decision

| Requirement | State |
| --- | --- |
| Bundle identity and readiness telemetry | Pass |
| City-scoped events and fuzzy local search | Pass |
| Map discoverability-pin fetching | Pass |
| Adapter coordinate validation | Pass |
| Truthful coordinate exception state | Pass, but coverage remains incomplete |
| Phuket directory-to-map handoff | **Fail** |
| Final staged 30-user audit | **Hold for one narrow map fix and corrected capacity evidence** |

Once Replit supplies the browser proof for the one remaining map effect and clarifies the capacity measurement, Manus can immediately run the final independent staged 1 → 5 → 15 → 30 audit.

## References

[1]: https://www.mappingwithmelanin.com/api/version "Verified production deployment identity"
[2]: https://www.mappingwithmelanin.com/api/readyz "Verified production readiness telemetry"
[3]: https://www.mappingwithmelanin.com/map?q=restaurant%20in%20Phuket "Failed authenticated Phuket map-handoff route"
