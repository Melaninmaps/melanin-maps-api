import { pool } from "@workspace/db";

export const TRUSTED_SAFETY_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const TRUSTED_SAFETY_SESSION_INTERVAL = "30 days";

/** An active relationship without a recent explicit activation is not eligible. */
export function isFiniteTrustedSafetySession(
  activatedAt: Date | string | null | undefined,
  now = Date.now(),
): boolean {
  if (!activatedAt) return false;
  const activatedMs = new Date(activatedAt).getTime();
  return Number.isFinite(activatedMs)
    && activatedMs <= now
    && now - activatedMs < TRUSTED_SAFETY_SESSION_TTL_MS;
}

/**
 * Consent withdrawal is also coordinate withdrawal. This server-side operation
 * removes every linked live-location fix and stops the share; a later trusted
 * consent activation intentionally requires creating a fresh location session.
 */
export async function deactivateTrustedLocationShares(
  ownerId: string,
  recipientUserIds: readonly string[],
): Promise<void> {
  const recipients = [...new Set(recipientUserIds.filter(Boolean))];
  if (recipients.length === 0) return;
  await pool.query(
    `UPDATE location_shares
        SET is_active = false,
            current_lat = NULL,
            current_lng = NULL,
            last_updated_at = NULL
      WHERE sharer_id = $1
        AND recipient_user_id = ANY($2::varchar[])
        AND is_active = true`,
    [ownerId, recipients],
  );
}

/**
 * End old consent without relying on an asynchronous retention job. This is
 * invoked at lifecycle boundaries and atomically removes all linked precise
 * locations before the expired state becomes visible to a caller.
 */
export async function expireTrustedSafetySessions(ownerId: string): Promise<string[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const expired = await client.query<{ contact_user_id: string | null }>(
      `UPDATE trusted_safety_shares
          SET status = 'paused_manual',
              owner_enabled = false,
              updated_at = NOW()
        WHERE owner_id = $1
          AND status IN ('active', 'paused_home')
          AND owner_enabled = true
          AND contact_accepted = true
          AND (activated_at IS NULL OR activated_at <= NOW() - INTERVAL '30 days')
        RETURNING contact_user_id`,
      [ownerId],
    );
    const recipients = [...new Set(
      expired.rows.flatMap((row) => row.contact_user_id ? [row.contact_user_id] : []),
    )];
    if (recipients.length > 0) {
      await client.query(
        `UPDATE location_shares
            SET is_active = false,
                current_lat = NULL,
                current_lng = NULL,
                last_updated_at = NULL
          WHERE sharer_id = $1
            AND recipient_user_id = ANY($2::varchar[])
            AND is_active = true`,
        [ownerId, recipients],
      );
    }
    await client.query("COMMIT");
    return recipients;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
