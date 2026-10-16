export const DELETE_QUEUE_HOLD_DAYS = 7;

const DELETE_QUEUE_HOLD_MILLISECONDS = DELETE_QUEUE_HOLD_DAYS * 24 * 60 * 60 * 1000;

/**
 * A Delete Queue entry is a reversible retention hold, never a scheduler for
 * automatic removal. The time only makes a separately confirmed permanent
 * deletion eligible.
 */
export function getDeleteQueueEligibleAt(queuedAt: Date = new Date()): Date {
  return new Date(queuedAt.getTime() + DELETE_QUEUE_HOLD_MILLISECONDS);
}

export function isDeleteQueueEligible(
  eligibleAt: Date | string,
  now: Date = new Date(),
): boolean {
  const eligibleTime = new Date(eligibleAt).getTime();
  return Number.isFinite(eligibleTime) && eligibleTime <= now.getTime();
}

export function deleteQueueConfirmation(count: number): string {
  return `MOVE ${count} ${count === 1 ? "BUSINESS" : "BUSINESSES"} TO DELETE QUEUE`;
}

export function removeFromDeleteQueueConfirmation(count: number): string {
  return `REMOVE ${count} ${count === 1 ? "BUSINESS" : "BUSINESSES"} FROM DELETE QUEUE`;
}
