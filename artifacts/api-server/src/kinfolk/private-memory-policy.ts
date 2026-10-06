export const MAX_ACTIVE_KINFOLK_PRIVATE_NOTES = 50;

export type PrivateMemoryState = "active" | "paused" | "expired" | "revoked";

/**
 * Count only generic, currently usable notes. A preferred name has its own
 * one-record lifecycle and is deliberately excluded from this capacity rule.
 */
export function resolvePrivateMemoryCapacity(input: {
  activeCount: number;
  requestedCount: number;
  limit?: number;
}): {
  allowed: boolean;
  activeCount: number;
  requestedCount: number;
  limit: number;
  availableSlots: number;
} {
  const limit = input.limit ?? MAX_ACTIVE_KINFOLK_PRIVATE_NOTES;
  const activeCount = Math.max(0, Math.floor(input.activeCount));
  const requestedCount = Math.max(0, Math.floor(input.requestedCount));
  const availableSlots = Math.max(0, limit - activeCount);
  return {
    allowed: requestedCount <= availableSlots,
    activeCount,
    requestedCount,
    limit,
    availableSlots,
  };
}

/**
 * A pause is distinct from an optional expiry date. Existing expired records
 * remain reviewable but cannot silently resume beyond the member's original
 * expiry choice; the member can explicitly save a new note instead.
 */
export function resolvePrivateMemoryState(input: {
  revokedAt: Date | null;
  pausedAt: Date | null;
  expiresAt: Date | null;
  now?: Date;
}): PrivateMemoryState {
  if (input.revokedAt) return "revoked";
  if (input.pausedAt) return "paused";
  const now = input.now ?? new Date();
  if (input.expiresAt && input.expiresAt <= now) return "expired";
  return "active";
}
