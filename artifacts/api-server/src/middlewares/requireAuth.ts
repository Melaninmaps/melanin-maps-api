import { type Request, type Response, type NextFunction } from "express";

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
