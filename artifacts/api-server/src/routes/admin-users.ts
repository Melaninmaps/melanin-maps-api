import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, getPoolStats, usersTable, waitlistTable } from "@workspace/db";
import { eq, ne, desc, count, gte, isNotNull, sql } from "drizzle-orm";
import { sendApprovalNotification } from "../lib/email";
import { sendPushToUser } from "../lib/pushNotifications";
import { isAdmin } from "../lib/adminAuth";
import {
  isFounderOwnerRequest,
  isProtectedAdminEmail,
} from "../lib/protectedAdminAccess";

const router: IRouter = Router();

router.get("/admin/users", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const includeHidden = String(req.query.visibility ?? "active") === "all";
    const [users, retainedCountResult, hiddenCountResult] = await Promise.all([
      db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        approved: usersTable.approved,
        accountStatus: usersTable.accountStatus,
        lifecycleUpdatedAt: usersTable.lifecycleUpdatedAt,
        lifecycleReason: usersTable.lifecycleReason,
        role: usersTable.role,
        testerStatus: usersTable.testerStatus,
        testerAccessSource: usersTable.testerAccessSource,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(includeHidden ? undefined : ne(usersTable.accountStatus, "hidden"))
      .orderBy(desc(usersTable.createdAt)),
      db.select({ total: count() }).from(usersTable),
      db.select({ total: count() }).from(usersTable).where(eq(usersTable.accountStatus, "hidden")),
    ]);
    res.json({
      users,
      retainedTotal: Number(retainedCountResult[0]?.total ?? 0),
      hiddenCount: Number(hiddenCountResult[0]?.total ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Failed to list users" });
  }
});

// Reversible lifecycle control: Hide removes an account from the default Admin
// presentation list. Suspend revokes access while retaining the account,
// profile, community content, and audit history.
router.patch("/admin/users/:id/lifecycle", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = String(req.params.id);
  const action = String(req.body?.action ?? "");
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";
  const actionToStatus = {
    hide: "hidden",
    suspend: "suspended",
    restore: "active",
  } as const;
  if (!(action in actionToStatus)) {
    res.status(400).json({ error: "action must be hide, suspend, or restore" });
    return;
  }
  if (id === req.user?.id) {
    res.status(400).json({ error: "Administrators cannot change their own lifecycle status here." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const target = await client.query<{
      id: string;
      role: string;
      account_status: "active" | "hidden" | "suspended";
      approved: boolean;
    }>(
      `SELECT id, role, account_status, approved FROM users WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const user = target.rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.role === "admin") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Administrator accounts cannot be hidden or suspended from this screen." });
      return;
    }

    const nextStatus = actionToStatus[action as keyof typeof actionToStatus];
    await client.query(
      `UPDATE users
          SET account_status = $2,
              approved = CASE WHEN $5 = 'suspend' THEN FALSE ELSE approved END,
              lifecycle_updated_at = NOW(),
              lifecycle_updated_by = $3,
              lifecycle_reason = $4,
              updated_at = NOW()
        WHERE id = $1`,
      [id, nextStatus, req.user?.id ?? null, reason || null, action],
    );
    await client.query(
      `INSERT INTO admin_account_lifecycle_events
         (user_id, actor_user_id, prior_status, next_status, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, req.user?.id ?? null, user.account_status, nextStatus, reason || null],
    );
    if (action === "suspend") {
      await client.query(`DELETE FROM sessions WHERE sess->'user'->>'id' = $1`, [id]);
    }
    await client.query("COMMIT");
    res.json({
      user: {
        id,
        accountStatus: nextStatus,
        approved: action === "suspend" ? false : user.approved,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    req.log.error({ err }, "Failed to update account lifecycle");
    res.status(500).json({ error: "Failed to update account lifecycle" });
  } finally {
    client.release();
  }
});

// Administrator bulk controls deliberately share individual lifecycle limits:
// they cannot change administrators, protected identities, or the acting user.
router.post("/admin/users/bulk", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const ids = Array.isArray(req.body?.ids)
    ? [...new Set(req.body.ids.filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0))].slice(0, 500)
    : [];
  const action = String(req.body?.action ?? "");
  const allowedActions = ["approve", "revoke", "make_tester", "make_user", "hide", "suspend", "restore"] as const;
  if (ids.length === 0) {
    res.status(400).json({ error: "Select at least one account." });
    return;
  }
  if (!allowedActions.includes(action as (typeof allowedActions)[number])) {
    res.status(400).json({ error: "Invalid bulk account action." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const selected = await client.query<{
      id: string;
      email: string | null;
      role: string;
      account_status: "active" | "hidden" | "suspended";
    }>(
      `SELECT id, email, role, account_status
         FROM users
        WHERE id = ANY($1::varchar[])
        FOR UPDATE`,
      [ids],
    );
    if (selected.rows.length !== ids.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "One or more selected accounts no longer exist. Refresh and try again." });
      return;
    }
    if (selected.rows.some((user) => user.id === req.user?.id || user.role === "admin" || isProtectedAdminEmail(user.email))) {
      await client.query("ROLLBACK");
      res.status(409).json({
        error: "Bulk actions cannot change your own or administrator accounts. Use the founder-controlled administrator action for a protected administrator.",
      });
      return;
    }

    const actorId = req.user?.id ?? null;
    const actionLabel: Record<(typeof allowedActions)[number], string> = {
      approve: "Administrator bulk approval",
      revoke: "Administrator bulk access revocation",
      make_tester: "Administrator bulk tester assignment",
      make_user: "Administrator bulk tester removal",
      hide: "Administrator bulk presentation cleanup",
      suspend: "Administrator bulk suspension",
      restore: "Administrator bulk restoration",
    };
    if (action === "approve" || action === "revoke") {
      await client.query(
        `UPDATE users SET approved = $2, updated_at = NOW() WHERE id = ANY($1::varchar[])`,
        [ids, action === "approve"],
      );
    } else if (action === "make_tester" || action === "make_user") {
      await client.query(
        `UPDATE users SET role = $2, updated_at = NOW() WHERE id = ANY($1::varchar[])`,
        [ids, action === "make_tester" ? "tester" : "user"],
      );
    } else {
      const nextStatus = action === "hide" ? "hidden" : action === "suspend" ? "suspended" : "active";
      await client.query(
        `UPDATE users
            SET account_status = $2,
                approved = CASE WHEN $3 = 'suspend' THEN FALSE ELSE approved END,
                lifecycle_updated_at = NOW(),
                lifecycle_updated_by = $4,
                lifecycle_reason = $5,
                updated_at = NOW()
          WHERE id = ANY($1::varchar[])`,
        [ids, nextStatus, action, actorId, actionLabel[action as (typeof allowedActions)[number]]],
      );
      for (const user of selected.rows) {
        await client.query(
          `INSERT INTO admin_account_lifecycle_events
             (user_id, actor_user_id, prior_status, next_status, reason)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, actorId, user.account_status, nextStatus, actionLabel[action as (typeof allowedActions)[number]]],
        );
      }
      if (action === "suspend") {
        await client.query(`DELETE FROM sessions WHERE sess->'user'->>'id' = ANY($1::varchar[])`, [ids]);
      }
    }
    await client.query("COMMIT");
    res.json({ ok: true, updated: ids.length, action });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    req.log.error({ err }, "Failed bulk account administration update");
    res.status(500).json({ error: "The bulk account update was not saved." });
  } finally {
    client.release();
  }
});

// Permanent account cleanup is intentionally separate from lifecycle updates so
// an administrator must explicitly choose deletion rather than accidentally
// applying it with approval, role, or access actions.
router.post("/admin/users/bulk-delete", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rawIds: unknown[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const ids: string[] = [...new Set(rawIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0))].slice(0, 500);
  if (ids.length === 0) {
    res.status(400).json({ error: "Select at least one account to permanently delete." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const selected = await client.query<{ id: string; email: string | null; role: string }>(
      `SELECT id, email, role
         FROM users
        WHERE id = ANY($1::varchar[])
        FOR UPDATE`,
      [ids],
    );
    if (selected.rows.length !== ids.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "One or more selected accounts no longer exist. Refresh and try again." });
      return;
    }
    if (selected.rows.some((user) => user.id === req.user?.id || user.role === "admin" || isProtectedAdminEmail(user.email))) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Bulk deletion cannot remove your own or administrator accounts." });
      return;
    }

    const dependencyResult = await client.query<{ id: string }>(
      `SELECT u.id
         FROM users u
        WHERE u.id = ANY($1::varchar[])
          AND (
            EXISTS (SELECT 1 FROM business_kinfolk_voice_profiles WHERE owner_user_id = u.id)
            OR EXISTS (
              SELECT 1
                FROM canonical_mwm_owner_attachment_audit
               WHERE target_user_id = u.id OR actor_user_id = u.id
            )
          )`,
      [ids],
    );
    const heldIds = dependencyResult.rows.map((row) => row.id);
    const removableIds = ids.filter((id) => !heldIds.includes(id));
    if (removableIds.length > 0) {
      const removableEmails = selected.rows
        .filter((user) => removableIds.includes(user.id))
        .map((user) => user.email)
        .filter((email): email is string => Boolean(email));
      await client.query(`DELETE FROM sessions WHERE sess->'user'->>'id' = ANY($1::varchar[])`, [removableIds]);
      await client.query(`DELETE FROM admin_account_lifecycle_events WHERE user_id = ANY($1::varchar[])`, [removableIds]);
      await client.query(`DELETE FROM access_entitlement_events WHERE user_id = ANY($1::varchar[])`, [removableIds]);
      if (removableEmails.length > 0) {
        await client.query(`DELETE FROM pending_tester_emails WHERE LOWER(TRIM(email)) = ANY($1::text[])`, [removableEmails.map((email) => email.trim().toLowerCase())]);
      }
      await client.query(`DELETE FROM users WHERE id = ANY($1::varchar[])`, [removableIds]);
    }
    await client.query("COMMIT");
    req.log.info(
      { event: "ADMIN_USERS_BULK_PERMANENT_DELETE", deleted: removableIds.length, held: heldIds.length, by: req.user?.id },
      "admin permanently deleted selected accounts",
    );
    res.json({ ok: true, deletedIds: removableIds, heldIds });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    req.log.error({ err }, "Failed bulk permanent account deletion");
    res.status(409).json({ error: "The selected accounts were not deleted because retained dependent data still references one or more accounts." });
  } finally {
    client.release();
  }
});

// Founder-only access control for the two explicitly protected administrator
// accounts. Generic Admin lifecycle, approval, role, and tester controls may
// not change these records. A founder owner can revoke or restore their full
// platform access here; revocation is retained across restarts until restored.
router.patch("/admin/protected-administrators/:id/access", async (req: Request, res: Response) => {
  if (!isAdmin(req) || !isFounderOwnerRequest(req)) {
    return void res.status(403).json({ error: "Only the founder owner can change protected administrator access." });
  }
  const id = String(req.params.id);
  const action = String(req.body?.action ?? "");
  if (action !== "revoke" && action !== "restore") {
    return void res.status(400).json({ error: "action must be revoke or restore" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS founder_protected_admin_access_overrides (
        email TEXT PRIMARY KEY,
        revoked_by_user_id VARCHAR(255),
        revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reason VARCHAR(500) NOT NULL DEFAULT 'Founder revoked protected administrator access'
      )
    `);
    const target = await client.query<{
      id: string;
      email: string | null;
      account_status: "active" | "hidden" | "suspended";
    }>(
      `SELECT id, email, account_status
         FROM users
        WHERE id = $1
        FOR UPDATE`,
      [id],
    );
    const user = target.rows[0];
    if (!user || !isProtectedAdminEmail(user.email)) {
      await client.query("ROLLBACK");
      return void res.status(404).json({ error: "Protected administrator account not found." });
    }
    const email = user.email!.trim().toLowerCase();
    const actorId = req.user?.id ?? null;

    if (action === "revoke") {
      await client.query(
        `INSERT INTO founder_protected_admin_access_overrides
           (email, revoked_by_user_id, revoked_at, reason)
         VALUES ($1, $2, NOW(), 'Founder revoked protected administrator access')
         ON CONFLICT (email) DO UPDATE
           SET revoked_by_user_id = EXCLUDED.revoked_by_user_id,
               revoked_at = NOW(),
               reason = EXCLUDED.reason`,
        [email, actorId],
      );
      await client.query(
        `UPDATE users
            SET role = 'user',
                approved = FALSE,
                account_status = 'suspended',
                tester_status = 'inactive',
                testing_entitlement_ends_at = NOW(),
                lifecycle_updated_at = NOW(),
                lifecycle_updated_by = $2,
                lifecycle_reason = 'Founder revoked protected administrator access',
                updated_at = NOW()
          WHERE id = $1`,
        [id, actorId],
      );
      await client.query(`DELETE FROM sessions WHERE sess->'user'->>'id' = $1`, [id]);
    } else {
      await client.query(
        `DELETE FROM founder_protected_admin_access_overrides WHERE email = $1`,
        [email],
      );
      await client.query(
        `UPDATE users
            SET role = 'admin',
                approved = TRUE,
                account_status = 'active',
                member_type = 'founding',
                tester_status = 'active',
                tester_access_source = 'admin_invite',
                tester_granted_at = COALESCE(tester_granted_at, NOW()),
                tester_granted_by = COALESCE(tester_granted_by, $2),
                testing_entitlement_ends_at = NULL,
                lifecycle_updated_at = NOW(),
                lifecycle_updated_by = $2,
                lifecycle_reason = 'Founder restored protected administrator access',
                updated_at = NOW()
          WHERE id = $1`,
        [id, actorId],
      );
    }
    const nextStatus = action === "revoke" ? "suspended" : "active";
    await client.query(
      `INSERT INTO admin_account_lifecycle_events
         (user_id, actor_user_id, prior_status, next_status, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, actorId, user.account_status, nextStatus, `Founder ${action}d protected administrator access`],
    );
    await client.query(
      `INSERT INTO access_entitlement_events
         (email, user_id, event_type, access_source, granted_by, entitlement_ends_at, metadata)
       VALUES ($1, $2, $3, 'admin_invite', $4, $5,
               jsonb_build_object('workflow', 'founder_protected_administrator_access_v1'))`,
      [email, id, action === "revoke" ? "revoked" : "granted", actorId, action === "revoke" ? new Date() : null],
    );
    await client.query("COMMIT");
    res.json({ ok: true, accountStatus: nextStatus, access: action === "revoke" ? "revoked" : "restored" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    req.log.error({ err }, "Failed to change protected administrator access");
    res.status(500).json({ error: "Protected administrator access change failed; no partial change was saved." });
  } finally {
    client.release();
  }
});

router.patch("/admin/users/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = String(req.params.id);
  const { approved, role, firstName, lastName } = req.body;

  if (approved !== undefined && typeof approved !== "boolean") {
    res.status(400).json({ error: "approved must be a boolean" });
    return;
  }
  if (role !== undefined && !["user", "tester", "admin"].includes(role)) {
    res.status(400).json({ error: "role must be one of: user, tester, admin" });
    return;
  }
  if (firstName !== undefined && (typeof firstName !== "string" || firstName.trim().length > 100)) {
    res.status(400).json({ error: "firstName must be 100 characters or fewer" });
    return;
  }
  if (lastName !== undefined && (typeof lastName !== "string" || lastName.trim().length > 100)) {
    res.status(400).json({ error: "lastName must be 100 characters or fewer" });
    return;
  }
  if (approved === undefined && role === undefined && firstName === undefined && lastName === undefined) {
    res.status(400).json({ error: "Provide an account field to update" });
    return;
  }

  const current = await pool.query<{ email: string | null; role: string }>(
    `SELECT email, role FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  const target = current.rows[0];
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (isProtectedAdminEmail(target.email)) {
    if (!isFounderOwnerRequest(req)) {
      res.status(403).json({ error: "Only the founder owner can change protected administrator access." });
      return;
    }
    res.status(409).json({ error: "Use the founder-only protected administrator access control for this account." });
    return;
  }
  if (target.role === "admin") {
    res.status(409).json({ error: "Administrator role changes are not available from the general user control." });
    return;
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (approved !== undefined) updateData.approved = approved;
  if (role !== undefined) updateData.role = role;
  if (firstName !== undefined) updateData.firstName = firstName.trim() || null;
  if (lastName !== undefined) updateData.lastName = lastName.trim() || null;

  try {
    const [updated] = await db
      .update(usersTable)
      .set(updateData as any)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        approved: usersTable.approved,
        role: usersTable.role,
      });
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (approved && updated.email) {
      // The waitlist is the single authorization ledger. A direct Registered
      // Users approval must therefore approve the matching record too, rather
      // than leaving an account looking approved while the platform gate still
      // correctly denies it.
      const email = updated.email.toLowerCase().trim();
      const [existingWaitlist] = await db
        .select({ id: waitlistTable.id })
        .from(waitlistTable)
        .where(eq(waitlistTable.email, email))
        .limit(1);
      if (existingWaitlist) {
        await db
          .update(waitlistTable)
          .set({ status: "approved", approvedAt: new Date() })
          .where(eq(waitlistTable.id, existingWaitlist.id));
      } else {
        await db.insert(waitlistTable).values({
          email,
          firstName: updated.firstName,
          status: "approved",
          approvedAt: new Date(),
          signupSources: "web",
        });
      }
      sendApprovalNotification(updated.email, updated.firstName).catch(() => {});
      sendPushToUser(updated.id, {
        title: "You're approved! 🎉",
        body: "Welcome to Mapping With Melanin™. Start discovering now.",
        data: { screen: "/(tabs)/discover" },
      }).catch(() => {});
    }

    res.json({ user: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ── Admin email correction (#153) ──────────────────────────────────────────────
// Lets admins update a user's email address — primarily for Apple relay users
// (abc@privaterelay.appleid.com) who can't log in on web with their real email.
router.patch("/admin/users/:id/email", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });
  const id = String(req.params.id);
  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@")) {
    return void res.status(400).json({ error: "Valid email required" });
  }
  // Prevent overwriting with another Apple relay address
  if (email.endsWith("@privaterelay.appleid.com")) {
    return void res.status(400).json({ error: "Cannot set an Apple relay address as the real email" });
  }
  try {
    const target = await pool.query<{ email: string | null }>(
      `SELECT email FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (!target.rows[0]) return void res.status(404).json({ error: "User not found" });
    if (isProtectedAdminEmail(target.rows[0].email) && !isFounderOwnerRequest(req)) {
      return void res.status(403).json({ error: "Only the founder owner can change protected administrator access." });
    }
    if (isProtectedAdminEmail(target.rows[0].email)) {
      return void res.status(409).json({ error: "Protected administrator email changes require a separate founder-controlled recovery review." });
    }
    const { rows: existing } = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2`,
      [email.trim(), id],
    );
    if (existing.length > 0) {
      return void res.status(409).json({ error: "Email already used by another account" });
    }
    const { rows } = await pool.query(
      `UPDATE users
       SET email = $1, email_verified = true, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, first_name, last_name`,
      [email.trim().toLowerCase(), id],
    );
    if (rows.length === 0) return void res.status(404).json({ error: "User not found" });
    req.log.info({ userId: id, newEmail: email.trim() }, "Admin corrected user email");
    res.json({ ok: true, user: rows[0] });
  } catch (err) {
    req.log.error({ err }, "PATCH /admin/users/:id/email error");
    res.status(500).json({ error: "Failed", detail: String(err) });
  }
});

router.delete("/admin/users/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = String(req.params.id);
  const selfId = (req as any).user?.id;
  if (id === selfId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const targetResult = await client.query<{ id: string; email: string | null; role: string }>(
      `SELECT id, email, role FROM users WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const target = targetResult.rows[0];
    if (!target) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (target.role === "admin" || isProtectedAdminEmail(target.email)) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Administrator accounts cannot be deleted from this screen." });
      return;
    }
    const ownerDependencies = await client.query<{ blocked: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM business_kinfolk_voice_profiles WHERE owner_user_id = $1
         UNION ALL
         SELECT 1 FROM canonical_mwm_owner_attachment_audit WHERE target_user_id = $1 OR actor_user_id = $1
       ) AS blocked`,
      [id],
    );
    if (ownerDependencies.rows[0]?.blocked) {
      await client.query("ROLLBACK");
      res.status(409).json({
        error: "This account has retained business-owner history. Reassign or clear that owner relationship before permanently deleting the account.",
        code: "ACCOUNT_HAS_OWNER_DEPENDENCIES",
      });
      return;
    }

    await client.query(`DELETE FROM sessions WHERE sess->'user'->>'id' = $1`, [id]);
    await client.query(`DELETE FROM admin_account_lifecycle_events WHERE user_id = $1`, [id]);
    await client.query(`DELETE FROM access_entitlement_events WHERE user_id = $1`, [id]);
    if (target.email) {
      await client.query(`DELETE FROM pending_tester_emails WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`, [target.email]);
    }
    const deleted = await client.query<{ id: string; email: string | null }>(
      `DELETE FROM users WHERE id = $1 RETURNING id, email`,
      [id],
    );
    await client.query("COMMIT");
    req.log.info({ deletedUserId: id, deletedEmail: target.email, by: selfId }, "Admin permanently deleted user account");
    res.json({ ok: true, deleted: deleted.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    req.log.error({ err }, "Failed to permanently delete user");
    res.status(409).json({ error: "The account was not deleted because retained dependent data still references it." });
  } finally {
    client.release();
  }
});

router.get("/admin/metrics", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [[{ total }], [{ approved }], [{ today }], [{ week }], cities, daily] =
      await Promise.all([
        db.select({ total: count() }).from(waitlistTable),
        db
          .select({ approved: count() })
          .from(waitlistTable)
          .where(eq(waitlistTable.status, "approved")),
        db
          .select({ today: count() })
          .from(waitlistTable)
          .where(gte(waitlistTable.createdAt, todayStart)),
        db
          .select({ week: count() })
          .from(waitlistTable)
          .where(gte(waitlistTable.createdAt, weekStart)),
        db
          .select({ city: waitlistTable.city, count: count() })
          .from(waitlistTable)
          .where(isNotNull(waitlistTable.city))
          .groupBy(waitlistTable.city)
          .orderBy(desc(count()))
          .limit(10),
        pool.query(`
          SELECT
            TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS count
          FROM waitlist_signups
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
          ORDER BY date
        `),
      ]);

    // ── Platform health — sequential queries (no Promise.all per pool-exhaustion rule) ──
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const sessResult = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM sessions WHERE expire > NOW()`
    );
    const activeSessions: number = sessResult.rows[0]?.cnt ?? 0;

    const mTotalResult = await pool.query(`SELECT COUNT(*)::int AS cnt FROM users`);
    const membersTotal: number = mTotalResult.rows[0]?.cnt ?? 0;

    const mTodayResult = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM users WHERE created_at >= $1`,
      [todayStart]
    );
    const membersToday: number = mTodayResult.rows[0]?.cnt ?? 0;

    let communityPostsToday = 0;
    try {
      const postsResult = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM community_posts WHERE created_at >= $1`,
        [todayStart]
      );
      communityPostsToday = postsResult.rows[0]?.cnt ?? 0;
    } catch { /* table may not exist on dev */ }

    const authResult = await pool.query(
      `SELECT
        SUM(CASE WHEN event = 'AUTH_LOGIN_SUCCESS' THEN 1 ELSE 0 END)::int AS logins,
        SUM(CASE WHEN event IN ('AUTH_LOGIN_FAILURE','AUTH_LOGIN_PASSWORD_MISMATCH','AUTH_LOGIN_USER_NOT_FOUND') THEN 1 ELSE 0 END)::int AS failures
       FROM auth_events WHERE created_at >= $1`,
      [hourAgo]
    );
    const loginsLastHour: number = authResult.rows[0]?.logins ?? 0;
    const failuresLastHour: number = authResult.rows[0]?.failures ?? 0;

    res.json({
      total: Number(total),
      approved: Number(approved),
      today: Number(today),
      week: Number(week),
      cities: cities.map((c) => ({ city: c.city, count: Number(c.count) })),
      daily: (daily.rows as { date: string; count: number }[]).map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      platform: {
        uptimeSeconds: Math.floor(process.uptime()),
        generatedAt: new Date().toISOString(),
        pool: getPoolStats(),
        activeSessions,
        membersTotal,
        membersToday,
        communityPostsToday,
        loginsLastHour,
        failuresLastHour,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch metrics");
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

router.get("/admin/leaderboard", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const result = await pool.query(`
      SELECT
        w.referred_by             AS referral_code,
        r.email                   AS referrer_email,
        r.first_name              AS referrer_first_name,
        COUNT(*)::int             AS referral_count
      FROM waitlist_signups w
      LEFT JOIN waitlist_signups r ON r.referral_code = w.referred_by
      WHERE w.referred_by IS NOT NULL AND w.referred_by <> ''
      GROUP BY w.referred_by, r.email, r.first_name
      ORDER BY referral_count DESC
      LIMIT 25
    `);
    res.json({
      leaderboard: (
        result.rows as {
          referral_code: string;
          referrer_email: string | null;
          referrer_first_name: string | null;
          referral_count: number;
        }[]
      ).map((r, i) => ({
        rank: i + 1,
        referralCode: r.referral_code,
        email: r.referrer_email ?? r.referral_code,
        name: r.referrer_first_name ?? null,
        referralCount: Number(r.referral_count),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leaderboard");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
