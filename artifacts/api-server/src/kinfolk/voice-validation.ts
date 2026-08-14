/**
 * KinfolkAI Voice Validation Helpers
 *
 * Replaces hard-coded duration comparisons scattered through the transcribe
 * route with typed, testable helpers. Key rules per the Voice Audit spec:
 *
 *   - Only reject recordings with durationSeconds > 60 (not > 10 or > 15).
 *   - An 11-second clip is well within the limit and must reach transcription.
 *   - A timeout is a provider failure, not a clip-length failure. The message
 *     must say "try again or type your question", not "try a shorter clip".
 *   - An empty transcript is a separate 422 condition from a timeout.
 */

export const VOICE_MAX_DURATION_SECONDS = 60;
export const VOICE_MAX_DECODED_BYTES = 10 * 1024 * 1024; // 10 MB
export const VOICE_MAX_BASE64_CHARS = Math.ceil(VOICE_MAX_DECODED_BYTES / 3) * 4 + 4;
export const VOICE_MAX_TRANSCRIPT_CHARS = 4_000;

export type VoiceValidation =
  | { ok: true; durationSeconds: number | null; decodedBytes: number }
  | { ok: false; code: string; message: string };

export function validateVoiceRecording(input: {
  durationSeconds?: number | null;
  base64Audio: string;
}): VoiceValidation {
  const duration = input.durationSeconds;

  if (duration !== undefined && duration !== null) {
    if (!Number.isFinite(duration) || duration < 0) {
      return {
        ok: false,
        code: "INVALID_AUDIO_DURATION",
        message: "The recording duration could not be read. Please record again.",
      };
    }
    if (duration > VOICE_MAX_DURATION_SECONDS) {
      return {
        ok: false,
        code: "VOICE_CLIP_TOO_LONG",
        message: `Please keep voice messages under ${VOICE_MAX_DURATION_SECONDS} seconds.`,
      };
    }
  }

  if (!input.base64Audio || typeof input.base64Audio !== "string") {
    return { ok: false, code: "AUDIO_REQUIRED", message: "No audio was captured. Please try again." };
  }
  if (input.base64Audio.length > VOICE_MAX_BASE64_CHARS) {
    return {
      ok: false,
      code: "AUDIO_TOO_LARGE",
      message: "This audio file is too large. Please record a shorter or lower-quality clip.",
    };
  }

  const decodedBytes = Math.floor((input.base64Audio.replace(/\s/g, "").length * 3) / 4);
  if (decodedBytes > VOICE_MAX_DECODED_BYTES) {
    return {
      ok: false,
      code: "AUDIO_TOO_LARGE",
      message: "This audio file is too large. Please record a shorter or lower-quality clip.",
    };
  }

  return { ok: true, durationSeconds: duration ?? null, decodedBytes };
}

export function normalizeTranscript(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim().slice(0, VOICE_MAX_TRANSCRIPT_CHARS);
}

export function voiceErrorForStatus(status: number, body?: { error?: string; message?: string }): string {
  if (status === 413) return "This audio file is too large. Please record a shorter or lower-quality clip.";
  if (status === 429) return "Voice input is temporarily rate-limited. Please wait a moment and try again.";
  // 503 is a provider/timeout failure — never blame clip length.
  if (status === 503)
    return "Voice transcription is temporarily unavailable. You can type your question instead.";
  return body?.message || "I couldn't hear that clearly. Please try again or type your question.";
}
