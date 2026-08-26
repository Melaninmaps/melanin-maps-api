# Mapping With Melanin Crash, Media, Link, and Feature-Parity Audit

**Author:** Manus AI  
**Date:** 2026-08-26  
**Delivery target:** Replit monorepo  
**Deployment status:** Not deployed

## Executive summary

The audit confirmed that the picture problem was not an upload-picker failure. The website successfully received a storage URL, then converted the `mediaUrls` array into a JSON string before sending it to an API that expected an array. The API encoded that string again, producing a double-encoded database value. After reload, the website could receive a string where its renderer expected an array, causing media to disappear or the post card to fail while rendering. The website now submits an array, the API normalizes both current and legacy values, and the website/mobile consumers safely accept array, JSON-string, malformed, and previously double-encoded shapes.[1] [2] [3]

The cultural-site failure had two independent causes. The canonical repository queried a production `cultural_sites.slug` column that the supplied audit evidence reported as missing, and the canonical route returned a flat object while the current website detail page expected a `{ site: ... }` envelope. The repository now derives a canonical slug from the existing authoritative name without a schema migration, and the route supports both the flat canonical contract and the current website envelope. The website also accepts either response shape and normalizes scheme-less official/support URLs before rendering them.[4] [5] [6]

The iOS/Android hardening aligns mobile media upload with the same `POST /api/media/upload?purpose=community_post` contract used by the website. Each successful attachment is committed immediately, selection respects the five-item remaining capacity, malformed error bodies cannot escape the recovery path, and the composer remains open with successful attachments preserved. Profile and feed parsing no longer call unsafe `JSON.parse` operations on unknown media shapes.[7] [8] [9]

> **Delivery boundary:** The supplied ZIP is a bounded source snapshot rather than the complete Replit workspace. All included fixes were patched, parsed, and regression-checked, but an authenticated live upload, real database write, deployed cultural-site route, and physical iOS/Android run still require the complete Replit project and its secrets.

## Confirmed failures and implemented repairs

| Area | Confirmed root cause | Implemented repair | Verification |
|---|---|---|---|
| Website pictures accepted but absent after reload | Website sent `mediaUrls` as a JSON string; API encoded the value again. | Website submits `string[]`; API normalizes inbound, stored, and outbound legacy shapes; web reload parser tolerates old rows. | Deterministic reproduction failed before the fix and passed after it; source-contract checks passed.[1] [2] [10] |
| Mobile post pictures inconsistent with website | Mobile used `/api/community/media/upload/image|video` with field names `image`/`video`, while the shared route uses `/api/media/upload` with multipart field `file`. | Mobile now uses the website/shared upload endpoint and field contract. | Static contract check passed.[7] [11] |
| Partial multi-select uploads disappeared | Successful results remained in a local array until every selected file completed. | Each successful upload is committed immediately; a later failure does not erase earlier successes. | Source-contract and behavior checks passed.[7] [10] |
| More than five files could be uploaded and then dropped | Picker allowed five new files regardless of existing attachments and sliced afterward. | Picker `selectionLimit` now equals remaining capacity before upload begins. | Source-contract check passed.[7] |
| Profile post list could crash | Profile loader unconditionally parsed `mediaUrls`, including valid array responses and malformed values. | Shared defensive parser handles arrays, encoded strings, double-encoded legacy strings, duplicates, and invalid input. | Behavior verification passed for all listed shapes.[3] [8] [10] |
| MLK House and similar cultural-site pages failed | Canonical SQL referenced a missing `slug` column; route and website response envelopes differed. | Slug is derived from `name` with UUID fallback; API exposes compatible aliases and both envelopes; website accepts either. | Syntax, patch, and source-contract checks passed.[4] [5] [6] |
| Scheme-less or invalid external links failed silently | Mobile callers invoked `Linking.openURL` directly and swallowed errors; web anchors used raw values. | Shared mobile opener validates allowed protocols, prefixes HTTPS when appropriate, supports server-relative URLs, checks device capability, and alerts users; website normalizes official/support URLs. | All audited raw mobile callers were removed; unsafe `javascript:` test is rejected.[6] [9] [10] |
| Cultural-site outages looked like an empty database | Mobile catch path set `sites=[]` with no error state. | Screen now distinguishes load failure from empty results and offers a retry action. | Source-contract check passed.[7] |
| Immediate mobile TypeScript blocker | Unused `NativeTabLayout` imported unavailable `Icon` and `Label` exports from `unstable-native-tabs`. | Removed the unused implementation without changing the active classic tab layout. | Patched file parsed successfully; source-contract check passed.[12] |
| Empty mobile API base in Replit/native edge cases | Several audited files duplicated a helper that returned an empty string when one environment variable was absent. | Audited components now use the canonical helper with Replit, EAS-domain, and production fallback behavior. | Patched files parsed successfully.[7] [8] [9] [12] |

## Cross-platform parity matrix

| Critical journey | Website | iOS/Android | Current status |
|---|---|---|---|
| Community feed load and reload | Defensive media normalization added. | Feed and profile use the same defensive parser. | **Source-fixed; authenticated runtime pending.** |
| Upload image for a community post | Uses shared `/api/media/upload` contract and submits array payload. | Uses identical endpoint, query purpose, multipart field, and array payload. | **Contract-aligned; storage/runtime pending.** |
| Preserve successful attachments after a later failure | Single-file website flow keeps completed URL state. | Each completed mobile upload is committed immediately. | **Fixed.** |
| Render legacy affected posts | Handles arrays, JSON strings, and double-encoded values. | Handles the same shapes in feed and profile. | **Fixed in source.** |
| Cultural-site list/detail | Accepts canonical or legacy detail envelope and safe official/support links. | Accepts canonical or legacy list envelope and shows retryable errors. | **Source-fixed; live MLK route pending.** |
| External website/resource links | Normalizes HTTP(S) links in audited cultural-site detail. | Centralized validation and user-facing failure feedback across community, cultural-site, and map surfaces. | **Fixed in audited surfaces.** |
| Video media | Website renders in-page video controls. | Mobile now exposes a functional “Open Video” action rather than a dead tile. | **Partial parity; native in-app player remains P1.** |
| Map permission denied, timeout, and readiness | Web remains the control experience. | Existing readiness guards remain unchanged and all 16 supplied map tests pass. | **Guard tests pass; physical devices pending.** |
| Crash replay and pre-JS native crashes | Website error UI unchanged. | Existing JS crash logger remains; native SDK was not re-enabled. | **JS path retained; pre-JS native coverage remains outside this patch.** |

## Validation results

| Validation | Result | Evidence |
|---|---:|---|
| Supplied archive checksum verification | **Pass** | Every entry in `SHA256SUMS.txt` matched before modification. |
| Deterministic source-contract checks | **15/15 pass** | Media, API, cultural-site, link, tab, and retry contracts passed.[11] |
| Patched TypeScript/TSX syntax parsing | **15/15 files pass** | TypeScript 6.0.3 parsed every changed `.ts` and `.tsx` file without syntax diagnostics.[13] |
| Supplied mobile unit tests | **27/27 pass** | Eleven auth-navigation tests and sixteen map-readiness tests passed under Vitest 4.1.10.[14] |
| Post-fix behavior verifier | **Pass** | Array, JSON-string, double-encoded legacy, malformed media, scheme-less URL, and unsafe-protocol cases passed.[10] |
| Strict patch application | **Pass** | `git apply --check --whitespace=error-all` passed against a pristine snapshot. |
| Patch idempotence and backup behavior | **Pass** | First run created a timestamped backup and applied; second run reported already applied with no changes. |
| Full monorepo TypeScript check | **Blocked by partial handoff** | The supplied pre-fix log already contained unrelated errors in files absent from the ZIP; the complete workspace is required to rerun and repair them.[15] |
| Live website, API, database, and object storage | **Not tested** | No live Replit project URL, authenticated session, secrets, or production authorization was included. |
| Physical iOS and Android runtime | **Not tested** | No simulator/device session or complete native workspace was included. |

## Replit application procedure

The delivery archive contains `replit/apply-fixes.sh`, `replit/mwm-crash-parity-fixes.patch`, and `replit/validate-fixes.sh`. From the complete Replit monorepo root, run the following commands:

```bash
chmod +x replit/apply-fixes.sh replit/validate-fixes.sh
./replit/apply-fixes.sh "$PWD"
./replit/validate-fixes.sh "$PWD"
```

The apply script checks the workspace revision before changing files, creates a timestamped backup under `.manus-backups/`, and exits safely if the patch is already present. The validation script writes a timestamped `summary.md` and individual logs under `validation/`. It does not deploy, run an EAS build, change version numbers, or submit to either app store.[11]

## Remaining release gates

The complete Replit workspace must pass its full TypeScript check because the captured handoff already showed errors outside the included files. Those errors include theme-contract mismatches, unavailable exports, Expo file-system API changes, and component signatures in files that were not supplied. The current patch removes the included unstable-tabs blocker but cannot safely modify source that is absent.[12] [15]

An authenticated preview must then verify website upload → submit → visible media → reload, followed by the same mobile journey on iOS and Android. The cultural-site control should use the actual MLK House UUID and confirm canonical route, API response, official link, and support links. Device validation must also cover denied location permission, GPS timeout, cold map launch, malformed coordinates, and crash replay. These are release checks, not evidence that the source repairs failed.

The generic `StatusComposer` remains text-focused, while the main community composer now carries the repaired media path. If the generic composer is exposed as a primary posting entry point, adding the same attachment UI is a follow-up parity feature. Native video playback also remains a follow-up because the supplied mobile package has no `expo-video` dependency; the current patch converts the dead tile into a working external-open action rather than adding an unreviewed native dependency.[9] [16]

## References

[1]: ../source/artifacts/web/src/pages/community.tsx "Patched website community page"
[2]: ../source/artifacts/api-server/src/routes/community.ts "Patched community API routes"
[3]: ../source/artifacts/mobile/lib/mediaUrls.ts "Shared mobile media normalization helper"
[4]: ../source/artifacts/api-server/src/routes/directory/canonicalCulturalSiteRepository.ts "Patched canonical cultural-site repository"
[5]: ../source/artifacts/api-server/src/routes/canonical-cultural-sites.ts "Patched canonical cultural-site routes"
[6]: ../source/artifacts/web/src/pages/cultural-site-detail.tsx "Patched website cultural-site detail page"
[7]: ../source/artifacts/mobile/app/(tabs)/community.tsx "Patched mobile community screen"
[8]: ../source/artifacts/mobile/app/user/[id].tsx "Patched mobile user profile screen"
[9]: ../source/artifacts/mobile/lib/openExternalUrl.ts "Shared mobile external-link helper"
[10]: ../validation/post-fix-contract-behavior.json "Post-fix deterministic behavior results"
[11]: ../replit/README.md "Replit patch and validation instructions"
[12]: ../source/artifacts/mobile/app/(tabs)/_layout.tsx "Patched mobile tab layout"
[13]: ../validation/post-fix-syntax-check.txt "Patched source syntax results"
[14]: ../validation/post-fix-mobile-tests.txt "Post-fix supplied mobile unit-test results"
[15]: ../validation/mobile-typecheck.txt "Captured pre-fix full mobile typecheck failures"
[16]: ../source/artifacts/mobile/package.json "Supplied mobile package manifest"
