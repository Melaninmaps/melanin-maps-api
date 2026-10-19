import { and, eq, or } from "drizzle-orm";
import { db, notificationsTable, userBlocksTable, usersTable } from "@workspace/db";
import { sendPushToUser } from "../lib/pushNotifications";

/**
 * Records Community activity for the recipient's in-app inbox and, only when
 * that member has explicitly enabled Community notifications, requests a push.
 * Activity never contains a post or comment excerpt: an inbox item can survive
 * a later audience change, so its text must remain safe on its own.
 */
export type CommunitySocialNotification = {
  recipientId: string;
  actorId: string;
  title: string;
  body: string;
  entityType: "community_post" | "member_profile" | "conversation_request";
  entityId: string;
  data: Record<string, unknown>;
};

async function recipientAllowsCommunityActivity(recipientId: string): Promise<boolean> {
  const [recipient] = await db
    .select({ notifCommunity: usersTable.notifCommunity })
    .from(usersTable)
    .where(eq(usersTable.id, recipientId))
    .limit(1);
  return recipient?.notifCommunity === true;
}

async function participantsAreBlocked(actorId: string, recipientId: string): Promise<boolean> {
  const [block] = await db
    .select({ id: userBlocksTable.id })
    .from(userBlocksTable)
    .where(or(
      and(eq(userBlocksTable.blockerId, actorId), eq(userBlocksTable.blockedId, recipientId)),
      and(eq(userBlocksTable.blockerId, recipientId), eq(userBlocksTable.blockedId, actorId)),
    ))
    .limit(1);
  return Boolean(block);
}

export async function deliverCommunitySocialNotification(
  notification: CommunitySocialNotification,
): Promise<{ delivered: boolean; reason?: "self" | "blocked" | "disabled" }> {
  if (notification.recipientId === notification.actorId) {
    return { delivered: false, reason: "self" };
  }

  const [blocked, enabled] = await Promise.all([
    participantsAreBlocked(notification.actorId, notification.recipientId),
    recipientAllowsCommunityActivity(notification.recipientId),
  ]);
  if (blocked) return { delivered: false, reason: "blocked" };
  if (!enabled) return { delivered: false, reason: "disabled" };

  await db.insert(notificationsTable).values({
    userId: notification.recipientId,
    type: "community",
    title: notification.title,
    body: notification.body,
    entityType: notification.entityType,
    entityId: notification.entityId,
    data: notification.data,
  });

  // Device registration and quiet delivery are handled by the established push
  // helper. A push failure cannot roll back the private in-app activity record.
  void sendPushToUser(notification.recipientId, {
    title: notification.title,
    body: notification.body,
    data: notification.data,
  }).catch(() => {});

  return { delivered: true };
}
