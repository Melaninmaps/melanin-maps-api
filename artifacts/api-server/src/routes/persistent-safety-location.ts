import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  PERSISTENT_SAFETY_LOCATION_CONSENT_VERSION,
  PERSISTENT_SAFETY_LOCATION_CONTACT_CONSENT_VERSION,
  PERSISTENT_SAFETY_LOCATION_DISCLOSURE,
  PERSISTENT_SAFETY_LOCATION_SCOPE,
  parsePersistentSafetyLocationFix,
  persistentSafetyLocationCanMatchEmergency,
  persistentSafetyLocationRuntimeState,
  sealPersistentSafetyLocation,
  type PersistentSafetyPermissionState,
} from "../safety/persistentSafetyLocation";

const router = Router();
const PERMISSION_STATES = new Set<PersistentSafetyPermissionState>([
  "granted", "denied", "restricted", "not_requested", "unknown",
]);

function requireUser(req: Request, res: Response): string | null {
  if (!req.user?.id || !req.isAuthenticated?.()) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function noStore(res: Response): void {
  res.set("Cache-Control", "no-store, private, max-age=0");
  res.set("Pragma", "no-cache");
}

function permissionState(value: unknown): PersistentSafetyPermissionState | null {
  return typeof value === "string" && PERMISSION_STATES.has(value as PersistentSafetyPermissionState)
    ? value as PersistentSafetyPermissionState
    : null;
}

async function audit(input: {
  ownerId: string;
  action: string;
  trustedShareId?: string | null;
  eventId?: string | null;
  metadata?: Record<string, string | boolean | number | null>;
}): Promise<void> {
  // This audit deliberately stores state labels only. It never accepts or logs
  // coordinates, addresses, raw provider payloads, or a movement history.
  await pool.query(
    `INSERT INTO mwm_persistent_safety_location_audit
       (id, owner_id, trusted_share_id, event_id, action, metadata, created_at)
     VALUES (gen_random_uuid(),$1,$2,$3,$4,$5::jsonb,NOW())`,
    [
      input.ownerId,
      input.trustedShareId ?? null,
      input.eventId ?? null,
      input.action,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

async function deleteCurrentLocation(ownerId: string, action: string): Promise<void> {
  await pool.query("DELETE FROM mwm_persistent_safety_locations WHERE owner_id = $1", [ownerId]);
  await audit({ ownerId, action });
}

function runtimeUnavailable(res: Response): boolean {
  if (persistentSafetyLocationRuntimeState().collectionEnabled) return false;
  res.status(503).json({ error: "Persistent Safety Location is not enabled in this environment" });
  return true;
}

router.get("/safety/persistent-location", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  try {
    const runtime = persistentSafetyLocationRuntimeState();
    const result = await pool.query<{
      consent_version: string | null;
      consented_at: Date | null;
      background_opt_in: boolean | null;
      foreground_permission: PersistentSafetyPermissionState | null;
      background_permission: PersistentSafetyPermissionState | null;
      paused_at: Date | null;
      revoked_at: Date | null;
      captured_at: Date | null;
      accuracy_meters: number | null;
    }>(
      `SELECT authorization_record.consent_version, authorization_record.consented_at, authorization_record.background_opt_in,
              authorization_record.foreground_permission, authorization_record.background_permission,
              authorization_record.paused_at, authorization_record.revoked_at,
              location.captured_at, location.accuracy_meters
         FROM users user_record
         LEFT JOIN mwm_persistent_safety_location_authorizations authorization_record
           ON authorization_record.owner_id = user_record.id
         LEFT JOIN mwm_persistent_safety_locations location
           ON location.owner_id = user_record.id
        WHERE user_record.id = $1
          AND user_record.approved = true
          AND COALESCE(user_record.account_status, 'active') = 'active'
        LIMIT 1`,
      [ownerId],
    );
    const row = result.rows[0];
    if (!row) { res.status(404).json({ error: "Safety Location account is unavailable" }); return; }
    const active = Boolean(row.consented_at && !row.revoked_at);
    const paused = Boolean(row.paused_at);
    const current = active && !paused && persistentSafetyLocationCanMatchEmergency(row.captured_at, row.accuracy_meters);
    res.json({
      available: runtime.collectionEnabled,
      encryptionReady: runtime.encryptionReady,
      disclosure: PERSISTENT_SAFETY_LOCATION_DISCLOSURE,
      consentVersion: PERSISTENT_SAFETY_LOCATION_CONSENT_VERSION,
      enabled: active,
      paused,
      backgroundOptIn: Boolean(row.background_opt_in),
      foregroundPermission: row.foreground_permission ?? "unknown",
      backgroundPermission: row.background_permission ?? "unknown",
      locationState: current ? "current" : row.captured_at ? "stale" : "unavailable",
      lastSuccessfulLocationAt: row.captured_at?.toISOString() ?? null,
      accuracyMeters: current ? row.accuracy_meters : null,
      // The configured freshness window is deliberately not returned as a
      // protection promise. It is an operational policy and can be unavailable.
      freshnessPolicyConfigured: runtime.freshnessWindowMs !== null,
      accuracyPolicyConfigured: runtime.accuracyThresholdMeters !== null,
    });
  } catch (error) {
    req.log?.error({
      code: error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : "unknown",
      message: error instanceof Error ? error.message : "unknown",
    }, "persistent safety location settings read failed");
    res.status(500).json({ error: "Unable to load Safety Location settings" });
  }
});

router.put("/safety/persistent-location/consent", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  if (runtimeUnavailable(res)) return;
  const enabled = req.body?.enabled;
  const consentVersion = req.body?.consentVersion;
  const disclosureAcknowledged = req.body?.disclosureAcknowledged;
  const backgroundOptIn = req.body?.backgroundOptIn;
  const foregroundPermission = permissionState(req.body?.foregroundPermission);
  const backgroundPermission = permissionState(req.body?.backgroundPermission);
  if (typeof enabled !== "boolean" || typeof backgroundOptIn !== "boolean" || !foregroundPermission || !backgroundPermission) {
    res.status(400).json({ error: "Explicit consent, background choice, and current operating-system permission states are required" });
    return;
  }
  if (enabled && (consentVersion !== PERSISTENT_SAFETY_LOCATION_CONSENT_VERSION || disclosureAcknowledged !== true)) {
    res.status(400).json({ error: "The current Persistent Safety Location disclosure must be explicitly acknowledged" });
    return;
  }
  try {
    const member = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1 AND approved = true AND COALESCE(account_status, 'active') = 'active' LIMIT 1",
      [ownerId],
    );
    if (!member.rows[0]) { res.status(403).json({ error: "Safety Location is unavailable for this account" }); return; }
    await pool.query(
      `INSERT INTO mwm_persistent_safety_location_authorizations
         (owner_id, consent_version, consented_at, background_opt_in, foreground_permission, background_permission, paused_at, revoked_at, updated_at)
       VALUES ($1,$2,NOW(),$3,$4,$5,NULL,CASE WHEN $6 THEN NULL ELSE NOW() END,NOW())
       ON CONFLICT (owner_id) DO UPDATE SET
         consent_version = EXCLUDED.consent_version,
         consented_at = CASE WHEN $6 THEN NOW() ELSE mwm_persistent_safety_location_authorizations.consented_at END,
         background_opt_in = EXCLUDED.background_opt_in,
         foreground_permission = EXCLUDED.foreground_permission,
         background_permission = EXCLUDED.background_permission,
         paused_at = CASE WHEN $6 THEN NULL ELSE mwm_persistent_safety_location_authorizations.paused_at END,
         revoked_at = CASE WHEN $6 THEN NULL ELSE NOW() END,
         updated_at = NOW()`,
      [ownerId, PERSISTENT_SAFETY_LOCATION_CONSENT_VERSION, backgroundOptIn, foregroundPermission, backgroundPermission, enabled],
    );
    if (!enabled) {
      await pool.query(
        "UPDATE mwm_persistent_safety_location_contact_consents SET revoked_at = NOW(), updated_at = NOW() WHERE owner_id = $1 AND revoked_at IS NULL",
        [ownerId],
      );
      await deleteCurrentLocation(ownerId, "consent_revoked_location_deleted");
      await audit({ ownerId, action: "persistent_consent_revoked" });
    } else {
      await audit({
        ownerId,
        action: "persistent_consent_enabled",
        metadata: { backgroundOptIn, foregroundPermission, backgroundPermission },
      });
    }
    res.json({
      enabled,
      backgroundOptIn,
      foregroundPermission,
      backgroundPermission,
      consentVersion: PERSISTENT_SAFETY_LOCATION_CONSENT_VERSION,
    });
  } catch {
    res.status(500).json({ error: "Unable to update Persistent Safety Location consent" });
  }
});

router.patch("/safety/persistent-location/pause", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  if (runtimeUnavailable(res)) return;
  const paused = req.body?.paused;
  if (typeof paused !== "boolean") { res.status(400).json({ error: "paused must be a boolean" }); return; }
  try {
    const updated = await pool.query<{ owner_id: string }>(
      `UPDATE mwm_persistent_safety_location_authorizations
          SET paused_at = CASE WHEN $1 THEN NOW() ELSE NULL END, updated_at = NOW()
        WHERE owner_id = $2 AND revoked_at IS NULL
        RETURNING owner_id`,
      [paused, ownerId],
    );
    if (!updated.rows[0]) { res.status(409).json({ error: "Persistent Safety Location consent is not active" }); return; }
    if (paused) await deleteCurrentLocation(ownerId, "paused_location_deleted");
    await audit({ ownerId, action: paused ? "persistent_location_paused" : "persistent_location_resumed" });
    res.json({ paused });
  } catch {
    res.status(500).json({ error: "Unable to update pause state" });
  }
});

router.patch("/safety/persistent-location/permissions", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  if (runtimeUnavailable(res)) return;
  const foregroundPermission = permissionState(req.body?.foregroundPermission);
  const backgroundPermission = permissionState(req.body?.backgroundPermission);
  if (!foregroundPermission || !backgroundPermission) { res.status(400).json({ error: "Valid operating-system permission states are required" }); return; }
  try {
    const updated = await pool.query<{ owner_id: string }>(
      `UPDATE mwm_persistent_safety_location_authorizations
          SET foreground_permission = $1, background_permission = $2, updated_at = NOW()
        WHERE owner_id = $3 AND revoked_at IS NULL
        RETURNING owner_id`,
      [foregroundPermission, backgroundPermission, ownerId],
    );
    if (!updated.rows[0]) { res.status(409).json({ error: "Persistent Safety Location consent is not active" }); return; }
    if (foregroundPermission !== "granted") await deleteCurrentLocation(ownerId, "foreground_permission_lost_location_deleted");
    await audit({ ownerId, action: "permission_state_updated", metadata: { foregroundPermission, backgroundPermission } });
    res.json({ foregroundPermission, backgroundPermission });
  } catch {
    res.status(500).json({ error: "Unable to record permission state" });
  }
});

router.post("/safety/persistent-location/fix", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  if (runtimeUnavailable(res)) return;
  const fix = parsePersistentSafetyLocationFix(req.body?.location);
  const foregroundPermission = permissionState(req.body?.foregroundPermission);
  const backgroundPermission = permissionState(req.body?.backgroundPermission);
  if (!fix || !foregroundPermission || !backgroundPermission) {
    res.status(400).json({ error: "A valid current location and operating-system permission state are required" });
    return;
  }
  try {
    const authorization = await pool.query<{
      background_opt_in: boolean; foreground_permission: PersistentSafetyPermissionState; background_permission: PersistentSafetyPermissionState;
    }>(
      `UPDATE mwm_persistent_safety_location_authorizations
          SET foreground_permission = $1, background_permission = $2, updated_at = NOW()
        WHERE owner_id = $3 AND revoked_at IS NULL AND paused_at IS NULL
        RETURNING background_opt_in, foreground_permission, background_permission`,
      [foregroundPermission, backgroundPermission, ownerId],
    );
    const state = authorization.rows[0];
    if (!state || foregroundPermission !== "granted" || (fix.background && (!state.background_opt_in || backgroundPermission !== "granted"))) {
      res.status(409).json({ error: "Persistent Safety Location collection is not currently authorized" });
      return;
    }
    const sealed = sealPersistentSafetyLocation(ownerId, fix);
    await pool.query(
      `INSERT INTO mwm_persistent_safety_locations
         (owner_id, encrypted_payload, encryption_key_version, captured_at, accuracy_meters, source_platform, received_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
       ON CONFLICT (owner_id) DO UPDATE SET
         encrypted_payload = EXCLUDED.encrypted_payload,
         encryption_key_version = EXCLUDED.encryption_key_version,
         captured_at = EXCLUDED.captured_at,
         accuracy_meters = EXCLUDED.accuracy_meters,
         source_platform = EXCLUDED.source_platform,
         received_at = NOW(),
         updated_at = NOW()`,
      [ownerId, sealed.encryptedPayload, sealed.encryptionKeyVersion, fix.capturedAt, fix.accuracyMeters, fix.platform],
    );
    await audit({
      ownerId,
      action: "location_fix_stored",
      metadata: { platform: fix.platform, background: fix.background, freshnessPolicyConfigured: persistentSafetyLocationRuntimeState().freshnessWindowMs !== null },
    });
    res.status(202).json({ accepted: true, locationState: "current" });
  } catch {
    // Do not surface or log the encrypted payload or any coordinate values.
    res.status(503).json({ error: "Persistent Safety Location could not securely store this update" });
  }
});

router.delete("/safety/persistent-location/location", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  try {
    await deleteCurrentLocation(ownerId, "member_requested_location_deletion");
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: "Unable to delete stored Safety Location data" });
  }
});

router.delete("/safety/persistent-location/consent", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  try {
    await pool.query(
      `UPDATE mwm_persistent_safety_location_authorizations
          SET revoked_at = NOW(), paused_at = NULL, updated_at = NOW()
        WHERE owner_id = $1 AND revoked_at IS NULL`,
      [ownerId],
    );
    await pool.query(
      "UPDATE mwm_persistent_safety_location_contact_consents SET revoked_at = NOW(), updated_at = NOW() WHERE owner_id = $1 AND revoked_at IS NULL",
      [ownerId],
    );
    await deleteCurrentLocation(ownerId, "consent_revoked_location_deleted");
    await audit({ ownerId, action: "persistent_consent_revoked" });
    res.json({ revoked: true, locationDeleted: true });
  } catch {
    res.status(500).json({ error: "Unable to revoke Persistent Safety Location consent" });
  }
});

router.get("/safety/persistent-location/contacts", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  try {
    const rows = await pool.query<{
      trusted_share_id: string; contact_name: string; contact_accepted: boolean; owner_enabled: boolean; status: string; owner_block_id: string | null; contact_block_id: string | null; consented_at: Date | null; revoked_at: Date | null;
    }>(
      `SELECT trusted.id AS trusted_share_id, trusted.contact_name, trusted.contact_accepted, trusted.owner_enabled, trusted.status,
              owner_blocks.id AS owner_block_id, contact_blocks.id AS contact_block_id,
              consent.consented_at, consent.revoked_at
         FROM trusted_safety_shares trusted
         LEFT JOIN mwm_persistent_safety_location_contact_consents consent
           ON consent.owner_id = trusted.owner_id AND consent.trusted_share_id = trusted.id
         LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = trusted.owner_id AND owner_blocks.blocked_id = trusted.contact_user_id
         LEFT JOIN user_blocks contact_blocks ON contact_blocks.blocker_id = trusted.contact_user_id AND contact_blocks.blocked_id = trusted.owner_id
        WHERE trusted.owner_id = $1 AND trusted.contact_type = 'mwm_user' AND trusted.status <> 'revoked'
        ORDER BY trusted.created_at DESC`,
      [ownerId],
    );
    res.json({
      contacts: rows.rows.map((row) => ({
        trustedShareId: row.trusted_share_id,
        contactName: row.contact_name,
        eligible: row.contact_accepted && row.owner_enabled && row.status === "active" && !row.owner_block_id && !row.contact_block_id,
        allowedForEmergencyImpact: Boolean(row.consented_at && !row.revoked_at),
      })),
    });
  } catch {
    res.status(500).json({ error: "Unable to load authorized emergency contacts" });
  }
});

router.put("/safety/persistent-location/contacts/:shareId", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  noStore(res);
  if (runtimeUnavailable(res)) return;
  const enabled = req.body?.enabled;
  const consentVersion = req.body?.consentVersion;
  if (typeof enabled !== "boolean" || (enabled && consentVersion !== PERSISTENT_SAFETY_LOCATION_CONTACT_CONSENT_VERSION)) {
    res.status(400).json({ error: "Explicit per-contact emergency-notification consent is required" });
    return;
  }
  try {
    const eligible = await pool.query<{ id: string }>(
      `SELECT trusted.id
         FROM trusted_safety_shares trusted
         JOIN mwm_persistent_safety_location_authorizations authorization_record ON authorization_record.owner_id = trusted.owner_id
         LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = trusted.owner_id AND owner_blocks.blocked_id = trusted.contact_user_id
         LEFT JOIN user_blocks contact_blocks ON contact_blocks.blocker_id = trusted.contact_user_id AND contact_blocks.blocked_id = trusted.owner_id
        WHERE trusted.id = $1 AND trusted.owner_id = $2 AND trusted.contact_type = 'mwm_user'
          AND trusted.status = 'active' AND trusted.owner_enabled = true AND trusted.contact_accepted = true
          AND authorization_record.revoked_at IS NULL AND authorization_record.paused_at IS NULL
          AND owner_blocks.id IS NULL AND contact_blocks.id IS NULL
        LIMIT 1`,
      [req.params.shareId, ownerId],
    );
    if (!eligible.rows[0]) { res.status(409).json({ error: "That trusted contact is not currently eligible for Persistent Safety Location alerts" }); return; }
    await pool.query(
      `INSERT INTO mwm_persistent_safety_location_contact_consents
         (id, owner_id, trusted_share_id, consent_version, consented_at, revoked_at, updated_at)
       VALUES (gen_random_uuid(),$1,$2,$3,NOW(),CASE WHEN $4 THEN NULL ELSE NOW() END,NOW())
       ON CONFLICT (owner_id, trusted_share_id) DO UPDATE SET
         consent_version = EXCLUDED.consent_version,
         consented_at = CASE WHEN $4 THEN NOW() ELSE mwm_persistent_safety_location_contact_consents.consented_at END,
         revoked_at = CASE WHEN $4 THEN NULL ELSE NOW() END,
         updated_at = NOW()`,
      [ownerId, req.params.shareId, PERSISTENT_SAFETY_LOCATION_CONTACT_CONSENT_VERSION, enabled],
    );
    await audit({ ownerId, trustedShareId: req.params.shareId, action: enabled ? "contact_emergency_consent_enabled" : "contact_emergency_consent_revoked" });
    res.json({ enabled, consentVersion: PERSISTENT_SAFETY_LOCATION_CONTACT_CONSENT_VERSION, locationScope: PERSISTENT_SAFETY_LOCATION_SCOPE });
  } catch {
    res.status(500).json({ error: "Unable to update trusted-contact emergency consent" });
  }
});

export default router;
