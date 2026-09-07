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

export type KinfolkMemoryConsentReader = (userId: string) => Promise<boolean | null | undefined>;

/** Resolve this authenticated owner's opt-out before any retained session read. */
export async function resolveKinfolkMemoryAccess(input: {
  runtimeEnabled: boolean;
  authenticatedUserId: string;
  readOwnerSetting: KinfolkMemoryConsentReader;
}): Promise<boolean> {
  if (!input.runtimeEnabled) return false;
  try {
    const enabled = await input.readOwnerSetting(input.authenticatedUserId);
    return enabled !== false;
  } catch {
    return false;
  }
}

/**
 * Resolve public shared content only through a lookup that has already joined
 * the retained session to its existing owner and that owner's current consent.
 * A disabled runtime, no matching consented owner, or any lookup failure is
 * deliberately indistinguishable from an unknown share ID.
 */
export async function resolvePublicSharedKinfolkSession<T>(input: {
  runtimeEnabled: boolean;
  readConsentedOwnerSession: () => Promise<T | null | undefined>;
}): Promise<T | null> {
  if (!input.runtimeEnabled) return null;
  try {
    return await input.readConsentedOwnerSession() ?? null;
  } catch {
    return null;
  }
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
