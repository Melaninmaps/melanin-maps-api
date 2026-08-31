type VoiceTranscriptionProvider = {
  transcribe(input: { audio: Buffer; filename: string; mimeType: string }): Promise<string>;
};

/**
 * Configure VOICE_TRANSCRIPTION_API_KEY, VOICE_TRANSCRIPTION_API_BASE, and
 * VOICE_TRANSCRIPTION_MODEL in Replit Secrets. This provider is server-only.
 */
export function createOpenAiTranscriptionProvider(input: {
  apiKey: string;
  baseUrl: string;
  model: string;
}): VoiceTranscriptionProvider {
  return {
    async transcribe({ audio, filename, mimeType }) {
      const form = new FormData();
      form.append("model", input.model);
      form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), filename);
      form.append("response_format", "json");

      const response = await fetch(`${input.baseUrl.replace(/\/$/, "")}/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${input.apiKey}` },
        body: form,
      });
      const payload = (await response.json()) as { text?: string; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || `Transcription provider returned HTTP ${response.status}.`);
      if (!payload.text?.trim()) throw new Error("Transcription provider returned an empty transcript.");
      return payload.text;
    },
  };
}
