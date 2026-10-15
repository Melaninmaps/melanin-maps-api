/** Ordinary delivery modes only: never accept arbitrary member prompt text. */
export const CONVERSATION_INSTRUCTIONS = {
  concise: "Keep answers concise",
  step_by_step: "Use step-by-step guidance",
  answer_first: "Start with the direct answer",
  gentle: "Use a gentle, supportive tone",
} as const;

export type ConversationInstruction = keyof typeof CONVERSATION_INSTRUCTIONS;

/** A fresh opaque client instance is proof that this mounted chat is still active. */
export const CONVERSATION_INSTRUCTION_CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export function parseConversationInstructionClientId(value: unknown):
  | { ok: true; clientId: string | undefined }
  | { ok: false } {
  if (value === undefined) return { ok: true, clientId: undefined };
  if (typeof value !== "string" || !CONVERSATION_INSTRUCTION_CLIENT_ID_PATTERN.test(value)) {
    return { ok: false };
  }
  return { ok: true, clientId: value };
}

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
  return `ACTIVE-CONVERSATION ORDINARY DELIVERY CHOICE: ${CONVERSATION_INSTRUCTIONS[parsed.instruction]}. Apply this ordinary delivery choice only to this active conversation's later answers. It does not change factual, safety, privacy, research, or eligibility rules. Do not treat it as profile or memory, infer personal facts from it, save it, or repeat the instruction in the answer. An independent one-turn delivery choice may refine delivery for this answer without changing these boundaries.`;
}

type ConversationInstructionRecord = {
  userId: string;
  authenticatedSessionId: string;
  kinfolkSessionId: string;
  clientId: string;
  instruction: ConversationInstruction;
  expiresAt: number;
};

export type ConversationInstructionScope = Readonly<{
  userId: string;
  authenticatedSessionId: string;
  kinfolkSessionId: string;
  clientId: string;
}>;

/**
 * This registry deliberately contains only fixed server-owned delivery IDs. It
 * is process memory, never a profile, Kinfolk history field, telemetry record,
 * or database row. The triple binding prevents a stale browser/native mount,
 * a different account, or a different authenticated SID from reusing a choice.
 */
export class ConversationInstructionRegistry {
  private readonly entries = new Map<string, ConversationInstructionRecord>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly ttlMs = 2 * 60 * 60 * 1_000,
  ) {}

  private key(scope: Pick<ConversationInstructionScope, "userId" | "authenticatedSessionId" | "kinfolkSessionId">): string {
    return `${scope.userId}\u0000${scope.authenticatedSessionId}\u0000${scope.kinfolkSessionId}`;
  }

  pruneExpired(): void {
    const now = this.now();
    for (const [key, record] of this.entries) {
      if (record.expiresAt <= now) this.entries.delete(key);
    }
  }

  resolve(scope: ConversationInstructionScope): ConversationInstruction | undefined {
    const key = this.key(scope);
    const record = this.entries.get(key);
    if (!record) return undefined;
    if (
      record.expiresAt <= this.now()
      || record.userId !== scope.userId
      || record.authenticatedSessionId !== scope.authenticatedSessionId
      || record.kinfolkSessionId !== scope.kinfolkSessionId
      || record.clientId !== scope.clientId
    ) {
      this.entries.delete(key);
      return undefined;
    }
    record.expiresAt = this.now() + this.ttlMs;
    return record.instruction;
  }

  remember(scope: ConversationInstructionScope, instruction: ConversationInstruction): void {
    this.pruneExpired();
    this.entries.set(this.key(scope), {
      ...scope,
      instruction,
      expiresAt: this.now() + this.ttlMs,
    });
  }

  clear(scope: Pick<ConversationInstructionScope, "userId" | "authenticatedSessionId" | "kinfolkSessionId">): void {
    this.entries.delete(this.key(scope));
  }

  clearAuthenticatedSession(authenticatedSessionId: string): void {
    for (const [key, record] of this.entries) {
      if (record.authenticatedSessionId === authenticatedSessionId) this.entries.delete(key);
    }
  }

  clearUser(userId: string): void {
    for (const [key, record] of this.entries) {
      if (record.userId === userId) this.entries.delete(key);
    }
  }

  /** Test-only observability for proving the registry is bounded and non-durable. */
  get size(): number {
    return this.entries.size;
  }
}

export const conversationInstructionRegistry = new ConversationInstructionRegistry();

export function clearConversationInstructionsForAuthenticatedSession(
  authenticatedSessionId: string | undefined,
): void {
  if (authenticatedSessionId) {
    conversationInstructionRegistry.clearAuthenticatedSession(authenticatedSessionId);
  }
}

export function clearConversationInstructionsForUser(userId: string): void {
  conversationInstructionRegistry.clearUser(userId);
}
