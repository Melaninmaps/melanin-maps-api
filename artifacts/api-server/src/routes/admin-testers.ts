/**
 * Admin — Tester Entitlement Management
 *
 * Provides a safe two-step workflow for granting premium testing access
 * to approved email addresses:
 *
 *   1. POST /admin/testers/dry-run  — preview what would change
 *   2. POST /admin/testers/apply    — apply after founder approves dry run
 *   3. GET  /admin/testers          — list active testers + pending emails
 *   4. DELETE /admin/testers/:email — revoke entitlement / remove pending
 *
 * Tester entitlement is an ACCESS STATUS, not a membership tier.
 * Removing it returns the user to their normal memberType/subscription
 * without touching saves, history, profile, or Kinfolk context.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

/** Normalize an email for consistent matching — lowercase + trim. */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Returns true if this user has an active, non-expired testing entitlement. */
export function hasActiveTesterEntitlement(user: {
  testerStatus?: string | null;
  testingEntitlementEndsAt?: Date | null;
}): boolean {
  if (user.testerStatus !== "active") return false;
  if (user.testingEntitlementEndsAt && user.testingEntitlementEndsAt < new Date()) return false;
  return true;
}

// ─── GET /admin/testers ────────────────────────────────────────────────────────
// List all active testers + pending (pre-approved) emails not yet matched.
router.get("/admin/testers", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });
  try {
    const [activeTesters, pendingEmails] = await Promise.all([
      pool.query(`
        SELECT id, email, first_name, last_name, role, member_type,
               tester_status, tester_access_source, tester_granted_at,
               testing_entitlement_ends_at, created_at
        FROM users
        WHERE tester_status = 'active'
        ORDER BY tester_granted_at DESC
      `),
      pool.query(`
        SELECT id, email, tester_access_source, granted_by, granted_at,
               entitlement_ends_at, applied_at, applied_to_user_id
        FROM pending_tester_emails
        WHERE applied_at IS NULL
        ORDER BY granted_at DESC
      `),
    ]);
    res.json({
      activeTesters: activeTesters.rows,
      pendingEmails: pendingEmails.rows,
    });
  } catch (err) {
    req.log.error({ err }, "GET /admin/testers failed");
    res.status(500).json({ error: "Failed to fetch tester list" });
  }
});

// ─── POST /admin/testers/dry-run ──────────────────────────────────────────────
// Preview what applying a tester email list would change. No data is modified.
// Body: { emails: string[], accessSource?: string, entitlementEndsAt?: string }
router.post("/admin/testers/dry-run", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });

  const { emails, accessSource = "admin_invite", entitlementEndsAt } = req.body as {
    emails?: string[];
    accessSource?: string;
    entitlementEndsAt?: string;
  };

  if (!Array.isArray(emails) || emails.length === 0) {
    return void res.status(400).json({ error: "emails array is required" });
  }

  const validSources = ["testflight", "android_test", "admin_invite", "website_test"];
  if (!validSources.includes(accessSource)) {
    return void res.status(400).json({ error: `accessSource must be one of: ${validSources.join(", ")}` });
  }

  try {
    const normalized = emails.map(normalizeEmail).filter(Boolean);
    const unique = [...new Set(normalized)];
    const invalid = emails.filter(e => !e.includes("@") || !e.includes("."));

    // Look up existing users by email
    const existingUsers = await pool.query<{
      id: string; email: string; role: string; member_type: string;
      tester_status: string | null; tester_access_source: string | null;
    }>(
      `SELECT id, email, role, member_type, tester_status, tester_access_source
       FROM users WHERE LOWER(TRIM(email)) = ANY($1)`,
      [unique]
    );

    // Look up existing pending emails
    const existingPending = await pool.query<{ email: string; applied_at: string | null }>(
      `SELECT email, applied_at FROM pending_tester_emails WHERE email = ANY($1)`,
      [unique]
    );

    const userMap = new Map(existingUsers.rows.map(u => [normalizeEmail(u.email ?? ""), u]));
    const pendingMap = new Map(existingPending.rows.map(p => [p.email, p]));

    const rows = unique.map(email => {
      const user = userMap.get(email);
      const pending = pendingMap.get(email);
      const isInvalid = invalid.some(i => normalizeEmail(i) === email);

      let proposedChange: string;
      let conflict: string | null = null;

      if (isInvalid) {
        proposedChange = "SKIP — invalid email format";
        conflict = "invalid format";
      } else if (user) {
        if (user.tester_status === "active") {
          proposedChange = "UPDATE — refresh entitlement (already active tester)";
        } else {
          proposedChange = "GRANT — apply tester entitlement to existing account";
        }
      } else if (pending && !pending.applied_at) {
        proposedChange = "SKIP — already in pending list (will auto-attach on registration)";
        conflict = "already pending";
      } else {
        proposedChange = "PENDING — add to pre-approved list (will auto-attach on registration)";
      }

      return {
        email,
        existingAccount: user ? "YES" : "NO",
        currentRole: user?.role ?? "—",
        currentMemberType: user?.member_type ?? "—",
        currentTesterEntitlement: user?.tester_status === "active"
          ? `active (${user.tester_access_source ?? "unknown source"})`
          : user?.tester_status ?? "none",
        proposedChange,
        conflict,
      };
    });

    res.json({
      dryRun: true,
      accessSource,
      entitlementEndsAt: entitlementEndsAt ?? null,
      totalEmails: unique.length,
      willGrant: rows.filter(r => r.proposedChange.startsWith("GRANT") || r.proposedChange.startsWith("UPDATE")).length,
      willPend: rows.filter(r => r.proposedChange.startsWith("PENDING")).length,
      willSkip: rows.filter(r => r.proposedChange.startsWith("SKIP")).length,
      rows,
    });
  } catch (err) {
    req.log.error({ err }, "POST /admin/testers/dry-run failed");
    res.status(500).json({ error: "Dry run failed" });
  }
});

// ─── POST /admin/testers/apply ────────────────────────────────────────────────
// Apply tester entitlements after the founder approves the dry run.
// Body: { emails: string[], accessSource?: string, entitlementEndsAt?: string }
router.post("/admin/testers/apply", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });

  const { emails, accessSource = "admin_invite", entitlementEndsAt } = req.body as {
    emails?: string[];
    accessSource?: string;
    entitlementEndsAt?: string;
  };

  if (!Array.isArray(emails) || emails.length === 0) {
    return void res.status(400).json({ error: "emails array is required" });
  }

  const validSources = ["testflight", "android_test", "admin_invite", "website_test"];
  if (!validSources.includes(accessSource)) {
    return void res.status(400).json({ error: `accessSource must be one of: ${validSources.join(", ")}` });
  }

  const adminId = (req as any).user?.id as string | undefined;
  const endsAt = entitlementEndsAt ? new Date(entitlementEndsAt) : null;

  try {
    const normalized = emails
      .map(normalizeEmail)
      .filter(e => e.includes("@") && e.includes("."));
    const unique = [...new Set(normalized)];

    // Find existing users
    const existingUsers = await pool.query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE LOWER(TRIM(email)) = ANY($1)`,
      [unique]
    );
    const userMap = new Map(existingUsers.rows.map(u => [normalizeEmail(u.email ?? ""), u]));

    let updated = 0;
    let pendingAdded = 0;
    const skipped: Array<{ email: string; reason: string }> = [];

    for (const email of unique) {
      const user = userMap.get(email);
      if (user) {
        // Grant/refresh entitlement on existing account
        await pool.query(
          `UPDATE users
           SET tester_status = 'active',
               tester_access_source = $1,
               tester_granted_at = NOW(),
               tester_granted_by = $2,
               testing_entitlement_ends_at = $3,
               role = CASE WHEN role = 'user' THEN 'tester' ELSE role END,
               updated_at = NOW()
           WHERE id = $4`,
          [accessSource, adminId ?? null, endsAt, user.id]
        );
        // Also upsert into pending_tester_emails (mark as already applied)
        await pool.query(
          `INSERT INTO pending_tester_emails (email, tester_access_source, granted_by, granted_at, entitlement_ends_at, applied_at, applied_to_user_id)
           VALUES ($1, $2, $3, NOW(), $4, NOW(), $5)
           ON CONFLICT (email) DO UPDATE
           SET tester_access_source = $2, granted_by = $3, entitlement_ends_at = $4,
               applied_at = NOW(), applied_to_user_id = $5`,
          [email, accessSource, adminId ?? null, endsAt, user.id]
        );
        updated++;
      } else {
        // No account yet — add to pending list for auto-attach on registration
        try {
          await pool.query(
            `INSERT INTO pending_tester_emails (email, tester_access_source, granted_by, granted_at, entitlement_ends_at)
             VALUES ($1, $2, $3, NOW(), $4)
             ON CONFLICT (email) DO UPDATE
             SET tester_access_source = $2, granted_by = $3, entitlement_ends_at = $4`,
            [email, accessSource, adminId ?? null, endsAt]
          );
          pendingAdded++;
        } catch {
          skipped.push({ email, reason: "Failed to insert pending record" });
        }
      }
    }

    req.log.info(
      { updated, pendingAdded, skipped: skipped.length, by: adminId, accessSource },
      "Tester entitlements applied"
    );

    res.json({
      ok: true,
      updated,
      pendingAdded,
      skipped: skipped.length,
      skippedDetails: skipped,
    });
  } catch (err) {
    req.log.error({ err }, "POST /admin/testers/apply failed");
    res.status(500).json({ error: "Failed to apply tester entitlements" });
  }
});

// ─── DELETE /admin/testers/:email ─────────────────────────────────────────────
// Revoke an active tester's entitlement or remove a pending email.
router.delete("/admin/testers/:email", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });

  const email = normalizeEmail(decodeURIComponent(req.params.email as string));
  if (!email.includes("@")) {
    return void res.status(400).json({ error: "Invalid email" });
  }

  try {
    // Revoke from users table if they have an account
    const userResult = await pool.query(
      `UPDATE users
       SET tester_status = 'inactive',
           role = CASE WHEN role = 'tester' THEN 'user' ELSE role END,
           updated_at = NOW()
       WHERE LOWER(TRIM(email)) = $1 AND tester_status = 'active'
       RETURNING id, email`,
      [email]
    );

    // Remove from pending list (whether applied or not)
    await pool.query(
      `DELETE FROM pending_tester_emails WHERE email = $1`,
      [email]
    );

    const revokedUser = userResult.rows[0] ?? null;
    req.log.info({ email, revokedUserId: revokedUser?.id, by: (req as any).user?.id }, "Tester entitlement revoked");

    res.json({
      ok: true,
      revokedFromAccount: !!revokedUser,
      removedFromPending: true,
    });
  } catch (err) {
    req.log.error({ err }, "DELETE /admin/testers failed");
    res.status(500).json({ error: "Failed to revoke tester entitlement" });
  }
});

export default router;
