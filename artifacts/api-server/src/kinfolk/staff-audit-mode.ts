export type KinfolkStaffAuditPolicy = Readonly<{
  memoryRead: false;
  memoryWrite: false;
  analytics: false;
  ephemeralConversation: false;
}>;

export const KINFOLK_STAFF_AUDIT_POLICY: KinfolkStaffAuditPolicy = Object.freeze({
  memoryRead: false,
  memoryWrite: false,
  analytics: false,
  ephemeralConversation: false,
});

/**
 * The request may ask for an isolated staff audit, but only existing server-side
 * administrator authorization can grant it. New Chat is not an audit control.
 */
export function resolveKinfolkStaffAuditPolicy(input: Readonly<{
  requested: unknown;
  administrator: boolean;
}>): KinfolkStaffAuditPolicy | null {
  if (input.requested !== true) return null;
  return input.administrator ? KINFOLK_STAFF_AUDIT_POLICY : null;
}
