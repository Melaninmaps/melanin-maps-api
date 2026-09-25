import type { Request } from "express";

/**
 * The founder-controlled identities are the only accounts permitted to modify
 * protected administrator access. All values are normalized before comparison.
 */
export const FOUNDER_OWNER_ADMIN_EMAILS = [
  "tlindsay428@yahoo.com",
  "tlindsay428@gmail.com",
  "tlindsay428@aol.com",
] as const;

/**
 * Founder-authorized administrators whose full platform access is controlled
 * exclusively by the founder owner accounts above.
 */
export const PROTECTED_ADMIN_EMAILS = [
  "kaylacardwell3@gmail.com",
  "bigdot6017@gmail.com",
] as const;

export function normalizeAdminEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

export function isFounderOwnerEmail(email: string | null | undefined): boolean {
  return FOUNDER_OWNER_ADMIN_EMAILS.includes(
    normalizeAdminEmail(email) as (typeof FOUNDER_OWNER_ADMIN_EMAILS)[number],
  );
}

export function isProtectedAdminEmail(email: string | null | undefined): boolean {
  return PROTECTED_ADMIN_EMAILS.includes(
    normalizeAdminEmail(email) as (typeof PROTECTED_ADMIN_EMAILS)[number],
  );
}

/**
 * This helper does not grant Admin rights. Routes must still enforce isAdmin()
 * before treating an authenticated founder identity as the owner.
 */
export function isFounderOwnerRequest(req: Request): boolean {
  return isFounderOwnerEmail(req.user?.email);
}
