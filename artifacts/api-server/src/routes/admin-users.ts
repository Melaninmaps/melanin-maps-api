import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, waitlistTable } from "@workspace/db";
import { eq, desc, count, gte, isNotNull, sql } from "drizzle-orm";
import { sendApprovalNotification } from "../lib/email";
import { sendPushToUser } from "../lib/pushNotifications";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

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
        db.execute(sql`
          SELECT
            TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS count
          FROM waitlist_signups
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
          ORDER BY date
        `),
      ]);

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
    const result = await db.execute(sql`
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
