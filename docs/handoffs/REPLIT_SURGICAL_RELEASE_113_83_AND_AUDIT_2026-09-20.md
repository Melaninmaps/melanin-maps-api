# Mapping With Melanin — Surgical Release 113 / 83 and Audit Handoff

**Release goal:** Ship the already merged, additive source to the production web/API, iOS **1.1.9 (113)**, and Android **1.1.7 (83)** without deleting functionality, content, records, authentication, payments, Community material, or directory data.

**This document is an execution contract, not a redesign brief.** Do not make opportunistic visual, schema, navigation, permission, pricing, authentication, or content changes while executing it. If any command fails, stop and record the exact error. Do not replace a failed check with a claim of success.

## Non-negotiable preservation contract

1. Every change is **additive** unless the founder explicitly approves a removal. The only previously approved removal is the old map shortcut strip; map search and sundown-town context remain available.
2. Posts, comments, reviews, profile images, approved videos, media, DMs, circles, follows, blocks, saves, memberships, business-owner flows, accounts, sessions, reset paths, alerts, Library entries, payment handoffs, and map data must remain intact.
3. A Community item is never deleted or hidden merely because a client updates. Retention and visibility remain governed by the existing report, moderation, and administrator workflow.
4. Cross-client parity means app and web consume the same API records for profiles, comments, reviews, posts, media, and business experiences. Visual layouts may differ by platform; underlying records and moderation decisions must not.
5. Do not claim a feature is live merely because a pull request is merged. Record source merge, web/API deployment, directory publication, native build, TestFlight/Play submission, and real-device validation separately.

## Exact source and version requirements

At the time this handoff was written, GitHub main is expected to be the reviewed release SHA supplied to the executor as `RELEASE_SHA`. The release executor refuses any SHA mismatch or dirty checkout.

| Platform | Public version | Required immutable build identifier | Production endpoint |
| --- | ---:| ---:| --- |
| iOS | 1.1.9 | **113** | `https://api.melaninmaps.com` |
| Android | 1.1.7 | **83** | `https://api.melaninmaps.com` |
| Web/API | N/A | Exact `RELEASE_SHA` and matching compiled identity | `https://www.mappingwithmelanin.com` / `https://api.melaninmaps.com` |

Do **not** reuse iOS builds 111 or 112, or Android version codes 81 or 82. They were already consumed or started. Do not increment 113 or 83 without a new explicit version decision and a source commit that updates the build record.

## Merged additive functionality that this release must preserve and deliver

### KinfolkAI

Kinfolk remains a capable general assistant with adaptive answer length: short when a direct answer is enough, detailed when a question needs explanation, sources, comparisons, or follow-up steps. It should distinguish factual questions, current-information questions, cultural consensus, and collective opinions. Factual/current claims require appropriate reputable sources; collective opinions such as a best rapper, best Spider-Man, or who “won” a music conflict should be clearly framed as opinion or cultural consensus, with measurable context such as awards, charts, or streams only when sourced.

The source includes cultural-language, typo-recovery, and ambiguity safeguards. It should assist instead of silently making a material assumption: offer a conservative correction or ask a clarifying question when an incorrect assumption could materially mislead. Direct user requests always override relevance suggestions. Kinfolk must not infer protected identity or distort facts based on member preferences. It gives factual, impartial, current information first, then a separately labeled optional relevance prompt based only on explicit, editable information the member chose to save.

Big Cousin and Professor remain selectable, persistent response modes. Big Cousin is relaxed and respectful; Professor is clear and structured. Neither mode invents facts or impersonates a human actor. Kinfolk can receive response feedback, and member controls retain reset, private-memory, and companion-forget capabilities. A companion is always secondary to the primary member and cannot override a direct request.

Voice capture uses the native recording path and sends transcription as text input only; it does **not** auto-send a prompt. The iOS capture mode is restored after recording ends or errors, overlapping capture attempts are blocked, and the audio is not persisted by the server. The next physical-device test must cover allow, deny/retry, Settings-enable, record/stop, transcription failure/offline, closing/backgrounding during capture, and TTS playback. Do not state that the microphone works until that real-device matrix passes on the fresh binary.

Kinfolk city briefings recognize requests such as “What should I know about Minneapolis?” and use current, sourced research. The factual city briefing comes first. An optional relevance lens is based only on explicit saved preferences; it is never identity inference. Community content remains opt-in, perspective only, and may not establish current, political, high-consequence, medical, legal, financial, safety, or factual claims.

### Private memory and Community consent

The release includes the following exact labels on web and mobile:

- **Save this to my private Kinfolk memory** — off by default, per-message opt-in, view/edit/forget available.
- **Use approved public Community posts** — this does not share the member’s chat. Community material is perspective, never evidence or a recommendation.
- **Manage memory** — opens the private Kinfolk memory manager.

Private memory must stay private to the signed-in account. Community context uses only public active non-private content, excludes reports, moderation-pending items, private profiles, blocked users, test material, and identifiers, and is shown as a generic unverified perspective rather than raw post text.

### Living Library

The Library is not an empty link directory. It contains source-governed starter entries and researches an initially uncovered topic through the approved provider path. The first such request may take longer; it must show meaningful research status rather than pretend the answer already existed. When safe, general, appropriately cited material is returned, it can be stored and reused for later searchers; member-specific material remains private.

Library web and mobile preserve structured explanations, source/article links, intent branches, next questions, and typo recovery. High-stakes medical, legal, and financial requests require appropriate source governance and must avoid personalized professional advice. HBCU and cultural/heritage panels are preserved; adding user content must remain category-scoped so academic information is not mixed with unrelated party or lifestyle media.

### Community and social-media experience

The Community feed preserves posts, comments, media, and retry/recovery states. The direct-feed repair removes only the problematic post-list flex growth that created a large blank gap; header, tabs, compose controls, authentication, media, and existing feeds remain. The new binary must show header, tabs, and compose/feed content immediately adjacent, without a large empty region.

Public approved video contribution remains a moderated workflow. A successful upload is not proof of public visibility: validate its status, moderation outcome, and designated public listing/media surface. Confirm that content created on web appears in the app and content created in the app appears on web when the same API record is public and not under moderation hold.

### Map, business discovery, and essential services

Map search remains present. Every mapped record with an MWM profile, including unclaimed and non-minority-owned public records, must link to the existing MWM detail route when selected. Map discovery adds an around-you card with nearby counts, optional focus controls, and radius choices; it does not override an explicit map/business search.

The next release includes an on-demand Essential Services layer for nearby appropriate public places such as hospital, pharmacy, police, fire, grocery, library, transit, and childcare categories. It uses governed server-side Places lookup, rate limits, explicit member action, and visible source/directions behavior. It must never claim that these are minority-owned, verified by MWM, or safety endorsements merely because they appear as a public-place availability result. Direct search takes priority over availability pins. Existing location consent, Google Maps behavior, mobile/tablet/Chromebook support, iPad multitasking, and responsive overlays remain enabled.

### Directory and personalized discovery

Directory candidates are **not** automatically live just because this release builds. The protected review database, signed manifest ingress, one-worker publication process, deduplication, online-only rules, provenance, receipts, and reconciliation guards must remain intact. Do not point review routes at the live production business database and do not weaken authentication, signatures, or holds. No publication statement is valid until review-service readiness, manifest receipt, worker receipts, search, map, and Kinfolk discovery tests provide evidence.

Existing personalized discovery should continue to prioritize explicit preferences and interaction signals when policy permits, while never overriding an explicit current search. It must not infer protected identity. A low-data/early-member fallback should show useful nearby or editorially governed options rather than random claims of personalization.

## Required executor

Use only the committed script:

```bash
RELEASE_SHA=<exact-current-main-sha> bash scripts/replit-release-113-83.sh prepare
# Inspect only the generated static-asset changes. Commit reviewed static changes to main.
RELEASE_SHA=<new-exact-main-sha> bash scripts/replit-release-113-83.sh verify
RELEASE_SHA=<new-exact-main-sha> bash scripts/replit-release-113-83.sh build
```

The script is intentionally strict. It verifies the SHA, a clean checkout, iOS 113, Android 83, iPad support, iPad multitasking, library/API/web/mobile typechecks, focused regressions, production builds, synchronized static artifacts, and iOS/Android prebuild guards before starting EAS. Immediately before starting EAS, it also requires the public production API’s Railway SHA and compiled-source SHA to match `RELEASE_SHA`, with healthy API, readiness, and Kinfolk health endpoints. This prevents a new binary from shipping against the stale public runtime that caused earlier regressions.

It uses the production API origin for both native builds. It requests an iOS production build with the existing TestFlight submit profile and produces an Android production AAB. It deliberately does **not** guess or add a Google Play submission track; a Play upload is a separate, auditable store action after the AAB completes and the intended Play track is confirmed.

## Required web/API deployment evidence

Before calling the release deployed, check all of the following after Railway rebuilds:

```bash
curl -fsS 'https://api.melaninmaps.com/api/version?identity_probe=<timestamp>'
curl -fsS https://api.melaninmaps.com/api/healthz
curl -fsS https://api.melaninmaps.com/api/readyz
curl -fsS https://api.melaninmaps.com/api/kinfolk/health
```

`railway_sha` and `built_from_sha` must match the actual deployed release source. Health and readiness must return healthy. Confirm the web page references the expected static bundle identity. A successful GitHub merge, a green Railway card, or a valid `/api/version` HTTP status is insufficient if the SHA or compiled source differs.

## Audit after the builds complete

Record separate evidence for each of these stages:

| Stage | Required proof |
| --- | --- |
| Source | GitHub main SHA, clean checkout, gate output |
| Web/API | `/api/version` matching Railway and compiled SHA, health/readiness, static bundle identity |
| iOS build | EAS build ID/URL, status, version 1.1.9 build 113 |
| TestFlight | EAS submit ID/status and App Store Connect/TestFlight processing state |
| Android build | EAS build ID/URL, status, version 1.1.7 code 83 |
| Play upload | Only if a reviewed Google Play submission is performed; record track and status |
| Physical iOS | Full Kinfolk voice permission/error/background matrix and Community direct-feed screenshot |
| Physical Android | Map location prompt/pin/detail behavior, Community direct-feed screenshot, library and Kinfolk request flow |
| Cross-client | Profile image, comments, reviews, Community post/media parity using the same API record |
| Directory | Separate review-DB readiness, signed ingress receipt, one-worker publication receipt, then search/map/Kinfolk evidence — or an explicit statement that publication remains blocked |

## Explicitly not a valid shortcut

Do not make a new build from a locally patched checkout. Do not suppress a failing test. Do not delete Community/media/business records to make a test pass. Do not replace an API base URL with a staging endpoint in the production profile. Do not reuse an older native build number. Do not declare directory data searchable without receipts and public discovery proof. Do not declare microphone functionality fixed without testing the new binary on a physical device.

## Stop conditions

Stop and return the exact error rather than improvising if any of the following occurs: EAS authentication is absent; EAS project identity differs; exact SHA is not main; checkout is dirty; any release gate step fails; public API identity is stale; native build version conflicts; upload/submission fails; the review database route is not isolated; or a real device reveals a regression.
