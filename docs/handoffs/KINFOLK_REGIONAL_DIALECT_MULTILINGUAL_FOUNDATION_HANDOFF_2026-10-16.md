# Kinfolk Regional Dialect Intelligence & Multilingual Foundation — Source Handoff

**Status:** **SOURCE IMPLEMENTED**  
**Source branch:** `feature/kinfolk-regional-dialect-multilingual-foundation-20261016`  
**Source implementation commit:** `d9af34636b7c547758334185cee2705cb1f415b8`  
**Starting candidate:** `34c0379d9394bb8a2e7dede2463b8c89eb0afedd`  
**Documentation foundation retained:** `322008c0e8722925e6d16475fbb35aaff7c068be`

## What is source-complete

The branch adds an additive, consent-aware regional-language and multilingual foundation without changing existing AAVE, regional-flavor, Kinfolk voice, persona, memory, or discovery defaults.

| Surface | Delivered behavior |
|---|---|
| Member preferences | Explicit `en`/`es` conversation-language foundation; independent regional comprehension and optional speaking-style fields; opt-in pronunciation assistance; stored-but-inactive detection and code-switching preferences. Missing new regional comprehension falls back to the existing saved regional flavor, preserving legacy behavior. |
| Governed reference contracts | Additive schema for reviewed place-language references, evidence, immutable revisions, and private member pronunciation corrections. No reference data was seeded. |
| Provider boundary | Transcription receives only a bounded language hint and up to a small set of reviewed, relevant proper names after stored opt-in. It never receives chat history, memory, identity, broad slang lists, or free-form location history. |
| Transcript review | Raw transcription remains the sendable draft. Any interpretation stays optional, reviewable, and clarification-first. |
| TTS | Reviewed proper-name guidance is added only when the member opted in and a reviewed reference exactly matches. It does not request accent imitation and is not represented as verified audio quality. |
| Private corrections | Authenticated members can list, create with explicit consent, edit, pause/resume, and delete their own corrections. Corrections are member-only and cannot become shared reference data automatically. |
| Web and native | Kinfolk settings expose explicit language/place-name controls and private corrections. The native settings hub links to a dedicated language screen. |

## Validation evidence

| Check | Result |
|---|---|
| `pnpm --filter @workspace/db exec tsc -b tsconfig.json --force --pretty false` | Passed |
| API TypeScript: `pnpm --filter @workspace/api-server exec tsc -p tsconfig.json --noEmit --pretty false` | Passed |
| API focused regressions: regional service/route, transcript review, transcription handler | **28/28 passed** across 4 files |
| Web TypeScript | Passed |
| Web focused regressions: settings + existing Kinfolk experience settings | **7/7 passed** across 2 files |
| Web production build | Passed; existing source-map and bundle-size warnings only |
| Native focused regressions: new language settings + existing Kinfolk settings center | **9/9 passed** across 2 files |
| Native TypeScript | Passed using `--ignoreDeprecations 6.0`; without that compatibility override, the workspace’s existing `baseUrl` deprecation under TypeScript 6 stops compilation before source checking. |

## Intentionally not done

No database migration was executed. No deployment, production/data change, provider activation, paid service, reference-data seed, mobile build, AWS Device Farm session, staging verification, recorded-audio comparison, qualified local-speaker review, or member acceptance occurred.

Automatic language detection, automatic code switching, bulk translation, community-content translation, push delivery, and background monitoring remain **unimplemented and inactive**.

## Next authorized stage: controlled staging acceptance

1. Merge this exact source commit into the authoritative Kinfolk candidate using the normal controlled-integration process.
2. On an approved non-production database, execute the reviewed migration and verify the readiness gate, with no production data migration.
3. Add only separately reviewed place-language references with evidence and revision receipts; do not promote private corrections to shared data.
4. Exercise preference save/reload, correction CRUD, plain-text transcript preservation, bounded provider-request inspection, and ambiguity clarification using test members.
5. For KIN-17 and KIN-21, collect recorded TTS output, compare against authoritative/qualified local-speaker review, and complete approved iOS/Android device evidence. A generic provider prompt does not satisfy those checks.
6. Keep detection, automatic switching, translation, paid-provider activation, mobile builds, and production release disabled unless separately authorized.

See the updated [acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md) and [implementation plan](../plans/KINFOLK_REGIONAL_DIALECT_MULTILINGUAL_FOUNDATION_PLAN.md) for the full status boundary.
