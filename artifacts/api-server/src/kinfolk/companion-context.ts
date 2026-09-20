export type KinfolkCompanionMemoryOffer = Readonly<{
  label: string;
  prompt: string;
}>;

const COMPANION_PATTERNS: ReadonlyArray<Readonly<{ label: string; pattern: RegExp }>> = [
  { label: "Mom", pattern: /\b(?:my\s+)?(?:mom|mother|mama|mum)\b/i },
  { label: "Dad", pattern: /\b(?:my\s+)?(?:dad|father|daddy|pops)\b/i },
  { label: "Grandmother", pattern: /\b(?:my\s+)?(?:grandma|grandmother|granny|nana)\b/i },
  { label: "Grandfather", pattern: /\b(?:my\s+)?(?:grandpa|grandfather|papa)\b/i },
  { label: "Partner", pattern: /\b(?:my\s+)?(?:partner|spouse|wife|husband)\b/i },
  { label: "Son", pattern: /\b(?:my\s+)?son\b/i },
  { label: "Daughter", pattern: /\b(?:my\s+)?daughter\b/i },
  { label: "Friend", pattern: /\b(?:my\s+)?friend\b/i },
];

const ACTIVITY_PATTERN = /\b(?:activity|activities|restaurant|dinner|brunch|lunch|museum|show|music|concert|event|outing|trip|visit|weekend|plan|explore|find|recommend|things? to do)\b/i;

export function companionMentionedInText(value: string): string | null {
  return COMPANION_PATTERNS.find((candidate) => candidate.pattern.test(value))?.label ?? null;
}

/**
 * A companion note is offered only after repeated, activity-oriented references.
 * It is never created automatically and never alters the primary member profile.
 */
export function buildCompanionMemoryOffer(input: {
  currentMessage: string;
  priorUserMessages: readonly string[];
  memoryEnabled: boolean;
}): KinfolkCompanionMemoryOffer | null {
  if (!input.memoryEnabled || !ACTIVITY_PATTERN.test(input.currentMessage)) return null;
  const label = companionMentionedInText(input.currentMessage);
  if (!label) return null;

  const mentionedBefore = input.priorUserMessages.some((message) =>
    companionMentionedInText(message) === label && ACTIVITY_PATTERN.test(message),
  );
  if (!mentionedBefore) return null;

  return {
    label,
    prompt: `You have asked about plans with ${label} more than once. Would you like to save a private note for ${label} so Kinfolk can make future suggestions more useful?`,
  };
}

export function normalizeCompanionLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const label = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return label.length >= 2 && label.length <= 60 ? label : null;
}

export function normalizeCompanionNotes(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const notes = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return notes.length >= 1 && notes.length <= 800 ? notes : null;
}

export function formatCompanionMemory(label: string, notes: string): string {
  return `Companion: ${label}\nNotes: ${notes}`;
}

/**
 * Companion notes may influence only a turn that names that same companion.
 * A member's present request remains authoritative even on a related turn.
 */
export function isCompanionMemoryRelevant(memory: string, currentMessage: string): boolean {
  const label = /^Companion:\s*([^\n]{2,60})/im.exec(memory)?.[1]?.trim();
  if (!label) return false;
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalizedLabel) return false;
  const normalizedMessage = currentMessage.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  return normalizedMessage.includes(normalizedLabel);
}
