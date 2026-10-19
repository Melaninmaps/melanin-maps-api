import { createHash, randomBytes, randomUUID } from "node:crypto";
import { JourneyActionError, type JourneyProvider } from "./domain";
import { journeyTokenVaultReadiness } from "./token-vault";

export type JourneyProviderAccessMode =
  | "free_busy"
  | "selected_items"
  | "calendar_selection"
  | "manual";
export type JourneyProviderReadiness = Readonly<{
  provider: JourneyProvider;
  status: "disabled" | "not_configured" | "available";
  accessModes: readonly JourneyProviderAccessMode[];
  scopes: readonly string[];
  blockers: readonly string[];
}>;

export type JourneyAuthorizationTransaction = Readonly<{
  id: string;
  provider: JourneyProvider;
  memberId: string;
  state: string;
  stateHash: string;
  nonceHash: string;
  codeVerifier: string;
  requestedAccessMode: JourneyProviderAccessMode;
  scopes: readonly string[];
  expiresAt: Date;
}>;

export type JourneyProviderTokenSet = Readonly<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | null;
  scope: string[];
}>;

/** Raw provider values remain only in the encrypted token envelope. */
export type JourneyProviderAccount = Readonly<{ providerAccountId: string }>;
export type JourneyProviderCalendar = Readonly<{
  providerCalendarId: string;
  label: string;
}>;

type ProviderConfiguration = Readonly<{
  clientIdEnv?: string;
  clientSecretEnv?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  identityEndpoint?: string;
  calendarsEndpoint?: string;
  scopesByAccessMode: Readonly<
    Partial<Record<JourneyProviderAccessMode, readonly string[]>>
  >;
  accessModes: readonly JourneyProviderAccessMode[];
}>;

const PROVIDER_CONFIGURATION: Readonly<
  Record<JourneyProvider, ProviderConfiguration>
> = {
  google_calendar: {
    clientIdEnv: "GOOGLE_JOURNEYS_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_JOURNEYS_OAUTH_CLIENT_SECRET",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    identityEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
    calendarsEndpoint:
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    scopesByAccessMode: {
      free_busy: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/calendar.events.freebusy",
      ],
      calendar_selection: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
      ],
    },
    accessModes: ["free_busy", "calendar_selection"],
  },
  microsoft_calendar: {
    clientIdEnv: "MICROSOFT_JOURNEYS_OAUTH_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_JOURNEYS_OAUTH_CLIENT_SECRET",
    authorizationEndpoint:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    identityEndpoint: "https://graph.microsoft.com/v1.0/me?$select=id",
    calendarsEndpoint:
      "https://graph.microsoft.com/v1.0/me/calendars?$select=id,name&$top=50",
    scopesByAccessMode: {
      free_busy: [
        "openid",
        "email",
        "offline_access",
        "User.Read",
        "Calendars.ReadBasic",
      ],
      calendar_selection: [
        "openid",
        "email",
        "offline_access",
        "User.Read",
        "Calendars.ReadBasic",
      ],
    },
    accessModes: ["free_busy", "calendar_selection"],
  },
  gmail: {
    scopesByAccessMode: {},
    accessModes: ["manual"],
  },
  outlook_mail: {
    scopesByAccessMode: {},
    accessModes: ["manual"],
  },
  // Direct device-calendar access is native-only and does not send the device's
  // calendar credentials through the browser/OAuth path.
  device_calendar: {
    scopesByAccessMode: {},
    accessModes: ["manual", "selected_items"],
  },
  flight_status: { scopesByAccessMode: {}, accessModes: ["manual"] },
};

function configuredScopes(
  config: ProviderConfiguration,
  accessMode?: JourneyProviderAccessMode,
): readonly string[] {
  if (accessMode) return config.scopesByAccessMode[accessMode] ?? [];
  return [
    ...new Set(
      Object.values(config.scopesByAccessMode).flatMap(
        (scopes) => scopes ?? [],
      ),
    ),
  ];
}

function configured(envName: string | undefined): boolean {
  return Boolean(envName && process.env[envName]?.trim());
}

function redirectBase(): string | null {
  const raw = process.env.KINFOLK_JOURNEYS_OAUTH_REDIRECT_BASE?.trim().replace(
    /\/$/,
    "",
  );
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export function getJourneyProviderReadiness(
  provider: JourneyProvider,
): JourneyProviderReadiness {
  const config = PROVIDER_CONFIGURATION[provider];
  if (provider === "device_calendar") {
    return {
      provider,
      status: "available",
      accessModes: config.accessModes,
      scopes: [],
      blockers: ["Available from the native app; browser OAuth is not used."],
    };
  }
  if (provider === "flight_status") {
    return {
      provider,
      status: "disabled",
      accessModes: ["manual"],
      scopes: [],
      blockers: [
        "Live flight monitoring needs an approved flight-status provider. Airline account access, scraping, and booking retrieval are not used.",
      ],
    };
  }
  if (provider === "gmail" || provider === "outlook_mail") {
    return {
      provider,
      status: "disabled",
      accessModes: ["manual"],
      scopes: [],
      blockers: [
        "Selected confirmation import uses a member-provided .eml, PDF, calendar file, or paste. Standard mailbox OAuth scopes are broader than a selected message and are not enabled here.",
      ],
    };
  }
  const hasClient = configured(config.clientIdEnv);
  const hasSecret = configured(config.clientSecretEnv);
  const redirect = redirectBase();
  const vault = journeyTokenVaultReadiness();
  const blockers = [
    ...(hasClient ? [] : ["Provider client ID is not configured."]),
    ...(hasSecret ? [] : ["Provider client secret is not configured."]),
    ...(redirect
      ? []
      : ["Journey OAuth redirect base must be a valid HTTPS URL."]),
    ...(vault.tokenEncryptionConfigured
      ? []
      : ["Journey encrypted token storage is not configured."]),
    ...(vault.referenceHmacConfigured
      ? []
      : ["Journey opaque-reference storage is not configured."]),
  ];
  return {
    provider,
    status: blockers.length ? "not_configured" : "available",
    accessModes: config.accessModes,
    scopes: configuredScopes(config),
    blockers,
  };
}

export function listJourneyProviderReadiness(): JourneyProviderReadiness[] {
  return Object.keys(PROVIDER_CONFIGURATION).map((provider) =>
    getJourneyProviderReadiness(provider as JourneyProvider),
  );
}

export function startJourneyAuthorization(input: {
  provider: JourneyProvider;
  memberId: string;
  requestedAccessMode: JourneyProviderAccessMode;
}): { transaction: JourneyAuthorizationTransaction; authorizationUrl: string } {
  const readiness = getJourneyProviderReadiness(input.provider);
  if (readiness.status !== "available")
    throw new JourneyActionError(
      "This Journey connection is not configured yet.",
      503,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  if (!readiness.accessModes.includes(input.requestedAccessMode))
    throw new JourneyActionError(
      "That connection level is not available for this provider.",
      400,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  const config = PROVIDER_CONFIGURATION[input.provider];
  if (!config.authorizationEndpoint || !config.clientIdEnv || !redirectBase())
    throw new JourneyActionError(
      "This connection is completed on a member device, not through browser OAuth.",
      400,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  const scopes = configuredScopes(config, input.requestedAccessMode);
  if (!scopes.length)
    throw new JourneyActionError(
      "That connection level is not available for this provider.",
      400,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const codeVerifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const callback = `${redirectBase()}/api/kinfolk-journeys/connections/${input.provider}/callback`;
  const url = new URL(config.authorizationEndpoint);
  url.searchParams.set("client_id", process.env[config.clientIdEnv]!);
  url.searchParams.set("redirect_uri", callback);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "consent");
  return {
    transaction: {
      id: randomUUID(),
      provider: input.provider,
      memberId: input.memberId,
      state,
      stateHash: createHash("sha256").update(state).digest("hex"),
      nonceHash: createHash("sha256").update(nonce).digest("hex"),
      codeVerifier,
      requestedAccessMode: input.requestedAccessMode,
      scopes,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    authorizationUrl: url.toString(),
  };
}

export function assertJourneyAuthorizationCallback(input: {
  storedStateHash: string;
  callbackState: string | undefined;
  expiresAt: Date;
}): void {
  const callbackHash = input.callbackState
    ? createHash("sha256").update(input.callbackState).digest("hex")
    : "";
  if (
    !input.callbackState ||
    callbackHash !== input.storedStateHash ||
    input.expiresAt.getTime() <= Date.now()
  ) {
    throw new JourneyActionError(
      "This connection request has expired or could not be verified. Please try again.",
      400,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
}

/** Explicitly opt in before any live provider request; OAuth credentials alone never activate network sync. */
export function providerNetworkCallsAllowed(): boolean {
  return process.env.KINFOLK_JOURNEYS_PROVIDER_NETWORK_ENABLED === "true";
}

function requireProviderNetwork(
  provider: JourneyProvider,
  endpoint: string | undefined,
): string {
  if (
    !providerNetworkCallsAllowed() ||
    getJourneyProviderReadiness(provider).status !== "available" ||
    !endpoint
  ) {
    throw new JourneyActionError(
      "This provider connection is not activated in this environment.",
      503,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  return endpoint;
}

async function providerJson(
  provider: JourneyProvider,
  endpoint: string | undefined,
  accessToken: string,
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(requireProviderNetwork(provider, endpoint), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  } catch (error) {
    if (error instanceof JourneyActionError) throw error;
    throw new JourneyActionError(
      "The provider could not be reached. No Journey details were changed.",
      502,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  const payload = (await response.json().catch(() => null)) as unknown;
  if (
    !response.ok ||
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new JourneyActionError(
      "The provider could not verify this connection. No Journey details were changed.",
      502,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  return payload as Record<string, unknown>;
}

/**
 * Establishes a provider-issued account identifier before a connection becomes
 * active. Its raw value is encrypted immediately by the caller; it is never
 * returned to a browser, stored in a normal column, or written to audit data.
 */
export async function resolveJourneyProviderAccount(input: {
  provider: JourneyProvider;
  accessToken: string;
}): Promise<JourneyProviderAccount> {
  const payload = await providerJson(
    input.provider,
    PROVIDER_CONFIGURATION[input.provider].identityEndpoint,
    input.accessToken,
  );
  const providerAccountId =
    input.provider === "google_calendar"
      ? payload.sub
      : input.provider === "microsoft_calendar"
        ? payload.id
        : null;
  if (typeof providerAccountId !== "string" || !providerAccountId.trim()) {
    throw new JourneyActionError(
      "The provider did not return a usable account identity. No Journey details were changed.",
      502,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  return { providerAccountId: providerAccountId.trim() };
}

/**
 * Lists only calendars exposed by a member-approved calendar-details grant.
 * Raw provider IDs are held only long enough to derive owner-scoped opaque
 * references in the route layer.
 */
export async function listJourneyProviderCalendars(input: {
  provider: JourneyProvider;
  accessToken: string;
}): Promise<readonly JourneyProviderCalendar[]> {
  const payload = await providerJson(
    input.provider,
    PROVIDER_CONFIGURATION[input.provider].calendarsEndpoint,
    input.accessToken,
  );
  const records =
    input.provider === "google_calendar"
      ? payload.items
      : input.provider === "microsoft_calendar"
        ? payload.value
        : null;
  if (!Array.isArray(records)) {
    throw new JourneyActionError(
      "The provider did not return a calendar list. No calendar was selected.",
      502,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  return records.flatMap((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record))
      return [];
    const raw = record as Record<string, unknown>;
    const providerCalendarId = typeof raw.id === "string" ? raw.id.trim() : "";
    if (!providerCalendarId) return [];
    const candidateLabel =
      typeof raw.summary === "string"
        ? raw.summary
        : typeof raw.name === "string"
          ? raw.name
          : `Calendar ${index + 1}`;
    const label = candidateLabel.replace(/\s+/g, " ").trim().slice(0, 160);
    return [{ providerCalendarId, label: label || `Calendar ${index + 1}` }];
  });
}

export async function exchangeJourneyAuthorizationCode(input: {
  provider: JourneyProvider;
  code: string;
  codeVerifier: string;
}): Promise<JourneyProviderTokenSet> {
  const readiness = getJourneyProviderReadiness(input.provider);
  const config = PROVIDER_CONFIGURATION[input.provider];
  if (
    !providerNetworkCallsAllowed() ||
    readiness.status !== "available" ||
    !config.tokenEndpoint ||
    !config.clientIdEnv ||
    !config.clientSecretEnv
  ) {
    throw new JourneyActionError(
      "This provider connection is not activated in this environment.",
      503,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  const callback = `${redirectBase()}/api/kinfolk-journeys/connections/${input.provider}/callback`;
  const form = new URLSearchParams({
    client_id: process.env[config.clientIdEnv]!,
    client_secret: process.env[config.clientSecretEnv]!,
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: callback,
    grant_type: "authorization_code",
  });
  let response: Response;
  try {
    response = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form,
    });
  } catch {
    throw new JourneyActionError(
      "The provider could not be reached. No Journey details were changed.",
      502,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  const payload = (await response.json().catch(() => null)) as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    scope?: unknown;
  } | null;
  if (
    !response.ok ||
    !payload ||
    typeof payload.access_token !== "string" ||
    !payload.access_token
  ) {
    throw new JourneyActionError(
      "The provider did not complete the connection. Please try again.",
      502,
      "JOURNEY_PROVIDER_UNAVAILABLE",
    );
  }
  const expirySeconds =
    typeof payload.expires_in === "number" &&
    Number.isFinite(payload.expires_in)
      ? payload.expires_in
      : null;
  return {
    accessToken: payload.access_token,
    refreshToken:
      typeof payload.refresh_token === "string" && payload.refresh_token
        ? payload.refresh_token
        : undefined,
    expiresAt: expirySeconds
      ? new Date(Date.now() + expirySeconds * 1000)
      : null,
    scope:
      typeof payload.scope === "string"
        ? payload.scope.split(/\s+/).filter(Boolean)
        : [...configuredScopes(config)],
  };
}
