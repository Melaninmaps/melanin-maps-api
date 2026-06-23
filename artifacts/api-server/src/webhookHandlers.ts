import { getStripeSync } from "./stripeClient";
import { db, usersTable, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendTrialStarted, sendTrialEndingSoon, sendTrialExpired, sendMembershipCancelled } from "./lib/email";
import { logger } from "./lib/logger";

const TRIAL_DAYS: Record<string, number> = {
  individual: 14,
  business: 30,
  founding: 90,
  beta: 365,
  business_referral: 365,
};

async function getUserByCustomerId(customerId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);
  return user ?? null;
}

async function handleCustomEvent(event: { type: string; data: { object: Record<string, unknown> } }) {
  const obj = event.data.object as any;
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // ── Promoted listing (one-time payment) ────────────────────────────────
        if (obj.mode === "payment" && obj.metadata?.type === "promoted_listing") {
          const { businessId, durationDays } = obj.metadata as { businessId: string; durationDays: string };
          const days = parseInt(durationDays ?? "30", 10);
          const promotedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          await db.update(businessesTable).set({ promotedUntil }).where(eq(businessesTable.id, businessId));
          logger.info({ businessId, promotedUntil }, "[promote] listing activated");
          break;
        }
        // ── Subscription checkout ───────────────────────────────────────────────
        if (obj.mode !== "subscription" || !obj.customer) break;
        const user = await getUserByCustomerId(String(obj.customer));
        if (!user?.email || !user.trialEndsAt) break;
        const trialDays = TRIAL_DAYS[user.memberType ?? "individual"] ?? 14;
        await sendTrialStarted(user.email, user.firstName, user.memberType ?? "individual", trialDays, user.trialEndsAt);
        if (obj.subscription) {
          await db.update(usersTable).set({ stripeSubscriptionId: String(obj.subscription) }).where(eq(usersTable.id, user.id));
        }
        logger.info({ userId: user.id }, "Trial started email sent");
        break;
      }
      case "customer.subscription.trial_will_end": {
        if (!obj.customer) break;
        const user = await getUserByCustomerId(String(obj.customer));
        if (!user?.email || !user.trialEndsAt) break;
        const daysLeft = Math.max(1, Math.ceil((user.trialEndsAt.getTime() - Date.now()) / 86400000));
        await sendTrialEndingSoon(user.email, user.firstName, user.memberType ?? "individual", user.trialEndsAt, daysLeft);
        logger.info({ userId: user.id, daysLeft }, "Trial ending soon email sent");
        break;
      }
      case "customer.subscription.deleted": {
        if (!obj.customer) break;
        const user = await getUserByCustomerId(String(obj.customer));
        if (!user?.email) break;
        const trialEnd = obj.trial_end ? new Date((obj.trial_end as number) * 1000) : null;
        if (trialEnd && trialEnd > new Date()) {
          await sendTrialExpired(user.email, user.firstName, user.memberType ?? "individual");
        } else {
          await sendMembershipCancelled(user.email, user.firstName, user.memberType ?? "individual");
        }
        await db.update(usersTable).set({ stripeSubscriptionId: null }).where(eq(usersTable.id, user.id));
        logger.info({ userId: user.id }, "Subscription cancelled — email sent");
        break;
      }
      case "customer.subscription.updated": {
        if (!obj.customer || !obj.id) break;
        const user = await getUserByCustomerId(String(obj.customer));
        if (user) {
          await db.update(usersTable).set({ stripeSubscriptionId: String(obj.id) }).where(eq(usersTable.id, user.id));
        }
        break;
      }
    }
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Custom webhook handler error (non-fatal)");
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
        "Received type: " + typeof payload + ". " +
        "FIX: Ensure webhook route is registered BEFORE app.use(express.json()).",
      );
    }
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const event = JSON.parse(payload.toString()) as { type: string; data: { object: Record<string, unknown> } };
      await handleCustomEvent(event);
    } catch (err) {
      logger.warn({ err }, "Custom webhook event handling failed (sync already succeeded)");
    }
  }
}
