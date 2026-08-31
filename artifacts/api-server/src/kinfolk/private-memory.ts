/**
 * Private memory is deliberately fail-closed in production. This check is
 * evaluated at request time so an explicitly configured process environment is
 * the single runtime control; user preferences cannot enable the feature.
 */
export function isKinfolkPrivateMemoryEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment.NODE_ENV !== "production"
    || environment.KINFOLK_PRIVATE_MEMORY_ENABLED === "true";
}

export type PrivateMemoryForPrompt = {
  content: string;
  purpose: string;
};

/**
 * Keep private content out of the provider prompt whenever the runtime control
 * is off. Callers must filter sensitive memories for relevance before passing
 * them here.
 */
export function buildPrivateMemoryPromptBlock(
  enabled: boolean,
  memories: readonly PrivateMemoryForPrompt[],
): string {
  if (!enabled || memories.length === 0) return "";
  return `\n\nMEMBER-APPROVED PRIVATE MEMORY (user-provided, not independently verified):\n${memories
    .map((memory) => `• [${memory.purpose}] ${memory.content.slice(0, 240)}`)
    .join("\n")}\nUse only when directly relevant. This is the authenticated member's own explicitly approved memory: you may acknowledge or repeat it when that same member directly asks what they asked you to remember. Do not refuse that first-party request merely because the context is private. Never state or imply that another member can see this. Never convert private memory into a community trend or recommendation for anyone else.`;
}