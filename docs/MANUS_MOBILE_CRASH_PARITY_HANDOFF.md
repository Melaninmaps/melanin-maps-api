# Mapping With Melanin — Manus Mobile Crash & Parity Handoff

**Prepared:** 2026-08-26  
**Purpose:** Provide Manus with a bounded, code-grounded audit package for the Expo application on iOS and Android.

## Audit objective

Audit the mobile app against the existing web experience, identify reproducible crash risks and high-impact parity gaps, and recommend only targeted fixes. The audit must not become an unbounded feature rewrite.

## Hard constraints

- Do not deploy to production.
- Do not submit to App Store Connect or Google Play.
- Do not change EAS build numbers.
- Do not replace Expo, Expo Router, React Native, maps, authentication, or storage architecture.
- Do not change KinfolkAI, database schema, unrelated business workflows, or production data.
- Do not duplicate the shared web/API media repair owned by Task #361.
- Do not duplicate cultural-site link work owned by Tasks #285 and #370.
- Treat server-side cultural-site `slug` failure as an existing queued issue, not a mobile fix.

## Existing queued work

| Area | Owner task | How this audit should interact |
|---|---:|---|
| Community media upload repair | #361 | Verify mobile consumes the repaired contract; do not create a second server implementation. |
| Cultural-site links / blank pages | #285 | Verify mobile navigation and external-link handling after the shared fix. |
| Cultural-site release verification | #370 | Do not deploy; record the route/API control journey only. |
| Mobile crash/parity audit | #371 | This package. |

## Preliminary parity matrix

Status values are based on source inspection and should be confirmed by runtime testing.

| Critical journey | Web evidence | Mobile evidence | Preliminary status | Audit priority |
|---|---|---|---|---|
| Sign in and session restoration | Web auth provider and protected routes | Root auth gate, session expiry watcher, SecureStore token flow | Present, separate implementations | P0 |
| Community feed load / refresh / empty state | `web/src/pages/community.tsx` | `mobile/app/(tabs)/community.tsx` | Present; mobile has explicit error state | P0 |
| Create community post | Web compose modal posts JSON | Mobile composer posts JSON from the same community endpoint | Present; verify response envelope and reset behavior | P0 |
| Upload image/video for a post | Web uses `/api/media/upload?purpose=community_post` | Mobile uses `/api/community/media/upload/image|video` | Different server endpoints; Task #361 owns shared repair | P0 |
| Preserve uploaded media in submitted post | Web serializes `mediaUrls` | Mobile maps uploaded URLs into `mediaUrls` and clears only after success | Present in source; must verify persisted/reloaded rendering | P0 |
| Render post media after reload | Web renders image/video URLs | `CommunityPostCard` renders URL-derived images and video placeholders | Present; malformed URL/list handling needs runtime confirmation | P0 |
| Cultural-site list/detail | Web canonical cultural-site pages | Mobile `cultural-heritage.tsx` list/detail flow | Present; API failure and URL failure states need confirmation | P0 |
| Cultural-site official/support links | Web uses server-provided URLs | Mobile calls `Linking.openURL` directly in multiple places | Present but URL validation/error feedback is inconsistent | P0 |
| Business/place detail control | Web business/place pages | Mobile business detail and map routes | Present; external URL and map deep-link handling differs | P1 |
| Map load and GPS permission denied | Web map fallback | `FullMapView` / `BusinessMapView` request location with timeout and default region | Guarded; verify native map readiness and malformed coordinates | P0 |
| Map cultural markers | Web map cards | Mobile native map markers with Android Fabric safeguards | Guarded by existing tests; re-run on both platforms | P0 |
| Error boundary / crash replay | Web error UI | Root `ErrorBoundary` and AsyncStorage/Railway crash logger | Present; native pre-JS crashes remain outside JS logger | P0 |
| Native configuration | N/A | `app.json`, Expo plugins, iOS/Android identifiers and permissions | Present; validate config and route imports before builds | P0 |

## Confirmed or directly observable risk candidates

These are audit targets, not claims that every item is already a production failure:

1. **High — partial multi-select media can be discarded.** Mobile accumulates upload results locally and commits them only after the whole loop succeeds. If a later upload fails or hits a tier limit, earlier successful uploads disappear from the composer state.
2. **High — media beyond five can be uploaded then dropped.** The picker permits five new images even when the composer already contains attachments, then slices the combined list to five. This can upload files that can never appear in the post.
3. **High — profile media parsing can crash the entire load.** The mobile user profile unconditionally calls `JSON.parse` on `mediaUrls`; malformed JSON or an array-shaped response can abort the whole post list. The web consumer supports both shapes.
4. **Medium — feed media parsing is shape-sensitive.** The main community and hashtag feeds parse only string-shaped `mediaUrls`, so a valid array-shaped response silently renders without media.
5. **Medium — malformed upload errors can escape the user-facing recovery path.** The upload failure branch assumes JSON, so an HTML/proxy/plain-text response can reject before a useful alert and before partial results are preserved.
6. **Medium — generic status composer has no media path.** `StatusComposer` posts text/mentions only. If it is exposed as a community entry point, media selected there cannot reach the API.
7. **Medium — video tiles are not playable.** The shared mobile post card renders a static video tile without a player or fallback action.
8. **Medium — URL opening is not centralized on mobile.** Several screens call `Linking.openURL` directly, including community link previews, business links, cultural-site links, and support links. Invalid or unavailable server-provided URLs can fail silently.
9. **Medium — mobile cultural-site list failures look like an empty database.** A failed list request becomes a normal empty state instead of an outage/retry state; the web detail flow distinguishes not-found from load failure.
10. **P0 audit requirement — location and map readiness are timing-sensitive.** Existing guards cover GPS-before-map-ready and cultural marker loading, but the native map surface must be exercised on iOS and Android with permission denied, timeout, empty coordinates, and a cold launch.
11. **P0 audit requirement — crash logging is JS-only by design.** The native Sentry module is disabled because of a prior pre-JS crash. Manus must distinguish native crash coverage from JS crash coverage and must not re-enable the native SDK as part of this audit.

The first seven findings came from source inspection and should be reproduced before implementation. The remaining items are explicit cross-platform verification targets.

## Local hardening completed during this audit

The following mobile-only repairs are now present in the source snapshot:

- Multi-select uploads respect the remaining five-item capacity.
- Earlier successful uploads remain attached if a later item fails.
- Non-JSON upload failures produce a recoverable message.
- Community, hashtag, and profile feeds accept array-shaped or JSON-text `mediaUrls` without crashing.
- Cultural-site, community, organization, and map links normalize bare domains, reject unsafe schemes, and show an unavailable-link message.
- Native directions use an HTTPS fallback when `maps://` or `geo:` cannot open.
- Expo web route discovery no longer crashes on the native-only map diagnostic route.

Validation on August 26, 2026:

- Mobile audit preflight: **PASS**
- Vitest: **31/31 PASS**
- Changed-file TypeScript filter: **no errors**
- Full mobile TypeScript check: **FAIL — 29 pre-existing errors**, preserved in `validation/mobile-typecheck.txt`
- Live Expo web preview: **launches without a fatal browser error**
- iOS/Android device build or submission: **not run; not authorized**

## Required verification journeys

### Mobile-compatible journeys

1. Cold launch with no location permission.
2. Cold launch with location permission and GPS timeout.
3. Map load with cultural layers disabled/enabled.
4. Map load with malformed or missing coordinates in API data.
5. Authenticated community feed load, refresh, empty/error state.
6. Select image, upload, see selected preview, submit a post, confirm the new post shows media, reload, confirm media remains.
7. Force an upload failure and confirm the composer remains open with a retryable error.
8. Open a cultural-site detail from the list/map and use official/support links.
9. Open a known-good business/place detail and verify its control path remains intact.
10. Kill/reopen after a JS error and confirm crash replay does not block app startup.

### Web control journeys

Use the existing web preview only as a control:

1. Community post with media: upload → submit → visible media → reload.
2. Cultural-site route: canonical URL → API response → detail page.
3. Known-good place route: `/places/:id` remains unchanged.

## Commands Manus should run

From `artifacts/mobile`:

```bash
pnpm typecheck
pnpm test -- --run
node scripts/pre-build-check.js ios
node scripts/pre-build-check.js android
pnpm exec expo config --json
```

The pre-build check is a gate, not permission to build or submit. Do not run EAS build or auto-submit commands for this audit.

## Important current-state note

The web cultural-site preview previously reached the API but received HTTP 500 because the server query referenced a missing `cultural_sites.slug` column. That is outside this mobile-only handoff and remains assigned to separate server/release work. Do not classify this as a mobile route-import failure.

## Evidence expected from Manus

- Platform and OS/device used for each finding.
- Exact route and interaction sequence.
- Whether the failure is native, JavaScript, network/API, or contract mismatch.
- Reproduction rate and whether a cold launch is required.
- Minimal fix recommendation and whether it belongs to #361, #285, #370, or #371.
- Screenshots or logs for crash/error states.
- Explicit separation of tested, not tested, and blocked journeys.
