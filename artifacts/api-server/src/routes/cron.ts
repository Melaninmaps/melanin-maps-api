import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { and, isNotNull, lte, gt, eq, isNull } from "drizzle-orm";
import { sendTrialEndingSoon, sendTrialExpired } from "../lib/email";
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

router.post("/cron/referral-stats", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  res.json({ ok: true, message: "No-op — referral counts are updated in real time" });
});

export default router;
