# Mapping With Melanin™ — Live Audit Evidence Log

**Audit start:** 2026-08-13 EDT

| Check | Observed result | Evidence | Status |
| --- | --- | --- | --- |
| Production release identity | `railway_sha=df605639b7bcbc3817d6c8eb5b9fbe585f2d8289`; `built_from_sha=60c8e69...`; `bundle_sha256_self` matched `bundle_sha256`; `stale_bundle=false` | `GET /api/version` at audit start | Pass |
| Production readiness | `status=ok`, `db=ok`, pool `total=2`, `idle=1`, `waiting=0`, `max=50` | `GET /api/readyz` at audit start | Pass |
| Browser authentication state | Visiting `/login` resolved to the authenticated `/map` member experience, showing Profile navigation and protected map controls | Browser navigation/view | Pass for existing browser session; explicit fresh login remains to be tested |
| Map initial render | Authenticated `/map` rendered persistent `Loading map…` spinner with no map canvas/pins visible at first inspection | Browser screenshot and page markdown | Open P0/P1 finding pending a bounded wait and direct-query test |

No readiness or bundle-identity failure was observed at audit start. The map loading state remains under investigation and is not treated as resolved.

## Map initialization follow-up

A subsequent bounded wait on the same authenticated `/map` session completed successfully: the Google map canvas, Philadelphia-area tiles, and clustered/map markers rendered. The initial spinner was therefore delayed initialization rather than a confirmed persistent failure in this session. Direct query handoff remains separately untested.

## Authenticated business discovery

| Scenario | Observed result | Status |
| --- | --- | --- |
| Natural-language directory search: `Philadelphia braider` | Returned 10 results, led by `Philly Nigerian Braiding Salon (Queen of Africa)` in Philadelphia. Results had category, city, description, review state, and detail links. | Pass for this city/category query |
| Service-area-provider behavior | Search result establishes Philadelphia category discovery but does not establish the new service-area-without-address model because the leading result is labeled as a Philadelphia salon. | Pending dedicated service-area record audit |

The search transitioned from a visible loading state to rendered results on the authenticated web surface.

## Contact, hours, and closure-data coverage observation

An authenticated `GET /api/businesses?city=Philadelphia&limit=100` returned HTTP 200 and exposed `phone`, `website`, and `hours` fields. Within the 100 returned Philadelphia records, the API payload contained 14 website values, 0 phone values, 0 hours values, and 0 permanently-closed flags. The selected business detail rendered a correct safe fallback—`Hours not listed — call ahead to confirm`—rather than raw JSON, but it had no phone/website data to render.

**Interpretation:** The front-end raw-hours rendering defect may be repaired, but the statement that phone, hours, and website are present on every live business page is not verified and is contradicted for the audited 100-record sample: phone and hours are absent in that response set. This is a data-coverage finding, not proof of a front-end rendering failure. A business record with enriched phone/hours must be identified and tested directly before declaring the presentation feature passed.

## Launch-city directory coverage — API sample

Authenticated concurrent requests to `GET /api/businesses?city=<city>&limit=25` returned HTTP 200 for all 21 tested city strings. The sampled payload reported 25 records for Philadelphia, Atlanta, Houston, Los Angeles, New York, Chicago, New Orleans, Detroit, Baltimore, Memphis, Miami, Charlotte, Birmingham, Oakland, Newark, Richmond, and Nashville; 23 for Dallas; and 13 for Phuket. The literal query strings `Washington DC` and `Columbia SC` returned zero records.

Across the returned 25-record samples, no city had `hours` data, only Richmond had one `phone` value, and no sampled record exposed a permanently-closed flag. Websites appeared inconsistently (for example, Philadelphia 5/25, Atlanta 0/25, Dallas 8/23, Phuket 2/13).

**Open audit question:** The zero counts for the Washington DC and Columbia SC query strings may be a normalized-city-name contract mismatch or genuinely absent discoverability. Both must be checked against the visible directory search and the expected canonical city values before evaluating city readiness. The contact/hours enrichment coverage is materially incomplete in the tested production response samples.

## Directory-to-map handoff

Direct navigation to `/map?q=Philadelphia%20braider` initially showed the standard loading state, then completed successfully. The map rendered, the search input retained `Philadelphia braider`, and the results panel showed ten matching Philadelphia entries with `View` and `Directions` actions. This independently confirms the tested direct-query map handoff, including the browse-directory to map route, for this query.

## Kinfolk and Library handoff — authenticated API audit

Two authenticated requests to `POST /api/kinfolk/chat` returned HTTP 200 and a response field named `reply` (not `response`). However, the required Library behavior did not occur:

| Prompt | Observed `intentClass` | `libraryAction` | Reply behavior | Status |
| --- | --- | --- | --- | --- |
| `Tell me about African Diaspora History and show me the sources.` | `culture_entertainment` | `null` | Returned a reply payload but no evidence action or source list | Fail |
| `African Diaspora History` | `culture_entertainment` | `null` | Replied that it had no verified source and asked for more context | Fail |

Both payloads included `sources: []`, but the exact published topic did not resolve. This is a live regression against the required Kinfolk→Library handoff and must be repaired before a launch-readiness claim or final canary approval.

## Direct Library deep-link and evidence panel

Direct authenticated navigation to `/library?topic=fbfbc161-5121-4eca-a0a4-c35731b010f6&focus=evidence` rendered the `African Diaspora History` topic and its evidence panel. The browser showed three source cards and active external `View source` links for UNESCO, Smithsonian Folklife Festival, and Smithsonian NMAAHC. The direct Library surface and the `focus=evidence` behavior pass for this topic.

**Combined conclusion:** The Library itself is working for the audited topic, but the Kinfolk resolver is not handing the member to it. The failure is in the Kinfolk→Library matching/action path, not the Library topic/evidence view.

## Community feed content integrity

The authenticated public `Everyone` feed visibly contains non-production/demo identities and test content, including posts from `Apple Reviewer`, `App Reviewer`, and `Smoke Test`. One post explicitly reads `Smoke test post — ignore`; multiple other public posts present fabricated reviewer narratives as though they were community activity.

**Status: Fail / P0 content-integrity blocker.** These rows must be removed from public feeds (or migrated to non-public test fixtures) without deleting legitimate community posts. They must also be excluded from all counts, trending, notifications, recommendations, and any Kinfolk learning/growth signals. This confirms the previously reported demo/test-post issue remains live on deployment `df605639`.

## Member profile route

The authenticated `/profile` route loaded successfully and completed its asynchronous data render. It displayed the account name/email, save/review/activity counters, badges, safety-alert preferences, privacy controls, and Kinfolk profile summary. No HTTP 500 or error screen was observed in this session.

**Status: Pass.** The previously reported profile-page 500 is not reproducible on live deployment `df605639` for the authenticated Manus account.

## Events, cultural sites, recurring events, and non-business pins

Representative authenticated API checks produced the following results:

| Endpoint/query | Result | Audit interpretation |
| --- | --- | --- |
| `/api/events?city=Philadelphia&limit=10` | HTTP 200 with `{events: [], total: 0}` | No current Philadelphia event was returned. This is an empty result, not a response-shape issue. |
| `/api/events?city=Los%20Angeles&limit=10` | HTTP 200, zero events | Same empty-result behavior. |
| `/api/events?city=Phuket&limit=10` | HTTP 200, zero events | Same empty-result behavior. |
| `/api/cultural-sites?city=Philadelphia&limit=10` | HTTP 200, 10 city-correct sites with coordinates | Pass for sampled cultural-site query. |
| `/api/cultural-sites?city=Los%20Angeles&limit=10` | HTTP 200, 10 city-correct sites with coordinates | Pass for sampled cultural-site query. |
| `/api/tour-cultural-sites?city=Phuket&limit=10` | HTTP 200, 2 Phuket sites with coordinates | Pass for sampled Phuket tour-site query. |
| `/api/recurring-events?city=Philadelphia&limit=10` | HTTP 200, 10 Philadelphia entries with coordinates | Pass for sampled recurring-event query. |
| `/api/maps/discoverability-pins` | HTTP 200, 496 coordinate-valid non-business pins | Endpoint live; global result is not itself proof that every claimed content row is mappable. |

**Open finding:** the sampled current-events endpoint contains no current events in Philadelphia, Los Angeles, or Phuket. This may be legitimate date filtering or an event-data/readiness gap; it prevents a positive event-discoverability pass until the expected event schedule is reviewed.

## Owner claim entry path

On the audited unclaimed business detail page, the member-facing `Is this your business?` control opened a claim form without error. The form explains that claims are reviewed within 2–3 business days and requests full name, email, optional phone/website/Instagram, role, and supporting details. The form was not submitted; no claim was created or changed during the audit.

**Status: Partial pass.** The discoverable claim entry/UI is present for this unclaimed listing. Server-side rate limits, duplicate prevention, approval transaction, email-link delivery, admin decisioning, and post-approval owner permissions remain unverified and cannot be inferred from a visible form.

## Phone, website, and hours rendering

A direct audit of `Mama J's Kitchen` (Richmond, VA)—a live record carrying both phone and website fields—showed a clickable `tel:` phone link, a clickable official website link, and a linked Instagram entry. The contact card did not render raw JSON. It correctly rendered the safe fallback `Hours not listed — call ahead to confirm` because this specific record has no hours data.

**Status: Partial pass.** Contact links render correctly when underlying data exists. The raw-hours bug cannot be positively tested because no sampled launch-city record exposed hours data, and the feature claim that phone, hours, and website are available on every business page is not supported by the current data coverage.

## Deployed member-keyed rate limiter — source verification

The GitHub source at the live deployment SHA `df605639b7bcbc3817d6c8eb5b9fbe585f2d8289` contains the required authenticated limiter design:

- `generalApiKey(req)` returns `member:${req.user.id}` for authenticated traffic and a normalized `ip:` key only when no trusted session user exists.
- `authLimiter` remains normalized-IP keyed.
- `app.ts` runs `authMiddleware` before both `/api/auth` and general `/api` limiters, and mounts `authLimiter` at `/api/auth`.
- Kinfolk has a separate token-queue path and is skipped by the general limiter.

**Status: Pass for deployed source configuration.** The 30-user test can now meaningfully evaluate the live behavior rather than retesting the previously known shared-IP limiter defect.

## Washington DC and Columbia SC city-name normalization

The literal `city=Washington DC` and `city=Columbia SC` filters returned no rows, but natural search queries confirm the data exists under canonical database city names: `Washington` (and nearby Silver Spring) and `Columbia` / `West Columbia`. This is a city-filter normalization mismatch, not total content absence.

**Status: Fail for exact city-filter contract.** The directory and server must normalize expected test/campaign aliases such as `Washington DC`, `Washington, DC`, `Columbia SC`, and `Columbia, SC` to the canonical query values consistently across business, events, map, Kinfolk, and content endpoints.

## Staged production canary — executed result

A safeguarded production canary was executed against the verified deployment using only pre-seeded `is_load_test=true` accounts. The revised runner logged accounts in once and reused sessions to avoid a false hit on the intentionally IP-keyed login limiter.

| Gate | Result |
| --- | --- |
| Release identity | Pass: `stale_bundle:false`; runtime and recorded bundle SHA matched |
| Readiness/pool before Stage 1 | Pass: database healthy; pool maximum 50; waiting 0 |
| Stage 1 login | Pass: HTTP 200 |
| Stage 1 preferences, session history, Library graph, business search, map pins, protected travel surface | Pass: all HTTP 200 |
| Stage 1 Kinfolk chat | **Fail: HTTP 500 `KINFOLK_ERROR`** |
| Pool monitoring through failure | Pass: waiting remained 0; total connection count remained 1–4 of 50 |
| Stages 5, 15, 30 | Not run by design; runner aborts at the first failing stage |

A minimal isolated retest with the same load-test account and prompt confirmed the raw response: `{"error":"Kinfolk is having trouble answering that right now. Please try again in a moment.","code":"KINFOLK_ERROR"}`. This is not an IP-rate-limit event and not a database-pool failure. It is a production Kinfolk failure specific to the load-test session/context or its routed prompt path. The 30-user canary **failed at baseline 1/1**; the platform has not passed capacity certification.

## Kinfolk failure scope — follow-up diagnosis

The baseline canary failure is not prompt-specific: the isolated load-test account returned HTTP 500 `KINFOLK_ERROR` for both the local discovery prompt and `What is 2 plus 2?`. A same-prompt authenticated request from the Manus audit account subsequently also returned HTTP 500 `KINFOLK_ERROR`.

At the same time, public `GET /api/kinfolk/health` returned `{"ok":true}`. Therefore the health probe only proves that a minimal cached/provider probe can complete; it does **not** prove the complete authenticated `/api/kinfolk/chat` production path is functional. The live chat path is currently failing across accounts while the health indicator is green.

**Status: P0 functional blocker.** Replit must retrieve the sanitized `[kinfolk-chat-error]` Railway log record for the exact failure timestamps, including error code, provider status, queue counters, and stack/cause classification; correct the underlying chat-path defect; and add an authenticated chat canary to readiness/CI so a green provider probe cannot mask a broken member experience.
