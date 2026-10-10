/**
 * Contract shared by the native Kinfolk voice-source hook and controls.
 *
 * A voice source is deliberately short-lived: raw audio exists only in the
 * device cache long enough to submit one explicit transcription request. The
 * transcript is held for member review and is never auto-sent as a chat turn.
 */
export const KINFOLK_VOICE_MAX_DURATION_MS = 60_000;
export const KINFOLK_VOICE_MAX_BYTES = 25 * 1024 * 1024;
export const KINFOLK_VOICE_MIN_BYTES = 100;

export type KinfolkVoiceSourceFailure =
  | "unsupported_platform"
  | "permission_denied"
  | "permission_unavailable"
  | "recording_start_failed"
  | "recording_missing"
  | "recording_too_long"
  | "recording_too_small"
  | "recording_too_large"
  | "recording_unsupported"
  | "authentication_required"
  | "upload_failed"
  | "upload_too_large"
  | "upload_rate_limited"
  | "transcription_failed"
  | "transcription_empty"
  | "transcript_render_failed";

export type KinfolkVoiceSourcePhase =
  | "idle"
  | "requesting_permission"
  | "starting"
  | "recording"
  | "stopping"
  | "uploading"
  | "review"
  | "error";

export type VoiceSourceFileInspection = Readonly<{
  ok: boolean;
  failure?: KinfolkVoiceSourceFailure;
  mimeType?: string;
}>;

/** Only containers accepted by the Kinfolk transcription route are uploaded. */
export function inferKinfolkVoiceMimeType(uri: string): string | null {
  const extension = uri.split(/[?#]/, 1)[0]?.split(".").pop()?.toLowerCase();
  return ({
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    webm: "audio/webm",
    wav: "audio/wav",
  } as Record<string, string | undefined>)[extension ?? ""] ?? null;
}

/**
 * Validate metadata available on-device before a network request. This is a
 * guardrail, not a substitute for server-side audio-byte inspection.
 */
export function inspectKinfolkVoiceSource(input: {
  durationMs: number;
  sizeBytes: number;
  uri: string;
}): VoiceSourceFileInspection {
  if (!Number.isFinite(input.durationMs) || input.durationMs <= 0) {
    return { ok: false, failure: "recording_missing" };
  }
  if (input.durationMs > KINFOLK_VOICE_MAX_DURATION_MS) {
    return { ok: false, failure: "recording_too_long" };
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes < KINFOLK_VOICE_MIN_BYTES) {
    return { ok: false, failure: "recording_too_small" };
  }
  if (input.sizeBytes > KINFOLK_VOICE_MAX_BYTES) {
    return { ok: false, failure: "recording_too_large" };
  }
  const mimeType = inferKinfolkVoiceMimeType(input.uri);
  if (!mimeType) return { ok: false, failure: "recording_unsupported" };
  return { ok: true, mimeType };
}

/**
 * Never surface server payloads, exception text, raw audio details, or a
 * transcript in a lifecycle status. The UI receives only these safe strings.
 */
export function kinfolkVoiceSourceFailureMessage(failure: KinfolkVoiceSourceFailure): string {
  const messages: Record<KinfolkVoiceSourceFailure, string> = {
    unsupported_platform: "Voice recording is available in the iOS and Android app. You can still type your question.",
    permission_denied: "Microphone access is off. Allow it in Settings, then try recording again.",
    permission_unavailable: "Microphone permission is not available on this device. You can still type your question.",
    recording_start_failed: "Recording did not start. Check microphone access and try again, or type your question.",
    recording_missing: "No usable recording was captured. Please record again or type your question.",
    recording_too_long: "Voice questions can be up to 60 seconds. Please record a shorter question or type it.",
    recording_too_small: "Kinfolk could not hear that recording. Please try again or type your question.",
    recording_too_large: "That recording is too large to send. Please record a shorter question or type it.",
    recording_unsupported: "This recording format is not supported. Please try again or type your question.",
    authentication_required: "Sign in to use Kinfolk Voice. You can still type your question.",
    upload_failed: "Your recording could not be uploaded. Please try again or type your question.",
    upload_too_large: "That recording is too large to send. Please record a shorter question or type it.",
    upload_rate_limited: "Voice input is taking a short break. You can type your message and try recording again later.",
    transcription_failed: "Kinfolk could not transcribe that recording. Please try again or type your question.",
    transcription_empty: "Kinfolk could not hear that clearly. Please try again or type your question.",
    transcript_render_failed: "Your transcript is still available, but it could not be added to the draft. You can edit it or type your question.",
  };
  return messages[failure];
}

/** Map transport outcomes to a safe, non-sensitive member-facing state. */
export function classifyKinfolkVoiceUploadFailure(input: {
  status?: number;
  code?: string;
}): KinfolkVoiceSourceFailure {
  if (input.status === 401 || input.code === "AUTH_REQUIRED") return "authentication_required";
  if (input.status === 413) return "upload_too_large";
  if (input.status === 429 || input.code === "VOICE_INPUT_RATE_LIMITED") return "upload_rate_limited";
  if (
    input.code === "AUDIO_UNREADABLE"
    || input.code === "AUDIO_MIME_MISMATCH"
    || input.code === "TRANSCRIPTION_PROVIDER_FAILED"
  ) return "transcription_failed";
  return "upload_failed";
}
