# Community Intelligence and Private Kinfolk Journeys — Integration Completion Report

**Status:** Source integrated and safety-gated; **not released**
**Date:** 2026-10-14
**Integration branch:** `feature/community-intelligence-complete-integration-20261014`
**Authoritative base:** `origin/staging/kinfolk-full-candidate-20261014` at `f46d87edbcd1c1dd81e00e27c80558827846b947`

## Executive result

The Community Intelligence vertical slice and the private Kinfolk Journeys source implementation were reconciled onto the authoritative Kinfolk candidate without a Git conflict and without changing the existing Life Journeys API namespace. The final integration is deliberately **source-disabled**: it cannot create its own Community Intelligence tables at runtime, collect feedback by default, establish provider connections, or make provider network calls.

No PR, merge, deployment, database migration application, data backfill, feature-flag activation, provider/OAuth activation, native build, TestFlight, or Play submission was performed.

## Provenance and integration record

| Item | Source | Result on this branch |
|---|---|---|
| Authoritative Kinfolk candidate | `f46d87ed` on `staging/kinfolk-full-candidate-20261014` | Used as the integration base; active production was not reconciled. |
| Community Intelligence vertical slice | `4d4f27c6` | Cleanly cherry-picked as `0275c0f8`. |
| Private Kinfolk Journeys source | `3fd1851955bcc1754ca54736d4d6ef339432102f` | Cleanly cherry-picked as `d07caa0a`. |
| Runtime DDL safety repair | Integration-only follow-up | Replaced runtime table/index creation with a schema-readiness check and a reviewed source-only migration. |
| Duplicate imported root checklist | `TODO.md` from Journey source commit | Removed from integration scope; the retained implementation record is `docs/product/kinfolk-journeys/KINFOLK_JOURNEYS_SOURCE_IMPLEMENTATION_PLAN_2026-10-14.md`. |

## Feature-preservation and conflict matrix

| Protected area | Integration result | Preservation evidence |
|---|---|---|
| Existing Life Journeys | Preserved as the canonical `/journeys` API and existing mobile Journey behavior. | Private planning uses the separate `/kinfolk-journeys` namespace; route-contract tests check distinct registration. |
| Community Intelligence consent | Collection is default-off; each member must separately participate before structured feedback can be written. | Service tests cover disabled collection, missing storage, absent participation, opt-in recording, and revocation. |
| Private chat and member context | No ordinary chat text, private memory, location, documents, calendar, profile content, or raw message identifiers are placed in the Community Intelligence storage design. | Source-only schema comments, policy/service tests, and settings copy make the boundary explicit. |
| Privacy-suppressed Admin view | Admin receives only eligible aggregate category gaps, never raw events, member identities, exact locations, messages, or small-cohort counts. | Member wall plus admin check are contract-tested; the response deliberately omits counts and individual records. |
| Safety and high-consequence contexts | The suggestion catalog remains limited to the supported wedding/birthday planning scope and excludes medical, legal, financial, emergency, police, immigration, assault, and surveillance contexts. | Community Intelligence policy tests pass. |
| Kinfolk conversations and settings | Only narrow, transparent suggestion-card and preference-row adapters were added to the existing web/mobile Kinfolk surfaces. | Existing settings semantics were retained; collection-off UI states remain explicit. |
| Business discovery, owner tools, Community, Safety, and Admin permissions | No new ranking, ownership, verification, promotion, or administrator-permission behavior was introduced. | Diff audit found only the documented Community Intelligence/Journey adapters and tests. |
| Connected Apps / OAuth | No completed Connected Apps implementation was found or claimed. Provider scaffolding remains dormant. | No provider credential was added; connection routes are behind a feature gate and no network call can proceed by default. |

## Release and privacy gates now enforced

### Community Intelligence

`COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED` is effective only when set to the exact value `"true"`; the default is off. The service now checks whether the approved tables already exist and fails closed if they do not. A disabled path performs neither a schema write nor an event write.

The formerly lazy `CREATE TABLE IF NOT EXISTS` implementation was removed. The additive schema now lives only in:

- `artifacts/api-server/migrations/20261014_community_intelligence_source_only.sql`

That file is labelled source-only and is not referenced by the startup-migration implementation. Applying it still requires separate authorization for the target environment.

### Private Kinfolk Journeys and providers

Private Journeys remain behind `KINFOLK_JOURNEYS_ENABLED === "true"`, defaulting to unavailable. The private API remains separate from Life Journeys and is mounted after the authenticated member wall.

Provider network traffic requires both the private Journey feature gate and the additional `KINFOLK_JOURNEYS_PROVIDER_NETWORK_ENABLED === "true"` gate. When the Journey feature is off, the capability response masks provider readiness as disabled so configured-looking credentials cannot imply that Connected Apps is active. No OAuth transaction, token exchange, provider call, background sync, or member connection was run.

## Validation record

| Surface | Command or proof | Result |
|---|---|---|
| Community Intelligence and Journey API safety | Focused Vitest suite covering policy, service, route contract, parser, domain, providers, retention worker, and token vault | **PASS — 9 files, 36 tests** |
| Web type safety | `pnpm --filter @workspace/web run typecheck` | **PASS** |
| Web production bundle | `pnpm --filter @workspace/web run build` | **PASS**; existing source-map and large-chunk warnings only. |
| Web private Journey contract | Repository web Vitest config executed with the already-installed API workspace Vitest runner; no manifest change | **PASS — 4 tests** |
| Mobile private Journey contract | `pnpm --filter @workspace/mobile exec vitest run __tests__/kinfolk-journeys-contract.test.ts` | **PASS — 5 tests** |
| Runtime DDL prevention | New route/migration contract test plus service mock assertions | **PASS**; no runtime Community Intelligence DDL is present or issued in disabled paths. |
| Source-only migration execution audit | Static search of application and startup-migration code | **PASS**; neither Community Intelligence nor private Journey source-only SQL file is referenced by automatic execution code. |

### Full typecheck blockers, kept separate from this integration

The full API typecheck currently reports 14 errors in six pre-existing files, caused principally by direct imports that are not declared by `artifacts/api-server/package.json` (`zod`, `dotenv`, `openai`, and `expo-secure-store`). The base candidate already contained those files and lacked those direct declarations.

The full mobile typecheck currently reports 51 errors in 24 files because mobile source imports `@workspace/constants`, while `artifacts/mobile/package.json` does not declare that workspace dependency. The base candidate already contained the `AIChatWidget` import and the missing dependency declaration. The Community Intelligence adapter touches that component, but did not introduce the unresolved import condition. The focused mobile contract test passes; no unrelated dependency-manifest repair was made on this integration branch.

These are release-readiness blockers for a broad build, but they are not failures in the focused Community Intelligence or Journey contracts and were not expanded into unrelated work.

## Visual and device evidence

Web source typecheck and production build passed. No authenticated web fixture session was created, and no iOS/Android binary, emulator, or physical-device runtime was built. This work is therefore **source-validated, not device-accepted**. The existing founder-approved Kinfolk preview remains the visual reference; this integration did not redesign it.

## Production isolation

This branch is based on the staging Kinfolk candidate, not the current production reconciliation branch. No Railway, production database, production feature flag, deployed web bundle, or production member data was changed during this integration. The absence of a deployment, migration application, backfill, or provider activation is intentional and remains a release boundary.

## Remaining authorization-gated steps

Before any environment can collect Community Intelligence feedback or expose private Journeys, the following require separate explicit approval and staged evidence:

1. Review and apply the relevant additive migrations in an isolated staging environment.
2. Verify authenticated settings, feedback, Admin suppression, and disabled/private Journey responses against synthetic staging fixtures.
3. Approve the exact runtime feature flags only after the schema checks and privacy review pass.
4. Configure and separately approve any provider connection, OAuth credentials, scopes, token handling, and network activation; Connected Apps is not complete today.
5. Complete a native build and device screenshot/interaction comparison before claiming mobile acceptance.
6. Authorize a PR, merge, deployment, and any production release action separately.

Until then, the branch is safe to preserve as source implementation only.
