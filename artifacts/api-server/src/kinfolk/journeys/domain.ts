import { createHash } from "node:crypto";

export const JOURNEY_STATUSES = [
  "draft",
  "review_needed",
  "confirmed",
  "active",
  "completed",
  "archived",
  "deleted",
] as const;
export type JourneyStatus = (typeof JOURNEY_STATUSES)[number];
export const JOURNEY_ITEM_STATUSES = [
  "proposed",
  "tentative",
  "confirmed",
  "cancelled",
  "skipped",
] as const;
export type JourneyItemStatus = (typeof JOURNEY_ITEM_STATUSES)[number];
export const JOURNEY_ITEM_KINDS = [
  "flight",
  "lodging",
  "transport",
  "reservation",
  "event",
  "place",
  "note",
  "reminder",
] as const;
export type JourneyItemKind = (typeof JOURNEY_ITEM_KINDS)[number];
export const JOURNEY_PROVIDERS = [
  "google_calendar",
  "microsoft_calendar",
  "gmail",
  "outlook_mail",
  "device_calendar",
  "flight_status",
] as const;
export type JourneyProvider = (typeof JOURNEY_PROVIDERS)[number];
export const JOURNEY_CONNECTION_STATUSES = [
  "disabled",
  "not_configured",
  "pending_consent",
  "connected",
  "expired",
  "needs_reconnect",
  "revoked",
  "disconnect_pending",
] as const;
export type JourneyConnectionStatus =
  (typeof JOURNEY_CONNECTION_STATUSES)[number];

export type JourneyVisibility = "private";
export type JourneyInput = Readonly<{
  title: string;
  destinationLabel?: string | null;
  destinationCity?: string | null;
  destinationRegion?: string | null;
  timeZone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  retentionPolicy?:
    | "delete_after_trip"
    | "keep_until_deleted"
    | "keep_until_member_changes_it";
  preferences?: Record<string, unknown>;
}>;

export type JourneyItemInput = Readonly<{
  kind: JourneyItemKind;
  status?: Exclude<JourneyItemStatus, "confirmed"> | "confirmed";
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  timeZone?: string | null;
  locationLabel?: string | null;
  canonicalBusinessId?: string | null;
  sourceImportId?: string | null;
  sensitiveDetails?: Record<string, unknown> | null;
}>;

export type JourneyActionErrorCode =
  | "JOURNEYS_DISABLED"
  | "JOURNEY_NOT_FOUND"
  | "JOURNEY_INVALID"
  | "JOURNEY_STATE_INVALID"
  | "JOURNEY_ITEM_INVALID"
  | "JOURNEY_CONFIRMED_ITEM_REQUIRES_MEMBER_EDIT"
  | "JOURNEY_OWNER_ONLY"
  | "JOURNEY_REVIEW_REQUIRED"
  | "JOURNEY_PROVIDER_UNAVAILABLE";

export class JourneyActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: JourneyActionErrorCode,
  ) {
    super(message);
  }
}

const JOURNEY_TRANSITIONS: Readonly<
  Record<JourneyStatus, readonly JourneyStatus[]>
> = {
  draft: ["review_needed", "confirmed", "archived", "deleted"],
  review_needed: ["draft", "confirmed", "archived", "deleted"],
  confirmed: ["active", "completed", "archived", "deleted"],
  active: ["completed", "archived", "deleted"],
  completed: ["archived", "deleted"],
  archived: [
    "draft",
    "review_needed",
    "confirmed",
    "active",
    "completed",
    "deleted",
  ],
  deleted: [],
};

export function journeyFeatureEnabled(): boolean {
  return process.env.KINFOLK_JOURNEYS_ENABLED === "true";
}

export function assertJourneyFeatureEnabled(): void {
  if (!journeyFeatureEnabled()) {
    throw new JourneyActionError(
      "Kinfolk Journeys is not enabled for this environment yet.",
      503,
      "JOURNEYS_DISABLED",
    );
  }
}

export function assertJourneyProvider(value: unknown): JourneyProvider {
  if (
    typeof value !== "string" ||
    !JOURNEY_PROVIDERS.includes(value as JourneyProvider)
  ) {
    throw new JourneyActionError(
      "Choose a supported Journey connection.",
      400,
      "JOURNEY_INVALID",
    );
  }
  return value as JourneyProvider;
}

export function assertValidJourneyInput(input: JourneyInput): JourneyInput {
  const title = input.title.trim();
  if (title.length < 2 || title.length > 180) {
    throw new JourneyActionError(
      "Give this Journey a title between 2 and 180 characters.",
      400,
      "JOURNEY_INVALID",
    );
  }
  if (input.startDate && !isIsoDate(input.startDate)) {
    throw new JourneyActionError(
      "Start date must use YYYY-MM-DD.",
      400,
      "JOURNEY_INVALID",
    );
  }
  if (input.endDate && !isIsoDate(input.endDate)) {
    throw new JourneyActionError(
      "End date must use YYYY-MM-DD.",
      400,
      "JOURNEY_INVALID",
    );
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    throw new JourneyActionError(
      "End date must be on or after the start date.",
      400,
      "JOURNEY_INVALID",
    );
  }
  if (input.timeZone && !isTimeZone(input.timeZone)) {
    throw new JourneyActionError(
      "Choose a valid IANA time zone.",
      400,
      "JOURNEY_INVALID",
    );
  }
  return { ...input, title };
}

export function assertJourneyTransition(
  from: JourneyStatus,
  to: JourneyStatus,
): void {
  if (from === to) return;
  if (!JOURNEY_TRANSITIONS[from].includes(to)) {
    throw new JourneyActionError(
      `A Journey in ${from} status cannot move directly to ${to}.`,
      409,
      "JOURNEY_STATE_INVALID",
    );
  }
}

export function assertJourneyItemInput(
  input: JourneyItemInput,
): JourneyItemInput {
  if (!JOURNEY_ITEM_KINDS.includes(input.kind)) {
    throw new JourneyActionError(
      "Choose a supported Journey item type.",
      400,
      "JOURNEY_ITEM_INVALID",
    );
  }
  const title = input.title.trim();
  if (title.length < 1 || title.length > 255) {
    throw new JourneyActionError(
      "Journey item title is required and must be under 255 characters.",
      400,
      "JOURNEY_ITEM_INVALID",
    );
  }
  if (input.timeZone && !isTimeZone(input.timeZone)) {
    throw new JourneyActionError(
      "Choose a valid IANA time zone.",
      400,
      "JOURNEY_ITEM_INVALID",
    );
  }
  if (input.startsAt && !isDateTime(input.startsAt)) {
    throw new JourneyActionError(
      "Start time must be a valid ISO date-time.",
      400,
      "JOURNEY_ITEM_INVALID",
    );
  }
  if (input.endsAt && !isDateTime(input.endsAt)) {
    throw new JourneyActionError(
      "End time must be a valid ISO date-time.",
      400,
      "JOURNEY_ITEM_INVALID",
    );
  }
  if (
    input.startsAt &&
    input.endsAt &&
    new Date(input.endsAt).getTime() < new Date(input.startsAt).getTime()
  ) {
    throw new JourneyActionError(
      "End time must be after start time.",
      400,
      "JOURNEY_ITEM_INVALID",
    );
  }
  return { ...input, title };
}

/** A confirmed commitment can be edited only through a member-requested edit, never through an import or Kinfolk suggestion. */
export function assertConfirmedItemMutation(input: {
  existingStatus: JourneyItemStatus;
  actor: "member" | "kinfolk" | "import" | "provider";
  explicitMemberEdit: boolean;
}): void {
  if (
    input.existingStatus === "confirmed" &&
    (input.actor !== "member" || !input.explicitMemberEdit)
  ) {
    throw new JourneyActionError(
      "Confirmed Journey items stay unchanged until the member explicitly edits them.",
      409,
      "JOURNEY_CONFIRMED_ITEM_REQUIRES_MEMBER_EDIT",
    );
  }
}

export function normalizeJourneyText(value: unknown, max = 255): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized && normalized.length <= max ? normalized : null;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function redactedPreview(value: string, max = 160): string {
  const cleaned = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length <= max
    ? cleaned
    : `${cleaned.slice(0, Math.max(0, max - 1))}…`;
}

export function isIsoDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(new Date(`${value}T12:00:00Z`).getTime())
  );
}

export function isDateTime(value: string): boolean {
  return Number.isFinite(new Date(value).getTime()) && /T/.test(value);
}

export function isTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
