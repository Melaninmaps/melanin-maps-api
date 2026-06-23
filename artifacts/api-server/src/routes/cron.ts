import { Router, type IRouter } from "express";
import { db, usersTable, businessesTable, safetyCheckinsTable } from "@workspace/db";
import { and, isNotNull, lte, gt, eq, isNull, gte } from "drizzle-orm";
import { sendTrialEndingSoon, sendTrialExpired, sendWeeklyDigest, sendCheckinOverdueEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CRON_SECRET = process.env.CRON_SECRET;

function verifyCronSecret(req: any, res: any): boolean {
  if (!CRON_SECRET) return true;
  const auth = req.headers["x-cron-secret"];
  if (auth !== CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.post("/cron/trial-reminders", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    const expiringSoon = await db
      .select()
      .from(usersTable)
      .where(
        and(
          isNotNull(usersTable.trialEndsAt),
          gt(usersTable.trialEndsAt, now),
          lte(usersTable.trialEndsAt, in3Days),
          isNotNull(usersTable.email),
        ),
      );

    const expired = await db
      .select()
      .from(usersTable)
      .where(
        and(
          isNotNull(usersTable.trialEndsAt),
          lte(usersTable.trialEndsAt, now),
          isNotNull(usersTable.email),
          isNull(usersTable.stripeSubscriptionId),
        ),
      );

    let remindersSent = 0;
    let expiryEmailsSent = 0;

    for (const user of expiringSoon) {
      if (!user.email || !user.trialEndsAt) continue;
      const daysLeft = Math.max(1, Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      try {
        await sendTrialEndingSoon(user.email, user.firstName, user.memberType ?? "individual", user.trialEndsAt, daysLeft);
        remindersSent++;
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send trial ending soon email");
      }
    }

    for (const user of expired) {
      if (!user.email) continue;
      try {
        await sendTrialExpired(user.email, user.firstName, user.memberType ?? "individual");
        expiryEmailsSent++;
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send trial expired email");
      }
    }

    logger.info({ remindersSent, expiryEmailsSent }, "Trial cron completed");
    res.json({ ok: true, remindersSent, expiryEmailsSent });
  } catch (err: any) {
    logger.error({ err }, "Trial cron failed");
    res.status(500).json({ error: "Cron job failed" });
  }
});

router.post("/cron/safety-checkins", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  const now = new Date();
  try {
    const overdue = await db
      .select({
        id: safetyCheckinsTable.id,
        userId: safetyCheckinsTable.userId,
        trustedContactEmail: safetyCheckinsTable.trustedContactEmail,
        trustedContactName: safetyCheckinsTable.trustedContactName,
        scheduledAt: safetyCheckinsTable.scheduledAt,
        location: safetyCheckinsTable.location,
        city: safetyCheckinsTable.city,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(safetyCheckinsTable)
      .leftJoin(usersTable, eq(usersTable.id, safetyCheckinsTable.userId))
      .where(and(
        eq(safetyCheckinsTable.status, "pending"),
        lte(safetyCheckinsTable.scheduledAt, now),
        isNull(safetyCheckinsTable.notifiedAt),
      ));

    let notified = 0;
    for (const row of overdue) {
      try {
        const memberName = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Your contact";
        await sendCheckinOverdueEmail(
          row.trustedContactEmail, row.trustedContactName, memberName,
          row.scheduledAt, row.location, row.city,
        );
        await db.update(safetyCheckinsTable)
          .set({ status: "overdue", notifiedAt: now })
          .where(eq(safetyCheckinsTable.id, row.id));
        notified++;
      } catch (err) {
        logger.error({ err, id: row.id }, "Failed to send overdue checkin email");
      }
    }
    logger.info({ notified }, "Safety checkin cron completed");
    res.json({ ok: true, notified });
  } catch (err: unknown) {
    logger.error({ err }, "Safety checkin cron failed");
    res.status(500).json({ error: "Cron failed" });
  }
});

router.post("/cron/referral-stats", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  res.json({ ok: true, message: "No-op — referral counts are updated in real time" });
});

router.post("/cron/weekly-digest", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekLabel = sevenDaysAgo.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
    " – " + now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  try {
    const newBusinesses = await db
      .select({ id: businessesTable.id, name: businessesTable.name, category: businessesTable.category, city: businessesTable.city, state: businessesTable.state })
      .from(businessesTable)
      .where(gte(businessesTable.createdAt, sevenDaysAgo))
      .limit(6);

    const recipients = await db
      .select({ email: usersTable.email, firstName: usersTable.firstName })
      .from(usersTable)
      .where(and(isNotNull(usersTable.email), eq(usersTable.approved, true)));

    let sent = 0;
    let failed = 0;

    for (const user of recipients) {
      if (!user.email) continue;
      try {
        await sendWeeklyDigest(user.email, user.firstName, newBusinesses, weekLabel);
        sent++;
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        logger.error({ err, email: user.email }, "Failed to send weekly digest");
        failed++;
      }
    }

    logger.info({ sent, failed, newBusinesses: newBusinesses.length }, "Weekly digest cron completed");
    res.json({ ok: true, sent, failed, newBusinesses: newBusinesses.length, weekLabel });
  } catch (err: any) {
    logger.error({ err }, "Weekly digest cron failed");
    res.status(500).json({ error: "Cron job failed" });
  }
});

export default router;
