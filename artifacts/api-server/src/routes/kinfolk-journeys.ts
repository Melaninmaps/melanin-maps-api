import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  assertConfirmedItemMutation,
  assertJourneyFeatureEnabled,
  assertJourneyItemInput,
  assertJourneyProvider,
  assertJourneyTransition,
  assertValidJourneyInput,
  journeyFeatureEnabled,
  JourneyActionError,
  normalizeJourneyText,
  redactedPreview,
  sha256,
  type JourneyInput,
  type JourneyItemInput,
  type JourneyProvider,
  type JourneyStatus,
} from "../kinfolk/journeys/domain";
import { parseJourneyConfirmationText } from "../kinfolk/journeys/confirmation-parser";
import {
  getJourneyDeletionPlan,
  retentionExpiryFor,
} from "../kinfolk/journeys/retention";
import {
  assertJourneyAuthorizationCallback,
  exchangeJourneyAuthorizationCode,
  listJourneyProviderCalendars,
  listJourneyProviderReadiness,
  providerNetworkCallsAllowed,
  resolveJourneyProviderAccount,
  startJourneyAuthorization,
} from "../kinfolk/journeys/providers";
import { extractJourneyPrivateDocument } from "../kinfolk/journeys/attachment-extraction";
import {
  opaqueJourneyReference,
  openJourneyToken,
  sealJourneyToken,
} from "../kinfolk/journeys/token-vault";
import {
  getFlightMonitorReadiness,
  parseFlightWatchInput,
  unknownFlightStatus,
} from "../kinfolk/journeys/flight-watch";

const router: IRouter = Router();

type JourneyRow = {
  id: string;
  user_id: string;
  title: string;
  status: JourneyStatus;
  destination_label: string | null;
  destination_city: string | null;
  destination_region: string | null;
  time_zone: string | null;
  start_date: string | null;
  end_date: string | null;
  preferences: Record<string, unknown>;
  origin_kinfolk_session_id: string | null;
  retention_policy:
    | "delete_after_trip"
    | "keep_until_deleted"
    | "keep_until_member_changes_it";
  retention_expires_at: Date | null;
  member_consented_at: Date | null;
  archived_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type JourneyItemRow = {
  id: string;
  journey_id: string;
  user_id: string;
  kind: string;
  status: "proposed" | "tentative" | "confirmed" | "cancelled" | "skipped";
  title: string;
  starts_at: Date | null;
  ends_at: Date | null;
  time_zone: string | null;
  location_label: string | null;
  canonical_business_id: string | null;
  source_import_id: string | null;
  member_confirmed_at: Date | null;
  payload: {
    publicPreview?: string | null;
    provenance?: { sourceKind?: string; confidence?: string };
  };
  created_at: Date;
  updated_at: Date;
};

type JourneyImportRow = {
  id: string;
  journey_id: string;
  user_id: string;
  source_kind: string;
  status: string;
  asset_id: string | null;
  parsed_facts: Array<{
    field: string;
    value: string;
    confidence: "high" | "medium" | "low";
    reason: string;
  }>;
  content_digest: string;
  created_at: Date;
  reviewed_at: Date | null;
};

type JourneyReminderRow = {
  id: string;
  journey_id: string;
  user_id: string;
  item_id: string | null;
  channel: "in_app" | "push" | "email";
  state: "enabled" | "paused" | "sent" | "deleted";
  due_at: Date;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type JourneyFlightWatchRow = {
  id: string;
  journey_id: string;
  user_id: string;
  item_id: string | null;
  operating_carrier: string;
  flight_number: string;
  scheduled_departure_date: string;
  origin_iata: string;
  destination_iata: string;
  notification_channel: "in_app" | "push" | "email";
  state:
    | "pending_provider"
    | "active"
    | "paused"
    | "completed"
    | "revoked"
    | "deleted";
  provider_key: string | null;
  last_status: {
    state?: "unknown" | "on_time" | "delayed" | "cancelled" | "diverted";
    sourceObservedAt?: string | null;
    freshUntil?: string | null;
    summary?: string | null;
  };
  last_observed_at: Date | null;
  fresh_until: Date | null;
  consented_at: Date;
  paused_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type PendingConnectionRow = {
  id: string;
  user_id: string;
  provider: JourneyProvider;
  access_mode:
    | "free_busy"
    | "selected_items"
    | "calendar_selection"
    | "manual";
  token_envelope: string | null;
  oauth_state_hash: string | null;
  expires_at: Date | null;
  provider_account_ref: string | null;
  selected_calendar_ref: string | null;
};

type ConnectedCalendarRow = PendingConnectionRow & {
  status: string;
  scopes: string[];
};

function memberId(req: Request): string | null {
  return typeof req.user?.id === "string" && req.user.id.trim()
    ? req.user.id
    : null;
}

function requireMember(req: Request, res: Response): string | null {
  const id = memberId(req);
  if (!id) {
    res
      .status(401)
      .json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return null;
  }
  return id;
}

function respondError(res: Response, error: unknown): void {
  if (error instanceof JourneyActionError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }
  res.status(500).json({
    error:
      "Kinfolk Journeys could not complete that request. Please try again.",
    code: "JOURNEY_UNAVAILABLE",
  });
}

function safeJourney(row: JourneyRow) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    destinationLabel: row.destination_label,
    destinationCity: row.destination_city,
    destinationRegion: row.destination_region,
    timeZone: row.time_zone,
    startDate: row.start_date,
    endDate: row.end_date,
    preferences: row.preferences ?? {},
    originKinfolkSessionId: row.origin_kinfolk_session_id,
    retentionPolicy: row.retention_policy,
    retentionExpiresAt: row.retention_expires_at?.toISOString() ?? null,
    memberConsentedAt: row.member_consented_at?.toISOString() ?? null,
    archivedAt: row.archived_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    visibility: "private" as const,
  };
}

function safeItem(row: JourneyItemRow) {
  return {
    id: row.id,
    journeyId: row.journey_id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    startsAt: row.starts_at?.toISOString() ?? null,
    endsAt: row.ends_at?.toISOString() ?? null,
    timeZone: row.time_zone,
    locationLabel: row.location_label,
    canonicalBusinessId: row.canonical_business_id,
    sourceImportId: row.source_import_id,
    memberConfirmedAt: row.member_confirmed_at?.toISOString() ?? null,
    publicPreview: row.payload?.publicPreview ?? null,
    provenance: row.payload?.provenance ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function safeImport(row: JourneyImportRow) {
  return {
    id: row.id,
    journeyId: row.journey_id,
    sourceKind: row.source_kind,
    status: row.status,
    hasPrivateAttachment: Boolean(row.asset_id),
    parsedFacts: Array.isArray(row.parsed_facts) ? row.parsed_facts : [],
    createdAt: row.created_at.toISOString(),
    reviewedAt: row.reviewed_at?.toISOString() ?? null,
  };
}

function safeReminder(row: JourneyReminderRow) {
  return {
    id: row.id,
    journeyId: row.journey_id,
    itemId: row.item_id,
    channel: row.channel,
    state: row.state,
    dueAt: row.due_at.toISOString(),
    sentAt: row.sent_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function safeFlightWatch(row: JourneyFlightWatchRow) {
  const status = row.last_status ?? unknownFlightStatus();
  return {
    id: row.id,
    journeyId: row.journey_id,
    itemId: row.item_id,
    operatingCarrier: row.operating_carrier,
    flightNumber: row.flight_number,
    scheduledDepartureDate: row.scheduled_departure_date,
    originIata: row.origin_iata,
    destinationIata: row.destination_iata,
    notificationChannel: row.notification_channel,
    state: row.state,
    provider: row.provider_key,
    status: {
      state: status.state ?? "unknown",
      sourceObservedAt: status.sourceObservedAt ?? null,
      freshUntil: status.freshUntil ?? null,
      summary: status.summary ?? null,
    },
    lastObservedAt: row.last_observed_at?.toISOString() ?? null,
    freshUntil: row.fresh_until?.toISOString() ?? null,
    consentedAt: row.consented_at.toISOString(),
    pausedAt: row.paused_at?.toISOString() ?? null,
    revokedAt: row.revoked_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function ownedJourney(
  userId: string,
  id: string,
): Promise<JourneyRow | null> {
  const result = await pool.query<JourneyRow>(
    `SELECT * FROM kinfolk_journeys WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}

async function requireOwnedJourney(
  userId: string,
  id: string,
): Promise<JourneyRow> {
  const journey = await ownedJourney(userId, id);
  if (!journey)
    throw new JourneyActionError(
      "Journey not found.",
      404,
      "JOURNEY_NOT_FOUND",
    );
  return journey;
}

async function appendAudit(input: {
  journeyId: string;
  userId: string;
  eventType: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await pool.query(
    `INSERT INTO kinfolk_journey_audit (id, journey_id, user_id, event_type, metadata) VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [
      randomUUID(),
      input.journeyId,
      input.userId,
      input.eventType,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

function parseJourneyPayload(value: unknown): JourneyInput {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    title: typeof source.title === "string" ? source.title : "",
    destinationLabel: normalizeJourneyText(source.destinationLabel),
    destinationCity: normalizeJourneyText(source.destinationCity, 120),
    destinationRegion: normalizeJourneyText(source.destinationRegion, 120),
    timeZone: normalizeJourneyText(source.timeZone, 80),
    startDate: normalizeJourneyText(source.startDate, 10),
    endDate: normalizeJourneyText(source.endDate, 10),
    retentionPolicy:
      source.retentionPolicy === "delete_after_trip" ||
      source.retentionPolicy === "keep_until_member_changes_it" ||
      source.retentionPolicy === "keep_until_deleted"
        ? source.retentionPolicy
        : "keep_until_deleted",
    preferences:
      source.preferences &&
      typeof source.preferences === "object" &&
      !Array.isArray(source.preferences)
        ? (source.preferences as Record<string, unknown>)
        : {},
  };
}

function parseItemPayload(value: unknown): JourneyItemInput {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    kind: String(source.kind ?? "note") as JourneyItemInput["kind"],
    status:
      typeof source.status === "string"
        ? (source.status as JourneyItemInput["status"])
        : "proposed",
    title: typeof source.title === "string" ? source.title : "",
    startsAt: normalizeJourneyText(source.startsAt, 64),
    endsAt: normalizeJourneyText(source.endsAt, 64),
    timeZone: normalizeJourneyText(source.timeZone, 80),
    locationLabel: normalizeJourneyText(source.locationLabel),
    canonicalBusinessId: normalizeJourneyText(source.canonicalBusinessId, 36),
    sourceImportId: normalizeJourneyText(source.sourceImportId, 36),
    sensitiveDetails:
      source.sensitiveDetails &&
      typeof source.sensitiveDetails === "object" &&
      !Array.isArray(source.sensitiveDetails)
        ? (source.sensitiveDetails as Record<string, unknown>)
        : null,
  };
}

router.get("/kinfolk-journeys/capabilities", (_req, res) => {
  res.json({
    enabled: journeyFeatureEnabled(),
    visibility: "private",
    providers: listJourneyProviderReadiness(),
    flightMonitor: getFlightMonitorReadiness(),
    message: journeyFeatureEnabled()
      ? null
      : "Kinfolk Journeys is being prepared and is not enabled in this environment yet.",
  });
});

router.get("/kinfolk-journeys/connections", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const rows = await pool.query<{
      provider: JourneyProvider;
      status: string;
      access_mode: string;
      scopes: string[];
      expires_at: Date | null;
      consented_at: Date | null;
      last_sync_at: Date | null;
      provider_account_ref: string | null;
      selected_calendar_ref: string | null;
    }>(
      `SELECT provider, status, access_mode, scopes, expires_at, consented_at, last_sync_at,
              provider_account_ref, selected_calendar_ref
         FROM kinfolk_journey_connections
        WHERE user_id = $1`,
      [userId],
    );
    const byProvider = new Map(rows.rows.map((row) => [row.provider, row]));
    res.json({
      connections: listJourneyProviderReadiness().map((readiness) => {
        const connection = byProvider.get(readiness.provider);
        return {
          provider: readiness.provider,
          availability: readiness.status,
          accessModes: readiness.accessModes,
          scopes: connection?.scopes ?? readiness.scopes,
          status: connection?.status ?? readiness.status,
          accessMode: connection?.access_mode ?? "manual",
          expiresAt: connection?.expires_at?.toISOString() ?? null,
          consentedAt: connection?.consented_at?.toISOString() ?? null,
          lastSyncAt: connection?.last_sync_at?.toISOString() ?? null,
          providerAccountRef: connection?.provider_account_ref ?? null,
          selectedCalendarRef: connection?.selected_calendar_ref ?? null,
          blockers: readiness.blockers,
        };
      }),
    });
  } catch (error) {
    respondError(res, error);
  }
});

router.post(
  "/kinfolk-journeys/connections/:provider/start",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const provider = assertJourneyProvider(req.params.provider);
      const accessMode =
        req.body?.accessMode === "calendar_selection" ||
        req.body?.accessMode === "selected_items" ||
        req.body?.accessMode === "free_busy"
          ? req.body.accessMode
          : "manual";
      const existing = await pool.query<{ status: string }>(
        `SELECT status FROM kinfolk_journey_connections
          WHERE user_id=$1 AND provider=$2 LIMIT 1`,
        [userId, provider],
      );
      if (
        existing.rows[0]?.status === "connected" &&
        req.body?.confirmReplaceExisting !== true
      ) {
        throw new JourneyActionError(
          "Disconnect this existing provider account first, or explicitly confirm replacing it. No calendar was changed.",
          409,
          "JOURNEY_REVIEW_REQUIRED",
        );
      }
      const result = startJourneyAuthorization({
        provider,
        memberId: userId,
        requestedAccessMode: accessMode,
      });
      const connectionId = result.transaction.id;
      const envelope = sealJourneyToken(
        {
          stateHash: result.transaction.stateHash,
          nonceHash: result.transaction.nonceHash,
          codeVerifier: result.transaction.codeVerifier,
          requestedAccessMode: result.transaction.requestedAccessMode,
        },
        {
          purpose: "oauth_pending",
          memberId: userId,
          provider,
          connectionId,
        },
      );
      await pool.query(
        `INSERT INTO kinfolk_journey_connections
           (id,user_id,provider,status,access_mode,scopes,token_envelope,oauth_state_hash,oauth_nonce_hash,expires_at,provider_account_ref,selected_calendar_ref)
         VALUES ($1,$2,$3,'pending_consent',$4,$5::jsonb,$6,$7,$8,$9,NULL,NULL)
         ON CONFLICT (user_id,provider) DO UPDATE
           SET id=EXCLUDED.id,
               status='pending_consent',
               access_mode=EXCLUDED.access_mode,
               scopes=EXCLUDED.scopes,
               token_envelope=EXCLUDED.token_envelope,
               oauth_state_hash=EXCLUDED.oauth_state_hash,
               oauth_nonce_hash=EXCLUDED.oauth_nonce_hash,
               expires_at=EXCLUDED.expires_at,
               provider_account_ref=NULL,
               selected_calendar_ref=NULL,
               revoked_at=NULL,
               updated_at=NOW()`,
        [
          connectionId,
          userId,
          provider,
          accessMode,
          JSON.stringify(result.transaction.scopes),
          envelope,
          result.transaction.stateHash,
          result.transaction.nonceHash,
          result.transaction.expiresAt,
        ],
      );
      // The browser/mobile client opens this URL only after an explicit member action.
      res.status(201).json({
        provider,
        authorizationUrl: result.authorizationUrl,
        expiresAt: result.transaction.expiresAt.toISOString(),
      });
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.get(
  "/kinfolk-journeys/connections/:provider/callback",
  async (req, res) => {
    try {
      assertJourneyFeatureEnabled();
      const provider = assertJourneyProvider(req.params.provider);
      const callbackState =
        typeof req.query.state === "string" ? req.query.state : undefined;
      const code =
        typeof req.query.code === "string" ? req.query.code.trim() : "";
      if (!code || !callbackState)
        throw new JourneyActionError(
          "The provider did not return a valid connection response.",
          400,
          "JOURNEY_PROVIDER_UNAVAILABLE",
        );
      const stateHash = sha256(callbackState);
      const result = await pool.query<PendingConnectionRow>(
        `SELECT id,user_id,provider,access_mode,token_envelope,oauth_state_hash,expires_at,
                provider_account_ref,selected_calendar_ref
           FROM kinfolk_journey_connections
          WHERE provider=$1 AND status='pending_consent' AND oauth_state_hash=$2 LIMIT 1`,
        [provider, stateHash],
      );
      const pending = result.rows[0];
      if (
        !pending ||
        !pending.token_envelope ||
        !pending.oauth_state_hash ||
        !pending.expires_at
      )
        throw new JourneyActionError(
          "This connection request is no longer available. Please try again.",
          400,
          "JOURNEY_PROVIDER_UNAVAILABLE",
        );
      assertJourneyAuthorizationCallback({
        storedStateHash: pending.oauth_state_hash,
        callbackState,
        expiresAt: pending.expires_at,
      });
      const transaction = openJourneyToken(pending.token_envelope, {
        purpose: "oauth_pending",
        memberId: pending.user_id,
        provider,
        connectionId: pending.id,
      });
      if (
        typeof transaction.codeVerifier !== "string" ||
        typeof transaction.requestedAccessMode !== "string"
      )
        throw new JourneyActionError(
          "This connection request could not be verified. Please try again.",
          400,
          "JOURNEY_PROVIDER_UNAVAILABLE",
        );
      const tokenSet = await exchangeJourneyAuthorizationCode({
        provider,
        code,
        codeVerifier: transaction.codeVerifier,
      });
      const account = await resolveJourneyProviderAccount({
        provider,
        accessToken: tokenSet.accessToken,
      });
      const providerAccountRef = opaqueJourneyReference({
        memberId: pending.user_id,
        provider,
        kind: "provider_account",
        value: account.providerAccountId,
      });
      const tokenEnvelope = sealJourneyToken(
        {
          accessToken: tokenSet.accessToken,
          refreshToken: tokenSet.refreshToken ?? null,
          scope: tokenSet.scope,
          provider,
          providerAccountId: account.providerAccountId,
        },
        {
          purpose: "provider_connection",
          memberId: pending.user_id,
          provider,
          connectionId: pending.id,
        },
      );
      await pool.query(
        `UPDATE kinfolk_journey_connections
            SET status='connected',
                token_envelope=$2,
                scopes=$3::jsonb,
                provider_account_ref=$4,
                selected_calendar_ref=NULL,
                consented_at=NOW(),
                expires_at=$5,
                oauth_state_hash=NULL,
                oauth_nonce_hash=NULL,
                updated_at=NOW()
          WHERE id=$1 AND user_id=$6 AND provider=$7`,
        [
          pending.id,
          tokenEnvelope,
          JSON.stringify(tokenSet.scope),
          providerAccountRef,
          tokenSet.expiresAt,
          pending.user_id,
          provider,
        ],
      );
      const destination =
        process.env.KINFOLK_JOURNEYS_OAUTH_REDIRECT_BASE?.trim().replace(
          /\/$/,
          "",
        );
      if (!destination)
        throw new JourneyActionError(
          "Connection finished but no safe return URL is configured.",
          503,
          "JOURNEY_PROVIDER_UNAVAILABLE",
        );
      res.redirect(
        302,
        `${destination}/journeys?connection=${encodeURIComponent(provider)}&status=connected`,
      );
    } catch (error) {
      respondError(res, error);
    }
  },
);

async function ownedCalendarConnection(input: {
  userId: string;
  provider: JourneyProvider;
}): Promise<ConnectedCalendarRow> {
  const result = await pool.query<ConnectedCalendarRow>(
    `SELECT id,user_id,provider,status,access_mode,scopes,token_envelope,oauth_state_hash,expires_at,
            provider_account_ref,selected_calendar_ref
       FROM kinfolk_journey_connections
      WHERE user_id=$1 AND provider=$2 AND status='connected' LIMIT 1`,
    [input.userId, input.provider],
  );
  const connection = result.rows[0];
  if (
    !connection ||
    connection.access_mode !== "calendar_selection" ||
    !connection.token_envelope ||
    !connection.provider_account_ref
  ) {
    throw new JourneyActionError(
      "Connect this calendar with calendar-details access before choosing a calendar.",
      409,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  return connection;
}

async function calendarsForOwnedConnection(input: {
  userId: string;
  provider: JourneyProvider;
  connection: ConnectedCalendarRow;
}): Promise<readonly { reference: string; label: string }[]> {
  const token = openJourneyToken(input.connection.token_envelope!, {
    purpose: "provider_connection",
    memberId: input.userId,
    provider: input.provider,
    connectionId: input.connection.id,
  });
  if (
    typeof token.accessToken !== "string" ||
    typeof token.providerAccountId !== "string"
  ) {
    throw new JourneyActionError(
      "This provider connection requires a secure reconnection.",
      409,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  const expectedAccountRef = opaqueJourneyReference({
    memberId: input.userId,
    provider: input.provider,
    kind: "provider_account",
    value: token.providerAccountId,
  });
  if (expectedAccountRef !== input.connection.provider_account_ref) {
    throw new JourneyActionError(
      "This provider connection no longer matches its private account reference. Reconnect before choosing a calendar.",
      409,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  const calendars = await listJourneyProviderCalendars({
    provider: input.provider,
    accessToken: token.accessToken,
  });
  return calendars.map((calendar) => ({
    reference: opaqueJourneyReference({
      memberId: input.userId,
      provider: input.provider,
      kind: "calendar",
      value: calendar.providerCalendarId,
    }),
    label: calendar.label,
  }));
}

router.get(
  "/kinfolk-journeys/connections/:provider/calendars",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const provider = assertJourneyProvider(req.params.provider);
      const connection = await ownedCalendarConnection({ userId, provider });
      const calendars = await calendarsForOwnedConnection({
        userId,
        provider,
        connection,
      });
      res.json({
        provider,
        calendars,
        selectedCalendarRef: connection.selected_calendar_ref,
        boundary:
          "Choose one calendar explicitly. Listing calendars does not read events or write to any calendar.",
      });
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.put(
  "/kinfolk-journeys/connections/:provider/calendar-selection",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const provider = assertJourneyProvider(req.params.provider);
      const calendarRef = normalizeJourneyText(req.body?.calendarRef, 96);
      if (
        !calendarRef ||
        !/^journey_ref_v1_[A-Za-z0-9_-]{43}$/.test(calendarRef)
      ) {
        throw new JourneyActionError(
          "Choose a calendar from your currently connected account.",
          400,
          "JOURNEY_INVALID",
        );
      }
      const connection = await ownedCalendarConnection({ userId, provider });
      const calendars = await calendarsForOwnedConnection({
        userId,
        provider,
        connection,
      });
      const selected = calendars.find(
        (calendar) => calendar.reference === calendarRef,
      );
      if (!selected) {
        throw new JourneyActionError(
          "That calendar is no longer available from this connected account. Refresh the list and choose again.",
          409,
          "JOURNEY_REVIEW_REQUIRED",
        );
      }
      if (
        connection.selected_calendar_ref &&
        connection.selected_calendar_ref !== calendarRef &&
        req.body?.confirmChange !== true
      ) {
        throw new JourneyActionError(
          "Review and confirm before changing your selected calendar. No calendar was changed.",
          409,
          "JOURNEY_REVIEW_REQUIRED",
        );
      }
      await pool.query(
        `UPDATE kinfolk_journey_connections
            SET selected_calendar_ref=$4, updated_at=NOW()
          WHERE id=$1 AND user_id=$2 AND provider=$3 AND status='connected'`,
        [connection.id, userId, provider, calendarRef],
      );
      res.json({
        provider,
        selectedCalendarRef: calendarRef,
        selectedCalendarLabel: selected.label,
        boundary:
          "Your preference was saved. Kinfolk does not write to this calendar in this source-only release.",
      });
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.post(
  "/kinfolk-journeys/connections/:provider/disconnect",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const provider = assertJourneyProvider(req.params.provider);
      // Local access is removed immediately. Network revocation stays disabled until a provider adapter is expressly activated.
      const status = providerNetworkCallsAllowed()
        ? "revoked"
        : "disconnect_pending";
      await pool.query(
        `UPDATE kinfolk_journey_connections SET status=$3, token_envelope=NULL, revoked_at=NOW(), updated_at=NOW() WHERE user_id=$1 AND provider=$2`,
        [userId, provider, status],
      );
      res.status(202).json({
        provider,
        status,
        message:
          status === "revoked"
            ? "Connection removed."
            : "Local access was removed. Provider revocation will be retried after an adapter is activated.",
      });
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.get("/kinfolk-journeys", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const rows = await pool.query<JourneyRow>(
      `SELECT * FROM kinfolk_journeys WHERE user_id=$1 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 100`,
      [userId],
    );
    res.json({ journeys: rows.rows.map(safeJourney) });
  } catch (error) {
    respondError(res, error);
  }
});

router.post("/kinfolk-journeys", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const input = assertValidJourneyInput(parseJourneyPayload(req.body));
    const id = randomUUID();
    const expires = retentionExpiryFor({
      policy: input.retentionPolicy ?? "keep_until_deleted",
      journeyEndDate: input.endDate,
    });
    const result = await pool.query<JourneyRow>(
      `INSERT INTO kinfolk_journeys (id,user_id,title,status,destination_label,destination_city,destination_region,time_zone,start_date,end_date,preferences,retention_policy,retention_expires_at,member_consented_at)
       VALUES ($1,$2,$3,'draft',$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,NOW()) RETURNING *`,
      [
        id,
        userId,
        input.title,
        input.destinationLabel ?? null,
        input.destinationCity ?? null,
        input.destinationRegion ?? null,
        input.timeZone ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        JSON.stringify(input.preferences ?? {}),
        input.retentionPolicy ?? "keep_until_deleted",
        expires,
      ],
    );
    await appendAudit({
      journeyId: id,
      userId,
      eventType: "journey_created",
      metadata: { source: "member" },
    });
    res.status(201).json({ journey: safeJourney(result.rows[0]!) });
  } catch (error) {
    respondError(res, error);
  }
});

router.get("/kinfolk-journeys/:journeyId", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const journey = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    const [items, imports, reminders, flightWatches] = await Promise.all([
      pool.query<JourneyItemRow>(
        `SELECT * FROM kinfolk_journey_items WHERE journey_id=$1 AND user_id=$2 ORDER BY starts_at NULLS LAST, created_at ASC`,
        [journey.id, userId],
      ),
      pool.query<JourneyImportRow>(
        `SELECT id,journey_id,user_id,source_kind,status,asset_id,parsed_facts,content_digest,created_at,reviewed_at FROM kinfolk_journey_imports WHERE journey_id=$1 AND user_id=$2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [journey.id, userId],
      ),
      pool.query<JourneyReminderRow>(
        `SELECT * FROM kinfolk_journey_reminders WHERE journey_id=$1 AND user_id=$2 AND state <> 'deleted' ORDER BY due_at ASC`,
        [journey.id, userId],
      ),
      pool.query<JourneyFlightWatchRow>(
        `SELECT * FROM kinfolk_journey_flight_watches WHERE journey_id=$1 AND user_id=$2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [journey.id, userId],
      ),
    ]);
    res.json({
      journey: safeJourney(journey),
      items: items.rows.map(safeItem),
      imports: imports.rows.map(safeImport),
      reminders: reminders.rows.map(safeReminder),
      flightWatches: flightWatches.rows.map(safeFlightWatch),
    });
  } catch (error) {
    respondError(res, error);
  }
});

router.patch("/kinfolk-journeys/:journeyId", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const existing = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    const patch = parseJourneyPayload({
      ...existing,
      ...req.body,
      title: req.body?.title ?? existing.title,
    });
    const input = assertValidJourneyInput(patch);
    const nextStatus = req.body?.status
      ? (String(req.body.status) as JourneyStatus)
      : existing.status;
    assertJourneyTransition(existing.status, nextStatus);
    const expires = retentionExpiryFor({
      policy: input.retentionPolicy ?? existing.retention_policy,
      journeyEndDate: input.endDate ?? existing.end_date,
    });
    const result = await pool.query<JourneyRow>(
      `UPDATE kinfolk_journeys SET title=$3,status=$4,destination_label=$5,destination_city=$6,destination_region=$7,time_zone=$8,start_date=$9,end_date=$10,preferences=$11::jsonb,retention_policy=$12,retention_expires_at=$13,archived_at=CASE WHEN $4='archived' THEN NOW() ELSE NULL END,updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`,
      [
        existing.id,
        userId,
        input.title,
        nextStatus,
        input.destinationLabel ?? null,
        input.destinationCity ?? null,
        input.destinationRegion ?? null,
        input.timeZone ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        JSON.stringify(input.preferences ?? {}),
        input.retentionPolicy ?? existing.retention_policy,
        expires,
      ],
    );
    await appendAudit({
      journeyId: existing.id,
      userId,
      eventType: "journey_updated",
      metadata: { status: nextStatus },
    });
    res.json({ journey: safeJourney(result.rows[0]!) });
  } catch (error) {
    respondError(res, error);
  }
});

router.post("/kinfolk-journeys/:journeyId/items", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const journey = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    const input = assertJourneyItemInput(parseItemPayload(req.body));
    const status = input.status ?? "proposed";
    const itemId = randomUUID();
    const payload = {
      publicPreview: input.sensitiveDetails ? "Private details saved" : null,
      encryptedDetails: input.sensitiveDetails
        ? sealJourneyToken(input.sensitiveDetails, {
            purpose: "journey_item",
            memberId: userId,
            journeyId: journey.id,
            itemId,
          })
        : null,
      provenance: { sourceKind: "member_entry", confidence: "high" },
    };
    const result = await pool.query<JourneyItemRow>(
      `INSERT INTO kinfolk_journey_items (id,journey_id,user_id,kind,status,title,starts_at,ends_at,time_zone,location_label,canonical_business_id,source_import_id,member_confirmed_at,payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CASE WHEN $5='confirmed' THEN NOW() ELSE NULL END,$13::jsonb) RETURNING *`,
      [
        itemId,
        journey.id,
        userId,
        input.kind,
        status,
        input.title,
        input.startsAt ?? null,
        input.endsAt ?? null,
        input.timeZone ?? null,
        input.locationLabel ?? null,
        input.canonicalBusinessId ?? null,
        input.sourceImportId ?? null,
        JSON.stringify(payload),
      ],
    );
    await appendAudit({
      journeyId: journey.id,
      userId,
      eventType: "journey_item_created",
      metadata: { kind: input.kind, status },
    });
    res.status(201).json({ item: safeItem(result.rows[0]!) });
  } catch (error) {
    respondError(res, error);
  }
});

router.patch("/kinfolk-journeys/:journeyId/items/:itemId", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const journey = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    const existing = await pool.query<JourneyItemRow>(
      `SELECT * FROM kinfolk_journey_items WHERE id=$1 AND journey_id=$2 AND user_id=$3 LIMIT 1`,
      [String(req.params.itemId), journey.id, userId],
    );
    const item = existing.rows[0];
    if (!item)
      throw new JourneyActionError(
        "Journey item not found.",
        404,
        "JOURNEY_NOT_FOUND",
      );
    assertConfirmedItemMutation({
      existingStatus: item.status,
      actor: "member",
      explicitMemberEdit: req.body?.confirmChange === true,
    });
    const input = assertJourneyItemInput(
      parseItemPayload({
        ...item,
        ...req.body,
        title: req.body?.title ?? item.title,
      }),
    );
    const status = input.status ?? item.status;
    const payload = input.sensitiveDetails
      ? {
          ...item.payload,
          publicPreview: "Private details saved",
          encryptedDetails: sealJourneyToken(input.sensitiveDetails, {
            purpose: "journey_item",
            memberId: userId,
            journeyId: journey.id,
            itemId: item.id,
          }),
          provenance: { sourceKind: "member_entry", confidence: "high" },
        }
      : item.payload;
    const result = await pool.query<JourneyItemRow>(
      `UPDATE kinfolk_journey_items SET kind=$4,status=$5,title=$6,starts_at=$7,ends_at=$8,time_zone=$9,location_label=$10,canonical_business_id=$11,member_confirmed_at=CASE WHEN $5='confirmed' THEN COALESCE(member_confirmed_at,NOW()) ELSE NULL END,payload=$12::jsonb,updated_at=NOW() WHERE id=$1 AND journey_id=$2 AND user_id=$3 RETURNING *`,
      [
        item.id,
        journey.id,
        userId,
        input.kind,
        status,
        input.title,
        input.startsAt ?? null,
        input.endsAt ?? null,
        input.timeZone ?? null,
        input.locationLabel ?? null,
        input.canonicalBusinessId ?? null,
        JSON.stringify(payload),
      ],
    );
    await appendAudit({
      journeyId: journey.id,
      userId,
      eventType: "journey_item_updated",
      metadata: { kind: input.kind, status },
    });
    res.json({ item: safeItem(result.rows[0]!) });
  } catch (error) {
    respondError(res, error);
  }
});

router.delete(
  "/kinfolk-journeys/:journeyId/items/:itemId",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const journey = await requireOwnedJourney(
        userId,
        String(req.params.journeyId),
      );
      const result = await pool.query(
        `DELETE FROM kinfolk_journey_items WHERE id=$1 AND journey_id=$2 AND user_id=$3`,
        [String(req.params.itemId), journey.id, userId],
      );
      if (result.rowCount !== 1)
        throw new JourneyActionError(
          "Journey item not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
      await appendAudit({
        journeyId: journey.id,
        userId,
        eventType: "journey_item_deleted",
      });
      res.status(204).end();
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.post("/kinfolk-journeys/:journeyId/imports/assets", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const journey = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    if (req.body?.consent !== true)
      throw new JourneyActionError(
        "Choose whether to add this private attachment to your Journey before importing it.",
        400,
        "JOURNEY_REVIEW_REQUIRED",
      );
    const assetId =
      typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    if (!/^[A-Za-z0-9-]{8,64}$/.test(assetId))
      throw new JourneyActionError(
        "Invalid private attachment reference.",
        400,
        "JOURNEY_INVALID",
      );
    const sourceKind = req.body?.sourceKind === "image" ? "image" : "document";
    const asset = await pool.query<{ id: string }>(
      `SELECT id FROM media_assets WHERE id=$1 AND uploader_id=$2 AND purpose='kinfolk_journey_private' AND status='ready' AND public_url IS NULL LIMIT 1`,
      [assetId, userId],
    );
    if (!asset.rows[0])
      throw new JourneyActionError(
        "Private attachment not found.",
        404,
        "JOURNEY_NOT_FOUND",
      );
    const digest = sha256(`journey-asset:${assetId}`);
    const inserted = await pool.query<JourneyImportRow>(
      `INSERT INTO kinfolk_journey_imports (id,journey_id,user_id,source_kind,status,asset_id,content_digest,parsed_facts,member_consented_at)
       VALUES ($1,$2,$3,$4,'review_needed',$5,$6,'[]'::jsonb,NOW())
       ON CONFLICT (journey_id,content_digest) DO NOTHING
       RETURNING id,journey_id,user_id,source_kind,status,asset_id,parsed_facts,content_digest,created_at,reviewed_at`,
      [randomUUID(), journey.id, userId, sourceKind, assetId, digest],
    );
    const imported = inserted.rows[0];
    if (!imported) {
      const existing = await pool.query<JourneyImportRow>(
        `SELECT id,journey_id,user_id,source_kind,status,asset_id,parsed_facts,content_digest,created_at,reviewed_at FROM kinfolk_journey_imports WHERE journey_id=$1 AND content_digest=$2`,
        [journey.id, digest],
      );
      res.status(200).json({
        import: safeImport(existing.rows[0]!),
        duplicate: true,
        message: "This private attachment is already linked for review.",
      });
      return;
    }
    await appendAudit({
      journeyId: journey.id,
      userId,
      eventType: "journey_private_attachment_linked",
      metadata: { sourceKind },
    });
    // No raw document/image text is sent to Kinfolk or returned to the client.
    // A dedicated private extraction worker can add reviewed facts later.
    res.status(201).json({
      import: safeImport(imported),
      duplicate: false,
      message:
        "Private attachment linked for your review. No details were inferred from it.",
    });
  } catch (error) {
    respondError(res, error);
  }
});

router.post(
  "/kinfolk-journeys/:journeyId/imports/:importId/extract-private-document",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const journey = await requireOwnedJourney(
        userId,
        String(req.params.journeyId),
      );
      if (req.body?.consent !== true)
        throw new JourneyActionError(
          "Choose whether Kinfolk may review the readable details in this private document for this Journey.",
          400,
          "JOURNEY_REVIEW_REQUIRED",
        );
      const imported = await pool.query<JourneyImportRow>(
        `SELECT id,journey_id,user_id,source_kind,status,asset_id,parsed_facts,content_digest,created_at,reviewed_at
           FROM kinfolk_journey_imports
          WHERE id=$1 AND journey_id=$2 AND user_id=$3 AND deleted_at IS NULL
          LIMIT 1`,
        [String(req.params.importId), journey.id, userId],
      );
      const sourceImport = imported.rows[0];
      if (!sourceImport)
        throw new JourneyActionError(
          "Journey import not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
      if (
        sourceImport.source_kind !== "document" ||
        !sourceImport.asset_id ||
        sourceImport.status === "confirmed"
      )
        throw new JourneyActionError(
          "This private attachment is not available for document review. Add details manually or review a selected PDF, .eml confirmation, or .ics calendar file.",
          409,
          "JOURNEY_REVIEW_REQUIRED",
        );

      const extraction = await extractJourneyPrivateDocument({
        userId,
        assetId: sourceImport.asset_id,
      });
      const updated = await pool.query<JourneyImportRow>(
        `UPDATE kinfolk_journey_imports
            SET status='parsed',
                parsed_facts=$4::jsonb,
                member_consented_at=COALESCE(member_consented_at,NOW())
          WHERE id=$1 AND journey_id=$2 AND user_id=$3
            AND status IN ('review_needed','parsed')
          RETURNING id,journey_id,user_id,source_kind,status,asset_id,parsed_facts,content_digest,created_at,reviewed_at`,
        [sourceImport.id, journey.id, userId, JSON.stringify(extraction.facts)],
      );
      const parsedImport = updated.rows[0];
      if (!parsedImport)
        throw new JourneyActionError(
          "This private attachment changed while it was being reviewed. Refresh and try again.",
          409,
          "JOURNEY_REVIEW_REQUIRED",
        );
      await appendAudit({
        journeyId: journey.id,
        userId,
        eventType: "journey_private_document_reviewed",
        metadata: {
          factCount: extraction.facts.length,
          pageCount: extraction.pageCount,
          importKind: extraction.kind,
          source: extraction.source,
        },
      });
      res.status(200).json({
        import: safeImport(parsedImport),
        parsed: {
          facts: extraction.facts,
          warnings: extraction.warnings,
        },
        message:
          "Private document details are ready for your review. Nothing was added to your Journey until you confirm it.",
      });
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.post("/kinfolk-journeys/:journeyId/imports/text", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const journey = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    if (req.body?.consent !== true)
      throw new JourneyActionError(
        "Choose whether to add this confirmation to your private Journey before importing it.",
        400,
        "JOURNEY_REVIEW_REQUIRED",
      );
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (text.length < 4 || text.length > 20_000)
      throw new JourneyActionError(
        "Paste between 4 and 20,000 characters for review.",
        400,
        "JOURNEY_INVALID",
      );
    const parsed = parseJourneyConfirmationText(text);
    const digest = sha256(text);
    const result = await pool.query<JourneyImportRow>(
      `INSERT INTO kinfolk_journey_imports (id,journey_id,user_id,source_kind,status,content_digest,parsed_facts,member_consented_at)
       VALUES ($1,$2,$3,'confirmation_text','parsed',$4,$5::jsonb,NOW())
       ON CONFLICT (journey_id,content_digest) DO NOTHING RETURNING id,journey_id,user_id,source_kind,status,parsed_facts,content_digest,created_at,reviewed_at`,
      [randomUUID(), journey.id, userId, digest, JSON.stringify(parsed.facts)],
    );
    const imported = result.rows[0];
    if (!imported) {
      const existing = await pool.query<JourneyImportRow>(
        `SELECT id,journey_id,user_id,source_kind,status,asset_id,parsed_facts,content_digest,created_at,reviewed_at FROM kinfolk_journey_imports WHERE journey_id=$1 AND content_digest=$2`,
        [journey.id, digest],
      );
      res.status(200).json({
        import: safeImport(existing.rows[0]!),
        duplicate: true,
        warnings: ["This confirmation was already imported for review."],
      });
      return;
    }
    await appendAudit({
      journeyId: journey.id,
      userId,
      eventType: "journey_confirmation_text_imported",
      metadata: { factCount: parsed.facts.length },
    });
    res
      .status(201)
      .json({ import: safeImport(imported), parsed, duplicate: false });
  } catch (error) {
    respondError(res, error);
  }
});

router.post(
  "/kinfolk-journeys/:journeyId/imports/:importId/confirm",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const journey = await requireOwnedJourney(
        userId,
        String(req.params.journeyId),
      );
      if (req.body?.confirm !== true)
        throw new JourneyActionError(
          "Review the extracted facts and confirm the items you want to add.",
          400,
          "JOURNEY_REVIEW_REQUIRED",
        );
      const imported = await pool.query<JourneyImportRow>(
        `SELECT id,journey_id,user_id,source_kind,status,parsed_facts,content_digest,created_at,reviewed_at FROM kinfolk_journey_imports WHERE id=$1 AND journey_id=$2 AND user_id=$3 AND deleted_at IS NULL LIMIT 1`,
        [String(req.params.importId), journey.id, userId],
      );
      const sourceImport = imported.rows[0];
      if (!sourceImport)
        throw new JourneyActionError(
          "Journey import not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
      const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
      if (!rawItems.length || rawItems.length > 20)
        throw new JourneyActionError(
          "Choose between 1 and 20 reviewed Journey items to save.",
          400,
          "JOURNEY_REVIEW_REQUIRED",
        );
      const items = rawItems.map(parseItemPayload).map(assertJourneyItemInput);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const created: JourneyItemRow[] = [];
        for (const input of items) {
          const status =
            input.status === "confirmed" ? "confirmed" : "tentative";
          const payload = {
            publicPreview: `Added from reviewed ${sourceImport.source_kind.replace(/_/g, " ")}`,
            provenance: {
              sourceKind: sourceImport.source_kind,
              confidence: "medium",
            },
          };
          const inserted = await client.query<JourneyItemRow>(
            `INSERT INTO kinfolk_journey_items (id,journey_id,user_id,kind,status,title,starts_at,ends_at,time_zone,location_label,canonical_business_id,source_import_id,member_confirmed_at,payload)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CASE WHEN $5='confirmed' THEN NOW() ELSE NULL END,$13::jsonb) RETURNING *`,
            [
              randomUUID(),
              journey.id,
              userId,
              input.kind,
              status,
              input.title,
              input.startsAt ?? null,
              input.endsAt ?? null,
              input.timeZone ?? null,
              input.locationLabel ?? null,
              input.canonicalBusinessId ?? null,
              sourceImport.id,
              JSON.stringify(payload),
            ],
          );
          created.push(inserted.rows[0]!);
        }
        // Retain per-field provenance after the member explicitly accepts a parsed
        // import. The source snapshot is intentionally redacted: raw confirmations
        // and document/email content never leave the private import boundary.
        for (const fact of sourceImport.parsed_facts ?? []) {
          await client.query(
            `INSERT INTO kinfolk_journey_sources (id,journey_id,item_id,user_id,field_key,source_kind,source_label,confidence,extraction_status,source_fingerprint,snapshot,member_confirmed_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'confirmed',$9,$10::jsonb,NOW())
           ON CONFLICT (journey_id,field_key,source_fingerprint) DO NOTHING`,
            [
              randomUUID(),
              journey.id,
              created[0]?.id ?? null,
              userId,
              fact.field.slice(0, 80),
              sourceImport.source_kind,
              `Member-approved ${sourceImport.source_kind.replace(/_/g, " ")}`.slice(
                0,
                255,
              ),
              fact.confidence,
              sha256(`${sourceImport.id}:${fact.field}:${fact.value}`),
              JSON.stringify({
                evidencePreview: redactedPreview(fact.value, 160),
                observedAt: new Date().toISOString(),
              }),
            ],
          );
        }
        await client.query(
          `UPDATE kinfolk_journey_imports SET status='confirmed',reviewed_at=NOW() WHERE id=$1 AND journey_id=$2 AND user_id=$3`,
          [sourceImport.id, journey.id, userId],
        );
        await client.query(
          `UPDATE kinfolk_journeys SET status=CASE WHEN status='draft' THEN 'confirmed' ELSE status END,updated_at=NOW() WHERE id=$1 AND user_id=$2`,
          [journey.id, userId],
        );
        await client.query(
          `INSERT INTO kinfolk_journey_audit (id,journey_id,user_id,event_type,metadata) VALUES ($1,$2,$3,'journey_import_confirmed',$4::jsonb)`,
          [
            randomUUID(),
            journey.id,
            userId,
            JSON.stringify({
              items: created.length,
              source: sourceImport.source_kind,
            }),
          ],
        );
        await client.query("COMMIT");
        res.status(201).json({
          items: created.map(safeItem),
          import: {
            ...safeImport(sourceImport),
            status: "confirmed",
            reviewedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.post("/kinfolk-journeys/:journeyId/reminders", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const journey = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    if (req.body?.consent !== true)
      throw new JourneyActionError(
        "Choose whether to enable this private Journey reminder.",
        400,
        "JOURNEY_REVIEW_REQUIRED",
      );
    const dueAt = new Date(
      typeof req.body?.dueAt === "string" ? req.body.dueAt : "",
    );
    if (Number.isNaN(dueAt.getTime()))
      throw new JourneyActionError(
        "Choose a valid reminder date and time.",
        400,
        "JOURNEY_INVALID",
      );
    const channel =
      req.body?.channel === "push" || req.body?.channel === "email"
        ? req.body.channel
        : "in_app";
    const itemId = normalizeJourneyText(req.body?.itemId, 36);
    if (itemId) {
      const item = await pool.query<{ id: string }>(
        `SELECT id FROM kinfolk_journey_items WHERE id=$1 AND journey_id=$2 AND user_id=$3 LIMIT 1`,
        [itemId, journey.id, userId],
      );
      if (!item.rows[0])
        throw new JourneyActionError(
          "The selected Journey item was not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
    }
    // Delivery is intentionally not automatic in this source-only release. A
    // future worker needs a separate, current push/email permission before send.
    const result = await pool.query<JourneyReminderRow>(
      `INSERT INTO kinfolk_journey_reminders (id,journey_id,user_id,item_id,channel,state,due_at)
       VALUES ($1,$2,$3,$4,$5,'enabled',$6) RETURNING *`,
      [randomUUID(), journey.id, userId, itemId ?? null, channel, dueAt],
    );
    await appendAudit({
      journeyId: journey.id,
      userId,
      eventType: "journey_reminder_created",
      metadata: { channel },
    });
    res.status(201).json({
      reminder: safeReminder(result.rows[0]!),
      delivery: "not_scheduled",
    });
  } catch (error) {
    respondError(res, error);
  }
});

router.patch(
  "/kinfolk-journeys/:journeyId/reminders/:reminderId",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const journey = await requireOwnedJourney(
        userId,
        String(req.params.journeyId),
      );
      const state =
        req.body?.state === "paused" || req.body?.state === "enabled"
          ? req.body.state
          : null;
      if (!state)
        throw new JourneyActionError(
          "Choose whether this reminder is enabled or paused.",
          400,
          "JOURNEY_INVALID",
        );
      const result = await pool.query<JourneyReminderRow>(
        `UPDATE kinfolk_journey_reminders SET state=$4,updated_at=NOW() WHERE id=$1 AND journey_id=$2 AND user_id=$3 AND state <> 'deleted' RETURNING *`,
        [String(req.params.reminderId), journey.id, userId, state],
      );
      if (!result.rows[0])
        throw new JourneyActionError(
          "Journey reminder not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
      await appendAudit({
        journeyId: journey.id,
        userId,
        eventType: "journey_reminder_updated",
        metadata: { state },
      });
      res.json({
        reminder: safeReminder(result.rows[0]!),
        delivery: "not_scheduled",
      });
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.delete(
  "/kinfolk-journeys/:journeyId/reminders/:reminderId",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const journey = await requireOwnedJourney(
        userId,
        String(req.params.journeyId),
      );
      const result = await pool.query(
        `UPDATE kinfolk_journey_reminders SET state='deleted',updated_at=NOW() WHERE id=$1 AND journey_id=$2 AND user_id=$3 AND state <> 'deleted'`,
        [String(req.params.reminderId), journey.id, userId],
      );
      if (result.rowCount !== 1)
        throw new JourneyActionError(
          "Journey reminder not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
      await appendAudit({
        journeyId: journey.id,
        userId,
        eventType: "journey_reminder_deleted",
      });
      res.status(204).end();
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.post("/kinfolk-journeys/:journeyId/flight-watches", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const journey = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    const input = parseFlightWatchInput(req.body);
    if (input.itemId) {
      const item = await pool.query<{ id: string }>(
        `SELECT id FROM kinfolk_journey_items WHERE id=$1 AND journey_id=$2 AND user_id=$3 AND kind='flight' LIMIT 1`,
        [input.itemId, journey.id, userId],
      );
      if (!item.rows[0])
        throw new JourneyActionError(
          "The selected flight item was not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
    }
    const readiness = getFlightMonitorReadiness();
    const result = await pool.query<JourneyFlightWatchRow>(
      `INSERT INTO kinfolk_journey_flight_watches
         (id,journey_id,user_id,item_id,operating_carrier,flight_number,scheduled_departure_date,origin_iata,destination_iata,notification_channel,state,provider_key,last_status,consented_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_provider',$11,$12::jsonb,NOW())
       ON CONFLICT (user_id,journey_id,operating_carrier,flight_number,scheduled_departure_date,origin_iata,destination_iata) WHERE deleted_at IS NULL
       DO UPDATE SET item_id=EXCLUDED.item_id,notification_channel=EXCLUDED.notification_channel,consented_at=NOW(),updated_at=NOW()
       RETURNING *`,
      [
        randomUUID(),
        journey.id,
        userId,
        input.itemId ?? null,
        input.operatingCarrier,
        input.flightNumber,
        input.scheduledDepartureDate,
        input.originIata,
        input.destinationIata,
        input.notificationChannel,
        readiness.provider,
        JSON.stringify(unknownFlightStatus()),
      ],
    );
    await appendAudit({
      journeyId: journey.id,
      userId,
      eventType: "journey_flight_watch_consent_recorded",
      metadata: {
        channel: input.notificationChannel,
        providerConfigured: readiness.status === "available",
      },
    });
    res.status(201).json({
      watch: safeFlightWatch(result.rows[0]!),
      readiness,
      boundary:
        "This is an advisory-only pending watch. Kinfolk has not queried a provider, accessed an airline account, or sent a notification. Confirm any disruption with the airline or booking channel.",
    });
  } catch (error) {
    respondError(res, error);
  }
});

router.patch(
  "/kinfolk-journeys/:journeyId/flight-watches/:watchId",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const journey = await requireOwnedJourney(
        userId,
        String(req.params.journeyId),
      );
      const action = req.body?.action;
      if (action !== "pause" && action !== "resume" && action !== "revoke")
        throw new JourneyActionError(
          "Choose pause, resume, or revoke for this flight watch.",
          400,
          "JOURNEY_INVALID",
        );
      const nextState =
        action === "pause"
          ? "paused"
          : action === "revoke"
            ? "revoked"
            : "pending_provider";
      const result = await pool.query<JourneyFlightWatchRow>(
        `UPDATE kinfolk_journey_flight_watches
            SET state=$4,
                paused_at=CASE WHEN $4='paused' THEN NOW() ELSE NULL END,
                revoked_at=CASE WHEN $4='revoked' THEN NOW() ELSE NULL END,
                updated_at=NOW()
          WHERE id=$1 AND journey_id=$2 AND user_id=$3 AND deleted_at IS NULL
          RETURNING *`,
        [String(req.params.watchId), journey.id, userId, nextState],
      );
      if (!result.rows[0])
        throw new JourneyActionError(
          "Flight watch not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
      await appendAudit({
        journeyId: journey.id,
        userId,
        eventType: `journey_flight_watch_${action}`,
      });
      res.json({
        watch: safeFlightWatch(result.rows[0]),
        readiness: getFlightMonitorReadiness(),
      });
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.delete(
  "/kinfolk-journeys/:journeyId/flight-watches/:watchId",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const journey = await requireOwnedJourney(
        userId,
        String(req.params.journeyId),
      );
      const result = await pool.query(
        `UPDATE kinfolk_journey_flight_watches
            SET state='deleted',deleted_at=NOW(),revoked_at=NOW(),updated_at=NOW()
          WHERE id=$1 AND journey_id=$2 AND user_id=$3 AND deleted_at IS NULL`,
        [String(req.params.watchId), journey.id, userId],
      );
      if (result.rowCount !== 1)
        throw new JourneyActionError(
          "Flight watch not found.",
          404,
          "JOURNEY_NOT_FOUND",
        );
      await appendAudit({
        journeyId: journey.id,
        userId,
        eventType: "journey_flight_watch_deleted",
      });
      res.status(204).end();
    } catch (error) {
      respondError(res, error);
    }
  },
);

router.delete("/kinfolk-journeys/:journeyId", async (req, res) => {
  const userId = requireMember(req, res);
  if (!userId) return;
  try {
    assertJourneyFeatureEnabled();
    const journey = await requireOwnedJourney(
      userId,
      String(req.params.journeyId),
    );
    const plan = getJourneyDeletionPlan("member_delete");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE kinfolk_journey_imports SET status='deleted',parsed_facts='[]'::jsonb,deleted_at=NOW() WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, userId],
      );
      await client.query(
        `UPDATE kinfolk_journey_items SET payload='{}'::jsonb, status='cancelled',updated_at=NOW() WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, userId],
      );
      await client.query(
        `UPDATE kinfolk_journey_collaborators SET status='revoked',updated_at=NOW() WHERE journey_id=$1 AND owner_user_id=$2`,
        [journey.id, userId],
      );
      await client.query(
        `UPDATE kinfolk_journey_reminders SET state='deleted',updated_at=NOW() WHERE journey_id=$1 AND user_id=$2`,
        [journey.id, userId],
      );
      await client.query(
        `UPDATE kinfolk_journey_flight_watches SET state='deleted',deleted_at=NOW(),revoked_at=NOW(),updated_at=NOW() WHERE journey_id=$1 AND user_id=$2 AND deleted_at IS NULL`,
        [journey.id, userId],
      );
      await client.query(
        `UPDATE kinfolk_journeys SET status='deleted',deleted_at=NOW(),updated_at=NOW() WHERE id=$1 AND user_id=$2`,
        [journey.id, userId],
      );
      await client.query(
        `INSERT INTO kinfolk_journey_audit (id,journey_id,user_id,event_type,metadata) VALUES ($1,$2,$3,$4,$5::jsonb)`,
        [
          randomUUID(),
          journey.id,
          userId,
          plan.auditEvent,
          JSON.stringify({ localAccessRemoved: true }),
        ],
      );
      await client.query("COMMIT");
      res.status(202).json({
        ok: true,
        status: "deleted",
        message:
          "Your Journey and its private details were deleted. Existing account connections remain available to your other Journeys until you choose Disconnect.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    respondError(res, error);
  }
});

router.post(
  "/kinfolk-journeys/:journeyId/drafts/from-kinfolk",
  async (req, res) => {
    const userId = requireMember(req, res);
    if (!userId) return;
    try {
      assertJourneyFeatureEnabled();
      const journey = await requireOwnedJourney(
        userId,
        String(req.params.journeyId),
      );
      if (req.body?.confirm !== true)
        throw new JourneyActionError(
          "Choose Create Journey before saving Kinfolk suggestions.",
          400,
          "JOURNEY_REVIEW_REQUIRED",
        );
      const sessionId = normalizeJourneyText(req.body?.sessionId, 36);
      const activities = Array.isArray(req.body?.activities)
        ? req.body.activities.slice(0, 24)
        : [];
      if (!sessionId || !activities.length)
        throw new JourneyActionError(
          "A Kinfolk session and at least one reviewed suggestion are required.",
          400,
          "JOURNEY_INVALID",
        );
      // Each member-chosen activity becomes a proposal. No free-form business claim, reservation, or calendar booking is created here.
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const items: JourneyItemRow[] = [];
        for (const activity of activities) {
          const row =
            activity && typeof activity === "object"
              ? (activity as Record<string, unknown>)
              : {};
          const title = normalizeJourneyText(row.title, 255);
          if (!title) continue;
          const canonicalVenue = normalizeJourneyText(row.canonicalVenue, 255);
          const inserted = await client.query<JourneyItemRow>(
            `INSERT INTO kinfolk_journey_items (id,journey_id,user_id,kind,status,title,payload) VALUES ($1,$2,$3,'place','proposed',$4,$5::jsonb) RETURNING *`,
            [
              randomUUID(),
              journey.id,
              userId,
              title,
              JSON.stringify({
                publicPreview: canonicalVenue
                  ? `Kinfolk suggestion: ${redactedPreview(canonicalVenue, 120)}`
                  : "Kinfolk suggestion",
                provenance: {
                  sourceKind: "kinfolk_governed",
                  confidence: "medium",
                },
              }),
            ],
          );
          items.push(inserted.rows[0]!);
        }
        await client.query(
          `UPDATE kinfolk_journeys SET origin_kinfolk_session_id=$3,status=CASE WHEN status='draft' THEN 'review_needed' ELSE status END,updated_at=NOW() WHERE id=$1 AND user_id=$2`,
          [journey.id, userId, sessionId],
        );
        await client.query(
          `INSERT INTO kinfolk_journey_audit (id,journey_id,user_id,event_type,metadata) VALUES ($1,$2,$3,'kinfolk_suggestions_saved',$4::jsonb)`,
          [
            randomUUID(),
            journey.id,
            userId,
            JSON.stringify({ proposalCount: items.length }),
          ],
        );
        await client.query("COMMIT");
        res
          .status(201)
          .json({ items: items.map(safeItem), reviewRequired: true });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      respondError(res, error);
    }
  },
);

export default router;
