import { describe, expect, it } from "vitest";
import {
  assertActiveMeetup,
  assertVerifiedParticipant,
  effectiveMeetupStatus,
  MeetupPolicyError,
  normalizeVerifiedMeetupRequest,
  toPrivacyMinimizedMeetup,
} from "../meetup-verification-policy";

const NOW = new Date("2026-10-10T15:00:00.000Z");
const SCHEDULED_AT = new Date("2026-10-10T17:00:00.000Z");

function record(overrides: Partial<Parameters<typeof toPrivacyMinimizedMeetup>[0]> = {}) {
  return {
    id: 17,
    initiatorId: "organizer-1",
    partnerId: "partner-1",
    location: "Community center room 2",
    status: "awaiting_partner",
    initiatedAt: new Date("2026-10-10T14:55:00.000Z"),
    scheduledAt: SCHEDULED_AT,
    expiresAt: new Date("2026-10-10T21:00:00.000Z"),
    organizerApprovedAt: new Date("2026-10-10T14:55:00.000Z"),
    partnerApprovedAt: null,
    correctedAt: null,
    cancelledAt: null,
    initiatorFirstName: "Ari",
    initiatorLastName: "Organizer",
    initiatorUsername: "ari",
    partnerFirstName: "Parker",
    partnerLastName: "Partner",
    partnerUsername: "parker",
    ...overrides,
  };
}

describe("verified meetup policy", () => {
  it("fails closed when organizer approval, venue, or a bounded future time is missing", () => {
    expect(() => normalizeVerifiedMeetupRequest({
      partnerId: "partner-1",
      venue: "Community center",
      scheduledAt: SCHEDULED_AT.toISOString(),
    }, NOW)).toThrow(expect.objectContaining<Partial<MeetupPolicyError>>({
      code: "ORGANIZER_APPROVAL_REQUIRED",
      status: 403,
    }));

    expect(() => normalizeVerifiedMeetupRequest({
      partnerId: "partner-1",
      venue: " ",
      scheduledAt: SCHEDULED_AT.toISOString(),
      organizerApproval: true,
    }, NOW)).toThrow(/venue is required/);

    expect(() => normalizeVerifiedMeetupRequest({
      partnerId: "partner-1",
      venue: "Community center",
      scheduledAt: "2026-10-10T15:05:00.000Z",
      organizerApproval: true,
    }, NOW)).toThrow(/between 15 minutes and 30 days/);
  });

  it("requires identity verification for both organizer and partner", () => {
    expect(() => assertVerifiedParticipant(undefined, "organizer")).toThrow(expect.objectContaining<Partial<MeetupPolicyError>>({
      code: "ORGANIZER_IDENTITY_VERIFICATION_REQUIRED",
      status: 403,
    }));
    expect(() => assertVerifiedParticipant({ identityVerified: true }, "organizer")).not.toThrow();
    expect(() => assertVerifiedParticipant({ identityVerified: false }, "partner")).toThrow(expect.objectContaining<Partial<MeetupPolicyError>>({
      code: "PARTNER_IDENTITY_VERIFICATION_REQUIRED",
      status: 403,
    }));
  });

  it("does not approve or expose a meetup after its venue/time window expires", () => {
    const expired = record({ expiresAt: new Date("2026-10-10T14:59:59.000Z") });
    expect(effectiveMeetupStatus(expired, NOW)).toBe("expired");
    expect(() => assertActiveMeetup(expired, NOW)).toThrow(expect.objectContaining<Partial<MeetupPolicyError>>({
      code: "MEETUP_EXPIRED",
      status: 409,
    }));

    expect(toPrivacyMinimizedMeetup(expired, "organizer-1", NOW)).toMatchObject({
      status: "expired",
      venue: null,
      scheduledAt: null,
      expiresAt: null,
    });
  });

  it("does not return attendee IDs, notes, watcher details, clear codes, or a safety guarantee", () => {
    const response = toPrivacyMinimizedMeetup(record(), "partner-1", NOW) as Record<string, unknown>;
    expect(response).toMatchObject({
      role: "partner",
      counterpartName: "Ari Organizer",
      venue: "Community center room 2",
      status: "awaiting_partner",
    });
    for (const prohibitedKey of [
      "initiatorId", "partnerId", "note", "clearCode", "safetyWatcherEmail", "safetyWatcherId", "safetyFriendEmail",
    ]) {
      expect(response).not.toHaveProperty(prohibitedKey);
    }
    expect(JSON.stringify(response)).not.toMatch(/safe|safety|guarantee/i);
  });
});
