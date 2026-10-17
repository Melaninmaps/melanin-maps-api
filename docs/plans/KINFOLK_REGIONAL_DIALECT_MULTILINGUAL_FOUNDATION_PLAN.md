# Kinfolk Regional Dialect Intelligence & Multilingual Foundation — Source Plan

**Authorization:** Founder instruction dated 2026-10-16  
**Starting candidate:** `34c0379d9394bb8a2e7dede2463b8c89eb0afedd`  
**Controlled source branch:** `feature/kinfolk-regional-dialect-multilingual-foundation-20261016`  
**Documentation foundation incorporated:** `322008c0e8722925e6d16475fbb35aaff7c068be`

## Objective

Deliver the bounded, source-only foundation that lets Kinfolk:

- preserve existing AAVE, regional-language, persona, voice, and privacy choices;
- separately represent conversation language, regional comprehension, regional speaking style, pronunciation assistance, language detection, and code-switching preferences;
- resolve only source-backed place references for transcription and speech assistance;
- hold member pronunciation corrections privately with explicit consent and deletion;
- prepare English/Spanish language-neutral contracts without enabling translation, automatic language switching, or a separate full-app localization project.

## Non-goals and locked boundaries

- No deployment, database migration execution, provider activation, paid service, production/data change, or mobile build.
- No bulk translation, automatic language detection, automatic code switching, or community-content translation.
- No accent imitation, forced slang, identity inference, or persona replacement.
- No changes to the defaults of existing `aaveLevel`, `regionalFlavor`, `personalityMode`, `kinfolkVoice`, or member memory controls.
- No unverified city, business, or place pronunciation will be treated as canonical.

## Architecture decisions

### One language-preference boundary

A new server-side language-preference contract will read existing preferences and expose:

| Concern | Value / handling |
|---|---|
| Conversation language | `en` or `es` initially; designed as BCP-47-like language code storage. Defaults to English. |
| Regional speech comprehension | Separate opt-in selection. Missing new value falls back to the existing `regionalFlavor` so existing member consent remains effective. |
| Regional speaking style | `standard` by default; an explicit optional style choice only. It does not select a synthetic speaker or imitate an accent. |
| Pronunciation assistance | Explicit boolean opt-in; remains false until selected. |
| Kinfolk persona | Existing `personalityMode` remains canonical and is surfaced through the shared contract rather than duplicated. |
| Language detection | Stored as a future-facing preference; default off and not activated. |
| Code switching | Stored as a future-facing preference; default manual and not activated. |
| Personal corrections | Separate private records, never inferred from chat or elevated to city/community rules automatically. |

### Governed place-language data

Add additive source contracts for:

- canonical place-language references with canonical ID, written name, aliases, city/region/country context, language, pronunciation guidance, review status, and current version;
- evidence records with source locator/title/type and review state;
- immutable-or-append-only revision records; and
- private member pronunciation corrections with scope, consent timestamp, state, and deletion timestamp.

Only a reviewed reference may populate transcription keywords or speech-pronunciation guidance. A member correction is never a shared reference by itself.

### Transcription and voice behavior

The transcription path will receive a bounded context object only when the member has opted in. It contains at most a small approved set of place names/aliases and an allowed language hint; it excludes chat history, memory, identity, free-form location history, and broad slang lists. Raw transcription remains the default text. Resolution must be exact or explicitly ambiguous; ambiguity creates a clarification, not a guessed correction.

The speech path will use a source-backed pronunciation annotation only for reviewed proper names and only as provider-compatible guidance. It will not ask the provider to imitate a regional accent. Audio quality still requires later provider, recorded-audio, local-review, and device acceptance evidence.

### Project structure

| Area | Responsibility |
|---|---|
| `lib/db/src/schema/` | Add typed additive tables and preference fields. |
| `artifacts/api-server/src/kinfolk/` | Shared language-preference normalization, governed place reference matching, bounded voice context, and pronunciation annotation helpers. |
| `artifacts/api-server/src/routes/` | Authenticated member preference/correction routes and existing Kinfolk voice wiring. |
| `artifacts/api-server/src/lib/startup-migrations.ts` | Idempotent source migration function and readiness gate only; never execute it in this task. |
| `artifacts/web/src/components/kinfolk/` | Explicit Web controls for language/comprehension/style/pronunciation preferences and corrections. |
| `artifacts/mobile/components/` | Equivalent explicit native settings controls; no auto-detection activation. |
| `artifacts/*/__tests__/` | Focused contracts for defaults, consent, resolution, context boundaries, correction privacy, and Web/native transport. |

## Implementation sequence

1. Add shared TypeScript contracts and additive database schema/migration definitions.
2. Add language-neutral preference normalization and validation while preserving legacy behavior.
3. Add the governed place-reference resolver and bounded transcription/TTS context helpers.
4. Add authenticated correction CRUD with private-by-default consent and deletion behavior.
5. Wire the existing Kinfolk preference, transcription, review, and speech paths to the shared contracts.
6. Add matched Web and native settings/correction controls using existing Kinfolk settings surfaces.
7. Run focused API, Web, and native source regressions; record actual remaining provider, staging, audio, and device evidence gaps.
8. Update the cumulative completion matrix with distinct documented/source/integration/staging/device/member-acceptance status.

## Completion standard for this branch

This branch can be **SOURCE IMPLEMENTED** only if the contracts, server routes, provider-context boundaries, private correction lifecycle, and Web/native preference transports are code-complete and focused tests pass. It remains **not staging/device/member accepted** until controlled non-production provider, recorded-audio, local-review, and native-device checks are separately authorized and executed.
