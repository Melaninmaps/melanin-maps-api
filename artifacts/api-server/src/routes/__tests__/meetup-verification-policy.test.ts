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
  it("requires organizer consent, a planned venue, and a bounded future time", () => {
    expect(() => normalizeVerifiedMeetupRequest({
      partnerId: "partner-1",
      venue: "Community center",
      scheduledAt: SCHEDULED_AT.toISOString(),
    }, NOW)).toThrow(expect.objectContaining<Partial<MeetupPolicyError>>({
      code: "ORGANIZER_APPROVAL_REQUIRED",
      status: 403,
    }));

    expect(normalizeVerifiedMeetupRequest({
      partnerId: "partner-1",
      venue: " Community center   room 2 ",
      scheduledAt: SCHEDULED_AT.toISOString(),
      organizerApproval: true,
    }, NOW)).toMatchObject({
      partnerId: "partner-1",
      venue: "Community center room 2",
      scheduledAt: SCHEDULED_AT,
    });

    expect(() => normalizeVerifiedMeetupRequest({
      partnerId: "partner-1",
      venue: "my current home",
      scheduledAt: SCHEDULED_AT.toISOString(),
      organizerApproval: true,
    }, NOW)).toThrow(expect.objectContaining<Partial<MeetupPolicyError>>({ code: "MEETUP_VENUE_NOT_ALLOWED" }));

    expect(() => normalizeVerifiedMeetupRequest({
      partnerId: "partner-1",
      venue: "33.7490, -84.3880",
      scheduledAt: SCHEDULED_AT.toISOString(),
      organizerApproval: true,
    }, NOW)).toThrow(expect.objectContaining<Partial<MeetupPolicyError>>({ code: "MEETUP_VENUE_NOT_ALLOWED" }));

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

  it("does not expose a venue or time after its time window expires", () => {
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

  it("returns a planned venue only to a participant while keeping storage, notes, watchers, and safety claims private", () => {
    const response = toPrivacyMinimizedMeetup(record(), "partner-1", NOW) as Record<string, unknown>;
    expect(response).toMatchObject({
      role: "partner",
      counterpartName: "Ari Organizer",
      venue: "Community center room 2",
      status: "awaiting_partner",
    });
    for (const prohibitedKey of [
      "initiatorId", "partnerId", "location", "note", "clearCode", "safetyWatcherEmail", "safetyWatcherId", "safetyFriendEmail",
    ]) {
      expect(response).not.toHaveProperty(prohibitedKey);
    }
    expect(JSON.stringify(response)).not.toMatch(/guarantee|live.?location|coordinates/i);
  });
});
