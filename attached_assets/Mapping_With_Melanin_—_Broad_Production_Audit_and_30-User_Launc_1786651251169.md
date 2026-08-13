# Mapping With Melanin — Broad Production Audit and 30-User Launch Gate

**Audit date:** 2026-08-13  
**Production URL:** https://www.mappingwithmelanin.com  
**Observed release:** `0c8987d088256617d7fec9c7a16a09ac51877dd1`  
**Independent decision:** **Do not invite testers or run the 30-user canary yet.**

## Executive decision

The application is running on a non-stale production bundle. Authentication, the database readiness endpoint, the connection pool, the map handoff, direct Library evidence views, profile rendering, Safety Hub, Circles, Guides, Marketplace, Connections, and core business-detail display all rendered during this non-mutating audit. The database pool is healthy: its maximum is 50 and the observed waiting count was zero.

However, the release does **not** meet launch readiness. First, authenticated Kinfolk chat returns HTTP 500 `KINFOLK_ERROR` even for `What is 2 plus 2?`; this blocks the capacity canary because Kinfolk is part of the tester journey. Second, the Community feed still exposes Apple Reviewer, App Reviewer, and Smoke Test material. Third, the Explore route visibly serves fabricated/static business records and invented ratings, community-trust labels, safety scores, and recommendation percentages. These three items are launch-blocking.

> A feature is not considered complete because its screen loads. It is complete only when its data is real, its behavior is safe, its required workflow works end to end, and an independent acceptance test passes.

## Deployment and capacity preflight

| Check | Observed result | Decision |
| --- | --- | --- |
| Release identity | SHA `0c8987d0`; matching bundle hashes; `stale_bundle:false` | Pass |
| Database readiness | HTTP 200; database `ok` | Pass |
| Connection pool | Maximum 50; observed 0 waiting | Pass |
| Authenticated canary login | Isolated load-test login returned HTTP 200 | Pass |
| Member-keyed general API limiter | Deployed source previously confirmed to use member ID after authentication | Pass, subject to final canary |
| Kinfolk health probe | HTTP 200 `{ok:true}` | Insufficient alone |
| Authenticated Kinfolk smoke test | HTTP 500 `KINFOLK_ERROR` | **Fail / P0** |

The green Kinfolk health probe is not an acceptable launch check because it is green while the actual member chat route fails. Replit must add a post-deploy authenticated chat smoke test to the release gate.

## Broad feature and tab audit

| Surface | Observed outcome | Status |
| --- | --- | --- |
| Business directory API | Philadelphia braider search returned a real directory record; Washington DC, Columbia SC, and Phuket aliases returned results in the post-fix API audit | Pass |
| Map | `/map?q=Philadelphia%20braider` rendered ten results, View/Directions controls, and map canvas | Pass |
| Business detail | Real UUID-backed business record rendered; directions, empty community-safety state, Vibes, Community Says, and Claim entry shown | Partial pass |
| Contact/hours | Honest missing-hours copy shown; audited braider record has no phone/website/hours. One prior enriched record showed phone/website. Population-wide enrichment is not certified | Partial pass |
| Owner claim | Claim entry interface renders; no submission or administrator approval was performed | Not yet end-to-end certified |
| Safety Hub | Safety routes and reporting controls render; no report submitted | Interface pass; workflow unverified |
| Library | African Diaspora History direct deep link and three source links rendered | Pass |
| Kinfolk-to-Library | Cannot certify while chat itself fails | Blocked |
| Community feed | Apple Reviewer, App Reviewer, and Smoke Test posts remain visible to a normal member | **Fail / P0** |
| Profile | Full profile page, badges, privacy controls, and Kinfolk profile context rendered | Pass |
| Events | Page renders one Houston event card; city-specific API requests for Philadelphia, Washington DC, and Phuket returned zero current events | Partial / data-consistency review |
| Circles | Loads with a valid empty state and creation controls | Interface pass; creation/privacy unverified |
| City Guides | Loads with valid empty state and creation controls | Interface pass; creation/moderation unverified |
| Marketplace | Loads with valid no-listings state | Interface pass; posting/payment unverified |
| Connections | Loads with valid no-connections state | Interface pass; search/request/privacy unverified |
| Business Owners | Intake form renders; language conflicts with approved free universal claim process and displays unsourced `94/100 Avg. Confidence Score` | **Fail / policy/data integrity** |
| Explore | Displays six illustrative/static businesses at `/businesses/1`–`/businesses/6` with invented scores and labels | **Fail / P0** |

## Launch blockers requiring surgical implementation packages

### P0-A — Repair authenticated Kinfolk chat

The route must return a valid assistant response for an authenticated normal tester and an `is_load_test=true` account before any canary. Apply the previously prepared schema and graceful-degradation package, retrieve the sanitized `[kinfolk-chat-error]` request-time line, and prove the actual error is gone. A provider-only health endpoint is not sufficient.

### P0-B — Remove public reviewer, smoke-test, and demo feed content

The claimed `is_load_test` suppression did not take effect in the live Community feed. Replit must identify the exact feed query used by both Everyone and Following views, exclude all load-test/system/demo identities there, and remove or soft-delete the known reviewer/smoke records. The repair must be tested in the rendered browser feed under a normal member account, not only at SQL or route level.

### P0-C — Replace or hide the fake Explore route

The Explore page must never show fabricated businesses, ratings, safety scores, ownership designations, community-trust labels, or recommendation percentages. Rebuild it against the real business directory and only display aggregate community values when qualified real feedback exists; otherwise show the same empty-state language used by real business pages. If the real integration cannot be completed safely in the current release, hide the route and remove it from navigation until it is ready.

### P1-D — Align business owner copy with the approved owner-claim model

The page must say that businesses can claim a qualifying listing for free; that claim approval and verification are separate; and that community data is not overwritten by the owner. Remove or source the static confidence-score statement. The free universal claim path must be tested end to end using a real test listing before launch.

### P1-E — Resolve event data expectations

Clarify whether the Events page is a curated showcase or a city-aware live event directory. If it is city-aware, align frontend city selection, the API, and date filtering so Philadelphia, Washington DC, and Phuket do not appear empty merely because a separate Houston showcase card exists.

## Staged 30-user canary: not yet run

The proposed staged canary remains the correct final capacity test, but it must not be used to diagnose a known functional P0. The entry condition is one successful authenticated Kinfolk chat for both a standard member and a load-test member, with `pool.waiting:0`.

After that proof, run the isolated 30-account canary as follows:

| Stage | Active authenticated members | Required member actions | Continue only when |
| --- | ---: | --- | --- |
| 1 | 1 | Login, preferences, Library graph, business search, map pins, Travel route, Kinfolk chat | All expected responses are 2xx; no generic 429/5xx; no waiting pool clients |
| 2 | 5 | Same journeys, with one staggered Kinfolk chat each | Same thresholds hold |
| 3 | 15 | Same journeys, with one staggered Kinfolk chat each | Same thresholds hold |
| 4 | 30 | Same journeys, using the 20 launch cities and two Phuket sessions as assigned | Every required operation passes and the pool shows no sustained waiting |

The canary should reuse each login session after its first authentication. It must keep IP protections on login and unauthenticated routes, while the general authenticated API limiter keys requests by member ID. The canary must abort on a generic rate-limit response, unexpected 5xx, or two consecutive readiness samples with pool waiting greater than zero.

## Permanent process rule now recorded

`OPS-SURGICAL-CHANGE-001` has been added to the permanent operating-standard register. Every future Replit change must have a surgical implementation package containing exact file scope, data-migration order, route/UI modifications, automated tests, deployment/rollback steps, expected proof, and an independent acceptance test. A verbal status update or a source-only check cannot mark a change complete.

## Required proof package before the next audit

Replit must provide a non-stale deployment identity, test output for the three P0 repairs, the sanitized successful and failing Kinfolk request logs, a rendered normal-member screenshot or recording of the Community feed without test posts, a rendered Explore result sourced from real UUID business records with no fabricated scores, and two successful authenticated Kinfolk chat responses. Only then will the staged 1 → 5 → 15 → 30 production canary run.

