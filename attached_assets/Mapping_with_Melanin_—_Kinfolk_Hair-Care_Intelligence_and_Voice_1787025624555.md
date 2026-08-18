# Mapping with Melanin — Kinfolk Hair-Care Intelligence and Voice Repair

This package adds the deeper Kinfolk behavior you described. When a member asks about **alopecia** or **hair loss**, Kinfolk does not return a generic salon list. It offers three clearly separated paths: source-cited medical education relevant to the community lens, an optional dermatologist search, and an optional community hair-care search built from moderated experience signals such as **“growing hands,”** hair-loss support, and scalp-care awareness.

The same package replaces the voice feature’s vague “message too long” failure with a real capture-and-transcription pipeline that identifies whether the failure is microphone permission, insecure HTTP, missing audio, unsupported browser format, upload, or transcription provider processing. The problem is diagnosed by stage; it is not treated as a blanket duration issue.

## The intended alopecia/hair-loss experience

| Kinfolk step | Member experience | Boundary |
|---|---|---|
| Educational context | Kinfolk provides source-cited information relevant to Black women and other women of color, including the importance of accurate diagnosis. | Kinfolk does not diagnose or promise a treatment outcome. |
| Medical path | Kinfolk quietly asks whether the member would like verified local dermatologists. | Results appear only after the member chooses this path. Dermatology listings require board-certification verification. |
| Community hair-care path | Kinfolk separately asks whether the member would like community-recognized hair-care professionals with relevant signals. | It does not call this a medical recommendation and it does not show ordinary nearby salons. |
| Transparent explanation | Each hair-care listing explains *why* Kinfolk surfaced it: approved community confirmations of hair-loss support, scalp-care awareness, “growing hands,” or related signals. | Signals are moderated community evidence, not medical claims, guarantees, or provider self-description. |

The American Academy of Dermatology’s guidance for Black women emphasizes that accurate diagnosis and early intervention matter and directs patients toward a board-certified dermatologist for diagnosis and tailored treatment planning.[1] That is why the medical and community-care paths stay distinct in this design.

## How the community-evidence model works

A hair-care professional becomes eligible for the optional community path only when all of the following are true: the business is verified, the professional holds the required license/directory verification, the relevant community signals were approved through moderation, and each included signal has at least three independent confirmed-member reports. Kinfolk then computes an explainable score. A generic salon with one unreviewed comment never appears as a hair-loss recommendation.

| Signal | Meaning in Kinfolk | Prohibited interpretation |
|---|---|---|
| `growing_hands` | Multiple approved community reports use that community language. | A claim that the professional can medically regrow hair. |
| `hair_loss_support` | Members report a supportive experience around hair-loss concerns. | A medical treatment or diagnosis claim. |
| `scalp_care` | Members report scalp-care awareness. | A substitute for dermatology evaluation. |
| `protective_style_care` / `gentle_detangling` | Members report careful handling practices. | A guarantee of a particular outcome. |
| `stylist_listens` / `culturally_knowledgeable` | Members describe communication and cultural care positively. | A basis to infer identity or competence beyond the reported experience. |

## Voice recording: what the repair changes

The existing blanket text-length message does not identify the underlying failure. The replacement flow has distinct stages and member-facing messages.

| Stage | New diagnostic | Kinfolk behavior |
|---|---|---|
| Browser security | `insecure_context` | Explains that microphone capture requires HTTPS or localhost. |
| Browser capability | `media_unsupported` / `recorder_unsupported` | Explains that the browser cannot access or encode microphone input. |
| Permission | `permission_denied` | Explains how to enable microphone permission and retry. |
| Capture | `no_audio_track` / `empty_recording` | Explains that no live or sufficient audio was captured. |
| Upload | `upload_failed` | Explains that the recording could not be sent. |
| Server format | `TRANSCRIPTION_UNSUPPORTED` | Identifies an unsupported recording MIME type. |
| Transcription provider | `TRANSCRIPTION_PROVIDER_FAILED` | Confirms that Kinfolk received the recording but could not transcribe it. |

There is **no arbitrary message-duration warning**. The client records until the member presses stop. The server’s only size protection is a real 25 MB upload limit; if reached, the implementation should report the actual audio-file size constraint—not call the spoken message “too long.”

## Included files

| File | Role |
|---|---|
| `server/kinfolk/hairCare/hairLossRecommendation.ts` | Builds the education, dermatologist, and community hair-care paths; scores moderated community signals. |
| `server/kinfolk/hairCare/registerHairCareRoutes.ts` | Serves the care paths and retrieves results only after member action. |
| `db/migrations/20260817_hair_care_community_signals.sql` | Adds verified-care profiles and moderated community-signal aggregates. |
| `client/src/features/kinfolk/KinfolkHairLossCarePaths.tsx` | Renders the three paths, transparent recommendation reasons, and optional action buttons. |
| `client/src/features/kinfolk/useVoiceRecorder.ts` | Captures audio, evaluates browser capability, uploads multipart audio, and surfaces stage-specific errors. |
| `server/kinfolk/voice/registerVoiceTranscriptionRoute.ts` | Receives multipart recordings without using the text-message validator. |
| `server/kinfolk/voice/openAiTranscriptionProvider.ts` | Server-side transcription provider adapter. |
| `db/migrations/20260817_voice_diagnostics.sql` | Stores operational voice-stage diagnostics without retaining audio or transcript text. |
| `server/kinfolk/voice/postgresVoiceDiagnostics.ts` | Writes the operational diagnostic events. |

## Installation sequence

### 1. Apply both migrations

Run `20260817_hair_care_community_signals.sql` and `20260817_voice_diagnostics.sql` through the existing migration process. The schema assumes `businesses`, `cities`, and `users` use UUID primary keys; update only the foreign-key references if the project differs.

### 2. Add required server dependencies

Install the multipart parser on the server:

```bash
pnpm add multer
pnpm add -D @types/multer
```

### 3. Configure server-only transcription secrets

Set these Replit Secrets. Do not expose them to the client.

| Secret | Purpose |
|---|---|
| `VOICE_TRANSCRIPTION_API_KEY` | Transcription provider credential. |
| `VOICE_TRANSCRIPTION_API_BASE` | OpenAI-compatible transcription API base URL. |
| `VOICE_TRANSCRIPTION_MODEL` | Provider-supported transcription model. |

### 4. Register the voice route

```ts
import { registerVoiceTranscriptionRoute } from "./kinfolk/voice/registerVoiceTranscriptionRoute";
import { createOpenAiTranscriptionProvider } from "./kinfolk/voice/openAiTranscriptionProvider";
import { createPostgresVoiceDiagnostics } from "./kinfolk/voice/postgresVoiceDiagnostics";

registerVoiceTranscriptionRoute(app, {
  transcriptionProvider: createOpenAiTranscriptionProvider({
    apiKey: process.env.VOICE_TRANSCRIPTION_API_KEY!,
    baseUrl: process.env.VOICE_TRANSCRIPTION_API_BASE!,
    model: process.env.VOICE_TRANSCRIPTION_MODEL!,
  }),
  diagnostics: createPostgresVoiceDiagnostics(dbPool),
});
```

Register this route before any generic text-message route. It accepts multipart `audio`; it must never pass through a `message.length` validation branch.

### 5. Register the hair-care routes

Connect the existing verified-business repository to `HairCareRepository`, and connect the current member-profile location to `MemberLocationRepository`.

```ts
registerHairCareRoutes(app, {
  hairCareRepository,
  memberLocationRepository,
});
```

Mount `KinfolkHairLossCarePaths` only when Kinfolk’s intent layer identifies hair loss, alopecia, scalp concerns, or a closely related subject. Mount `KinfolkVoiceInput` beside the standard text input; when transcription succeeds, its transcript should populate the ordinary text composer for member review before sending.

### 6. Build and moderate the community signals

Do not allow a business owner to assign themselves “growing hands.” Community members can submit private experience feedback; an internal moderation process aggregates approved, non-duplicative confirmations into `provider_community_signals`. Publish a signal only after the minimum evidence threshold is met. Never store a member’s medical details in the community-signal aggregate.

## Release checks

| Check | Expected result |
|---|---|
| Ask Kinfolk about alopecia or hair loss. | Kinfolk displays source-cited education, an optional dermatologist path, and an optional community hair-care path. |
| Do not choose either optional path. | Kinfolk does not fetch professional listings and continues the normal conversation. |
| Choose dermatologists. | Only verified board-certified dermatology listings appear. |
| Choose community hair-care. | Only verified professionals above the moderated-signal threshold appear; no generic salon dump. |
| Inspect each community hair-care recommendation. | The UI shows transparent reasons such as approved “growing hands” or scalp-care community evidence and includes a non-medical boundary. |
| Deny microphone permission. | The UI says permission was not granted; it does not say the message is too long. |
| Record on HTTP rather than HTTPS. | The UI says voice capture needs a secure connection. |
| Stop a recording with no useful audio. | The UI reports an empty recording. |
| Simulate a provider failure. | The UI says the recording was received but not transcribed; the diagnostic table records `TRANSCRIPTION_PROVIDER_FAILED`. |
| Inspect diagnostic records. | They contain stage, code, MIME type, byte count, and technical detail—never stored audio or transcript text. |

## Reference

[1]: https://www.aad.org/public/diseases/hair-loss/insider/hair-loss-black-women "American Academy of Dermatology — Hair loss in Black women"
