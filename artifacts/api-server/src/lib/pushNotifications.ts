import { db, pushTokensTable, savedPlacesTable, businessesTable, notificationsTable, businessProfileViewsTable, reviewsTable } from "@workspace/db";
import { pool } from "@workspace/db";
import { eq, inArray, ilike, gte, lte, ne, and } from "drizzle-orm";
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

export async function sendThreeStarAlert(
  businessId: string,
  businessName: string,
  direction: "rose" | "dropped",
  excludeUserId?: string,
): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [savedRows, recentReviewers] = await Promise.all([
      db.select({ userId: savedPlacesTable.userId }).from(savedPlacesTable).where(eq(savedPlacesTable.businessId, businessId)),
      db
        .select({ userId: reviewsTable.userId })
        .from(reviewsTable)
        .where(and(eq(reviewsTable.businessId, businessId), gte(reviewsTable.createdAt, sevenDaysAgo))),
    ]);

    const userIdSet = new Set<string>();
    for (const r of savedRows) if (r.userId) userIdSet.add(r.userId);
    for (const r of recentReviewers) if (r.userId) userIdSet.add(r.userId);
    if (excludeUserId) userIdSet.delete(excludeUserId);
    const userIds = [...userIdSet];

    if (userIds.length === 0) return;

    const isDropped = direction === "dropped";
    const message: PushMessage = {
      title: isDropped
        ? `⚠️ ${businessName} has dropped to 3 stars`
        : `📈 ${businessName} is back up to 3 stars`,
      body: isDropped
        ? "Your community may need your support — consider leaving a review."
        : "Things are looking up! Check it out and show some love.",
      data: { businessId, type: "three_star_alert" },
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

    logger.info({ businessId, direction, notified: userIds.length }, "[push] 3-star alert sent");
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send 3-star alert");
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

export async function sendAlertPushToNearbyUsers(
  alertId: string,
  lat: number,
  lng: number,
  alertType: string,
  radiusKm: number,
): Promise<void> {
  const ALERT_LABELS: Record<string, string> = {
    police: "🚔 Police Activity Nearby",
    ice: "⚠️ ICE Activity Nearby",
    checkpoint: "🛑 Checkpoint Reported",
    traffic: "🚦 Traffic Stop Nearby",
    other: "📢 Community Alert",
  };
  const title = ALERT_LABELS[alertType] ?? "📢 Community Alert";
  const body = "A community member reported activity near you. Stay aware.";

  try {
    // Fan-out group 1: users with a recent known location — filtered by per-user alert prefs + radius
    const locationResult = await pool.query<{ token: string; user_id: string }>(
      `SELECT pt.token, pt.user_id
       FROM user_locations ul
       JOIN push_tokens pt ON pt.user_id = ul.user_id
       LEFT JOIN user_settings us ON us.user_id = ul.user_id
       WHERE ul.updated_at > NOW() - INTERVAL '2 hours'
         AND pt.token IS NOT NULL
         AND CASE
               WHEN $4 = 'police' THEN COALESCE(us.safety_alert_police, true)
               WHEN $4 = 'ice'    THEN COALESCE(us.safety_alert_ice, true)
               ELSE true
             END = true
         AND (6371 * acos(
           GREATEST(-1, LEAST(1,
             cos(radians($1)) * cos(radians(ul.lat::float)) * cos(radians(ul.lng::float) - radians($2))
             + sin(radians($1)) * sin(radians(ul.lat::float))
           ))
         )) < LEAST(COALESCE(us.safety_alert_radius_miles, 5) * 1.60934, $3)`,
      [lat, lng, radiusKm, alertType],
    );

    // Fan-out group 2: users who have saved any business within the radius
    const savedResult = await pool.query<{ token: string; user_id: string }>(
      `SELECT DISTINCT pt.token, pt.user_id
       FROM saved_places sp
       JOIN businesses b ON b.id = sp.business_id
       JOIN push_tokens pt ON pt.user_id = sp.user_id
       LEFT JOIN user_settings us ON us.user_id = sp.user_id
       WHERE pt.token IS NOT NULL
         AND CASE
               WHEN $4 = 'police' THEN COALESCE(us.safety_alert_police, true)
               WHEN $4 = 'ice'    THEN COALESCE(us.safety_alert_ice, true)
               ELSE true
             END = true
         AND (6371 * acos(
           GREATEST(-1, LEAST(1,
             cos(radians($1)) * cos(radians(b.latitude::float)) * cos(radians(b.longitude::float) - radians($2))
             + sin(radians($1)) * sin(radians(b.latitude::float))
           ))
         )) < LEAST(COALESCE(us.safety_alert_radius_miles, 5) * 1.60934, $3)`,
      [lat, lng, radiusKm, alertType],
    );

    // Deduplicate by user_id — union both groups
    const seenUserIds = new Set<string>();
    const tokens: Array<{ token: string; user_id: string }> = [];
    for (const row of [...locationResult.rows, ...savedResult.rows]) {
      if (row.token && !seenUserIds.has(row.user_id)) {
        seenUserIds.add(row.user_id);
        tokens.push(row);
      }
    }

    if (tokens.length === 0) return;

    const userIds = tokens.map((r) => r.user_id);

    for (const row of tokens) {
      if (row.token) await sendToToken(row.token, { title, body, data: { alertId, type: alertType, screen: "map" } });
    }

    logger.info({ alertId, alertType, notified: tokens.length }, "[push] Community alert sent to nearby users");

    if (userIds.length > 0) {
      await db.insert(notificationsTable).values(
        userIds.map((userId) => ({
          userId,
          type: "safety" as const,
          title,
          body,
        })),
      );
    }
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send alert push to nearby users");
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
    // Only notify owners of minority-owned businesses — never alert non-minority
    // businesses that safety reports are being filed in their area.
    const businesses = await db
      .select({ submittedById: businessesTable.submittedById, id: businessesTable.id, name: businessesTable.name })
      .from(businessesTable)
      .where(and(ilike(businessesTable.city, `%${city}%`), eq(businessesTable.blackOwned, true)));

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

// ─── Buzz alert: business gets 3 great reviews milestone ──────────────────────
export async function sendBuzzAlert(
  businessId: string,
  businessName: string,
  totalReviews: number,
): Promise<void> {
  try {
    const savedRows = await db
      .select({ userId: savedPlacesTable.userId })
      .from(savedPlacesTable)
      .where(eq(savedPlacesTable.businessId, businessId));

    const userIds = [...new Set(savedRows.map((r) => r.userId).filter((id): id is string => !!id))];
    if (userIds.length === 0) return;

    const message: PushMessage = {
      title: `🌟 ${businessName} is buzzing!`,
      body: `${totalReviews} community members have reviewed this place you saved — and they love it.`,
      data: { businessId, type: "buzz_alert" },
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

    logger.info({ businessId, notified: userIds.length }, "[push] Buzz alert sent");
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send buzz alert");
  }
}

// ─── Negative review threshold alert: 3+ low-rated reviews in 30 days ─────────
export async function sendNegativeReviewAlertIfThreshold(
  businessId: string,
  businessName: string,
  excludeUserId?: string,
): Promise<void> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentNegative = await db
      .select({ id: reviewsTable.id })
      .from(reviewsTable)
      .where(
        and(
          eq(reviewsTable.businessId, businessId),
          lte(reviewsTable.rating, 3),
          gte(reviewsTable.createdAt, thirtyDaysAgo),
          ne(reviewsTable.status, "pending_video"),
        ),
      );

    // Only alert at exactly the 3rd negative review (avoid spam on subsequent ones)
    if (recentNegative.length !== 3) return;

    const savedRows = await db
      .select({ userId: savedPlacesTable.userId })
      .from(savedPlacesTable)
      .where(eq(savedPlacesTable.businessId, businessId));

    const userIdSet = new Set(savedRows.map((r) => r.userId).filter((id): id is string => !!id));
    if (excludeUserId) userIdSet.delete(excludeUserId);
    const userIds = [...userIdSet];
    if (userIds.length === 0) return;

    const message: PushMessage = {
      title: `📋 New feedback on ${businessName}`,
      body: "The community has been sharing thoughts about a place you saved. Check what they're saying.",
      data: { businessId, type: "negative_review_alert" },
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

    logger.info({ businessId, negativeCount: recentNegative.length, notified: userIds.length }, "[push] Negative review threshold alert sent");
  } catch (err) {
    logger.warn({ err }, "[push] Failed to send negative review alert");
  }
}
