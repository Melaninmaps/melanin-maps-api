import { JourneyActionError } from "./domain";

export const KINFOLK_FLIGHT_WATCH_STATES = [
  "pending_provider",
  "active",
  "paused",
  "completed",
  "revoked",
  "deleted",
] as const;
export type KinfolkFlightWatchState =
  (typeof KINFOLK_FLIGHT_WATCH_STATES)[number];

export type FlightWatchInput = Readonly<{
  operatingCarrier: string;
  flightNumber: string;
  scheduledDepartureDate: string;
  originIata: string;
  destinationIata: string;
  notificationChannel: "in_app" | "push" | "email";
  itemId?: string | null;
  memberConsent: true;
}>;

export type FlightStatusSnapshot = Readonly<{
  state: "unknown" | "on_time" | "delayed" | "cancelled" | "diverted";
  sourceObservedAt: string | null;
  freshUntil: string | null;
  summary: string | null;
}>;

export type FlightMonitorReadiness = Readonly<{
  status: "disabled" | "not_configured" | "available";
  provider: "flightaware" | "cirium" | "aviationstack" | null;
  blockers: readonly string[];
}>;

function invalid(message: string): JourneyActionError {
  return new JourneyActionError(message, 400, "JOURNEY_INVALID");
}

function cleanCode(
  value: unknown,
  label: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") throw invalid(`${label} is required.`);
  const normalized = value.trim().toUpperCase();
  const pattern = new RegExp(`^[A-Z0-9]{${min},${max}}$`);
  if (!pattern.test(normalized)) throw invalid(`${label} is invalid.`);
  return normalized;
}

function cleanDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw invalid("Scheduled departure date must be YYYY-MM-DD.");
  const parsed = new Date(`${value}T12:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    throw invalid("Scheduled departure date is invalid.");
  return value;
}

export function parseFlightWatchInput(value: unknown): FlightWatchInput {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  if (source.memberConsent !== true)
    throw invalid(
      "Explicit member consent is required before a flight watch can be saved.",
    );
  const notificationChannel = source.notificationChannel;
  if (
    notificationChannel !== "in_app" &&
    notificationChannel !== "push" &&
    notificationChannel !== "email"
  )
    throw invalid("Choose an in-app, push, or email notification preference.");
  const itemId =
    typeof source.itemId === "string" && source.itemId.trim()
      ? source.itemId.trim()
      : null;
  return {
    operatingCarrier: cleanCode(
      source.operatingCarrier,
      "Operating carrier",
      2,
      3,
    ),
    flightNumber: cleanCode(source.flightNumber, "Flight number", 1, 4),
    scheduledDepartureDate: cleanDate(source.scheduledDepartureDate),
    originIata: cleanCode(source.originIata, "Origin airport", 3, 3),
    destinationIata: cleanCode(
      source.destinationIata,
      "Destination airport",
      3,
      3,
    ),
    notificationChannel,
    itemId,
    memberConsent: true,
  };
}

function configuredProvider(): FlightMonitorReadiness["provider"] {
  const value =
    process.env.KINFOLK_FLIGHT_MONITOR_PROVIDER?.trim().toLowerCase();
  return value === "flightaware" ||
    value === "cirium" ||
    value === "aviationstack"
    ? value
    : null;
}

/**
 * A deliberate source-only gate. A watched flight is an advisory status feed,
 * not carrier reservation access. No PNR, passenger name, loyalty account,
 * ticket number, booking credential, scraping, or browser automation is used.
 */
export function getFlightMonitorReadiness(): FlightMonitorReadiness {
  const provider = configuredProvider();
  const networkEnabled =
    process.env.KINFOLK_FLIGHT_MONITOR_NETWORK_ENABLED === "true";
  const providerKeyConfigured = Boolean(
    process.env.KINFOLK_FLIGHT_MONITOR_API_KEY?.trim(),
  );
  if (!provider)
    return {
      status: "disabled",
      provider: null,
      blockers: [
        "Choose an approved commercial flight-status provider before live monitoring can begin.",
        "Kinfolk never accesses airline accounts, reservations, PNRs, loyalty accounts, or booking-management pages.",
      ],
    };
  const blockers = [
    ...(providerKeyConfigured
      ? []
      : ["Flight-status provider key is not configured."]),
    ...(networkEnabled
      ? []
      : ["Flight-status network calls are disabled in this environment."]),
  ];
  return {
    status: blockers.length ? "not_configured" : "available",
    provider,
    blockers,
  };
}

export function unknownFlightStatus(): FlightStatusSnapshot {
  return {
    state: "unknown",
    sourceObservedAt: null,
    freshUntil: null,
    summary:
      "Live flight status has not been retrieved. Confirm updates with the airline or booking channel.",
  };
}

export function flightStatusChanged(
  before: FlightStatusSnapshot,
  after: FlightStatusSnapshot,
): boolean {
  return (
    before.state !== after.state ||
    before.summary !== after.summary ||
    before.freshUntil !== after.freshUntil
  );
}
