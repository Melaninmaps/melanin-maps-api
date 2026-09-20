# Replit Work Order: Kinfolk Voice, Memory, and Conversation Modes

**Purpose:** Release the additive Kinfolk voice, memory, and four-mode behavior already implemented on the GitHub `main` branch after the associated pull request is merged. This work order preserves accounts, login, password reset, tester temporary-password behavior, approval, sessions, waitlist, Community, DMs, Circles, saves, reviews, and existing business flows.

## Required behavior

Kinfolk has four **conversation modes** across mobile and web: **Big Cousin**, **Professor**, **Business Manager**, and **Best Friend**. The mode changes the delivery, not factual standards. Kinfolk must give a complete, current, impartial answer first; it may then offer a relevant next question or link. It must never alter facts, source selection, causal conclusions, uncertainty, or recommendations solely to fit a member profile or conversational mode.

A member may explicitly ask Kinfolk to remember something or turn on **Remember this privately**. Only then may that item be saved as private preference context. Kinfolk must never infer a personal fact from a profile, a screenshot, a voice recording, or conversational slang and save it without the member’s affirmative choice. Every member has a visible reset control that deletes only their Kinfolk chats, private memories, answer feedback, and Kinfolk-only preferences; it does not delete their Mapping with Melanin account, password, Community content, DMs, Circles, reviews, saves, membership, or business activity.

## Source already implemented

The release contains these production code changes:

| Path | Required behavior |
|---|---|
| `artifacts/api-server/src/kinfolk/conversation-mode.ts` | Defines the four canonical conversation modes and safely maps legacy preference labels to Big Cousin instead of deleting them. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Uses a mode supplied with a chat turn first; otherwise uses the member’s saved mode for every entry point, including the floating Kinfolk widget. It keeps a voice choice even when personalized recommendations are disabled. |
| `artifacts/api-server/src/kinfolk/lean-general-chat.ts` | Makes direct factual answers use the actual selected mode instead of treating all non-Big-Cousin choices as one generic style. |
| `artifacts/api-server/src/kinfolk/voice-personalization.ts` | Accepts the four current modes while preserving legacy preference values. |
| `artifacts/mobile/app/kinfolk-settings.tsx` | Displays the same four modes and sends only server-supported values for communication style, emoji level, and humor level. |
| `artifacts/mobile/app/travel.tsx` | Restores the saved mode when Kinfolk opens and persists a newly selected mode for future mobile, web, and widget chats. |
| `artifacts/mobile/hooks/useUserPreferences.ts` | Defaults a new mobile member to Big Cousin (`community`). |

Do **not** replace these changes with a new mode list or remove the legacy-value handling. The mobile and web mode values must remain exactly:

```ts
"community" | "professor" | "business_manager" | "best_friend"
```

## Voice input and spoken replies

The current release already supports both directions:

1. **Voice input:** The mobile Kinfolk widget records a member’s question and sends it to `POST /api/kinfolk/transcribe`; the returned text is placed in the composer for review before sending.
2. **Spoken reply:** The widget calls `POST /api/kinfolk/speak`, receives generated audio, and plays it only while the app remains active and the Kinfolk surface remains open. It stops playback when the screen closes or the app backgrounds.
3. **Travel Kinfolk screen:** Existing auto-speech and manual Listen controls remain available. Do not remove them while improving playback.

The shipped voice configuration uses the permitted generated TTS voices `alloy`, `echo`, `fable`, `onyx`, `nova`, and `shimmer`, with **Onyx** as the current default. These are generated voices—not recordings of a human actor and not celebrity clones. Do not market them as a named performer or human actor. A real actor voice requires a separately contracted recording session, written talent consent, a license describing app/store/social use, an audio hosting and delivery plan, and a release decision; do not imitate or clone any person’s voice without that authorization.

The intended Kinfolk sound is: **warm, composed, contemporary, clear, and unhurried; culturally aware without performing an accent, stereotype, or dialect; never robotic, mocking, overly theatrical, or falsely intimate.** The conversation mode controls writing structure and warmth; it must not alter the selected TTS speaker or make unsupported identity claims.

## Required validation gate

Run from an isolated checkout of the exact merged `origin/main` commit. Do not build from a local patched worktree.

```bash
git fetch origin --prune
git checkout --detach origin/main
pnpm install --frozen-lockfile

pnpm --dir artifacts/api-server exec vitest run \
  src/kinfolk/__tests__/voice-personalization.test.ts \
  src/kinfolk/__tests__/conversation-mode.test.ts \
  src/kinfolk/__tests__/lean-general-chat.test.ts \
  src/__tests__/kinfolk-reset-and-relevance-contract.test.ts

pnpm --dir artifacts/mobile exec vitest run \
  __tests__/kinfolk-mode-persistence.test.ts \
  __tests__/kinfolk-business-demo.test.ts

pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/mobile typecheck
pnpm --filter @workspace/web typecheck
git diff --check
```

Stop the release if any command fails. Correct the source and merge a new commit; do not edit a build directory, overwrite a generated bundle, or substitute a local-only patch.

## Native build instructions

After all desired source changes and the validation gate pass on the exact captured `origin/main` SHA, build both platforms from that same SHA:

```bash
cd artifacts/mobile
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
```

The version identifiers must remain:

| Platform | Marketing version | Build number |
|---|---:|---:|
| iOS | `1.1.9` | `111` |
| Android | `1.1.7` | `81` |

Confirm the mobile production API origin before starting the builds. Upload iOS build `111` only after it completes and its archive metadata matches the captured source SHA. Do not call a build, an upload, TestFlight availability, Play availability, or a store release complete until its corresponding platform action has actually completed.

## Required product regression checks

Before giving testers the new build, verify on a real signed-in account and a temporary-password tester account:

1. Big Cousin, Professor, Business Manager, and Best Friend produce visibly different delivery while answering the same factual question accurately.
2. Changing a mode on mobile persists when reopening Kinfolk and is honored by the mobile floating widget and website chat.
3. **Remember this privately** is off by default for each turn; a remembered item appears only after explicit opt-in; Reset Kinfolk deletes Kinfolk-only data and leaves login, profile, Community, DMs, Circles, saves, reviews, membership, and business functions intact.
4. Voice recording transcribes into the composer; spoken replies stop when Kinfolk closes or the app backgrounds; normal text chat continues if voice is unavailable.
5. Kinfolk business cards open the matching Mapping with Melanin business detail page.
6. A review, comment, profile photo, Community post, and approved public creator video created on one client appears on the other because both clients use the shared API record; no Community content disappears after refresh or deployment.
7. Map location permission is requested on the first Map visit; a declined permission leaves a usable, locality-first map rather than showing nationwide pins.

## Non-negotiable preservation rules

This work is additive. Do not remove or change authentication, email login, password reset, tester temporary-password change enforcement, account approval, sessions, users, combined waitlist behavior, Community content, moderation, DMs, Circles, saves, business ownership/claiming, payment routes, Library, Kinfolk source links, or answer-level Helpful/Not helpful feedback. Existing content can be hidden only after the existing report/moderation process and authorized admin review; it must never be deleted merely because an app, web, or deployment update runs.

## Release record

After completion, record the exact GitHub SHA, Railway runtime `built_from_sha`, iOS build ID and uploaded version, Android build ID and uploaded version, test results, and any fallback/degradation observed. A GitHub merge does not itself publish directory records or release a native binary.
