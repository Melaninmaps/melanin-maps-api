import {
  normalizePrivatePlaceAddress,
  normalizePrivatePlaceLabel,
  openPrivatePlace,
  sealPrivatePlace,
  type PrivatePlacePayload,
} from "./private-places-policy";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type TemporaryStayPayload = PrivatePlacePayload & Readonly<{
  arrivalDate?: string;
  departureDate?: string;
}>;

/** A Temporary Stay is private location context, never a directory business. */
export function normalizeTemporaryStayLabel(value: unknown): string | null {
  return normalizePrivatePlaceLabel(value);
}

export function normalizeTemporaryStayAddress(value: unknown): string | null {
  return normalizePrivatePlaceAddress(value);
}

function normalizedDate(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

export function normalizeTemporaryStayDates(input: { arrivalDate?: unknown; departureDate?: unknown }): {
  arrivalDate?: string;
  departureDate?: string;
} | null {
  const arrivalDate = normalizedDate(input.arrivalDate);
  const departureDate = normalizedDate(input.departureDate);
  if (arrivalDate === null || departureDate === null) return null;
  if (arrivalDate && departureDate && departureDate < arrivalDate) return null;
  return {
    ...(arrivalDate ? { arrivalDate } : {}),
    ...(departureDate ? { departureDate } : {}),
  };
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
  "A Temporary Stay is encrypted private location context. It is never a directory listing, public activity, chat-memory item, analytics event, or automatic recommendation. You can remove it at any time; a departure date never deletes it automatically.";
