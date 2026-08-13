import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, getPoolStats, usersTable, waitlistTable } from "@workspace/db";
import { eq, desc, count, gte, isNotNull, sql } from "drizzle-orm";
import { sendApprovalNotification } from "../lib/email";
import { sendPushToUser } from "../lib/pushNotifications";
import { isAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/admin/users", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        approved: usersTable.approved,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));
    res.json({ users });
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.patch("/admin/users/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = String(req.params.id);
  const { approved, role } = req.body;

  if (approved !== undefined && typeof approved !== "boolean") {
    res.status(400).json({ error: "approved must be a boolean" });
    return;
  }
  if (role !== undefined && !["user", "tester", "admin"].includes(role)) {
    res.status(400).json({ error: "role must be one of: user, tester, admin" });
    return;
  }
  if (approved === undefined && role === undefined) {
    res.status(400).json({ error: "Must provide approved or role" });
    return;
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (approved !== undefined) updateData.approved = approved;
  if (role !== undefined) updateData.role = role;

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
  try {
    const [deleted] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, email: usersTable.email });
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    req.log.info({ deletedUserId: deleted.id, deletedEmail: deleted.email, by: selfId }, "Admin deleted user account");
    res.json({ ok: true, deleted });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
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
