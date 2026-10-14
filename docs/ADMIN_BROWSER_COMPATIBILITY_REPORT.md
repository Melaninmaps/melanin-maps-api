# Admin Browser Compatibility — Consolidated Report

**Status:** Repair implemented and validated in an isolated branch. **Not merged, deployed, or built for mobile.**

| Field | Evidence |
|---|---|
| Base source | `candidate/admin-direct-saves-release-20261014` at `13cbfe467bac8c0341d7a4ba8f0490c3e886d359` |
| Repair branch | `fix/admin-inventory-browser-compat` |
| Implementation commit | `dd45ad095ee007c911e01d47589300c58f8dd19e` (`fix(admin): surface inventory request failures`) |
| Production environment checked | `https://www.mappingwithmelanin.com` |
| Deployment / merge / mobile build | **None performed** |

## Confirmed root cause

The Admin **Business Inventory** loader in `artifacts/web/src/pages/admin.tsx` read every HTTP response as JSON and immediately treated a missing `businesses` field as `[]`.

> A rejected inventory response such as `401 {"error":"Authentication required"}` or `403 {"error":"Forbidden"}` was therefore processed as an empty inventory response. The same loader then received no `appliedFilters` confirmation and replaced the inventory/totals with zero values.

This is a client response-handling defect, not confirmed evidence of a Safari-only filter implementation. It explains why an authorization, session, upstream, or malformed-response failure can look like filters returned no records instead of showing the true failure.

The browser-engine probe confirmed that the same unauthenticated filtered Inventory request produces the same response in both engines:

| Engine | `GET /api/admin/businesses?...search=Philadelphia` |
|---|---|
| Chromium | `401`, JSON `{"error":"Authentication required"}` |
| WebKit (Safari engine) | `401`, JSON `{"error":"Authentication required"}` |

## Central repair made

A focused `readAdminJsonObject` helper was added at `artifacts/web/src/lib/adminResponse.ts` and used only by the Business Inventory loader.

It now:

1. Reads the response once.
2. Rejects a non-2xx response with the server message and HTTP status.
3. Rejects a non-JSON or non-object success response.
4. Requires an inventory array before the dashboard replaces confirmed UI state.
5. Keeps the most recently confirmed businesses and totals visible on a rejected, malformed, or filter-contract-mismatched response.
6. Shows the existing visible Admin alert with the actual failure and the statement that prior results remain visible.

The repair does **not** change `authenticatedFetch`, cookies, token persistence, Admin roles, API authorization, server routes, database data, business data, mobile code, or other dashboard tabs.

## Bounded cross-browser regression

The same deployed environment was checked in headless Chromium and WebKit with the same unauthenticated state.

| Surface | Chromium | WebKit | Result |
|---|---:|---:|---|
| `/login` | HTTP 200 | HTTP 200 | Equivalent route load |
| `/businesses` | HTTP 200 | HTTP 200 | Equivalent route load |
| `/map` | HTTP 200 | HTTP 200 | Equivalent route load |
| `/community` | HTTP 200 | HTTP 200 | Equivalent route load |
| `/safety` | HTTP 200 | HTTP 200 | Equivalent route load |
| `/travel` | HTTP 200 | HTTP 200 | Equivalent route load |
| `/profile` | HTTP 200 | HTTP 200 | Equivalent route load |
| `/settings` | HTTP 200 | HTTP 200 | Equivalent route load |
| Anonymous filtered Admin Inventory API | HTTP 401 JSON | HTTP 401 JSON | Equivalent rejection; no engine-specific response difference |

No console errors were emitted during those route checks. The code review also found explicit non-OK response handling in the bounded public/business-directory, Kinfolk memory/control, Community, member profile/settings, and Safety client paths inspected. **No additional shared browser defect is confirmed by this bounded check.**

## Tests and regression evidence

| Check | Result |
|---|---|
| Focused Admin response tests | **5 passed**: success, rejected API response, non-JSON response, wrong JSON shape, and Inventory-loader preservation wiring |
| Existing Admin business preservation tests | **6 passed** |
| Web TypeScript check | **Passed** (`tsc -p tsconfig.json --noEmit`) |
| Git whitespace check | **Passed** |
| Scope audit | Only the Admin page, one web response helper, one focused test, and repair records changed; no API, mobile, authentication/session, database, or migration source changed |
| Chromium/WebKit parity probe | **Passed** for the bounded same-environment anonymous route/API checks |

## Remaining device verification

A real authenticated Safari session was not available in this sandbox. The specific remaining check is deliberately narrow:

1. Sign into the same Administrator account in Safari and Chrome.
2. Apply the same deterministic Business Inventory search and city/source-batch filters.
3. Confirm matching returned rows and totals.
4. If a request fails, confirm the Admin page retains the last confirmed rows and displays the returned HTTP/error detail instead of showing a successful zero result.

This repair makes the previously ambiguous failure visible and prevents the false-zero outcome. If Safari still receives `401` or `403` after the repair, the UI will expose that response; the next investigation would then be the affected Safari session/token state, using the exact surfaced HTTP status rather than treating it as a filter defect.

## Production requirement

Production behavior remains unchanged until this isolated commit is reviewed, merged into the active production branch, and deployed through the existing web release process. No new mobile build is required because this is web Admin source only.
