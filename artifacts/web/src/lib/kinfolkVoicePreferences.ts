export const KINFOLK_VOICE_OPTIONS = [
  { id: "onyx", label: "Kinfolk Original", description: "Warm, grounded synthetic voice · default", feminine: false },
  { id: "nova", label: "Nova", description: "Bright, expressive feminine synthetic voice", feminine: true },
  { id: "shimmer", label: "Shimmer", description: "Gentle, clear feminine synthetic voice", feminine: true },
  { id: "alloy", label: "Alloy", description: "Balanced, versatile synthetic voice", feminine: false },
  { id: "echo", label: "Echo", description: "Smooth, conversational synthetic voice", feminine: false },
  { id: "fable", label: "Fable", description: "Animated, story-forward synthetic voice", feminine: false },
] as const;

export const AAVE_LEVEL_OPTIONS = [
  { id: 0, label: "Off", description: "Plain conversational language" },
  { id: 1, label: "Light", description: "A light, natural cadence" },
  { id: 2, label: "Conversational", description: "A natural conversational register" },
  { id: 3, label: "Full", description: "A consistent full register, still clear and respectful" },
] as const;

export const REGIONAL_LANGUAGE_OPTIONS = [
  { id: "off", label: "Off" },
  { id: "follow_destination", label: "Follow conversation city" },
  { id: "philadelphia", label: "Philadelphia" },
  { id: "memphis", label: "Memphis" },
  { id: "new_york", label: "New York City" },
  { id: "washington_dc", label: "Washington, DC" },
  { id: "atlanta", label: "Atlanta" },
  { id: "new_orleans", label: "New Orleans" },
  { id: "chicago", label: "Chicago" },
  { id: "houston", label: "Houston" },
  { id: "miami", label: "Miami" },
  { id: "detroit", label: "Detroit" },
  { id: "oakland", label: "Oakland" },
  { id: "baltimore", label: "Baltimore" },
] as const;

export function composerValueFromTranscript(transcript: unknown): string {
  return typeof transcript === "string" ? transcript.trim() : "";
}

export function shouldAutoSpeakNewReply(options: {
  autoSpeak: boolean;
  isNewAssistantReply: boolean;
  content: string;
  degraded?: boolean;
  errorFallback?: boolean;
}): boolean {
  return options.autoSpeak
    && options.isNewAssistantReply
    && options.content.trim().length > 0
    && !options.degraded
    && !options.errorFallback;
}

export function normalizeWebVoice(value: unknown): string {
  return KINFOLK_VOICE_OPTIONS.some((voice) => voice.id === value) ? String(value) : "onyx";
}

export function normalizeWebRegionalFlavor(value: unknown): string {
  return REGIONAL_LANGUAGE_OPTIONS.some((option) => option.id === value) ? String(value) : "off";
}
