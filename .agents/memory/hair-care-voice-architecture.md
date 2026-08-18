---
name: Kinfolk hair-care intelligence + voice repair
description: Architecture for the three-path hair-loss feature and stage-diagnostic voice recording pipeline.
---

## Hair-care intelligence (Aug 2026)

Three distinct, consent-gated paths for hair-loss/alopecia questions:

| Path | Endpoint | Auth |
|---|---|---|
| Educational context | GET /api/kinfolk/hair-loss/care-paths | public |
| Dermatology results | POST /api/kinfolk/hair-loss/care-paths/show_dermatologists | session |
| Community hair-care | POST /api/kinfolk/hair-loss/care-paths/show_hair_loss_stylists | session |

Community signals are moderated evidence, never medical claims. Scoring: `MIN_COMMUNITY_HAIR_SCORE = 0.55`, `MIN_CONFIRMED_MEMBERS = 3`.

**Tables**: `care_provider_profiles` (business_id PK, no FK enforced — MWM pattern), `provider_community_signals` (UNIQUE business_id+label).

**Schema adaptation**: `postgresHairCareRepository.ts` uses `b.city TEXT` / `b.state TEXT` directly (not via cities FK join), consistent with MWM businesses schema.

**Files**:
- `artifacts/api-server/src/kinfolk/hairCare/` — types, hairLossRecommendation, postgresHairCareRepository, registerHairCareRoutes
- `artifacts/web/src/components/kinfolk/KinfolkHairLossCarePaths.tsx` — wouter-adapted, GoldFeatherMark, consent-gated path buttons

## Voice recording repair (Aug 2026)

Replaces the blanket "message too long" error with a stage-specific diagnostic pipeline.

| Stage | Client code | Server code |
|---|---|---|
| Browser security check | `useVoiceRecorder.ts` | — |
| Multipart upload | `useVoiceRecorder.ts` | `registerVoiceTranscriptionRoute.ts` |
| Transcription | — | `openAiTranscriptionProvider.ts` (Whisper via AI_INTEGRATIONS keys) |
| Diagnostics | — | `postgresVoiceDiagnostics.ts` → `kinfolk_voice_diagnostic_events` |

**Error codes surfaced to member**: insecure_context / media_unsupported / permission_denied / no_audio_track / recorder_unsupported / recorder_error / empty_recording / upload_failed / transcription_failed

**No arbitrary duration limit**. Only real size guard: 25MB multer limit.

**Transcription env vars**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, `VOICE_TRANSCRIPTION_MODEL` (defaults to `whisper-1`).

**Table**: `kinfolk_voice_diagnostic_events` — stores stage/code/mime/bytes/detail; never audio blobs or transcript text.

**Files**:
- `artifacts/api-server/src/kinfolk/voice/` — registerVoiceTranscriptionRoute, openAiTranscriptionProvider, postgresVoiceDiagnostics
- `artifacts/web/src/hooks/useVoiceRecorder.ts`
- `artifacts/web/src/components/kinfolk/KinfolkVoiceInput.tsx`

## Why
Voice was showing a blanket "message too long" message for any failure — microphone permission, insecure context, empty recording, MIME type issues — all looked the same. Replaced with a six-stage diagnostic pipeline that tells the member exactly what happened and what to do. Hair-care paths were requested by the founder after seeing that a generic "find salons near me" answer was not appropriate for alopecia/hair-loss questions.
