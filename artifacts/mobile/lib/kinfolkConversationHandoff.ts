/**
 * Ephemeral, account-scoped handoff between the floating assistant and the
 * primary Kinfolk screen. It deliberately holds only opaque server session IDs:
 * never transcript text, attachments, prompts, credentials, or member details.
 *
 * The value stays in process memory. It is not written to AsyncStorage or
 * SecureStore, so a device restart, logout, or account switch cannot resurrect
 * a previous member's conversation context.
 */
export type KinfolkConversationSurface = "primary" | "floating";

type ActiveKinfolkConversation = Readonly<{
  accountId: string;
  sessionId: string;
  surface: KinfolkConversationSurface;
}>;

let activeConversation: ActiveKinfolkConversation | null = null;

function normalizedOpaqueId(value: string | null | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export function recordKinfolkConversation(
  accountId: string | null | undefined,
  sessionId: string | null | undefined,
  surface: KinfolkConversationSurface,
): void {
  const safeAccountId = normalizedOpaqueId(accountId);
  const safeSessionId = normalizedOpaqueId(sessionId);
  if (!safeAccountId || !safeSessionId) return;
  activeConversation = { accountId: safeAccountId, sessionId: safeSessionId, surface };
}

export function getKinfolkConversation(
  accountId: string | null | undefined,
): Readonly<{ sessionId: string; surface: KinfolkConversationSurface }> | null {
  const safeAccountId = normalizedOpaqueId(accountId);
  if (!safeAccountId || activeConversation?.accountId !== safeAccountId) return null;
  return { sessionId: activeConversation.sessionId, surface: activeConversation.surface };
}

export function clearKinfolkConversation(accountId?: string | null): void {
  const safeAccountId = normalizedOpaqueId(accountId);
  if (!safeAccountId || activeConversation?.accountId === safeAccountId) {
    activeConversation = null;
  }
}

/** Test-only reset; no application flow imports this helper. */
export function __resetKinfolkConversationForTests(): void {
  activeConversation = null;
}
