export type VoicePreflightStageId =
  | "permission"
  | "audio_route"
  | "recording_started"
  | "recording_captured"
  | "transcription_upload"
  | "transcript_inserted"
  | "chat_reply"
  | "speech_created"
  | "playback_started"
  | "playback_completed";

export type VoicePreflightStageState = "pending" | "running" | "passed" | "failed" | "needs_tester_confirmation";

export type VoicePreflightRoute = "phone_speaker" | "wired_headphones" | "bluetooth" | "car_audio" | "unconfirmed";

export type VoicePreflightStage = Readonly<{
  id: VoicePreflightStageId;
  label: string;
  state: VoicePreflightStageState;
  detail: string;
}>;

export type VoicePreflightAttempt = Readonly<{
  id: string;
  startedAt: string;
  platform: string;
  route: VoicePreflightRoute;
  stages: readonly VoicePreflightStage[];
}>;

export const VOICE_PREFLIGHT_PROMPT = "Kinfolk voice preflight: please confirm that you can hear this response.";

export const VOICE_PREFLIGHT_STAGE_LABELS: Readonly<Record<VoicePreflightStageId, string>> = {
  permission: "Microphone permission",
  audio_route: "Audio route",
  recording_started: "Recording started",
  recording_captured: "Recording captured",
  transcription_upload: "Upload reached Kinfolk transcription",
  transcript_inserted: "Transcript returned for review",
  chat_reply: "Message sent and text reply returned",
  speech_created: "Kinfolk speech audio returned",
  playback_started: "Playback started",
  playback_completed: "Playback completed",
};

export function createVoicePreflightStages(): VoicePreflightStage[] {
  return (Object.keys(VOICE_PREFLIGHT_STAGE_LABELS) as VoicePreflightStageId[]).map((id) => ({
    id,
    label: VOICE_PREFLIGHT_STAGE_LABELS[id],
    state: id === "audio_route" ? "needs_tester_confirmation" : "pending",
    detail: id === "audio_route"
      ? "Select the route you are physically testing."
      : "Waiting to test.",
  }));
}

export function updateVoicePreflightStage(
  stages: readonly VoicePreflightStage[],
  id: VoicePreflightStageId,
  state: VoicePreflightStageState,
  detail: string,
): VoicePreflightStage[] {
  return stages.map((stage) => stage.id === id ? { ...stage, state, detail } : stage);
}

export function inferVoicePreflightMimeType(uri: string): string | null {
  const ext = (uri.split(".").pop() ?? "").toLowerCase();
  return ({
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    webm: "audio/webm",
  } as Record<string, string | undefined>)[ext] ?? null;
}

export function voicePreflightFailure(stage: VoicePreflightStageId, detail?: string): string {
  const specific = detail?.trim();
  if (specific) return specific;
  const messages: Record<VoicePreflightStageId, string> = {
    permission: "Microphone permission is off. Turn it on in phone Settings, then retry.",
    audio_route: "Choose the speaker, wired, Bluetooth, or car route being tested.",
    recording_started: "Recording did not start. Check microphone permission and try again.",
    recording_captured: "Recording did not produce audio. Try recording again.",
    transcription_upload: "Upload failed—try again.",
    transcript_inserted: "No transcript returned. Try speaking again or type your question.",
    chat_reply: "Kinfolk did not return a text reply. Check the connection and retry.",
    speech_created: "Kinfolk could not create speech audio. Try Listen again.",
    playback_started: "Speech playback could not start. Check volume and the selected audio route, then retry.",
    playback_completed: "Speech playback did not complete. Try Listen again.",
  };
  return messages[stage];
}

export function formatVoicePreflightLog(attempts: readonly VoicePreflightAttempt[]): string {
  const lines = [
    "Mapping With Melanin — Kinfolk Voice Preflight",
    "This log contains technical status only. It excludes recording contents, transcript text, account tokens, and raw audio.",
  ];
  for (const attempt of attempts) {
    lines.push(`Attempt ${attempt.id} · ${attempt.startedAt} · ${attempt.platform} · route: ${attempt.route}`);
    for (const stage of attempt.stages) lines.push(`- ${stage.label}: ${stage.state} — ${stage.detail}`);
  }
  return lines.join("\n");
}
