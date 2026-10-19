# Library No-Surprise Cost-Control — Controlled Source Handoff

**Status:** SOURCE COMPLETE on an isolated, non-authority branch. It is **not integrated**, staging-verified, Web-verified, iOS-verified, Android-verified, or founder-accepted.

## Exact source candidate

- Branch: `fix/library-cost-control-usage-20261018`
- Source commit: `1005b80331f26d811f0e2ecbbc64978a7988d0d1`
- Source parent: `0b051808c184e993bf3851537cfd12ef84726d1c`
- Latest stable authority supplied by the active integration owner during this work: `3174e82f300ef6d679c39603b81039e3d18b7224` (local to that owner; do not infer that the source parent is current authority).

This is a bounded patch only. Do not merge it as a release, deploy it, run a migration, build mobile artifacts, change provider configuration, activate a provider/trial/account/subscription, or make a production change.

## Implemented boundary

### Free ordinary Library behavior

Ordinary Library landing/topic/collection browsing, text search, opening approved entries, source links, pagination, and related-question navigation remain catalog/application reads. Collection and cultural/HBCU links no longer carry a `research=true` trigger and cannot auto-start fresh research.

### Explicit fresh-research boundary

- `POST /api/library/research/preflight` first checks approved reusable content without a provider. An approved result is returned as `approved_content`, with `allowance.used = 0` and `allowance.charged = false`.
- `POST /api/library/research` returns approved reusable content without a provider when present.
- A fresh request without `confirmFreshResearch: true` returns `409 LIBRARY_RESEARCH_CONFIRMATION_REQUIRED` before provider work.
- A confirmed fresh request is fail-closed with `503 LIBRARY_RESEARCH_LEDGER_UNAVAILABLE` because there is no atomic Library allowance ledger. It must not call a provider, synthesis writer, persistence, or coverage-signal method.
- The new `libraryResearchAllowance.ts` is intentionally a fail-closed policy seam, **not** a billing/entitlement implementation and **not** a schema/migration change.

### Kinfolk question boundary

- Stable, approved Library answers are resolved before Kinfolk quota handling and persisted as deterministic answers; they do not increment the free monthly counter or paid pool and do not call a model/provider.
- A Kinfolk request that would need fresh Library research returns an explicit `open_research` action marked unavailable. It neither starts provider work nor consumes KinfolkAI usage.

### Client/account boundary

Web and native clients expose a provider-free availability check only after explicit member action. They accurately state that approved content is free and fresh research is disabled pending allowance protection. Account switch/sign-out changes clear member-scoped consent/research state and ignore late responses from the prior account; public catalog browsing remains available.

## Required controlled reconciliation

Reconcile this source commit **once** against the integration owner’s next stable authority, retaining all newer continuity-consent PR #313 protections, Entertainment cited-web work, safety/sharing repairs, owner-profile repairs, and any later privacy/memory fixes.

Review these likely-overlap paths intentionally:

1. `artifacts/api-server/src/routes/kinfolk.ts` — retain the owner’s current safety/privacy/memory routing; preserve the two Library changes only: approved answer before quota and explicit unavailable fresh-research action before quota.
2. `artifacts/api-server/src/library/registerLivingLibraryRoutes.ts` and `livingLibrary.ts` — preserve all current route/auth/policy protections while retaining reusable-only preflight and fail-closed fresh dispatch.
3. Web/native Library screens and collection-link helpers — retain any newer account/session handling while preserving no automatic fresh-research navigation and stale-response protection.
4. `replit/combined-release/ACCEPTANCE_MATRIX.md` — keep it as the single cumulative status/acceptance system and preserve the new `LIB-01` through `LIB-06` and `LIB-AT-01` through `LIB-AT-05` rows.

Do not use the source parent as authority and do not overwrite a current owner’s changes. If the authority moves, preserve this commit and rebase/cherry-pick only after the next stable SHA is supplied.

## Source validation completed

All validation was offline/source-only. No live provider request, paid-provider activation, migration, deployment, mobile build, AWS session, production mutation, or billing/entitlement/configuration change was performed.

- API TypeScript: passed.
- Web TypeScript: passed.
- Native TypeScript: passed using the established `--ignoreDeprecations 6.0` compatibility flag.
- API focused Vitest: **68/68** passed across Library route, Kinfolk route-wiring, and Library bridge suites.
- Web Library Vitest: **14/14** passed.
- Native Library Vitest: **14/14** passed.
- `git diff --check`: passed.

## Required authenticated acceptance after integration

Use the existing cumulative acceptance matrix only:

- `LIB-AT-01`: actual Web/iOS/Android browse/search/open proof with network/server evidence of no provider/model/embedding/allowance work.
- `LIB-AT-02`: actual approved Library and matching Kinfolk question, with approved observability proving no quota/pool change.
- `LIB-AT-03`: sparse question plus collection/cultural/HBCU paths; prove no auto-request and no outbound provider/writer/persistence action.
- `LIB-AT-04`: account A → sign-out/switch to B while a request is in flight across all three clients; prove no cross-account state/result leakage.
- `LIB-AT-05`: blocked pending separately approved atomic-ledger design and non-production provider authorization. It is not evidence available from this candidate.

No offline fixture, mock, direct database edit, source test, or browser-only check proves those authentic acceptance paths.

## Outstanding product decision

Fresh Library research remains unavailable by design until a future approved design provides all of the following: atomic pre-dispatch allowance reservation, idempotency/retry safety, provider/model/token/cost metadata, a member-visible allowance disclosure/confirmation, usage/reconciliation/audit records, and a tested failure/refund policy. That future work requires its own review and authorization; this candidate does not create or activate it.
