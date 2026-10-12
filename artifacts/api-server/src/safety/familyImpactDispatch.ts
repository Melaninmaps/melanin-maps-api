import { pool } from "@workspace/db";
import {
  type EmergencyBoundary,
  type FamilyImpactStatus,
  classifyFamilyImpact,
  familyImpactDisclosure,
} from "./familyImpactIntelligence";
import {
  openPersistentSafetyLocation,
  persistentSafetyLocationFreshnessWindowMs,
  persistentSafetyLocationIsFresh,
} from "./persistentSafetyLocation";

export type FamilyImpactProviderOutcome = "provider_accepted" | "provider_rejected" | "retryable_failure";
export interface FamilyImpactProvider {
  send(input: { recipientUserId: string; title: string; body: string; data: Record<string, string> }): Promise<FamilyImpactProviderOutcome>;
}

export interface FamilyImpactDispatchResult {
  eventState: "dispatched" | "disabled" | "not_current" | "not_found";
  eligibleRelationships: number;
  potential: number;
  outside: number;
  unknown: number;
  providerAccepted: number;
  retryScheduled: number;
  skipped: number;
}

export interface FamilyImpactDispatchOptions {
  provider?: FamilyImpactProvider;
  enableDelivery?: boolean;
  /**
   * Internal-only scope for a controlled synthetic run. A normal dispatch has
   * no scope and evaluates all eligible relationships. The isolated staging
   * validator supplies only disposable relationship IDs so a test event can
   * never reach a real member.
   */
  allowedTrustedShareIds?: readonly string[];
}

function empty(eventState: FamilyImpactDispatchResult["eventState"]): FamilyImpactDispatchResult {
  return { eventState, eligibleRelationships: 0, potential: 0, outside: 0, unknown: 0, providerAccepted: 0, retryScheduled: 0, skipped: 0 };
}

function parseBoundary(value: unknown): EmergencyBoundary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.kind === "county" && typeof record.countyCode === "string" && record.countyCode.trim()) {
    return { kind: "county", countyCode: record.countyCode.trim() };
  }
  if (record.kind === "warning_zone" && typeof record.warningZone === "string" && record.warningZone.trim()) {
    return { kind: "warning_zone", warningZone: record.warningZone.trim() };
  }
  if (record.kind === "polygon" && Array.isArray(record.coordinates)) {
    const coordinates = record.coordinates.flatMap((entry) => Array.isArray(entry) && entry.length === 2
      && typeof entry[0] === "number" && typeof entry[1] === "number"
      ? [[entry[0], entry[1]] as [number, number]] : []);
    if (coordinates.length >= 3) {
      return { kind: "polygon", coordinates, ...(typeof record.uncertaintyMeters === "number" ? { uncertaintyMeters: record.uncertaintyMeters } : {}) };
    }
  }
  return null;
}

function activeDeliveryEnabled(): boolean {
  // Founder-controlled, default-off circuit breaker. Local synthetic tests pass
  // an explicit fake provider and enableDelivery=true; this never enables a real provider.
  return process.env.SAFETY_FAMILY_IMPACT_DELIVERY_ENABLED === "true";
}

function increment(result: FamilyImpactDispatchResult, status: FamilyImpactStatus): void {
  if (status === "potentially_affected") result.potential += 1;
  else if (status === "outside_reported_area") result.outside += 1;
  else result.unknown += 1;
}

function deliveryRequired(status: FamilyImpactStatus): boolean {
  // Geographic separation and a missing/stale temporary session are not an
  // emergency delivery condition. They remain durable audit classifications,
  // but only a potentially affected, separately consented contact may receive
  // the in-app alert or a provider handoff.
  return status === "potentially_affected";
}

function uniqueTrustedShareIds(value: readonly string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))];
}

async function cancelIneligibleDeliveryAttempts(
  eventId: string,
  allowedTrustedShareIds: readonly string[] | undefined,
): Promise<void> {
  if (allowedTrustedShareIds?.length === 0) return;
  const scope = allowedTrustedShareIds
    ? "AND attempt.trusted_share_id = ANY($2::uuid[])"
    : "";
  const parameters = allowedTrustedShareIds ? [eventId, allowedTrustedShareIds] : [eventId];
  await pool.query(
    `UPDATE family_impact_delivery_attempts attempt
        SET delivery_state = 'cancelled', next_retry_at = NULL, updated_at = NOW()
      WHERE attempt.event_id = $1
        ${scope}
        AND attempt.delivery_state IN ('queued', 'retry_scheduled')
        AND NOT EXISTS (
          SELECT 1
            FROM trusted_safety_shares tss
            JOIN users owner
              ON owner.id = tss.owner_id
            JOIN users contact
              ON contact.id = tss.contact_user_id
            LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = contact.id
            LEFT JOIN user_blocks contact_blocks
              ON contact_blocks.blocker_id = contact.id AND contact_blocks.blocked_id = tss.owner_id
           WHERE tss.id = attempt.trusted_share_id
             AND tss.contact_type = 'mwm_user' AND tss.status = 'active'
             AND tss.owner_enabled = true AND tss.contact_accepted = true
             AND owner.approved = true AND COALESCE(owner.account_status, 'active') = 'active'
             AND contact.approved = true AND COALESCE(contact.account_status, 'active') = 'active'
             AND owner_blocks.id IS NULL AND contact_blocks.id IS NULL
             AND (
               EXISTS (
                 SELECT 1 FROM family_impact_consents fic
                  WHERE fic.owner_id = tss.owner_id AND fic.trusted_share_id = tss.id
                    AND fic.revoked_at IS NULL AND fic.expires_at > NOW()
                    AND fic.location_scope = 'active_temporary_location_only'
               )
               OR EXISTS (
                 SELECT 1
                   FROM mwm_persistent_safety_location_contact_consents persistent_consent
                   JOIN mwm_persistent_safety_location_authorizations authorization_record
                     ON authorization_record.owner_id = persistent_consent.owner_id
                  WHERE persistent_consent.owner_id = tss.owner_id
                    AND persistent_consent.trusted_share_id = tss.id
                    AND persistent_consent.revoked_at IS NULL
                    AND authorization_record.revoked_at IS NULL
                    AND authorization_record.paused_at IS NULL
               )
             )
        )`,
    parameters,
  );
}

async function disableNonPotentialDeliveryAttempt(eventId: string, trustedShareId: string): Promise<void> {
  await pool.query(
    `UPDATE family_impact_delivery_attempts
        SET delivery_state = 'disabled', next_retry_at = NULL, updated_at = NOW()
      WHERE event_id = $1 AND trusted_share_id = $2
        AND delivery_state IN ('queued', 'retry_scheduled')`,
    [eventId, trustedShareId],
  );
}

/**
 * The application notification is persisted before any push handoff. Repeated
 * workers reuse the same notification UUID, so a restart or provider retry
 * cannot create duplicate in-app alerts or silently lose the durable fallback.
 */
async function ensureFamilyImpactInAppNotification(input: {
  deliveryId: string;
  recipientUserId: string;
  eventId: string;
  title: string;
  body: string;
}): Promise<string | null> {
  try {
    const claimed = await pool.query<{ in_app_notification_id: string }>(
      `UPDATE family_impact_delivery_attempts
          SET in_app_notification_id = COALESCE(in_app_notification_id, gen_random_uuid()::varchar), updated_at = NOW()
        WHERE id = $1
        RETURNING in_app_notification_id`,
      [input.deliveryId],
    );
    const notificationId = claimed.rows[0]?.in_app_notification_id;
    if (!notificationId) return null;
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, body, entity_id, entity_type, data, read, created_at)
       VALUES ($1,$2,'safety',$3,$4,$5,'family_impact',$6::jsonb,false,NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        notificationId, input.recipientUserId, input.title, input.body, input.eventId,
        JSON.stringify({ type: "family_impact", safetyAlertDeliveryId: input.deliveryId }),
      ],
    );
    return notificationId;
  } catch {
    return null;
  }
}

export async function dispatchFamilyImpactEvent(
  sourceEventId: string,
  options: FamilyImpactDispatchOptions = {},
): Promise<FamilyImpactDispatchResult> {
  const eventResult = await pool.query<{
    id: string; source: string; status: string; event_type: string; boundary: unknown; general_area: string; expires_at: Date; reviewer_approved_at: Date | null;
  }>(
    `SELECT id, source, status, event_type, boundary, general_area, expires_at, reviewer_approved_at
       FROM family_impact_events WHERE source_event_id = $1 LIMIT 1`,
    [sourceEventId],
  );
  const event = eventResult.rows[0];
  if (!event) return empty("not_found");
  if (event.status !== "active" || new Date(event.expires_at).getTime() <= Date.now()
    || (event.source === "reviewed_violence" && !event.reviewer_approved_at)) return empty("not_current");
  const boundary = parseBoundary(event.boundary);
  if (!boundary) return empty("not_current");
  const deliveryEnabled = options.enableDelivery === true ? true : options.enableDelivery === false ? false : activeDeliveryEnabled();
  const result = empty(deliveryEnabled ? "dispatched" : "disabled");
  const allowedTrustedShareIds = uniqueTrustedShareIds(options.allowedTrustedShareIds);
  await cancelIneligibleDeliveryAttempts(event.id, allowedTrustedShareIds);
  if (allowedTrustedShareIds?.length === 0) return result;
  const scope = allowedTrustedShareIds
    ? "AND tss.id = ANY($2::uuid[])"
    : "";
  const relationshipParameters = allowedTrustedShareIds
    ? [event.id, allowedTrustedShareIds]
    : [event.id];
  const relationships = await pool.query<{
    trusted_share_id: string; owner_id: string; contact_user_id: string;
    temporary_consent: boolean; persistent_consent: boolean;
    latitude: number | null; longitude: number | null; last_updated_at: Date | null;
    persistent_encrypted_payload: string | null; persistent_key_version: string | null;
    persistent_captured_at: Date | null; persistent_accuracy_meters: number | null;
    county_code: string | null; warning_zone: string | null; confirmed_safe: boolean;
  }>(
    `SELECT tss.id AS trusted_share_id, tss.owner_id, tss.contact_user_id,
            (fic.id IS NOT NULL) AS temporary_consent,
            (persistent_consent.id IS NOT NULL AND authorization_record.owner_id IS NOT NULL) AS persistent_consent,
            ls.current_lat AS latitude, ls.current_lng AS longitude, ls.last_updated_at,
            persistent_location.encrypted_payload AS persistent_encrypted_payload,
            persistent_location.encryption_key_version AS persistent_key_version,
            persistent_location.captured_at AS persistent_captured_at,
            persistent_location.accuracy_meters AS persistent_accuracy_meters,
            NULL::varchar AS county_code, NULL::varchar AS warning_zone,
            EXISTS (
              SELECT 1 FROM family_impact_checkin_requests request
               WHERE request.event_id = $1 AND request.trusted_share_id = tss.id
                 AND request.state = 'safe'
            ) AS confirmed_safe
       FROM trusted_safety_shares tss
       JOIN users owner ON owner.id = tss.owner_id AND owner.approved = true AND COALESCE(owner.account_status, 'active') = 'active'
       JOIN users contact ON contact.id = tss.contact_user_id AND contact.approved = true AND COALESCE(contact.account_status, 'active') = 'active'
       LEFT JOIN family_impact_consents fic
         ON fic.owner_id = tss.owner_id AND fic.trusted_share_id = tss.id
           AND fic.revoked_at IS NULL AND fic.expires_at > NOW()
           AND fic.location_scope = 'active_temporary_location_only'
       LEFT JOIN mwm_persistent_safety_location_contact_consents persistent_consent
         ON persistent_consent.owner_id = tss.owner_id AND persistent_consent.trusted_share_id = tss.id
           AND persistent_consent.revoked_at IS NULL
       LEFT JOIN mwm_persistent_safety_location_authorizations authorization_record
         ON authorization_record.owner_id = tss.owner_id AND authorization_record.revoked_at IS NULL AND authorization_record.paused_at IS NULL
       LEFT JOIN mwm_persistent_safety_locations persistent_location
         ON persistent_location.owner_id = tss.owner_id
       LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = contact.id
       LEFT JOIN user_blocks contact_blocks ON contact_blocks.blocker_id = contact.id AND contact_blocks.blocked_id = tss.owner_id
       LEFT JOIN LATERAL (
         SELECT current_lat, current_lng, last_updated_at
           FROM location_shares
          WHERE sharer_id = tss.owner_id AND recipient_user_id = tss.contact_user_id
            AND is_active = true AND expires_at > NOW()
          ORDER BY last_updated_at DESC NULLS LAST LIMIT 1
       ) ls ON true
      WHERE tss.contact_type = 'mwm_user' AND tss.status = 'active'
        AND tss.owner_enabled = true AND tss.contact_accepted = true
        AND (fic.id IS NOT NULL OR (persistent_consent.id IS NOT NULL AND authorization_record.owner_id IS NOT NULL))
        ${scope}
        AND owner_blocks.id IS NULL AND contact_blocks.id IS NULL`,
    relationshipParameters,
  );
  result.eligibleRelationships = relationships.rows.length;
  for (const relationship of relationships.rows) {
    const classifications = [];
    if (relationship.confirmed_safe) {
      classifications.push(classifyFamilyImpact(boundary, null, { memberConfirmedSafe: true }));
    } else {
      if (relationship.temporary_consent) {
        classifications.push(classifyFamilyImpact(boundary, {
          latitude: relationship.latitude,
          longitude: relationship.longitude,
          capturedAt: relationship.last_updated_at,
          accuracyMeters: null,
          countyCode: relationship.county_code,
          warningZone: relationship.warning_zone,
        }));
      }
      if (relationship.persistent_consent && relationship.persistent_encrypted_payload && relationship.persistent_key_version
        && persistentSafetyLocationIsFresh(relationship.persistent_captured_at)) {
        try {
          const location = openPersistentSafetyLocation(
            relationship.owner_id,
            relationship.persistent_encrypted_payload,
            relationship.persistent_key_version,
          );
          classifications.push(classifyFamilyImpact(boundary, {
            latitude: location.latitude,
            longitude: location.longitude,
            capturedAt: location.capturedAt,
            accuracyMeters: location.accuracyMeters,
          }, { maxLocationAgeMs: persistentSafetyLocationFreshnessWindowMs() ?? 0 }));
        } catch {
          classifications.push(classifyFamilyImpact(boundary, null));
        }
      } else if (relationship.persistent_consent) {
        classifications.push(classifyFamilyImpact(boundary, null));
      }
    }
    const impact = classifications.find((item) => item.status === "member_confirmed_safety")
      ?? classifications.find((item) => item.status === "potentially_affected")
      ?? classifications.find((item) => item.status === "outside_reported_area")
      ?? classifications[0]
      ?? classifyFamilyImpact(boundary, null);
    if (relationship.persistent_consent) {
      await pool.query(
        `INSERT INTO mwm_persistent_safety_location_audit
           (id, owner_id, trusted_share_id, event_id, action, metadata, created_at)
         VALUES (gen_random_uuid(),$1,$2,$3,'emergency_location_evaluated',$4::jsonb,NOW())`,
        [relationship.owner_id, relationship.trusted_share_id, event.id, JSON.stringify({ impact: impact.status })],
      );
    }
    increment(result, impact.status);
    const requiresDelivery = deliveryRequired(impact.status);
    if (!requiresDelivery) {
      await disableNonPotentialDeliveryAttempt(event.id, relationship.trusted_share_id);
    }
    const audit = await pool.query<{ id: string; delivery_state: string; attempt_count: number; next_retry_at: Date | null; in_app_notification_id: string | null }>(
      `INSERT INTO family_impact_delivery_attempts
         (event_id, trusted_share_id, owner_id, contact_user_id, impact_status, delivery_state, attempt_count, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,0,NOW(),NOW())
       ON CONFLICT (event_id, trusted_share_id)
       DO UPDATE SET impact_status = EXCLUDED.impact_status,
                     delivery_state = CASE
                       WHEN family_impact_delivery_attempts.delivery_state IN ('acknowledged','provider_accepted','provider_rejected','failed','cancelled')
                         THEN family_impact_delivery_attempts.delivery_state
                       WHEN family_impact_delivery_attempts.delivery_state = 'retry_scheduled'
                         AND family_impact_delivery_attempts.next_retry_at > NOW()
                         THEN family_impact_delivery_attempts.delivery_state
                       ELSE EXCLUDED.delivery_state
                     END,
                     updated_at = NOW()
       RETURNING id, delivery_state, attempt_count, next_retry_at, in_app_notification_id`,
      [event.id, relationship.trusted_share_id, relationship.owner_id, relationship.contact_user_id, impact.status, deliveryEnabled && requiresDelivery ? "queued" : "disabled"],
    );
    const attempt = audit.rows[0];
    if (!requiresDelivery) {
      result.skipped += 1;
      continue;
    }
    const retryIsDue = attempt?.delivery_state === "retry_scheduled"
      && (!attempt.next_retry_at || new Date(attempt.next_retry_at).getTime() <= Date.now());
    if (attempt?.delivery_state === "retry_scheduled" && attempt.attempt_count >= 3) {
      await pool.query(
        `UPDATE family_impact_delivery_attempts
            SET delivery_state = 'failed', next_retry_at = NULL, updated_at = NOW()
          WHERE id = $1 AND delivery_state = 'retry_scheduled'`,
        [attempt.id],
      );
      result.skipped += 1;
      continue;
    }
    if (!attempt || !deliveryEnabled || !options.provider
      || ["acknowledged", "provider_accepted", "provider_rejected", "failed", "cancelled"].includes(attempt.delivery_state)
      || (attempt.delivery_state === "retry_scheduled" && !retryIsDue)
    ) {
      result.skipped += 1;
      continue;
    }
    const title = event.event_type === "serious_violent_threat" ? "Safety impact update" : "Emergency area update";
    const body = `${event.general_area}. ${familyImpactDisclosure(impact.status)}`;
    const notificationId = await ensureFamilyImpactInAppNotification({
      deliveryId: attempt.id,
      recipientUserId: relationship.contact_user_id,
      eventId: event.id,
      title,
      body,
    });
    if (!notificationId) {
      await pool.query(
        `UPDATE family_impact_delivery_attempts
            SET delivery_state = 'retry_scheduled', attempt_count = attempt_count + 1,
                next_retry_at = NOW() + INTERVAL '5 minutes', updated_at = NOW()
          WHERE id = $1`,
        [attempt.id],
      );
      result.retryScheduled += 1;
      continue;
    }
    const providerOutcome = await options.provider.send({
      recipientUserId: relationship.contact_user_id, title, body,
      data: { type: "family_impact", deliveryId: attempt.id, eventId: event.id, impact: impact.status },
    });
    if (providerOutcome === "provider_accepted") {
      await pool.query(
        `UPDATE family_impact_delivery_attempts SET delivery_state = 'provider_accepted', attempt_count = attempt_count + 1,
          in_app_notification_id = $1, next_retry_at = NULL, updated_at = NOW() WHERE id = $2`,
        [notificationId, attempt.id],
      );
      result.providerAccepted += 1;
    } else if (providerOutcome === "retryable_failure") {
      await pool.query(
        `UPDATE family_impact_delivery_attempts SET delivery_state = 'retry_scheduled', attempt_count = attempt_count + 1,
          next_retry_at = NOW() + INTERVAL '5 minutes', updated_at = NOW() WHERE id = $1`,
        [attempt.id],
      );
      result.retryScheduled += 1;
    } else {
      await pool.query(
        `UPDATE family_impact_delivery_attempts SET delivery_state = 'provider_rejected', attempt_count = attempt_count + 1,
          next_retry_at = NULL, updated_at = NOW() WHERE id = $1`,
        [attempt.id],
      );
    }
  }
  return result;
}

export async function cancelFamilyImpactEvent(sourceEventId: string, reason: "cancelled" | "withdrawn" | "corrected"): Promise<boolean> {
  const result = await pool.query<{ id: string }>(
    `UPDATE family_impact_events SET status = $1::varchar, withdrawn_at = CASE WHEN $1::varchar IN ('cancelled','withdrawn') THEN NOW() ELSE withdrawn_at END,
       updated_at = NOW() WHERE source_event_id = $2::varchar AND status = 'active' RETURNING id`,
    [reason, sourceEventId],
  );
  if (!result.rows[0]) return false;
  await pool.query(
    `UPDATE family_impact_delivery_attempts SET delivery_state = 'cancelled', next_retry_at = NULL, updated_at = NOW()
      WHERE event_id = $1 AND delivery_state IN ('queued','retry_scheduled')`,
    [result.rows[0].id],
  );
  return true;
}
