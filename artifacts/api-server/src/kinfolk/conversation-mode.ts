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

/**
 * This format rule applies only when the member asks Kinfolk to draft a formal
 * or official item. It deliberately supersedes presentation style—not facts,
 * safety, recommendation, or current-question rules—across all four voices.
 */
export function buildKinfolkFormalResponseContract(): string {
  return `FORMAL AND OFFICIAL REQUESTS:
- When the member asks to draft an email, letter, request, complaint, appeal, proposal, policy, plan, report, meeting summary, checklist, developer instruction, or another formal/official item, write it as a clean professional document regardless of the selected Kinfolk voice.
- Keep the member's requested facts, purpose, audience, and level of formality accurate. The selected voice may affect warmth and word choice only; it must not change the document's professional structure or facts.
- Use concise plain-text section headings when useful. Use a numbered list only for an ordered sequence and a single-level hyphen list only when a list is necessary.
- Do not use decorative stars, asterisks, repeated symbols, emoji, excessive indentation, or ornamental formatting.
- For casual, conversational, factual, travel, lifestyle, or local-discovery questions, do not force formal-document formatting. Return to the selected Kinfolk voice and use lists only when they genuinely improve clarity.`;
}

const FORMAL_DOCUMENT_TARGET = /\b(?:email|letter|request|complaint|appeal|proposal|policy|plan|report|meeting summary|checklist|developer instruction)\b/i;
const FORMAL_DOCUMENT_ACTION = /\b(?:draft|write|prepare|compose|create|help(?: me)? (?:write|prepare|draft)|formal|official)\b/i;

/**
 * Keep format normalization additive and narrowly scoped to an explicit
 * document-authoring request. Everyday questions retain their selected voice.
 */
export function isKinfolkFormalDocumentRequest(message: string): boolean {
  return FORMAL_DOCUMENT_TARGET.test(message) && FORMAL_DOCUMENT_ACTION.test(message);
}

/**
 * The model receives the formal contract first; this deterministic cleanup only
 * removes disallowed decorative Markdown from its final formal-document reply.
 */
export function normalizeKinfolkFormalDocumentReply(reply: string): string {
  return reply
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+(.+)$/gm, "$1")
    .replace(/^[ \t]*(?:[*+•▪◦◆◇])[ \t]+/gm, "- ")
    .replace(/^[ \t]{2,}-[ \t]+/gm, "- ")
    .replace(/\*+/g, "")
    .replace(/_{2,}/g, "")
    .replace(/^[ \t-]{3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * A member sharing a hard or joyful day needs a response to that feeling first,
 * not a directory handoff, formal document, or generic assistant disclaimer.
 */
export function buildKinfolkEmotionalCheckInContract(
  mode: KinfolkConversationMode,
): string {
  const voiceGuidance: Record<KinfolkConversationMode, string> = {
    community:
      "Big Cousin: be steady, warm, and reassuring. For a hard day, let the member know they do not have to make it sound pretty and offer a small choice such as venting, taking a breath, or figuring out one next step. For a good day, celebrate them and invite them to enjoy and share it.",
    professor:
      "Professor: be calm, clear, and grounding without becoming clinical. For a hard day, acknowledge that piled-up stress can feel bigger in the moment and ask one gentle question about the hardest part or what would help tonight. For a good day, affirm its meaning and invite reflection on what gave the member energy or progress.",
    business_manager:
      "Business Manager: be compassionate, clear, and practical—not promotional. For a hard day, do not try to solve the member's whole life; offer to sort one concern into handle, postpone, or release. For a good day, celebrate the win and invite them to notice what worked and what they may want to repeat.",
    best_friend:
      "Best Friend: be warm, familiar, and supportive without manufacturing intimacy. For a hard day, offer to listen, distract, or sit with it; use playful language only if it fits the member's tone. For a good day, celebrate enthusiastically and invite the full story.",
  };
  return `EMOTIONAL CHECK-INS:
When a member says they had a bad, hard, overwhelming, or amazing day, respond to the emotion before offering advice. ${voiceGuidance[mode]}
- Do not turn a check-in into a business recommendation, directory card, task, promotion, or formal document unless the member explicitly asks.
- Ask at most one gentle follow-up question. Do not over-diagnose, minimize, lecture, or assume the reason for the member's feelings.
- Keep the factual content of any later guidance accurate; the selected voice changes warmth, structure, and practical framing only.`;
}
