# Local Map Dry Run — All Revised Candidates

This is a non-mutating route/data contract check. The current universal list endpoint filters `entity_kind=public_art` and city. No candidate has a universal entity, so no candidate appears in the map, directory, search, Kinfolk, mobile app, or public route.

| Candidate | Correct future city/category | Local-placement result | Business/global-fallback result |
|---|---|---|---|
| `stage1-atl-auburn-avenue-bas-reliefs` | Atlanta / Public Art | Blocked: no authoritative work point. | No behavior changed; no business route or fallback introduced. |
| `stage1-phl-black-family-reunion` | Philadelphia / Public Art | Source point available; corroboration hold remains. | No behavior changed; no business route or fallback introduced. |
| `stage1-phl-our-voice-our-strength` | Philadelphia / Public Art | Source point available; corroboration hold remains. | No behavior changed; no business route or fallback introduced. |
| `stage1-phl-mallkuanka` | Philadelphia / Public Art | Blocked: source location label discrepancy. | No behavior changed; no business route or fallback introduced. |
| `stage1-chi-paul-laurence-dunbar-monument` | Chicago / Public Art | Official work point identified; Gate 1 hold remains. | No behavior changed; no business route or fallback introduced. |
| `stage1-chi-indian-land-dancing` | Chicago / Public Art | Blocked: source points are unreconciled. | No behavior changed; no business route or fallback introduced. |

No city-level pinning is proposed. No ranking, closest-two, local-result, or global-fallback logic was changed.