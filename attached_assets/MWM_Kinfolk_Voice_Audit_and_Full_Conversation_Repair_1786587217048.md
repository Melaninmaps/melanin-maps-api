# MWM Kinfolk Voice Audit and Full Conversation Repair

**Author:** Manus AI  
**Audit date:** 2026-08-12/13 EDT  
**Scope:** Live website Kinfolk voice selection, text-to-speech playback, microphone input, transcription, privacy, and failure behavior.

## Verdict

**Kinfolk can speak back today. Kinfolk cannot yet accept a member’s spoken question through the website.** The claimed feature is therefore a partial text-to-speech feature, not a complete voice conversation.

| Capability | Independent result | Evidence |
| --- | --- | --- |
| Voice selection | **Pass** | The live `/travel` Taste Profile renders Onyx, Alloy, Echo, Fable, Nova, and Shimmer selections. |
| Live text-to-speech API | **Pass** | Authenticated `POST /api/kinfolk/speak` returned HTTP 200, WAV audio, and a 172,860-character base64 audio payload for a short test phrase. |
| User-facing Listen control | **Pass** | A live Kinfolk response rendered `Listen`; activating it changed the control to `Stop`, confirming the web UI initiated playback. |
| Voice allowance | **Pass, with product caveat** | The speak endpoint returned the user’s unlimited tester allowance and recorded 26 characters. |
| Microphone input control | **Fail** | No microphone/record button appears in the live `/travel` member UI. |
| Browser recording implementation | **Fail** | The website source has no `MediaRecorder`, `getUserMedia`, browser SpeechRecognition, or call to `/api/kinfolk/transcribe`. |
| Full spoken conversation | **Fail** | Server transcription exists, but it is not connected to the website. A member cannot speak a question into Kinfolk today. |
| Transcription privacy/abuse controls | **Needs repair** | The server transcription route accepts base64 audio without a size/format allowlist, per-member usage/rate accounting, explicit no-retention guarantee, or a user-visible permission/privacy notice. |

## Read-only implementation finding

`artifacts/api-server/src/routes/kinfolk.ts` contains both voice primitives:

- `POST /api/kinfolk/transcribe`, which sends a base64 audio blob to `whisper-1` and returns `{ text }`.
- `POST /api/kinfolk/speak`, which sends up to 600 response characters to text-to-speech, returns WAV base64, and uses the selected Kinfolk voice.

`artifacts/web/src/pages/travel.tsx` calls `/api/kinfolk/speak` after a member clicks `Listen`. It has no recording state, microphone button, `navigator.mediaDevices.getUserMedia`, `MediaRecorder`, transcription call, permission copy, cancel mechanism, or audio-retention behavior. This is why output works but voice input does not.

## Surgical repair requirement: complete Kinfolk Voice Conversation

**Allowed source scope**

| File/module | Required change |
| --- | --- |
| `artifacts/web/src/pages/travel.tsx` | Add explicit microphone interaction, recording state, permission explanation, transcription draft/confirmation, cancel/retry, accessibility labels, and automatic handoff to existing `send()` only after the transcript is shown or explicitly confirmed. Preserve the existing Listen TTS behavior. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Harden only the existing `/kinfolk/transcribe` route: explicit authenticated user guard; content-length/base64-size cap; allowed format validation; member-keyed request rate limit; short timeout; no file persistence; and safe error codes. Do not change chat, preferences, map, Library, claims, or unrelated voice output code. |
| Focused tests only | Add unit/API/browser tests described below. |

### Required browser interaction

The microphone control must have a visible, accessible label such as **“Speak to Kinfolk”**. It must be a deliberate tap/click; Kinfolk must never open the microphone or begin recording automatically.

1. The member taps `Speak to Kinfolk`.
2. The app explains once: **“Your audio is used only to turn this question into text. It is not posted to your profile, Circle, business page, or Library.”**
3. Browser microphone permission is requested. If denied, show a typed-input fallback and a non-technical explanation.
4. On grant, record locally in memory with a 60-second maximum and visible elapsed/stop state.
5. The member taps `Stop`. The UI encodes an allowed format (`webm` preferred where supported; fallback to a supported audio type).
6. Call `POST /api/kinfolk/transcribe` with the authenticated session, selected format, and base64 payload. Do not store the raw recording.
7. Show the returned transcript in the normal chat input, prefaced by **“Kinfolk heard:”**. The member can edit, discard, or press Send.
8. The existing chat endpoint processes text only. Sensitive-topic suppression, no-guess cultural rules, preferences, and all regular Kinfolk controls apply exactly as they do to typed input.
9. The assistant response renders the existing `Listen` button. The member chooses whether to hear it. No automatic playback by default.
10. `Stop` reliably stops playback; starting a new response stops any prior audio.

### Server hardening contract

```ts
// POST /api/kinfolk/transcribe (revised contract)
// Requires authenticated member session.
interface TranscribeInput {
  audio: string; // base64, max decoded 10 MB
  format: 'webm' | 'm4a' | 'wav' | 'mp3';
}

// Success
{ text: string, audioRetained: false }

// Expected failure states
// 400 AUDIO_REQUIRED | AUDIO_TOO_LARGE | UNSUPPORTED_AUDIO_FORMAT
// 401 AUTHENTICATION_REQUIRED
// 413 AUDIO_TOO_LARGE
// 429 VOICE_INPUT_RATE_LIMITED (Retry-After header)
// 503 TRANSCRIPTION_UNAVAILABLE
```

Validate decoded bytes before creating a `Blob`; accept only `webm`, `m4a`, `wav`, and `mp3`; set server-side body and request timeout limits; reject empty/silent-invalid input safely; and never write the audio blob to the database, object storage, session record, audit feed, Library Growth Engine, Circle context, business surface, analytics event, or debug log. Log only outcome code and non-content operational latency. A transcript becomes an ordinary draft in the requesting member’s browser; it is not sent to Kinfolk until the member presses Send.

Use a separate member-keyed transcription limiter, initially **10 requests per 15 minutes per member** and an IP fallback only for unauthenticated edge rejection. This must not reuse the broken global IP limiter that blocked the prior 30-user audit.

### Accessibility and safety requirements

- Use `aria-pressed`, `aria-live="polite"`, and a keyboard-operable start/stop control.
- Keep typed chat permanently available; voice is never required.
- Respect the browser’s accessibility/system audio settings.
- Do not auto-play assistant speech. A member explicitly presses Listen.
- Speak a neutral, concise source/caution introduction for sensitive medical, legal, public-safety, or current-event responses only if the member chooses Listen; never read private preference or Circle details aloud without the same request.
- Do not use synthetic voice identity as a claim of a real person, cultural group, or celebrity. Existing selectable voices remain presentation settings, not personas.

## Required tests and proof gates

| ID | Test | Required result |
| --- | --- | --- |
| VOICE-01 | Member loads `/travel`. | Voice options and typed input render. |
| VOICE-02 | Member asks a typed harmless question and presses Listen. | HTTP 200 `/speak`, audible WAV playback begins, button becomes Stop. |
| VOICE-03 | Member taps Stop. | Playback ends, button returns to Listen, no unhandled browser error. |
| VOICE-04 | Member taps Speak and grants mic permission. | Visible recording state; microphone begins only after explicit action. |
| VOICE-05 | Member denies mic permission. | Typed chat remains available with clear fallback; no repeated prompt loop. |
| VOICE-06 | Member records, stops, and receives a transcript. | Transcript appears in editable draft; it is not automatically sent. |
| VOICE-07 | Member edits transcript and presses Send. | Existing Kinfolk chat receives edited text only. |
| VOICE-08 | Member discards transcript. | No chat message/session content is created. |
| VOICE-09 | Oversize/unsupported audio. | Proper 400/413 response; no provider call and no stored audio. |
| VOICE-10 | Eleven quick transcription attempts. | Member-keyed 429 only after allowed limit; another authenticated member remains unaffected. |
| VOICE-11 | Sensitive spoken health/legal query. | Standard Kinfolk privacy rules apply after member sends text; no audio/transcript appears outside the chat session. |
| VOICE-12 | Hard refresh after playback/transcription. | No microphone remains active; no audio replay; no raw audio persists. |
| VOICE-13 | Screen reader/keyboard pass. | Controls have correct labels and states. |
| VOICE-14 | Existing chat, session, map, Library, and Taste Profile regression. | All remain operational. |

## Independent acceptance gate

Replit must provide deployment SHA/bundle identity, focused test output, a browser recording of VOICE-02 through VOICE-08, sanitized server logs demonstrating no raw audio storage, proof of body/rate limits, and a before/after API contract. Manus will then independently repeat the typed-to-spoken response, microphone permission, spoken-to-editable-transcript, edit/send, discard, denial, hard-refresh, and privacy checks before Kinfolk voice is called ready.

Until that gate passes, describe the live feature accurately as **“Kinfolk can read responses aloud”**, not **“voice conversation with Kinfolk.”**
