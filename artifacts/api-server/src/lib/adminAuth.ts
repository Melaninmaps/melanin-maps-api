/**
 * Centralized admin authorization helper.
 *
 * All admin route guards must import `isAdmin` from here — never inline their
 * own ADMIN_EMAILS parse.  This keeps authorization logic in one place so
 * future changes (additional roles, audit logging, etc.) only require a single
 * edit.
 *
 * Authorization has two independent paths (either is sufficient):
 *   1. Email allowlist — the user's email (normalized) appears in the
 *      ADMIN_EMAILS environment variable.
 *   2. Role column — the user's `role` field in the database equals "admin".
 *
 * Normalization: both ADMIN_EMAILS entries and the incoming user email are
 * trimmed and lowercased before comparison so case differences and accidental
 * whitespace in the environment variable cannot cause a silent auth failure.
 *
 * /api/admin/check design note:
 *   That endpoint intentionally returns HTTP 200 with { isAdmin: true/false }
 *   for all callers — authenticated or not — rather than 401/403.  This is a
 *   capability-probe pattern: the client learns whether it should render admin
 *   UI without exposing authorization details in the HTTP status code.
 *   Protected admin endpoints (POST, PATCH, GET /admin/*) still enforce
 *   authorization with explicit 401/403 responses.
 */

import type { Request } from "express";

const NORMALIZED_ADMIN_EMAILS: Set<string> = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

/**
 * Returns true if the authenticated user on `req` has administrator access.
 *
 * Three independent paths (any one is sufficient):
 *   1. Email allowlist — user's email appears in ADMIN_EMAILS env var.
 *   2. Role column    — user's `role` field equals "admin".
 *   3. CRON_SECRET    — `x-cron-secret` header matches the CRON_SECRET env var.
 *      Used by internal automation (monitoring, seeding, tier management).
 *      Only valid when CRON_SECRET is configured and non-empty.
 */
export function isAdmin(req: Request): boolean {
  // Path 3: machine-to-machine via CRON_SECRET header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers["x-cron-secret"] === cronSecret) return true;

  // Paths 1 & 2: session-based
  const user = (req as any).user;
  if (user?.role === "admin") return true;
  if (!user?.email) return false;
  const userEmail = (user.email as string).trim().toLowerCase();
  if (NORMALIZED_ADMIN_EMAILS.size > 0 && NORMALIZED_ADMIN_EMAILS.has(userEmail)) return true;
  return false;
}
