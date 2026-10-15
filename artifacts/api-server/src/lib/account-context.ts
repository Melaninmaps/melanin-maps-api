import type { NextFunction, Request, Response } from "express";
import { pool } from "@workspace/db";
import { isNamedAdmin } from "./adminAuth";

export const ACCOUNT_CONTEXT_HEADER = "x-mwm-account-context";

type PersonalContext = { kind: "personal" };
type AdminContext = { kind: "admin" };
type BusinessContext = {
  kind: "business";
  businessId: string;
  businessName: string;
  category: string | null;
  city: string | null;
  state: string | null;
  managementRole: "owner" | "manager";
};

type DeniedContext = { kind: "denied"; reason: "invalid" | "not_authorized" };

export type ResolvedAccountContext =
  | PersonalContext
  | AdminContext
  | BusinessContext
  | DeniedContext;

export type MemberAccountContextResolver = (
  req: Request,
) => Promise<ResolvedAccountContext>;

export type AvailableAccountContexts = {
  businesses: Array<{
    id: string;
    name: string;
    managementRole: "owner" | "manager";
  }>;
  canUseAdminContext: boolean;
};

function requestedContext(req: Request): string {
  return String(req.header(ACCOUNT_CONTEXT_HEADER) ?? "personal").trim();
}

function isOpaqueBusinessId(value: string): boolean {
  return value.length >= 1 && value.length <= 200 && /^[A-Za-z0-9_-]+$/.test(value);
}

/**
 * Resolves every selectable workspace against the current authenticated session.
 * Browser state is a UI convenience only: this query is the authorization source
 * for each request that depends on the active workspace.
 */
export async function resolveMemberAccountContext(
  req: Request,
): Promise<ResolvedAccountContext> {
  if (!req.user?.id) return { kind: "denied", reason: "not_authorized" };

  const requested = requestedContext(req);
  if (requested === "" || requested === "personal") return { kind: "personal" };

  if (requested === "admin") {
    return isNamedAdmin(req)
      ? { kind: "admin" }
      : { kind: "denied", reason: "not_authorized" };
  }

  if (!requested.startsWith("business:")) {
    return { kind: "denied", reason: "invalid" };
  }

  const businessId = requested.slice("business:".length);
  if (!isOpaqueBusinessId(businessId)) {
    return { kind: "denied", reason: "invalid" };
  }

  const result = await pool.query<{
    id: string;
    name: string;
    category: string | null;
    city: string | null;
    state: string | null;
    managementRole: "owner" | "manager";
  }>(
    `SELECT b.id, b.name, b.category, b.city, b.state, bol.role AS "managementRole"
     FROM business_owner_links bol
     JOIN businesses b ON b.id = bol.business_id
     WHERE bol.user_id = $1
       AND bol.business_id = $2
       AND bol.role IN ('owner', 'manager')
       AND bol.status = 'approved'
       AND bol.revoked_at IS NULL
     ORDER BY CASE bol.role WHEN 'owner' THEN 0 ELSE 1 END
     LIMIT 1`,
    [req.user.id, businessId],
  );
  const business = result.rows[0];
  if (!business) return { kind: "denied", reason: "not_authorized" };

  return {
    kind: "business",
    businessId: business.id,
    businessName: business.name,
    category: business.category,
    city: business.city,
    state: business.state,
    managementRole: business.managementRole,
  };
}

/**
 * Keeps every non-Personal Kinfolk route fail-closed. The resolver is injected
 * so the exact Express request behavior can be regression-tested without a
 * production database or an authenticated member fixture.
 */
export function createKinfolkAccountContextGuard(
  resolveContext: MemberAccountContextResolver = resolveMemberAccountContext,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requested = requestedContext(req);
    if (requested === "" || requested === "personal") return next();
    try {
      const accountContext = await resolveContext(req);
      if (accountContext.kind === "denied") {
        res.status(403).json({ error: "This account workspace is not available." });
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      if (req.method === "POST" && req.path === "/chat") return next();
      res.status(403).json({ error: "This Kinfolk control is available only in Personal workspace." });
    } catch (err) {
      req.log.error({ err }, "Could not resolve Kinfolk account context");
      res.status(503).json({ error: "Kinfolk workspace access is temporarily unavailable." });
    }
  };
}

export async function listMemberAccountContexts(
  req: Request,
): Promise<AvailableAccountContexts> {
  if (!req.user?.id) return { businesses: [], canUseAdminContext: false };
  const managedBusinesses = await pool.query<{
    id: string;
    name: string;
    managementRole: "owner" | "manager";
  }>(
    `SELECT b.id, b.name, bol.role AS "managementRole"
     FROM business_owner_links bol
     JOIN businesses b ON b.id = bol.business_id
     WHERE bol.user_id = $1
       AND bol.role IN ('owner', 'manager')
       AND bol.status = 'approved'
       AND bol.revoked_at IS NULL
     ORDER BY b.name ASC, b.id ASC`,
    [req.user.id],
  );
  return {
    businesses: managedBusinesses.rows,
    // Never let an internal CRON credential create a visible browser workspace.
    canUseAdminContext: isNamedAdmin(req),
  };
}

export function hasMatchingSelectedBusinessContext(
  context: ResolvedAccountContext,
  businessId: string,
): context is BusinessContext {
  return context.kind === "business" && context.businessId === businessId;
}
