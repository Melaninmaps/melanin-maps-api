import { authenticatedFetch } from "@/lib/authenticatedFetch";

export type ConnectedAppCategory = "travel" | "health" | "finance" | "everyday";
export type ConnectedAppAvailability =
  | "not_configured"
  | "native_permission_required"
  | "member_selected_import"
  | "provider_contract_required"
  | "unsupported";

export type ConnectedApp = {
  key: string;
  category: ConnectedAppCategory;
  label: string;
  authorizationMode: string;
  availability: ConnectedAppAvailability;
  dataTypes: string[];
  description: string;
  boundary: string;
  sensitive: boolean;
  permission: {
    status: "requested" | "authorized" | "revoked" | "deleted" | "unavailable";
    purpose: string;
    dataTypes: string[];
    scopes: string[];
    grantedAt: string | null;
    revokedAt: string | null;
    expiresAt: string | null;
    updatedAt: string;
  } | null;
};

type ConnectedAppsPayload = { apps: ConnectedApp[]; boundary: string };

async function parse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    message?: string;
  };
  if (!response.ok)
    throw new Error(
      payload.error ??
        payload.message ??
        "Connected Apps is unavailable right now.",
    );
  return payload;
}

export async function listConnectedApps(): Promise<ConnectedAppsPayload> {
  return parse<ConnectedAppsPayload>(
    await authenticatedFetch("/api/kinfolk-connected-apps", {
      cache: "no-store",
    }),
  );
}

export async function recordConnectedAppConsent(input: {
  appKey: string;
  purpose: string;
  dataTypes: string[];
  sensitiveDataAcknowledged?: boolean;
}): Promise<{
  app: ConnectedApp;
  nextStep: ConnectedAppAvailability;
  boundary: string;
}> {
  return parse(
    await authenticatedFetch(
      `/api/kinfolk-connected-apps/${encodeURIComponent(input.appKey)}/permissions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          explicitConsent: true,
          purpose: input.purpose,
          dataTypes: input.dataTypes,
          scopes: input.dataTypes,
          sensitiveDataAcknowledged: input.sensitiveDataAcknowledged === true,
        }),
      },
    ),
  );
}

export async function revokeConnectedApp(appKey: string): Promise<void> {
  await parse(
    await authenticatedFetch(
      `/api/kinfolk-connected-apps/${encodeURIComponent(appKey)}/revoke`,
      { method: "POST" },
    ),
  );
}

export async function deleteConnectedAppPermission(
  appKey: string,
): Promise<void> {
  await parse(
    await authenticatedFetch(
      `/api/kinfolk-connected-apps/${encodeURIComponent(appKey)}`,
      { method: "DELETE" },
    ),
  );
}
