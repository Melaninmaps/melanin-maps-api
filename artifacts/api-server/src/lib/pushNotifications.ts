import { db, pushTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(userId: string, message: PushMessage) {
  try {
    const [row] = await db
      .select({ token: pushTokensTable.token })
      .from(pushTokensTable)
      .where(eq(pushTokensTable.userId, userId))
      .limit(1);

    if (!row?.token) return;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: row.token,
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
