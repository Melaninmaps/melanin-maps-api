import {
  normalizeKinfolkConversationMode,
  type KinfolkConversationMode,
} from "./conversation-mode";

/**
 * The server owns all provider and model choices. Members can choose only the
 * two approved product speakers below through their persisted preference; a
 * request body can never select a provider voice or a real-person imitation.
 * Environment values are intentionally never returned by API responses or
 * shipped to web/mobile bundles.
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
  model: "gpt-4o-mini-tts";
  baseVoice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}>;

export type KinfolkVoiceDelivery = Readonly<{
  mode: KinfolkConversationMode;
  label: "Big Cousin" | "Professor" | "Business Manager" | "Best Friend";
  styleInstruction: string;
}>;

export type KinfolkSpeakerProfile = Readonly<{
  id: "standard" | "female";
  label: "Standard Kinfolk Voice" | "Female Voice";
  voice: KinfolkSpeechConfiguration["baseVoice"];
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

  const requestedModel = (environment[KINFOLK_TTS_MODEL_ENV] ?? "gpt-4o-mini-tts").trim();
  // Earlier Kinfolk releases used `gpt-audio` through Chat Completions. Treat
  // that existing setting as an alias, then use the documented Speech API model
  // so Railway only needs the standard OPENAI_API_KEY already configured.
  if (requestedModel !== "gpt-4o-mini-tts" && requestedModel !== "gpt-audio") return null;

  return {
    enabled: true,
    provider: "openai",
    model: "gpt-4o-mini-tts",
    baseVoice: requestedVoice as KinfolkSpeechConfiguration["baseVoice"],
  };
}

/**
 * Resolve the member-facing speaker from an already persisted, API-validated
 * preference. `shimmer` is mapped to the approved Female Voice for existing
 * members who selected it in earlier UI; other values retain the server-owned
 * standard voice. This function deliberately never receives request-body data.
 */
export function resolveMemberKinfolkSpeakerProfile(
  configuration: KinfolkSpeechConfiguration,
  persistedVoice: unknown,
): KinfolkSpeakerProfile {
  if (persistedVoice === "nova" || persistedVoice === "shimmer") {
    return {
      id: "female",
      label: "Female Voice",
      voice: "nova",
      styleInstruction:
        "Use a warm, grounded, confident adult woman's synthetic voice. Be natural, clear, and steady; compassionate without vagueness. Do not sound robotic, childish, breathy, overly cheerful, seductive, stereotyped, or like an imitation of an accent, region, dialect, race, or real person.",
    };
  }

  // The deployment-controlled base speaker remains the established standard
  // voice. Never allow a configured Female provider voice to collapse the two
  // member-facing choices into one audible speaker.
  const standardVoice = configuration.baseVoice === "nova" || configuration.baseVoice === "shimmer"
    ? "onyx"
    : configuration.baseVoice;
  return {
    id: "standard",
    label: "Standard Kinfolk Voice",
    voice: standardVoice,
    styleInstruction:
      "Use Kinfolk's familiar warm, grounded, confident adult synthetic voice. Be natural, clear, and steady; never imitate an accent, region, dialect, race, or real person.",
  };
}

export function resolveMemberKinfolkSpeechVoice(
  configuration: KinfolkSpeechConfiguration,
  persistedVoice: unknown,
): KinfolkSpeechConfiguration["baseVoice"] {
  return resolveMemberKinfolkSpeakerProfile(configuration, persistedVoice).voice;
}

export function buildKinfolkSpeechInstruction(
  delivery: KinfolkVoiceDelivery,
  speaker: KinfolkSpeakerProfile,
): string {
  return `${speaker.styleInstruction}\n\nMODE DELIVERY — ${delivery.label}:\n${delivery.styleInstruction}\n\nThe mode changes cadence, warmth, detail, and structure only. It never changes the selected speaker identity, facts, sources, safety behavior, or memory permissions.`;
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
    case "big_cousin":
    default:
      return {
        mode: "big_cousin",
        label: "Big Cousin",
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
