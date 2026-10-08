export type PreferredNameMemoryState = "active" | "paused";

/**
 * Preferred-name pause state is independent from member-selected expiry.
 * `legacyPauseExpiresAt` preserves the narrow pause representation written by
 * the original endpoint so an existing saved name is never unexpectedly used
 * while this lifecycle repair rolls out.
 */
export function resolvePreferredNameMemoryState(input: {
  pausedAt: Date | null | undefined;
  legacyPauseExpiresAt: Date | null | undefined;
  now?: Date;
}): PreferredNameMemoryState {
  const now = input.now ?? new Date();
  if (input.pausedAt) return "paused";
  if (input.legacyPauseExpiresAt && input.legacyPauseExpiresAt <= now) {
    return "paused";
  }
  return "active";
}

/**
 * Saving the same explicitly chosen name is an idempotent update of the one
 * owner-scoped active record; a different name updates that same record.
 * A new row is needed only after a member has explicitly revoked or deleted
 * the prior record.
 */
export function preferredNameSaveOutcome(input: {
  activeRecordId: string | null;
}): "created" | "updated" {
  return input.activeRecordId ? "updated" : "created";
}
