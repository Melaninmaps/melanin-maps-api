# Live Philadelphia Nightlife Findings — 2026-08-12

## Authenticated live reproduction

Request 1:

```text
GET https://www.mappingwithmelanin.com/api/search/universal?q=Philadelphia%20nightlife&surface=map&limit=20
```

Observed live response summary:

- `intentType`: `general`
- `totalResults`: 16
- 15 businesses returned.
- All 15 have category `Entertainment & Recreation` and `matchTier: related_category`.
- 12 businesses are in Philadelphia, PA.
- 2 businesses are in Allentown, PA, and 1 is in Elkins Park, PA, despite the query naming Philadelphia.
- A Library topic named `Philadelphia Nightlife` is returned.

The live output is stored at `/home/ubuntu/nightlife_universal_live.json` and compact analysis at `/home/ubuntu/philly_nightlife_analysis.json`.

Request 2:

```text
POST https://www.mappingwithmelanin.com/api/kinfolk/chat
{"message":"Show me Philadelphia nightlife."}
```

Observed response:

- `intentClass`: `culture_entertainment`
- Natural-language reply was generic.
- `recommendations`: `null`
- `libraryAction`: `null`

This means Kinfolk classified the request correctly but did not invoke/reuse MWM business discovery to provide actionable Philadelphia nightlife results.

## Source-code finding

Source file: `artifacts/api-server/src/routes/universal-search.ts`.

- `CONCEPT_TO_CATEGORY` maps `nightlife`, `bar`, `club`, and `lounge` to `Entertainment & Recreation` and `Bar / Nightlife`.
- The city-aware Pass 2.5 detects city tokens in the raw query and can return Philadelphia matches.
- Pass 3 then fills remaining response slots using mapped category matching without passing the detected city as an explicit filter. Thus, after 12 Philadelphia matches, it may add Allentown and Elkins Park `Entertainment & Recreation` records to fill the response limit.
- The server currently uses category matching for related-category fallback but does not give nightlife subcategories and city-exact results an explicit final ranking guarantee.

## Required repair direction

1. When a city is detected by Pass 2.5, propagate it to every later business fallback pass or stop after city-scoped candidates. Never fill named-city queries with out-of-city records silently.
2. Define a `nightlife` intent bundle that ranks exact nightlife/venue subcategory tags and nightlife description/tags ahead of broad `Entertainment & Recreation` category matches.
3. Kinfolk must invoke the canonical universal search for actionable city + business-type requests such as "Show me Philadelphia nightlife," or return a transparent no-local-results response. It must not answer generically while omitting MWM discovery.
4. Do not fabricate or promote listings. Preserve only source-backed/real record data and attach exact rank/match reason in test outputs.

## Separate production issues still open

- Shawn Hill / Shawn Hill Homes has no exact production directory or map-pin record.
- Testimony Tattoos / Stephen Ross / Needles Art Studio has no exact production directory or map-pin record.
- A direct `/map?q=Shawn%20Hill` browser route repeatedly displayed `Loading map…` for more than ten seconds after the direct query, while the regular `/map` page initialized. This needs separate map-query loading-path diagnosis.
- The sandbox browser did not reproduce a 401 after one authenticated hard refresh: `/api/auth/user`, `/api/businesses/map-pins`, `/api/maps/discoverability-pins`, and `/api/kinfolk/preferences` each returned 200. The user-observed 401 therefore needs the exact route/response captured from their session to finish root-cause analysis.

## Evidence sources

- Live authenticated MWM API requests listed above, captured on 2026-08-12.
- Source repository route: `/home/ubuntu/mwm_source/artifacts/api-server/src/routes/universal-search.ts`.
- User report: Philadelphia nightlife returned irrelevant businesses.
