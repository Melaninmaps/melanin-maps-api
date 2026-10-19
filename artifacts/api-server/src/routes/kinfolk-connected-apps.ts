import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  CONNECTED_APP_CATALOG,
  connectedAppByKey,
  contextualConnectedApps,
  type ConnectedAppDefinition,
} from "../kinfolk/connected-apps/catalog";

const router: IRouter = Router();

const JOURNEY_PROVIDER_BY_APP_KEY: Record<string, string> = {
  google_calendar: "google_calendar",
  gmail: "gmail",
  microsoft_calendar: "microsoft_calendar",
  outlook_mail: "outlook_mail",
  device_calendar: "device_calendar",
};

type PermissionRow = {
  id: string;
  app_key: string;
  category: string;
  authorization_mode: string;
  status: "requested" | "authorized" | "revoked" | "deleted" | "unavailable";
  purpose: string;
  data_types: string[];
  scopes: string[];
  granted_at: Date | null;
  revoked_at: Date | null;
  expires_at: Date | null;
  updated_at: Date;
};

function memberId(req: Request): string | null {
  return typeof req.user?.id === "string" && req.user.id.trim()
    ? req.user.id
    : null;
}

function sendAuthRequired(res: Response) {
  return void res.status(401).json({ error: "AUTH_REQUIRED" });
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized && normalized.length <= max ? normalized : null;
}

function allowedValues(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (entry): entry is string =>
          typeof entry === "string" && allowed.includes(entry),
      ),
    ),
  ];
}

function safeDefinition(
  definition: ConnectedAppDefinition,
  permission?: PermissionRow,
) {
  return {
    key: definition.key,
    category: definition.category,
    label: definition.label,
    authorizationMode: definition.authorizationMode,
    availability: definition.availability,
    dataTypes: definition.dataTypes,
    description: definition.description,
    boundary: definition.boundary,
    sensitive: definition.sensitive === true,
    permission: permission
      ? {
          status: permission.status,
          purpose: permission.purpose,
          dataTypes: permission.data_types,
          scopes: permission.scopes,
          grantedAt: permission.granted_at?.toISOString() ?? null,
          revokedAt: permission.revoked_at?.toISOString() ?? null,
          expiresAt: permission.expires_at?.toISOString() ?? null,
          updatedAt: permission.updated_at.toISOString(),
        }
      : null,
  };
}

async function listPermissions(userId: string): Promise<PermissionRow[]> {
  const result = await pool.query<PermissionRow>(
    `SELECT id, app_key, category, authorization_mode, status, purpose, data_types, scopes,
            granted_at, revoked_at, expires_at, updated_at
       FROM kinfolk_connected_app_permissions
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY updated_at DESC`,
    [userId],
  );
  return result.rows;
}

function latestPermissionByApp(
  rows: PermissionRow[],
): Map<string, PermissionRow> {
  const latest = new Map<string, PermissionRow>();
  for (const row of rows)
    if (!latest.has(row.app_key)) latest.set(row.app_key, row);
  return latest;
}

async function revokeJourneyProviderConnection(userId: string, appKey: string) {
  const provider = JOURNEY_PROVIDER_BY_APP_KEY[appKey];
  if (!provider) return;
  await pool.query(
    `UPDATE kinfolk_journey_connections
        SET status = 'revoked', token_envelope = NULL, oauth_state_hash = NULL,
            oauth_nonce_hash = NULL, provider_account_ref = NULL,
            selected_calendar_ref = NULL, revoked_at = NOW(), updated_at = NOW()
      WHERE user_id = $1 AND provider = $2`,
    [userId, provider],
  );
}

router.get("/kinfolk-connected-apps", async (req, res) => {
  const userId = memberId(req);
  if (!userId) return sendAuthRequired(res);
  try {
    const latest = latestPermissionByApp(await listPermissions(userId));
    res.json({
      apps: CONNECTED_APP_CATALOG.map((definition) =>
        safeDefinition(definition, latest.get(definition.key)),
      ),
      boundary:
        "An app appears here because Kinfolk has a defined permission boundary, not because it is connected. Provider access is activated only after the member completes that provider's approved flow.",
    });
  } catch (error) {
    req.log?.warn({ error }, "Unable to load Connected Apps settings");
    res.status(503).json({ error: "CONNECTED_APPS_UNAVAILABLE" });
  }
});

router.get("/kinfolk-connected-apps/contextual", async (req, res) => {
  const userId = memberId(req);
  if (!userId) return sendAuthRequired(res);
  const message = cleanText(req.query.message, 500);
  if (!message) {
    return void res.status(400).json({ error: "MESSAGE_REQUIRED" });
  }
  const appKeys = new Set(
    contextualConnectedApps(message).map((app) => app.key),
  );
  try {
    const latest = latestPermissionByApp(await listPermissions(userId));
    res.json({
      prompts: CONNECTED_APP_CATALOG.filter((app) => appKeys.has(app.key)).map(
        (app) => safeDefinition(app, latest.get(app.key)),
      ),
      boundary:
        "These are optional connection or import prompts. They never authorize an app, import data, or add personal context to a conversation by themselves.",
    });
  } catch (error) {
    req.log?.warn(
      { error },
      "Unable to load contextual Connected Apps prompts",
    );
    res.status(503).json({ error: "CONNECTED_APPS_UNAVAILABLE" });
  }
});

router.post("/kinfolk-connected-apps/:appKey/permissions", async (req, res) => {
  const userId = memberId(req);
  if (!userId) return sendAuthRequired(res);
  const definition = connectedAppByKey(String(req.params.appKey ?? ""));
  if (!definition)
    return void res.status(404).json({ error: "CONNECTED_APP_NOT_FOUND" });
  if (definition.authorizationMode === "unsupported") {
    return void res.status(409).json({
      error: "CONNECTED_APP_UNSUPPORTED",
      message: definition.boundary,
    });
  }
  if (req.body?.explicitConsent !== true) {
    return void res.status(400).json({ error: "EXPLICIT_CONSENT_REQUIRED" });
  }
  if (definition.sensitive && req.body?.sensitiveDataAcknowledged !== true) {
    return void res
      .status(400)
      .json({ error: "SENSITIVE_DATA_ACKNOWLEDGEMENT_REQUIRED" });
  }
  const purpose = cleanText(req.body?.purpose, 160);
  if (!purpose)
    return void res.status(400).json({ error: "VALID_PURPOSE_REQUIRED" });
  const dataTypes = allowedValues(req.body?.dataTypes, definition.dataTypes);
  if (!dataTypes.length) {
    return void res.status(400).json({ error: "VALID_DATA_TYPE_REQUIRED" });
  }
  const scopes = allowedValues(req.body?.scopes, definition.dataTypes);
  const status =
    definition.availability === "unsupported" ? "unavailable" : "requested";
  try {
    const result = await pool.query<PermissionRow>(
      `WITH saved AS (
         INSERT INTO kinfolk_connected_app_permissions
           (user_id, app_key, category, authorization_mode, status, purpose, data_types, scopes, granted_at, revoked_at, deleted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, NOW(), NULL, NULL)
         ON CONFLICT (user_id, app_key, purpose)
         DO UPDATE SET category = EXCLUDED.category,
                       authorization_mode = EXCLUDED.authorization_mode,
                       status = EXCLUDED.status,
                       data_types = EXCLUDED.data_types,
                       scopes = EXCLUDED.scopes,
                       granted_at = NOW(), revoked_at = NULL, deleted_at = NULL,
                       updated_at = NOW(), token_envelope = NULL
         RETURNING id, app_key, category, authorization_mode, status, purpose, data_types, scopes,
                   granted_at, revoked_at, expires_at, updated_at
       ), audit AS (
         INSERT INTO kinfolk_connected_app_audit
           (user_id, permission_id, app_key, action, metadata)
         SELECT $1, id, $2, 'consent_recorded',
                jsonb_build_object('authorization_mode', $4, 'data_types', $7::jsonb, 'scopes', $8::jsonb)
           FROM saved
       )
       SELECT id, app_key, category, authorization_mode, status, purpose, data_types, scopes,
              granted_at, revoked_at, expires_at, updated_at
         FROM saved`,
      [
        userId,
        definition.key,
        definition.category,
        definition.authorizationMode,
        status,
        purpose,
        JSON.stringify(dataTypes),
        JSON.stringify(scopes),
      ],
    );
    res.status(201).json({
      app: safeDefinition(definition, result.rows[0]),
      nextStep: definition.availability,
      boundary: definition.boundary,
    });
  } catch (error) {
    req.log?.warn(
      { error, appKey: definition.key },
      "Unable to save Connected Apps consent",
    );
    res.status(503).json({ error: "CONNECTED_APP_CONSENT_UNAVAILABLE" });
  }
});

router.post("/kinfolk-connected-apps/:appKey/revoke", async (req, res) => {
  const userId = memberId(req);
  if (!userId) return sendAuthRequired(res);
  const definition = connectedAppByKey(String(req.params.appKey ?? ""));
  if (!definition)
    return void res.status(404).json({ error: "CONNECTED_APP_NOT_FOUND" });
  try {
    await pool.query(
      `WITH updated AS (
         UPDATE kinfolk_connected_app_permissions
            SET status = 'revoked', token_envelope = NULL, revoked_at = NOW(), updated_at = NOW()
          WHERE user_id = $1 AND app_key = $2 AND deleted_at IS NULL
         RETURNING id
       )
       INSERT INTO kinfolk_connected_app_audit
         (user_id, permission_id, app_key, action, metadata)
       SELECT $1, id, $2, 'authorization_revoked', '{}'::jsonb
         FROM updated`,
      [userId, definition.key],
    );
    await revokeJourneyProviderConnection(userId, definition.key);
    res.json({
      ok: true,
      appKey: definition.key,
      boundary:
        "Authorization and any stored provider token envelope were revoked. Delete individual imported Journey items separately if you also want to remove confirmed plan details.",
    });
  } catch (error) {
    req.log?.warn(
      { error, appKey: definition.key },
      "Unable to revoke Connected Apps authorization",
    );
    res.status(503).json({ error: "CONNECTED_APP_REVOKE_UNAVAILABLE" });
  }
});

router.delete("/kinfolk-connected-apps/:appKey", async (req, res) => {
  const userId = memberId(req);
  if (!userId) return sendAuthRequired(res);
  const definition = connectedAppByKey(String(req.params.appKey ?? ""));
  if (!definition)
    return void res.status(404).json({ error: "CONNECTED_APP_NOT_FOUND" });
  try {
    await pool.query(
      `WITH updated AS (
         UPDATE kinfolk_connected_app_permissions
            SET status = 'deleted', token_envelope = NULL, deleted_at = NOW(), revoked_at = NOW(), updated_at = NOW()
          WHERE user_id = $1 AND app_key = $2 AND deleted_at IS NULL
         RETURNING id
       )
       INSERT INTO kinfolk_connected_app_audit
         (user_id, permission_id, app_key, action, metadata)
       SELECT $1, id, $2, 'permission_deleted', '{}'::jsonb
         FROM updated`,
      [userId, definition.key],
    );
    await revokeJourneyProviderConnection(userId, definition.key);
    res.json({
      ok: true,
      appKey: definition.key,
      boundary:
        "The Connected Apps permission record was deleted. This action does not silently delete Journey plans; remove imported Journey entries through their own owner-controlled delete action.",
    });
  } catch (error) {
    req.log?.warn(
      { error, appKey: definition.key },
      "Unable to delete Connected Apps authorization",
    );
    res.status(503).json({ error: "CONNECTED_APP_DELETE_UNAVAILABLE" });
  }
});

export default router;
