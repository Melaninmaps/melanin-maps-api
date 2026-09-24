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

const VALID_TESTER_ACCESS_SOURCES = [
  "testflight",
  "android_test",
  "admin_invite",
  "website_test",
] as const;

function waitlistSourceForTesterAccess(
  accessSource: (typeof VALID_TESTER_ACCESS_SOURCES)[number],
): "web" | "ios" | "android" {
  if (accessSource === "testflight") return "ios";
  if (accessSource === "android_test") return "android";
  return "web";
}

async function upsertApprovedTesterWaitlistRecord(input: {
  email: string;
  accessSource: (typeof VALID_TESTER_ACCESS_SOURCES)[number];
}): Promise<void> {
  const signupSource = waitlistSourceForTesterAccess(input.accessSource);
  await pool.query(
    `INSERT INTO waitlist_signups (email, status, approved_at, signup_sources)
       VALUES ($1, 'approved', NOW(), $2)
     ON CONFLICT (email) DO UPDATE
       SET status = CASE
             WHEN waitlist_signups.status IN ('rejected', 'archived') THEN waitlist_signups.status
             ELSE 'approved'
           END,
           approved_at = CASE
             WHEN waitlist_signups.status IN ('rejected', 'archived') THEN waitlist_signups.approved_at
             ELSE COALESCE(waitlist_signups.approved_at, NOW())
           END,
           signup_sources = (
             SELECT array_to_string(
               ARRAY(
               SELECT DISTINCT source
                FROM unnest(string_to_array(COALESCE(waitlist_signups.signup_sources, ''), ',')) AS source
                 WHERE source IN ('web', 'ios', 'android')
                 UNION SELECT $2
               ),
               ','
             )
           )`,
    [input.email, signupSource],
  );
}

async function recordAccessEvent(input: {
  email: string;
  userId?: string | null;
  eventType: "granted" | "revoked";
  accessSource?: string | null;
  grantedBy?: string | null;
  entitlementEndsAt?: Date | null;
}): Promise<void> {
  await pool.query(
    `INSERT INTO access_entitlement_events
       (email, user_id, event_type, access_source, granted_by, entitlement_ends_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.email,
      input.userId ?? null,
      input.eventType,
      input.accessSource ?? null,
      input.grantedBy ?? null,
      input.entitlementEndsAt ?? null,
    ],
  );
}

/** Returns true if this user has an active, non-expired testing entitlement. */
export function hasActiveTesterEntitlement(user: {
  testerStatus?: string | null;
  testingEntitlementEndsAt?: Date | null;
}): boolean {
  if (user.testerStatus !== "active") return false;
  if (
    user.testingEntitlementEndsAt &&
    user.testingEntitlementEndsAt < new Date()
  )
    return false;
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

// ─── GET /admin/access-ledger ─────────────────────────────────────────────────
// Founder-only: shows current access grants including pre-approved addresses
// without accounts, plus immutable events recorded within the requested window.
router.get("/admin/access-ledger", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });
  const rawDays = Number(req.query.days ?? 14);
  const days = Number.isFinite(rawDays)
    ? Math.max(1, Math.min(90, Math.floor(rawDays)))
    : 14;
  try {
    const [current, events] = await Promise.all([
      pool.query(
        `WITH access_emails AS (
           SELECT LOWER(TRIM(email)) AS email FROM pending_tester_emails
           UNION
           SELECT LOWER(TRIM(email)) AS email FROM users WHERE tester_status = 'active' AND email IS NOT NULL
         )
         SELECT access_emails.email,
                users.id AS user_id, users.first_name, users.last_name, users.tester_status,
                users.tester_access_source, users.tester_granted_at,
                users.testing_entitlement_ends_at, users.created_at AS account_created_at,
                pending_tester_emails.granted_at AS preapproved_at,
                pending_tester_emails.applied_at, pending_tester_emails.applied_to_user_id,
                waitlist_signups.id AS waitlist_id, waitlist_signups.status AS waitlist_status,
                waitlist_signups.created_at AS waitlist_created_at
         FROM access_emails
         LEFT JOIN users ON LOWER(TRIM(users.email)) = access_emails.email
         LEFT JOIN pending_tester_emails ON pending_tester_emails.email = access_emails.email
         LEFT JOIN waitlist_signups ON LOWER(TRIM(waitlist_signups.email)) = access_emails.email
         ORDER BY COALESCE(users.tester_granted_at, pending_tester_emails.granted_at, users.created_at) DESC NULLS LAST, access_emails.email ASC`,
      ),
      pool.query(
        `SELECT email, user_id, event_type, access_source, granted_by,
                entitlement_ends_at, metadata, created_at
         FROM access_entitlement_events
         WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
         UNION ALL
         SELECT LOWER(TRIM(email)) AS email, id AS user_id,
                CASE WHEN tester_granted_at IS NOT NULL THEN 'granted' ELSE 'registered' END AS event_type,
                tester_access_source AS access_source, tester_granted_by AS granted_by,
                testing_entitlement_ends_at AS entitlement_ends_at,
                jsonb_build_object('reconstructedFrom', CASE WHEN tester_granted_at IS NOT NULL THEN 'users.tester_granted_at' ELSE 'users.created_at' END) AS metadata,
                COALESCE(tester_granted_at, created_at) AS created_at
         FROM users
         WHERE email IS NOT NULL
           AND COALESCE(tester_granted_at, created_at) >= NOW() - ($1::int * INTERVAL '1 day')
           AND NOT EXISTS (
             SELECT 1 FROM access_entitlement_events event
             WHERE LOWER(event.email) = LOWER(TRIM(users.email))
               AND event.event_type IN ('granted', 'registered')
           )
         ORDER BY created_at DESC`,
        [days],
      ),
    ]);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.json({ days, currentAccess: current.rows, recentEvents: events.rows });
  } catch (err) {
    req.log.error({ err }, "GET /admin/access-ledger failed");
    res.status(500).json({
      error:
        "Access ledger is unavailable until the database migration completes.",
    });
  }
});

// ─── GET /admin/testers/waitlist-city-preview ────────────────────────────────
// Read-only preflight for a deliberate city-level access grant. It never changes
// a waitlist or account record and excludes entries the founder removed.
router.get(
  "/admin/testers/waitlist-city-preview",
  async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });
    const city =
      typeof req.query.city === "string" ? req.query.city.trim() : "";
    const state =
      typeof req.query.state === "string"
        ? req.query.state.trim().toUpperCase()
        : "";
    if (!city) return void res.status(400).json({ error: "city is required" });
    try {
      const result = await pool.query<{
        email: string;
        first_name: string | null;
        status: string;
        user_id: string | null;
        tester_status: string | null;
      }>(
        `SELECT w.email, w.first_name, w.status, u.id AS user_id, u.tester_status
       FROM waitlist_signups w
       LEFT JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(w.email))
       WHERE LOWER(TRIM(w.city)) = LOWER($1)
         AND ($2 = '' OR UPPER(TRIM(COALESCE(w.state, ''))) = $2)
         AND COALESCE(w.status, 'pending') NOT IN ('rejected', 'removed')
       ORDER BY w.created_at ASC`,
        [city, state],
      );
      const rows = result.rows;
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
      res.json({
        city,
        state: state || null,
        eligible: rows.filter((row) => row.tester_status !== "active").length,
        alreadyActive: rows.filter((row) => row.tester_status === "active")
          .length,
        sample: rows.slice(0, 25),
      });
    } catch (err) {
      req.log.error({ err }, "GET /admin/testers/waitlist-city-preview failed");
      res.status(500).json({ error: "Could not preview this city." });
    }
  },
);

// ─── POST /admin/testers/dry-run ──────────────────────────────────────────────
// Preview what applying a tester email list would change. No data is modified.
// Body: { emails: string[], accessSource?: string, entitlementEndsAt?: string }
router.post("/admin/testers/dry-run", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });

  const {
    emails,
    accessSource = "admin_invite",
    entitlementEndsAt,
  } = req.body as {
    emails?: string[];
    accessSource?: string;
    entitlementEndsAt?: string;
  };

  if (!Array.isArray(emails) || emails.length === 0) {
    return void res.status(400).json({ error: "emails array is required" });
  }

  if (!(VALID_TESTER_ACCESS_SOURCES as readonly string[]).includes(accessSource)) {
    return void res.status(400).json({
      error: `accessSource must be one of: ${VALID_TESTER_ACCESS_SOURCES.join(", ")}`,
    });
  }

  try {
    const normalized = emails.map(normalizeEmail).filter(Boolean);
    const unique = [...new Set(normalized)];
    if (unique.length > 500) {
      return void res.status(400).json({
        error: "A bulk tester import may contain at most 500 emails.",
      });
    }
    const invalid = emails.filter((e) => !e.includes("@") || !e.includes("."));

    // Look up existing users by email
    const existingUsers = await pool.query<{
      id: string;
      email: string;
      role: string;
      member_type: string;
      tester_status: string | null;
      tester_access_source: string | null;
    }>(
      `SELECT id, email, role, member_type, tester_status, tester_access_source
       FROM users WHERE LOWER(TRIM(email)) = ANY($1)`,
      [unique],
    );

    // Look up existing pending emails
    const existingPending = await pool.query<{
      email: string;
      applied_at: string | null;
    }>(
      `SELECT email, applied_at FROM pending_tester_emails WHERE email = ANY($1)`,
      [unique],
    );

    const userMap = new Map(
      existingUsers.rows.map((u) => [normalizeEmail(u.email ?? ""), u]),
    );
    const pendingMap = new Map(existingPending.rows.map((p) => [p.email, p]));

    const rows = unique.map((email) => {
      const user = userMap.get(email);
      const pending = pendingMap.get(email);
      const isInvalid = invalid.some((i) => normalizeEmail(i) === email);

      let proposedChange: string;
      let conflict: string | null = null;

      if (isInvalid) {
        proposedChange = "SKIP — invalid email format";
        conflict = "invalid format";
      } else if (user) {
        if (user.tester_status === "active") {
          proposedChange =
            "UPDATE — refresh entitlement (already active tester)";
        } else {
          proposedChange =
            "GRANT — apply tester entitlement to existing account";
        }
      } else if (pending && !pending.applied_at) {
        proposedChange =
          "SKIP — already in pending list (will auto-attach on registration)";
        conflict = "already pending";
      } else {
        proposedChange =
          "PENDING — add to pre-approved list (will auto-attach on registration)";
      }

      return {
        email,
        existingAccount: user ? "YES" : "NO",
        currentRole: user?.role ?? "—",
        currentMemberType: user?.member_type ?? "—",
        currentTesterEntitlement:
          user?.tester_status === "active"
            ? `active (${user.tester_access_source ?? "unknown source"})`
            : (user?.tester_status ?? "none"),
        proposedChange,
        conflict,
      };
    });

    res.json({
      dryRun: true,
      accessSource,
      entitlementEndsAt: entitlementEndsAt ?? null,
      totalEmails: unique.length,
      willGrant: rows.filter(
        (r) =>
          r.proposedChange.startsWith("GRANT") ||
          r.proposedChange.startsWith("UPDATE"),
      ).length,
      willPend: rows.filter((r) => r.proposedChange.startsWith("PENDING"))
        .length,
      willSkip: rows.filter((r) => r.proposedChange.startsWith("SKIP")).length,
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

  const {
    emails,
    accessSource = "admin_invite",
    entitlementEndsAt,
  } = req.body as {
    emails?: string[];
    accessSource?: string;
    entitlementEndsAt?: string;
  };

  if (!Array.isArray(emails) || emails.length === 0) {
    return void res.status(400).json({ error: "emails array is required" });
  }

  if (!(VALID_TESTER_ACCESS_SOURCES as readonly string[]).includes(accessSource)) {
    return void res.status(400).json({
      error: `accessSource must be one of: ${VALID_TESTER_ACCESS_SOURCES.join(", ")}`,
    });
  }

  const adminId = (req as any).user?.id as string | undefined;
  const endsAt = entitlementEndsAt ? new Date(entitlementEndsAt) : null;

  try {
    const normalized = emails
      .map(normalizeEmail)
      .filter((e) => e.includes("@") && e.includes("."));
    const unique = [...new Set(normalized)];
    if (unique.length > 500) {
      return void res.status(400).json({
        error: "A bulk tester import may contain at most 500 emails.",
      });
    }

    // Find existing users
    const existingUsers = await pool.query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE LOWER(TRIM(email)) = ANY($1)`,
      [unique],
    );
    const userMap = new Map(
      existingUsers.rows.map((u) => [normalizeEmail(u.email ?? ""), u]),
    );

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
               approved = TRUE,
               tester_access_source = $1,
               tester_granted_at = NOW(),
               tester_granted_by = $2,
               testing_entitlement_ends_at = $3,
               role = CASE WHEN role = 'user' THEN 'tester' ELSE role END,
               updated_at = NOW()
           WHERE id = $4`,
          [accessSource, adminId ?? null, endsAt, user.id],
        );
        await upsertApprovedTesterWaitlistRecord({
          email,
          accessSource: accessSource as (typeof VALID_TESTER_ACCESS_SOURCES)[number],
        });
        // Also upsert into pending_tester_emails (mark as already applied)
        await pool.query(
          `INSERT INTO pending_tester_emails (email, tester_access_source, granted_by, granted_at, entitlement_ends_at, applied_at, applied_to_user_id)
           VALUES ($1, $2, $3, NOW(), $4, NOW(), $5)
           ON CONFLICT (email) DO UPDATE
           SET tester_access_source = $2, granted_by = $3, entitlement_ends_at = $4,
               applied_at = NOW(), applied_to_user_id = $5`,
          [email, accessSource, adminId ?? null, endsAt, user.id],
        );
        await recordAccessEvent({
          email,
          userId: user.id,
          eventType: "granted",
          accessSource,
          grantedBy: adminId ?? null,
          entitlementEndsAt: endsAt,
        });
        updated++;
      } else {
        // No account yet — add to pending list for auto-attach on registration
        try {
          await upsertApprovedTesterWaitlistRecord({
            email,
            accessSource: accessSource as (typeof VALID_TESTER_ACCESS_SOURCES)[number],
          });
          await pool.query(
            `INSERT INTO pending_tester_emails (email, tester_access_source, granted_by, granted_at, entitlement_ends_at)
             VALUES ($1, $2, $3, NOW(), $4)
             ON CONFLICT (email) DO UPDATE
             SET tester_access_source = $2, granted_by = $3, entitlement_ends_at = $4`,
            [email, accessSource, adminId ?? null, endsAt],
          );
          await recordAccessEvent({
            email,
            eventType: "granted",
            accessSource,
            grantedBy: adminId ?? null,
            entitlementEndsAt: endsAt,
          });
          pendingAdded++;
        } catch {
          skipped.push({ email, reason: "Failed to insert pending record" });
        }
      }
    }

    req.log.info(
      {
        updated,
        pendingAdded,
        skipped: skipped.length,
        by: adminId,
        accessSource,
      },
      "Tester entitlements applied",
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

// ─── POST /admin/testers/apply-waitlist-city ─────────────────────────────────
// Grants access to existing unified-waitlist records from one city. This action
// is immediate and final once confirmed; it does not create, delete, or modify
// a user account, password, session, referral, or waitlist history.
router.post(
  "/admin/testers/apply-waitlist-city",
  async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });
    const {
      city,
      state,
      confirmed,
      accessSource = "admin_invite",
      entitlementEndsAt,
    } = req.body as {
      city?: string;
      state?: string;
      confirmed?: boolean;
      accessSource?: string;
      entitlementEndsAt?: string;
    };
    const cleanCity = typeof city === "string" ? city.trim() : "";
    const cleanState =
      typeof state === "string" ? state.trim().toUpperCase() : "";
    const validSources = [
      "testflight",
      "android_test",
      "admin_invite",
      "website_test",
    ];
    if (!cleanCity)
      return void res.status(400).json({ error: "city is required" });
    if (confirmed !== true)
      return void res.status(400).json({
        error: "Explicit confirmation is required before a city-wide grant.",
      });
    if (!validSources.includes(accessSource))
      return void res.status(400).json({ error: "Invalid access source." });
    const endsAt = entitlementEndsAt ? new Date(entitlementEndsAt) : null;
    if (endsAt && Number.isNaN(endsAt.getTime()))
      return void res
        .status(400)
        .json({ error: "Invalid entitlement end date." });
    try {
      const result = await pool.query<{
        email: string;
        id: string | null;
        tester_status: string | null;
      }>(
        `SELECT w.email, u.id, u.tester_status
       FROM waitlist_signups w
       LEFT JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(w.email))
       WHERE LOWER(TRIM(w.city)) = LOWER($1)
         AND ($2 = '' OR UPPER(TRIM(COALESCE(w.state, ''))) = $2)
         AND COALESCE(w.status, 'pending') NOT IN ('rejected', 'removed')
       ORDER BY w.created_at ASC
       LIMIT 2001`,
        [cleanCity, cleanState],
      );
      if (result.rows.length > 2000) {
        return void res.status(409).json({
          error:
            "More than 2,000 eligible entries found. Narrow the city scope before granting access.",
        });
      }
      const adminId = (req as any).user?.id as string | undefined;
      let accountGrants = 0;
      let pendingGrants = 0;
      let alreadyActive = 0;
      for (const row of result.rows) {
        const email = normalizeEmail(row.email);
        await upsertApprovedTesterWaitlistRecord({
          email,
          accessSource: accessSource as (typeof VALID_TESTER_ACCESS_SOURCES)[number],
        });
        if (row.tester_status === "active") {
          alreadyActive++;
          continue;
        }
        if (row.id) {
          await pool.query(
            `UPDATE users
           SET tester_status = 'active', tester_access_source = $1,
               approved = TRUE,
               tester_granted_at = NOW(), tester_granted_by = $2,
               testing_entitlement_ends_at = $3,
               role = CASE WHEN role = 'user' THEN 'tester' ELSE role END,
               updated_at = NOW()
           WHERE id = $4`,
            [accessSource, adminId ?? null, endsAt, row.id],
          );
          await pool.query(
            `INSERT INTO pending_tester_emails
             (email, tester_access_source, granted_by, granted_at, entitlement_ends_at, applied_at, applied_to_user_id)
           VALUES ($1, $2, $3, NOW(), $4, NOW(), $5)
           ON CONFLICT (email) DO UPDATE
           SET tester_access_source = $2, granted_by = $3, granted_at = NOW(),
               entitlement_ends_at = $4, applied_at = NOW(), applied_to_user_id = $5`,
            [email, accessSource, adminId ?? null, endsAt, row.id],
          );
          await recordAccessEvent({
            email,
            userId: row.id,
            eventType: "granted",
            accessSource,
            grantedBy: adminId ?? null,
            entitlementEndsAt: endsAt,
          });
          accountGrants++;
        } else {
          await pool.query(
            `INSERT INTO pending_tester_emails (email, tester_access_source, granted_by, granted_at, entitlement_ends_at)
           VALUES ($1, $2, $3, NOW(), $4)
           ON CONFLICT (email) DO UPDATE
           SET tester_access_source = $2, granted_by = $3, granted_at = NOW(), entitlement_ends_at = $4,
               applied_at = NULL, applied_to_user_id = NULL`,
            [email, accessSource, adminId ?? null, endsAt],
          );
          await recordAccessEvent({
            email,
            eventType: "granted",
            accessSource,
            grantedBy: adminId ?? null,
            entitlementEndsAt: endsAt,
          });
          pendingGrants++;
        }
      }
      res.json({
        ok: true,
        city: cleanCity,
        state: cleanState || null,
        accountGrants,
        pendingGrants,
        alreadyActive,
        processed: result.rows.length,
      });
    } catch (err) {
      req.log.error({ err }, "POST /admin/testers/apply-waitlist-city failed");
      res.status(500).json({ error: "Could not grant city waitlist access." });
    }
  },
);

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
      [email],
    );

    // Remove from pending list (whether applied or not)
    await pool.query(`DELETE FROM pending_tester_emails WHERE email = $1`, [
      email,
    ]);

    const revokedUser = userResult.rows[0] ?? null;
    await recordAccessEvent({
      email,
      userId: revokedUser?.id ?? null,
      eventType: "revoked",
      grantedBy: ((req as any).user?.id as string | undefined) ?? null,
    });
    req.log.info(
      { email, revokedUserId: revokedUser?.id, by: (req as any).user?.id },
      "Tester entitlement revoked",
    );

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
