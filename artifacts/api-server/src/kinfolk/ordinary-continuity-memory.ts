import { sensitiveMemoryTopic } from "./sensitive-memory";

export type OrdinaryContinuityMemory = Readonly<{
  content: string;
  purpose: "preference" | "goal" | "ongoing_context" | "planning_context";
}>;

const PREFERENCE_SIGNAL = /\b(?:i (?:prefer|like|love|enjoy|avoid|usually choose)|my go[- ]?to|i['’]m into|i am into)\b/i;
const PLAN_SIGNAL = /\b(?:i(?:'m| am) (?:planning|moving|relocating|starting|building|working on|training for)|my (?:plan|project|goal|business|move) is|i(?:'ve| have) decided|i decided|we decided|i(?:'m| am) focused on)\b/i;
const PLANNING_SIGNAL = /\b(?:planning|moving|relocating|starting|building|working on|project|goal|decision|decided)\b/i;

/**
 * Select only concrete, non-sensitive preferences and life threads for
 * continuity. Ordinary questions, short acknowledgements, and all sensitive
 * content remain chat-only until the member separately confirms a save.
 */
export function extractOrdinaryContinuityMemory(value: unknown): OrdinaryContinuityMemory | null {
  if (typeof value !== "string") return null;
  const content = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (
    content.length < 8 ||
    content.length > 800 ||
    /\?$/.test(content) ||
    sensitiveMemoryTopic(content) !== null
  ) {
    return null;
  }

  if (PREFERENCE_SIGNAL.test(content)) {
    return { content, purpose: "preference" };
  }
  if (PLAN_SIGNAL.test(content)) {
    return {
      content,
      purpose: PLANNING_SIGNAL.test(content) ? "planning_context" : "ongoing_context",
    };
  }
  return null;
}

/**
 * Automatic ordinary continuity is useful only when it has clear overlap with
 * the current request. It must not turn a saved preference into a general
 * profile or replace the member's present question.
 */
export function isOrdinaryContinuityMemoryRelevant(
  memory: { content: string; purpose: string },
  currentMessage: string,
): boolean {
  if (!["preference", "goal", "ongoing_context", "planning_context"].includes(memory.purpose)) {
    return false;
  }
  const currentTokens = new Set(
    currentMessage.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [],
  );
  return (memory.content.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [])
    .some((token) => currentTokens.has(token));
}
