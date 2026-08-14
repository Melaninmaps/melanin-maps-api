// MWM KinfolkAI voice patch.
// Replace the current hard-coded “too long” client/server behavior with these helpers.
// The existing server source already has routes POST /kinfolk/transcribe and
// POST /kinfolk/speak. The current server size limit is 10 MB, so an 11-second
// recording should be accepted; this patch prevents a client duration check from
// incorrectly applying the 60-second UI message to a byte/encoding error.

export const VOICE_MAX_DURATION_SECONDS = 60;
export const VOICE_MAX_DECODED_BYTES = 10 * 1024 * 1024;
export const VOICE_MAX_BASE64_CHARS = Math.ceil(VOICE_MAX_DECODED_BYTES / 3) * 4 + 4;
export const VOICE_MAX_TRANSCRIPT_CHARS = 4000;

export type VoiceValidation =
  | { ok: true; durationSeconds: number | null; decodedBytes: number }
  | { ok: false; code: string; message: string };

export function validateVoiceRecording(input: {
  durationSeconds?: number | null;
  base64Audio: string;
}): VoiceValidation {
  const duration = input.durationSeconds;
  if (duration !== undefined && duration !== null && (!Number.isFinite(duration) || duration < 0)) {
    return { ok: false, code: "INVALID_AUDIO_DURATION", message: "The recording duration could not be read. Please record again." };
  }
  if (duration !== undefined && duration !== null && duration > VOICE_MAX_DURATION_SECONDS) {
    return { ok: false, code: "VOICE_CLIP_TOO_LONG", message: `Please keep voice messages under ${VOICE_MAX_DURATION_SECONDS} seconds.` };
  }
  if (!input.base64Audio || typeof input.base64Audio !== "string") {
    return { ok: false, code: "AUDIO_REQUIRED", message: "No audio was captured. Please try again." };
  }
  if (input.base64Audio.length > VOICE_MAX_BASE64_CHARS) {
    return { ok: false, code: "AUDIO_TOO_LARGE", message: "This audio file is too large. Please record a shorter or lower-quality clip." };
  }
  const decodedBytes = Math.floor((input.base64Audio.replace(/\s/g, "").length * 3) / 4);
  if (decodedBytes > VOICE_MAX_DECODED_BYTES) {
    return { ok: false, code: "AUDIO_TOO_LARGE", message: "This audio file is too large. Please record a shorter or lower-quality clip." };
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
  if (status === 503) return "Voice transcription is temporarily unavailable. You can type your question instead.";
  return body?.message || "I couldn't hear that clearly. Please try again or type your question.";
}

export type VoiceResponsePayload = {
  audio: string;
  format: "wav" | "mp3";
  voice: string;
  charsUsed: number;
  charsLimit: number;
};

export async function requestKinfolkAudio(baseUrl: string, text: string, voice: string, fetchImpl = fetch): Promise<VoiceResponsePayload> {
  const response = await fetchImpl(`${baseUrl}/api/kinfolk/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text: text.slice(0, 600), voice }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(voiceErrorForStatus(response.status, body));
  if (typeof body.audio !== "string" || !body.audio) throw new Error("Voice response contained no audio.");
  return { ...body, voice: body.voice ?? voice } as VoiceResponsePayload;
}

export async function playKinfolkAudio(payload: VoiceResponsePayload): Promise<void> {
  // Browser integration: call this only after a user gesture or after the user
  // explicitly enables auto-play. This avoids browser autoplay rejection.
  const bytes = Uint8Array.from(atob(payload.audio), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: payload.format === "mp3" ? "audio/mpeg" : "audio/wav" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.onerror = () => URL.revokeObjectURL(url);
  await audio.play();
}

/* Server integration in routes/kinfolk.ts:

1. Keep the existing 10 MB byte cap. Do not use a character-count comparison as
   a duration check. If the client sends durationSeconds, validate it separately.
2. After transcription:
   const text = normalizeTranscript(transcription.text);
   if (!text) return res.status(422).json({ error: "EMPTY_TRANSCRIPT", message: "I couldn't hear any words. Please try again or type your question." });
   return res.json({ text, audioRetained: false });
3. Replace the timeout message “Try a shorter clip” with the neutral message
   “Transcription timed out. Please try again or type your question.” A timeout is
   not proof that the clip is too long.
4. The client must send {audio, format, durationSeconds}; only durationSeconds > 60
   returns VOICE_CLIP_TOO_LONG. An 11-second recording must reach transcription.
5. After the text reply is rendered, call /api/kinfolk/speak with the saved voice
   preference (onyx default) only when voice playback is enabled, then call
   playKinfolkAudio(payload) from the user’s explicit Listen action.
6. Return voice in the /kinfolk/speak JSON so the UI can prove which voice was used.
*/

export const KINFOLK_VOICE_REGRESSION_CASES = [
  { durationSeconds: 11, expected: "accept" },
  { durationSeconds: 59.9, expected: "accept" },
  { durationSeconds: 60.1, expected: "reject_too_long" },
  { durationSeconds: null, expected: "accept_if_bytes_valid" },
] as const;
