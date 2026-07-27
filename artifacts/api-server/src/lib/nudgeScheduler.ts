import cron from "node-cron";
import { db, waitlistTable } from "@workspace/db";
import { and, count, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import { sendReferralNudge } from "./email";
import { logger } from "./logger";

export interface NudgeResult {
  sent: number;
  skipped: number;
  totalPending: number;
  newSignupsThisWeek: number;
  errors: string[];
}

export async function runWeeklyNudge(): Promise<NudgeResult> {
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const pendingMembers = await db
    .select()
    .from(waitlistTable)
    .where(
      and(
        eq(waitlistTable.status, "pending"),
        isNotNull(waitlistTable.referralCode),
        sql`(${waitlistTable.lastNudgeSentAt} IS NULL OR ${waitlistTable.lastNudgeSentAt} < ${sixDaysAgo})`,
      ),
    )
    .orderBy(waitlistTable.createdAt);

  const [{ newSignupsThisWeek }] = await db
    .select({ newSignupsThisWeek: count() })
    .from(waitlistTable)
    .where(gte(waitlistTable.createdAt, oneWeekAgo));

  const [{ total: totalPending }] = await db
    .select({ total: count() })
    .from(waitlistTable)
    .where(eq(waitlistTable.status, "pending"));

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const member of pendingMembers) {
    if (!member.email || !member.referralCode) {
      skipped++;
      continue;
    }

    const [{ position }] = await db
      .select({ position: count() })
      .from(waitlistTable)
      .where(
        and(
          eq(waitlistTable.status, "pending"),
          lt(waitlistTable.createdAt, member.createdAt),
        ),
      );

    const memberPosition = Number(position) + 1;

    try {
      await sendReferralNudge(
        member.email,
        member.firstName ?? "",
        memberPosition,
        member.referralCode,
        Number(newSignupsThisWeek),
      );

      await db
        .update(waitlistTable)
        .set({ lastNudgeSentAt: new Date() })
        .where(eq(waitlistTable.id, member.id));

      sent++;
    } catch (err) {
      errors.push(member.email);
      logger.error({ err, email: member.email }, "nudge: failed to send to member");
    }
  }

  return {
    sent,
    skipped,
    totalPending: Number(totalPending),
    newSignupsThisWeek: Number(newSignupsThisWeek),
    errors,
  };
}

export function startNudgeCronScheduler(): void {
  const schedule = process.env.NUDGE_CRON_SCHEDULE ?? "0 10 * * 1";

  if (!cron.validate(schedule)) {
    logger.error({ schedule }, "nudge-cron: invalid NUDGE_CRON_SCHEDULE — scheduler not started");
    return;
  }

  cron.schedule(schedule, async () => {
    logger.info({ schedule }, "nudge-cron: starting weekly referral nudge batch");
    try {
      const result = await runWeeklyNudge();
      logger.info(
        {
          sent: result.sent,
          skipped: result.skipped,
          totalPending: result.totalPending,
          newSignupsThisWeek: result.newSignupsThisWeek,
          errorCount: result.errors.length,
        },
        "nudge-cron: batch complete",
      );
      if (result.errors.length > 0) {
        logger.warn({ failedEmails: result.errors }, "nudge-cron: some emails failed");
      }
    } catch (err) {
      logger.error({ err }, "nudge-cron: batch failed with unexpected error");
    }
  });

  logger.info({ schedule }, "nudge-cron: scheduler started (every Monday 10 AM UTC by default)");
}
