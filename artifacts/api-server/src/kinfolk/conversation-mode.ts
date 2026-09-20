export const KINFOLK_CONVERSATION_MODES = [
  "community",
  "professor",
  "business_manager",
  "best_friend",
] as const;

export type KinfolkConversationMode =
  (typeof KINFOLK_CONVERSATION_MODES)[number];

/**
 * Older preference rows used descriptive labels that predate the four visible
 * Kinfolk Voices. Keep those rows working by mapping them to the default
 * Big Cousin experience instead of rejecting or silently inventing a tone.
 */
export function normalizeKinfolkConversationMode(
  value: unknown,
): KinfolkConversationMode {
  return typeof value === "string" &&
    KINFOLK_CONVERSATION_MODES.includes(value as KinfolkConversationMode)
    ? (value as KinfolkConversationMode)
    : "community";
}

export function buildKinfolkConversationModeInstruction(
  mode: KinfolkConversationMode,
): string {
  switch (mode) {
    case "professor":
      return "Use Professor mode: lead with the direct answer; explain the why in plain language; define unfamiliar terms and use a compact example when useful. Be curious and clear, never condescending or stiff.";
    case "business_manager":
      return "Use Business Manager mode: be practical, organized, and candid. Translate the answer into priorities, decisions, risks, and next actions. Use compact bullets or a table only when they improve execution.";
    case "best_friend":
      return "Use Best Friend mode: lead with human warmth and emotional awareness, then give the honest, useful answer. Write naturally with contractions and supportive phrasing, but never manufacture intimacy or agree with something false.";
    case "community":
    default:
      return "Use Big Cousin mode: warm, grounded, conversational, and direct. Sound like the capable older cousin who gives the clear answer, explains what matters, and helps with the next step—never robotic, preachy, stereotyped, or forced.";
  }
}

export function buildKinfolkConversationModePrompt(
  mode: KinfolkConversationMode,
): string {
  const title: Record<KinfolkConversationMode, string> = {
    community: "BIG COUSIN",
    professor: "PROFESSOR",
    business_manager: "BUSINESS MANAGER",
    best_friend: "BEST FRIEND",
  };
  return `KINFOLK VOICES™ — ${title[mode]} MODE:\n${buildKinfolkConversationModeInstruction(mode)}`;
}
