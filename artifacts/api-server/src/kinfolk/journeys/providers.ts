import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  JourneyActionError,
  journeyFeatureEnabled,
  type JourneyProvider,
} from "./domain";

export type JourneyProviderAccessMode =
  | "free_busy"
  | "selected_items"
  | "calendar_details"
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

type ProviderConfiguration = Readonly<{
  clientIdEnv?: string;
  clientSecretEnv?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
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
    scopesByAccessMode: {
      free_busy: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/calendar.events.freebusy",
      ],
      calendar_details: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/calendar.events.readonly",
      ],
    },
    accessModes: ["free_busy", "calendar_details"],
  },
  microsoft_calendar: {
    clientIdEnv: "MICROSOFT_JOURNEYS_OAUTH_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_JOURNEYS_OAUTH_CLIENT_SECRET",
    authorizationEndpoint:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopesByAccessMode: {
      free_busy: ["openid", "email", "offline_access", "Calendars.ReadBasic"],
      calendar_details: ["openid", "email", "offline_access", "Calendars.Read"],
    },
    accessModes: ["free_busy", "calendar_details"],
  },
  gmail: {
    clientIdEnv: "GOOGLE_JOURNEYS_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_JOURNEYS_OAUTH_CLIENT_SECRET",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scopesByAccessMode: {
      selected_items: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
    },
    accessModes: ["selected_items"],
  },
  outlook_mail: {
    clientIdEnv: "MICROSOFT_JOURNEYS_OAUTH_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_JOURNEYS_OAUTH_CLIENT_SECRET",
    authorizationEndpoint:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopesByAccessMode: {
      selected_items: ["openid", "email", "offline_access", "Mail.ReadBasic"],
    },
    accessModes: ["selected_items"],
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
        "Live flight monitoring is not configured. Add a flight manually or import a confirmation for review.",
      ],
    };
  }
  const hasClient = configured(config.clientIdEnv);
  const hasSecret = configured(config.clientSecretEnv);
  const redirect = redirectBase();
  const blockers = [
    ...(hasClient ? [] : ["Provider client ID is not configured."]),
    ...(hasSecret ? [] : ["Provider client secret is not configured."]),
    ...(redirect
      ? []
      : ["Journey OAuth redirect base must be a valid HTTPS URL."]),
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
  if (!journeyFeatureEnabled()) {
    throw new JourneyActionError(
      "Kinfolk Journeys is not enabled for this environment yet.",
      503,
      "JOURNEYS_DISABLED",
    );
  }
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
  return journeyFeatureEnabled() && process.env.KINFOLK_JOURNEYS_PROVIDER_NETWORK_ENABLED === "true";
}

export async function exchangeJourneyAuthorizationCode(input: {
  provider: JourneyProvider;
  code: string;
  codeVerifier: string;
}): Promise<JourneyProviderTokenSet> {
  if (!journeyFeatureEnabled()) {
    throw new JourneyActionError(
      "Kinfolk Journeys is not enabled for this environment yet.",
      503,
      "JOURNEYS_DISABLED",
    );
  }
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
