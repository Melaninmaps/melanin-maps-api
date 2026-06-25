import { db, pushTokensTable, savedPlacesTable, businessesTable, notificationsTable, businessProfileViewsTable } from "@workspace/db";
import { eq, inArray, ilike, gte, and } from "drizzle-orm";
import { logger } from "./logger";

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function sendToToken(token: string, message: PushMessage): Promise<void> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: token,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: "default",
        priority: "high",
      }),
    });
    if (!response.ok) {
      logger.warn({ status: response.status }, "[push] Expo push failed");
    }
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send push notification");
  }
}

export async function sendPushToUser(userId: string, message: PushMessage): Promise<void> {
  try {
    const [row] = await db
      .select({ token: pushTokensTable.token })
      .from(pushTokensTable)
      .where(eq(pushTokensTable.userId, userId))
      .limit(1);

    if (!row?.token) return;
    await sendToToken(row.token, message);
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send push notification to user");
  }
}

export async function sendPushToUsersWithSavedBusiness(
  businessId: string,
  message: PushMessage,
): Promise<void> {
  try {
    const saved = await db
      .select({ userId: savedPlacesTable.userId })
      .from(savedPlacesTable)
      .where(eq(savedPlacesTable.businessId, businessId));

    if (saved.length === 0) return;
    const userIds = [...new Set(saved.map((s) => s.userId))];

    const tokens = await db
      .select({ token: pushTokensTable.token })
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, userIds));

    for (const row of tokens) {
      if (row.token) await sendToToken(row.token, message);
    }
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send push notifications to savers");
  }
}

export async function sendAddressUpdateNotifications(
  businessId: string,
  businessName: string,
  oldAddress: string,
  newAddress: string,
): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [savedRows, recentViewers] = await Promise.all([
      db.select({ userId: savedPlacesTable.userId }).from(savedPlacesTable).where(eq(savedPlacesTable.businessId, businessId)),
      db
        .select({ userId: businessProfileViewsTable.userId })
        .from(businessProfileViewsTable)
        .where(and(eq(businessProfileViewsTable.businessId, businessId), gte(businessProfileViewsTable.viewedAt, sevenDaysAgo))),
    ]);

    const userIdSet = new Set<string>();
    for (const r of savedRows) if (r.userId) userIdSet.add(r.userId);
    for (const r of recentViewers) if (r.userId) userIdSet.add(r.userId);
    const userIds = [...userIdSet];

    if (userIds.length === 0) return;

    const message: PushMessage = {
      title: `📍 ${businessName} moved`,
      body: `New address: ${newAddress}`,
      data: { businessId, type: "address_update" },
    };

    const tokens = await db
      .select({ token: pushTokensTable.token })
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, userIds));

    for (const row of tokens) {
      if (row.token) await sendToToken(row.token, message);
    }

    await db.insert(notificationsTable).values(
      userIds.map((userId) => ({
        userId,
        type: "system" as const,
        title: message.title,
        body: message.body,
      })),
    );

    logger.info({ businessId, notified: userIds.length }, "[push] Address update notifications sent");
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send address update notifications");
  }
}

export async function sendPushToAllMembers(message: PushMessage): Promise<void> {
  try {
    const tokens = await db.select({ token: pushTokensTable.token }).from(pushTokensTable);
    for (const row of tokens) {
      if (row.token) await sendToToken(row.token, message);
    }
    logger.info({ count: tokens.length }, "[push] Safety tip alert sent to all members");
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send safety tip alerts");
  }
}

export async function sendPushToBusinessOwnersByCity(
  city: string,
  message: PushMessage,
): Promise<void> {
  try {
    const businesses = await db
      .select({ submittedById: businessesTable.submittedById, id: businessesTable.id, name: businessesTable.name })
      .from(businessesTable)
      .where(ilike(businessesTable.city, `%${city}%`));

    const ownerIds = [...new Set(
      businesses
        .map((b) => b.submittedById)
        .filter((id): id is string => id != null && id.length > 0),
    )];

    if (ownerIds.length === 0) return;

    const tokens = await db
      .select({ token: pushTokensTable.token, userId: pushTokensTable.userId })
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, ownerIds));

    for (const row of tokens) {
      if (row.token) await sendToToken(row.token, message);
    }

    if (ownerIds.length > 0) {
      await db.insert(notificationsTable).values(
        ownerIds.map((userId) => ({
          userId,
          type: "safety" as const,
          title: message.title,
          body: message.body,
        })),
      );
    }

    logger.info({ city, ownerCount: ownerIds.length }, "[push] Safety incident notifications sent to business owners");
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send safety incident push to business owners");
  }
}
