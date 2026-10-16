# KinfolkAI Cultural AAVE & Regional Dialect Intelligence

**Status:** Reconciled against source at `34c0379d9394bb8a2e7dede2463b8c89eb0afedd` on 2026-10-16
**Scope:** Product requirement, source reconciliation, validation evidence, and future acceptance gates
**Deployment status:** No deployment, database migration, provider activation, mobile build, or production change was performed.

---

## Permanent controlling principle

> **Kinfolk should understand more ways of speaking than it attempts to imitate.**

Kinfolk must prioritize comprehension of regional accents, AAVE varieties, local pronunciations, expressions, speech patterns, and conversational context. It must not exaggerate an accent, insert stereotypical slang, perform a regional identity, or presume that a member's location or identity determines how they speak.

This applies to text, voice input, transcript review, text-to-speech, and conversational behavior on Web, iOS, and Android.

### Product rules

1. **Comprehension precedes style.** Regional understanding is useful even when Kinfolk responds in the member's normal Big Cousin, Best Friend, Professor, or Business Manager persona.
2. **Understanding and speaking are separate choices.** A member may enable regional comprehension without enabling local-language output. A local-language output preference must never cause accent imitation.
3. **Location is context, not identity.** A destination may inform place-name disambiguation only after the member enables location-aware regional understanding; it never implies that everyone there uses one dialect.
4. **Verified names outrank inference.** Streets, neighborhoods, landmarks, businesses, and cultural locations must resolve through canonical, source-backed records and aliases—not a model guess.
5. **Ask when ambiguity remains.** Kinfolk must preserve the original transcript and ask one natural, focused question when it cannot resolve a material place or name confidently.
6. **Corrections are scoped and consented.** A member may submit a personal pronunciation or interpretation correction. It is private by default, must have an explicit scope, and cannot become a community-wide truth without independent sourcing and review.
7. **Safety, legal, medical, and financial responses remain clear English.** Regional language must never reduce clarity in high-stakes content.

---

## Founder-required behavior

| Requirement | Required Kinfolk behavior |
|---|---|
| Regional comprehension | Understand local accents, AAVE varieties, vocabulary, and conversational patterns without treating them as incorrect English. |
| Place-name accuracy | Recognize and speak verified streets, neighborhoods, landmarks, businesses, and cultural locations. **Tchoupitoulas Street, New Orleans** is a required acceptance example. |
| Voice transcription | Use an enabled regional context plus verified place-name references to resolve likely transcript errors; preserve the raw transcript and request clarification when confidence is insufficient. |
| Location-aware adaptation | When the member has enabled it, apply the current destination to improve comprehension and pronunciation; never assume all residents share the same speech. |
| Separate speaking choice | Regional understanding never turns on regional-style output. Any text-style adaptation is a separate, explicit member preference and never changes the selected Kinfolk persona. |
| Persona integrity | Big Cousin, Best Friend, Professor, and Business Manager retain their personality, facts, safety behavior, and source standards. |
| Member corrections | Store a correction only after consent, with a scope such as `personal`, `city candidate`, or `review requested`; do not generalize a personal correction to a community. |
| Cross-platform consistency | Web, iOS, Android, text input, voice input, transcript review, and TTS use the same persisted preference contract and the same verified place-reference service. |
| Cultural authenticity | No caricature, forced slang, identity inference, or assumption that AAVE is one uniform dialect. |

---

## Reconciliation with the current source

### What is already implemented and passing source tests

1. **Persisted cultural-language inputs exist.** `user_preferences` persists `aave_level` and `regional_flavor`; `/api/kinfolk/preferences` validates and updates both.
2. **Plain language is the safe default.** The voice-personalization contract defaults regional language and cultural register off.
3. **AAVE and local-language behavior has guardrails.** Existing prompt logic prohibits profanity at all AAVE levels, identity inference, caricature, and regional/AAVE styling for medical, emergency, legal, and financial intent classes.
4. **A city-awareness comprehension prompt exists.** `community-language.ts` supplies a limited city-aware vocabulary reference for New York, Washington, DC, Baltimore, and Philadelphia. It explicitly says that recognition is a comprehension tool, not permission to imitate a dialect.
5. **Voice-input review is member-controlled.** The transcription route returns the raw provider transcript separately from an optional, conservative suggestion. The member must review or edit before the text is sent to chat.
6. **TTS voice delivery is server-controlled.** The existing speaker and delivery code preserves approved synthetic speakers and the four Kinfolk personas. Its instructions expressly prohibit imitating an accent, region, dialect, race, or real person.
7. **Community language proposals are governed.** Proposed terms are bounded, plain-text, city-scoped, and subordinate to verified facts; they are not permitted to establish sensitive or factual claims.

### Focused regression evidence

On this source revision, the following focused suites passed:

- **API:** 4 files, **33 tests passed**
  - `voice-personalization.test.ts`
  - `community-language.test.ts`
  - `transcript-meaning-review.test.ts`
  - `transcription-handler.test.ts`
- **Web:** 2 files, **8 tests passed**
  - `community-language-preferences.test.ts`
  - `kinfolk-voice-preferences.test.ts`
- **Native:** 2 files, **14 tests passed**
  - `community-map-voice-regressions.test.ts`
  - `kinfolk-community-perspective.test.ts`

**Total: 55 passing focused source tests.** The execution receipt is `kinfolk-regional-dialect-intelligence-validation.log` in the workspace. These are source-contract tests only; they are not pronunciation-quality, provider-accuracy, or native-device acceptance evidence.

---

## Completion assessment

### Complete

- The permanent comprehension-first principle is now documented in the authoritative Kinfolk vision and release acceptance matrix.
- Existing prompt and TTS controls prevent forced regional/accent imitation.
- Raw voice transcripts remain available to the member, and review suggestions are optional.
- Existing cultural-language and transcription source contracts pass the focused test suite.

### Partial

| Capability | What works now | What is incomplete |
|---|---|---|
| Cultural-language preference | `aaveLevel` and `regionalFlavor` persist and are validated. | The settings contract still conflates cultural register and regional-language behavior; it lacks distinct comprehension, speaking-style, and pronunciation-control fields. |
| City-aware comprehension | A small, text-only vocabulary map helps Kinfolk understand selected local terms. | It is limited in geography and content; it is not a place-name, pronunciation, alias, or phonetic registry. New Orleans and Tchoupitoulas are not covered. |
| Voice transcription | Binary voice input is validated, transcribed server-side, and then conservatively reviewable. | The current provider request sends audio, model, and response format only. It does not supply destination context, verified place-name keywords, or a language hint to the transcription provider. |
| Transcript correction | Existing review preserves the raw transcript and can propose limited cleanup under an explicit regional setting. | It receives no verified location-name reference and therefore cannot safely resolve a difficult proper name such as Tchoupitoulas. |
| Voice output | Server-owned synthetic voices and persona delivery are implemented; they explicitly avoid accent imitation. | There is no verified pronunciation resolver, phonetic/alias layer, per-utterance pronunciation quality check, or local-listener validation. |
| Community contribution | Members can make governed language proposals. | There is no structured personal pronunciation correction with consent, scope, source evidence, review status, and rollback. |
| Cross-platform support | Web and native each have source-tested voice and preference pathways. | There is no shared, tested regional-dialect settings surface and no shared place-reference contract proven on Web, iOS, and Android. |

### Missing source work

The following should be added to the **existing** Cultural AAVE settings and voice architecture when separately authorized. This is not a new standalone dialect engine.

1. **One shared preference contract**
   - `regional_comprehension`: `off`, `follow_destination`, or `selected_region`.
   - `regional_speaking_style`: `standard` by default, with a separate explicit opt-in for limited, non-caricatured text register adaptation.
   - `pronunciation_assistance`: enabled only for source-backed proper-name resolution; it must never select a different persona or imitate an accent.
   - Existing `aaveLevel` should be reconciled into a more explicit cultural-language preference in the planned voice-decoupling work. It must remain separate from profanity and from speaking-style imitation.

2. **Governed place-language reference service**
   - Canonical location/business identifier; canonical written name; aliases; city/region; type; pronunciation notation or audio reference; source URL/title; review status; version; effective dates; reviewer evidence.
   - Resolve a transcript only when a candidate matches a verified record and the active destination/context supports it.
   - Prefer official municipal GIS/street records, transit agencies, official institutions, and verified business sources. A community correction is a review candidate, not a canonical truth.
   - Keep `city_dialect_profiles` as historical vocabulary data only; its current `phrases` and `kinfolk_context` fields do not meet this contract.

3. **Bounded transcription-context adapter**
   - On an enabled voice-input request, select a small set of verified, relevant proper-name keywords from the active city and current candidate context.
   - Pass only this bounded, non-sensitive context to the transcription provider; do not send private history, free-form memories, identity assumptions, or a city-wide slang dump.
   - Preserve raw transcript, show the suggested resolution separately, and ask a clarification if several candidates remain plausible.

4. **TTS pronunciation resolver**
   - Convert only verified name references into a provider-supported pronunciation instruction or a tested pronunciation form.
   - Do not rely on generic text prompting as proof that a name will be pronounced correctly.
   - Never turn a pronunciation preference into an accent-imitation request. Personas remain constant; only the verified proper noun receives special treatment.

5. **Consent-aware correction workflow**
   - Member can say “Kinfolk, I pronounce this name as …” or correct an interpretation.
   - UI must state whether the correction is private to that member, proposed for review, or already source-backed.
   - Personal corrections must be individually viewable, editable, deletable, and excluded from shared cultural registries by default.

6. **Auditable acceptance evidence**
   - Source test fixtures for difficult names, ambiguous names, local expressions, and negative cases.
   - Provider integration test with captured request fields proving that only approved contextual hints are sent.
   - Recorded Web/iOS/Android tests and local-speaker review for recognition and spoken output before marking a city pronunciation as verified.

---

## Speech-provider reality and implementation limits

### Speech-to-text

The current OpenAI provider adapter posts only `model`, `file`, and `response_format`. It does **not** currently use transcription context. OpenAI's current speech-to-text documentation says that `gpt-transcribe` can accept `prompt`, `keywords`, and expected `languages`; keywords are **hints, not guaranteed output**. This provides a viable bounded-hint path for verified place names, but it does not make transcription accuracy guaranteed and must be evaluated against real recordings.

**Implication:** a text prompt after transcription cannot guarantee correct recognition of a local pronunciation. The source must first send provider-compatible, carefully bounded, verified context; then present any correction as optional until ambiguity is resolved.

### Text-to-speech

The current TTS source uses `gpt-4o-mini-tts` and explicitly directs it not to imitate an accent, region, dialect, race, or real person. OpenAI documents that TTS `instructions` can influence accent, emotional range, intonation, speed, and tone, but this is behavioral steering—not a documented guarantee of per-word pronunciation or a substitute for phonetic quality assurance.

**Implication:** Kinfolk can preserve its current anti-caricature constraint and use source-backed wording/instructions for a named location only after acceptance testing. It must not claim that an ordinary TTS prompt has solved local pronunciation. Any future custom voice path requires its own consent workflow; it is not needed for this requirement and is not authorized by this document.

### Practical provider boundary

| Claim | Status |
|---|---|
| “A prompt alone guarantees a local accent or correct pronunciation.” | **False — prohibited claim.** |
| “Verified transcription keywords can improve a transcription candidate.” | **Potentially supported; must be measured per city/name.** |
| “A selected regional setting lets Kinfolk understand a phrase in text.” | **Partially implemented for limited vocabulary; source-tested.** |
| “Kinfolk correctly recognizes and pronounces Tchoupitoulas Street.” | **Not implemented or tested.** |
| “Kinfolk should imitate a member's accent.” | **Not a product goal; prohibited.** |

---

## Required acceptance tests before this capability can be marked implemented

1. **Comprehension without imitation:** a member uses a regional expression; Kinfolk understands the intent and replies in the selected persona without gratuitously repeating the expression.
2. **Tchoupitoulas recognition:** controlled New Orleans recordings using normal local pronunciation resolve to the correct canonical street only when the enabled, source-backed place reference is available.
3. **Ambiguity handling:** an unclear or competing proper name preserves the transcript and produces one natural clarification; no location is invented.
4. **Pronunciation output:** recorded output is checked against the approved source/phonetic reference and independently reviewed by a qualified local speaker or explicitly identified authoritative source.
5. **Preference separation:** regional comprehension can be enabled while regional speaking style remains off; the response retains Big Cousin, Best Friend, Professor, or Business Manager behavior.
6. **Safety language:** medical, legal, financial, and emergency turns remain clear and do not introduce regional style.
7. **Correction scope:** a personal correction remains private, is deletable, and does not modify a shared city record; a proposed city correction requires independent evidence and review.
8. **Travel transition:** an enabled member moving between two cities gets destination-scoped recognition help without a location or identity assumption.
9. **Platform parity:** the same preference and place-reference result is verified on Web, iOS, and Android with source/request evidence and on-device recordings where voice is used.

---

## Staging acceptance plan — prepared, not executed

No staging action is authorized by this document. When separately approved, run one bounded plan using a non-production member account and non-production data:

1. Verify preference defaults and explicit opt-in/opt-out on Web, iOS, and Android.
2. Submit controlled recordings for Tchoupitoulas, at least one ambiguous place name, one local expression, and one ordinary phrase that must not trigger regional handling.
3. Capture redacted transcription requests/responses to prove the contextual-keyword allowlist is bounded and place-only.
4. Verify raw-transcript preservation, optional suggestion, and clarification behavior.
5. Generate controlled TTS samples for approved names; evaluate against the named source and a local reviewer checklist.
6. Confirm that each persona remains intact and no output performs an accent or regional identity.
7. Verify a private member correction can be viewed, edited, deleted, and remains absent from shared reference data.

---

## Current three-status conclusion

| Status | Determination | Basis |
|---|---|---|
| **Documented** | **Complete** | This document, the authoritative Kinfolk vision, and the combined release acceptance matrix now make the comprehension-first principle and its release gates permanent. |
| **Implemented** | **Partial** | Consent-based cultural settings, limited city vocabulary, conservative transcript review, and anti-imitation TTS/persona rules exist. Source-backed proper-name recognition/pronunciation, separated settings, scoped corrections, and shared cross-platform contract do not. |
| **Actually tested** | **Partial** | 55 focused source tests passed for existing safeguards and transport. No provider-context integration, Tchoupitoulas recognition, audio pronunciation quality, local-speaker validation, or native-device parity tests have passed. |

## Next authorized action

**No feature coding is started by this reconciliation.** The next safe action, after explicit authorization for this capability, is a narrow design-and-source change on the current cumulative Kinfolk candidate: define the shared preference and governed place-reference contracts first, then add provider-context and pronunciation tests before enabling any member-facing behavior.

---

## Sources

- [OpenAI Speech-to-Text Guide](https://developers.openai.com/api/docs/guides/speech-to-text) — `gpt-transcribe` accepts `prompt`, `keywords`, and `languages`; keywords are documented as hints, not guaranteed output.
- [OpenAI Create Transcription API Reference](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create/) — documents transcription responses, diarization, log probabilities, and timestamp support.
- [OpenAI Text-to-Speech Guide](https://developers.openai.com/api/docs/guides/text-to-speech) — documents `gpt-4o-mini-tts`, its instruction control, built-in voices, AI-voice disclosure, and custom-voice consent requirements.
