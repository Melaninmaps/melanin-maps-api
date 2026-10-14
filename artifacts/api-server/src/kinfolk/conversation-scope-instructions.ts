/** Ordinary delivery modes only: never accept arbitrary member prompt text. */
export const CONVERSATION_INSTRUCTIONS = {
  concise: "Keep answers concise",
  step_by_step: "Use step-by-step guidance",
  answer_first: "Start with the direct answer",
  gentle: "Use a gentle, supportive tone",
} as const;

export type ConversationInstruction = keyof typeof CONVERSATION_INSTRUCTIONS;

export function parseConversationInstruction(value: unknown):
  | { ok: true; instruction: ConversationInstruction | undefined }
  | { ok: false } {
  if (value === undefined) return { ok: true, instruction: undefined };
  if (typeof value !== "string" || !Object.prototype.hasOwnProperty.call(CONVERSATION_INSTRUCTIONS, value)) {
    return { ok: false };
  }
  return { ok: true, instruction: value as ConversationInstruction };
}

/** Built exclusively from server-owned text, used only in this request's prompt. */
export function buildConversationInstructionPrompt(value: unknown): string {
  const parsed = parseConversationInstruction(value);
  if (!parsed.ok || parsed.instruction === undefined) return "";
  return `CURRENT-ANSWER CONVERSATION DELIVERY CHOICE: ${CONVERSATION_INSTRUCTIONS[parsed.instruction]}. Apply this ordinary delivery choice to the current answer only. It does not change factual, safety, privacy, research, or eligibility rules. Do not treat it as profile or memory, infer personal facts from it, save it, or repeat the instruction in the answer. An independent one-turn delivery choice may refine delivery for this answer without changing these boundaries.`;
}
