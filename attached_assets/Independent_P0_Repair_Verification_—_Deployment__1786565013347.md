# Independent P0 Repair Verification — Deployment `665c94d3`

**Verification target:** `https://www.mappingwithmelanin.com`  
**Verified at:** 2026-08-12 EDT  
**Deployment:** `665c94d388f1b91a40c588c60174b61fd7d13d6c`  
**Verdict:** **Partial pass. Do not begin the final 30-user production audit.**

> The server deployment is genuine and two city-filter fixes are live. However, the coordinate backfill is incomplete, the non-business map layer is incomplete, the authenticated Phuket directory-to-map handoff still fails in the live website, and no valid 30-account bootstrap-capacity proof was supplied. Those are launch gates, not cosmetic issues.

## 1. Live deployment and basic endpoint verification

| Check | Independent result | Status |
| --- | --- | --- |
| Deployment identity | `/api/version` returns Railway SHA `665c94d3`; `bundle_sha256_self` matches `bundle_sha256`; `stale_bundle: false`. | **PASS** |
| Readiness | `/api/readyz` returns `status: ok`, `db: ok`, and pool `{ total: 1, idle: 1, waiting: 0 }` while idle. | **PASS — idle only** |
| Isolated member login | `POST /api/auth/login-email` succeeded; `mustChangePassword: false`. | **PASS** |
| Basic authenticated reads | Preferences, Kinfolk sessions, and African Diaspora History Library graph each returned HTTP 200 in single-request verification. | **PASS — single request only** |
| Pool maximum visibility | `/api/readyz` does **not** expose the configured pool maximum required to calculate safe saturation percentage. | **NOT PROVEN** |

A green readiness endpoint at idle does not demonstrate performance under 30 simultaneous member bootstraps. [1]

## 2. City-filter repairs

| Test | Independent live result | Status |
| --- | --- | --- |
| `GET /api/events?city=Philadelphia` | `total: 0`, no leaked Houston event. | **PASS** |
| `GET /api/events?city=Phuket` | `total: 0`, no leaked Houston event. | **PASS** |
| `GET /api/businesses?city=Phuket&search=hair&limit=20` | `total: 0`, `businesses: []`; no Washington Hair by Kamaria fallback. | **PASS** |

The event filter and city-constrained fuzzy-search repairs are working on production.

## 3. Coordinate and discoverability verification

The live data does not support the claim that all 745 missing records have been geocoded and are automatically map-ready.

| Collection | Live rows examined | Valid coordinate pairs | Still missing/invalid | Required state | Result |
| --- | ---:| ---:| ---:| --- | --- |
| Tour cultural sites | 599 | 95 | 504 | 599 valid, or a documented real-data exception list | **FAIL** |
| Recurring events | 85 | 0 | 85 | Valid coordinate-backed rows available to map | **FAIL** |
| Community organizations | 61 | 0 | 61 | Valid coordinate-backed rows available to map | **FAIL** |
| Cultural sites | 1,000 returned by API limit | 624 | 376 | Invalid rows must be excluded from map pins or repaired from verified sources | **INCOMPLETE** |
| Phuket tour sites | 2 | 2 | 0 | Big Buddha and Wat Chalong remain map-eligible | **PASS** |

The new API fields are real: all 85 recurring-event responses and all 61 organization responses now include `latitude` and `longitude`. Their values are currently null, so the data remains unusable for pins.

### Map adapter result

`GET /api/maps/discoverability-pins` is authenticated and returns 82 valid pins, all of type `tour_cultural_site`. It returns **zero** `recurring_event` and **zero** `community_organization` pins because their coordinates remain null.

> The endpoint is correctly filtering invalid coordinates, but the live collection is incomplete. It cannot be represented as a completed map-readiness repair.

## 4. Authenticated Phuket map-handoff verification

The handoff has **not** passed independent live verification.

I applied `/map?q=restaurant%20in%20Phuket` in an authenticated website map session after Google Maps loaded. The browser retained the `q` parameter, but the search control did not populate, the page body did not contain Phuket, no universal-search API request occurred, and the visual map remained centered on Philadelphia.

The browser’s observed requests included `/api/businesses/map-pins`, `/api/cultural-sites`, `/api/events`, and `/api/sundown-towns`, but did not include either a universal-search request or `/api/maps/discoverability-pins`. The new map-pin adapter therefore is not being consumed by the rendered map in this journey.

| Acceptance condition | Independent result | Status |
| --- | --- | --- |
| Query string retained | Yes: `q=restaurant in Phuket`. | Partial |
| Search input populated | No. | **FAIL** |
| Map pans to Phuket | No; it remained Philadelphia. | **FAIL** |
| Universal search runs once | No request observed. | **FAIL** |
| Matching Phuket pins shown | Not demonstrated. | **FAIL** |
| New discoverability-pin layer fetched | No request observed. | **FAIL** |

## 5. Capacity repair assessment

The claimed 5-second session coalescing, 30-second preferences cache, and 5-minute Library graph cache may exist in source, but no supplied or independently observed proof demonstrates that they resolve the prior 30-user simultaneous bootstrap failure.

The required capacity evidence is missing:

1. No staged 1 → 5 → 15 → 30 status/latency table for preferences, sessions, and Library graph reads.
2. No cache `hit` / `miss` / `coalesced` metrics.
3. No pool sampling across the burst, including configured maximum.
4. No proof that no 503 occurred at the 30-user stage.

Because coordinates and the Phuket map flow already fail, I did **not** trigger the final 30-user audit. Running it now would spend production capacity before the agreed launch experience is complete and would not satisfy the final gate.

## 6. Immediate corrective instructions — one narrow follow-up

Replit must make no unrelated changes. The following specific work remains:

1. **Stop treating the background coordinate job as complete.** Obtain a post-job production count after all writes finish. The pass condition is not “job started”; it is valid coordinates in the real database and usable pins in the live UI.
2. **Fix the map handoff execution, not only query parsing.** In `map.tsx`, verify the handoff `useEffect` actually runs after map readiness and has stable `runUniversalSearch` dependencies. It must invoke one search from `q`, populate the visible field, pan to Phuket, and request/render local result pins. Add the discoverability-pin fetch to the active map data-load lifecycle; the browser shows it is not being fetched.
3. **Do not use the public OSM Nominatim server at 100 ms/request for a 745-row background/boot process.** The official policy allows an absolute maximum of one request per second, strongly discourages periodic bulk geocoding, requires caching, and warns that scripts run at regular intervals have an even lower four-requests-per-minute restriction. Use a properly licensed geocoding provider, an approved one-time paced/imported dataset with provenance, or a self-hosted/provider Nominatim instance. [2]
4. **Do not fabricate coordinates.** Keep rows without an authoritative address/source off the map and report the real exception count.
5. **Submit the missing capacity proof** only after the map and coordinate gates are complete: 1 → 5 → 15 → 30 bootstrap metrics, endpoint statuses/latencies, cache metrics, pool total/idle/waiting/max, and no 503.

## 7. Final decision

| Gate | State |
| --- | --- |
| Production identity and bundle integrity | Pass |
| Event city filtering | Pass |
| City-constrained fuzzy business fallback | Pass |
| Tour/recurring/organization coordinate readiness | Fail |
| Non-business map-pin coverage | Fail/incomplete |
| Phuket directory-to-map handoff | Fail |
| 30-user bootstrap repair proof | Not proven |
| Final 30-user audit | **Not authorized to start** |

The fastest valid path is a single narrow follow-up deployment for the map effect/data-load path and a compliant, provenance-backed coordinate completion process. Replit should then provide the one proof package specified in the final completion ticket; Manus can immediately rerun these exact gates and, if they pass, start the staged capacity audit.

## References

[1]: https://www.mappingwithmelanin.com/api/version "Verified production deployment identity"
[2]: https://operations.osmfoundation.org/policies/nominatim/ "Official Nominatim usage policy"
