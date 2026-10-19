import type Stripe from "stripe";
import { getStripeSync, verifyStripeWebhookSignature } from "./stripeClient";
import { db, usersTable, businessesTable, businessPromotionsTable, pool } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { sendTrialEndingSoon, sendTrialExpired, sendMembershipCancelled } from "./lib/email";
import { logger } from "./lib/logger";
import { hasActivePaidMembershipTrial } from "./constants/membershipTiers";
import {
  decideMembershipSubscriptionEntitlement,
  providerTrialEndsAt,
} from "./lib/stripeMembershipEntitlement";

async function getUserByCustomerId(customerId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);
  return user ?? null;
}

async function reconcileMembershipSubscription(
  eventType: string,
  subscription: Record<string, unknown>,
): Promise<void> {
  if (!subscription.customer || !subscription.id) return;

  const user = await getUserByCustomerId(String(subscription.customer));
  if (!user) return;

  const providerUserId =
    subscription.metadata && typeof subscription.metadata === "object"
      ? (subscription.metadata as Record<string, unknown>).userId
      : undefined;
  if (typeof providerUserId === "string" && providerUserId !== user.id) {
    logger.error(
      { customerId: subscription.customer, providerUserId, resolvedUserId: user.id },
      "Stripe subscription metadata does not match the mapped customer",
    );
    return;
  }

  const decision = decideMembershipSubscriptionEntitlement(subscription);
  const subscriptionId = String(subscription.id);

  if (decision.action === "grant") {
    const trialEndsAt = providerTrialEndsAt(subscription);
    await db.update(usersTable)
      .set({ stripeSubscriptionId: subscriptionId, memberType: decision.plan, trialEndsAt })
      .where(eq(usersTable.id, user.id));
    logger.info(
      { userId: user.id, subscriptionId, plan: decision.plan, status: subscription.status },
      "Stripe subscription is entitlement-active",
    );
    return;
  }

  // Only clear the matching subscription. A delayed cancellation event for an
  // older subscription must not remove access from a newer valid one.
  await db.update(usersTable)
    .set({ stripeSubscriptionId: null })
    .where(and(eq(usersTable.id, user.id), eq(usersTable.stripeSubscriptionId, subscriptionId)));

  if (eventType === "customer.subscription.deleted" && user.email) {
    const trialEnd = subscription.trial_end
      ? new Date(Number(subscription.trial_end) * 1000)
      : null;
    if (trialEnd && trialEnd <= new Date()) {
      await sendTrialExpired(user.email, user.firstName, user.memberType ?? "individual");
    } else {
      await sendMembershipCancelled(user.email, user.firstName, user.memberType ?? "individual");
    }
  }

  logger.info(
    { userId: user.id, subscriptionId, status: subscription.status },
    "Stripe subscription is not entitlement-active",
  );
}

export async function handleCustomEvent(event: Stripe.Event): Promise<void> {
  const obj = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed": {
      // ── Business Growth Tool (one-time payment) ────────────────────────────
      if (obj.mode === "payment" && obj.metadata?.type === "business_growth_tool") {
        const { promotionId, businessId, durationDays } = obj.metadata as {
          promotionId: string;
          businessId: string;
          durationDays: string;
        };
        const days = parseInt(durationDays ?? "30", 10);
        const startsAt = new Date();
        const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await db
          .update(businessPromotionsTable)
          .set({ status: "active", startsAt, endsAt })
          .where(eq(businessPromotionsTable.id, promotionId));
        // Also update legacy promotedUntil for backward compat
        await db
          .update(businessesTable)
          .set({ promotedUntil: endsAt })
          .where(eq(businessesTable.id, businessId));
        logger.info({ promotionId, businessId, endsAt }, "[growth-tools] promotion activated");
        break;
      }

      // ── Promoted listing legacy (one-time payment) ─────────────────────────
      if (obj.mode === "payment" && obj.metadata?.type === "promoted_listing") {
        const { businessId, durationDays } = obj.metadata as { businessId: string; durationDays: string };
        const days = parseInt(durationDays ?? "30", 10);
        const promotedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await db.update(businessesTable).set({ promotedUntil }).where(eq(businessesTable.id, businessId));
        logger.info({ businessId, promotedUntil }, "[promote] legacy listing activated");
        break;
      }

      // A Checkout redirect is not entitlement evidence. The related
      // customer.subscription event supplies the provider-authoritative active,
      // trialing, failed, or cancelled state.
      if (obj.mode === "subscription") {
        logger.info(
          { sessionId: obj.id, subscriptionId: obj.subscription },
          "Subscription Checkout completed; awaiting subscription state",
        );
      }
      break;
    }

    case "customer.subscription.trial_will_end": {
      if (!obj.customer) break;
      const user = await getUserByCustomerId(String(obj.customer));
      if (!user?.email || !user.trialEndsAt || !hasActivePaidMembershipTrial(user)) break;
      const daysLeft = Math.max(1, Math.ceil((user.trialEndsAt.getTime() - Date.now()) / 86400000));
      await sendTrialEndingSoon(user.email, user.firstName, user.memberType ?? "individual", user.trialEndsAt, daysLeft);
      logger.info({ userId: user.id, daysLeft }, "Trial ending soon email sent");
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await reconcileMembershipSubscription(event.type, obj);
      break;
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

    // Verify before parsing any event content. StripeSync remains in place for
    // its existing synchronization duties, but it cannot be the only guard.
    const event = await verifyStripeWebhookSignature(payload, signature);
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Idempotency check: do not mark the event processed until the custom
    // handler succeeds. A thrown handler error reaches the Express route so
    // Stripe can retry it.
    if (event.id) {
      const existingResult = await pool.query(
        `SELECT 1 FROM stripe_processed_events WHERE stripe_event_id = $1`,
        [event.id],
      );
      if ((existingResult.rowCount as number) > 0) {
        logger.info({ eventId: event.id, eventType: event.type }, "Stripe webhook event already processed — skipping");
        return;
      }
    }

    await handleCustomEvent(event);

    if (event.id) {
      await pool.query(
        `INSERT INTO stripe_processed_events (stripe_event_id, processed_at) VALUES ($1, NOW()) ON CONFLICT (stripe_event_id) DO NOTHING`,
        [event.id],
      );
    }
  }
}
