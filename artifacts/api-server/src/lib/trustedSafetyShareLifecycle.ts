import { pool } from "@workspace/db";

/**
 * An accepted trusted contact is a durable, revocable guardian authorization.
 * It is intentionally distinct from any temporary precise-location session.
 */
export function isDurableTrustedSafetyRelationship(
  contactAccepted: boolean | null | undefined,
  ownerEnabled: boolean | null | undefined,
  status: string | null | undefined,
): boolean {
  return contactAccepted === true
    && ownerEnabled === true
    && status === "active";
}

/**
 * Consent withdrawal is also coordinate withdrawal. This server-side operation
 * removes every linked live-location fix and stops the share; a later live
 * session always requires a fresh explicit location confirmation.
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
 * Expire only temporary precise-location sessions. It never pauses, revokes,
 * or otherwise changes the separate trusted-contact alert relationship.
 */
export async function expireTrustedLocationSessions(ownerId: string): Promise<string[]> {
  const result = await pool.query<{ recipient_user_id: string | null }>(
    `UPDATE location_shares
        SET is_active = false,
            current_lat = NULL,
            current_lng = NULL,
            last_updated_at = NULL
      WHERE sharer_id = $1
        AND is_active = true
        AND expires_at <= NOW()
      RETURNING recipient_user_id`,
    [ownerId],
  );
  return [...new Set(result.rows.flatMap((row) => row.recipient_user_id ? [row.recipient_user_id] : []))];
}
