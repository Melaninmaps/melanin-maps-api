import {
  normalizePrivatePlaceAddress,
  normalizePrivatePlaceLabel,
  openPrivatePlace,
  sealPrivatePlace,
  type PrivatePlacePayload,
} from "./private-places-policy";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A stay remains usable through the end of its departure date and for this
 * short, visible grace period. Extension is allowed only before this expiry;
 * afterwards the encrypted row is purged by the retention scheduler.
 */
export const TEMPORARY_STAY_POST_DEPARTURE_GRACE_DAYS = 7;

export type TemporaryStayDates = Readonly<{
  arrivalDate: string;
  departureDate: string;
}>;

export type TemporaryStayPayload = PrivatePlacePayload & TemporaryStayDates;

/** A Temporary Stay is private location context, never a directory business. */
export function normalizeTemporaryStayLabel(value: unknown): string | null {
  return normalizePrivatePlaceLabel(value);
}

export function normalizeTemporaryStayAddress(value: unknown): string | null {
  return normalizePrivatePlaceAddress(value);
}

function normalizedDate(value: unknown): string | null {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

/**
 * Dates are deliberately encrypted with the stay. Requiring both dates makes
 * the temporary retention boundary explicit instead of silently retaining an
 * indefinite travel location.
 */
export function normalizeTemporaryStayDates(input: { arrivalDate?: unknown; departureDate?: unknown }): TemporaryStayDates | null {
  const arrivalDate = normalizedDate(input.arrivalDate);
  const departureDate = normalizedDate(input.departureDate);
  if (!arrivalDate || !departureDate || departureDate < arrivalDate) return null;
  return { arrivalDate, departureDate };
}

/** A member may extend only to a later departure date while the row remains in its grace window. */
export function normalizeTemporaryStayExtension(input: {
  arrivalDate: string;
  currentDepartureDate: string;
  departureDate?: unknown;
}): TemporaryStayDates | null {
  const next = normalizeTemporaryStayDates({ arrivalDate: input.arrivalDate, departureDate: input.departureDate });
  if (!next || next.departureDate <= input.currentDepartureDate) return null;
  return next;
}

/** The purge moment is not stored separately; the sensitive dates stay encrypted. */
export function temporaryStayExpiresAt(payload: Pick<TemporaryStayPayload, "departureDate">): Date {
  const departure = new Date(`${payload.departureDate}T23:59:59.999Z`);
  departure.setUTCDate(departure.getUTCDate() + TEMPORARY_STAY_POST_DEPARTURE_GRACE_DAYS);
  return departure;
}

export function isTemporaryStayExpired(
  payload: Pick<TemporaryStayPayload, "departureDate">,
  now: Date = new Date(),
): boolean {
  return temporaryStayExpiresAt(payload).getTime() <= now.getTime();
}

export function sealTemporaryStay(payload: TemporaryStayPayload, environment: NodeJS.ProcessEnv = process.env) {
  return sealPrivatePlace(payload, environment);
}

export function openTemporaryStay(encryptedPayload: string, expectedKeyVersion: string, environment: NodeJS.ProcessEnv = process.env): TemporaryStayPayload {
  const payload = openPrivatePlace(encryptedPayload, expectedKeyVersion, environment);
  const dates = normalizeTemporaryStayDates(payload);
  if (!dates) throw new Error("PRIVATE_PLACES_DECRYPTION_INVALID");
  return { ...payload, ...dates };
}

export const TEMPORARY_STAY_PRIVACY_NOTICE =
  "A Temporary Stay is encrypted private location context. It is never a directory listing, public activity, chat-memory item, analytics event, or automatic recommendation. It is removed seven days after its departure date unless you extend or delete it sooner.";
