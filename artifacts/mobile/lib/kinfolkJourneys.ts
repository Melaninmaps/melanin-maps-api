import { getApiBase, getMemberApiHeaders } from "@/lib/api";

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

export type KinfolkJourney = {
  id: string;
  title: string;
  status: JourneyStatus;
  destinationLabel: string | null;
  destinationCity: string | null;
  destinationRegion: string | null;
  timeZone: string | null;
  startDate: string | null;
  endDate: string | null;
  visibility: "private";
  retentionPolicy:
    | "delete_after_trip"
    | "keep_until_deleted"
    | "keep_until_member_changes_it";
  createdAt: string;
  updatedAt: string;
};

export type KinfolkJourneyItem = {
  id: string;
  journeyId: string;
  kind: JourneyItemKind;
  status: JourneyItemStatus;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  locationLabel: string | null;
  memberConfirmedAt: string | null;
};

export type KinfolkJourneyImport = {
  id: string;
  sourceKind: string;
  status: string;
  parsedFacts: Array<{
    field: string;
    value: string;
    confidence: string;
    reason: string;
  }>;
  hasPrivateAttachment?: boolean;
};

export type KinfolkJourneyReminder = {
  id: string;
  journeyId: string;
  itemId: string | null;
  channel: "in_app" | "push" | "email";
  state: "enabled" | "paused" | "sent" | "deleted";
  dueAt: string;
  sentAt: string | null;
};
export type KinfolkJourneyDetail = {
  journey: KinfolkJourney;
  items: KinfolkJourneyItem[];
  imports: KinfolkJourneyImport[];
  reminders: KinfolkJourneyReminder[];
};
export type JourneyProvider =
  | "google_calendar"
  | "microsoft_calendar"
  | "gmail"
  | "outlook_mail"
  | "device_calendar"
  | "flight_status";
export type KinfolkJourneyConnection = {
  provider: JourneyProvider;
  availability: "ready" | "not_configured" | "disabled";
  status: string;
  accessModes: string[];
  blockers: string[];
};

export class KinfolkJourneyRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "KinfolkJourneyRequestError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await getMemberApiHeaders();
  const response = await fetch(`${getApiBase()}/api${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...headers,
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & {
    error?: unknown;
    code?: unknown;
  };
  if (!response.ok)
    throw new KinfolkJourneyRequestError(
      typeof body.error === "string"
        ? body.error
        : "Kinfolk Journeys could not complete that request.",
      response.status,
      typeof body.code === "string" ? body.code : undefined,
    );
  return body;
}

export const kinfolkJourneysApi = {
  capabilities: () =>
    request<{ enabled: boolean; message: string | null }>(
      "/kinfolk-journeys/capabilities",
    ),
  list: () => request<{ journeys: KinfolkJourney[] }>("/kinfolk-journeys"),
  detail: (journeyId: string) =>
    request<KinfolkJourneyDetail>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}`,
    ),
  create: (input: {
    title: string;
    destinationLabel?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    retentionPolicy?: KinfolkJourney["retentionPolicy"];
    timeZone?: string | null;
  }) =>
    request<{ journey: KinfolkJourney }>("/kinfolk-journeys", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  addItem: (
    journeyId: string,
    input: {
      kind: JourneyItemKind;
      title: string;
      status?: JourneyItemStatus;
      startsAt?: string | null;
      locationLabel?: string | null;
    },
  ) =>
    request<{ item: KinfolkJourneyItem }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/items`,
      { method: "POST", body: JSON.stringify(input) },
    ),
  importText: (journeyId: string, text: string) =>
    request<{ import: KinfolkJourneyImport }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/imports/text`,
      { method: "POST", body: JSON.stringify({ text, consent: true }) },
    ),
  registerAttachment: (
    journeyId: string,
    assetId: string,
    sourceKind: "document" | "image",
  ) =>
    request<{ import: KinfolkJourneyImport }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/imports/assets`,
      {
        method: "POST",
        body: JSON.stringify({ assetId, sourceKind, consent: true }),
      },
    ),
  confirmImport: (
    journeyId: string,
    importId: string,
    items: Array<{
      kind: JourneyItemKind;
      title: string;
      status: JourneyItemStatus;
      startsAt?: string | null;
      sourceImportId?: string;
    }>,
  ) =>
    request<{ items: KinfolkJourneyItem[] }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/imports/${encodeURIComponent(importId)}/confirm`,
      { method: "POST", body: JSON.stringify({ confirm: true, items }) },
    ),
  addReminder: (
    journeyId: string,
    input: { dueAt: string; itemId?: string | null },
  ) =>
    request<{ reminder: KinfolkJourneyReminder; delivery: "not_scheduled" }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/reminders`,
      {
        method: "POST",
        body: JSON.stringify({ ...input, channel: "in_app", consent: true }),
      },
    ),
  updateReminder: (
    journeyId: string,
    reminderId: string,
    state: "enabled" | "paused",
  ) =>
    request<{ reminder: KinfolkJourneyReminder }>(
      `/kinfolk-journeys/${encodeURIComponent(journeyId)}/reminders/${encodeURIComponent(reminderId)}`,
      { method: "PATCH", body: JSON.stringify({ state }) },
    ),
  deleteReminder: async (
    journeyId: string,
    reminderId: string,
  ): Promise<void> => {
    const headers = await getMemberApiHeaders();
    const response = await fetch(
      `${getApiBase()}/api/kinfolk-journeys/${encodeURIComponent(journeyId)}/reminders/${encodeURIComponent(reminderId)}`,
      { method: "DELETE", headers },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      throw new KinfolkJourneyRequestError(
        body.error ?? "Could not remove that reminder.",
        response.status,
        body.code,
      );
    }
  },
  connections: () =>
    request<{ connections: KinfolkJourneyConnection[] }>(
      "/kinfolk-journeys/connections",
    ),
  startConnection: (provider: JourneyProvider, accessMode: string) =>
    request<{ authorizationUrl: string }>(
      `/kinfolk-journeys/connections/${encodeURIComponent(provider)}/start`,
      { method: "POST", body: JSON.stringify({ accessMode }) },
    ),
};

export async function uploadPrivateJourneyAttachment(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<{ assetId: string; type: "image" | "document" }> {
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  const headers = await getMemberApiHeaders();
  const response = await fetch(
    `${getApiBase()}/api/media/upload?purpose=kinfolk_journey_private`,
    { method: "POST", headers, body: form },
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
  )
    throw new KinfolkJourneyRequestError(
      body.error ?? "Private attachment upload failed.",
      response.status,
      body.code,
    );
  return { assetId: body.assetId, type: body.type };
}
