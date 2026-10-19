/**
 * Circle members may always plan around the preferences they have chosen to save.
 * A different member's account-level preferences stay private until a separately
 * designed Circle-scoped sharing consent exists.
 */
export function canUseOwnCirclePlanPreferences(
  requestingMemberId: string,
  curatorMemberId: string,
): boolean {
  return Boolean(requestingMemberId) && requestingMemberId === curatorMemberId;
}
