/**
 * Explicitly saved ordinary notes are useful only when they overlap with the
 * member's current request. This helper never creates or selects a note; the
 * member must use an explicit Kinfolk memory consent path to save one.
 */
export function isOrdinaryContinuityMemoryRelevant(
  memory: { content: string; purpose: string },
  currentMessage: string,
): boolean {
  if (![
    "preference",
    "goal",
    "ongoing_context",
    "planning_context",
  ].includes(memory.purpose)) {
    return false;
  }
  const currentTokens = new Set(
    currentMessage.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [],
  );
  return (memory.content.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []).some(
    (token) => currentTokens.has(token),
  );
}
