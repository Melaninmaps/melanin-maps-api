import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

export type JourneyStatus =
  | "draft"
  | "review_needed"
  | "confirmed"
  | "active"
  | "completed"
  | "archived"
  | "deleted";
export type JourneyItemKind =
  | "flight"
  | "lodging"
  | "transport"
  | "reservation"
  | "event"
  | "place"
  | "note"
  | "reminder";
export type JourneyItemStatus =
  | "proposed"
  | "tentative"
  | "confirmed"
  | "cancelled"
  | "skipped";

export type Journey = {
  id: string;
  title: string;
  status: JourneyStatus;
  destinationLabel: string | null;
  destinationCity: string | null;
  destinationRegion: string | null;
  timeZone: string | null;
  startDate: string | null;
  endDate: string | null;
  preferences: Record<string, unknown>;
  retentionPolicy:
    | "delete_after_trip"
    | "keep_until_deleted"
    | "keep_until_member_changes_it";
  retentionExpiresAt: string | null;
  memberConsentedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  visibility: "private";
};

export type JourneyItem = {
  id: string;
  journeyId: string;
  kind: JourneyItemKind;
  status: JourneyItemStatus;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  timeZone: string | null;
  locationLabel: string | null;
  canonicalBusinessId: string | null;
  sourceImportId: string | null;
  memberConfirmedAt: string | null;
  publicPreview: string | null;
  provenance: { sourceKind?: string; confidence?: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type JourneyImport = {
  id: string;
  journeyId: string;
  sourceKind:
    | "confirmation_text"
    | "document"
    | "image"
    | "email"
    | "calendar"
    | "provider";
  status:
    | "review_needed"
    | "parsed"
    | "confirmed"
    | "conflict"
    | "unavailable"
    | "deleted";
  hasPrivateAttachment?: boolean;
  parsedFacts: Array<{
    field: string;
    value: string;
    confidence: "high" | "medium" | "low";
    reason: string;
  }>;
  createdAt: string;
  reviewedAt: string | null;
};

export type JourneyReminder = {
  id: string;
  journeyId: string;
  itemId: string | null;
  channel: "in_app" | "push" | "email";
  state: "enabled" | "paused" | "sent" | "deleted";
  dueAt: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JourneyFlightWatch = {
  id: string;
  journeyId: string;
  itemId: string | null;
  operatingCarrier: string;
  flightNumber: string;
  scheduledDepartureDate: string;
  originIata: string;
  destinationIata: string;
  notificationChannel: "in_app" | "push" | "email";
  state:
    | "pending_provider"
    | "active"
    | "paused"
    | "completed"
    | "revoked"
    | "deleted";
  provider: string | null;
  status: {
    state: "unknown" | "on_time" | "delayed" | "cancelled" | "diverted";
    sourceObservedAt: string | null;
    freshUntil: string | null;
    summary: string | null;
  };
  lastObservedAt: string | null;
  freshUntil: string | null;
  consentedAt: string;
  pausedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JourneyFlightMonitor = {
  status: "disabled" | "not_configured" | "available";
  provider: "flightaware" | "cirium" | "aviationstack" | null;
  blockers: string[];
};

export type JourneyConnection = {
  provider:
    | "google_calendar"
    | "microsoft_calendar"
    | "gmail"
    | "outlook_mail"
    | "device_calendar"
    | "flight_status";
  availability: "available" | "not_configured" | "disabled";
  accessModes: Array<
    "free_busy" | "selected_items" | "calendar_details" | "manual"
  >;
  scopes: string[];
  status: string;
  accessMode: string;
  expiresAt: string | null;
  consentedAt: string | null;
  lastSyncAt: string | null;
  blockers: string[];
};

export type JourneyCapabilities = {
  enabled: boolean;
  visibility: "private";
  providers: Array<
    Pick<
      JourneyConnection,
      "provider" | "availability" | "accessModes" | "scopes" | "blockers"
    >
  >;
  flightMonitor: JourneyFlightMonitor;
  message: string | null;
};

export type JourneyDetail = {
  journey: Journey;
  items: JourneyItem[];
  imports: JourneyImport[];
  reminders: JourneyReminder[];
  flightWatches: JourneyFlightWatch[];
};

export type JourneyDraft = {
  title: string;
  destinationLabel?: string | null;
  destinationCity?: string | null;
  destinationRegion?: string | null;
  timeZone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  retentionPolicy?: Journey["retentionPolicy"];
  preferences?: Record<string, unknown>;
};

export type JourneyItemDraft = {
  kind: JourneyItemKind;
  status?: JourneyItemStatus;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  timeZone?: string | null;
  locationLabel?: string | null;
  canonicalBusinessId?: string | null;
  sourceImportId?: string | null;
  sensitiveDetails?: Record<string, unknown> | null;
};

export class JourneyRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "JourneyRequestError";
  }
}

async function journeyRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await authenticatedFetch(`${BASE}api${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & {
    error?: unknown;
    code?: unknown;
  };
  if (!response.ok) {
    throw new JourneyRequestError(
      typeof body.error === "string"
        ? body.error
        : "Kinfolk Journeys could not complete that request.",
      response.status,
      typeof body.code === "string" ? body.code : undefined,
    );
  }
  return body;
}

export const journeysApi = {
  capabilities: () =>
    journeyRequest<JourneyCapabilities>("/kinfolk-journeys/capabilities"),
  list: () => journeyRequest<{ journeys: Journey[] }>("/kinfolk-journeys"),
  get: (journeyId: string) =>
    journeyRequest<JourneyDetail>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}`,
    ),
  create: (draft: JourneyDraft) =>
    journeyRequest<{ journey: Journey }>("/kinfolk-journeys", {
      method: "POST",
      body: JSON.stringify(draft),
    }),
  update: (
    journeyId: string,
    draft: JourneyDraft & { status?: JourneyStatus },
  ) =>
    journeyRequest<{ journey: Journey }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}`,
      { method: "PATCH", body: JSON.stringify(draft) },
    ),
  delete: (journeyId: string) =>
    journeyRequest<{ ok: true; status: "deleted"; message: string }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}`,
      { method: "DELETE" },
    ),
  addItem: (journeyId: string, item: JourneyItemDraft) =>
    journeyRequest<{ item: JourneyItem }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/items`,
      { method: "POST", body: JSON.stringify(item) },
    ),
  deleteItem: async (journeyId: string, itemId: string): Promise<void> => {
    const response = await authenticatedFetch(
      `${BASE}api/kinfolk-journeys/${encodeURIComponent(journeyId)}/items/${encodeURIComponent(itemId)}`,
      { method: "DELETE", cache: "no-store" },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      throw new JourneyRequestError(
        body.error ?? "Could not remove that item.",
        response.status,
        body.code,
      );
    }
  },
  importText: (journeyId: string, text: string) =>
    journeyRequest<{
      import: JourneyImport;
      parsed?: { facts: JourneyImport["parsedFacts"]; warnings: string[] };
      duplicate: boolean;
      warnings?: string[];
    }>(`/kinfolk-journeys/${encodeURIComponent(journeyId)}/imports/text`, {
      method: "POST",
      body: JSON.stringify({ text, consent: true }),
    }),
  registerAttachment: (
    journeyId: string,
    input: { assetId: string; sourceKind: "document" | "image" },
  ) =>
    journeyRequest<{
      import: JourneyImport;
      duplicate: boolean;
      message: string;
    }>(`/kinfolk-journeys/${encodeURIComponent(journeyId)}/imports/assets`, {
      method: "POST",
      body: JSON.stringify({ ...input, consent: true }),
    }),
  extractPrivateDocument: (journeyId: string, importId: string) =>
    journeyRequest<{
      import: JourneyImport;
      parsed: { facts: JourneyImport["parsedFacts"]; warnings: string[] };
      message: string;
    }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/imports/${encodeURIComponent(importId)}/extract-private-document`,
      { method: "POST", body: JSON.stringify({ consent: true }) },
    ),
  confirmImport: (
    journeyId: string,
    importId: string,
    items: JourneyItemDraft[],
  ) =>
    journeyRequest<{ items: JourneyItem[]; import: JourneyImport }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/imports/${encodeURIComponent(importId)}/confirm`,
      { method: "POST", body: JSON.stringify({ confirm: true, items }) },
    ),
  addReminder: (
    journeyId: string,
    input: {
      dueAt: string;
      itemId?: string | null;
      channel?: JourneyReminder["channel"];
    },
  ) =>
    journeyRequest<{ reminder: JourneyReminder; delivery: "not_scheduled" }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/reminders`,
      { method: "POST", body: JSON.stringify({ ...input, consent: true }) },
    ),
  updateReminder: (
    journeyId: string,
    reminderId: string,
    state: "enabled" | "paused",
  ) =>
    journeyRequest<{ reminder: JourneyReminder; delivery: "not_scheduled" }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/reminders/${encodeURIComponent(reminderId)}`,
      { method: "PATCH", body: JSON.stringify({ state }) },
    ),
  deleteReminder: async (
    journeyId: string,
    reminderId: string,
  ): Promise<void> => {
    const response = await authenticatedFetch(
      `${BASE}api/kinfolk-journeys/${encodeURIComponent(journeyId)}/reminders/${encodeURIComponent(reminderId)}`,
      { method: "DELETE", cache: "no-store" },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      throw new JourneyRequestError(
        body.error ?? "Could not remove that reminder.",
        response.status,
        body.code,
      );
    }
  },
  addFlightWatch: (
    journeyId: string,
    input: {
      itemId?: string | null;
      operatingCarrier: string;
      flightNumber: string;
      scheduledDepartureDate: string;
      originIata: string;
      destinationIata: string;
      notificationChannel?: JourneyFlightWatch["notificationChannel"];
    },
  ) =>
    journeyRequest<{
      watch: JourneyFlightWatch;
      readiness: JourneyFlightMonitor;
      boundary: string;
    }>(`/kinfolk-journeys/${encodeURIComponent(journeyId)}/flight-watches`, {
      method: "POST",
      body: JSON.stringify({
        ...input,
        notificationChannel: input.notificationChannel ?? "in_app",
        memberConsent: true,
      }),
    }),
  updateFlightWatch: (
    journeyId: string,
    watchId: string,
    action: "pause" | "resume" | "revoke",
  ) =>
    journeyRequest<{
      watch: JourneyFlightWatch;
      readiness: JourneyFlightMonitor;
    }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/flight-watches/${encodeURIComponent(watchId)}`,
      { method: "PATCH", body: JSON.stringify({ action }) },
    ),
  deleteFlightWatch: async (
    journeyId: string,
    watchId: string,
  ): Promise<void> => {
    const response = await authenticatedFetch(
      `${BASE}api/kinfolk-journeys/${encodeURIComponent(journeyId)}/flight-watches/${encodeURIComponent(watchId)}`,
      { method: "DELETE", cache: "no-store" },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      throw new JourneyRequestError(
        body.error ?? "Could not remove that private flight watch.",
        response.status,
        body.code,
      );
    }
  },
  connections: () =>
    journeyRequest<{ connections: JourneyConnection[] }>(
      "/kinfolk-journeys/connections",
    ),
  startConnection: (
    provider: JourneyConnection["provider"],
    accessMode: JourneyConnection["accessModes"][number],
  ) =>
    journeyRequest<{
      provider: string;
      authorizationUrl: string;
      expiresAt: string;
    }>(`/kinfolk-journeys/connections/${encodeURIComponent(provider)}/start`, {
      method: "POST",
      body: JSON.stringify({ accessMode }),
    }),
  disconnect: (provider: JourneyConnection["provider"]) =>
    journeyRequest<{ provider: string; status: string; message: string }>(
      `/kinfolk-journeys/connections/${encodeURIComponent(provider)}/disconnect`,
      { method: "POST" },
    ),
};

export async function uploadJourneyAttachment(
  file: File,
): Promise<{ assetId: string; type: "image" | "document" }> {
  const form = new FormData();
  form.append("file", file);
  const response = await authenticatedFetch(
    `${BASE}api/media/upload?purpose=kinfolk_journey_private`,
    { method: "POST", body: form, cache: "no-store" },
  );
  const body = (await response.json().catch(() => ({}))) as {
    assetId?: string;
    type?: "image" | "document";
    error?: string;
    code?: string;
  };
  if (
    !response.ok ||
    !body.assetId ||
    (body.type !== "image" && body.type !== "document")
  ) {
    throw new JourneyRequestError(
      body.error ?? "The private attachment could not be uploaded.",
      response.status,
      body.code,
    );
  }
  return { assetId: body.assetId, type: body.type };
}
