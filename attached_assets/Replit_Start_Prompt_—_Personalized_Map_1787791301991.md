# Replit Start Prompt — Personalized Map

Paste this into Replit after Task #373 checkpoint 1 is committed:

> Implement the attached `PERSONALIZED_MAP_REPLIT_DIRECTIVE.md` on a new branch named `feature/personalized-map-v1`. Do not modify or merge into `release/task-373-rc`. Preserve the existing finite-coordinate guards, location timeout, selected-place sheets, cultural-site behavior, safety layers, and native crash hardening in `BusinessMapView`/`FullMapView`.
>
> Add a feature flag named `personalized_map_v1`, defaulting **off** for production and the Task #373 signed candidates. Build a Mapping With Melanin category-summary rail above the map, with viewport counts, category-specific markers/clusters, a synchronized result list, selected-place detail actions, `For You / All`, `More categories`, `Why am I seeing this?`, edit/pin/hide/reset controls, retry/fallback states, and a non-map accessible list.
>
> Rank category order and place results using explicit interests plus first-party save/search/detail/directions/share behavior. Personalization may reorder and de-emphasize categories but may not make them unreachable. A museum-focused seeded user must see `Arts & Culture` first and must not see `Nightlife` in the first five unless they explicitly search/select it or its affinity passes the threshold. Safety information is never personalized away.
>
> Implement a validated viewport discovery endpoint and privacy-safe discovery-event endpoint using the contracts in the directive. Adapt current stored category/subcategory values to the presentation taxonomy without rewriting existing records. Validate bounds, cap area/results, reject invalid coordinates, cancel stale requests, debounce map movement, cluster large result sets, and fall back to the current map on any discovery failure.
>
> Add and run MAP-01 through MAP-15 unit/API/browser/native tests. Provide the category adapter table, API schemas, seeded museum-profile fixture, file-by-file diff, desktop/mobile screenshots, iOS/Android recordings, performance/network logs, accessibility output, and a PASS/FAIL/BLOCKED matrix. Do not call the work complete if only the visual cards render; counts, filters, markers, list, detail actions, user controls, fallback, analytics, and flywheel journeys must all pass.
>
> Return checkpoints only: **(1) API/taxonomy/personalization tests, (2) web map and accessibility evidence, (3) native signed-preview evidence and final feature GO/NO-GO.** Do not enable the production flag or merge to the release branch without explicit authorization.
