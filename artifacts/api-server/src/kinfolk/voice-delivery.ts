import {
  normalizeKinfolkConversationMode,
  type KinfolkConversationMode,
} from "./conversation-mode";

/**
 * A single server-owned Kinfolk base voice. Clients may choose how Kinfolk
 * delivers an answer, but never the underlying provider voice or a real-person
 * imitation. The environment values are intentionally never returned by API
 * responses or shipped to web/mobile bundles.
 */
export const KINFOLK_TTS_PROVIDER_ENV = "KINFOLK_TTS_PROVIDER";
export const KINFOLK_TTS_MODEL_ENV = "KINFOLK_TTS_MODEL";
export const KINFOLK_TTS_BASE_VOICE_ENV = "KINFOLK_TTS_BASE_VOICE";
export const KINFOLK_TTS_ENABLED_ENV = "KINFOLK_TTS_ENABLED";

const APPROVED_OPENAI_VOICES = new Set([
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
]);

export type KinfolkSpeechConfiguration = Readonly<{
  enabled: boolean;
  provider: "openai";
  model: "gpt-audio";
  baseVoice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}>;

export type KinfolkVoiceDelivery = Readonly<{
  mode: KinfolkConversationMode;
  label: "Just Big Cousin" | "Professor" | "Business Manager" | "Best Friend";
  styleInstruction: string;
}>;

export const KINFOLK_VOICE_PREVIEW_TEXT =
  "Kinfolk is here. I will give you the direct answer, explain what matters, and help you decide what comes next.";

/**
 * Defaults preserve currently working audio while moving all provider selection
 * to the server. An invalid provider or voice fails closed rather than silently
 * honoring a client-selected or unapproved voice.
 */
export function resolveKinfolkSpeechConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): KinfolkSpeechConfiguration | null {
  if (environment[KINFOLK_TTS_ENABLED_ENV] === "false") return null;
  const provider = (environment[KINFOLK_TTS_PROVIDER_ENV] ?? "openai")
    .trim()
    .toLowerCase();
  if (provider !== "openai") return null;

  const requestedVoice = (environment[KINFOLK_TTS_BASE_VOICE_ENV] ?? "onyx")
    .trim()
    .toLowerCase();
  if (!APPROVED_OPENAI_VOICES.has(requestedVoice)) return null;

  const model = (environment[KINFOLK_TTS_MODEL_ENV] ?? "gpt-audio").trim();
  if (model !== "gpt-audio") return null;

  return {
    enabled: true,
    provider: "openai",
    model: "gpt-audio",
    baseVoice: requestedVoice as KinfolkSpeechConfiguration["baseVoice"],
  };
}

/**
 * Mode affects delivery only. It never changes factual accuracy, source rules,
 * safety behavior, or the underlying server-owned voice identity.
 */
export function resolveKinfolkVoiceDelivery(
  value: unknown,
): KinfolkVoiceDelivery {
  const mode = normalizeKinfolkConversationMode(value);
  switch (mode) {
    case "professor":
      return {
        mode,
        label: "Professor",
        styleInstruction:
          "Speak in English with a clear, measured, welcoming teaching cadence. Make the explanation easy to follow without sounding formal or condescending; never imitate an accent or perform a stereotype.",
      };
    case "business_manager":
      return {
        mode,
        label: "Business Manager",
        styleInstruction:
          "Speak in English with calm executive clarity. Be organized, direct, and practical, with natural pauses between priorities and next steps; never imitate an accent or perform a stereotype.",
      };
    case "best_friend":
      return {
        mode,
        label: "Best Friend",
        styleInstruction:
          "Speak in English with genuine warmth and natural conversational energy. Sound supportive and candid without exaggeration, imitation, or forced familiarity; never imitate an accent or perform a stereotype.",
      };
    case "community":
    default:
      return {
        mode: "community",
        label: "Just Big Cousin",
        styleInstruction:
          "Speak in English with a warm, grounded, steady conversational cadence. Sound like a capable older cousin who is direct, caring, and easy to understand; never imitate an accent or perform a stereotype.",
      };
  }
}

export function normalizeKinfolkSpeechRequest(input: unknown): Readonly<{
  mode: KinfolkConversationMode;
  requestId: string | null;
}> {
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const requestId = typeof body.requestId === "string" && body.requestId.trim().length > 0
    ? body.requestId.trim().slice(0, 128)
    : null;
  return {
    mode: normalizeKinfolkConversationMode(body.mode),
    requestId,
  };
}

export function isKinfolkSpeechAvailable(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return resolveKinfolkSpeechConfiguration(environment) !== null;
}
