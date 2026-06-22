import { db, pushTokensTable, savedPlacesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
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
