# ChatGPT Handoff — KinfolkAI Cultural AAVE & Regional Dialect Intelligence

**Prepared:** 2026-10-16
**Purpose:** Transfer the current source-reconciled status of KinfolkAI Cultural AAVE & Regional Dialect Intelligence without asking for a duplicate audit or a rewrite of completed work.

---

## Exact source handoff

- **Repository:** `Melaninmaps/melanin-maps-api`
- **Documentation branch:** `docs/kinfolk-cultural-regional-dialect-intelligence-20261016`
- **Handoff commit:** `322008c0e8722925e6d16475fbb35aaff7c068be`
- **Commit message:** `docs: define Kinfolk regional dialect intelligence`
- **Scope of this commit:** Documentation and acceptance criteria only. No runtime feature code, deployment, database migration, provider activation, mobile build, or production edit was made.

## Founder-controlled principle

> **Kinfolk should understand more ways of speaking than it attempts to imitate.**

Kinfolk must prioritize comprehension of regional accents, AAVE varieties, local pronunciations, expressions, speech patterns, and context. It must not imitate an accent, force slang, perform a regional identity, infer how someone speaks from identity or location, or turn a city into a stereotype.

This applies across text, voice input, transcript review, TTS, Web, iOS, and Android.

## What the founder requires

1. Kinfolk understands regional speech and local expressions without treating them as incorrect English.
2. Kinfolk can eventually recognize and pronounce source-backed streets, neighborhoods, landmarks, businesses, and cultural locations.
3. **Tchoupitoulas Street in New Orleans** is a required future acceptance example.
4. Regional comprehension is separate from regional speaking style.
5. A member may enable comprehension while keeping their regular Kinfolk persona: Big Cousin, Best Friend, Professor, or Business Manager.
6. A member correction is private, consented, scoped, editable, and deletable by default; it cannot define an entire community's pronunciation or language.
7. Ambiguous speech must lead to a natural clarification—not an invented name or location.
8. Provider prompts alone must never be represented as proof of transcription or pronunciation accuracy.

---

## Current source status

### Implemented and source-tested

- `user_preferences` stores `aave_level` and `regional_flavor`.
- Kinfolk defaults to plain language; cultural and regional behavior is opt-in.
- Existing prompt safeguards prevent profanity, identity inference, caricature, and regional/AAVE styling in medical, safety, legal, and financial contexts.
- A limited city-aware vocabulary comprehension layer exists for New York, Washington, DC, Baltimore, and Philadelphia.
- Voice input is server-transcribed; the member retains the raw transcript and may optionally accept a conservative review suggestion.
- TTS uses server-owned approved synthetic voices and explicitly forbids imitation of an accent, region, dialect, race, or real person.
- Community language proposals are bounded and governed.

### Test evidence

Focused source validation passed on the source revision reviewed before the documentation commit:

- API: **33 passing tests** across voice personalization, community language, transcript meaning review, and transcription handler contracts.
- Web: **8 passing tests** across community-language preferences and Kinfolk voice preferences.
- Native: **14 passing tests** across voice transport and community perspective contracts.
- **Total: 55 passing focused source tests.**

These prove current source safeguards and transport contracts. They do **not** prove real-world transcription accuracy, TTS pronunciation quality, local-speaker validation, or native-device parity.

---

## What remains missing

1. **Separate setting contract**
   - Current settings do not fully separate regional comprehension, regional speaking style, cultural-language preference, and pronunciation assistance.

2. **Governed place-name reference service**
   - No canonical registry exists for place/business IDs, aliases, city/region, pronunciation reference, evidence source, reviewer status, version, and rollback.
   - Current `city_dialect_profiles` holds phrases/context only; it is not a pronunciation registry.

3. **Provider-context integration**
   - The current transcription provider request sends only audio, model, and response format.
   - It does not pass destination context, verified place-name keywords, or approved language hints.

4. **Safe transcript resolution**
   - Existing review sees only the raw transcript plus limited regional-setting information.
   - It does not have a verified place-reference source and must not guess at difficult names.

5. **TTS pronunciation quality**
   - The current TTS path preserves personas and blocks accent imitation.
   - It has no verified pronunciation resolver or audio-quality acceptance test for local names.

6. **Scoped correction flow**
   - No structured member correction model yet supports consent, personal scope, review-candidate status, source evidence, deletion, and rollback.

7. **Cross-platform parity**
   - No shared, fully tested Web/iOS/Android dialect-settings and place-reference contract exists yet.

---

## Speech-provider limitation that must remain explicit

OpenAI's current speech-to-text documentation describes `prompt`, `keywords`, and expected `languages` for `gpt-transcribe`, but it explicitly describes keywords as **hints, not guaranteed output**. This can support a bounded, verified place-name hint strategy; it cannot guarantee that a local pronunciation will be recognized.

OpenAI's `gpt-4o-mini-tts` supports style instructions, including accent and intonation controls. This is not a documented guarantee of per-word pronunciation. Kinfolk must retain its anti-imitation policy and require source-backed, recorded acceptance evidence before claiming that a local name is pronounced correctly.

---

## Required future implementation sequence

Do not create a separate dialect engine. Extend the existing Cultural AAVE settings, voice architecture, transcript path, and memory controls in this order:

1. Define one shared preference contract that separates regional comprehension from speaking style and preserves current persona selection.
2. Define a governed, source-backed place-name and pronunciation data contract.
3. Add a bounded transcription-context adapter that sends only approved, relevant place names when the member enabled the feature.
4. Preserve raw transcript and require a focused clarification for material ambiguity.
5. Add a TTS pronunciation resolver only for governed proper names; do not request or produce accent imitation.
6. Add a consented, private-by-default member correction flow.
7. Add unit, provider-integration, Web, iOS, Android, recorded-audio, and qualified local-review acceptance evidence.

---

## Required acceptance scenarios

- A regional expression is understood without Kinfolk unnecessarily repeating it.
- A controlled New Orleans recording of Tchoupitoulas resolves to the correct canonical street only when verified evidence and enabled context exist.
- An ambiguous name stays in the raw transcript and generates one useful clarification.
- Kinfolk can understand regional speech while responding in a normal selected persona.
- Kinfolk does not imitate an accent automatically.
- A member can enable comprehension while regional speaking style remains off.
- A personal pronunciation correction can be reviewed, edited, deleted, and remains outside shared community data.
- Same behavior is demonstrated on Web, iOS, and Android.

---

## Updated files in the handoff commit

1. `.agents/memory/kinfolk-lifelong-companion-vision.md` — permanent product principle.
2. `docs/vision/KINFOLK_CULTURAL_AAVE_REGIONAL_DIALECT_INTELLIGENCE.md` — full reconciliation, actual provider limits, status matrix, test evidence, and non-executed staging plan.
3. `docs/handoffs/KINFOLK_SCOPE_LOCK_AND_RELEASE_COMPLETION_2026-09-17.md` — cumulative completion-matrix row.
4. `replit/combined-release/ACCEPTANCE_MATRIX.md` — KIN-13 through KIN-21 future release gates.

## Guardrails

- Do not deploy, run a migration, activate a paid provider, make a mobile build, or modify production without separate authorization.
- Do not claim speech recognition or local pronunciation is complete based on text prompts.
- Do not replace or repeat existing completed Kinfolk work.
- Keep background monitoring and push delivery outside this scope unless separately authorized.

## Requested ChatGPT response

A useful response should:

1. Acknowledge the current status as **documented: complete; implemented: partial; tested: partial**.
2. Preserve the principle that comprehension is broader than imitation.
3. Confirm the next engineering work must begin with the shared preference and governed place-reference contracts, not generic prompt tuning.
4. Identify only genuine missing dependencies or safety risks; do not recommend a broad re-audit, duplicate feature, deployment, migration, provider activation, or mobile build.
