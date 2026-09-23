import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, safetyCheckinsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireFamilySafety } from "../middleware/requireFamilySafety";

const router: IRouter = Router();
const MAX_PROFILE_RECIPIENTS = 5;

type EligibleRecipient = {
  trustedShareId: string;
  recipientUserId: string;
  recipientName: string;
  profileImageUrl: string | null;
  pushEnabled: boolean;
};

type CheckinRecipient = {
  trustedShareId: string;
  recipientUserId: string;
  recipientName: string;
  profileImageUrl: string | null;
  deliveryStatus: "pending" | "delivered" | "skipped";
  notifiedAt: Date | null;
};

export function checkinDeliverySummary(recipients: CheckinRecipient[]) {
  const delivered = recipients.filter((recipient) => recipient.deliveryStatus === "delivered").length;
  const skipped = recipients.filter((recipient) => recipient.deliveryStatus === "skipped").length;
  const pending = recipients.length - delivered - skipped;
  return {
    channel: "in_app_notification",
    total: recipients.length,
    pending,
    delivered,
    skipped,
    state: recipients.length === 0
      ? "legacy_email_unobserved"
      : pending === recipients.length
        ? "scheduled_not_sent"
        : delivered === recipients.length
          ? "delivered"
          : pending > 0
            ? "partially_processed"
            : delivered > 0
              ? "partially_delivered"
              : "skipped",
  } as const;
}

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function isMissingRelation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01");
}

function displayName(names: string[]): string {
  const joined = names.join(", ");
  return joined.length <= 150 ? joined : `${joined.slice(0, 147)}...`;
}

/**
 * Only people who have explicitly accepted an in-app Trusted Safety Share may
 * be selected. This makes consent, revocation, blocks, account access, and
 * safety-notification preferences server-enforced rather than client claims.
 */
async function loadEligibleRecipients(ownerId: string): Promise<EligibleRecipient[]> {
  const result = await pool.query<{
    trusted_share_id: string;
    recipient_user_id: string;
    recipient_name: string;
    profile_image_url: string | null;
    push_enabled: boolean;
  }>(
    `SELECT tss.id::text AS trusted_share_id,
            tss.contact_user_id AS recipient_user_id,
            COALESCE(
              NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),
              NULLIF(u.username, ''),
              tss.contact_name,
              'Trusted Kinfolk contact'
            ) AS recipient_name,
            u.profile_image_url,
            COALESCE(np.push_enabled, true) AS push_enabled
       FROM trusted_safety_shares tss
       JOIN users u ON u.id = tss.contact_user_id
       LEFT JOIN notification_preferences np ON np.user_id = u.id
       LEFT JOIN user_blocks owner_blocks
         ON owner_blocks.blocker_id = $1 AND owner_blocks.blocked_id = u.id
       LEFT JOIN user_blocks recipient_blocks
         ON recipient_blocks.blocker_id = u.id AND recipient_blocks.blocked_id = $1
      WHERE tss.owner_id = $1
        AND tss.contact_type = 'mwm_user'
        AND tss.status = 'active'
        AND tss.owner_enabled = true
        AND tss.contact_accepted = true
        AND u.approved = true
        AND owner_blocks.id IS NULL
        AND recipient_blocks.id IS NULL
        AND COALESCE(np.topics @> ARRAY['safety']::text[], true)
      ORDER BY tss.created_at ASC`,
    [ownerId],
  );

  return result.rows.map((row) => ({
    trustedShareId: row.trusted_share_id,
    recipientUserId: row.recipient_user_id,
    recipientName: row.recipient_name,
    profileImageUrl: row.profile_image_url,
    pushEnabled: row.push_enabled,
  }));
}

async function loadCheckinRecipients(checkinIds: number[]): Promise<Map<number, CheckinRecipient[]>> {
  const grouped = new Map<number, CheckinRecipient[]>();
  if (checkinIds.length === 0) return grouped;

  try {
    const result = await pool.query<{
      checkin_id: number;
      trusted_share_id: string;
      recipient_user_id: string;
      recipient_name: string;
      profile_image_url: string | null;
      delivery_status: "pending" | "delivered" | "skipped";
      notified_at: Date | null;
    }>(
      `SELECT scr.checkin_id,
              scr.trusted_share_id::text,
              scr.recipient_user_id,
              scr.recipient_name,
              u.profile_image_url,
              scr.delivery_status,
              scr.notified_at
         FROM safety_checkin_recipients scr
         LEFT JOIN users u ON u.id = scr.recipient_user_id
        WHERE scr.checkin_id = ANY($1::integer[])
        ORDER BY scr.created_at ASC`,
      [checkinIds],
    );
    for (const row of result.rows) {
      const recipients = grouped.get(row.checkin_id) ?? [];
      recipients.push({
        trustedShareId: row.trusted_share_id,
        recipientUserId: row.recipient_user_id,
        recipientName: row.recipient_name,
        profileImageUrl: row.profile_image_url,
        deliveryStatus: row.delivery_status,
        notifiedAt: row.notified_at,
      });
      grouped.set(row.checkin_id, recipients);
    }
  } catch (error) {
    // Reads of existing legacy Check-Ins remain available during a rolling
    // deploy before the additive recipient migration has reached a replica.
    if (!isMissingRelation(error)) throw error;
  }
  return grouped;
}

router.get("/safety/checkins/recipients", requireFamilySafety, async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const recipients = await loadEligibleRecipients(userId);
    res.json({ recipients });
  } catch (error) {
    req.log.error({ error }, "GET /safety/checkins/recipients error");
    res.status(500).json({ error: "Failed to load trusted profiles" });
  }
});

router.get("/safety/checkins", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const checkins = await db.select().from(safetyCheckinsTable)
      .where(eq(safetyCheckinsTable.userId, userId))
      .orderBy(desc(safetyCheckinsTable.createdAt))
      .limit(50);
    const recipientsByCheckin = await loadCheckinRecipients(checkins.map((checkin) => checkin.id));
    res.json({
      checkins: checkins.map((checkin) => {
        const recipients = recipientsByCheckin.get(checkin.id) ?? [];
        return {
          ...checkin,
          recipients,
          deliverySummary: checkinDeliverySummary(recipients),
        };
      }),
    });
  } catch (error) {
    req.log.error({ error }, "GET /safety/checkins error");
    res.status(500).json({ error: "Failed to load check-ins" });
  }
});

router.post("/safety/checkins", requireFamilySafety, async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const {
      trustedContactName,
      trustedContactEmail,
      recipientShareIds,
      scheduledAt,
      note,
      location,
      city,
    } = req.body as {
      trustedContactName?: string;
      trustedContactEmail?: string;
      recipientShareIds?: unknown;
      scheduledAt?: string;
      note?: string;
      location?: string;
      city?: string;
    };

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
    if (!scheduledDate || Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      res.status(400).json({ error: "scheduledAt must be a future date" });
      return;
    }

    const selectedShareIds = Array.isArray(recipientShareIds)
      ? [...new Set(recipientShareIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
      : [];
    if (selectedShareIds.length > MAX_PROFILE_RECIPIENTS) {
      res.status(400).json({ error: `A Check-In can alert up to ${MAX_PROFILE_RECIPIENTS} trusted profiles` });
      return;
    }

    const hasLegacyEmailRecipient = Boolean(trustedContactName?.trim() && trustedContactEmail?.includes("@"));
    if (selectedShareIds.length > 0 && hasLegacyEmailRecipient) {
      res.status(400).json({ error: "Choose either trusted profiles or one legacy email contact, not both" });
      return;
    }
    if (selectedShareIds.length === 0 && !hasLegacyEmailRecipient) {
      res.status(400).json({ error: "Choose an accepted trusted profile or provide a trusted contact name and email" });
      return;
    }

    const eligibleRecipients = selectedShareIds.length > 0 ? await loadEligibleRecipients(userId) : [];
    const selectedRecipients = eligibleRecipients.filter((recipient) => selectedShareIds.includes(recipient.trustedShareId));
    if (selectedRecipients.length !== selectedShareIds.length) {
      // Do not disclose which profile was blocked, revoked, opted out, or lost access.
      res.status(400).json({ error: "One or more selected trusted profiles are no longer eligible. Refresh and try again." });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO safety_checkins
          (user_id, trusted_contact_name, trusted_contact_email, scheduled_at, note, location, city, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
         RETURNING *`,
        [
          userId,
          selectedRecipients.length > 0 ? displayName(selectedRecipients.map((recipient) => recipient.recipientName)) : trustedContactName!.trim(),
          selectedRecipients.length > 0 ? null : trustedContactEmail!.toLowerCase().trim(),
          scheduledDate,
          note?.trim() || null,
          location?.trim() || null,
          city?.trim() || null,
        ],
      );
      const checkin = result.rows[0];

      for (const recipient of selectedRecipients) {
        await client.query(
          `INSERT INTO safety_checkin_recipients
             (checkin_id, trusted_share_id, recipient_user_id, recipient_name)
           VALUES ($1,$2::uuid,$3,$4)`,
          [checkin.id, recipient.trustedShareId, recipient.recipientUserId, recipient.recipientName],
        );
      }
      await client.query("COMMIT");
      const recipients = selectedRecipients.map((recipient) => ({
        ...recipient,
        deliveryStatus: "pending" as const,
        notifiedAt: null,
      }));
      res.status(201).json({
        checkin: {
          ...checkin,
          recipients,
          deliverySummary: checkinDeliverySummary(recipients),
        },
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    req.log.error({ error }, "POST /safety/checkins error");
    res.status(500).json({ error: "Failed to create check-in" });
  }
});

router.patch("/safety/checkins/:id/confirm", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const [checkin] = await db.update(safetyCheckinsTable)
      .set({ status: "checked_in", confirmedAt: new Date() })
      .where(and(eq(safetyCheckinsTable.id, id), eq(safetyCheckinsTable.userId, userId)))
      .returning();
    if (!checkin) {
      res.status(404).json({ error: "Check-in not found" });
      return;
    }
    res.json({ checkin });
  } catch (error) {
    req.log.error({ error }, "PATCH /safety/checkins/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm check-in" });
  }
});

router.delete("/safety/checkins/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await db.delete(safetyCheckinsTable)
      .where(and(eq(safetyCheckinsTable.id, id), eq(safetyCheckinsTable.userId, userId)));
    res.json({ ok: true });
  } catch (error) {
    req.log.error({ error }, "DELETE /safety/checkins/:id error");
    res.status(500).json({ error: "Failed to delete check-in" });
  }
});

export default router;
