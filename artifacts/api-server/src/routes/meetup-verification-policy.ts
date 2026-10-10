export const MINIMUM_MEETUP_LEAD_MS = 15 * 60 * 1000;
export const MAXIMUM_MEETUP_LEAD_MS = 30 * 24 * 60 * 60 * 1000;
export const MEETUP_WINDOW_MS = 4 * 60 * 60 * 1000;

export type VerifiedMeetupStatus = "awaiting_partner" | "approved" | "cancelled" | "expired";

export class MeetupPolicyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 422,
  ) {
    super(message);
    this.name = "MeetupPolicyError";
  }
}

type DateInput = string | Date | undefined;

export interface VerifiedMeetupRequestInput {
  partnerId?: unknown;
  venue?: unknown;
  scheduledAt?: DateInput;
  organizerApproval?: unknown;
}

export interface NormalizedVerifiedMeetupRequest {
  partnerId: string;
  venue: string;
  scheduledAt: Date;
  expiresAt: Date;
}

function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new MeetupPolicyError("INVALID_MEETUP_INPUT", `${field} is required`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new MeetupPolicyError("INVALID_MEETUP_INPUT", `${field} is required`);
  }
  if (normalized.length > maxLength) {
    throw new MeetupPolicyError("INVALID_MEETUP_INPUT", `${field} is too long`);
  }
  return normalized;
}

function requiredFutureDate(value: DateInput, now: Date): Date {
  const parsed = value instanceof Date ? new Date(value) : new Date(typeof value === "string" ? value : "");
  if (Number.isNaN(parsed.getTime())) {
    throw new MeetupPolicyError("INVALID_MEETUP_TIME", "scheduledAt must be a valid date and time");
  }

  const leadTime = parsed.getTime() - now.getTime();
  if (leadTime < MINIMUM_MEETUP_LEAD_MS || leadTime > MAXIMUM_MEETUP_LEAD_MS) {
    throw new MeetupPolicyError(
      "INVALID_MEETUP_TIME",
      "scheduledAt must be between 15 minutes and 30 days from now",
    );
  }
  return parsed;
}

/**
 * Accept only the minimum data needed for a time-bounded meetup request. The
 * explicit approval belongs to the organizer (the request initiator), not a
 * client-side badge or inferred intent.
 */
export function normalizeVerifiedMeetupRequest(
  input: VerifiedMeetupRequestInput,
  now = new Date(),
): NormalizedVerifiedMeetupRequest {
  if (input.organizerApproval !== true) {
    throw new MeetupPolicyError(
      "ORGANIZER_APPROVAL_REQUIRED",
      "The verified organizer must explicitly approve this meetup request",
      403,
    );
  }

  return {
    partnerId: requiredString(input.partnerId, "partnerId", 255),
    venue: requiredString(input.venue, "venue", 255),
    scheduledAt: requiredFutureDate(input.scheduledAt, now),
    expiresAt: new Date(requiredFutureDate(input.scheduledAt, now).getTime() + MEETUP_WINDOW_MS),
  };
}

export function assertVerifiedParticipant(
  participant: { identityVerified: boolean } | undefined,
  role: "organizer" | "partner",
): void {
  if (!participant?.identityVerified) {
    throw new MeetupPolicyError(
      `${role === "organizer" ? "ORGANIZER" : "PARTNER"}_IDENTITY_VERIFICATION_REQUIRED`,
      `The ${role} must have a verified identity before this request can continue`,
      403,
    );
  }
}

export interface MeetupLifecycleRecord {
  status: string;
  scheduledAt: Date | null;
  expiresAt: Date | null;
}

export function effectiveMeetupStatus(record: MeetupLifecycleRecord, now = new Date()): VerifiedMeetupStatus {
  if (record.status === "cancelled") return "cancelled";
  if (
    (record.status === "awaiting_partner" || record.status === "approved")
    && record.scheduledAt
    && record.expiresAt
    && record.expiresAt.getTime() > now.getTime()
  ) {
    return record.status;
  }
  return "expired";
}

export function assertActiveMeetup(record: MeetupLifecycleRecord, now = new Date()): void {
  const status = effectiveMeetupStatus(record, now);
  if (status === "expired") {
    throw new MeetupPolicyError("MEETUP_EXPIRED", "This meetup request has expired", 409);
  }
  if (status === "cancelled") {
    throw new MeetupPolicyError("MEETUP_CANCELLED", "This meetup request was cancelled", 409);
  }
}

export interface MeetupResponseRecord extends MeetupLifecycleRecord {
  id: number;
  initiatorId: string;
  partnerId: string;
  location: string | null;
  initiatedAt: Date;
  organizerApprovedAt: Date | null;
  partnerApprovedAt: Date | null;
  correctedAt: Date | null;
  cancelledAt: Date | null;
  initiatorFirstName: string | null;
  initiatorLastName: string | null;
  initiatorUsername: string | null;
  partnerFirstName: string | null;
  partnerLastName: string | null;
  partnerUsername: string | null;
}

function displayName(firstName: string | null, lastName: string | null, username: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ") || username || "Community member";
}

/**
 * Deliberately exclude attendee IDs, notes, clear codes, watcher details, and
 * any safety assessment. Each participant sees only the counterpart display
 * name and the currently active venue/time necessary to decide whether to act.
 */
export function toPrivacyMinimizedMeetup(
  record: MeetupResponseRecord,
  viewerId: string,
  now = new Date(),
) {
  const status = effectiveMeetupStatus(record, now);
  const isOrganizer = record.initiatorId === viewerId;
  const active = status === "awaiting_partner" || status === "approved";

  return {
    id: record.id,
    role: isOrganizer ? "organizer" : "partner",
    counterpartName: isOrganizer
      ? displayName(record.partnerFirstName, record.partnerLastName, record.partnerUsername)
      : displayName(record.initiatorFirstName, record.initiatorLastName, record.initiatorUsername),
    status,
    venue: active ? record.location : null,
    scheduledAt: active ? record.scheduledAt : null,
    expiresAt: active ? record.expiresAt : null,
    initiatedAt: record.initiatedAt,
    organizerApprovedAt: record.organizerApprovedAt,
    partnerApprovedAt: record.partnerApprovedAt,
    correctedAt: record.correctedAt,
    cancelledAt: record.cancelledAt,
  };
}
