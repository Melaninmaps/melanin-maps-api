import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Member wall middleware — ALL MWM platform-data endpoints require an
 * authenticated session.  This is a safety boundary: the platform serves
 * communities that face real harm, so business locations, cultural sites,
 * safety intelligence, and sundown-town records must never be readable
 * by unauthenticated callers.
 *
 * Unauthenticated requests receive 401 — never an empty result set.
 *
 * Does NOT check approval status or membership tier; use requireTrust /
 * requireMembership for those higher-privilege gates.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

/**
 * Account-approval gate for community contribution endpoints.
 *
 * This intentionally does not require a paid plan and does not apply the
 * anti-spam account-age cooldown from requireTrust. Approved testers and free
 * community members may submit review-queued contributions.
 */
export async function requireApprovedMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      error: "Sign in to submit a business for review.",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  try {
    const [user] = await db
      .select({ approved: usersTable.approved })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user?.approved) {
      res.status(403).json({
        error: "An approved community account is required to submit a business.",
        code: "ACCOUNT_APPROVAL_REQUIRED",
      });
      return;
    }

    next();
  } catch {
    res.status(503).json({
      error: "We could not confirm your account approval. Please try again.",
      code: "ACCOUNT_APPROVAL_UNAVAILABLE",
    });
  }
}
